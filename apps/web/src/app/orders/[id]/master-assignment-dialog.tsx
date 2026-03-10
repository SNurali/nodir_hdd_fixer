"use client";

import React, { useState } from 'react';
import { useI18n } from '@/i18n/provider';
import api from '@/lib/api';
import useSWR from 'swr';
import { X, Loader2, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const fetcher = (url: string) => api.get(url).then(res => res.data);

interface MasterAssignmentDialogProps {
    orderId: string;
    detailId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export const MasterAssignmentDialog: React.FC<MasterAssignmentDialogProps> = ({ orderId, detailId, onClose, onSuccess }) => {
    const { t } = useI18n();
    const { data: masters, isLoading } = useSWR('/users/masters', fetcher);
    const [selectedMasterId, setSelectedMasterId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMasterId) return;

        setIsSubmitting(true);
        setError('');

        try {
            await api.post(`/orders/${orderId}/details/${detailId}/assign`, {
                master_id: selectedMasterId
            });
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to assign master');
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
                className="relative w-full max-w-md glass-card p-8 shadow-2xl ring-1 ring-white/10"
            >
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-bold italic tracking-wider flex items-center gap-3">
                        <UserPlus className="text-primary" />
                        ASSIGN MASTER
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
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest ml-1">Select Master</label>
                        <select
                            required
                            value={selectedMasterId}
                            onChange={(e) => setSelectedMasterId(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-sm font-bold outline-none focus:border-primary/50 transition-colors"
                        >
                            <option value="" className="bg-[#0a0a0c]">Select a technician</option>
                            {masters?.map((m: any) => (
                                <option key={m.id} value={m.id} className="bg-[#0a0a0c]">{m.full_name}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting || !selectedMasterId || isLoading}
                        className="w-full py-4 rounded-xl bg-primary text-white font-black italic tracking-widest hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : 'CONFIRM ASSIGNMENT'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};
