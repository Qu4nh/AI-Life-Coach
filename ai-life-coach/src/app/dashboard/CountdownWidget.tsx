/** UI Component: Widget đếm ngược thời gian tới deadline/mục tiêu. */
'use client'

import { useState, useEffect } from 'react';
import { Hourglass } from 'lucide-react';

export default function CountdownWidget({ targetDateStr }: { targetDateStr: string }) {
    const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number } | null>(null);

    useEffect(() => {
        if (!targetDateStr) return;

        const targetDate = new Date(targetDateStr).getTime();

        const calculateTimeLeft = () => {
            const now = new Date().getTime();
            const difference = targetDate - now;

            if (difference > 0) {
                return {
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
                    seconds: Math.floor((difference % (1000 * 60)) / 1000)
                };
            }
            return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        };

        
        setTimeLeft(calculateTimeLeft());

        
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDateStr]);

    if (!timeLeft) {
        return (
            <div className="text-xs sm:text-sm font-semibold bg-indigo-500/10 text-indigo-300 px-4 py-1.5 rounded-full border border-indigo-500/20 flex w-fit items-center gap-2 shadow-inner animate-pulse">
                <Hourglass className="w-4 h-4" /> Đang tính toán...
            </div>
        );
    }

    if (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0) {
        return (
            <div className="text-xs sm:text-sm font-bold bg-rose-500/20 text-rose-300 px-4 py-1.5 rounded-full border border-rose-500/30 flex w-fit items-center gap-2 shadow-inner shadow-rose-500/20">
                🚀 Đã Cán Đích!
            </div>
        );
    }

    
    const formatNumber = (num: number) => num.toString().padStart(2, '0');

    return (
        <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="text-xs sm:text-sm font-semibold text-indigo-300 uppercase tracking-widest flex items-center gap-1.5">
                <Hourglass className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400 animate-[spin_4s_linear_infinite]" />
                Tới Đích:
            </div>
            <div className="flex items-center gap-1 bg-black/20 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg border border-white/5 shadow-inner">
                {timeLeft.days > 0 && (
                    <>
                        <div className="flex flex-col items-center">
                            <span className="text-sm sm:text-base font-bold text-white leading-none font-mono">{formatNumber(timeLeft.days)}</span>
                            <span className="text-[8px] sm:text-[9px] text-white/40 font-medium uppercase mt-0.5">Ngày</span>
                        </div>
                        <span className="text-white/20 font-bold mb-3">:</span>
                    </>
                )}
                <div className="flex flex-col items-center">
                    <span className="text-sm sm:text-base font-bold text-white leading-none font-mono">{formatNumber(timeLeft.hours)}</span>
                    <span className="text-[8px] sm:text-[9px] text-white/40 font-medium uppercase mt-0.5">Giờ</span>
                </div>
                <span className="text-white/20 font-bold mb-3">:</span>
                <div className="flex flex-col items-center">
                    <span className="text-sm sm:text-base font-bold text-white leading-none font-mono">{formatNumber(timeLeft.minutes)}</span>
                    <span className="text-[8px] sm:text-[9px] text-white/40 font-medium uppercase mt-0.5">Phút</span>
                </div>
                <span className="text-white/20 font-bold mb-3">:</span>
                <div className="flex flex-col items-center w-5 sm:w-6">
                    <span className="text-sm sm:text-base font-bold text-indigo-300 leading-none font-mono tracking-tighter w-full text-center">
                        {formatNumber(timeLeft.seconds)}
                    </span>
                    <span className="text-[8px] sm:text-[9px] text-indigo-300/40 font-medium uppercase mt-0.5">Giây</span>
                </div>
            </div>
        </div>
    );
}
