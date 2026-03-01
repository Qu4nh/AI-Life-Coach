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
import NightReflection from './NightReflection';
import LoadDemoButton from './LoadDemoButton';
import GuidedTour from './GuidedTour';
import LogoutButton from './LogoutButton';
import DashboardStats from './DashboardStats';
import { getEvents } from './calendarActions';
import { hasCheckedInToday } from './actions';
import { Hourglass, Moon } from 'lucide-react';

export const dynamic = 'force-dynamic';

function getVietnamToday(): string {
    return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
}

function getGreeting(): string {
    const vnTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' });
    const hour = new Date(vnTime).getHours();

    let messages: string[] = [];

    if (hour >= 5 && hour < 11) {
        messages = [
            "Sáng tinh sương, nạp năng lượng và bắt đầu một ngày bùng nổ nào! 🌅",
            "Tranh thủ buổi sáng khi não bộ còn minh mẫn để làm việc khó nhất nhé sếp! 💪",
            "Một ly cafe, một tinh thần thép. Khởi đầu ngày mới thật trọn vẹn nha! ☕",
            "Góc nhìn mới, cơ hội mới. Sẵn sàng phá vỡ giới hạn hôm nay chưa? 🚀"
        ];
    } else if (hour >= 11 && hour < 14) {
        messages = [
            "Giờ nghỉ trưa rồi. Nhớ ăn uống đầy đủ và thư giãn chút nhé sếp! ☀️",
            "Làm việc hăng say nhưng đừng quên nạp lại năng lượng nhé. Nửa chặn đường rồi! 🥗",
            "Chợp mắt 15-20 phút sẽ giúp buổi chiều làm việc mượt mà hơn đấy. 😴"
        ];
    } else if (hour >= 14 && hour < 18) {
        messages = [
            "Chiều rồi, cố lên một chút nữa thôi. Sự kiên trì của bạn sẽ được đền đáp! ☕",
            "Đừng để buổi chiều làm bạn chùng bước. Hãy giữ vững sự tập trung nhé! 🔥",
            "Mệt mỏi một chút cũng không sao, quan trọng là bạn vẫn đang tiến lên! 🏃‍♂️",
            "Đứng dậy vươn vai uống một ngụm nước đi sếp ơi, sắp qua phiên làm việc rồi! 💧"
        ];
    } else if (hour >= 18 && hour < 22) {
        messages = [
            "Một ngày vất vả rồi. Hãy tự thưởng cho bản thân một buổi tối thật chill nhé 🌙",
            "Hoàn thành nốt công việc nhé, sau đó là lúc dành thời gian cho bản thân và thư giãn. 🛋️",
            "Phản tư lại những gì đã làm được hôm nay, bạn sẽ thấy mình đã trưởng thành hơn đó! 📖"
        ];
    } else {
        messages = [
            "Đêm đã về. Hãy nhắm mắt lại, nghỉ ngơi sâu để ngày mai tiếp tục cuộc hành trình 🦉",
            "Ngủ ngon nhé. Sạc đầy pin để ngày mai lại cháy hết mình! 🔋",
            "Đừng thức quá khuya, một giấc ngủ đủ sẽ là bước đệm tốt nhất cho chiến thắng ngày mai. 🛌"
        ];
    }

    return messages[Math.floor(Math.random() * messages.length)];
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
            <GuidedTour hasGoals={!!(goals && goals.length > 0)} />


            <div className="fixed top-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full mix-blend-screen filter blur-[120px] pointer-events-none"></div>
            <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-rose-600/10 rounded-full mix-blend-screen filter blur-[100px] pointer-events-none delay-1000"></div>

            <main className="w-full max-w-[1600px] mx-auto px-4 py-8 sm:px-6 lg:px-8 lg:py-12 space-y-8 z-10 relative">
                <header className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-4">
                            <h1 className="text-3xl font-bold tracking-tight">Trang Chủ 🔥</h1>
                            <LogoutButton />
                        </div>
                        <p className="text-white/60 mt-1">{getGreeting()}</p>
                    </div>
                    <Link
                        href="/onboarding"
                        data-tour="add-goal"
                        className={`px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-full shadow-lg transition-all flex items-center justify-center gap-2 max-w-fit ${!goals || goals.length === 0
                            ? 'animate-wave'
                            : ''
                            }`}
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

                {goals && goals.length > 0 && goals.some(g => g.title.includes("Chinh phục IELTS") || g.title.includes("Giảm 3kg mỡ")) && (
                    <DashboardStats />
                )}

                <div data-tour="ai-controls">
                    <DashboardControls hasTasks={!!(tasks && tasks.length > 0)} />
                </div>


                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start pb-24">


                    <div className="lg:col-span-12 xl:col-span-4 space-y-6 relative z-30" data-tour="tasks">
                        <ClientTaskList initialTasks={todaysTasks} energyLevel={energyLevel} />
                    </div>


                    <div className="lg:col-span-12 xl:col-span-8 w-full relative z-10" data-tour="calendar">
                        <CalendarWidget initialEvents={combinedCalendarData} />
                    </div>

                </div>


                <NightReflection hasTasks={!!(tasks && tasks.length > 0)} />
            </main>
        </div>
    );
}
