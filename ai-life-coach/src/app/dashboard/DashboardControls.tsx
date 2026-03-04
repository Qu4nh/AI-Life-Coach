'use client'

import { useState, useRef, useEffect } from 'react';
import { RefreshCw, BrainCircuit, Sparkles, X } from 'lucide-react';
import { regenerateRoadmap } from './actions';
import { useAIRefresh } from './AIRefreshContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardControls({ hasTasks = true }: { hasTasks?: boolean }) {
    const { isRefreshing, setIsRefreshing, setProcessingSteps, coachNote, setCoachNote, aiMeta, setAiMeta } = useAIRefresh();
    const [autoAnalysis, setAutoAnalysis] = useState(false);
    const stepTimerRef = useRef<NodeJS.Timeout | null>(null);

    const buildSteps = (meta: any) => [
        { label: `Đọc hồ sơ năng lượng gần đây (${meta.avgEnergy}/5)`, done: false },
        { label: `Phân tích ${meta.goalCount} mục tiêu song song`, done: false },
        { label: meta.memoryCount > 0 ? `Quét ${meta.memoryCount} ký ức từ phiên trước` : 'Khởi tạo bộ nhớ AI mới', done: false },
        { label: meta.hardDeadlineCount > 0 ? `Né ${meta.hardDeadlineCount} deadline cứng` : 'Kiểm tra vùng cấm lịch trình', done: false },
        { label: `Sắp xếp ${meta.pendingCount} nhiệm vụ theo nhịp sinh học`, done: false },
    ];

    const handleRefresh = async () => {
        if (!hasTasks) {
            setCoachNote('Bạn chưa có công việc nào để AI phân tích!');
            return;
        }
        if (isRefreshing) return;
        setIsRefreshing(true);
        setCoachNote(null);
        setAiMeta(null);

        setProcessingSteps([
            { label: 'Đọc hồ sơ năng lượng gần đây...', done: false },
            { label: 'Phân tích mục tiêu song song...', done: false },
            { label: 'Quét ký ức từ phiên trước...', done: false },
            { label: 'Kiểm tra vùng cấm lịch trình...', done: false },
            { label: 'Sắp xếp nhiệm vụ theo nhịp sinh học...', done: false },
        ]);

        stepTimerRef.current = setInterval(() => {
            setProcessingSteps((prev: any[]) => {
                const nextIdx = prev.findIndex((s: any) => !s.done);
                if (nextIdx === -1 || nextIdx >= prev.length - 1) return prev;
                const updated = [...prev];
                updated[nextIdx] = { ...updated[nextIdx], done: true };
                return updated;
            });
        }, 1800);

        try {
            const result = await regenerateRoadmap();
            if (stepTimerRef.current) clearInterval(stepTimerRef.current);

            if (result?.meta) {
                setAiMeta(result.meta);
                setProcessingSteps(buildSteps(result.meta).map(s => ({ ...s, done: true })));
            } else {
                setProcessingSteps((prev: any[]) => prev.map((s: any) => ({ ...s, done: true })));
            }

            if (result?.coachNote) setCoachNote(result.coachNote);
            setTimeout(() => setIsRefreshing(false), 1200);
        } catch (err: any) {
            if (stepTimerRef.current) clearInterval(stepTimerRef.current);
            setCoachNote('Không thể kết nối AI. Thử lại sau nhé!');
            setIsRefreshing(false);
        }
    };

    useEffect(() => () => { if (stepTimerRef.current) clearInterval(stepTimerRef.current); }, []);

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
                            return;
                        }
                        setAutoAnalysis(!autoAnalysis);
                    }}
                    className={`relative group flex items-center gap-2.5 px-4 py-2 rounded-full text-sm font-medium liquid-glass-btn ${autoAnalysis ? 'ring-1 ring-indigo-500/50 text-indigo-300' : 'text-white/50 hover:text-white/70'}`}
                >
                    <BrainCircuit className={`w-4 h-4 transition-colors ${autoAnalysis ? 'text-indigo-400' : 'text-white/40 group-hover:text-white/60'}`} />
                    <span className="hidden sm:inline">AI 4:00 AM</span>
                    <div className={`relative w-9 h-5 rounded-full transition-colors duration-300 ${autoAnalysis ? 'bg-indigo-500' : 'bg-white/15'}`}>
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full shadow-md transition-all duration-300 ${autoAnalysis ? 'left-[18px] bg-white shadow-indigo-500/30' : 'left-0.5 bg-white/70'}`} />
                    </div>
                    <div className="absolute bottom-full right-0 mb-3 w-64 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50">
                        <div className="bg-[#1e1e24] border border-white/10 shadow-2xl rounded-2xl p-4 relative">
                            <p className="text-xs text-white/70 font-normal leading-relaxed text-left normal-case">
                                Khi được bật, AI sẽ tự động <span className="text-indigo-300 font-semibold">cấu trúc lại Lộ trình</span> vào lúc 4:00 sáng mỗi ngày.
                            </p>
                            <div className="absolute -bottom-2 right-8 w-4 h-4 bg-[#1e1e24] border-b border-r border-white/10 rotate-45 transform"></div>
                        </div>
                    </div>
                </button>
            </div>

            {/* Coach Insight Card */}
            <AnimatePresence>
                {coachNote && !isRefreshing && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="liquid-glass rounded-2xl px-5 py-4 border border-indigo-500/15 relative"
                    >
                        <button onClick={() => { setCoachNote(null); setAiMeta(null); }} className="absolute top-3 right-3 text-white/30 hover:text-white/60 transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
                                <Sparkles className="w-4 h-4 text-indigo-400" />
                            </div>
                            <div className="flex-1 min-w-0 pr-6">
                                <p className="text-xs font-semibold text-indigo-300 mb-1.5">AI Life Coach phân tích:</p>
                                <p className="text-sm text-white/80 leading-relaxed italic">"{coachNote}"</p>
                                {aiMeta && (
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 pt-3 border-t border-white/5">
                                        <span className="text-[10px] text-white/40">{aiMeta.pendingCount} tasks</span>
                                        <span className="text-[10px] text-white/40">{aiMeta.goalCount} goals</span>
                                        <span className="text-[10px] text-white/40">{aiMeta.memoryCount} ký ức AI</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
