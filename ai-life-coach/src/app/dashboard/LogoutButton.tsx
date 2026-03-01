'use client';

import { LogOut } from 'lucide-react';
import { useTransition } from 'react';
import { logout } from './actions';

export default function LogoutButton() {
    const [isPending, startTransition] = useTransition();

    return (
        <button
            onClick={() => startTransition(logout)}
            disabled={isPending}
            className="group flex items-center gap-2 px-3 py-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10 transition-all text-xs font-medium cursor-pointer"
            title="Đăng xuất"
        >
            <LogOut className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
            <span className="hidden sm:inline-block">Đăng xuất</span>
        </button>
    );
}
