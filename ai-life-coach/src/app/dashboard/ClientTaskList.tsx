/** UI Component: Render danh sách Task với cơ chế Drag & Drop (Optimistic UI). */
'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, SortAsc, Zap, Flag, Clock, BatteryWarning, BatteryLow, BatteryMedium, BatteryFull, BatteryCharging, Sparkles } from 'lucide-react';
import TaskCard from './TaskCard';
import { parseTaskContent } from '@/utils/taskParser';
import { calculateBurnoutRisk } from '@/utils/burnoutAlgorithm';

type Task = any;

type SortOption = 'auto' | 'smart_ai' | 'priority' | 'time' | 'energy_asc' | 'energy_desc' | 'az';

export default function ClientTaskList({ initialTasks, energyLevel }: { initialTasks: Task[], energyLevel: number }) {

    // Mặc định chọn Auto
    const [sortBy, setSortBy] = useState<SortOption>('auto');
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

    // Luôn tính toán Burnout Risk Score để lấy lời khuyên cảnh báo quá tải cho mọi chế độ xem
    const scoredTasks = calculateBurnoutRisk(energyLevel, processedTasks);

    // Gắn thẻ lời khuyên fallback vào task gốc
    processedTasks = processedTasks.map(task => {
        const scoreInfo = scoredTasks.find(s => s.id === task.id);
        if (scoreInfo) {
            return { ...task, _burnoutFallback: scoreInfo.fallbackAction };
        }
        return task;
    });

    // Giải quyết logic Auto nâng cao (Siêu Khớp - Hỗ trợ Nhịp sinh học)
    if (sortBy === 'auto') {
        const currentHour = new Date().getHours();

        // --- MÔ PHỎNG DỮ LIỆU TỪ BACKEND ---
        // Giả sử thuật toán thống kê trên server trả về hồ sơ sinh học cá nhân của User này (Dạng Cú đêm):
        const userProfile = {
            peak_hours: [10, 11, 14, 15, 20, 21, 22], // Giờ Vàng: Trưa, Chiều và Tối muộn (Cú đêm)
            dead_hours: [6, 7, 8, 9, 12, 13, 17, 18, 19, 23, 0, 1, 2, 3, 4, 5] // Giờ Chết: Sáng sớm & Chập tối
        };

        // KIỂM TRA TRẠNG THÁI HIỆN TẠI
        const isDeadHour = userProfile.dead_hours.includes(currentHour);
        const isPeakHour = userProfile.peak_hours.includes(currentHour);

        processedTasks.sort((a, b) => {
            // Bước 1: Lấy các thông số của Task
            const timeA = parseTaskContent(a.content, true).timeValue || 9999;
            const timeB = parseTaskContent(b.content, true).timeValue || 9999;
            const energyReqA = a.energy_required || 3;
            const energyReqB = b.energy_required || 3;
            const prioA = 5 - (a.priority || 3); // 1 = Q.trọng nhất chuyển sang 4 điểm
            const prioB = 5 - (b.priority || 3);

            // Bước 2: Lấy điểm Burnout Risk Score (Chứa sức ép Deadline)
            const burnoutA = scoredTasks.find(s => s.id === a.id);
            const burnoutB = scoredTasks.find(s => s.id === b.id);
            const urgencyA = burnoutA?.metrics.urgency || 0; // 0-5
            const urgencyB = burnoutB?.metrics.urgency || 0;

            // ---- TÍNH ĐIỂM DYNAMIC THEO NHỊP SINH HỌC CÁ NHÂN HÓA ----
            let dynamicScoreA = prioA * 10;
            let dynamicScoreB = prioB * 10;

            // Yếu tố 1: HARD DEADLINE LÀ VUA (Bất chấp giờ giấc hay năng lượng)
            if (urgencyA >= 3) dynamicScoreA += Math.exp(urgencyA) * 20;
            if (urgencyB >= 3) dynamicScoreB += Math.exp(urgencyB) * 20;

            // Yếu tố 2: PHÙ HỢP CƠ ĐỊA CHUẨN (Energy Matching)
            if (energyLevel < energyReqA) dynamicScoreA -= (energyReqA - energyLevel) * 50;
            if (energyLevel < energyReqB) dynamicScoreB -= (energyReqB - energyLevel) * 50;

            // Yếu tố 3: NHỊP SINH HỌC (Adaptive Triage)
            if (isDeadHour || energyLevel <= 2) {
                // Đang trong "Khung Giờ Chết" HOẶC Đang kiệt sức: 
                // -> KÍCH HOẠT KHIÊN: Thưởng điểm tuyệt đối cho việc nhẹ (Micro-actions energy 1-2)
                if (energyReqA <= 2) dynamicScoreA += 40;
                if (energyReqB <= 2) dynamicScoreB += 40;

                // Trừ thêm điểm việc nặng để nó chìm hẳn xuống đáy
                if (energyReqA >= 4) dynamicScoreA -= 30;
                if (energyReqB >= 4) dynamicScoreB -= 30;

            } else if (isPeakHour) {
                // Đang trong "Giờ Vàng": 
                // -> ĂN CON CHỄNH ƯƠNG ƯƠNG: Thưởng cực đậm cho việc Khó & Quan trọng
                dynamicScoreA += prioA * 20;
                dynamicScoreB += prioB * 20;
                if (energyReqA >= 4) dynamicScoreA += 15;
                if (energyReqB >= 4) dynamicScoreB += 15;

            } else {
                // Giờ Bình thường (Maintainance mode)
                dynamicScoreA += prioA * 5;
                dynamicScoreB += prioB * 5;
                // Ưu tiên làm việc đến sớm trong ngày
                if (timeA < timeB) dynamicScoreA += 5;
                if (timeB < timeA) dynamicScoreB += 5;
            }

            return dynamicScoreB - dynamicScoreA; // Sort Giảm dần
        });
    } else if (sortBy === 'smart_ai') {
        // Nếu cố tình chọn Smart AI: Sort thuần túy theo Điểm Rủi Ro (Raw Score)
        processedTasks.sort((a, b) => {
            const scoreA = scoredTasks.find(s => s.id === a.id)?.rawScore || 0;
            const scoreB = scoredTasks.find(s => s.id === b.id)?.rawScore || 0;
            return scoreB - scoreA;
        });
    } else {
        // Các bộ lọc truyền thống
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
    }

    const sortOptions = [
        { id: 'auto', label: 'Tự động (Beta)', icon: <Zap className="w-4 h-4 text-amber-400" fill="currentColor" /> },
        { id: 'smart_ai', label: 'Tối ưu theo Năng lượng (AI)', icon: <Sparkles className="w-4 h-4 text-purple-400" /> },
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
