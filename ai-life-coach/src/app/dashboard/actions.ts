/** Server Actions: Tầng Data Handling (CUD) cập nhật trạng thái Dashboard. */
'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

function getVietnamToday(): string {
    return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
}

function getVietnamNow(): Date {
    const vnStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' });
    return new Date(vnStr);
}

export async function hasCheckedInToday() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false;


    const today = getVietnamToday();

    const { data, error } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single()

    if (data) return true;
    return false;
}

export async function saveDailyCheckIn(energyLevel: number, mood: string, notes: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated');

    const today = getVietnamToday();


    const { error: profileError } = await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email,
    }, { onConflict: 'id' });

    if (profileError) {
        console.error('Error upserting profile:', JSON.stringify(profileError, null, 2));
        throw new Error(`Lỗi cập nhật Hồ Sơ: ${profileError.message} (Code: ${profileError.code})`);
    }

    const { error } = await supabase.from('daily_logs').insert({
        user_id: user.id,
        date: today,
        energy_level: energyLevel,
        mood: mood,
        notes: notes,
    })

    if (error) {
        console.error('Error saving check-in:', JSON.stringify(error, null, 2));
        throw new Error(`Failed to save log: ${error.message} (Code: ${error.code})`);
    }

    revalidatePath('/dashboard');
}

export async function updateTaskStatus(taskId: string, status: 'completed' | 'skipped') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
        .from('tasks')
        .update({ status })
        .eq('id', taskId)
        .eq('user_id', user.id);

    if (error) {
        console.error('Lỗi cập nhật task:', error);
        throw new Error('Không thể cập nhật trạng thái task');
    }

    revalidatePath('/dashboard');
}

export async function deleteTask(taskId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', user.id);

    if (error) {
        console.error('Lỗi xóa task:', error);
        throw new Error('Không thể xóa task');
    }

    revalidatePath('/dashboard');
}

export async function rescheduleTask(taskId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated');


    const tomorrow = getVietnamNow();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toLocaleDateString('sv-SE');

    const { error } = await supabase
        .from('tasks')
        .update({ due_date: dateStr, status: 'pending' })
        .eq('id', taskId)
        .eq('user_id', user.id);

    if (error) {
        console.error('Lỗi dời task:', error);
        throw new Error('Không thể dời trạng thái task');
    }

    revalidatePath('/dashboard');
}

export async function editTask(taskId: string, content: string, energy: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
        .from('tasks')
        .update({ content: content, energy_required: Math.round(energy) })
        .eq('id', taskId)
        .eq('user_id', user.id);

    if (error) {
        console.error('Lỗi sửa task:', error);
        throw new Error('Không thể sửa task');
    }

    revalidatePath('/dashboard');
}

export async function deleteGoal(goalId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    console.log('[deleteGoal] START - goalId:', goalId, 'userId:', user.id);

    try {

        const { error: tasksError, count: tasksCount } = await supabase
            .from('tasks')
            .delete({ count: 'exact' })
            .eq('goal_id', goalId)
            .eq('user_id', user.id);

        console.log('[deleteGoal] Tasks deleted:', tasksCount, 'Error:', tasksError);
        if (tasksError) {
            console.error('[deleteGoal] FAILED at tasks:', tasksError);
            return { success: false, error: `Lỗi xoá tasks: ${tasksError.message}` };
        }


        const { error: goalError, count: goalCount } = await supabase
            .from('goals')
            .delete({ count: 'exact' })
            .eq('id', goalId)
            .eq('user_id', user.id);

        console.log('[deleteGoal] Goal deleted:', goalCount, 'Error:', goalError);

        if (goalError) {
            console.error('[deleteGoal] FAILED at goal:', goalError);
            return { success: false, error: `Lỗi xoá mục tiêu: ${goalError.message}` };
        }

        if (goalCount === 0) {
            console.error('[deleteGoal] RLS chặn hoặc goal không tồn tại');
            return { success: false, error: 'Supabase RLS chặn xoá. Sếp đã chạy SQL tạo POLICY chưa ạ? (Hoặc Mục tiêu đã bị xoá từ trước).' };
        }

        console.log('[deleteGoal] SUCCESS');
        revalidatePath('/dashboard');
        return { success: true };

    } catch (err: any) {
        console.error('[deleteGoal] UNEXPECTED ERROR:', err);
        return { success: false, error: err?.message || 'Lỗi server không xác định.' };
    }
}

export async function saveEnergySnapshot(level: number, trigger: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = getVietnamToday();
    const now = new Date().toISOString();


    const { data: existing } = await supabase
        .from('daily_logs')
        .select('notes, energy_level')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

    const snapshot = `[${now.split('T')[1].substring(0, 5)}] ${trigger}: ${level}/5`;
    const updatedNotes = existing?.notes
        ? `${existing.notes}\n${snapshot}`
        : snapshot;

    if (existing) {
        await supabase.from('daily_logs').update({
            notes: updatedNotes,
            energy_level: level,
        }).eq('user_id', user.id).eq('date', today);
    } else {
        await supabase.from('daily_logs').insert({
            user_id: user.id,
            date: today,
            energy_level: level,
            mood: 'neutral',
            notes: snapshot,
        });
    }
}

export async function loadMockData(): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Not authenticated' };

        await supabase.from('profiles').upsert({ id: user.id, email: user.email }, { onConflict: 'id' });


        const vnNow = getVietnamNow();
        const todayStr = getVietnamToday();

        const dayOffset = (days: number) => {
            const d = new Date(vnNow);
            d.setDate(d.getDate() + days);
            return d.toLocaleDateString('sv-SE');
        };


        await supabase.from('daily_logs').delete().eq('user_id', user.id).eq('date', todayStr);


        const targetDate = new Date(vnNow);
        targetDate.setDate(targetDate.getDate() + 45);

        const { data: goal, error: goalError } = await supabase.from('goals').insert({
            user_id: user.id,
            title: "Chinh phục IELTS 7.0 trong 45 ngày",
            description: "Luyện thi IELTS Academic với mục tiêu Overall 7.0. Tập trung vào Speaking và Writing - hai kỹ năng yếu nhất. Kết hợp nghe Podcast hàng ngày và viết Essay 3 lần/tuần.",
            type: 'long_term',
            deadline: targetDate.toISOString(),
        }).select().single();

        if (goalError || !goal) {
            console.error('[loadMockData] Goal error:', goalError);
            return { success: false, error: `Lỗi tạo Goal 1: ${goalError?.message || 'Không rõ'}` };
        }

        const targetDate2 = new Date(vnNow);
        targetDate2.setDate(targetDate2.getDate() + 60);

        const { data: goal2, error: goal2Error } = await supabase.from('goals').insert({
            user_id: user.id,
            title: "Giảm 3kg mỡ, tăng cơ trong 2 tháng",
            description: "Mục tiêu sức khoẻ: Tập Gym 4 buổi/tuần, cắt tiểu đường, uống đủ 2 lít nước mỗi ngày.",
            type: 'long_term',
            deadline: targetDate2.toISOString(),
        }).select().single();

        if (goal2Error || !goal2) {
            console.error('[loadMockData] Goal 2 error:', goal2Error);
            return { success: false, error: `Lỗi tạo Goal 2: ${goal2Error?.message || 'Không rõ'}` };
        }


        const tasks = [

            { content: "Flashcard từ vựng Academic - Bắt đầu: 07:00 | Thời lượng: 15 phút\nChi tiết: Ôn tập 50 từ trong bộ 'Barron's Essential Words'", priority: 1, energy_required: 1, status: 'pending', due_date: todayStr },
            { content: "Nghe Podcast BBC 6 Minute English - Bắt đầu: 08:30 | Thời lượng: 20 phút", priority: 2, energy_required: 2, status: 'pending', due_date: todayStr },
            { content: "Đọc passage Cambridge IELTS 18 - Test 1 - Bắt đầu: 10:00 | Thời lượng: 40 phút\nChi tiết: Highlight keyword và lập bảng từ đồng nghĩa (synonyms table) sau khi kiểm tra đáp án.", priority: 3, energy_required: 3, status: 'pending', due_date: todayStr },
            { content: "Viết Essay Task 2: Education Topic - Bắt đầu: 14:00 | Thời lượng: 45 phút", priority: 4, energy_required: 4, status: 'pending', due_date: todayStr },
            { content: "Speaking Practice: Part 2 Cue Card - Bắt đầu: 16:00 | Thời lượng: 30 phút\nChi tiết: Chủ đề 'Describe a person you admire'. Ghi âm lại và gửi cho partner nghe nhận xét.", priority: 5, energy_required: 3, status: 'pending', due_date: todayStr },
            { content: "Ôn Grammar: Relative Clauses - Bắt đầu: 20:00 | Thời lượng: 25 phút", priority: 6, energy_required: 2, status: 'pending', due_date: todayStr },


            { content: "Luyện Listening Section 3-4 - Bắt đầu: 09:00 | Thời lượng: 35 phút\nChi tiết: Tập trung vào kỹ năng nghe dictation và Multiple Choice Questions.", priority: 1, energy_required: 3, status: 'pending', due_date: dayOffset(1) },
            { content: "Writing Task 1: Bar Chart Analysis - Bắt đầu: 11:00 | Thời lượng: 30 phút", priority: 2, energy_required: 4, status: 'pending', due_date: dayOffset(1) },
            { content: "Đọc báo The Guardian 2 bài - Bắt đầu: 15:00 | Thời lượng: 20 phút", priority: 3, energy_required: 2, status: 'pending', due_date: dayOffset(1) },
            { content: "Mock Speaking Test với AI - Bắt đầu: 19:00 | Thời lượng: 15 phút\nChi tiết: Sử dụng App Elsa Speak hoặc ChatGPT Voice mode", priority: 4, energy_required: 5, status: 'pending', due_date: dayOffset(1) },


            { content: "Full Practice Test - Reading - Bắt đầu: 09:00 | Thời lượng: 60 phút", priority: 1, energy_required: 5, status: 'pending', due_date: dayOffset(2) },
            { content: "Review lỗi sai Test hôm trước - Bắt đầu: 14:00 | Thời lượng: 30 phút\nChi tiết: Viết lại các câu sai Grammar vào sổ tay", priority: 2, energy_required: 2, status: 'pending', due_date: dayOffset(2) },
            { content: "Học Collocations chủ đề Environment - Bắt đầu: 20:00 | Thời lượng: 15 phút", priority: 3, energy_required: 1, status: 'pending', due_date: dayOffset(2) },


            { content: "Học 20 từ vựng Topic Health - Bắt đầu: 07:00 | Thời lượng: 15 phút\nChi tiết: Học xong vào Quizlet làm bài Mini Test nha", priority: 1, energy_required: 1, status: 'completed', due_date: dayOffset(-1) },
            { content: "Nghe TED Talk + ghi chú - Bắt đầu: 09:00 | Thời lượng: 25 phút", priority: 2, energy_required: 2, status: 'completed', due_date: dayOffset(-1) },
            { content: "Viết Essay Task 2: Technology Topic - Bắt đầu: 14:00 | Thời lượng: 45 phút", priority: 3, energy_required: 4, status: 'completed', due_date: dayOffset(-1) },


            { content: "Listening Practice Test 2 - Bắt đầu: 10:00 | Thời lượng: 30 phút", priority: 1, energy_required: 3, status: 'completed', due_date: dayOffset(-2) },
            { content: "Speaking Part 1: Hometown & Work - Bắt đầu: 16:00 | Thời lượng: 20 phút\nChi tiết: List ra vocab về làng quê, công việc hiện tại", priority: 2, energy_required: 3, status: 'completed', due_date: dayOffset(-2) },
        ];

        const { error: tasksError } = await supabase.from('tasks').insert(
            tasks.map(t => ({ ...t, user_id: user.id, goal_id: goal.id }))
        );
        if (tasksError) {
            console.error('[loadMockData] Tasks 1 error:', tasksError);
            return { success: false, error: `Lỗi tạo Tasks 1: ${tasksError.message}` };
        }

        const tasks2 = [
            { content: "Tập Cardio HIIT tại nhà - Bắt đầu: 17:00 | Thời lượng: 15 phút\nChi tiết: Lên Youtube mở video nhảy dây", priority: 1, energy_required: 4, status: 'pending', due_date: todayStr },
            { content: "Chuẩn bị bữa tối Eat Clean (ức gà + salad) - Bắt đầu: 18:30 | Thời lượng: 30 phút\nChi tiết: Mua thêm sốt mè rang", priority: 2, energy_required: 2, status: 'pending', due_date: todayStr },
            { content: "Đo InBody kiểm tra mỡ định kỳ", priority: 3, energy_required: 1, status: 'completed', due_date: dayOffset(-1) },
        ];

        const { error: tasks2Error } = await supabase.from('tasks').insert(
            tasks2.map(t => ({ ...t, user_id: user.id, goal_id: goal2.id }))
        );
        if (tasks2Error) {
            console.error('[loadMockData] Tasks 2 error:', tasks2Error);
            return { success: false, error: `Lỗi tạo Tasks 2: ${tasks2Error.message}` };
        }


        const events = [
            { title: "📝 Thi thử IELTS Mini Test", description: "Bao gồm cả 4 kỹ năng - Nhớ cầm the bút chì đậm và gôm đi thi", date: dayOffset(5), is_hard_deadline: true },
            { title: "📅 Nộp Essay cho giáo viên", description: "", date: dayOffset(3), is_hard_deadline: true },
            { title: "🎯 Mock Test Full Hội Đồng Anh", description: "Testing địa điểm: Khách sạn Equatorial - Q5", date: dayOffset(10), is_hard_deadline: true },
            { title: "📚 Mua sách Cambridge IELTS 19", description: "Hỏi anh Tâm xem ổng còn dư bản cứng không xin lại đỡ tốn", date: dayOffset(1), is_hard_deadline: false },
            { title: "🗣️ Buổi Speaking Club Online", description: "", date: dayOffset(4), is_hard_deadline: false },
            { title: "💪 Đăng ký học phần Yoga buổi sáng", description: "Phòng tập Elite Fitness Thảo Điền", date: dayOffset(2), is_hard_deadline: false },
        ];

        const { error: eventsError } = await supabase.from('events').insert(
            events.map(e => ({ ...e, user_id: user.id }))
        );
        if (eventsError) console.error('[loadMockData] Events error (non-fatal):', eventsError);


        const logs = [
            { user_id: user.id, date: dayOffset(-2), energy_level: 4, mood: 'motivated', notes: 'Ngủ đủ giấc, tập trung tốt. Hoàn thành 2/2 task.' },
            { user_id: user.id, date: dayOffset(-1), energy_level: 3, mood: 'neutral', notes: 'Hơi mệt buổi chiều nhưng vẫn viết xong Essay. Cần ngủ sớm hơn.' },
        ];

        for (const log of logs) {
            await supabase.from('daily_logs').upsert(log, { onConflict: 'user_id,date' });
        }

        revalidatePath('/dashboard');
        return { success: true };

    } catch (err: any) {
        console.error('[loadMockData] UNEXPECTED:', err);
        return { success: false, error: err?.message || 'Lỗi không xác định' };
    }
}

export async function regenerateRoadmap() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated');

    const { data: goals } = await supabase
        .from('goals').select('*').eq('user_id', user.id);
    const activeGoal = goals && goals.length > 0 ? goals[0] : null;
    if (!activeGoal) throw new Error('Chưa có mục tiêu nào');

    const { data: allTasks } = await supabase
        .from('tasks').select('*').eq('goal_id', activeGoal.id);

    const completed = (allTasks || []).filter(t => t.status === 'completed');
    const pending = (allTasks || []).filter(t => t.status === 'pending');

    const today = getVietnamToday();
    const { data: logs } = await supabase
        .from('daily_logs').select('energy_level, notes, date')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(7);

    const avgEnergy = logs && logs.length > 0
        ? (logs.reduce((sum, l) => sum + (l.energy_level || 3), 0) / logs.length).toFixed(1)
        : '3.0';

    const recentNotes = (logs || [])
        .filter(l => l.notes && l.notes.trim())
        .map(l => `${l.date}: ${l.notes}`)
        .join('\n');

    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Bạn là AI Life Coach - HUẤN LUYỆN VIÊN THẤU CẢM, không phải cỗ máy nhét việc vào lịch.
Nguyên tắc tối thượng: "Sự bền bỉ quan trọng hơn cường độ" (Consistency > Intensity).

MỤC TIÊU: ${activeGoal.title}
MÔ TẢ: ${activeGoal.description || 'Không có'}
NGÀY HẠN CHÓT: ${activeGoal.deadline || 'Không có'}
HÔM NAY: ${today}

TIẾN ĐỘ:
- Đã hoàn thành: ${completed.length} task
- Các task đã xong: ${completed.map(t => t.content.split(' - ')[0]).join(', ') || 'Chưa có'}
- Đang chờ: ${pending.length} task

NĂNG LƯỢNG TRUNG BÌNH 7 NGÀY: ${avgEnergy}/5
GHI CHÚ CẢM XÚC GẦN ĐÂY:
${recentNotes || 'Không có ghi chú'}

=== TRIẾT LÝ ENERGY MANAGEMENT & GUILT-FREE ===
Dựa trên tiến độ, năng lượng trung bình và ghi chú cảm xúc, hãy tái cấu trúc lộ trình (thay thế hoàn toàn task pending cũ).
- Nếu năng lượng trung bình THẤP (< 2.5): Giảm mạnh cường độ, chủ yếu Micro-actions nhẹ nhàng (energy 1-2), nhiều ngày nghỉ.
- Nếu năng lượng TRUNG BÌNH (2.5-3.5): Giữ nhịp ổn định, xen kẽ nặng và nhẹ.
- Nếu năng lượng CAO (> 3.5): Có thể tăng cường độ nhưng VẪN giữ ngày nghỉ xen kẽ.

=== QUY TẮC PHÂN BỔ - LINH HOẠT & CÁ NHÂN HÓA ===
- CHIA NHỎ task ra TỪNG NGÀY CỤ THỂ (bắt đầu từ hôm nay ${today}).
- PHÂN BỔ LINH HOẠT: CÓ ngày 0 task (nghỉ), CÓ ngày 1 task nhẹ (Micro-action), CÓ ngày 2-3 task. KHÔNG BAO GIỜ quá 3 task/ngày.
- TẠO NHỊP THỞ: Xen kẽ nặng → nhẹ → nghỉ. Không để 3 ngày nặng liên tiếp.
- KHÔNG gộp nhiều ngày vào 1 task. CẤM dùng "Hàng ngày", "Mỗi tuần".
- "date": format "YYYY-MM-DD".
- "title": CHỈ TÊN NGẮN GỌN. KHÔNG chèn giờ giấc hay mô tả.
- "description": DÒNG ĐẦU: "Bắt đầu: HH:MM | Thời lượng: X giờ/phút". XUỐNG DÒNG: "Chi tiết: <hướng dẫn>".

CHỈ trả về JSON thuần (không markdown):
{
  "tasks": [
    { "date": "YYYY-MM-DD", "title": "Tên task ngắn gọn", "description": "Bắt đầu: HH:MM | Thời lượng: X giờ\\nChi tiết: Hướng dẫn cách làm", "energy_required": 1-5 }
  ],
  "coach_note": "Nhận xét ngắn về tiến độ và lời động viên thấu cảm"
}`;

    const result = await model.generateContent(prompt);
    let output = result.response.text().trim();

    if (output.startsWith('```json')) output = output.replace(/^```json/, '');
    if (output.startsWith('```')) output = output.replace(/^```/, '');
    if (output.endsWith('```')) output = output.replace(/```$/, '');
    output = output.trim();

    const data = JSON.parse(output);

    if (!data.tasks || !Array.isArray(data.tasks)) {
        throw new Error('AI trả về dữ liệu không hợp lệ');
    }


    await supabase.from('tasks')
        .delete()
        .eq('goal_id', activeGoal.id)
        .eq('status', 'pending');


    const newTasks = data.tasks.map((t: any, idx: number) => {
        const taskDate = t.date && t.date.match(/^\d{4}-\d{2}-\d{2}$/) ? t.date : today;
        return {
            user_id: user.id,
            goal_id: activeGoal.id,
            content: t.description ? `${t.title} - ${t.description}` : t.title,
            priority: idx + 1,
            energy_required: Math.min(5, Math.max(1, t.energy_required || 3)),
            status: 'pending',
            due_date: taskDate,
        };
    });

    await supabase.from('tasks').insert(newTasks);

    revalidatePath('/dashboard');

    return { success: true, coachNote: data.coach_note || '', taskCount: newTasks.length };
}

