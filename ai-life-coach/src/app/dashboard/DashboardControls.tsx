/** UI Component: DashboardControls.tsx - Giao diện đồ họa người dùng. */
'use client'

import { useState } from 'react';
import { RefreshCw, BrainCircuit, Sparkles } from 'lucide-react';
import { regenerateRoadmap } from './actions';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardControls({ hasTasks = true }: { hasTasks?: boolean }) {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [autoAnalysis, setAutoAnalysis] = useState(false);
    const [coachNote, setCoachNote] = useState<string | null>(null);

    const handleRefresh = async () => {
        if (!hasTasks) {
            setCoachNote('Bạn chưa có công việc nào để AI phân tích!');
            setTimeout(() => setCoachNote(null), 5000);
            return;
        }
        if (isRefreshing) return;
        setIsRefreshing(true);
        setCoachNote(null);

        try {
            const result = await regenerateRoadmap();
            if (result?.coachNote) {
                setCoachNote(result.coachNote);
                setTimeout(() => setCoachNote(null), 8000);
            }
        } catch (err: any) {
            console.error('Lỗi AI:', err);
            setCoachNote('Không thể kết nối AI. Thử lại sau nhé!');
            setTimeout(() => setCoachNote(null), 5000);
        } finally {
            setIsRefreshing(false);
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-end gap-3 flex-wrap">

                <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="group flex items-center gap-2 px-4 py-2 rounded-full liquid-glass-btn text-white/60 hover:text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <RefreshCw className={`w-4 h-4 transition-transform duration-700 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-90'}`} />
                    <span className="hidden sm:inline">{isRefreshing ? 'AI đang phân tích...' : 'AI Làm mới'}</span>
                    {isRefreshing && (
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                    )}
                </button>


                <button
                    onClick={() => {
                        if (!hasTasks) {
                            setCoachNote('Bạn chưa có công việc nào để AI tự động phân tích!');
                            setTimeout(() => setCoachNote(null), 5000);
                            return;
                        }
                        setAutoAnalysis(!autoAnalysis);
                    }}
                    className={`relative group flex items-center gap-2.5 px-4 py-2 rounded-full text-sm font-medium liquid-glass-btn ${autoAnalysis
                        ? 'ring-1 ring-indigo-500/50 text-indigo-300'
                        : 'text-white/50 hover:text-white/70'
                        }`}
                >
                    <BrainCircuit className={`w-4 h-4 transition-colors ${autoAnalysis ? 'text-indigo-400' : 'text-white/40 group-hover:text-white/60'}`} />
                    <span className="hidden sm:inline">AI 4:00 AM</span>


                    <div className={`relative w-9 h-5 rounded-full transition-colors duration-300 ${autoAnalysis ? 'bg-indigo-500' : 'bg-white/15'}`}>
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full shadow-md transition-all duration-300 ${autoAnalysis
                            ? 'left-[18px] bg-white shadow-indigo-500/30'
                            : 'left-0.5 bg-white/70'
                            }`} />
                    </div>


                    <div className="absolute bottom-full right-0 mb-3 w-64 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0 z-50">
                        <div className="bg-[#1e1e24] border border-white/10 shadow-2xl rounded-2xl p-4 relative">
                            <p className="text-xs text-white/70 font-normal leading-relaxed text-left normal-case">
                                Khi được bật, AI sẽ tự động lấy dữ liệu chấm điểm năng lượng của bạn để <span className="text-indigo-300 font-semibold">Tự động cấu trúc lại Lộ trình</span> vào lúc 4:00 sáng mỗi ngày, giúp lộ trình luôn mới khi bạn thức dậy.
                            </p>

                            <div className="absolute -bottom-2 right-8 w-4 h-4 bg-[#1e1e24] border-b border-r border-white/10 rotate-45 transform"></div>
                        </div>
                    </div>
                </button>
            </div>


            <AnimatePresence>
                {coachNote && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="flex items-start gap-3 liquid-glass rounded-2xl px-4 py-3"
                    >
                        <Sparkles className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                        <p className="text-sm text-indigo-200/90 leading-relaxed">{coachNote}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
