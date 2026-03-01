'use client';

import { useState } from 'react';
import { TrendingUp, Flame, Zap, Target, Activity, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardStats() {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <motion.div
            layout
            className={`liquid-glass rounded-2xl mb-8 relative overflow-hidden group transition-all duration-300 ${isExpanded ? 'w-full' : 'w-fit'}`}
        >
            <div className="absolute top-[-50%] right-[-10%] w-[300px] h-[300px] bg-purple-500/10 rounded-full filter blur-[80px] pointer-events-none"></div>

            <div className="relative z-10 px-6 py-3 md:px-8 md:py-4">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex flex-row items-center gap-6 text-left group-hover:opacity-100 transition-opacity whitespace-nowrap w-full"
                >
                    <div className="flex items-center gap-3">
                        <Activity className="w-5 h-5 text-purple-400" />
                        <h2 className="text-lg font-bold">Phân tích Hiệu suất</h2>
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-semibold border border-purple-500/20 ml-2">
                            Tuần này
                        </span>
                    </div>

                    <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                        <ChevronDown className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" />
                    </div>
                </button>

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0, marginTop: 0 }}
                            animate={{ height: "auto", opacity: 1, marginTop: 24 }}
                            exit={{ height: 0, opacity: 0, marginTop: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Stat 1: Năng suất */}
                                <div className="bg-white/5 border border-white/10 p-5 rounded-2xl hover:bg-white/10 transition-colors">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                            <TrendingUp className="w-5 h-5 text-blue-400" />
                                        </div>
                                        <span className="text-blue-400 text-sm font-semibold flex items-center gap-1">
                                            +12% <TrendingUp className="w-3 h-3" />
                                        </span>
                                    </div>
                                    <h3 className="text-white/60 text-sm font-medium mb-1">Năng suất tổng thể</h3>
                                    <p className="text-2xl font-bold">85<span className="text-lg text-white/40">%</span></p>

                                    <div className="w-full bg-white/5 rounded-full h-1.5 mt-4">
                                        <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-1.5 rounded-full" style={{ width: '85%' }}></div>
                                    </div>
                                </div>

                                {/* Stat 2: Chuỗi ngày */}
                                <div className="bg-white/5 border border-white/10 p-5 rounded-2xl hover:bg-white/10 transition-colors">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                                            <Flame className="w-5 h-5 text-orange-400" />
                                        </div>
                                        <span className="text-white/40 text-sm font-semibold">
                                            Kỷ lục: 14 ngày
                                        </span>
                                    </div>
                                    <h3 className="text-white/60 text-sm font-medium mb-1">Chuỗi kiên trì</h3>
                                    <p className="text-2xl font-bold">7<span className="text-lg text-white/40"> ngày</span></p>

                                    <div className="flex gap-1 mt-4">
                                        {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                                            <div key={day} className={`h-1.5 flex-1 rounded-full bg-orange-500`}></div>
                                        ))}
                                    </div>
                                </div>

                                {/* Stat 3: Năng lượng */}
                                <div className="bg-white/5 border border-white/10 p-5 rounded-2xl hover:bg-white/10 transition-colors">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                                            <Zap className="w-5 h-5 text-yellow-400" />
                                        </div>
                                        <span className="text-yellow-400 text-sm font-semibold">
                                            Tuyệt vời
                                        </span>
                                    </div>
                                    <h3 className="text-white/60 text-sm font-medium mb-1">Năng lượng trung bình</h3>
                                    <p className="text-2xl font-bold">4.2<span className="text-lg text-white/40">/5</span></p>

                                    <div className="w-full bg-white/5 rounded-full h-1.5 mt-4">
                                        <div className="bg-gradient-to-r from-yellow-500 to-amber-500 h-1.5 rounded-full" style={{ width: '84%' }}></div>
                                    </div>
                                </div>

                                {/* Stat 4: Hoàn thành */}
                                <div className="bg-white/5 border border-white/10 p-5 rounded-2xl hover:bg-white/10 transition-colors">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                            <Target className="w-5 h-5 text-emerald-400" />
                                        </div>
                                        <span className="text-emerald-400 text-sm font-semibold flex items-center gap-1">
                                            +3 <TrendingUp className="w-3 h-3" />
                                        </span>
                                    </div>
                                    <h3 className="text-white/60 text-sm font-medium mb-1">Task hoàn thành</h3>
                                    <p className="text-2xl font-bold">18<span className="text-lg text-white/40"> task</span></p>

                                    <div className="w-full bg-white/5 rounded-full h-1.5 mt-4">
                                        <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-1.5 rounded-full" style={{ width: '65%' }}></div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
