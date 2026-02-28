/** UI Component: Render danh sách Task với cơ chế Drag & Drop (Optimistic UI). */
'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, SortAsc, Zap, Flag, Clock, BatteryWarning, BatteryLow, BatteryMedium, BatteryFull, BatteryCharging } from 'lucide-react';
import TaskCard from './TaskCard';
import { parseTaskContent } from '@/utils/taskParser';

type Task = any;

type SortOption = 'priority' | 'time' | 'energy_asc' | 'energy_desc' | 'az';

export default function ClientTaskList({ initialTasks, energyLevel }: { initialTasks: Task[], energyLevel: number }) {

    const [sortBy, setSortBy] = useState<SortOption>(energyLevel < 3 ? 'energy_asc' : 'priority');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);


    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    let processedTasks = [...initialTasks];


    processedTasks.sort((a, b) => {
        if (sortBy === 'priority') {
            return a.priority - b.priority;
        } else if (sortBy === 'time') {
            const timeA = parseTaskContent(a.content, true).timeValue;
            const timeB = parseTaskContent(b.content, true).timeValue;
            if (timeA !== timeB) return timeA - timeB;
            return a.priority - b.priority;
        } else if (sortBy === 'energy_asc') {
            const energyA = a.energy_required || 3;
            const energyB = b.energy_required || 3;
            if (energyA !== energyB) return energyA - energyB;
            return a.priority - b.priority;
        } else if (sortBy === 'energy_desc') {
            const energyA = a.energy_required || 3;
            const energyB = b.energy_required || 3;
            if (energyA !== energyB) return energyB - energyA;
            return a.priority - b.priority;
        } else if (sortBy === 'az') {
            const titleA = a.content.split(' - ')[0] || '';
            const titleB = b.content.split(' - ')[0] || '';
            return titleA.localeCompare(titleB);
        }
        return 0;
    });

    const sortOptions = [
        { id: 'time', label: 'Theo Thời gian (Sớm nhất)', icon: <Clock className="w-4 h-4 text-sky-400" /> },
        { id: 'priority', label: 'Quan trọng nhất', icon: <Flag className="w-4 h-4 text-rose-400" /> },
        { id: 'energy_asc', label: 'Việc Nhẹ Nhàng trước', icon: <Zap className="w-4 h-4 text-emerald-400" /> },
        { id: 'energy_desc', label: 'Việc Đòi Hỏi Cao trước', icon: <Zap className="w-4 h-4 text-rose-400" /> },
        { id: 'az', label: 'Theo tên (A-Z)', icon: <SortAsc className="w-4 h-4 text-indigo-400" /> },
    ];

    const currentSortLabel = sortOptions.find(opt => opt.id === sortBy)?.label;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-2">
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                            Nhiệm vụ hôm nay
                        </h2>

                        {(() => {
                            const en = energyLevel || 3;
                            const BattIcon = en === 1 ? BatteryWarning : en === 2 ? BatteryLow : en === 3 ? BatteryMedium : en === 4 ? BatteryFull : BatteryCharging;
                            return (
                                <span
                                    className={`flex items-center justify-center p-1 rounded-lg shadow-inner border backdrop-blur-sm transition-all ${en > 3 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : en === 3 ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}
                                    title={`Năng lượng hiện tại: ${en} Pin`}
                                >
                                    <BattIcon className="w-4 h-4" />
                                </span>
                            );
                        })()}
                    </div>

                    <p className="text-xs text-white/50 mt-1.5 font-medium tracking-wide">
                        {processedTasks.length} NHIỆM VỤ KHẢ DỤNG
                    </p>
                </div>


                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-2 bg-black/20 hover:bg-black/40 p-2 pl-3 rounded-xl border border-white/10 shadow-inner transition-colors"
                    >
                        <span className="text-[10px] sm:text-xs font-semibold text-white/70">
                            {currentSortLabel}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-white/50 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {isDropdownOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                className="!absolute right-0 mt-2 w-48 liquid-glass-heavy rounded-2xl shadow-2xl overflow-hidden z-50"
                            >
                                <div className="p-1">
                                    {sortOptions.map((option) => (
                                        <button
                                            key={option.id}
                                            onClick={() => {
                                                setSortBy(option.id as SortOption);
                                                setIsDropdownOpen(false);
                                            }}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${sortBy === option.id
                                                ? 'bg-indigo-500/20 text-indigo-300'
                                                : 'text-white/70 hover:bg-white/5 hover:text-white'
                                                }`}
                                        >
                                            {option.icon}
                                            <span className="font-medium text-left">{option.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {processedTasks.length === 0 ? (
                <div className="liquid-glass rounded-3xl p-8 text-center">
                    <p className="text-white/60">🎉 Bạn đã hoàn thành tất cả nhiệm vụ hôm nay! Nghỉ ngơi đi nào.</p>
                </div>
            ) : (
                <motion.div layout className="flex flex-col gap-4 w-full relative z-10">
                    <AnimatePresence mode="popLayout">
                        {processedTasks.map((task, idx) => (
                            <motion.div
                                layout
                                key={task.id}
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0, overflow: 'hidden' }}
                                transition={{ duration: 0.3 }}
                                {...(idx === 0 ? { 'data-tour': 'first-task' } : {})}
                            >
                                <TaskCard task={task} />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}
        </div>
    );
}
