/** Server Actions: Lưu trữ cấu hình khởi tạo hệ thống (Initial Setup). */
'use server'

import { createClient } from '@/utils/supabase/server'

function getVietnamToday(): string {
    return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
}

export async function saveRoadmap(roadmapData: any) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Chưa đăng nhập' }
    }

    const today = getVietnamToday();

    try {
        await supabase.from('profiles').upsert({
            id: user.id,
            email: user.email,
        }, { onConflict: 'id' })

        const { data: goal, error: goalError } = await supabase.from('goals').insert({
            user_id: user.id,
            title: roadmapData.title,
            description: roadmapData.description,
            type: 'long_term',
            deadline: roadmapData.target_date || null,
        }).select().single()

        if (goalError) throw goalError

        const tasksToInsert = roadmapData.tasks.map((task: any, index: number) => {
            // Lấy ngày do AI phân bổ. Nếu AI không sinh field date hoặc sai format, fallback về today.
            const taskDate = task.date && task.date.match(/^\d{4}-\d{2}-\d{2}$/) ? task.date : today;

            return {
                user_id: user.id,
                goal_id: goal.id,
                content: `${task.title} - ${task.description}`,
                priority: index,
                energy_required: Math.min(5, Math.max(1, task.energy_required || 3)),
                due_date: taskDate,
            };
        });

        const { error: tasksError } = await supabase.from('tasks').insert(tasksToInsert)

        if (tasksError) throw tasksError

    } catch (error) {
        console.error('Lỗi khi lưu Roadmap vào Supabase:', error)
        return { success: false, error: 'Có lỗi xảy ra khi lưu Kế hoạch. Vui lòng thử lại.' }
    }

    return { success: true }
}
