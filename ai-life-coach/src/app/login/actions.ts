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
    const randomId = Math.random().toString(36).substring(2, 8)
    const email = `giamkhao_${randomId}@aiyoungguru.vn`
    const password = 'aiyoungguru2026vip'

    const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
    })

    if (signUpError) {
        console.error('Guest Signup error:', signUpError.message)
        return redirect(`/login?message=${encodeURIComponent('Lỗi tạo tài khoản Demo: ' + signUpError.message)}`)
    }

    if (!data.session) {
        // Cảnh báo nếu Supabase dự án đang bật "Confirm Email". Giám khảo không thể auto-login được.
        return redirect(`/login?message=${encodeURIComponent('Vui lòng vào Supabase (Auth -> Providers -> Email) TẮT tính năng "Confirm Email" để dùng Trải nghiệm nhanh!')}`)
    }

    // Đã signup và login thành công bằng tài khoản trinh nguyên, chuyển thẳng Onboarding.
    return redirect('/onboarding')
}
