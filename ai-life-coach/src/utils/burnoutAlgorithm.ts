/**
 * Thuật toán lõi: Burnout Risk Score (Mô hình Phân luồng Cảm xúc Thích ứng)
 * Công thức: Score_i = Softmax [ α(t)*(E_user - E_task) + β(t)*W_priority + γ(t)*e^(λ*U_urgency) ]
 */

export interface TaskInput {
    id: string;
    energy_required: number;
    priority: number;
    due_date?: string | null;
}

/**
 * @param dueDate Ngày deadline
 * @returns urgency score
 */
function calculateUrgency(dueDate?: string | null): number {
    if (!dueDate) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deadline = new Date(dueDate);
    deadline.setHours(0, 0, 0, 0);

    const timeDiff = deadline.getTime() - today.getTime();
    const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (daysLeft < 0) return 5; // Quá hạn
    if (daysLeft === 0) return 4; // Hôm nay
    if (daysLeft <= 1) return 3; // Ngày mai
    if (daysLeft <= 3) return 2; // Sắp tới
    if (daysLeft <= 7) return 1; // Tuần này
    return 0; // Hơn 1 tuần
}

/**
 * Tính điểm Priority ngược (Ký hiệu gốc: 1 là cao nhất, chuyển sang scale: cao hơn là quan trọng hơn)
 */
function normalizePriority(originalPriority: number): number {
    // Nếu db lưu 1 là quan trọng nhất, ta lật ngược lại: 5 - 1 = 4 (cao)
    // Nếu lưu 5 là thấp nhất: 5 - 5 = 0 (thấp)
    return Math.max(0, 5 - originalPriority);
}

/**
 * Tính toán Burnout Risk Score cho một danh sách task
 * @param userEnergy Mức năng lượng hiện tại của user (1-5)
 * @param tasks Danh sách task đầu vào
 * @param weights Các trọng số (a, b, g, lambda) - Có thể điều chỉnh động (dynamic calibration) sau này
 * @returns Danh sách task đã đính kèm Softmax Score và Fallback triggers
 */
export function calculateBurnoutRisk(
    userEnergy: number,
    tasks: TaskInput[],
    weights = { alpha: 1.5, beta: 1.0, gamma: 0.8, lambda: 0.5 }
) {
    if (!tasks || tasks.length === 0) return [];

    const rawScores = tasks.map(task => {
        // 1. Chênh lệch năng lượng: (E_user - E_task)
        // Nếu user mệt (1) mà task nặng (5) => diff = -4 => Kéo score xuống 
        const energyDiff = userEnergy - (task.energy_required || 3);

        // 2. Độ quan trọng W_priority
        const wPriority = normalizePriority(task.priority || 3);

        // 3. Độ khẩn cấp U_urgency
        const uUrgency = calculateUrgency(task.due_date);

        // Tính raw score trước khi softmax
        // α * (E_user - E_task) + β * W_priority + γ * e^(λ * U_urgency)
        const exponentialUrgency = Math.exp(weights.lambda * uUrgency);

        const rawScore =
            (weights.alpha * energyDiff) +
            (weights.beta * wPriority) +
            (weights.gamma * exponentialUrgency);

        return {
            task,
            rawScore,
            energyDiff,
            uUrgency,
            wPriority
        };
    });

    // Tính Softmax (Chuyển raw score thành xác suất/chỉ số phân tích tương quan 0-1)
    const maxRaw = Math.max(...rawScores.map(t => t.rawScore)); // Tránh tràn số (overflow)
    const expScores = rawScores.map(t => Math.exp(t.rawScore - maxRaw));
    const sumExp = expScores.reduce((a, b) => a + b, 0);

    return rawScores.map((item, index) => {
        const softmaxScore = expScores[index] / sumExp;

        // Kích hoạt Fallback Flow nếu điều kiện quá sức diễn ra
        // VD: diff < 0 (Task đòi năng lượng cao hơn mức hiện tại) VÀ không quá khẩn cấp
        let fallbackAction: 'none' | 'reschedule' | 'micro_tasking' | 'hide' = 'none';

        if (item.energyDiff < 0) {
            if (item.uUrgency >= 3) {
                // Sắp tới hạn nhưng quá mệt => Bắt buộc nhưng khuyên chia nhỏ
                fallbackAction = 'micro_tasking';
            } else if (item.uUrgency > 0 && item.uUrgency < 3) {
                // Còn thời gian => Gợi ý dời lịch
                fallbackAction = 'reschedule';
            } else {
                // Không khẩn cấp, mà đang mệt => Ẩn luôn để bớt overwhelm
                fallbackAction = 'hide';
            }
        }

        return {
            id: item.task.id,
            originalTask: item.task,
            rawScore: item.rawScore,
            softmaxScore: softmaxScore,
            fallbackAction,
            metrics: {
                energyDiff: item.energyDiff,
                urgency: item.uUrgency,
                priority: item.wPriority
            }
        };
    }).sort((a, b) => b.rawScore - a.rawScore); // Xếp cao nhất (nên làm nhất) lên đầu
}
