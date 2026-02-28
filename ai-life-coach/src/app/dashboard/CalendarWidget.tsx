/** UI Component: CalendarWidget.tsx - Giao diện đồ họa người dùng. */
'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, parseISO, subDays, isSameWeek, addWeeks, subWeeks, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, MapPin, AlignLeft, Calendar as CalendarIcon, X, PlusCircle, Check, Loader2, ListTodo, LayoutGrid, AlertTriangle, Zap, Clock, BatteryWarning, BatteryLow, BatteryMedium, BatteryFull, BatteryCharging, Edit2, Trash2 } from 'lucide-react';
import { createEvent, deleteEvent, createCalendarTask, deleteCalendarTask } from './calendarActions';
import CustomDropdown from './CustomDropdown';
import IOSTimePicker from './IOSTimePicker';
import { createClient } from '@/utils/supabase/client';
import { editTask } from './actions';
import { parseTaskContent } from '@/utils/taskParser';
import ConfirmModal from './ConfirmModal';

export const revalidate = 0;

const timeOptions = [{ value: '', label: 'Cả ngày (Không set)' }];
for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
        const hh = h.toString().padStart(2, '0');
        const mm = m.toString().padStart(2, '0');
        timeOptions.push({ value: `${hh}:${mm}`, label: `${hh}:${mm}` });
    }
}

const durationOptions = [
    { value: "", label: "Không giới hạn / Tùy tâm" },
    { value: "15 phút", label: "Chớp nhoáng (15 phút)" },
    { value: "30 phút", label: "Ngắn (30 phút)" },
    { value: "1 giờ", label: "Tập trung (1 giờ)" },
    { value: "2 giờ", label: "Chuyên sâu (2 giờ)" },
    { value: "Cả buổi", label: "Dài (Cả buổi)" }
];

type Event = {
    id: string;
    title: string;
    date: string;
    is_hard_deadline: boolean;
    is_task?: boolean;
    energy_required?: number;
    content?: string;
};

interface CalendarWidgetProps {
    initialEvents: Event[];
}

export default function CalendarWidget({ initialEvents }: CalendarWidgetProps) {
    const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [events, setEvents] = useState<Event[]>(initialEvents);
    const [isAddingEvent, setIsAddingEvent] = useState(false);
    const [newEventTitle, setNewEventTitle] = useState('');
    const [newNote, setNewNote] = useState('');
    const [isHardDeadline, setIsHardDeadline] = useState(true);
    const [isTaskMode, setIsTaskMode] = useState(false);
    const [newEnergy, setNewEnergy] = useState(3);
    const [taskStartTime, setTaskStartTime] = useState('');
    const [taskDuration, setTaskDuration] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);


    useEffect(() => {
        setEvents(initialEvents);
    }, [initialEvents]);


    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [editSubmitting, setEditSubmitting] = useState(false);


    const [editEventTitle, setEditEventTitle] = useState('');
    const [editNote, setEditNote] = useState('');
    const [editEnergy, setEditEnergy] = useState<number>(3);
    const [editStartTime, setEditStartTime] = useState('');
    const [editDuration, setEditDuration] = useState('');
    const [editIsHardDeadline, setEditIsHardDeadline] = useState(false);
    const [confirmDeleteTarget, setConfirmDeleteTarget] = useState<{ id: string; isTask?: boolean } | null>(null);

    const openEditModal = (e: Event) => {
        setEditingEvent(e);
        setEditEventTitle(e.title);

        if (e.is_task) {
            setEditEnergy(e.energy_required || 3);
            let timeInfo = '';
            let durationInfo = '';
            let noteInfo = '';

            if (e.content) {
                const restParts = e.content.split(' - ').slice(1);
                const restContent = restParts.join(' - ');
                if (restContent.includes('Bắt đầu:') || restContent.includes('Thời lượng:')) {
                    const lines = restContent.split('\n');
                    const timePartsArray = lines[0].split(' | ');
                    timePartsArray.forEach(p => {
                        if (p.startsWith('Bắt đầu: ')) timeInfo = p.replace('Bắt đầu: ', '');
                        if (p.startsWith('Thời lượng: ')) durationInfo = p.replace('Thời lượng: ', '');
                    });
                    if (lines.length > 1) {
                        noteInfo = lines.slice(1).join('\n').replace('Chi tiết: ', '');
                    }
                } else {
                    noteInfo = restContent;
                }
            }
            setEditStartTime(timeInfo);
            setEditDuration(durationInfo);
            setEditNote(noteInfo);
        } else {
            setEditIsHardDeadline(e.is_hard_deadline);

            setEditNote(e.content?.split(' - ').slice(1).join(' - ') || '');
        }
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingEvent || !editEventTitle.trim()) return;

        setEditSubmitting(true);
        try {
            if (editingEvent.is_task) {
                let finalNote = editNote;
                const timeParts = [];
                if (editStartTime) timeParts.push(`Bắt đầu: ${editStartTime}`);
                if (editDuration) timeParts.push(`Thời lượng: ${editDuration}`);
                if (timeParts.length > 0) {
                    finalNote = timeParts.join(' | ') + (editNote ? `\nChi tiết: ${editNote}` : '');
                }
                const fullContent = finalNote ? `${editEventTitle} - ${finalNote}` : editEventTitle;

                await editTask(editingEvent.id, fullContent, Math.round(editEnergy));


                setEvents(prev => prev.map(ev =>
                    ev.id === editingEvent.id
                        ? { ...ev, title: editEventTitle, content: fullContent, energy_required: Math.round(editEnergy) }
                        : ev
                ));
            } else {


                alert('Chỉnh sửa Sự kiện thông thường đang được phát triển.');
            }
            setEditingEvent(null);
        } catch (error) {
            console.error("Lỗi khi sửa:", error);
            alert("Lỗi khi lưu thay đổi.");
        } finally {
            setEditSubmitting(false);
        }
    };

    const confirmDeleteEditing = async () => {
        if (!editingEvent) return;
        setConfirmDeleteTarget({ id: editingEvent.id, isTask: editingEvent.is_task });
    };

    const executeConfirmedDelete = async () => {
        if (!confirmDeleteTarget) return;
        try {
            if (confirmDeleteTarget.isTask) {
                await deleteCalendarTask(confirmDeleteTarget.id);
            } else {
                await deleteEvent(confirmDeleteTarget.id);
            }
            setConfirmDeleteTarget(null);
            setEditingEvent(null);
        } catch (error) {
            console.error("Failed to delete event", error);
        }
    };


    const getTaskDisplayInfo = (e: Event) => {
        return parseTaskContent(e.content || '', e.is_task, e.title);
    };

    // Auto-scroll logic: Tự động cuộn đến ngày hiện hành hoặc thẻ đang được hightlight.
    // Tính toán bù trừ khoảng cách offset cho fixed header để tránh bị che khuất.
    useEffect(() => {
        const timeout = setTimeout(() => {
            let centerEl: HTMLElement | null = null;
            if (viewMode === 'week') {
                centerEl = scrollContainerRef.current?.querySelector('.today-marker') as HTMLElement;
                if (!centerEl) {
                    centerEl = scrollContainerRef.current?.querySelector('.center-week-marker') as HTMLElement;
                }
            } else {
                centerEl = scrollContainerRef.current?.querySelector('.center-month-marker') as HTMLElement;
            }

            if (centerEl && scrollContainerRef.current) {
                const containerTop = scrollContainerRef.current.getBoundingClientRect().top;
                const elTop = centerEl.getBoundingClientRect().top;
                const relativePos = elTop - containerTop + scrollContainerRef.current.scrollTop;
                const offset = viewMode === 'week' ? 120 : 10;
                scrollContainerRef.current.scrollTo({ top: relativePos - offset, behavior: 'smooth' });
            }
        }, 100);
        return () => clearTimeout(timeout);
    }, [viewMode]);


    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);


    const startDate = viewMode === 'month' ? startOfWeek(monthStart, { weekStartsOn: 1 }) : startOfWeek(currentDate, { weekStartsOn: 1 });
    const endDate = viewMode === 'month' ? endOfWeek(monthEnd, { weekStartsOn: 1 }) : endOfWeek(currentDate, { weekStartsOn: 1 });

    const nextPeriod = () => {
        if (viewMode === 'month') {
            const nextMonth = addMonths(currentDate, 1);
            setCurrentDate(nextMonth);
            setTimeout(() => {
                const el = scrollContainerRef.current?.querySelector(`#month-${format(nextMonth, 'MM-yyyy')}`);
                if (el && scrollContainerRef.current) {
                    const containerTop = scrollContainerRef.current.getBoundingClientRect().top;
                    const elTop = el.getBoundingClientRect().top;
                    scrollContainerRef.current.scrollTo({ top: elTop - containerTop + scrollContainerRef.current.scrollTop - 10, behavior: 'smooth' });
                }
            }, 50);
        } else {
            const nextWeek = addDays(currentDate, 7);
            setCurrentDate(nextWeek);
            setTimeout(() => {
                const weekStartDay = startOfWeek(nextWeek, { weekStartsOn: 1 });
                const el = scrollContainerRef.current?.querySelector(`#week-${format(weekStartDay, 'yyyy-MM-dd')}`);
                if (el && scrollContainerRef.current) {
                    const containerTop = scrollContainerRef.current.getBoundingClientRect().top;
                    const elTop = el.getBoundingClientRect().top;
                    scrollContainerRef.current.scrollTo({ top: elTop - containerTop + scrollContainerRef.current.scrollTop - 120, behavior: 'smooth' });
                }
            }, 50);
        }
    };

    const prevPeriod = () => {
        if (viewMode === 'month') {
            const prevMonth = subMonths(currentDate, 1);
            setCurrentDate(prevMonth);
            setTimeout(() => {
                const el = scrollContainerRef.current?.querySelector(`#month-${format(prevMonth, 'MM-yyyy')}`);
                if (el && scrollContainerRef.current) {
                    const containerTop = scrollContainerRef.current.getBoundingClientRect().top;
                    const elTop = el.getBoundingClientRect().top;
                    scrollContainerRef.current.scrollTo({ top: elTop - containerTop + scrollContainerRef.current.scrollTop - 10, behavior: 'smooth' });
                }
            }, 50);
        } else {
            const prevWeek = subDays(currentDate, 7);
            setCurrentDate(prevWeek);
            setTimeout(() => {
                const weekStartDay = startOfWeek(prevWeek, { weekStartsOn: 1 });
                const el = scrollContainerRef.current?.querySelector(`#week-${format(weekStartDay, 'yyyy-MM-dd')}`);
                if (el && scrollContainerRef.current) {
                    const containerTop = scrollContainerRef.current.getBoundingClientRect().top;
                    const elTop = el.getBoundingClientRect().top;
                    scrollContainerRef.current.scrollTo({ top: elTop - containerTop + scrollContainerRef.current.scrollTop - 120, behavior: 'smooth' });
                }
            }, 50);
        }
    };

    const onDateClick = (day: Date) => setSelectedDate(day);


    const renderDays = () => {
        const days = [];
        const dateFormat = "EEE";
        let loopStart = startDate;

        for (let i = 0; i < 7; i++) {
            days.push(
                <div className="text-[10px] sm:text-xs font-bold text-white/50 text-center uppercase py-2 sm:py-3" key={i}>
                    {format(addDays(loopStart, i), dateFormat)}
                </div>
            );
        }
        return (
            <div className="grid grid-cols-7 mb-4 sticky top-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/10 -mx-1 px-1 sm:-mx-2 sm:px-2 rounded-none sm:rounded-t-xl shadow-md">
                {days}
            </div>
        );
    };

    // Khối render chính cho View Tháng (Month). Load mảng dữ liệu cuộn (infinite scroll bounds).
    const renderMonthCells = () => {
        const dateFormat = "d";
        const monthGrids = [];
        let currentIterMonth = subMonths(currentDate, 3);
        const endListMonth = addMonths(currentDate, 6);

        while (currentIterMonth <= endListMonth) {
            const iterMonthStart = startOfMonth(currentIterMonth);
            const iterMonthEnd = endOfMonth(iterMonthStart);
            const iterStartDate = startOfWeek(iterMonthStart, { weekStartsOn: 1 });
            const iterEndDate = endOfWeek(iterMonthEnd, { weekStartsOn: 1 });

            const rows = [];
            let days = [];
            let day = iterStartDate;

            const isCurrentCenterMonth = isSameMonth(currentIterMonth, currentDate);

            while (day <= iterEndDate) {
                for (let i = 0; i < 7; i++) {
                    const cloneDay = day;
                    const formattedDate = format(day, dateFormat);
                    const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                    const belongsToIterMonth = isSameMonth(day, currentIterMonth);
                    const isToday = isSameDay(day, new Date());

                    const dayEvents = events.filter(e => isSameDay(parseISO(e.date), cloneDay));
                    const hasHardDeadline = dayEvents.some(e => e.is_hard_deadline);

                    days.push(
                        <div
                            className={`relative p-2 flex flex-col items-center justify-start cursor-pointer rounded-xl transition-all min-h-[90px] lg:min-h-[110px] border border-white/5
                                ${!belongsToIterMonth ? "text-white/20 hover:text-white/40 bg-white/[0.02]" : "text-white/80 hover:bg-white/10 bg-white/5"}
                                ${isSelected ? "ring-2 ring-indigo-500/50 bg-indigo-500/10" : ""}
                            `}
                            key={day.toString()}
                            onClick={() => onDateClick(cloneDay)}
                        >

                            {hasHardDeadline && belongsToIterMonth && (
                                <div className="absolute inset-0 bg-red-500/10 blur-[10px] -z-0 pointer-events-none" />
                            )}

                            <span className={`text-sm z-10 mb-2 font-medium ${isToday ? "text-indigo-400 bg-indigo-500/20 w-7 h-7 flex items-center justify-center rounded-full" : ""}`}>
                                {formattedDate}
                            </span>


                            <div className="flex flex-wrap justify-center gap-1 sm:gap-1.5 z-10 w-full px-0.5">
                                {dayEvents.slice(0, 4).map((e, idx) => {
                                    const { title, note, time, duration } = getTaskDisplayInfo(e);
                                    return (
                                        <div key={idx} className="relative group/tooltip">
                                            <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md flex items-center justify-center border transition-transform hover:scale-110 ${e.is_hard_deadline ? 'bg-red-500/20 border-red-500/30 text-red-400' : e.is_task ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400'}`}>
                                                {e.is_hard_deadline ? <AlertTriangle className="w-3 sm:w-3.5 h-3 sm:h-3.5" /> : e.is_task ? <Zap className="w-3 sm:w-3.5 h-3 sm:h-3.5" /> : <Clock className="w-3 sm:w-3.5 h-3 sm:h-3.5" />}
                                            </div>


                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:flex flex-col items-center z-[60] w-max max-w-[150px] sm:max-w-[200px]">
                                                <div className="bg-gray-900 border border-white/10 text-white text-[10px] sm:text-xs px-3 py-2 rounded-xl shadow-2xl text-center break-words pointer-events-none whitespace-normal leading-relaxed ring-1 ring-white/20">
                                                    <div className="font-bold text-white mb-0.5">{title}</div>
                                                    {(time || duration) && (
                                                        <div className="flex items-center justify-center gap-2 text-indigo-300 font-medium text-[9px] sm:text-[10px] my-1">
                                                            {time && <span>{time}</span>}
                                                            {time && duration && <span className="w-1 h-1 rounded-full bg-white/30" />}
                                                            {duration && <span>{duration}</span>}
                                                        </div>
                                                    )}
                                                    {note && (
                                                        <div className="text-white/70 text-[9px] sm:text-[10px] mt-1 text-left whitespace-pre-wrap border-t border-white/10 pt-1.5 font-normal line-clamp-4">
                                                            {note}
                                                        </div>
                                                    )}
                                                    {e.is_hard_deadline && <div className="text-red-400 text-[10px] mt-1.5 font-bold border-t border-white/10 pt-1">DEADLINE CỨNG</div>}
                                                    {e.is_task && <div className={`text-[10px] mt-1.5 font-bold border-t border-white/10 pt-1 ${e.energy_required && e.energy_required > 3 ? 'text-rose-400' : e.energy_required === 3 ? 'text-amber-400' : 'text-emerald-400'}`}>⚡ TỐN {e.energy_required || 3} PIN</div>}
                                                </div>
                                                <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[4px] border-l-transparent border-r-transparent border-t-white/20 -mt-[1px]" />
                                            </div>
                                        </div>
                                    );
                                })}
                                {dayEvents.length > 4 && (
                                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-white/10 flex items-center justify-center text-[10px] sm:text-xs font-medium text-white/50 cursor-pointer" title={`${dayEvents.length - 4} sự kiện khác`}>
                                        +{dayEvents.length - 4}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                    day = addDays(day, 1);
                }
                rows.push(
                    <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-1 sm:mb-2" key={day.toString()}>
                        {days}
                    </div>
                );
                days = [];
            }

            monthGrids.push(
                <div
                    key={currentIterMonth.toString()}
                    id={`month-${format(currentIterMonth, 'MM-yyyy')}`}
                    className={`mb-8 ${isCurrentCenterMonth ? 'center-month-marker' : ''}`}
                >
                    <div className="sticky top-[3.5rem] sm:top-[4rem] z-30 flex justify-center mb-0 sm:mb-2 pointer-events-none -mt-4 sm:-mt-6">
                        <h3 className="text-[10px] sm:text-xs font-bold text-white/70 uppercase tracking-widest pointer-events-auto bg-[#17171f]/80 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/5 shadow-lg shadow-black/20">
                            Tháng {format(currentIterMonth, "M / yyyy")}
                        </h3>
                    </div>
                    <div className="bg-black/20 rounded-2xl p-2 sm:p-4 border border-white/5 shadow-inner mt-4 sm:mt-6">
                        {rows}
                    </div>
                </div>
            );

            currentIterMonth = addMonths(currentIterMonth, 1);
        }

        return <div>{monthGrids}</div>;
    };


    const renderWeekList = () => {
        const days = [];
        let day = subDays(startDate, 28);
        const endListDate = addDays(endDate, 84);
        const today = new Date();

        while (day <= endListDate) {
            const cloneDay = day;
            const formattedDate = format(cloneDay, "d");
            const formattedDayName = format(cloneDay, "EEE");
            const dayEvents = events.filter(e => isSameDay(parseISO(e.date), cloneDay));
            const isSelected = selectedDate ? isSameDay(cloneDay, selectedDate) : false;
            const isToday = isSameDay(cloneDay, today);

            if (isSameDay(cloneDay, startOfWeek(cloneDay, { weekStartsOn: 1 }))) {
                let weekLabel = "";
                let highlightLevel = "";
                if (isSameWeek(cloneDay, today, { weekStartsOn: 1 })) {
                    weekLabel = `Tuần này (${format(cloneDay, "dd/MM")} - ${format(addDays(cloneDay, 6), "dd/MM")})`;
                    highlightLevel = "border-indigo-500 bg-indigo-500/20 text-indigo-200";
                } else if (isSameWeek(cloneDay, addWeeks(today, 1), { weekStartsOn: 1 })) {
                    weekLabel = `Tuần sau (${format(cloneDay, "dd/MM")} - ${format(addDays(cloneDay, 6), "dd/MM")})`;
                    highlightLevel = "border-indigo-500/30 bg-indigo-500/10 text-indigo-300";
                } else if (isSameWeek(cloneDay, subWeeks(today, 1), { weekStartsOn: 1 })) {
                    weekLabel = `Tuần trước (${format(cloneDay, "dd/MM")} - ${format(addDays(cloneDay, 6), "dd/MM")})`;
                    highlightLevel = "border-white/20 bg-white/10 text-white/70";
                } else {
                    weekLabel = `Tuần ${format(cloneDay, "dd/MM")} - ${format(addDays(cloneDay, 6), "dd/MM")}`;
                    highlightLevel = "border-white/10 bg-black/20 text-white/50";
                }

                const isCurrentCenterWeek = isSameWeek(cloneDay, currentDate, { weekStartsOn: 1 });

                days.push(
                    <div
                        key={`week-${cloneDay.toString()}`}
                        className={`sticky top-0 z-40 flex items-center justify-center py-2 mb-4 -mx-1 sm:-mx-2 px-1 sm:px-2 bg-[#17171f]/60 backdrop-blur-md border-b border-white/5 shadow-md shadow-black/20 ${isCurrentCenterWeek ? 'center-week-marker' : ''}`}
                    >
                        <span className={`text-[10px] sm:text-xs font-bold px-3 py-1 sm:px-4 sm:py-1.5 rounded-full border shadow-sm ${highlightLevel} bg-black/50`}>
                            {weekLabel}
                        </span>
                    </div>
                );
            }

            days.push(
                <div
                    id={isSameDay(cloneDay, startOfWeek(cloneDay, { weekStartsOn: 1 })) ? `week-${format(cloneDay, 'yyyy-MM-dd')}` : undefined}
                    key={cloneDay.toString()}
                    className={`flex flex-col sm:flex-row gap-4 mb-6 relative w-full overflow-hidden ${isToday ? 'today-marker' : ''}`}
                >

                    <div
                        className="flex flex-row sm:flex-col items-center sm:min-w-[60px] cursor-pointer gap-2 sm:gap-1 mt-1 shrink-0"
                        onClick={() => onDateClick(cloneDay)}
                    >
                        <div className={`w-12 h-12 rounded-full flex flex-col items-center justify-center transition-all ${isToday ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : isSelected ? 'bg-white/10 text-white ring-2 ring-indigo-500/50' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}>
                            <span className="text-lg font-bold leading-none">{formattedDate}</span>
                        </div>
                        <span className={`text-xs mt-0 sm:mt-1 font-medium sm:font-normal uppercase ${isToday ? 'text-indigo-400' : 'text-white/50'}`}>
                            {formattedDayName}
                        </span>
                    </div>


                    <div className="flex-1 flex flex-col gap-3 min-w-0">
                        {dayEvents.length === 0 ? (
                            <div className="h-14 rounded-2xl border border-dashed border-white/5 flex items-center justify-center text-white/20 text-xs italic bg-white/[0.01]">
                                Chưa có sự kiện
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {dayEvents.sort((a, b) => {
                                    const timeA = getTaskDisplayInfo(a).timeValue;
                                    const timeB = getTaskDisplayInfo(b).timeValue;
                                    return timeA - timeB;
                                }).map(e => {
                                    const { title, note, time, duration } = getTaskDisplayInfo(e);
                                    return (
                                        <motion.div
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            key={e.id}
                                            className={`group flex items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl border transition-colors ${e.is_hard_deadline ? 'bg-red-500/5 border-red-500/10 hover:border-red-500/30' : e.is_task ? 'bg-emerald-500/5 border-emerald-500/10 hover:border-emerald-500/30' : 'bg-indigo-500/5 border-indigo-500/10 hover:border-indigo-500/30'}`}
                                        >
                                            <div className={`mt-0.5 sm:mt-0 w-10 h-10 shrink-0 rounded-xl flex items-center justify-center shadow-inner ${e.is_hard_deadline ? 'bg-red-500/20 text-red-500' : e.is_task ? 'bg-emerald-500/20 text-emerald-500' : 'bg-indigo-500/20 text-indigo-400'}`}>
                                                {e.is_hard_deadline ? <AlertTriangle className="w-5 h-5" /> : e.is_task ? <Zap className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                            </div>
                                            <div className="flex-1 min-w-0 pr-2 overflow-hidden flex flex-col justify-center">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h4 className={`text-sm sm:text-base font-bold truncate ${e.is_hard_deadline ? 'text-red-200' : e.is_task ? 'text-emerald-100' : 'text-indigo-100'}`}>
                                                        {title}
                                                    </h4>
                                                    {(time || duration) && (
                                                        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-md bg-black/20 text-white/70 border border-white/5 whitespace-nowrap">
                                                            {time && <span>Bắt đầu lúc {time}</span>}
                                                            {time && duration && <span className="w-1 h-1 rounded-full bg-white/30" />}
                                                            {duration && <span>{duration}</span>}
                                                        </div>
                                                    )}
                                                </div>
                                                {note && (
                                                    <p className="text-xs text-white/50 mt-1.5 line-clamp-2 md:line-clamp-3 whitespace-pre-wrap leading-relaxed">
                                                        {note}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-start sm:items-center gap-2 sm:gap-3 shrink-0 self-start sm:self-center mt-1 sm:mt-0">

                                                <span className={`text-[10px] sm:text-xs px-2 py-1 rounded-md hidden sm:block font-medium ${e.is_hard_deadline ? 'bg-red-500/20 text-red-300' : e.is_task ? 'bg-emerald-500/20 text-emerald-300' : 'bg-indigo-500/20 text-indigo-300'}`}>
                                                    {e.is_hard_deadline ? 'Deadline' : e.is_task ? 'Task' : 'Event'}
                                                </span>
                                                {e.is_task && (() => {
                                                    const en = e.energy_required || 3;
                                                    const BattIcon = en === 1 ? BatteryWarning : en === 2 ? BatteryLow : en === 3 ? BatteryMedium : en === 4 ? BatteryFull : BatteryCharging;
                                                    return (
                                                        <span className={`flex items-center gap-1 text-[10px] sm:text-xs px-2 py-1 rounded-md font-medium shrink-0 ${en > 3 ? 'bg-rose-500/20 text-rose-300' : en === 3 ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                                                            <BattIcon className="w-3.5 h-3.5" />
                                                            <span className="flex gap-px">
                                                                {[1, 2, 3, 4, 5].map(i => <span key={i} className={`w-1 h-2 rounded-[1px] ${i <= en ? 'bg-current' : 'bg-current opacity-20'}`} />)}
                                                            </span>
                                                        </span>
                                                    );
                                                })()}
                                                <button
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        openEditModal(e);
                                                    }}
                                                    className="p-2 rounded-lg bg-black/20 hover:bg-indigo-500/80 text-white/30 hover:text-white transition-all sm:opacity-0 sm:group-hover:opacity-100"
                                                    title="Chỉnh sửa & Xóa"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            );
            day = addDays(day, 1);
        }

        return <div className="flex flex-col mt-4 w-full">{days}</div>;
    };

    const handleAddEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDate || !newEventTitle.trim()) return;

        setIsSubmitting(true);
        try {

            const dateStr = format(selectedDate, 'yyyy-MM-dd');

            let finalNote = newNote;
            if (isTaskMode) {
                const timeParts = [];
                if (taskStartTime) timeParts.push(`Bắt đầu: ${taskStartTime}`);
                if (taskDuration) timeParts.push(`Thời lượng: ${taskDuration}`);
                if (timeParts.length > 0) {
                    finalNote = timeParts.join(' | ') + (newNote ? `\nChi tiết: ${newNote}` : '');
                }
                await createCalendarTask(newEventTitle, finalNote, dateStr, Math.round(newEnergy));
            } else {
                await createEvent(newEventTitle, dateStr, isHardDeadline);
            }


            setNewEventTitle('');
            setNewNote('');
            setNewEnergy(3);
            setTaskStartTime('');
            setTaskDuration('');
            setIsAddingEvent(false);
        } catch (error) {
            console.error("Failed to add event/task:", error);
            alert("Lỗi khi thêm. Vui lòng thử lại.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteEvent = async (id: string, isTask?: boolean) => {
        try {

            setEvents(prev => prev.filter(e => e.id !== id));
            if (isTask) {
                await deleteCalendarTask(id);
            } else {
                await deleteEvent(id);
            }
        } catch (error) {
            console.error("Failed to delete:", error);
        }
    }


    const selectedDateEvents = selectedDate
        ? events.filter(e => {
            if (!e.date) return false;
            const eDate = parseISO(e.date);
            return eDate && selectedDate && isSameDay(eDate, selectedDate);
        })
        : [];

    return (
        <div className="liquid-glass rounded-3xl p-4 md:p-6 shadow-2xl flex flex-col relative h-[500px] md:h-[600px] lg:h-[700px]">

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
                <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                    <CalendarIcon className="w-5 h-5 text-indigo-400" />
                    {viewMode === 'month'
                        ? format(currentDate, "MMMM yyyy")
                        : "Lịch Trình Chi Tiết"
                    }
                </h2>
                <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="flex bg-black/20 rounded-lg p-1 border border-white/10">
                        <button
                            onClick={() => {
                                setViewMode('week');
                                setCurrentDate(new Date());
                            }}
                            className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors ${viewMode === 'week' ? 'bg-indigo-500/20 text-indigo-300' : 'text-white/50 hover:text-white/80'}`}
                        >
                            <ListTodo className="w-4 h-4" /> Tuần
                        </button>
                        <button
                            onClick={() => {
                                setViewMode('month');
                                setCurrentDate(new Date());
                            }}
                            className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors ${viewMode === 'month' ? 'bg-indigo-500/20 text-indigo-300' : 'text-white/50 hover:text-white/80'}`}
                        >
                            <LayoutGrid className="w-4 h-4" /> Tháng
                        </button>
                    </div>
                    <div className="flex gap-1.5 border border-white/10 bg-black/20 rounded-full p-1">
                        <button onClick={prevPeriod} className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
                            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white/70" />
                        </button>
                        <button onClick={nextPeriod} className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
                            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-white/70" />
                        </button>
                    </div>
                </div>
            </div>


            <div ref={scrollContainerRef} className="flex-1 w-full flex flex-col overflow-y-auto custom-scrollbar pr-1 sm:pr-2 relative">
                {viewMode === 'month' ? (
                    <>
                        {renderDays()}
                        {renderMonthCells()}
                    </>
                ) : (
                    renderWeekList()
                )}
            </div>


            <button
                data-tour="add-event"
                onClick={() => setIsAddingEvent(true)}
                title="Thêm nhắc nhở / Sự kiện"
                className="absolute bottom-6 right-6 p-4 bg-indigo-500 hover:bg-indigo-600 rounded-full text-white shadow-lg shadow-indigo-500/25 transition-transform hover:scale-110 z-20"
            >
                <Plus className="w-6 h-6" />
            </button>


            {mounted && createPortal(
                <AnimatePresence>
                    {isAddingEvent && (
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                                onClick={() => setIsAddingEvent(false)}
                            />
                            <motion.form
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                onSubmit={handleAddEvent}
                                className="relative w-full max-w-md bg-[#1e1e24] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl z-10"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="text-xl font-bold text-white">Thêm Lịch Trình Mới</h3>
                                        <p className="text-sm text-white/50 mt-1">
                                            Vào Ngày: {selectedDate ? format(selectedDate, "dd/MM/yyyy") : ''}
                                        </p>
                                    </div>
                                    <button type="button" onClick={() => setIsAddingEvent(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                                        <X className="w-5 h-5 text-white/50 hover:text-white" />
                                    </button>
                                </div>


                                <div className="flex bg-black/30 p-1 rounded-xl mb-6 border border-white/5">
                                    <button
                                        type="button"
                                        onClick={() => setIsTaskMode(false)}
                                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${!isTaskMode ? 'bg-indigo-500 text-white shadow-md' : 'text-white/50 hover:text-white/80'}`}
                                    >
                                        Sự kiện / Deadline
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsTaskMode(true)}
                                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${isTaskMode ? 'bg-emerald-500 text-white shadow-md' : 'text-white/50 hover:text-white/80'}`}
                                    >
                                        <Zap className="w-4 h-4" /> Bổ sung Nhiệm Vụ
                                    </button>
                                </div>

                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-white/70 mb-2">
                                            {isTaskMode ? 'Tên Nhiệm vụ' : 'Tên Sự kiện / Cuộc hẹn'}
                                        </label>
                                        <input
                                            type="text"
                                            value={newEventTitle}
                                            onChange={(e) => setNewEventTitle(e.target.value)}
                                            placeholder={isTaskMode ? "Ví dụ: Đọc 20 trang sách..." : "Ví dụ: Cuộc họp Team / Thi cuối kì..."}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                                            autoFocus
                                        />
                                    </div>

                                    {isTaskMode ? (
                                        <>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-white/70 mb-2">Bắt đầu lúc (Tùy chọn)</label>
                                                    <IOSTimePicker
                                                        value={taskStartTime || ''}
                                                        onChange={(val) => setTaskStartTime(val || '')}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-white/70 mb-2">Thời lượng ước tính</label>
                                                    <CustomDropdown
                                                        value={taskDuration}
                                                        onChange={setTaskDuration}
                                                        options={durationOptions}
                                                        placeholder="Tùy tâm"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-white/70 mb-2">
                                                    Ghi chú / Mô tả (Note)
                                                </label>
                                                <textarea
                                                    value={newNote}
                                                    onChange={(e) => setNewNote(e.target.value)}
                                                    placeholder="Nhập thông tin chi tiết cần nhớ cho nhiệm vụ này..."
                                                    className="w-full h-24 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow resize-none custom-scrollbar"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-white/70 mb-2 flex justify-between">
                                                    <span>Loại Task - Mức năng lượng rút pin</span>
                                                    <div className={`flex items-center gap-1.5 px-2 py-1 bg-black/20 rounded-lg border backdrop-blur-md transition-colors ${Math.round(newEnergy) > 3 ? 'border-rose-500/20 text-rose-300' : Math.round(newEnergy) === 3 ? 'border-amber-500/20 text-amber-300' : 'border-emerald-500/20 text-emerald-300'}`}>
                                                        {Math.round(newEnergy) === 1 && <BatteryWarning className="w-4 h-4" />}
                                                        {Math.round(newEnergy) === 2 && <BatteryLow className="w-4 h-4" />}
                                                        {Math.round(newEnergy) === 3 && <BatteryMedium className="w-4 h-4" />}
                                                        {Math.round(newEnergy) === 4 && <BatteryFull className="w-4 h-4" />}
                                                        {Math.round(newEnergy) === 5 && <BatteryCharging className="w-4 h-4" />}
                                                        <div className="flex gap-0.5 ml-0.5">
                                                            {[1, 2, 3, 4, 5].map(i => (
                                                                <div key={i} className={`w-1.5 h-2.5 rounded-[1px] ${i <= Math.round(newEnergy) ? 'bg-current' : 'bg-current opacity-20'}`} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </label>
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="5"
                                                    step="0.1"
                                                    value={newEnergy}
                                                    onChange={(e) => setNewEnergy(Number(e.target.value))}
                                                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                                />
                                                <div className="flex justify-between text-xs text-white/40 mt-2 px-1">
                                                    <span>Siêu Nhẹ</span>
                                                    <span>Trung bình</span>
                                                    <span>Vắt kiệt</span>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className={`border rounded-xl p-4 cursor-pointer transition-colors ${isHardDeadline ? 'bg-red-500/10 border-red-500/30' : 'bg-white/5 border-white/10 hover:bg-white/10'}`} onClick={() => setIsHardDeadline(!isHardDeadline)}>
                                            <label className="flex items-start gap-3 cursor-pointer">
                                                <div className="mt-0.5 pointer-events-none">
                                                    <input
                                                        type="checkbox"
                                                        checked={isHardDeadline}
                                                        readOnly
                                                        className="w-5 h-5 rounded border-white/20 bg-black/40 text-red-500 focus:ring-red-500/50"
                                                    />
                                                </div>
                                                <div>
                                                    <span className={`block font-medium ${isHardDeadline ? 'text-red-400' : 'text-white/80'}`}>
                                                        Đánh dấu là Deadline Cứng (Cảnh Báo)
                                                    </span>
                                                    <span className="block text-sm text-white/50 mt-1">
                                                        AI sẽ tuyệt đối không xếp thêm Task trùng vào ngày này. Dành cho ngày quá mệt hoặc kẹt lịch cứng.
                                                    </span>
                                                </div>
                                            </label>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-8 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddingEvent(false)}
                                        className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/80 hover:text-white text-sm font-medium transition-colors"
                                    >
                                        Hủy bỏ
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!newEventTitle.trim() || isSubmitting}
                                        className="flex-1 py-3 px-4 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 rounded-xl text-white text-sm font-bold shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? 'Đang lưu...' : (
                                            <>
                                                <Plus className="w-4 h-4" /> Lưu Sự Kiện
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.form>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}


            {mounted && createPortal(
                <AnimatePresence>
                    {editingEvent && (
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                                onClick={() => setEditingEvent(null)}
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="relative w-full max-w-lg bg-[#1e1e24] border border-white/10 rounded-3xl shadow-2xl z-10 flex flex-col max-h-[90vh]"
                            >
                                <div className="flex items-center justify-between p-6 md:p-8 pb-4 shrink-0">
                                    <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-emerald-400 drop-shadow-sm">
                                        Chỉnh sửa {editingEvent?.is_task ? 'Nhiệm vụ' : 'Sự kiện'}
                                    </h3>
                                    <button type="button" onClick={() => setEditingEvent(null)} className="p-2 hover:bg-white/10 text-white/50 hover:text-white rounded-full transition-colors bg-black/20 sm:bg-transparent shrink-0">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="overflow-y-auto custom-scrollbar px-6 md:px-8 pb-6 md:pb-8">
                                    <form onSubmit={handleSaveEdit} className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-medium text-white/70 mb-2">Tên {editingEvent?.is_task ? 'nhiệm vụ' : 'sự kiện'}</label>
                                            <input
                                                type="text"
                                                value={editEventTitle}
                                                onChange={(e) => setEditEventTitle(e.target.value)}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                                            />
                                        </div>

                                        {editingEvent?.is_task ? (
                                            <>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-white/70 mb-2">Bắt đầu lúc</label>
                                                        <IOSTimePicker value={editStartTime || ''} onChange={(val) => setEditStartTime(val || '')} />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-white/70 mb-2">Thời lượng</label>
                                                        <CustomDropdown value={editDuration} onChange={setEditDuration} options={durationOptions} placeholder="Tùy tâm" />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-white/70 mb-2 flex justify-between">
                                                        <span>Năng lượng tiêu hao</span>
                                                        <div className={`flex items-center gap-1.5 px-2 py-1 bg-black/20 rounded-lg border backdrop-blur-md transition-colors ${Math.round(editEnergy) > 3 ? 'border-rose-500/20 text-rose-300' : Math.round(editEnergy) === 3 ? 'border-amber-500/20 text-amber-300' : 'border-emerald-500/20 text-emerald-300'}`}>
                                                            {Math.round(editEnergy) === 1 && <BatteryWarning className="w-4 h-4" />}
                                                            {Math.round(editEnergy) === 2 && <BatteryLow className="w-4 h-4" />}
                                                            {Math.round(editEnergy) === 3 && <BatteryMedium className="w-4 h-4" />}
                                                            {Math.round(editEnergy) === 4 && <BatteryFull className="w-4 h-4" />}
                                                            {Math.round(editEnergy) === 5 && <BatteryCharging className="w-4 h-4" />}
                                                            <div className="flex gap-0.5 ml-0.5">
                                                                {[1, 2, 3, 4, 5].map(i => (
                                                                    <div key={i} className={`w-1.5 h-2.5 rounded-[1px] ${i <= Math.round(editEnergy) ? 'bg-current' : 'bg-current opacity-20'}`} />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </label>
                                                    <input
                                                        type="range"
                                                        min="1"
                                                        max="5"
                                                        step="0.1"
                                                        value={editEnergy}
                                                        onChange={(e) => setEditEnergy(Number(e.target.value))}
                                                        className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                                    />
                                                    <div className="flex justify-between text-xs text-white/40 mt-2 px-1">
                                                        <span>Siêu Nhẹ</span>
                                                        <span>Trung bình</span>
                                                        <span>Vắt kiệt</span>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className={`border rounded-xl p-4 cursor-pointer transition-colors ${editIsHardDeadline ? 'bg-red-500/10 border-red-500/30' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                                                <label className="flex items-start gap-3 cursor-pointer">
                                                    <div className="mt-0.5 pointer-events-none">
                                                        <input
                                                            type="checkbox"
                                                            checked={editIsHardDeadline}
                                                            readOnly
                                                            className="w-5 h-5 rounded border-white/20 bg-black/40 text-red-500 focus:ring-red-500/50"
                                                        />
                                                    </div>
                                                    <div>
                                                        <span className={`block font-medium ${editIsHardDeadline ? 'text-red-400' : 'text-white/80'}`}>
                                                            Đánh dấu là Deadline Cứng (Cảnh Báo)
                                                        </span>
                                                    </div>
                                                </label>
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-sm font-medium text-white/70 mb-2">Ghi chú chi tiết</label>
                                            <textarea
                                                value={editNote}
                                                onChange={(e) => setEditNote(e.target.value)}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px] resize-none"
                                                placeholder="Nhập ghi chú hoặc mô tả..."
                                            />
                                        </div>

                                        <div className="pt-4 border-t border-white/10 flex justify-between items-center gap-4">
                                            <button
                                                type="button"
                                                onClick={confirmDeleteEditing}
                                                className="flex items-center gap-2 px-4 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl transition-colors font-medium border border-rose-500/20"
                                            >
                                                <Trash2 className="w-4 h-4" /> Xóa
                                            </button>

                                            <button
                                                type="submit"
                                                disabled={editSubmitting || !editEventTitle.trim()}
                                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 text-white rounded-xl transition-colors font-medium shadow-lg shadow-indigo-500/25"
                                            >
                                                {editSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                                Lưu Thay Đổi
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            <ConfirmModal
                isOpen={!!confirmDeleteTarget}
                title="Xóa Lịch Trình?"
                message="Bạn có chắc chắn muốn xóa lịch trình này? Hành động này không thể hoàn tác."
                confirmLabel="Xóa"
                cancelLabel="Quay lại"
                onConfirm={executeConfirmedDelete}
                onCancel={() => setConfirmDeleteTarget(null)}
                variant="warning"
            />
        </div>
    );
}

