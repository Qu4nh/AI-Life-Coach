/** Server Actions: Lưu trữ cấu hình khởi tạo hệ thống (Initial Setup). */
'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function saveRoadmap(roadmapData: any) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login')
    }

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
            target_date: roadmapData.target_date || null,
        }).select().single()

        if (goalError) throw goalError

        
        const tasksToInsert = roadmapData.tasks.map((task: any, index: number) => ({
            user_id: user.id,
            goal_id: goal.id,
            content: `${task.title} - ${task.description}`,
            priority: index, 
            energy_required: 3, 
        }))

        const { error: tasksError } = await supabase.from('tasks').insert(tasksToInsert)

        if (tasksError) throw tasksError

    } catch (error) {
        console.error('Lỗi khi lưu Roadmap vào Supabase:', error)
        throw new Error('Có lỗi xảy ra khi lưu Kế hoạch. Vui lòng thử lại.')
    }

    
    redirect('/dashboard')
}
