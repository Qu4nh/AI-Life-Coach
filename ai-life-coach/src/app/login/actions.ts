/** Server Actions: Business logic cho luồng Authentication (Login/Signup). */
'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function signInWithGoogle() {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
        },
    })

    if (error) {
        console.error('Google sign in error:', error)
        return redirect('/login?message=Could not authenticate user')
    }

    if (data.url) {
        return redirect(data.url)
    }
}

export async function login(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        console.error('Login error:', error.message)
        return redirect(`/login?message=${encodeURIComponent('Sai email hoặc mật khẩu!')}`)
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
        const { count } = await supabase.from('goals').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
        if (count && count > 0) {
            return redirect('/dashboard')
        }
    }

    return redirect('/onboarding')
}

export async function signup(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
        },
    })

    if (error) {
        console.error('Signup error:', error.message)
        return redirect(`/login?message=${encodeURIComponent(error.message)}`)
    }

    if (!data.session) {
        return redirect(`/login?message=${encodeURIComponent('Bạn cần mở Hộp thư Email để bấm nút Xác nhận tài khoản nhé!')}`)
    }

    return redirect('/onboarding')
}

export async function loginAsGuest() {
    const supabase = await createClient()
    const randomIndex = Math.floor(Math.random() * 10) + 1;
    const email = `giamkhao_${randomIndex}@aiyoungguru.vn`
    const password = 'aiyoungguru2026vip'

    let { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (signInError) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
        })

        if (signUpError) {
            console.error('Guest Signup error:', signUpError.message)
            return redirect(`/login?message=${encodeURIComponent('Lỗi tạo tài khoản Demo: ' + signUpError.message)}`)
        }
        data = signUpData as any;
    }

    if (!data.session) {
        return redirect(`/login?message=${encodeURIComponent('Vui lòng vào Supabase (Auth -> Providers -> Email) TẮT tính năng "Confirm Email" để dùng Trải nghiệm nhanh!')}`)
    }

    if (data.user) {
        await supabase.from('goals').delete().eq('user_id', data.user.id);
        await supabase.from('tasks').delete().eq('user_id', data.user.id);
        await supabase.from('events').delete().eq('user_id', data.user.id);
        await supabase.from('daily_logs').delete().eq('user_id', data.user.id);
    }

    return redirect('/onboarding')
}
