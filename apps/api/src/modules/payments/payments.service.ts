import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PaymentEntity, OrderEntity, UserEntity, NotificationEntity, ClientEntity } from '../../database/entities';
import { ConfigService } from '@nestjs/config';
import { TelegramService } from '../telegram/telegram.service';
import * as crypto from 'crypto';

export type PaymentProvider = 'click' | 'payme' | 'uzumbank' | 'cash' | 'card' | 'free' | 'paynet' | 'uzum';

@Injectable()
export class PaymentsService {
    private readonly logger = new Logger(PaymentsService.name);

    // Click credentials
    private clickMerchantId: string;
    private clickSecretKey: string;

    // Payme credentials
    private paymeMerchantId: string;
    private paymeSecretKey: string;

    constructor(
        @InjectRepository(PaymentEntity)
        private readonly paymentRepo: Repository<PaymentEntity>,
        @InjectRepository(OrderEntity)
        private readonly orderRepo: Repository<OrderEntity>,
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>,
        @InjectRepository(ClientEntity)
        private readonly clientRepo: Repository<ClientEntity>,
        @InjectRepository(NotificationEntity)
        private readonly notifRepo: Repository<NotificationEntity>,
        @InjectQueue('notifications')
        private readonly notifQueue: Queue,
        private readonly dataSource: DataSource,
        private readonly configService: ConfigService,
        private readonly telegramService: TelegramService,
    ) {
        this.clickMerchantId = this.configService.get('CLICK_MERCHANT_ID') || '';
        this.clickSecretKey = this.configService.get('CLICK_SECRET_KEY') || '';
        this.paymeMerchantId = this.configService.get('PAYME_MERCHANT_ID') || '';
        this.paymeSecretKey = this.configService.get('PAYME_SECRET_KEY') || '';
    }

    async create(orderId: string, dto: any, cashierId: string | null) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const order = await queryRunner.manager.findOne(OrderEntity, {
                where: { id: orderId },
                lock: { mode: 'pessimistic_write' },
            });

            if (!order) throw new NotFoundException('Order not found');

            if (order.status === 'issued' || order.status === 'rejected') {
                throw new BadRequestException('Cannot add payment to a closed order');
            }

            // Handle split payments
            let paymentsToCreate: any[] = [];
            
            if (dto.split_payments && dto.split_payments.length > 0) {
                // Split payment mode - create multiple payment records
                for (const split of dto.split_payments) {
                    if (split.paid_amount <= 0) {
                        throw new BadRequestException('Invalid payment amount in split payment');
                    }
                    paymentsToCreate.push({
                        order_id: orderId,
                        payment_type: split.payment_type,
                        paid_amount: split.paid_amount,
                        currency: split.currency || 'UZS',
                        cashier_by: cashierId,
                    });
                }
            } else {
                // Single payment mode (backward compatibility)
                if (!dto.payment_type || !dto.paid_amount) {
                    throw new BadRequestException('payment_type and paid_amount are required when not using split_payments');
                }

                if (dto.paid_amount <= 0) {
                    throw new BadRequestException('Invalid payment amount');
                }

                paymentsToCreate.push({
                    order_id: orderId,
                    payment_type: dto.payment_type,
                    paid_amount: dto.paid_amount,
                    currency: dto.currency || 'UZS',
                    cashier_by: cashierId,
                });
            }

            // Create all payments
            const savedPayments: PaymentEntity[] = [];
            for (const paymentData of paymentsToCreate) {
                const payment = queryRunner.manager.create(PaymentEntity, paymentData);
                const saved = await queryRunner.manager.save(payment);
                savedPayments.push(saved);

                // Update order totals
                if (paymentData.currency === 'USD') {
                    order.total_paid_usd = Number(order.total_paid_usd) + paymentData.paid_amount;
                } else if (paymentData.currency === 'EUR') {
                    order.total_paid_eur = Number(order.total_paid_eur) + paymentData.paid_amount;
                } else {
                    order.total_paid_uzs = Number(order.total_paid_uzs) + paymentData.paid_amount;
                }
            }

            await queryRunner.manager.save(order);

            // Notify admins about payment
            const admins = await queryRunner.manager.findBy(UserEntity, { role: { name_eng: 'admin' } });
            for (const admin of admins) {
                const notif = queryRunner.manager.create(NotificationEntity, {
                    user_id: admin.id,
                    order_id: orderId,
                    channel: 'in_app',
                    template_key: 'payment_received',
                    language: order.language,
                    payload: { 
                        amount: savedPayments.reduce((sum, p) => sum + p.paid_amount, 0),
                        currency: savedPayments[0]?.currency || 'UZS',
                        split_count: savedPayments.length
                    },
                    status: 'sent',
                    is_read: false,
                    sent_at: new Date(),
                });
                await queryRunner.manager.save(notif);
            }

            await queryRunner.commitTransaction();

            // Notify Telegram group about payment
            const totalAmount = savedPayments.reduce((sum, p) => sum + p.paid_amount, 0);
            const currency = savedPayments[0]?.currency || 'UZS';
            await this.telegramService.notifyPaymentReceived(orderId, totalAmount, currency);

            this.logger.log(`Payment(s) created: ${savedPayments.map(p => p.id).join(', ')} for order ${orderId}`);
            return savedPayments.length === 1 ? savedPayments[0] : savedPayments;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error(`Payment creation failed: ${error.message}`);
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async update(paymentId: string, dto: any, _userId: string | null) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const payment = await queryRunner.manager.findOne(PaymentEntity, {
                where: { id: paymentId },
                lock: { mode: 'pessimistic_write' },
            });
            if (!payment) throw new NotFoundException('Payment not found');

            const order = await queryRunner.manager.findOne(OrderEntity, {
                where: { id: payment.order_id },
                lock: { mode: 'pessimistic_write' },
            });
            if (!order) throw new NotFoundException('Order not found');

            const oldCurrency = payment.currency || 'UZS';
            const oldAmount = Number(payment.paid_amount || 0);
            const nextCurrency = dto.currency || oldCurrency;
            const nextAmount = Number(dto.paid_amount || 0);

            if (!nextAmount || nextAmount <= 0) {
                throw new BadRequestException('Invalid payment amount');
            }

            const currentPaidUZS = Number(order.total_paid_uzs || 0);
            const oldPartUZS = oldCurrency === 'UZS' ? oldAmount : 0;
            const newPartUZS = nextCurrency === 'UZS' ? nextAmount : 0;
            const nextPaidUZS = currentPaidUZS - oldPartUZS + newPartUZS;

            if (nextPaidUZS < 0) {
                throw new BadRequestException('Invalid payment update: resulting paid amount is negative');
            }

            const totalPriceUZS = Number(order.total_price_uzs || 0);
            if (nextCurrency === 'UZS' && totalPriceUZS > 0 && nextPaidUZS > totalPriceUZS) {
                const extra = nextPaidUZS - totalPriceUZS;
                throw new BadRequestException(
                    `Payment exceeds order total by ${extra.toFixed(2)} UZS`,
                );
            }

            // Recalculate totals with currency shift support.
            if (oldCurrency === 'USD') {
                order.total_paid_usd = Math.max(0, Number(order.total_paid_usd || 0) - oldAmount);
            } else if (oldCurrency === 'EUR') {
                order.total_paid_eur = Math.max(0, Number(order.total_paid_eur || 0) - oldAmount);
            } else {
                order.total_paid_uzs = Math.max(0, Number(order.total_paid_uzs || 0) - oldAmount);
            }

            if (nextCurrency === 'USD') {
                order.total_paid_usd = Number(order.total_paid_usd || 0) + nextAmount;
            } else if (nextCurrency === 'EUR') {
                order.total_paid_eur = Number(order.total_paid_eur || 0) + nextAmount;
            } else {
                order.total_paid_uzs = Number(order.total_paid_uzs || 0) + nextAmount;
            }

            payment.paid_amount = nextAmount;
            payment.currency = nextCurrency;
            payment.payment_type = dto.payment_type || payment.payment_type;

            const updatedPayment = await queryRunner.manager.save(payment);
            await queryRunner.manager.save(order);

            await queryRunner.commitTransaction();
            this.logger.log(`Payment updated: ${paymentId}`);
            return updatedPayment;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error(`Payment update failed: ${error.message}`);
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async findByOrder(orderId: string, user: any) {
        const order = await this.orderRepo.findOne({ where: { id: orderId } });
        if (!order) throw new NotFoundException('Order not found');

        if (user.role_name === 'client') {
            const client = await this.clientRepo.findOne({ where: { user_id: user.id } });
            if (!client || order.client_id !== client.id) {
                throw new BadRequestException('Access denied');
            }
        }

        return this.paymentRepo.find({
            where: { order_id: orderId },
            relations: ['cashier'],
            order: { paid_at: 'DESC' },
        });
    }

    async getTotalPaid(orderId: string): Promise<number> {
        const result = await this.paymentRepo
            .createQueryBuilder('payment')
            .select('SUM(payment.paid_amount)', 'total')
            .where('payment.order_id = :orderId', { orderId })
            .getRawOne();

        return Number(result?.total || 0);
    }

    async refund(paymentId: string, _userId: string | null, _reason: string) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const payment = await queryRunner.manager.findOne(PaymentEntity, {
                where: { id: paymentId },
                lock: { mode: 'pessimistic_write' },
            });

            if (!payment) throw new NotFoundException('Payment not found');

            const order = await queryRunner.manager.findOne(OrderEntity, {
                where: { id: payment.order_id },
            });

            if (order) {
                if (payment.currency === 'USD') {
                    order.total_paid_usd = Math.max(0, Number(order.total_paid_usd) - payment.paid_amount);
                } else if (payment.currency === 'EUR') {
                    order.total_paid_eur = Math.max(0, Number(order.total_paid_eur) - payment.paid_amount);
                } else {
                    order.total_paid_uzs = Math.max(0, Number(order.total_paid_uzs) - payment.paid_amount);
                }
                await queryRunner.manager.save(order);
            }

            await queryRunner.manager.delete(PaymentEntity, paymentId);

            await queryRunner.commitTransaction();
            this.logger.log(`Payment refunded: ${paymentId}`);

            return { success: true };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error(`Payment refund failed: ${error.message}`);
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    // ============================================
    // CLICK PAYMENT INTEGRATION
    // ============================================

    async createClickPayment(orderId: string, amount: number) {
        const order = await this.orderRepo.findOne({ where: { id: orderId } });
        if (!order) throw new NotFoundException('Order not found');

        const transactionId = `CLICK_${orderId}_${Date.now()}`;

        const params: any = {
            merchant_id: this.clickMerchantId,
            service_id: '0',
            amount: String(amount / 100),
            transaction_param: transactionId,
            return_url: `${process.env.FRONTEND_URL}/orders/${orderId}`,
        };

        const signatureString = `${params.merchant_id}${params.service_id}${params.amount}${params.transaction_param}${this.clickSecretKey}`;
        params.sign = crypto.createHash('sha256').update(signatureString).digest('hex');

        return {
            url: `https://my.click.uz/payments?${new URLSearchParams(params).toString()}`,
            transaction_id: transactionId,
        };
    }

    async handleClickWebhook(data: any) {
        this.logger.log(`Click webhook received: ${JSON.stringify(data)}`);

        const signatureString = `${data.merchant_id}${data.service_id}${data.amount}${data.transaction_param}${data.sign_time}${this.clickSecretKey}`;
        const expectedSign = crypto.createHash('sha256').update(signatureString).digest('hex');

        if (data.sign !== expectedSign) {
            throw new BadRequestException('Invalid Click signature');
        }

        if (data.status === '1') {
            const transactionId = data.transaction_param;
            const orderId = transactionId.split('_')[1];
            const amount = Math.round(data.amount * 100);
            const externalTxnId = data.click_trans_id || data.transaction_param;
            const systemUserId = await this.getSystemUserId();

            // Use a transaction to ensure atomicity and handle duplicates
            const queryRunner = this.dataSource.createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction();

            try {
                // Check if payment with this external transaction ID already exists
                const existingPayment = await queryRunner.manager.findOne(PaymentEntity, {
                    where: {
                        external_txn_id: externalTxnId,
                        provider: 'click',
                    }
                });

                if (existingPayment) {
                    // Payment already processed, return success to acknowledge
                    await queryRunner.rollbackTransaction();
                    this.logger.log(`Duplicate Click payment detected: ${externalTxnId}, returning success`);
                    return { status: 1 };
                }

                // Create the payment with external_txn_id and provider in one query
                const payment = queryRunner.manager.create(PaymentEntity, {
                    order_id: orderId,
                    payment_type: 'CLICK',
                    paid_amount: amount,
                    currency: 'UZS',
                    cashier_by: systemUserId,
                    external_txn_id: externalTxnId,
                    provider: 'click',
                });

                await queryRunner.manager.save(payment);
                
                // Update order total paid amount
                const order = await queryRunner.manager.findOne(OrderEntity, { where: { id: orderId } });
                if (order) {
                    order.total_paid_uzs = Number(order.total_paid_uzs) + amount;
                    await queryRunner.manager.save(order);
                }

                await queryRunner.commitTransaction();
                
                return { status: 1 };
            } catch (error) {
                await queryRunner.rollbackTransaction();
                // If there's a unique constraint violation, return success (idempotent behavior)
                if (error.code === '23505' || String(error.message).includes('duplicate key')) {
                    this.logger.log(`Duplicate Click payment detected: ${externalTxnId}, returning success`);
                    return { status: 1 };
                }
                // Re-throw other errors
                throw error;
            } finally {
                await queryRunner.release();
            }
        }

        return { status: 0 };
    }

    // ============================================
    // PAYME PAYMENT INTEGRATION
    // ============================================

    async createPaymePayment(orderId: string, amount: number) {
        const order = await this.orderRepo.findOne({ where: { id: orderId } });
        if (!order) throw new NotFoundException('Order not found');

        const transactionId = `PAYME_${orderId}_${Date.now()}`;
        const amountInTiyins = amount * 100;

        const params = {
            m: this.paymeMerchantId,
            ac: { order_id: orderId },
            a: amountInTiyins,
            t: transactionId,
            lang: 'ru',
            callback: `${process.env.API_URL}/payments/payme/callback`,
        };

        return {
            url: `https://checkout.paycom.uz/${Buffer.from(JSON.stringify(params)).toString('base64')}`,
            transaction_id: transactionId,
        };
    }

    async handlePaymeCallback(method: string, params: any, headers?: any) {
        this.logger.log(`Payme callback: ${method}`);

        // Verify Payme signature for sensitive operations
        if (method === 'PerformTransaction' || method === 'CancelTransaction') {
            const isValid = this.verifyPaymeSignatureWithHeaders(params, headers || {});
            if (!isValid) {
                this.logger.error('Invalid Payme signature');
                throw new BadRequestException('Invalid Payme signature');
            }
        }

        switch (method) {
            case 'CheckTransaction':
                return this.paymeCheckTransaction(params);
            case 'PerformTransaction':
                return this.paymePerformTransaction(params);
            case 'CancelTransaction':
                return this.paymeCancelTransaction(params);
            default:
                throw new BadRequestException('Unknown Payme method');
        }
    }

    private verifyPaymeSignatureWithHeaders(params: any, headers: any): boolean {
        // Get Payme merchant key for signature verification
        const merchantKey = this.paymeSecretKey;
        if (!merchantKey) {
            this.logger.error('Payme secret key not configured');
            return false;
        }

        // Basic validation to ensure required fields are present
        if (!params.id || !params.time || !params.amount || !params.account) {
            return false;
        }

        // According to Payme documentation, the signature can be in the headers
        // The format typically follows Payme's specification
        // For security, we need to verify the signature against the merchant key
        
        // This is a simplified version - in production, implement Payme's specific algorithm
        // which usually involves checking headers['authorization'] or similar
        const paymeSignature = headers?.authorization || headers?.['paycom-signature'] || headers?.['x-payme-signature'];
        
        // For now, implement basic signature validation
        // In production, you would need to implement Payme's specific signature algorithm
        // which typically involves hashing the request data with the merchant key
        
        // Basic check for presence of signature in headers
        if (!paymeSignature) {
            this.logger.warn('Payme signature not found in headers');
            return false;
        }

        // This is where you would implement the real signature verification
        // For now, return true but in production implement proper cryptographic verification
        return true; // This should be replaced with proper signature verification using headers and merchant key
    }

    private verifyPaymeSignature(params: any): boolean {
        // Legacy method kept for compatibility
        return this.verifyPaymeSignatureWithHeaders(params, {});
    }

    private async paymeCheckTransaction(_params: any) {
        const { order_id } = _params.account;
        const order = await this.orderRepo.findOne({ where: { id: order_id } });

        if (!order) {
            return { error: { code: -32401, message: 'Order not found' } };
        }

        return { result: { allow: true } };
    }

    private async getSystemUserId(): Promise<string | null> {
        const systemUser = await this.userRepo.findOne({ where: { email: 'system@hdd-fixer.uz' } });
        return systemUser?.id || null;
    }

    private async paymePerformTransaction(_params: any) {
        const { order_id } = _params.account;
        const amount = _params.amount / 100;
        const transId = _params.id; // Use Payme's transaction ID
        const systemUserId = await this.getSystemUserId();

        // Use a transaction to ensure atomicity and handle duplicates
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Check if payment with this external transaction ID already exists
            const existingPayment = await queryRunner.manager.findOne(PaymentEntity, {
                where: {
                    external_txn_id: transId,
                    provider: 'payme',
                }
            });

            if (existingPayment) {
                // Payment already processed, return success to acknowledge
                await queryRunner.rollbackTransaction();
                this.logger.log(`Duplicate Payme payment detected: ${transId}, returning success`);
                return { result: { order_id } };
            }

            // Create the payment with external_txn_id and provider in one transaction
            const payment = queryRunner.manager.create(PaymentEntity, {
                order_id: order_id,
                payment_type: 'PAYME',
                paid_amount: amount,
                currency: 'UZS',
                cashier_by: systemUserId,
                external_txn_id: transId,
                provider: 'payme',
            });

            await queryRunner.manager.save(payment);
            
            // Update order total paid amount
            const order = await queryRunner.manager.findOne(OrderEntity, { where: { id: order_id } });
            if (order) {
                order.total_paid_uzs = Number(order.total_paid_uzs) + amount;
                await queryRunner.manager.save(order);
            }

            await queryRunner.commitTransaction();
            
            return { result: { order_id } };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            // If there's a unique constraint violation, return success (idempotent behavior)
            if (error.code === '23505' || String(error.message).includes('duplicate key')) {
                this.logger.log(`Duplicate Payme payment detected: ${transId}, returning success`);
                return { result: { order_id } };
            }
            // Re-throw other errors
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    private async paymeCancelTransaction(_params: any) {
        const payment = await this.paymentRepo.findOne({ where: { /* transaction_id: params.id */ } });
        if (payment) {
            const systemUserId = await this.getSystemUserId();
            await this.refund(payment.id, systemUserId, 'Payme cancellation');
        }
        return { result: { order_id: payment?.order_id } };
    }

    // ============================================
    // STATISTICS
    // ============================================

    async getStats(startDate?: Date, endDate?: Date) {
        const query = this.paymentRepo.createQueryBuilder('payment');

        if (startDate) query.andWhere('payment.paid_at >= :startDate', { startDate });
        if (endDate) query.andWhere('payment.paid_at <= :endDate', { endDate });

        const [total, byType, byCurrency] = await Promise.all([
            query.clone().select('SUM(payment.paid_amount)', 'total').getRawOne(),
            query.clone()
                .select('payment.payment_type', 'type')
                .addSelect('SUM(payment.paid_amount)', 'total')
                .groupBy('payment.payment_type')
                .getRawMany(),
            query.clone()
                .select('payment.currency', 'currency')
                .addSelect('SUM(payment.paid_amount)', 'total')
                .groupBy('payment.currency')
                .getRawMany(),
        ]);

        return {
            total: Number(total?.total || 0),
            byType,
            byCurrency,
        };
    }

    async getDailyRevenue(days: number = 30) {
        return await this.paymentRepo
            .createQueryBuilder('payment')
            .select("DATE(payment.paid_at) as date")
            .addSelect('SUM(payment.paid_amount)', 'total')
            .where('payment.paid_at >= NOW() - INTERVAL \':days days\'', { days })
            .groupBy('DATE(payment.paid_at)')
            .orderBy('date', 'ASC')
            .getRawMany();
    }
}
