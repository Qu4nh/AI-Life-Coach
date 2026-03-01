/** Project Configuration/Module: route.ts - Thiết lập và kiến trúc hệ thống. */
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/utils/supabase/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const rateLimitMap = new Map<string, { count: number, timestamp: number }>();

// Cơ chế Rate Limit in-memory để ngăn chặn spam API request từ người dùng.
const isRateLimited = (userId: string) => {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const maxRequests = 5;

  const userRecord = rateLimitMap.get(userId);
  if (!userRecord || now - userRecord.timestamp > windowMs) {
    rateLimitMap.set(userId, { count: 1, timestamp: now });
    return false;
  }

  if (userRecord.count >= maxRequests) {
    return true;
  }

  userRecord.count += 1;
  return false;
};

const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  systemInstruction: `Bạn là trợ lý hệ thống phân tích đoạn hội thoại Life Coach.
Nhiệm vụ: Trích xuất mục tiêu cuối cùng của người dùng và lập LỘ TRÌNH LÀM VIỆC DÀI HẠN thành format JSON thuần túy (không markdown).
QUAN TRỌNG BẬC NHẤT: Bạn PHẢI đọc kỹ lịch sử chat.
1. NẾU người dùng nhập thông tin rác, vô nghĩa, hãy trả về JSON bắt lỗi:
{
  "is_nonsense": true,
  "message": "Lời khuyên nhắc nhở nhẹ nhàng, hài hước bằng tiếng Việt yêu cầu user nghiêm túc nhập lại mục tiêu."
}
2. NẾU mục tiêu hợp lệ, hãy trích xuất Kế hoạch dựa trên 5 thông tin: Mục tiêu ban chốt, Thời lượng đầu tư, Ngày hoàn thành (Target Date), Trình độ hiện hành, và Các Khó khăn.

=== TRIẾT LÝ CỐT LÕI: ENERGY MANAGEMENT & GUILT-FREE ===
Bạn KHÔNG phải là một cỗ máy nhét việc vào lịch. Bạn là một HUẤN LUYỆN VIÊN THẤU CẢM.
Nguyên tắc tối thượng: "Sự bền bỉ quan trọng hơn cường độ" (Consistency > Intensity).
Mục tiêu: Giúp người dùng HOÀN THÀNH được mục tiêu một cách thoải mái nhất, không bị áp lực nhưng chất lượng vẫn đảm bảo.

=== QUY TẮC PHÂN BỔ TASKS - LINH HOẠT & CÁ NHÂN HÓA ===
- BẠN PHẢI CHIA NHỎ LỘ TRÌNH RA THÀNH TỪNG NGÀY CỤ THỂ (Bắt đầu từ ngày hôm nay).
- KHÔNG ĐƯỢC gộp nhiều ngày vào 1 task (CẤM dùng "Sáng 1-5/3", "Hàng ngày", "Mỗi tuần").
- SỐ LƯỢNG TASKS: KHÔNG DƯỚI 20 TASKS
- PHÂN BỔ LINH HOẠT, CÁ NHÂN HÓA theo bản chất mục tiêu:
  + CÓ ngày 0 task (ngày nghỉ xen kẽ để phục hồi năng lượng, đặc biệt sau 2-3 ngày làm việc liên tục).
  + CÓ ngày chỉ 1 task nhẹ (Micro-action: 5-15 phút, energy 1-2. VD: xem lại ghi chú, nghe podcast).
  + CÓ ngày 2-3 task khi mục tiêu cần tập trung cao độ.
  + KHÔNG BAO GIỜ quá 3 task/ngày.
- TẠO NHỊP THỞ: Xen kẽ ngày nặng → nhẹ → nghỉ. Không để 3 ngày nặng liên tiếp.
- CÁ NHÂN HÓA: Dựa vào quỹ thời gian, trình độ và khó khăn mà user chia sẻ để quyết định mật độ. Nếu user bận rộn → ít task/ngày hơn, nhiều ngày nghỉ hơn. Nếu user rảnh → có thể dày hơn nhưng vẫn giữ nhịp nghỉ.
- "date": Ngày thực hiện task (Định dạng "YYYY-MM-DD" chuẩn ISO).
- "title": TÊN HÀNH ĐỘNG NGẮN GỌN. KHÔNG bỏ mô tả, ghi chú vào đây. CẤM ghi "4 giờ/ngày".
- "description": GHI CHÚ / HƯỚNG DẪN cách làm chi tiết.
- "energy_required": Số nguyên 1-5 thể hiện mức năng lượng cần thiết.

Cấu trúc JSON bắt buộc:
{
  "is_nonsense": false,
  "title": "Tên mục tiêu bao quát nhất",
  "description": "Mô tả lộ trình CÁ NHÂN HÓA",
  "target_date": "YYYY-MM-DD",
  "tasks": [
    {
      "date": "YYYY-MM-DD",
      "title": "Học từ vựng IELTS chủ đề Education",
      "description": "Bắt đầu: 08:00 | Thời lượng: 1 giờ\nChi tiết: Dùng app Anki hoặc Quizlet để học 30 từ mới. Luyện phát âm từng từ.",
      "energy_required": 2
    },
    {
      "date": "YYYY-MM-DD",
      "title": "Làm test Reading Cam 18",
      "description": "Bắt đầu: 14:00 | Thời lượng: 1.5 giờ\nChi tiết: Bấm giờ làm full test nghiêm túc, chú ý tránh bẫy Not Given.",
      "energy_required": 4
    }
  ]
}
CHÚ Ý: target_date nếu không xác định thì để rỗng "null". KHÔNG bọc JSON trong markdown \`\`\`json.`
});

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (isRateLimited(user.id)) {
      return NextResponse.json({
        error: 'Too Many Requests',
        details: 'Hệ thống phát hiện dấu hiệu spam. Vui lòng nghỉ ngơi và thử lại sau 15 phút!'
      }, { status: 429 });
    }

    const { messages, events } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages array' }, { status: 400 });
    }

    const today = new Date().toLocaleDateString('vi-VN');
    let calendarContext = "Người dùng chưa cung cấp lịch trình cố định nào.";

    if (events && Array.isArray(events) && events.length > 0) {
      const hardEvents = events.filter((e: any) => e.is_hard_deadline);
      if (hardEvents.length > 0) {
        calendarContext = "CẢNH BÁO - NGƯỜI DÙNG CÓ CÁC LỊCH TRÌNH VÀ DEADLINE CỐ ĐỊNH SAU:\n" +
          hardEvents.map((e: any, idx: number) => `${idx + 1}. Ngày ${e.date}: ${e.title}`).join("\n") +
          "\n\nLUẬT BẮT BUỘC: BẠN TUYỆT ĐỐI KHÔNG ĐƯỢC XẾP TASK TRÙNG VÀO CÁC NGÀY NÀY BỞI VÌ NGƯỜI DÙNG RẤT BẬN/STRESS. HÃY DỜI TASK SANG NGÀY KHÁC VÀ ÉP TIẾN ĐỘ TRƯỚC DEADLINE.";
      }
    }

    const conversationText = messages.map((m: any) => `${m.role === 'assistant' ? 'AI Coach' : 'User'}: ${m.content}`).join('\n\n');

    /** Thêm instruction format ngày rõ ràng để AI lấy mốc thời gian */
    const isoDate = new Date().toISOString().split('T')[0];
    const prompt = `Hôm nay là ngày: ${today} (Định dạng ISO: ${isoDate})\n\nTHÔNG TIN LỊCH TRÌNH CÁ NHÂN (HARD CONSTRAINTS):\n${calendarContext}\n\n---\n\nDựa vào đoạn hội thoại và thông tin Lịch trình trên, hãy tạo lộ trình JSON:\n\n${conversationText}`;

    const result = await model.generateContent(prompt);
    let output = result.response.text().trim();

    if (output.startsWith('```json')) output = output.replace(/^```json/, '');
    if (output.startsWith('```')) output = output.replace(/^```/, '');
    if (output.endsWith('```')) output = output.replace(/```$/, '');

    output = output.trim();

    try {
      const data = JSON.parse(output);
      return NextResponse.json(data);
    } catch (parseError: any) {
      console.error('JSON Parse Error! Raw output was:\n', output);
      console.error('Parse Error Details:', parseError);
      return NextResponse.json({ error: 'Failed to parse AI output', raw: output }, { status: 500 });
    }

  } catch (error: any) {
    console.error('API Roadmap Error:', error);

    if (error.status === 429 || (error.message && error.message.includes('429'))) {
      return NextResponse.json({ error: 'Quá tải hệ thống', details: 'Hệ thống dùng Cốt lõi AI miễn phí và đang quá hạn mức Request. Bạn hãy đợi khoảng 1 phút rồi mới ấn Chốt lại nha!' }, { status: 429 });
    }

    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
