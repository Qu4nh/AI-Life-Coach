/** UI Component: Bộ chọn thời gian mô phỏng cơ chế cuộn mượt của iOS. */
'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface IOSTimePickerProps {
    value: string; 
    onChange: (val: string) => void;
}

export default function IOSTimePicker({ value, onChange }: IOSTimePickerProps) {
    
    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

    const hRef = useRef<HTMLDivElement>(null);
    const mRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [isOpen, setIsOpen] = useState(false);
    const [scrolling, setScrolling] = useState(false);
    let scrollTimeout = useRef<NodeJS.Timeout | null>(null);

    const [inputValue, setInputValue] = useState(value);

    const itemHeight = 44; 

    useEffect(() => {
        setInputValue(value);
    }, [value]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    
    useEffect(() => {
        if (!isOpen) return;

        let isScrolling = false;
        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            if (isScrolling) return;

            isScrolling = true;
            setTimeout(() => { isScrolling = false; }, 100);

            const el = e.currentTarget as HTMLElement;
            const direction = e.deltaY > 0 ? 1 : -1;

            const currentIndex = Math.round(el.scrollTop / itemHeight);
            const nextIndex = currentIndex + direction;

            el.scrollTo({ top: nextIndex * itemHeight, behavior: 'smooth' });
        };

        const hNode = hRef.current;
        const mNode = mRef.current;

        if (hNode) hNode.addEventListener('wheel', handleWheel, { passive: false });
        if (mNode) mNode.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            if (hNode) hNode.removeEventListener('wheel', handleWheel);
            if (mNode) mNode.removeEventListener('wheel', handleWheel);
        };
    }, [isOpen]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/[^0-9]/g, '');
        if (val.length > 4) val = val.slice(0, 4);

        let formatted = val;
        if (val.length >= 3) {
            formatted = `${val.slice(0, 2)}:${val.slice(2)}`;
        } else if (val.length === 0) {
            formatted = '';
        }

        setInputValue(formatted);

        if (val.length === 4) {
            const h = parseInt(val.slice(0, 2));
            const m = parseInt(val.slice(2, 4));
            
            if (h < 24 && m < 60) {
                onChange(`${val.slice(0, 2).padStart(2, '0')}:${val.slice(2, 4).padStart(2, '0')}`);
            }
        } else if (val.length === 0) {
            onChange('');
        }
    };

    
    const currentH = value ? value.split(':')[0] : '08';
    const currentM = value ? value.split(':')[1] : '00';

    const handleScroll = (type: 'h' | 'm', ref: React.RefObject<HTMLDivElement | null>) => {
        if (!ref.current) return;
        setScrolling(true);
        if (scrollTimeout.current) clearTimeout(scrollTimeout.current);

        scrollTimeout.current = setTimeout(() => {
            setScrolling(false);
            if (!ref.current) return;
            const scrollTop = ref.current.scrollTop;
            const index = Math.round(scrollTop / itemHeight);

            let finalH = currentH;
            let finalM = currentM;

            if (type === 'h') {
                finalH = hours[index] || '00';
            } else {
                finalM = minutes[index] || '00';
            }

            if (`${finalH}:${finalM}` !== value) {
                onChange(`${finalH}:${finalM}`);
            }
        }, 150); 
    };

    useEffect(() => {
        if (isOpen) {
            
            setTimeout(() => {
                if (hRef.current && hours.includes(currentH)) {
                    hRef.current.scrollTop = hours.indexOf(currentH) * itemHeight;
                }
                if (mRef.current && minutes.includes(currentM)) {
                    mRef.current.scrollTop = minutes.indexOf(currentM) * itemHeight;
                }
            }, 50);
        }
    }, [isOpen, currentH, currentM]);

    return (
        <div className="relative w-full" ref={containerRef}>
            <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onFocus={() => setIsOpen(true)}
                placeholder="-- : --"
                className={`w-full text-center bg-black/40 hover:bg-black/60 border rounded-xl px-4 py-3 text-xl font-bold tracking-[0.2em] transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${value ? 'border-indigo-500/50 text-white' : 'border-white/10 text-white/50'}`}
            />

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-1/2 -translate-x-1/2 mt-2 w-56 bg-[#1e1e24] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                    >
                        <div className="relative flex justify-center items-center h-[160px] bg-[#1c1c1e] shadow-inner">
                            
                            <div
                                className="absolute w-[90%] h-[44px] bg-white/10 rounded-lg pointer-events-none z-10"
                                style={{ top: '58px' }}
                            />

                            
                            <div
                                ref={hRef}
                                onScroll={() => handleScroll('h', hRef)}
                                className="overflow-y-auto w-24 h-full snap-y snap-mandatory custom-scrollbar-hide relative z-20"
                                style={{ scrollBehavior: 'smooth', msOverflowStyle: 'none', scrollbarWidth: 'none' }}
                            >
                                <div style={{ height: 58 }} className="snap-center" />
                                {hours.map(h => (
                                    <div
                                        key={h}
                                        style={{ height: itemHeight }}
                                        className={`flex items-center justify-center snap-center text-2xl transition-colors ${h === currentH ? 'text-white font-semibold' : 'text-white/40'}`}
                                    >
                                        {h}
                                    </div>
                                ))}
                                <div style={{ height: 58 }} className="snap-center" />
                            </div>

                            <div className="text-2xl font-bold pb-1 z-20 text-white animate-pulse">:</div>

                            
                            <div
                                ref={mRef}
                                onScroll={() => handleScroll('m', mRef)}
                                className="overflow-y-auto w-24 h-full snap-y snap-mandatory custom-scrollbar-hide relative z-20"
                                style={{ scrollBehavior: 'smooth', msOverflowStyle: 'none', scrollbarWidth: 'none' }}
                            >
                                <div style={{ height: 58 }} className="snap-center" />
                                {minutes.map(m => (
                                    <div
                                        key={m}
                                        style={{ height: itemHeight }}
                                        className={`flex items-center justify-center snap-center text-2xl transition-colors ${m === currentM ? 'text-white font-semibold' : 'text-white/40'}`}
                                    >
                                        {m}
                                    </div>
                                ))}
                                <div style={{ height: 58 }} className="snap-center" />
                            </div>

                            <style jsx>{`
                                .custom-scrollbar-hide::-webkit-scrollbar {
                                    display: none;
                                }
                            `}</style>
                        </div>

                        <div className="p-2 border-t border-white/10 bg-black/20 flex gap-2">
                            <button
                                type="button"
                                onClick={() => { onChange(''); setIsOpen(false); }}
                                className="flex-1 py-2 text-xs font-medium text-white/50 hover:text-white/80 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                Xóa
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="flex-1 py-2 text-xs font-bold text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg transition-colors shadow-lg shadow-indigo-500/20"
                            >
                                Xong
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
