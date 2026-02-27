/** Server Actions: Giao tiếp với Database xử lý đối tượng Lịch trình. */
'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getEvents() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Not authenticated');
    }

    const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

    if (error) {
        console.error('Error fetching events:', JSON.stringify(error, null, 2));
        throw new Error(`Failed to fetch events: ${error.message} (Code: ${error.code})`);
    }

    return events;
}

export async function createEvent(title: string, date: string, isHardDeadline: boolean = true) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Not authenticated');
    }

    const { error } = await supabase
        .from('events')
        .insert({
            user_id: user.id,
            title,
            date,
            is_hard_deadline: isHardDeadline
        });

    if (error) {
        console.error('Error creating event:', JSON.stringify(error, null, 2));
        throw new Error(`Failed to create event: ${error.message} (Code: ${error.code})`);
    }

    revalidatePath('/dashboard');
    return { success: true };
}

export async function deleteEvent(eventId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Not authenticated');
    }

    const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error deleting event:', JSON.stringify(error, null, 2));
        throw new Error(`Failed to delete event: ${error.message} (Code: ${error.code})`);
    }

    revalidatePath('/dashboard');
    return { success: true };
}

export async function createCalendarTask(title: string, note: string, dateStr: string, energy: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Not authenticated');
    }

    
    const { data: goals } = await supabase
        .from('goals')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

    const goalId = goals && goals.length > 0 ? goals[0].id : null;

    let content = title;
    if (note && note.trim() !== '') {
        content = `${title} - ${note}`;
    }

    const { error } = await supabase
        .from('tasks')
        .insert({
            user_id: user.id,
            goal_id: goalId,
            content: content,
            energy_required: Math.round(energy),
            priority: 2,
            due_date: dateStr,
            status: 'pending'
        });

    if (error) {
        console.error('Error creating task from calendar:', JSON.stringify(error, null, 2));
        throw new Error(`Failed to create task: ${error.message}`);
    }

    revalidatePath('/dashboard');
    return { success: true };
}

export async function deleteCalendarTask(taskId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Not authenticated');
    }

    const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error deleting task:', JSON.stringify(error, null, 2));
        throw new Error(`Failed to delete task: ${error.message} (Code: ${error.code})`);
    }

    revalidatePath('/dashboard');
    return { success: true };
}
