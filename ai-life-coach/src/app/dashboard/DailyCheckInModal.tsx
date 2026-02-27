/** UI Component: Thu thập trạng thái thể chất/tinh thần đầu ngày (Energy Tracker). */
'use client'

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { saveDailyCheckIn } from './actions';
import { Sparkles, Sun, BatteryWarning, BatteryLow, BatteryMedium, BatteryFull, BatteryCharging } from 'lucide-react';

const ENERGY_OPTIONS = [
    { level: 1, icon: BatteryWarning, label: 'Cạn kiệt' },
    { level: 2, icon: BatteryLow, label: 'Hơi mệt' },
    { level: 3, icon: BatteryMedium, label: 'Bình thường' },
    { level: 4, icon: BatteryFull, label: 'Khỏe khoắn' },
    { level: 5, icon: BatteryCharging, label: 'Tràn trề' },
];

export default function DailyCheckInModal() {
    const [isOpen, setIsOpen] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedLevel, setSelectedLevel] = useState<number | null>(null);

    const handleSelect = async (level: number) => {
        setSelectedLevel(level);
        setIsSaving(true);
        try {
            
            await saveDailyCheckIn(level, 'neutral', 'Morning Check-in');

            
            setTimeout(() => {
                setIsOpen(false);
            }, 800);
        } catch (error: any) {
            console.error('Lỗi lưu check-in:', error);
            alert(`Lỗi lưu trữ: ${error.message}`);
            setIsSaving(false);
            setSelectedLevel(null);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.9, marginTop: 0, marginBottom: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="w-full liquid-glass p-4 md:p-5 rounded-3xl relative overflow-hidden mb-6 shadow-xl"
            >
                
                <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[150px] h-[150px] bg-indigo-500/10 rounded-full blur-[40px] pointer-events-none"></div>
                <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[150px] h-[150px] bg-rose-500/10 rounded-full blur-[40px] pointer-events-none"></div>

                <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                            <Sparkles className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="font-bold whitespace-nowrap text-white/90 text-sm md:text-base flex items-center gap-1.5 focus:outline-none">
                                Chào ngày mới! <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                            </h3>
                            <p className="text-xs text-white/50">Năng lượng sáng nay của bạn thế nào?</p>
                        </div>
                    </div>

                    <div className="flex justify-center gap-2 sm:gap-3 w-full sm:w-auto">
                        {ENERGY_OPTIONS.map((opt) => (
                            <motion.button
                                key={opt.level}
                                onClick={() => handleSelect(opt.level)}
                                disabled={isSaving}
                                whileHover={{ scale: 1.15, y: -2 }}
                                whileTap={{ scale: 0.9 }}
                                animate={selectedLevel === opt.level
                                    ? { scale: 1.25, y: -4, opacity: 1 }
                                    : selectedLevel !== null
                                        ? { opacity: 0.3, scale: 0.9 }
                                        : { opacity: 1, scale: 1 }
                                }
                                className={`flex flex-col items-center gap-1 p-2 sm:p-2.5 rounded-2xl transition-colors shrink-0 disabled:cursor-not-allowed ${selectedLevel === opt.level
                                    ? 'bg-indigo-500/20 border border-indigo-500/30'
                                    : 'bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10'
                                    }`}
                            >
                                <opt.icon className={`w-6 h-6 sm:w-7 sm:h-7 ${opt.level === 1 ? 'text-rose-500' :
                                        opt.level === 2 ? 'text-orange-400' :
                                            opt.level === 3 ? 'text-amber-400' :
                                                opt.level === 4 ? 'text-emerald-400' :
                                                    'text-cyan-400'
                                    }`} />
                                <span className="text-[9px] sm:text-[10px] text-white/50 font-medium tracking-wide">{opt.label}</span>
                            </motion.button>
                        ))}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
