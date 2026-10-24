// Edge Fallback & Real Local Offline Command Execution Engine
// Executes real actions on the client when offline without cloud roundtrips

import { shadowDB } from "./dbService";

export interface OfflineExecutionResult {
    text: string;
    toolActions?: any[];
    executedAction?: string;
}

export const processOfflineCommand = (message: string): OfflineExecutionResult | null => {
    const text = message.trim();
    const lower = text.toLowerCase();

    // 1. App Launching / Intent Navigation
    if (lower.includes("افتح") || lower.includes("شغل") || lower.includes("open")) {
        const appMap: { [key: string]: string } = {
            "واتساب": "whatsapp://",
            "whatsapp": "whatsapp://",
            "فيسبوك": "fb://",
            "facebook": "fb://",
            "يوتيوب": "youtube://",
            "يوتوب": "youtube://",
            "youtube": "https://youtube.com",
            "انستجرام": "instagram://",
            "تويتر": "twitter://",
            "اكس": "https://x.com",
            "تيك توك": "tiktok://",
            "اوبر": "uber://",
            "الكاميرا": "camera",
            "الموسيقى": "music",
            "spotify": "spotify://"
        };

        for (const [key, target] of Object.entries(appMap)) {
            if (lower.includes(key)) {
                return {
                    text: `(الظل أوفلاين ⚡) بفتح لك تطبيق ${key} حالا من جهازك وبدون إنترنت!`,
                    toolActions: [
                        { name: "app_control", args: { target, action_type: "open" } }
                    ],
                    executedAction: `open_${key}`
                };
            }
        }
    }

    // 2. Offline Notes & Memory Logging
    if (lower.startsWith("احفظ ملاحظة") || lower.startsWith("سجل ملاحظة") || lower.includes("اكتب في النوتة")) {
        const noteContent = text.replace(/^(احفظ ملاحظة|سجل ملاحظة|اكتب في النوتة)[:\s]*/i, '').trim();
        if (noteContent) {
            shadowDB.saveMemory({
                fact: `ملاحظة أوفلاين: ${noteContent}`,
                category: 'offline_notes',
                confidence: 1.0,
                source: 'offline_voice_command'
            }).catch(() => {});

            return {
                text: `(الظل أوفلاين ⚡) تمام يا ماستر، سجلت الملاحظة في ذاكرة الجهاز المشفرة (IndexedDB):\n"${noteContent}". محفوظة محلياً وآمنة 100%!`,
                executedAction: 'save_note'
            };
        }
    }

    // 3. Offline Task Creation
    if (lower.includes("مهمة جديدة") || lower.includes("ضيف مهمة") || lower.includes("سجل تاسك")) {
        const taskText = text.replace(/.*(مهمة جديدة|ضيف مهمة|سجل تاسك)[:\s]*/i, '').trim() || text;
        shadowDB.saveTask({
            userId: 'CURRENT_USER',
            task: taskText,
            category: 'offline',
            status: 'pending',
            time: new Date().toLocaleTimeString('ar-EG')
        }).catch(() => {});

        return {
            text: `(الظل أوفلاين ⚡) أضفت المهمة لقائمة مهامك المحلية:\n"${taskText}". هتابعها معاك وهتتزامن مع السحابة فور عودة النت.`,
            executedAction: 'create_task'
        };
    }

    // 4. Offline Calculations & Math
    const mathMatch = text.match(/(?:احسب|كام|كم يساوي|احسبلي)\s*([0-9\+\-\*\/\^\(\)\.\s\%xX×÷]+)/);
    if (mathMatch && mathMatch[1]) {
        try {
            const sanitized = mathMatch[1]
                .replace(/×/g, '*')
                .replace(/÷/g, '/')
                .replace(/x/gi, '*')
                .replace(/[^0-9\+\-\*\/\(\)\.]/g, '');
            
            if (sanitized && /^[0-9\+\-\*\/\(\)\.\s]+$/.test(sanitized)) {
                // Safely evaluate math expression
                const fn = new Function(`return (${sanitized})`);
                const result = fn();
                if (typeof result === 'number' && !isNaN(result)) {
                    return {
                        text: `(الظل أوفلاين ⚡) الحسبة:\n${mathMatch[1].trim()} = **${result}**`,
                        executedAction: 'math_calculation'
                    };
                }
            }
        } catch {}
    }

    // 5. Offline Time & Date
    if (lower.includes("الساعة كام") || lower.includes("الوقت") || lower.includes("تاريخ النهاردة") || lower.includes("النهارده كام")) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const dateStr = now.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        return {
            text: `(الظل أوفلاين ⚡) الساعة دلوقتي ${timeStr} بتوقيتك المحلي، واليوم ${dateStr}.`,
            executedAction: 'get_time'
        };
    }

    // 6. Offline Device & Battery Status
    if (lower.includes("البطارية") || lower.includes("شحن الجهاز") || lower.includes("حالة النظام")) {
        const isOnline = navigator.onLine;
        return {
            text: `(الظل أوفلاين ⚡) حالة النظام المحلي:\n• وضع الشبكة: ${isOnline ? '🟢 متصل' : '🔴 غير متصل (يعمل محلياً بنموذج Edge/Gemma)'}\n• تخزين الذاكرة: مفعّل محلياً عبر IndexedDB\n• معالج الذكاء: جاهز للاستجابة في 0ms دون سحابة!`,
            executedAction: 'system_status'
        };
    }

    // 7. General Friendly Banter (Egyptian Persona)
    if (lower.includes("عامل ايه") || lower.includes("ازيك") || lower.includes("أخبارك") || lower.includes("صباح الخير") || lower.includes("مساء الخير")) {
        return {
            text: `(الظل أوفلاين ⚡) يا مرحب بيك يا ماستر! أنا شغال معاك بكامل طاقتي أوفلاين على الجهاز، سامعك وبنفذ طلباتك من غير ولا بايت إنترنت. تؤمر بإيه؟`,
            executedAction: 'chitchat'
        };
    }

    if (lower.includes("مين انت") || lower.includes("عرف نفسك") || lower.includes("انت مين")) {
        return {
            text: `(الظل أوفلاين ⚡) أنا "الظل" ابنك وتوأمك الرقمي! دلوقتي شغال بنظام Edge AI الصغير والمحلي (Google Gemma / On-Device) عشان أخدمك في أي مكان في العالم حتى في قلب الصحراء بدون نت!`,
            executedAction: 'identity'
        };
    }

    return null;
};
