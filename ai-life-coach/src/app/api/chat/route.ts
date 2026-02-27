/** API Endpoint: Xử lý luồng Stream AI Chat (Conversation Logic). */
import { NextResponse } from 'next/server';
import { geminiModel } from '@/data/ai/GeminiWrapper';

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        
        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: 'Invalid messages array' }, { status: 400 });
        }

        
        let historyRaw = messages.slice(0, -1);

        
        while (historyRaw.length > 0 && historyRaw[0].role !== 'user') {
            historyRaw.shift();
        }

        const history = historyRaw.map((msg: any) => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }],
        }));

        const latestMessage = messages[messages.length - 1].content;

        
        const chatSession = geminiModel.startChat({
            history,
            generationConfig: {
                maxOutputTokens: 1000,
                temperature: 0.7,
            },
        });

        
        const result = await chatSession.sendMessage(latestMessage);
        const responseText = result.response.text();

        return NextResponse.json({
            id: Date.now().toString(),
            role: 'assistant',
            content: responseText
        });

    } catch (error: any) {
        console.error('API Chat Error:', error);

        if (error.status === 429 || (error.message && error.message.includes('429'))) {
            return NextResponse.json({ error: 'Quá tải hệ thống', details: 'Hệ thống dùng Cốt lõi AI miễn phí và đang quá hạn mức Request. Bạn hãy đợi khoảng 1 phút rồi mới nhắn tiếp nha!' }, { status: 429 });
        }

        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
