/** Page Component: Dashboard View - Fetch data qua React Server Component. */
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import DailyCheckInModal from './DailyCheckInModal';
import CalendarWidget from './CalendarWidget';
import ClientTaskList from './ClientTaskList';
import DeleteGoalButton from './DeleteGoalButton';
import CountdownWidget from './CountdownWidget';
import DashboardControls from './DashboardControls';
import LoadDemoButton from './LoadDemoButton';
import GuidedTour from './GuidedTour';
import { getEvents } from './calendarActions';
import { hasCheckedInToday } from './actions';
import { Hourglass, Moon } from 'lucide-react';

export const dynamic = 'force-dynamic';

function getVietnamToday(): string {
    return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
}

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }


    const { data: goals } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id);


    const events = await getEvents();


    const { data: tasks } = await supabase.from('tasks').select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('priority', { ascending: true });


    const checkedIn = await hasCheckedInToday();


    const today = getVietnamToday();
    const { data: log } = await supabase.from('daily_logs').select('energy_level').eq('user_id', user.id).eq('date', today).single();
    const energyLevel = log?.energy_level || 3;


    const taskEvents = (tasks || []).map((t, idx) => {

        const dateStr = t.due_date
            ? t.due_date.split('T')[0]
            : new Date(Date.now() + Math.floor(idx / 2) * 86400000).toISOString().split('T')[0];

        return {
            id: t.id,
            title: t.content.split(' - ')[0],
            content: t.content,
            date: dateStr,
            is_hard_deadline: false,
            is_task: true,
            energy_required: t.energy_required || 3
        };
    });


    const todaysTasks = (tasks || []).filter(t => !t.due_date || t.due_date.split('T')[0] <= today);

    const combinedCalendarData = [...(events || []), ...taskEvents];

    return (
        <div className="min-h-screen bg-neutral-900 text-white font-sans overflow-y-auto overflow-x-hidden relative selection:bg-indigo-500/30 selection:text-indigo-200">
            <GuidedTour />


            <div className="fixed top-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full mix-blend-screen filter blur-[120px] pointer-events-none"></div>
            <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-rose-600/10 rounded-full mix-blend-screen filter blur-[100px] pointer-events-none delay-1000"></div>

            <main className="w-full max-w-[1600px] mx-auto px-4 py-8 sm:px-6 lg:px-8 lg:py-12 space-y-8 z-10 relative">
                <header className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Trang Chủ 🔥</h1>
                        <p className="text-white/60 mt-1">Chào ngày mới! Cùng bắt đầu phá vỡ rào cản nhé.</p>
                    </div>
                    <Link
                        href="/onboarding"
                        data-tour="add-goal"
                        className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-full shadow-lg transition-colors flex items-center justify-center gap-2 max-w-fit"
                    >
                        + Thêm Mục Tiêu Mới
                    </Link>
                </header>

                {(!goals || goals.length === 0) && (
                    <div className="liquid-glass p-10 rounded-3xl text-center space-y-4">
                        <h2 className="text-2xl font-bold">Chào mừng đến AI Life Coach! 🚀</h2>
                        <p className="text-white/60 max-w-md mx-auto">Bạn chưa có mục tiêu nào. Hãy tạo mục tiêu mới hoặc nạp dữ liệu demo để trải nghiệm.</p>
                        <div className="flex gap-4 justify-center flex-wrap">
                            <LoadDemoButton />
                        </div>
                    </div>
                )}

                {goals && goals.map((goal, idx) => (
                    <div key={goal.id} data-tour={idx === 0 ? 'goal' : undefined} className="group liquid-glass p-6 md:p-8 lg:p-10 rounded-3xl relative overflow-hidden mb-6 last:mb-0">

                        <div className="absolute top-[-50%] right-[-10%] w-[300px] h-[300px] bg-indigo-500/10 rounded-full filter blur-[80px] pointer-events-none"></div>
                        <div className="relative z-10">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-3">
                                <div className="text-sm font-semibold text-indigo-400 uppercase tracking-wide">Mục tiêu</div>
                                {goal.deadline && (
                                    <CountdownWidget targetDateStr={goal.deadline} />
                                )}
                            </div>
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-2xl md:text-3xl font-bold pr-4">{goal.title}</h2>
                                <DeleteGoalButton goalId={goal.id} />
                            </div>
                            <p className="text-white/70 text-sm md:text-base max-w-3xl">{goal.description}</p>
                        </div>
                    </div>
                ))}


                {!checkedIn && (
                    <div className="my-6" data-tour="checkin">
                        <DailyCheckInModal />
                    </div>
                )}


                <div data-tour="ai-controls">
                    <DashboardControls />
                </div>


                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start pb-24">


                    <div className="lg:col-span-12 xl:col-span-4 space-y-6 relative z-30" data-tour="tasks">
                        <ClientTaskList initialTasks={todaysTasks} energyLevel={energyLevel} />
                    </div>


                    <div className="lg:col-span-12 xl:col-span-8 w-full relative z-10" data-tour="calendar">
                        <CalendarWidget initialEvents={combinedCalendarData} />
                    </div>

                </div>


                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4 sm:px-0 pointer-events-none" data-tour="night-reflection">
                    <div className="liquid-glass-heavy p-2 sm:p-2.5 rounded-[32px] flex items-center gap-3 w-full pointer-events-auto">
                        <div className="shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg border border-white/10">
                            <Moon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Ngày hôm nay của bạn thế nào? (Kể cho AI nghe...)"
                                className="w-full bg-transparent border-none px-2 py-2 text-sm md:text-base text-white focus:outline-none focus:ring-0 placeholder:text-white/40 font-medium tracking-wide"
                            />
                        </div>
                        <button className="shrink-0 bg-white hover:bg-white/90 text-indigo-900 font-bold px-5 py-2 sm:px-6 sm:py-2.5 rounded-full transition-transform active:scale-95 shadow-md text-sm sm:text-base">
                            Gửi
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
