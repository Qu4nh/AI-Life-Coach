/** Page Component: Flow thiết lập mục tiêu ban đầu cho user mới. */
'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Bot, Sparkles, ChevronRight, Target, CheckCircle2, Loader2, Info } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { saveRoadmap } from './actions';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

type Message = {
    id: string;
    role: 'assistant' | 'user';
    content: string;
};

export default function OnboardingPage() {
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: 'Chào bạn! Mình là **AI Life Coach**. Để bắt đầu, bạn hãy cho mình biết **mục tiêu** bạn muốn đạt được trong thời gian tới là gì nhé?',
        }
    ]);
    const [input, setInput] = useState('');
    const [step, setStep] = useState(0);
    const [isTyping, setIsTyping] = useState(false);
    const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [roadmapData, setRoadmapData] = useState<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

    const LOADING_MESSAGES = [
        "Đang khởi động cỗ máy AI để phân tích...",
        "Đang rà soát năng lượng và lịch trình cá nhân...",
        "Tính toán số lượng task phù hợp để không bị mệt...",
        "Đang phân bổ nhịp nghỉ ngơi xen kẽ hợp lý...",
        "Đang cook cho bạn một lộ trình xịn xò...",
        "Tìm giải pháp cho những khó khăn tiềm ẩn...",
        "Gần xong rồi, lộ trình dài hạn đang thành hình...",
        "Xin chờ một chút, đang tinh chỉnh bước cuối...",
        "Nà Ná Na Na ....",
        "Đừng lo, task mới sẽ được thêm khi tổng kết tuần"
    ];

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isGeneratingRoadmap) {
            interval = setInterval(() => {
                setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
            }, 5000);
        } else {
            setLoadingMessageIndex(0);
        }
        return () => clearInterval(interval);
    }, [isGeneratingRoadmap]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!input.trim() || isTyping) return;

        const newUserMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
        };

        const newMessages = [...messages, newUserMsg];
        setMessages(newMessages);
        setInput('');
        setIsTyping(true);


        setTimeout(() => {
            let botResponse = '';
            let nextStep = step + 1;

            if (step === 0) {
                botResponse = 'Tiếp theo, bạn muốn hoàn thành mục tiêu này vào **ngày bao nhiêu**? (Vd: 31/12/2026. Nếu chưa có ngày cụ thể, cứ gõ "Bỏ qua" để hệ thống tự tính nhé) 📅';
            } else if (step === 1) {
                botResponse = 'Cho mình hỏi thêm, bạn có thể dành **thời lượng mỗi ngày** (vd: 30 phút/ngày hoặc 4 ngày/tuần hoặc cả hai) cho mục tiêu này là bao nhiêu? ⏰';
            } else if (step === 2) {
                botResponse = 'Chốt! Vậy **độ quen thuộc** của bạn với lĩnh vực này thế nào? (vd: người mới bắt đầu bảng chữ cái, đã có nền tảng, học lại từ đầu, đã học đến...) 🎓';
            } else if (step === 3) {
                botResponse = 'Cuối cùng, bạn có muốn chia sẻ **thêm thông tin, hoặc khó khăn dự kiến** nào không? Cứ chia sẻ thoải mái với mình nhé (vd: mình khá lười, hay mất tập trung, học cấp tốc...) 💬';
            } else {
                botResponse = 'Tuyệt vời! Mình đã ghi nhận đủ 5 thông tin cốt lõi:\n- Mục tiêu\n- Thời lượng\n- Ngày hẹn chót\n- Trình độ\n- Ngữ cảnh khác\n\nBây giờ, hãy nhấn nút **"Chốt Lộ Trình Ngay!"** bên dưới để Bộ não AI tiếp nhận và phân tích kế hoạch chi tiết cho bạn nhé. 🚀';
            }

            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: botResponse
            }]);

            setStep(nextStep);
            setIsTyping(false);
        }, 1000);
    };

    const handleGenerateRoadmap = async () => {
        setIsGeneratingRoadmap(true);
        try {

            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            let userEvents = [];

            if (user) {
                const { data } = await supabase
                    .from('events')
                    .select('*')
                    .eq('user_id', user.id);
                userEvents = data || [];
            }

            const response = await fetch('/api/roadmap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages,
                    events: userEvents
                }),
            });
            if (!response.ok) throw new Error('Failed to parse roadmap');
            const data = await response.json();


            if (data.is_nonsense) {
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: `⛔ **Ối! Có vẻ thông tin hơi lộn xộn rồi...**\n\n${data.message}\n\n*Chúng ta hãy làm lại từ đầu nhé. Mục tiêu thực sự bạn muốn đạt được là gì?*`
                }]);
                setStep(0);
                setInput('');
                return;
            }

            setRoadmapData(data);
        } catch (error) {
            console.error(error);
            alert('Có lỗi xảy ra khi tạo lộ trình, vui lòng thử lại.');
        } finally {
            setIsGeneratingRoadmap(false);
        }
    };

    if (roadmapData) {
        return (
            <div className="relative min-h-screen flex flex-col bg-neutral-900 overflow-y-auto font-sans text-white p-6 md:p-12">

                <div className="absolute top-0 left-[-10%] w-[500px] h-[500px] bg-indigo-600 rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-blob pointer-events-none"></div>
                <div className="absolute bottom-0 right-[-10%] w-[500px] h-[500px] bg-rose-600 rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-blob animation-delay-2000 pointer-events-none"></div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-2xl mx-auto w-full relative z-10"
                >
                    <div className="mb-8 text-center pt-8">
                        <div className="w-16 h-16 bg-white/10 rounded-2xl mx-auto flex items-center justify-center border border-white/20 shadow-inner mb-4">
                            <Target className="w-8 h-8 text-indigo-400" />
                        </div>
                        <h1 className="text-3xl font-bold mb-2 tracking-tight">Lộ Trình Của Bạn ✨</h1>
                        <p className="text-white/60 text-sm">AI Life Coach đã tổng hợp kế hoạch dành riêng cho bạn.</p>
                    </div>

                    <div className="liquid-glass rounded-3xl p-6 md:p-8 shadow-2xl mb-8">
                        <h2 className="text-2xl font-bold text-indigo-300 mb-2">{roadmapData.title}</h2>
                        <p className="text-white/70 mb-8 leading-relaxed">{roadmapData.description}</p>

                        <div className="space-y-4">
                            {roadmapData.tasks?.map((task: any, index: number) => (
                                <div key={index} className="flex gap-4 p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors shadow-inner">
                                    <div className="shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold font-mono text-sm border border-indigo-500/30">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white/90 mb-1.5">{task.title}</h3>
                                        <p className="text-sm text-white/50 leading-relaxed">{task.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-start gap-3">
                            <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                            <div className="text-sm text-indigo-200/80 leading-relaxed">
                                <strong className="text-indigo-300 block mb-1">Tại sao Lộ trình này trông có vẻ ngắn?</strong>
                                Để đảm bảo chất lượng công việc luôn sát với năng lực thực tế, AI Life Coach sẽ chỉ tạo trước cho bạn lịch trình của **vài tuần đầu tiên**. Bạn cứ yên tâm bắt tay vào làm nhé! Hàng tuần khi bạn phản tư (Night Reflection), hệ thống sẽ động não để tiếp tục **tạo thêm các task mới** phù hợp cho chặng đường tiếp theo.
                            </div>
                        </div>
                    </div>

                    <div className="pb-12">
                        <button
                            className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 rounded-xl font-medium shadow-lg transition-all flex items-center justify-center gap-2 text-sm md:text-base active:scale-95 disabled:bg-indigo-500/50"
                            onClick={async () => {
                                setIsSaving(true);
                                try {
                                    const result = await saveRoadmap(roadmapData);
                                    if (result?.success) {
                                        window.location.href = '/dashboard';
                                    } else {
                                        alert(result?.error || 'Khởi tạo lỗi! Hãy chắc chắn bạn đã cài đặt Supabase CSDL.');
                                        setIsSaving(false);
                                    }
                                } catch (error) {
                                    console.error(error);
                                    alert('Khởi tạo lỗi! Hãy chắc chắn bạn đã cài đặt Supabase CSDL.');
                                    setIsSaving(false);
                                }
                            }}
                            disabled={isSaving}
                        >
                            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                            {isSaving ? 'Đang thiết lập...' : 'Bắt đầu hành trình'}
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="relative h-[100dvh] flex flex-col bg-neutral-900 overflow-hidden font-sans text-white">

            <div className="absolute top-0 left-[-10%] w-[500px] h-[500px] bg-indigo-600 rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-blob"></div>
            <div className="absolute bottom-0 right-[-10%] w-[500px] h-[500px] bg-rose-600 rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-blob animation-delay-2000"></div>


            <header className="relative z-10 pt-10 pb-6 px-6 border-b border-white/10 bg-[#1e1e24]/70 backdrop-blur-xl shrink-0">
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shadow-inner">
                            <Sparkles className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg tracking-wide">Thiết Lập Mục Tiêu</h1>
                            <p className="text-xs text-white/50">Cùng AI Life Coach</p>
                        </div>
                    </div>

                    {!isGeneratingRoadmap && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => router.push('/dashboard')}
                            className="text-sm px-4 py-2 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 transition-colors flex items-center gap-1 active:bg-white/20"
                        >
                            Bỏ qua <ChevronRight className="w-4 h-4" />
                        </motion.button>
                    )}
                </div>
            </header>


            <main className="relative z-10 flex-1 overflow-y-auto px-4 py-8 custom-scrollbar">
                <div className="max-w-2xl mx-auto space-y-6">

                    {isGeneratingRoadmap ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center py-20 min-h-[50vh]"
                        >
                            <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
                                {/* Glowing animated orb rings */}
                                <motion.div
                                    animate={{
                                        scale: [1, 1.5, 1],
                                        opacity: [0.3, 0.7, 0.3],
                                    }}
                                    transition={{
                                        duration: 3,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                    className="absolute inset-0 rounded-full bg-indigo-500/30 blur-xl"
                                />
                                <motion.div
                                    animate={{
                                        scale: [1, 1.2, 1],
                                        opacity: [0.5, 0.8, 0.5],
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                    className="absolute inset-4 rounded-full bg-purple-500/40 blur-md"
                                />
                                <div className="absolute inset-8 rounded-full bg-white/10 border border-white/30 backdrop-blur-md flex items-center justify-center shadow-inner z-10">
                                    <Bot className="w-8 h-8 text-indigo-200 animate-pulse" />
                                </div>
                            </div>

                            <AnimatePresence mode="wait">
                                <motion.h3
                                    key={loadingMessageIndex}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.5 }}
                                    className="text-xl md:text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 to-white"
                                >
                                    {LOADING_MESSAGES[loadingMessageIndex]}
                                </motion.h3>
                            </AnimatePresence>

                            <p className="mt-4 text-white/50 text-sm text-center max-w-sm">
                                Quá trình này có thể mất từ 1 - 3 phút vì AI đang tạo danh sách lộ trình rất chi tiết cho từng ngày. Tốc độ hơi rùa tí nhưng mà chắc chắn ạ!
                            </p>
                        </motion.div>
                    ) : (
                        <>
                            <AnimatePresence initial={false}>
                                {messages.map((msg) => (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{ duration: 0.4, type: 'spring', bounce: 0.3 }}
                                        className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>

                                            <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center border shadow-sm ${msg.role === 'assistant'
                                                ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300'
                                                : 'bg-white/10 border-white/20 text-white/70'
                                                }`}>
                                                {msg.role === 'assistant' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                            </div>


                                            <div className={`px-5 py-3.5 rounded-2xl shadow-lg border backdrop-blur-md ${msg.role === 'user'
                                                ? 'bg-white/10 border-white/15 text-white rounded-tr-sm'
                                                : 'bg-indigo-900/30 border-indigo-500/20 text-indigo-50 rounded-tl-sm'
                                                }`}>
                                                <div className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                                                    <ReactMarkdown
                                                        components={{
                                                            p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                                            ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-2 ml-2 space-y-1" {...props} />,
                                                            ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-2 ml-2 space-y-1" {...props} />,
                                                            li: ({ node, ...props }) => <li className="" {...props} />,
                                                            strong: ({ node, ...props }) => <strong className={`font-semibold ${msg.role === 'user' ? 'text-white' : 'text-indigo-200'}`} {...props} />,
                                                        }}
                                                    >
                                                        {msg.content}
                                                    </ReactMarkdown>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {isTyping && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex justify-start w-full"
                                >
                                    <div className="flex gap-3 max-w-[85%]">
                                        <div className="shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center shadow-sm">
                                            <Bot className="w-4 h-4" />
                                        </div>
                                        <div className="px-5 py-4 rounded-2xl rounded-tl-sm bg-indigo-900/30 border border-indigo-500/20 backdrop-blur-md shadow-lg flex items-center gap-1.5">
                                            <motion.div className="w-1.5 h-1.5 bg-indigo-400 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
                                            <motion.div className="w-1.5 h-1.5 bg-indigo-400 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} />
                                            <motion.div className="w-1.5 h-1.5 bg-indigo-400 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {step >= 5 && !isTyping && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    className="pt-6 pb-2 flex justify-center w-full"
                                >
                                    <button
                                        onClick={handleGenerateRoadmap}
                                        disabled={isGeneratingRoadmap}
                                        className="w-full max-w-sm py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 font-bold text-white shadow-xl transition-all flex items-center justify-center gap-2 hover:shadow-indigo-500/25 active:scale-95 disabled:opacity-70 disabled:active:scale-100"
                                    >
                                        <Sparkles className="w-5 h-5" />
                                        Chốt Lộ Trình Ngay!
                                    </button>
                                </motion.div>
                            )}
                        </>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </main>


            {!isGeneratingRoadmap && step < 5 && (
                <footer className="relative z-20 border-t border-white/10 bg-[#1e1e24]/70 backdrop-blur-2xl p-4 shrink-0">
                    <div className="max-w-2xl mx-auto relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={
                                step === 0 ? "Tôi muốn..." :
                                    step === 1 ? "Ngày hoàn thành là..." :
                                        step === 2 ? "Thời gian mỗi ngày..." :
                                            step === 3 ? "Trình độ của tôi là..." :
                                                "Ghi chú thêm..."
                            }
                            className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-6 pr-14 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner transition-all hover:bg-white/10"
                            disabled={isTyping}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || isTyping}
                            className="absolute right-2 top-2 bottom-2 aspect-square rounded-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-white/10 disabled:text-white/30 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-md active:scale-90"
                        >
                            <Send className="w-4 h-4 ml-0.5" />
                        </button>
                    </div>
                </footer>
            )}
        </div>
    );
}
