/** UI Component: Hướng dẫn luồng sử dụng cho người dùng mới (Onboarding Flow). */
'use client'

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import confetti from 'canvas-confetti';
import { X, ChevronRight, ChevronLeft, Sparkles, Hand, CalendarDays, Target, BrainCircuit, Moon, BatteryCharging, RotateCcw, Plus, HelpCircle } from 'lucide-react';

interface TourStep {
    target: string;
    icon: any;
    title: string;
    description: string;
    color: string;
    position: 'top' | 'bottom' | 'left' | 'right' | 'center';
    scrollTo?: boolean;
    hasSwipeDemo?: boolean;
}

const TOUR_STEPS: TourStep[] = [
    {
        target: '',
        icon: Sparkles,
        title: 'Chào mừng đến AI Life Coach! 🚀',
        description: 'Ứng dụng giúp bạn quản lý mục tiêu dài hạn một cách thông minh. Hãy để mình hướng dẫn bạn qua các tính năng chính nhé!',
        color: 'from-indigo-500 to-purple-500',
        position: 'center',
    },
    {
        target: '[data-tour="add-goal"]',
        icon: Target,
        title: 'Tạo Mục Tiêu Mới',
        description: 'Nhấn vào nút này để bắt đầu trò chuyện với AI và khai báo mục tiêu dài hạn của bạn. AI sẽ giúp bạn lập lộ trình chi tiết.',
        color: 'from-indigo-500 to-blue-500',
        position: 'bottom',
        scrollTo: true,
    },
    {
        target: '[data-tour="goal"]',
        icon: Target,
        title: 'Mục Tiêu & Đếm Ngược',
        description: 'Mỗi mục tiêu có bộ đếm ngược real-time. Bạn có thể tạo nhiều mục tiêu song song. Nhấn biểu tượng 🗑️ để xóa khi không cần nữa.',
        color: 'from-emerald-500 to-teal-500',
        position: 'bottom',
        scrollTo: true,
    },
    {
        target: '[data-tour="checkin"]',
        icon: BatteryCharging,
        title: 'Điểm Danh Buổi Sáng',
        description: 'Mỗi sáng, chọn mức Pin năng lượng của bạn. Điều này giúp AI tự động sắp xếp lại việc phù hợp với thể trạng hôm nay.',
        color: 'from-amber-500 to-orange-500',
        position: 'bottom',
        scrollTo: true,
    },
    {
        target: '[data-tour="tasks"]',
        icon: Hand,
        title: 'Vuốt Thẻ Nhiệm Vụ ← →',
        description: 'Thử vuốt thẻ bên dưới! Vuốt TRÁI ✅ để hoàn thành, vuốt PHẢI ❌ để dời lịch. Ngoài ra bạn có thể sắp xếp thẻ theo nhu cầu của mình',
        color: 'from-rose-500 to-pink-500',
        position: 'right',
        scrollTo: true,
        hasSwipeDemo: true,
    },
    {
        target: '[data-tour="ai-controls"]',
        icon: BrainCircuit,
        title: 'AI Huấn Luyện Viên',
        description: 'Nhấn "AI Làm mới" để AI phân tích dữ liệu và cấu trúc lại lộ trình. Bật "AI 4:00 AM" để AI tự động làm mỗi đêm khi bạn ngủ. (coming soon :>)',
        color: 'from-violet-500 to-purple-500',
        position: 'bottom',
        scrollTo: true,
    },
    {
        target: '[data-tour="calendar"]',
        icon: CalendarDays,
        title: 'Lịch Trình Trực Quan',
        description: 'Lịch tích hợp hiển thị cả Tasks lẫn Sự kiện cứng (thi cử, deadline). Nhấn vào ngày để thêm sự kiện mới. Nhấn vào sự kiện để xem chi tiết hoặc xóa.',
        color: 'from-sky-500 to-blue-500',
        position: 'left',
        scrollTo: true,
    },
    {
        target: '[data-tour="add-event"]',
        icon: Plus,
        title: 'Thêm Lịch Trình Nhanh',
        description: 'Nhấn vào dấu + này để tạo nhanh 1 nhiệm vụ rời rạc hoặc sự kiện cố định mà không cần AI lên kế hoạch dài hạn.',
        color: 'from-fuchsia-500 to-pink-500',
        position: 'left',
        scrollTo: true,
    },
    {
        target: '[data-tour="night-reflection"]',
        icon: Moon,
        title: 'Ghi Chú Buổi Tối',
        description: 'Cuối ngày, viết một dòng chia sẻ cảm nhận cho AI. Dữ liệu này giúp AI hiểu bạn hơn và đưa lời khuyên chính xác hơn. (coming soon :>)',
        color: 'from-indigo-500 to-blue-500',
        position: 'top',
        scrollTo: true,
    },
    {
        target: '',
        icon: RotateCcw,
        title: 'Sẵn Sàng! 🏁',
        description: 'Nếu mới bắt đầu, hãy ấn "Nạp Dữ Liệu Demo" hoặc tạo mục tiêu mới để trải nghiệm đầy đủ. Bạn luôn có thể nhấn nút "?" ở góc phải để xem lại hướng dẫn này. Chúc bạn chinh phục mục tiêu! 💪',
        color: 'from-emerald-500 to-cyan-500',
        position: 'center',
    },
];

const STORAGE_KEY = 'ai-coach-tour-seen';
const PADDING = 12;
const BORDER_RADIUS = 20;

function DemoSwipeCard({ onSwiped }: { onSwiped: () => void }) {
    const [swiped, setSwiped] = useState(false);
    const [swipeDir, setSwipeDir] = useState<'left' | 'right' | null>(null);
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-150, 150], [-8, 8]);
    const opRight = useTransform(x, [30, 120], [0, 1]);
    const opLeft = useTransform(x, [-30, -120], [0, 1]);

    const handleDragEnd = (_: any, info: any) => {
        const offset = info.offset.x;
        const velocity = info.velocity.x;
        if (offset > 80 || velocity > 400) {
            setSwipeDir('right');
            setSwiped(true);
            setTimeout(onSwiped, 800);
        } else if (offset < -80 || velocity < -400) {
            setSwipeDir('left');
            setSwiped(true);
            setTimeout(onSwiped, 800);
        }
    };

    if (swiped) {
        return (
            <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 0, x: swipeDir === 'right' ? 300 : -300, scale: 0.8 }}
                transition={{ duration: 0.4 }}
                className="mx-4 mb-4 rounded-2xl bg-white/5 border border-white/10 p-4 text-center"
            >
                <p className="text-sm text-white/60">
                    {swipeDir === 'left' ? '✅ Hoàn thành!' : '❌ Dời lịch!'}
                </p>
            </motion.div>
        );
    }

    return (
        <div className="relative mx-4 mb-4">

            <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
                <motion.span style={{ opacity: opLeft }} className="text-emerald-400 font-bold text-xs tracking-widest">HOÀN THÀNH</motion.span>
                <motion.span style={{ opacity: opRight }} className="text-rose-400 font-bold text-xs tracking-widest">DỜI LỊCH</motion.span>
            </div>

            <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={1}
                onDragEnd={handleDragEnd}
                style={{ x, rotate }}
                whileTap={{ scale: 0.98, cursor: 'grabbing' }}
                className="relative z-10 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/15 p-4 cursor-grab"
            >
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-white/90">👈 Kéo thử thẻ này 👉</p>
                        <p className="text-xs text-white/40 mt-0.5">Đây là nhiệm vụ demo - vuốt trái hoặc phải!</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

export default function GuidedTour() {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState(0);
    const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
    const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
    const resizeObserver = useRef<ResizeObserver | null>(null);

    useEffect(() => {
        const seen = localStorage.getItem(STORAGE_KEY);
        if (!seen) {
            const timer = setTimeout(() => setIsOpen(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    useEffect(() => {
        const handleRestartEvent = () => {
            setStep(0);
            setIsOpen(true);
        };
        window.addEventListener('restart-tour', handleRestartEvent);
        return () => window.removeEventListener('restart-tour', handleRestartEvent);
    }, []);

    const computeSpotlight = useCallback(() => {
        const current = TOUR_STEPS[step];
        if (!current.target) {
            setSpotlightRect(null);
            setTooltipStyle({
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                margin: 'auto',
                height: 'fit-content',
                maxWidth: '420px',
                width: '90vw',
                zIndex: 110,
            });
            return;
        }

        const el = document.querySelector(current.target);
        if (!el) {
            setSpotlightRect(null);
            setTooltipStyle({
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                margin: 'auto',
                height: 'fit-content',
                maxWidth: '420px',
                width: '90vw',
                zIndex: 110,
            });
            return;
        }

        const rect = el.getBoundingClientRect();
        setSpotlightRect(rect);

        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const tooltipW = Math.min(380, vw * 0.9);
        const style: React.CSSProperties = {
            position: 'fixed',
            maxWidth: `${tooltipW}px`,
            width: '90vw',
            zIndex: 110,
        };

        if (current.position === 'bottom') {
            const topPos = rect.bottom + PADDING + 8;
            if (topPos + 220 > vh) {
                style.bottom = `${vh - rect.top + PADDING + 8}px`;
            } else {
                style.top = `${topPos}px`;
            }
            const leftPos = rect.left + rect.width / 2 - tooltipW / 2;
            style.left = `${Math.max(16, Math.min(leftPos, vw - tooltipW - 16))}px`;
        } else if (current.position === 'top') {
            const bottomPos = vh - rect.top + PADDING + 8;
            if (bottomPos + 220 > vh) {
                style.top = `${rect.bottom + PADDING + 8}px`;
            } else {
                style.bottom = `${bottomPos}px`;
            }
            const leftPos = rect.left + rect.width / 2 - tooltipW / 2;
            style.left = `${Math.max(16, Math.min(leftPos, vw - tooltipW - 16))}px`;
        } else if (current.position === 'left' || current.position === 'right') {
            // On mobile (< 640px), always show tooltip above or below the element
            const isMobile = vw < 640;

            if (isMobile) {
                // Place below element if there's room, otherwise above
                const spaceBelow = vh - rect.bottom;
                const spaceAbove = rect.top;

                if (spaceBelow > 240) {
                    style.top = `${rect.bottom + PADDING + 8}px`;
                } else if (spaceAbove > 240) {
                    style.bottom = `${vh - rect.top + PADDING + 8}px`;
                } else {
                    // Absolute fallback: center vertically
                    style.top = `${Math.max(16, Math.min(rect.top, vh - 260))}px`;
                }
                style.left = `${Math.max(16, Math.min((vw - tooltipW) / 2, vw - tooltipW - 16))}px`;
            } else {
                // Desktop: try side placement
                if (current.position === 'left') {
                    const leftPos = rect.left - tooltipW - PADDING - 8;
                    if (leftPos < 16) {
                        style.left = `${rect.right + PADDING + 8}px`;
                    } else {
                        style.left = `${leftPos}px`;
                    }
                } else {
                    const leftPos = rect.right + PADDING + 8;
                    if (leftPos + tooltipW > vw - 16) {
                        style.left = `${rect.left - tooltipW - PADDING - 8}px`;
                    } else {
                        style.left = `${leftPos}px`;
                    }
                }
                const topPos = rect.top + rect.height / 2 - 110;
                style.top = `${Math.max(16, Math.min(topPos, vh - 250))}px`;
                // Clamp left to viewport
                const parsedLeft = parseFloat(style.left as string);
                if (parsedLeft < 16) style.left = '16px';
                if (parsedLeft + tooltipW > vw - 16) style.left = `${vw - tooltipW - 16}px`;
            }
        }

        setTooltipStyle(style);
    }, [step]);

    useEffect(() => {
        if (!isOpen) return;

        const current = TOUR_STEPS[step];
        const isLastStep = step === TOUR_STEPS.length - 1;

        if (isLastStep) {
            window.scrollTo({ top: 0, behavior: 'smooth' });


            const duration = 2500;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 };

            const interval: any = setInterval(function () {
                const timeLeft = animationEnd - Date.now();
                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }
                const particleCount = 50 * (timeLeft / duration);


                confetti(Object.assign({}, defaults, {
                    particleCount,
                    origin: { x: 0.1, y: Math.random() - 0.2 },
                    colors: ['#818CF8', '#A78BFA', '#F472B6', '#34D399']
                }));

                confetti(Object.assign({}, defaults, {
                    particleCount,
                    origin: { x: 0.9, y: Math.random() - 0.2 },
                    colors: ['#818CF8', '#A78BFA', '#F472B6', '#34D399']
                }));
            }, 250);
        }

        if (current.scrollTo && current.target) {
            const el = document.querySelector(current.target);
            if (el) {
                if (current.target === '[data-tour="tasks"]') {

                    const rect = el.getBoundingClientRect();
                    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                    window.scrollTo({
                        top: rect.top + scrollTop - 120,
                        behavior: 'smooth'
                    });
                } else {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                setTimeout(computeSpotlight, 400);
            } else {
                computeSpotlight();
            }
        } else {
            computeSpotlight();
        }

        const handleResize = () => computeSpotlight();
        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', handleResize, true);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleResize, true);
        };
    }, [isOpen, step, computeSpotlight]);

    const handleClose = () => {
        localStorage.setItem(STORAGE_KEY, 'true');
        setIsOpen(false);
        setStep(0);
    };

    const handleNext = () => {
        if (step < TOUR_STEPS.length - 1) {
            setStep(step + 1);
        } else {
            handleClose();
        }
    };

    const handlePrev = () => {
        if (step > 0) setStep(step - 1);
    };

    const handleRestart = () => {
        setStep(0);
        setIsOpen(true);
    };

    const current = TOUR_STEPS[step];
    const isLast = step === TOUR_STEPS.length - 1;
    const Icon = current.icon;

    const svgCutout = spotlightRect ? {
        x: spotlightRect.left - PADDING,
        y: spotlightRect.top - PADDING,
        w: spotlightRect.width + PADDING * 2,
        h: spotlightRect.height + PADDING * 2,
    } : null;

    return (
        <>

            {!isOpen && (
                <motion.button
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, type: 'spring' }}
                    onClick={handleRestart}
                    className="fixed bottom-20 right-6 z-50 w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-xl shadow-indigo-500/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
                    title="Xem hướng dẫn"
                >
                    <HelpCircle className="w-5 h-5" />
                </motion.button>
            )}

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100]"
                    >

                        <svg
                            className="fixed inset-0 w-full h-full z-[100]"
                            style={{ pointerEvents: 'none' }}
                        >
                            <defs>
                                <mask id="spotlight-mask">
                                    <rect x="0" y="0" width="100%" height="100%" fill="white" />
                                    {svgCutout && (
                                        <rect
                                            x={svgCutout.x}
                                            y={svgCutout.y}
                                            width={svgCutout.w}
                                            height={svgCutout.h}
                                            rx={BORDER_RADIUS}
                                            ry={BORDER_RADIUS}
                                            fill="black"
                                        />
                                    )}
                                </mask>
                            </defs>
                            <rect
                                x="0" y="0" width="100%" height="100%"
                                fill="rgba(0,0,0,0.75)"
                                mask="url(#spotlight-mask)"
                            />
                        </svg>


                        {svgCutout && (
                            <motion.div
                                key={`glow-${step}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="fixed z-[101] pointer-events-none"
                                style={{
                                    left: svgCutout.x,
                                    top: svgCutout.y,
                                    width: svgCutout.w,
                                    height: svgCutout.h,
                                    borderRadius: BORDER_RADIUS,
                                    border: '2px solid rgba(129, 140, 248, 0.5)',
                                    boxShadow: '0 0 30px rgba(129, 140, 248, 0.15), inset 0 0 30px rgba(129, 140, 248, 0.05)',
                                }}
                            />
                        )}


                        <AnimatePresence mode="wait">
                            <motion.div
                                key={step}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{
                                    opacity: 1,
                                    scale: 1,
                                    x: (current.position === 'center' || !current.target) ? '-50%' : 0,
                                    y: (current.position === 'center' || !current.target) ? '-50%' : 0
                                }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                style={tooltipStyle}
                                className="z-[110]"
                            >
                                <div className="bg-[#1a1a24]/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl shadow-black/40 overflow-hidden">

                                    <div className={`h-1 bg-gradient-to-r ${current.color}`} />

                                    <div className="p-5">

                                        <div className="flex gap-1 mb-4">
                                            {TOUR_STEPS.map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={`h-1 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-indigo-400' :
                                                        i < step ? 'w-3 bg-indigo-400/40' : 'w-3 bg-white/10'
                                                        }`}
                                                />
                                            ))}
                                        </div>


                                        <div className="flex items-start gap-3 mb-3">
                                            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${current.color} flex items-center justify-center shrink-0`}>
                                                <Icon className="w-4.5 h-4.5 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-base font-bold text-white leading-snug">{current.title}</h3>
                                            </div>
                                            <button
                                                onClick={handleClose}
                                                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/15 flex items-center justify-center transition-colors shrink-0"
                                            >
                                                <X className="w-3.5 h-3.5 text-white/50" />
                                            </button>
                                        </div>


                                        <p className="text-sm text-white/60 leading-relaxed mb-4 pl-12">{current.description}</p>


                                        {current.hasSwipeDemo && <DemoSwipeCard onSwiped={handleNext} />}


                                        <div className="flex items-center justify-between pl-12">
                                            <span className="text-[11px] text-white/25 font-medium tabular-nums">
                                                {step + 1} / {TOUR_STEPS.length}
                                            </span>

                                            <div className="flex gap-2">
                                                {step > 0 && (
                                                    <button
                                                        onClick={handlePrev}
                                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white text-xs font-medium transition-colors"
                                                    >
                                                        <ChevronLeft className="w-3.5 h-3.5" />
                                                        Lùi
                                                    </button>
                                                )}
                                                <button
                                                    onClick={handleNext}
                                                    className={`flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 ${isLast
                                                        ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/20'
                                                        : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20'
                                                        }`}
                                                >
                                                    {isLast ? 'Hoàn tất!' : 'Tiếp'}
                                                    {!isLast && <ChevronRight className="w-3.5 h-3.5" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>


                                {!isLast && step > 0 && (
                                    <button
                                        onClick={handleClose}
                                        className="w-full text-center mt-2 text-[11px] text-white/20 hover:text-white/50 transition-colors"
                                    >
                                        Bỏ qua hướng dẫn
                                    </button>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
