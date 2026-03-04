'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Flame, Zap, Target, Activity, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence, Variants, useMotionValue, useTransform, animate } from 'framer-motion';

function AnimatedNumber({ value, isFloat = false }: { value: number, isFloat?: boolean }) {
    const count = useMotionValue(0);
    const display = useTransform(count, v => isFloat ? v.toFixed(1) : Math.round(v).toString());

    useEffect(() => {
        const controls = animate(count, value, { duration: 1.5, ease: "easeOut", delay: 0.3 });
        return controls.stop;
    }, [value, count]);

    return <motion.span>{display}</motion.span>;
}

export default function DashboardStats() {
    const [isExpanded, setIsExpanded] = useState(false);

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 20, scale: 0.95 },
        show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", bounce: 0.4, duration: 0.6 } }
    };

    return (
        <div className="mb-8 relative z-10">
            {/* Toggle Button */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="liquid-glass flex flex-row items-center gap-4 text-left group hover:opacity-100 transition-opacity whitespace-nowrap px-6 py-3 rounded-full w-fit relative z-20"
            >
                <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-purple-400" />
                    <h2 className="text-lg font-bold">Phân tích Hiệu suất</h2>
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-semibold border border-purple-500/20 mx-2">
                        Tuần này
                    </span>
                </div>

                <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <ChevronDown className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" />
                </motion.div>
            </button>

            {/* Expandable Stats Panel */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0, y: -20 }}
                        animate={{ height: "auto", opacity: 1, y: 0 }}
                        exit={{ height: 0, opacity: 0, y: -20 }}
                        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                        className="overflow-hidden mt-4"
                    >
                        <div className="liquid-glass rounded-3xl p-6 md:p-8 relative overflow-hidden">
                            <div className="absolute top-[-50%] right-[-10%] w-[300px] h-[300px] bg-purple-500/10 rounded-full filter blur-[80px] pointer-events-none animate-glow-pulse"></div>

                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                animate="show"
                                className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
                            >
                                {/* Stat 1: Năng suất */}
                                <motion.div variants={itemVariants} className="bg-white/5 border border-white/10 p-5 rounded-2xl hover:bg-white/10 transition-colors">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                            <TrendingUp className="w-5 h-5 text-blue-400" />
                                        </div>
                                        <motion.span
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.8 }}
                                            className="text-blue-400 text-sm font-semibold flex items-center gap-1"
                                        >
                                            +12% <TrendingUp className="w-3 h-3" />
                                        </motion.span>
                                    </div>
                                    <h3 className="text-white/60 text-sm font-medium mb-1">Năng suất tổng thể</h3>
                                    <p className="text-2xl font-bold"><AnimatedNumber value={85} /><span className="text-lg text-white/40">%</span></p>

                                    <div className="w-full bg-white/5 rounded-full h-1.5 mt-4 overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: '85%' }}
                                            transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                                            className="bg-gradient-to-r from-blue-500 to-cyan-400 h-1.5 rounded-full"
                                        />
                                    </div>
                                </motion.div>

                                {/* Stat 2: Chuỗi ngày */}
                                <motion.div variants={itemVariants} className="bg-white/5 border border-white/10 p-5 rounded-2xl hover:bg-white/10 transition-colors">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                                            <Flame className="w-5 h-5 text-orange-400" />
                                        </div>
                                        <motion.span
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.8 }}
                                            className="text-white/40 text-sm font-semibold"
                                        >
                                            Kỷ lục: 14 ngày
                                        </motion.span>
                                    </div>
                                    <h3 className="text-white/60 text-sm font-medium mb-1">Chuỗi kiên trì</h3>
                                    <p className="text-2xl font-bold"><AnimatedNumber value={7} /><span className="text-lg text-white/40"> ngày</span></p>

                                    <div className="flex gap-1 mt-4">
                                        {[1, 2, 3, 4, 5, 6, 7].map((day, i) => (
                                            <motion.div
                                                key={day}
                                                initial={{ scale: 0, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                transition={{ delay: 0.6 + i * 0.1, type: "spring", stiffness: 300, damping: 15 }}
                                                className={`h-1.5 flex-1 rounded-full bg-orange-500`}
                                            />
                                        ))}
                                    </div>
                                </motion.div>

                                {/* Stat 3: Năng lượng */}
                                <motion.div variants={itemVariants} className="bg-white/5 border border-white/10 p-5 rounded-2xl hover:bg-white/10 transition-colors">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                                            <Zap className="w-5 h-5 text-yellow-400" />
                                        </div>
                                        <motion.span
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.9, type: 'spring' }}
                                            className="text-yellow-400 text-sm font-semibold"
                                        >
                                            Tuyệt vời
                                        </motion.span>
                                    </div>
                                    <h3 className="text-white/60 text-sm font-medium mb-1">Năng lượng trung bình</h3>
                                    <p className="text-2xl font-bold"><AnimatedNumber value={4.2} isFloat={true} /><span className="text-lg text-white/40">/5</span></p>

                                    <div className="w-full bg-white/5 rounded-full h-1.5 mt-4 overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: '84%' }}
                                            transition={{ duration: 1.5, delay: 0.6, ease: "easeOut" }}
                                            className="bg-gradient-to-r from-yellow-500 to-amber-500 h-1.5 rounded-full"
                                        />
                                    </div>
                                </motion.div>

                                {/* Stat 4: Hoàn thành */}
                                <motion.div variants={itemVariants} className="bg-white/5 border border-white/10 p-5 rounded-2xl hover:bg-white/10 transition-colors">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                            <Target className="w-5 h-5 text-emerald-400" />
                                        </div>
                                        <motion.span
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.9 }}
                                            className="text-emerald-400 text-sm font-semibold flex items-center gap-1"
                                        >
                                            +3 <TrendingUp className="w-3 h-3" />
                                        </motion.span>
                                    </div>
                                    <h3 className="text-white/60 text-sm font-medium mb-1">Task hoàn thành</h3>
                                    <p className="text-2xl font-bold"><AnimatedNumber value={18} /><span className="text-lg text-white/40"> task</span></p>

                                    <div className="w-full bg-white/5 rounded-full h-1.5 mt-4 overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: '65%' }}
                                            transition={{ duration: 1.5, delay: 0.7, ease: "easeOut" }}
                                            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-1.5 rounded-full"
                                        />
                                    </div>
                                </motion.div>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
