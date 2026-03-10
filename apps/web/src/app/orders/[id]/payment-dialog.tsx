"use client";

import React, { useState } from 'react';
import { useI18n } from '@/i18n/provider';
import api from '@/lib/api';
import { X, Loader2, CreditCard, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PaymentItem {
    payment_type: string;
    paid_amount: number;
    currency: string;
}

interface PaymentDialogProps {
    orderId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export const PaymentDialog: React.FC<PaymentDialogProps> = ({ orderId, onClose, onSuccess }) => {
    const { t } = useI18n();
    const [isSplitMode, setIsSplitMode] = useState(false);
    const [payments, setPayments] = useState<PaymentItem[]>([
        { payment_type: 'CASH', paid_amount: 0, currency: 'UZS' }
    ]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const addPaymentRow = () => {
        setPayments([...payments, { payment_type: 'UZCARD', paid_amount: 0, currency: 'UZS' }]);
    };

    const removePaymentRow = (index: number) => {
        if (payments.length > 1) {
            setPayments(payments.filter((_, i) => i !== index));
        }
    };

    const updatePayment = (index: number, field: keyof PaymentItem, value: string | number) => {
        const updated = [...payments];
        updated[index] = { ...updated[index], [field]: value };
        setPayments(updated);
    };

    const totalAmount = payments.reduce((sum, p) => sum + (Number(p.paid_amount) || 0), 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        // Validate amounts
        for (const payment of payments) {
            if (!payment.paid_amount || payment.paid_amount <= 0) {
                setError('All payment amounts must be greater than 0');
                setIsSubmitting(false);
                return;
            }
        }

        try {
            const payload = isSplitMode 
                ? { split_payments: payments }
                : { ...payments[0] };

            await api.post(`/orders/${orderId}/payments`, payload);
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to record payment');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg glass-card p-8 shadow-2xl ring-1 ring-white/10"
            >
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-bold italic tracking-wider flex items-center gap-3">
                        <CreditCard className="text-primary" />
                        {t('payment.add_title').toUpperCase()}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Split mode toggle */}
                    <div className="flex items-center gap-4 mb-4">
                        <label className="text-sm font-bold text-foreground/60">Режим оплаты:</label>
                        <button
                            type="button"
                            onClick={() => {
                                setIsSplitMode(!isSplitMode);
                                if (!isSplitMode && payments.length === 1) {
                                    setPayments([...payments, { payment_type: 'UZCARD', paid_amount: 0, currency: 'UZS' }]);
                                }
                            }}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                isSplitMode 
                                    ? 'bg-primary text-white' 
                                    : 'bg-white/5 text-foreground hover:bg-white/10'
                            }`}
                        >
                            {isSplitMode ? 'Разделённая' : 'Обычная'}
                        </button>
                    </div>

                    {/* Payment rows */}
                    <div className="space-y-4">
                        {payments.map((payment, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-end gap-3 p-4 bg-white/5 rounded-xl border border-white/10"
                            >
                                <div className="flex-1 space-y-2">
                                    <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest ml-1">
                                        {index === 0 ? t('payment.amount') : 'Сумма'}
                                    </label>
                                    <input
                                        required
                                        type="number"
                                        min="1"
                                        value={payment.paid_amount || ''}
                                        onChange={(e) => updatePayment(index, 'paid_amount', Number(e.target.value))}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-lg font-bold outline-none focus:border-primary/50 transition-colors"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest ml-1">
                                        Тип
                                    </label>
                                    <select
                                        value={payment.payment_type}
                                        onChange={(e) => updatePayment(index, 'payment_type', e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-3 text-sm font-bold outline-none focus:border-primary/50 transition-colors"
                                    >
                                        <option value="CASH" className="bg-[#0a0a0c]">CASH</option>
                                        <option value="UZCARD" className="bg-[#0a0a0c]">UZCARD</option>
                                        <option value="HUMO" className="bg-[#0a0a0c]">HUMO</option>
                                        <option value="CLICK" className="bg-[#0a0a0c]">CLICK</option>
                                        <option value="PAYME" className="bg-[#0a0a0c]">PAYME</option>
                                        <option value="VISA" className="bg-[#0a0a0c]">VISA</option>
                                    </select>
                                </div>
                                {payments.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removePaymentRow(index)}
                                        className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                )}
                            </motion.div>
                        ))}
                    </div>

                    {/* Add payment button */}
                    {isSplitMode && (
                        <button
                            type="button"
                            onClick={addPaymentRow}
                            className="w-full py-3 rounded-xl border-2 border-dashed border-white/20 text-foreground/60 font-bold hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center gap-2"
                        >
                            <Plus size={20} />
                            Добавить способ оплаты
                        </button>
                    )}

                    {/* Total amount display */}
                    {isSplitMode && totalAmount > 0 && (
                        <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl">
                            <div className="text-xs font-bold text-primary/60 uppercase tracking-widest mb-1">
                                Итого к оплате:
                            </div>
                            <div className="text-2xl font-black text-primary">
                                {totalAmount.toLocaleString('ru-RU')} UZS
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting || payments.some(p => !p.paid_amount || p.paid_amount <= 0)}
                        className="w-full py-4 rounded-xl bg-primary text-white font-black italic tracking-widest hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : t('payment.submit').toUpperCase()}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};
