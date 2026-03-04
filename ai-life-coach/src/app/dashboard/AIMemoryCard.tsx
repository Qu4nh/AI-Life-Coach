'use client'

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ChevronDown, EyeOff, AlertTriangle } from 'lucide-react';

type Memory = {
    content: string;
    created_at: string;
};

export default function AIMemoryCard({ memories }: { memories: Memory[] }) {
    const [isOpen, setIsOpen] = useState(false);

    if (!memories || memories.length === 0) return null;

    return (
        <div className="relative group">
            {/* Tooltip */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50 w-max max-w-xs">
                <div className="bg-[#1e1e24] border border-amber-500/20 shadow-2xl rounded-lg p-2.5 text-center">
                    <p className="text-[10px] text-amber-500/80 leading-snug">
                        Dữ liệu bối cảnh ngầm của Core AI.<br />
                        User thực tế không nhìn thấy card này.
                    </p>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1e1e24] border-b border-r border-amber-500/20 rotate-45 transform"></div>
                </div>
            </div>

            <div className="bg-amber-900/10 backdrop-blur-md rounded-2xl overflow-hidden border border-dashed border-amber-500/20">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center justify-between px-5 py-3 hover:bg-amber-500/5 transition-colors"
                >
                    <div className="flex flex-col items-start gap-1">
                        <div className="flex items-center gap-2">
                            <EyeOff className="w-3.5 h-3.5 text-amber-500/70" />
                            <span className="text-xs font-mono font-medium text-amber-500/80 tracking-wide uppercase">Core Internal Memory</span>
                        </div>
                        <div className="flex items-center gap-2 opacity-50">
                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                            <span className="text-[9px] text-amber-400 font-mono tracking-wider">SHOWCASE ONLY</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-amber-500/40 bg-amber-500/10 px-2 py-0.5 rounded-sm border border-amber-500/20">{memories.length} records</span>
                        <ChevronDown className={`w-4 h-4 text-amber-500/30 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden"
                        >
                            <div className="px-5 pb-4 space-y-3 border-t border-dashed border-amber-500/10 pt-3 bg-black/20">
                                {memories.map((m, i) => {
                                    const date = new Date(m.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
                                    const cleanContent = m.content.replace(/^\[.*?\]\s*/, '');
                                    return (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -5 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="flex gap-3 items-start"
                                        >
                                            <span className="text-[9px] text-amber-500/40 font-mono mt-1 shrink-0 w-10">[{date}]</span>
                                            <p className="text-[11px] text-amber-100/60 leading-relaxed">{cleanContent}</p>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
