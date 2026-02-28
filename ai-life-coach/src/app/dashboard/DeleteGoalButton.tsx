/** UI Component: Xử lý logic xóa phân mảnh mục tiêu. */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteGoal } from './actions';
import { Trash2 } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

export default function DeleteGoalButton({ goalId }: { goalId: string }) {
    const [isPending, setIsPending] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        setIsPending(true);
        try {
            const result = await deleteGoal(goalId);
            if (!result.success) {
                alert(`Lỗi khi xóa mục tiêu:\n${result.error}`);
            } else {
                router.refresh();
            }
        } catch (error: any) {
            console.error('Lỗi khi gọi action xóa mục tiêu:', error);
            alert(`Lỗi hệ thống:\n${error?.message || JSON.stringify(error)}`);
        } finally {
            setIsPending(false);
            setShowConfirm(false);
        }
    };
    return (
        <>
            <button
                onClick={() => setShowConfirm(true)}
                disabled={isPending}
                title="Xóa Mục Tiêu"
                className="p-1.5 text-white/40 sm:text-white/15 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all opacity-100 sm:opacity-0 group-hover:opacity-100 focus:opacity-100"
            >
                {isPending ? (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-rose-300 border-t-transparent animate-spin"></div>
                ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                )}
            </button>

            <ConfirmModal
                isOpen={showConfirm}
                title="Xóa Mục Tiêu?"
                message="Hành động này sẽ xóa VĨNH VIỄN mục tiêu này cùng toàn bộ các Tasks liên kết. Không thể hoàn tác."
                confirmLabel="Xóa vĩnh viễn"
                cancelLabel="Quay lại"
                onConfirm={handleDelete}
                onCancel={() => setShowConfirm(false)}
                isLoading={isPending}
                variant="danger"
            />
        </>
    );
}
