/** Project Configuration/Module: route.ts - Thiết lập và kiến trúc hệ thống. */
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/utils/supabase/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');


const rateLimitMap = new Map<string, { count: number, timestamp: number }>();

// Cơ chế Rate Limit in-memory để ngăn chặn spam API request từ người dùng.
// TODO: Cân nhắc chuyển sang cấu trúc persistent (Redis/Upstash) khi scale hệ thống.
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
Nhiệm vụ: Trích xuất mục tiêu cuối cùng của người dùng và các bước thực hiện thành format JSON thuần túy (không có markdown).
QUAN TRỌNG BẬC NHẤT: Bạn PHẢI đọc kỹ lịch sử chat.
1. NẾU người dùng nhập thông tin rác, vô nghĩa (vd: 'asdasd', '1q2w3e'), quá ngắn, đùa cợt, hoặc không xác định được bất kỳ mục tiêu phát triển bản thân nào, hãy trả về JSON bắt lỗi:
{
  "is_nonsense": true,
  "message": "Lời khuyên nhắc nhở nhẹ nhàng, hài hước bằng tiếng Việt yêu cầu user nghiêm túc nhập lại mục tiêu."
}
2. NẾU mục tiêu hợp lệ, hãy trích xuất và đưa vào Kế hoạch. Đồng thời sử dụng cả 5 thông tin: Mục tiêu ban chốt, Thời lượng muốn đầu tư, Ngày hoàn thành (Target Date), Trình độ hiện hành, và Các Khó khăn để cá nhân hóa lộ trình.
Cấu trúc bắt buộc cho mục tiêu HỢP LỆ:
{
  "is_nonsense": false,
  "title": "Tên mục tiêu bao quát nhất (dưới 10 chữ)",
  "description": "Mô tả lộ trình CÁ NHÂN HÓA (1-2 câu, đánh giá tính khả thi dựa trên 5 dữ kiện)",
  "target_date": "YYYY-MM-DD",
  "tasks": [
    {
      "title": "Hành động cụ thể (VD: Học 30 từ vựng - Bắt đầu: 17:00 | Thời lượng: 1 giờ)",
      "description": "Chi tiết cách làm ngắn gọn phù hợp trình độ và giải quyết khó khăn (1-2 câu)"
    }
  ]
}
CHÚ Ý QUAN TRỌNG VỀ target_date: Nếu người dùng có nhắc đến ngày giờ cụ thể, hãy parse sang ISO 8601 (YYYY-MM-DD). Nếu họ không rõ ngày, hoặc nhập "Bỏ qua", hãy để giá trị này là "null" (không có string quote quanh null).
CHÚ Ý QUAN TRỌNG: Chỉ trả về Object JSON hợp lệ. Không bọc trong \`\`\`json, không giải thích gì thêm.`
});

/**
 * Endpoint khởi tạo lộ trình cá nhân hóa (Roadmap) thông qua Gemini 2.5 Flash.
 * Tích hợp dữ liệu lịch trình (Hard Constraints) để khóa ngày bận của user.
 */
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
      const hardEvents = events.filter(e => e.is_hard_deadline);
      if (hardEvents.length > 0) {
        calendarContext = "CẢNH BÁO - NGƯỜI DÙNG CÓ CÁC LỊCH TRÌNH VÀ DEADLINE CỐ ĐỊNH SAU:\n" +
          hardEvents.map((e, idx) => `${idx + 1}. Ngày ${e.date}: ${e.title}`).join("\n") +
          "\n\nLUẬT BẮT BUỘC: BẠN TUYỆT ĐỐI KHÔNG ĐƯỢC XẾP TASK TRÙNG VÀO CÁC NGÀY NÀY BỞI VÌ NGƯỜI DÙNG RẤT BẬN/STRESS. HÃY DỜI TASK SANG NGÀY KHÁC VÀ ÉP TIẾN ĐỘ TRƯỚC DEADLINE.";
      }
    }

    const conversationText = messages.map((m: any) => `${m.role === 'assistant' ? 'AI Coach' : 'User'}: ${m.content}`).join('\n\n');
    const prompt = `Hôm nay là ngày: ${today}\n\nTHÔNG TIN LỊCH TRÌNH CÁ NHÂN (HARD CONSTRAINTS):\n${calendarContext}\n\n---\n\nDựa vào đoạn hội thoại và thông tin Lịch trình trên, hãy tạo lộ trình JSON:\n\n${conversationText}`;

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
