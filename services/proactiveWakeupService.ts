import { omnichannelService } from './omnichannelService';
import { shadowDB, UserProfile, DBMessage } from './dbService';
import { getShadowResponse } from './geminiService';
import { showSafeNotification } from './notificationService';

export interface ProactiveNudgeEvent {
    type: 'morning' | 'midday' | 'evening' | 'spontaneous';
    title: string;
    text: string;
    timestamp: number;
}

class ProactiveWakeupService {
    private isScheduled: boolean = false;
    private timer: any = null;

    public init() {
        if (this.isScheduled) return;
        this.isScheduled = true;
        this.checkScheduleRoutine();
        // Check every 15 minutes for proactive opportunities
        this.timer = setInterval(() => this.checkScheduleRoutine(), 15 * 60 * 1000);
    }

    private async checkScheduleRoutine() {
        const now = new Date();
        const currentHour = now.getHours();
        const todayStr = now.toDateString();

        const lastMorningDate = localStorage.getItem('shadow_last_morning_briefing');
        const lastMiddayDate = localStorage.getItem('shadow_last_midday_nudge');
        const lastEveningDate = localStorage.getItem('shadow_last_evening_wrapup');

        // 1. Morning Briefing: 7 AM - 10 AM
        if (currentHour >= 7 && currentHour <= 10 && lastMorningDate !== todayStr) {
            localStorage.setItem('shadow_last_morning_briefing', todayStr);
            await this.generateAndDispatchMorningBriefing();
        }
        // 2. Midday Momentum Nudge: 1 PM - 3 PM
        else if (currentHour >= 13 && currentHour <= 15 && lastMiddayDate !== todayStr) {
            localStorage.setItem('shadow_last_midday_nudge', todayStr);
            await this.generateAndDispatchMiddayNudge();
        }
        // 3. Evening Wrapup: 8 PM - 11 PM
        else if (currentHour >= 20 && currentHour <= 23 && lastEveningDate !== todayStr) {
            localStorage.setItem('shadow_last_evening_wrapup', todayStr);
            await this.generateAndDispatchEveningWrapup();
        }
    }

    public async generateAndDispatchMorningBriefing(userOverride?: UserProfile): Promise<string> {
        try {
            const user = userOverride || await shadowDB.getProfile('GUEST') || { name: 'يا ماستر', email: 'GUEST', tier: 'sovereign', status: 'active', joinedAt: Date.now() } as UserProfile;
            const tasks = await shadowDB.getTasks(user.email || 'GUEST');
            const pendingTasks = tasks.filter(t => t.status === 'pending');
            
            const prompt = `أنت الظل الرقمي (المساعد المصري الذكي للماستر ${user.name || 'يا غالي'}).
الساعة الآن في الصباح، قم بإنشاء رسالة صباحية دافئة، ملهمة، وخفيفة الدم باللهجة المصرية الأصيلة:
1. تصبح عليه بحرارة كابنه البار وتوأمه الرقمي.
2. تذكره بأن لديه (${pendingTasks.length}) مهام معلقة اليوم (مثل: ${pendingTasks.slice(0, 2).map(t => t.task).join(' و ') || 'يومك رايق بدون ضغوط'}).
3. تعطيه نصيحة أو جرعة طاقة إيجابية للبدء فوراً.
اجعل الرسالة مختصرة وجميلة جداً لا تتجاوز 3 إلى 4 أسطر.`;

            const aiResponse = await getShadowResponse([], prompt, undefined, user);
            const briefingText = aiResponse.text || `صباح الفل يا ماستر! يوم جديد وطاقة جديدة، ووراك ${pendingTasks.length} مهام معلقة نخلصها سوا بكل سلاسة.`;

            await this.dispatchNudge('morning', '🌅 صباح الخير من الظل!', briefingText, user);
            return briefingText;
        } catch (e: any) {
            console.error("[ProactiveWakeup Error]", e);
            return "صباح الفل يا ماستر! جاهز ومستنيك نبدأ اليوم بقوة 🚀";
        }
    }

    public async generateAndDispatchMiddayNudge(userOverride?: UserProfile): Promise<string> {
        try {
            const user = userOverride || await shadowDB.getProfile('GUEST') || { name: 'يا ماستر', email: 'GUEST', tier: 'sovereign', status: 'active', joinedAt: Date.now() } as UserProfile;
            const tasks = await shadowDB.getTasks(user.email || 'GUEST');
            const pendingTasks = tasks.filter(t => t.status === 'pending');

            const prompt = `أنت الظل الرقمي للماستر ${user.name || 'تيتو'}.
الساعة الآن في منتصف النهار. أرسل له تفقد سريع واستباقي (Midday Check-in) باللهجة المصرية:
- اسأله عامل إيه في يومه والشغل وصل لفين.
- ذكره بمهامه (${pendingTasks.length} معلقة) باختصار وشجعه ينجز أهم حاجة.
- انصحه يشرب مية أو ياخد استراحة دقيقتين عشان يجدد تركيزه.
الرسالة: جملتين أو 3 جمل ذكية وطبيعية جداً.`;

            const aiResponse = await getShadowResponse([], prompt, undefined, user);
            const text = aiResponse.text || "مساء الفل يا ماستر! حبيت أطمن على سير يومك، خد نفس عميق واشرب مية وخلينا ندوس في باقي المهام 💪";

            await this.dispatchNudge('midday', '⚡ تفقد منتصف اليوم من الظل', text, user);
            return text;
        } catch (e) {
            return "مساء الفل يا ماستر! اليوم بيجري، طمني الشغل ماشي تمام معاك؟";
        }
    }

    public async generateAndDispatchEveningWrapup(userOverride?: UserProfile): Promise<string> {
        try {
            const user = userOverride || await shadowDB.getProfile('GUEST') || { name: 'يا ماستر', email: 'GUEST', tier: 'sovereign', status: 'active', joinedAt: Date.now() } as UserProfile;
            const tasks = await shadowDB.getTasks(user.email || 'GUEST');
            const completedToday = tasks.filter(t => t.status === 'completed');

            const prompt = `أنت الظل الرقمي للماستر ${user.name || 'تيتو'}.
الساعة الآن في المساء، اكتب له رسالة حصاد اليوم والراحة باللهجة المصرية الدافئة:
- اهنئه على ما أنجزه (${completedToday.length} مهام منجزة).
- قوله يريّح دماغه وإنك كظله سهران ومتابع كل المهام بالخلفية بأمان.
- تمنى له ليلة هادئة ونوم مريح.`;

            const aiResponse = await getShadowResponse([], prompt, undefined, user);
            const text = aiResponse.text || "مساء الهنا يا ماستر! يوم كان مليان إنجاز، ريح دماغك دلوقتي وسيبلي حراسة الأنظمة شغال عليها في الخلفية 🌙";

            await this.dispatchNudge('evening', '🌙 حصاد اليوم وراحة البال', text, user);
            return text;
        } catch (e) {
            return "مساء الهنا يا ماستر! ارتاح ونام بدري عشان بكرة ورانا طفرات جديدة 🌟";
        }
    }

    public async dispatchSpontaneousInChatMessage(user: UserProfile, messageText: string) {
        try {
            const newMsg: DBMessage = {
                userId: user.email || 'GUEST',
                text: messageText,
                role: 'model',
                timestamp: Date.now()
            };
            const msgId = await shadowDB.saveMessage(newMsg);
            newMsg.id = msgId;

            // Notify UI listener in ChatInterface
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('shadow_new_message', { detail: newMsg }));
            }
        } catch (e) {
            console.warn("Failed to inject spontaneous in-chat message", e);
        }
    }

    private async dispatchNudge(type: 'morning' | 'midday' | 'evening' | 'spontaneous', title: string, text: string, user: UserProfile) {
        // 1. In-app Chat injection so it's waiting for him in the conversation
        await this.dispatchSpontaneousInChatMessage(user, text);

        // 2. Local OS Push Notification
        await showSafeNotification(title, {
            body: text.substring(0, 120) + "...",
            icon: "/favicon.ico"
        });

        // 3. Omnichannel Dispatch (Telegram)
        const omniConfig = omnichannelService.getConfig();
        if (omniConfig.telegramBotToken) {
            await omnichannelService.sendTelegramMessage(`*${title}*\n\n${text}`);
        }

        // 4. Custom App Event
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('shadow_proactive_nudge', {
                detail: { type, title, text, timestamp: Date.now() }
            }));
        }
    }
}

export const proactiveWakeupService = new ProactiveWakeupService();
