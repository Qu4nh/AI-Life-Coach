'use server'

import { createClient } from '@/utils/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function generateAIMemory(userId: string) {
    try {
        const supabase = await createClient();

        // 1. Get last 7 days of daily logs
        const { data: logs } = await supabase
            .from('daily_logs')
            .select('date, energy_level, mood, notes')
            .eq('user_id', userId)
            .order('date', { ascending: false })
            .limit(7);

        // 2. Get recently completed tasks (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const { data: tasks } = await supabase
            .from('tasks')
            .select('content, energy_required, due_date')
            .eq('user_id', userId)
            .eq('status', 'completed')
            .gte('due_date', sevenDaysAgo.toISOString().split('T')[0])
            .order('due_date', { ascending: false })
            .limit(20);

        if (!logs || logs.length === 0) return; // Not enough data yet

        const logsContext = logs.map(l => `Ngày ${l.date}: Năng lượng ${l.energy_level}/5, Tâm trạng: ${l.mood}. Ghi chú: ${l.notes || 'không'}`).join('\n');
        const tasksContext = (tasks || []).map(t => `- Hoàn thành: ${t.content} (Năng lượng: ${t.energy_required}, Ngày: ${t.due_date})`).join('\n');

        const prompt = `Bạn là Core AI của một hệ thống Life Coach.
Nhiệm vụ của bạn là suy nghĩ ngầm (internal thought process) về hành vi, thói quen sinh học, hoặc hiệu suất của người dùng dựa trên dữ liệu 7 ngày qua.
Hãy viết ĐÚNG MỘT CÂU INSIGHT ngắn gọn (dưới 40 chữ), bắt đầu bằng "[Insight]". 
Ví dụ: "[Insight] User thường cạn năng lượng vào giữa tuần, cần tránh xếp task khó vào thứ 4." hoặc "[Insight] Phát hiện năng suất cao khi làm việc vào buổi sáng, nên ưu tiên task quan trọng."

Dữ liệu Check-in 7 ngày qua:
${logsContext}

Dữ liệu Task đã hoàn thành 7 ngày qua:
${tasksContext || 'Chưa hoàn thành task nào.'}

Hãy xuất ra đúng 1 câu duy nhất.`;

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const result = await model.generateContent(prompt);
        const insight = result.response.text().trim();

        if (insight && insight.startsWith('[Insight]')) {
            await supabase.from('ai_memory').insert({
                user_id: userId,
                type: 'coach_note',
                content: insight,
            });
        }
    } catch (err) {
        console.error('Lỗi khi generate AI Memory ngầm:', err);
    }
}
