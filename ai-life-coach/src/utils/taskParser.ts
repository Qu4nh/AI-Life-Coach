/** Data Transformer: Bóc tách và map chuẩn định dạng Task từ AI response payload. */
export interface TaskDisplayInfo {
    title: string;
    note: string;
    time: string;
    duration: string;
    timeValue: number; 
}


export function parseTaskContent(content: string, isTask: boolean = true, titleFallback?: string): TaskDisplayInfo {
    const fullContent = content || titleFallback || '';

    let title = fullContent;
    let note = '';
    let time = '';
    let duration = '';
    let timeValue = 9999; 

    if (isTask) {
        
        const dashIndex = fullContent.indexOf(' - ');
        if (dashIndex !== -1) {
            title = fullContent.substring(0, dashIndex);
            let restContent = fullContent.substring(dashIndex + 3);

            if (restContent.includes('Bắt đầu:') || restContent.includes('Thời lượng:')) {
                const lines = restContent.split('\n');
                const firstLine = lines[0]; 
                const timeParts = firstLine.split(' | ');

                timeParts.forEach(part => {
                    const cleanPart = part.trim();
                    if (cleanPart.startsWith('Bắt đầu:')) {
                        time = cleanPart.replace('Bắt đầu:', '').trim();
                    } else if (cleanPart.startsWith('Thời lượng:')) {
                        duration = cleanPart.replace('Thời lượng:', '').trim();
                    }
                });

                
                if (lines.length > 1) {
                    const remainingLines = lines.slice(1).join('\n').trim();
                    if (remainingLines.startsWith('Chi tiết:')) {
                        note = remainingLines.replace('Chi tiết:', '').trim();
                    } else {
                        note = remainingLines;
                    }
                }
            } else {
                
                note = restContent;
            }
        }
    } else {
        title = titleFallback || fullContent;
        note = content && content !== titleFallback ? content : '';
    }

    
    if (time) {
        const timeMatch = time.match(/(\d{1,2})[:hH](\d{2})?/i);
        if (timeMatch) {
            const h = parseInt(timeMatch[1], 10);
            const m = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
            timeValue = h * 60 + m;
        }
    }

    return { title, note, time, duration, timeValue };
}
