import { Injectable, UnauthorizedException, ConflictException, Inject, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { createHash, randomBytes } from 'crypto';
import { UserEntity, ClientEntity, RoleEntity } from '../../database/entities';
import { TLoginDto, TRegisterDto } from '@hdd-fixer/shared';
import { createLogger } from '../../common/logger/pino.logger';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AuthService {
    private readonly logger = createLogger('AuthService');

    constructor(
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>,
        @InjectRepository(ClientEntity)
        private readonly clientRepo: Repository<ClientEntity>,
        @InjectRepository(RoleEntity)
        private readonly roleRepo: Repository<RoleEntity>,
        @Inject(ConfigService) private readonly config: ConfigService,
        private readonly notificationsService: NotificationsService,
    ) { }

    async register(dto: TRegisterDto) {
        const existingUser = await this.userRepo.findOne({
            where: [{ phone: dto.phone }, ...(dto.email ? [{ email: dto.email }] : [])],
        });
        if (existingUser) {
            throw new ConflictException('User already exists');
        }

        const clientRole = await this.roleRepo.findOne({
            where: { name_eng: 'client' },
        });

        if (!clientRole) {
            this.logger.error('Client role missing during registration');
            throw new Error('Client role not found');
        }

        const passwordHash = await bcrypt.hash(dto.password, 10);
        const user = this.userRepo.create({
            full_name: dto.full_name,
            phone: dto.phone,
            email: dto.email || null,
            telegram: dto.telegram?.trim() || null,
            password_hash: passwordHash,
            role_id: clientRole.id,
            preferred_language: dto.preferred_language || 'ru',
        });

        await this.userRepo.save(user);

        const client = this.clientRepo.create({
            user_id: user.id,
            full_name: dto.full_name,
            phone: dto.phone,
            telegram: dto.telegram?.trim() || null,
            email: dto.email || null,
            preferred_language: dto.preferred_language || 'ru',
        });
        await this.clientRepo.save(client);

        const tokens = this.generateTokens(user.id, clientRole.id, 'client');

        return {
            ...tokens,
            user: {
                id: user.id,
                full_name: user.full_name,
                role: 'client',
                avatar_url: user.avatar_url,
            },
        };
    }

    async login(dto: TLoginDto) {
        this.logger.log('Login attempt', { login: dto.login });

        // Find user by phone or email
        const user = await this.userRepo.findOne({
            where: [{ phone: dto.login }, { email: dto.login }],
            relations: ['role'],
        });

        if (!user || !user.password_hash) {
            this.logger.warn('Login failed - user not found', { login: dto.login });
            throw new UnauthorizedException('Invalid credentials');
        }

        const isValid = await bcrypt.compare(dto.password, user.password_hash);
        if (!isValid) {
            this.logger.warn('Login failed - invalid password', { login: dto.login });
            throw new UnauthorizedException('Invalid credentials');
        }

        this.logger.log('Login successful', { userId: user.id, login: dto.login });

        const roleName = user.role.name_eng.toLowerCase();
        const tokens = this.generateTokens(user.id, user.role_id, roleName);

        return {
            ...tokens,
            user: {
                id: user.id,
                full_name: user.full_name,
                role: roleName,
                avatar_url: user.avatar_url,
            },
        };
    }

    async refreshToken(refreshToken: string) {
        try {
            const secret = this.config.get<string>('JWT_REFRESH_SECRET');
            const payload = jwt.verify(refreshToken, secret!) as {
                sub: string;
                role: string;
                roleName: string;
            };

            const user = await this.userRepo.findOne({
                where: { id: payload.sub },
                relations: ['role'],
            });

            if (!user) {
                throw new UnauthorizedException('User not found');
            }

            const roleName = user.role.name_eng.toLowerCase();
            return this.generateTokens(user.id, user.role_id, roleName);
        } catch {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    async forgotPassword(login: string) {
        const normalizedLogin = (login || '').trim();
        if (!normalizedLogin) {
            throw new BadRequestException('Login is required');
        }

        const user = await this.userRepo.findOne({
            where: [{ phone: normalizedLogin }, { email: normalizedLogin }],
        });

        // Always return success to prevent account enumeration.
        if (!user) {
            return { success: true, message: 'If the account exists, reset instructions have been sent.' };
        }

        const rawToken = randomBytes(32).toString('hex');
        const tokenHash = this.hashResetToken(rawToken);
        const expiresMinutes = Number(this.config.get<string>('PASSWORD_RESET_EXPIRES_MINUTES', '30'));
        const expiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000);

        user.password_reset_token_hash = tokenHash;
        user.password_reset_expires_at = expiresAt;
        await this.userRepo.save(user);

        const webUrl = this.config.get<string>('WEB_URL', 'http://localhost:3003');
        const resetLink = `${webUrl}/login?reset_token=${rawToken}`;
        const subject = 'Сброс пароля Recovery.uz';
        const message = `Для сброса пароля перейдите по ссылке: ${resetLink}\nСсылка действует ${expiresMinutes} минут.`;

        try {
            if (user.email) {
                await this.notificationsService.sendEmail(user.email, subject, message, {
                    template: 'password-reset',
                    data: { resetLink, expiresMinutes },
                });
            } else if (user.phone) {
                await this.notificationsService.sendSMS(
                    user.phone,
                    `Recovery.uz: код сброса пароля ${rawToken}. Действует ${expiresMinutes} мин.`,
                );
            }
        } catch (error) {
            this.logger.error('Failed to send forgot password notification', { userId: user.id, error });
        }

        const result: Record<string, unknown> = {
            success: true,
            message: 'If the account exists, reset instructions have been sent.',
        };

        if (this.config.get('NODE_ENV') !== 'production') {
            result.debug_reset_token = rawToken;
        }

        return result;
    }

    async resetPassword(token: string, newPassword: string) {
        const rawToken = (token || '').trim();
        if (!rawToken) {
            throw new BadRequestException('Reset token is required');
        }

        const tokenHash = this.hashResetToken(rawToken);
        const user = await this.userRepo.findOne({
            where: { password_reset_token_hash: tokenHash },
        });

        if (!user || !user.password_reset_expires_at || user.password_reset_expires_at.getTime() < Date.now()) {
            throw new UnauthorizedException('Invalid or expired reset token');
        }

        user.password_hash = await bcrypt.hash(newPassword, 10);
        user.password_reset_token_hash = null;
        user.password_reset_expires_at = null;
        await this.userRepo.save(user);

        return { success: true, message: 'Пароль успешно сброшен. Теперь вы можете войти.' };
    }

    private hashResetToken(token: string): string {
        return createHash('sha256').update(token).digest('hex');
    }

    private generateTokens(userId: string, roleId: string, roleName: string) {
        const jwtSecret = this.config.get<string>('JWT_SECRET')!;
        const jwtRefreshSecret = this.config.get<string>('JWT_REFRESH_SECRET')!;
        const expiresIn = this.config.get<string>('JWT_EXPIRES_IN', '15m');
        const refreshExpiresIn = this.config.get<string>(
            'JWT_REFRESH_EXPIRES_IN',
            '7d',
        );

        const payload = { sub: userId, role: roleId, roleName };

        const access_token = jwt.sign(payload, jwtSecret, {
            expiresIn,
        });

        const refresh_token = jwt.sign(payload, jwtRefreshSecret, {
            expiresIn: refreshExpiresIn,
        });

        return { access_token, refresh_token };
    }

    getCookieOptions() {
        const isProduction = this.config.get('NODE_ENV') === 'production';
        const webUrl = this.config.get('WEB_URL', 'http://localhost:3000');

        return {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax' as const,
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            domain: isProduction ? new URL(webUrl).hostname : undefined,
        };
    }

    getAccessTokenCookieOptions() {
        const isProduction = this.config.get('NODE_ENV') === 'production';

        return {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax' as const,
            path: '/',
            maxAge: 15 * 60 * 1000, // 15 minutes
        };
    }
}
