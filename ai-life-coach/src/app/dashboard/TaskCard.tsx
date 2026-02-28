/** UI Component: TaskCard.tsx - Giao diện đồ họa người dùng. */
'use client'

import { useState, useEffect, useRef } from 'react';
import { motion, useAnimation, PanInfo, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { BatteryWarning, BatteryLow, BatteryMedium, BatteryFull, BatteryCharging, GripHorizontal, Clock, Hourglass } from 'lucide-react';
import { updateTaskStatus, deleteTask, rescheduleTask, saveEnergySnapshot } from './actions';

const REACTION_OPTIONS = [
    { level: 1, icon: BatteryWarning, label: 'Cạn kiệt' },
    { level: 2, icon: BatteryLow, label: 'Hơi mệt' },
    { level: 3, icon: BatteryMedium, label: 'Bình thường' },
    { level: 4, icon: BatteryFull, label: 'Khỏe khoắn' },
    { level: 5, icon: BatteryCharging, label: 'Tràn trề' },
];

const AUTO_DISMISS_MS = 6000;

export default function TaskCard({ task }: { task: any }) {
    const controls = useAnimation();
    const [phase, setPhase] = useState<'card' | 'emoji' | 'done'>('card');
    const [selectedEmoji, setSelectedEmoji] = useState<number | null>(null);
    const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastAction = useRef<string>('');

    const [titlePart, ...restParts] = task.content.split(' - ');
    const title = titlePart;
    const restContent = restParts.join(' - ');

    let timeInfo = '';
    let durationInfo = '';
    let noteInfo = restContent;

    if (restContent.includes('Bắt đầu:') || restContent.includes('Thời lượng:')) {
        const lines = restContent.split('\n');
        const timeLine = lines[0];
        const timePartsArray = timeLine.split(' | ');
        timePartsArray.forEach((p: string) => {
            if (p.startsWith('Bắt đầu: ')) timeInfo = p.replace('Bắt đầu: ', '');
            if (p.startsWith('Thời lượng: ')) durationInfo = p.replace('Thời lượng: ', '');
        });

        if (lines.length > 1) {
            noteInfo = lines.slice(1).join('\n').replace('Chi tiết: ', '');
        } else {
            noteInfo = '';
        }
    }

    const desc = noteInfo || '';
    const energy = task.energy_required || 3;


    useEffect(() => {
        if (phase === 'emoji') {
            dismissTimer.current = setTimeout(() => {
                flushActionToBackend();
                setPhase('done');
            }, AUTO_DISMISS_MS);
        }
        return () => {
            if (dismissTimer.current) clearTimeout(dismissTimer.current);
        };
    }, [phase]);


    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-8, 8]);
    const opacityLeftSignal = useTransform(x, [-50, -150], [0, 1]);
    const opacityRightSignal = useTransform(x, [50, 150], [0, 1]);
    const scaleLeftIcon = useTransform(x, [-50, -150], [0.8, 1.2]);
    const scaleRightIcon = useTransform(x, [50, 150], [0.8, 1.2]);

    // Xử lý logic vuốt (swipe-to-action) qua Framer Motion.
    // Kết hợp độ lệch (offset) và gia tốc (velocity) để phán đoán thao tác người dùng (Vuốt hoàn thành / Dời lịch).
    const handleDragEnd = async (e: any, info: PanInfo) => {
        const offset = info.offset.x;
        const velocity = info.velocity.x;

        if (offset < -100 || velocity < -500) {
            const throwX = Math.min(-500, offset + velocity * 0.4);
            lastAction.current = 'completed';
            await handleAction('completed', throwX);
        } else if (offset > 100 || velocity > 500) {
            const throwX = Math.max(500, offset + velocity * 0.4);
            lastAction.current = 'reschedule';
            await handleAction('reschedule', throwX);
        } else {
            controls.start({ x: 0, opacity: 1, rotate: 0 });
        }
    };

    const handleAction = async (action: 'completed' | 'reschedule' | 'delete', throwX: number = 0) => {
        if (action !== 'delete') {
            await controls.start({ x: throwX, opacity: 0, scale: 0.9, transition: { type: 'spring', stiffness: 200, damping: 25 } });
        } else {
            await controls.start({ scale: 0.8, opacity: 0 });
        }

        try {
            if (action === 'delete') {
                await deleteTask(task.id);
                setPhase('done');
                return;
            }

            if (action === 'reschedule') {
                await rescheduleTask(task.id);
                setPhase('done');
                return;
            }


            setPhase('emoji');

        } catch (error) {
            console.error('Lỗi khi thao tác:', error);
            alert('Quá trình lưu đè bị lỗi mạng. Mời thử lại nhé!');
            setPhase('card');
            controls.start({ x: 0, opacity: 1, scale: 1, rotate: 0 });
        }
    };

    // Đẩy tín hiệu cập nhật trạng thái Task và Năng lượng (Energy Snapshot) lên Supabase DB.
    // Giao diện đã được update theo cơ chế Optimistic UI trước bước này để đảm bảo độ mượt.
    const flushActionToBackend = async (energyRate?: number) => {
        try {
            if (energyRate !== undefined) {
                const triggerLabel = `Hoàn thành: ${title.substring(0, 30)}`;

                await Promise.all([
                    saveEnergySnapshot(energyRate, triggerLabel),
                    updateTaskStatus(task.id, 'completed')
                ]);
            } else {

                await updateTaskStatus(task.id, 'completed');
            }
        } catch (e) { console.error('Lỗi backend', e) }
    }

    const handleEmojiSelect = async (value: number) => {
        setSelectedEmoji(value);
        if (dismissTimer.current) clearTimeout(dismissTimer.current);

        setTimeout(() => flushActionToBackend(value), 50);


        setTimeout(() => setPhase('done'), 600);
    };


    return (
        <AnimatePresence mode="wait">
            {phase === 'card' && (
                <motion.div
                    key="card"
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.3 }}
                    className="relative group"
                >

                    <div className="absolute inset-0 flex justify-between items-center px-4 sm:px-6 rounded-3xl bg-black/20 border border-white/5 overflow-hidden shadow-inner">
                        <motion.div style={{ opacity: opacityLeftSignal }} className="absolute left-0 w-1/2 h-full bg-gradient-to-r from-emerald-500/20 to-transparent pointer-events-none"></motion.div>
                        <motion.div style={{ opacity: opacityRightSignal }} className="absolute right-0 w-1/2 h-full bg-gradient-to-l from-rose-500/20 to-transparent pointer-events-none"></motion.div>
                    </div>

                    <motion.div
                        style={{ x, rotate }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={1}
                        onDragEnd={handleDragEnd}
                        animate={controls}
                        whileTap={{ scale: 0.98, cursor: 'grabbing' }}
                        whileHover={{ y: -2 }}
                        className="relative z-20 liquid-glass-clear p-5 md:p-6 rounded-3xl flex items-center justify-between cursor-grab hover:brightness-110 transition-colors overflow-hidden"
                    >
                        <motion.div
                            style={{ opacity: opacityLeftSignal, scale: scaleLeftIcon }}
                            className="absolute top-1/2 left-4 -translate-y-1/2 border-2 border-emerald-500 text-emerald-500 font-black text-xl px-4 py-2 rounded-xl uppercase rotate-[-15deg] z-30 shadow-[0_0_20px_rgba(16,185,129,0.2)] bg-[#32313a]/50 backdrop-blur-sm pointer-events-none tracking-widest"
                        >
                            HOÀN THÀNH
                        </motion.div>

                        <motion.div
                            style={{ opacity: opacityRightSignal, scale: scaleRightIcon }}
                            className="absolute top-1/2 right-4 -translate-y-1/2 border-2 border-rose-500 text-rose-500 font-black text-xl px-4 py-2 rounded-xl uppercase rotate-[15deg] z-30 shadow-[0_0_20px_rgba(244,63,94,0.2)] bg-[#32313a]/50 backdrop-blur-sm pointer-events-none tracking-widest"
                        >
                            DỜI LỊCH
                        </motion.div>

                        <div className="flex-1 pr-2 pointer-events-none">
                            <h3 className="font-bold text-white/95 text-lg mb-1 leading-snug drop-shadow-sm">{title}</h3>

                            {(timeInfo || durationInfo) && (
                                <div className="flex flex-wrap items-center gap-2 mt-2 mb-2">
                                    {timeInfo && (
                                        <span className="flex items-center gap-1.5 text-xs bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-1 rounded-md">
                                            <Clock className="w-3.5 h-3.5" />
                                            {timeInfo}
                                        </span>
                                    )}
                                    {durationInfo && (
                                        <span className="flex items-center gap-1.5 text-xs bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-1 rounded-md">
                                            <Hourglass className="w-3.5 h-3.5" /> {durationInfo}
                                        </span>
                                    )}
                                </div>
                            )}

                            {desc && (
                                <div className="p-3 bg-black/20 rounded-xl border border-white/5 my-3 relative">
                                    <span className="absolute top-2 left-2 text-white/5 font-serif text-2xl leading-none">"</span>
                                    <p className="text-sm md:text-sm text-white/60 leading-relaxed font-light pl-4 z-10 relative italic">{desc}</p>
                                </div>
                            )}

                            <div className="flex items-center mt-3 mb-1">
                                <div className={`flex items-center gap-1.5 px-2 py-1.5 bg-black/20 rounded-lg border backdrop-blur-md transition-colors ${energy > 3 ? 'border-rose-500/20 text-rose-300' : energy === 3 ? 'border-amber-500/20 text-amber-300' : 'border-emerald-500/20 text-emerald-300'}`}>
                                    {energy === 1 && <BatteryWarning className="w-4 h-4" />}
                                    {energy === 2 && <BatteryLow className="w-4 h-4" />}
                                    {energy === 3 && <BatteryMedium className="w-4 h-4" />}
                                    {energy === 4 && <BatteryFull className="w-4 h-4" />}
                                    {energy === 5 && <BatteryCharging className="w-4 h-4" />}
                                    <div className="flex gap-0.5 ml-0.5">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <div key={i} className={`w-1.5 h-2.5 rounded-[1px] ${i <= energy ? 'bg-current' : 'bg-current opacity-20'}`} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="shrink-0 flex items-center pr-2 pointer-events-auto z-40 bg-transparent py-2"></div>

                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 cursor-grab text-white/10 group-hover:text-white/30 transition-colors pointer-events-auto z-40 p-1">
                            <GripHorizontal className="w-5 h-5" />
                        </div>
                    </motion.div>
                </motion.div >
            )
            }

            {
                phase === 'emoji' && (
                    <motion.div
                        key="emoji"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, height: 0, scale: 0.8, marginBottom: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className="relative rounded-3xl liquid-glass p-5 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-rose-500/5 pointer-events-none"></div>

                        <motion.div
                            className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-indigo-400 to-purple-400"
                            initial={{ width: '100%' }}
                            animate={{ width: '0%' }}
                            transition={{ duration: AUTO_DISMISS_MS / 1000, ease: 'linear' }}
                        />

                        <div className="relative z-10">
                            <p className="text-center text-sm md:text-base text-white/70 mb-5 font-semibold tracking-wide">
                                Năng lượng hiện tại của bạn?
                            </p>
                            <div className="flex justify-center gap-2 sm:gap-3">
                                {REACTION_OPTIONS.map((opt) => (
                                    <motion.button
                                        key={opt.level}
                                        onClick={() => handleEmojiSelect(opt.level)}
                                        whileHover={{ scale: 1.15, y: -2 }}
                                        whileTap={{ scale: 0.9 }}
                                        animate={selectedEmoji === opt.level
                                            ? { scale: 1.25, y: -4, opacity: 1 }
                                            : selectedEmoji !== null
                                                ? { opacity: 0.3, scale: 0.9 }
                                                : { opacity: 1, scale: 1 }
                                        }
                                        className={`flex flex-col items-center gap-1.5 p-2 sm:p-3 rounded-2xl transition-colors shrink-0 ${selectedEmoji === opt.level
                                            ? 'bg-indigo-500/20 border border-indigo-500/30 shadow-lg shadow-indigo-500/10'
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
                )
            }
        </AnimatePresence >
    );
}
