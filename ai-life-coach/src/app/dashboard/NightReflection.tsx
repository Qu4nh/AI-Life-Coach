'use client'
import { Moon } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NightReflection({ hasTasks }: { hasTasks: boolean }) {
    const [showToast, setShowToast] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleAction = (e: React.MouseEvent | React.KeyboardEvent) => {
        if (!hasTasks) {
            e.preventDefault();

            // Trigger confetti from the bottom center
            const rect = containerRef.current?.getBoundingClientRect();
            // Origin uses percentages of screen 0-1
            const yOrigin = rect ? (rect.top + rect.height / 2) / window.innerHeight : 0.9;
            const xOrigin = rect ? (rect.left + rect.width / 2) / window.innerWidth : 0.5;

            confetti({
                particleCount: 100,
                spread: 70,
                origin: { x: xOrigin, y: yOrigin },
                colors: ['#4f46e5', '#a855f7', '#ffffff'],
                zIndex: 100
            });

            setShowToast(true);
            setTimeout(() => setShowToast(false), 4000);
        }
    };

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4 sm:px-0 pointer-events-none flex flex-col items-center gap-4" data-tour="night-reflection">

            <AnimatePresence>
                {showToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="bg-indigo-900/80 backdrop-blur-md border border-indigo-500/30 text-indigo-100 px-5 py-2.5 rounded-full shadow-xl shadow-indigo-500/20 text-sm font-medium pointer-events-auto"
                    >
                        Tính năng Nhật ký AI đang được phát triển...
                    </motion.div>
                )}
            </AnimatePresence>

            <div ref={containerRef} className="liquid-glass-heavy p-2 sm:p-2.5 rounded-[32px] flex items-center gap-3 w-full pointer-events-auto relative">
                <div className="shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg border border-white/10 relative z-10">
                    <Moon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="flex-1 relative z-10">
                    <input
                        type="text"
                        onClick={handleAction}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAction(e);
                        }}
                        placeholder="Ngày hôm nay của bạn thế nào? (Kể cho AI nghe...)"
                        className="w-full bg-transparent border-none px-2 py-2 text-sm md:text-base text-white focus:outline-none focus:ring-0 placeholder:text-white/40 font-medium tracking-wide"
                    />
                </div>
                <button
                    onClick={handleAction}
                    className="shrink-0 bg-white hover:bg-white/90 text-indigo-900 font-bold px-5 py-2 sm:px-6 sm:py-2.5 rounded-full transition-transform active:scale-95 shadow-md text-sm sm:text-base relative z-10">
                    Gửi
                </button>
            </div>
        </div>
    );
}