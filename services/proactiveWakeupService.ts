import { omnichannelService } from './omnichannelService';
import { shadowDB, UserProfile } from './dbService';
import { getShadowResponse } from './geminiService';
import { generateMp3FromShadowVoice } from './speechService';
import { showSafeNotification } from './notificationService';

export interface MorningBriefingData {
    greeting: string;
    weather: string;
    tasksCount: number;
    upcomingMeeting?: string;
    audioBase64?: string;
    timestamp: number;
}

class ProactiveWakeupService {
    private isScheduled: boolean = false;
    private timer: any = null;

    public init() {
        if (this.isScheduled) return;
        this.isScheduled = true;
        this.checkScheduleRoutine();
        // Check every 30 minutes
        this.timer = setInterval(() => this.checkScheduleRoutine(), 30 * 60 * 1000);
    }

    private async checkScheduleRoutine() {
        const now = new Date();
        const currentHour = now.getHours();
        const lastBriefingDate = localStorage.getItem('shadow_last_morning_briefing');
        const todayStr = now.toDateString();

        // Trigger morning briefing between 7 AM and 10 AM once per day
        if (currentHour >= 7 && currentHour <= 10 && lastBriefingDate !== todayStr) {
            localStorage.setItem('shadow_last_morning_briefing', todayStr);
            await this.generateAndDispatchMorningBriefing();
        }
    }

    public async generateAndDispatchMorningBriefing(userOverride?: UserProfile): Promise<string> {
        try {
            const user = userOverride || await shadowDB.getProfile('GUEST') || { name: 'يا ماستر', email: 'GUEST', tier: 'sovereign', status: 'active', joinedAt: Date.now() } as UserProfile;
            const tasks = await shadowDB.getTasks(user.email || 'GUEST');
            const pendingTasks = tasks.filter(t => t.status === 'pending');
            
            const prompt = `أنت الظل الرقمي (المساعد المصري الذكي للماستر ${user.name || 'يا غالي'}).
الساعة الآن في الصباح، قم بإنشاء رسالة صباحية دافئة، ملهمة، وخفيفة الدم باللهجة المصرية الأصيلة:
1. تصبح عليه بحرارة.
2. تذكره بأن لديه (${pendingTasks.length}) مهام معلقة اليوم (مثل: ${pendingTasks.slice(0, 2).map(t => t.task).join(' و ') || 'يومك رايق بدون ضغوط'}).
3. تعطيه نصيحة أو جرعة طاقة إيجابية للبدء فوراً.
اجعل الرسالة مختصرة وجميلة جداً لا تتجاوز 3 إلى 4 أسطر.`;

            const aiResponse = await getShadowResponse([], prompt, undefined, user);
            const briefingText = aiResponse.text || `صباح الفل يا ماستر! يوم جديد وطاقة جديدة، ووراك ${pendingTasks.length} مهام معلقة نخلصها سوا بكل سلاسة.`;

            // 1. Send Push notification locally
            await showSafeNotification("🌅 صباح الخير من الظل!", {
                body: briefingText.substring(0, 120) + "...",
                icon: "/favicon.ico"
            });

            // 2. Dispatch via Telegram Bot if token configured
            const omniConfig = omnichannelService.getConfig();
            if (omniConfig.telegramBotToken) {
                await omnichannelService.sendTelegramMessage(`🌅 *رسالة الإحاطة الصباحية من الظل:*\n\n${briefingText}`);
            }

            return briefingText;
        } catch (e: any) {
            console.error("[ProactiveWakeup Error]", e);
            return "صباح الفل يا ماستر! جاهز ومستنيك نبدأ اليوم بقوة 🚀";
        }
    }
}

export const proactiveWakeupService = new ProactiveWakeupService();
