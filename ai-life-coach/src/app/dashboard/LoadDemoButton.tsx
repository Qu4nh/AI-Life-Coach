/** UI Component: Nút nạp mock data hỗ trợ quá trình staging/demo. */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadMockData } from './actions';
import { Sparkles } from 'lucide-react';

export default function LoadDemoButton({ onLoadSuccess }: { onLoadSuccess?: () => void }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLoad = async () => {
        setLoading(true);
        try {
            const result = await loadMockData();
            if (result && !result.success) {
                alert('Lỗi tạo dữ liệu demo: ' + result.error);
            } else {
                if (onLoadSuccess) onLoadSuccess();
                localStorage.removeItem('ai-coach-tour-seen');
                router.refresh();
                setTimeout(() => window.dispatchEvent(new Event('restart-tour')), 800);
            }
        } catch (err: any) {
            alert('Lỗi cục bộ: ' + (err?.message || ''));
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleLoad}
            disabled={loading}
            className="liquid-glass-btn px-6 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2 disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
        >
            {loading ? (
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
            ) : (
                <Sparkles className="w-4 h-4 text-amber-300" />
            )}
            {loading ? 'Đang tạo dữ liệu...' : 'Nạp Dữ Liệu Demo'}
        </button>
    );
}
