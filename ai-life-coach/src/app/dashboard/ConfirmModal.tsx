/** UI Component: Modal xác nhận thao tác rủi ro cao (Xóa/Hủy). */
'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
    variant?: 'danger' | 'warning';
}

export default function ConfirmModal({
    isOpen,
    title = 'Xác nhận',
    message,
    confirmLabel = 'Xóa',
    cancelLabel = 'Quay lại',
    onConfirm,
    onCancel,
    isLoading = false,
    variant = 'danger',
}: ConfirmModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={onCancel}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        className="relative w-full max-w-sm bg-[#1e1e24] border border-white/10 rounded-3xl p-6 shadow-2xl z-10"
                    >
                        <button
                            onClick={onCancel}
                            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/5 transition-colors"
                        >
                            <X className="w-4 h-4 text-white/40" />
                        </button>

                        <div className="flex flex-col items-center text-center">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${variant === 'danger' ? 'bg-rose-500/15' : 'bg-amber-500/15'}`}>
                                <AlertTriangle className={`w-7 h-7 ${variant === 'danger' ? 'text-rose-400' : 'text-amber-400'}`} />
                            </div>

                            <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                            <p className="text-sm text-white/60 leading-relaxed whitespace-pre-line mb-6">{message}</p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={onCancel}
                                className="flex-1 py-3 px-4 rounded-2xl font-bold text-sm bg-white text-neutral-900 hover:bg-white/90 transition-all active:scale-95 shadow-lg"
                            >
                                {cancelLabel}
                            </button>

                            <button
                                onClick={onConfirm}
                                disabled={isLoading}
                                className={`flex-shrink-0 py-3 px-4 rounded-2xl font-medium text-sm border transition-all active:scale-95 disabled:opacity-50 ${variant === 'danger'
                                    ? 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10'
                                    : 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10'
                                    }`}
                            >
                                {isLoading ? (
                                    <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin mx-auto" />
                                ) : (
                                    confirmLabel
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
