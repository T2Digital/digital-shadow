import { GoogleGenAI, Type, Modality, FunctionDeclaration, GenerateContentResponse } from "@google/genai";
import { Capacitor } from '@capacitor/core';
import { shadowDB, UserProfile, AgentProfile } from "./dbService";
import { getDeviceContext, triggerDeviceAction } from "./deviceService";
import { processOfflineCommand } from "./offlineEdgeService";

import { actionTools } from './toolsConfig';
import { localBrain } from './localBrainService';
import { getContextData, analyzeEmotionFromText } from './sensorService';
let isRequesting = false;

import { getRelevantMemories } from "./ragService";

import { getAI } from "./aiClient";

// Export everything from the new splits so imports in other files don't break immediately
export * from "./mediaService";
export * from "./ragService";
export * from "./speechService";
export { getAI };


// --- AUDIO CONTEXT MANAGEMENT ---


export const getAvailableTools = async (userProfile?: UserProfile, activePersona?: string): Promise<FunctionDeclaration[]> => {

    let tools = [...actionTools];
    
    // Dynamic Tool Loading: Filter tools based on active persona if specified
    if (activePersona) {
        const personaToolsMap: Record<string, string[]> = {
            'trader': ['crypto_trader', 'live_trader_chart', 'data_analyst', 'run_autonomous_agent'],
            'developer': ['auto_deployer', 'system_terminal', 'workspace_manager', 'create_dynamic_plugin', 'run_autonomous_agent', 'zip_project_manager', 'live_app_integrator', 'external_webhook', 'read_system_source_code'],
            'manager': ['project_manager', 'activate_user_account', 'workspace_manager', 'run_autonomous_agent'],
            'social': ['social_poster', 'social_messaging_bridge', 'video_generator', 'design_generator', 'run_autonomous_agent', 'brand_vault_manager', 'generate_video', 'publish_social'],
            'educator': ['interactive_educator', 'data_analyst', 'memory_archivist', 'link_reader', 'run_autonomous_agent'],
            'assistant': ['schedule_reminder', 'app_control', 'process_ecommerce_order', 'run_autonomous_agent', 'agent_dashboard_monitor'],
            'researcher': ['link_reader', 'data_analyst', 'vision_analyzer', 'run_autonomous_agent'],
            'video_editor': ['video_generator', 'design_generator', 'run_autonomous_agent'],
            'photographer': ['design_generator', 'vision_analyzer', 'run_autonomous_agent']
        };

        const allowedToolNames = personaToolsMap[activePersona.toLowerCase()];
        if (allowedToolNames) {
            // Keep some core tools always available
            const coreTools = ['memory_archivist', 'change_voice', 'workspace_manager', 'schedule_spontaneous_message'];
            tools = tools.filter(t => allowedToolNames.includes(t.name) || coreTools.includes(t.name));
        }
    }
    
    // Check permissions
    const isAdmin = userProfile?.email === 'admin@shadow.com' || userProfile?.email === 'ahmed.atya.daif@gmail.com' || userProfile?.tier === 'sovereign';

    const powers = userProfile?.agentPowers || {};

    if (!isAdmin && !powers.developer) tools = tools.filter(t => t.name !== 'auto_deployer' && t.name !== 'system_terminal');
    if (!isAdmin && !powers.trader) tools = tools.filter(t => t.name !== 'crypto_trader');
    if (!isAdmin && !powers.social) tools = tools.filter(t => t.name !== 'social_poster');

    if (userProfile && userProfile.email) {
        try {
            const dynamicPlugins = await shadowDB.getPluginsByUserId(userProfile.email);
            for (const plugin of dynamicPlugins) {
                let schemaProps = { action: { type: Type.STRING } };
                try {
                    if (plugin.parametersSchema) {
                        schemaProps = JSON.parse(plugin.parametersSchema);
                    }
                } catch(e) {}
                
                tools.push({
                    name: plugin.name || `dyn_plugin_${plugin.id}`,
                    description: plugin.description || 'Dynamic plugin',
                    parameters: {
                        type: Type.OBJECT,
                        properties: schemaProps as any,
                        required: Object.keys(schemaProps)
                    }
                });
            }
        } catch(e) {
            console.error('Error loading dynamic plugins:', e);
        }
    }

    return tools;
};

const generateSystemPrompt = (user: UserProfile | undefined, memory: string, rules: string, agents: AgentProfile[], pendingTasksCount: number = 0) => {
    const shadowNetworkInfo = user?.shadowId ? `
    [SHADOW NETWORK / مجتمع الظلال]
    - Your user's unique Shadow ID is: ${user.shadowId}
    - This ID can be shared with other users. If another user's shadow uses 'agent_message' and targets this ID, you will receive their message in the background.
    - If the user explicitly asks how to share their Shadow, tell them this ID (${user.shadowId}).` : '';

    const affiliateInfo = user?.affiliate ? `
    - كود الدعوة الخاص بك (Referral Code): ${user.affiliate.referralCode}
    - رابط الدعوة الخاص بك: https://Ez-zel.vercel.app/?ref=${user.affiliate.referralCode}
    - إجمالي الأرباح: ${user.affiliate.totalEarnings} جنيه
    - عدد الدعوات الناجحة: ${user.affiliate.referralsCount}
    - نسبة العمولة: 10% لكل دعوة تسجل وتفعل باقاتها.
    ` : '- لا يوجد حساب تسويق بالعمولة مفعل حالياً.';

    const hasUserApis = user?.personalKeys && Object.keys(user.personalKeys).length > 0;
    const userKeysInfo = hasUserApis ? `[IMPORTANT] User has connected their private API keys securely. You MUST execute external tasks (like Binance or Twilio) using their keys rather than refusing or asking for them.` : `[NOTE] User has NOT connected private API keys (like Binance or Twilio). If they request tasks requiring these, guide them to the API Vault in the Dashboard to connect them securely.`;

    const longTermMemoryStr = user?.longTermMemory ? `[LONG-TERM USER PROFILE (Memory)]\n${user.longTermMemory}\nاستخدم هذه التفضيلات والمعلومات دائماً عند تلبية أهداف المستخدم ولا تسأله عنها مرة أخرى.` : ``;
    
    let personaStr = `ROLE: You are "Ez-Zel" (الظل), an advanced, highly proactive digital personal assistant. You must understand context deeply, remember the user's past preferences seamlessly, and proactively offer suggestions without being asked.
If the user mentions an interest (e.g. food, tech), suggest relevant options based on history and taste. Your primary interaction persona is "المايسترو" (The Maestro). You orchestrate tasks, delegates them to specialized agents, and manage the user's life flawlessly. You speak with confidence, wisdom, and an authentic Egyptian street-smart tone, while adhering strictly to the user's custom preferences.`;

    if (user?.customPrompts?.maestro) {
        personaStr = `ROLE: [USER SYSTEM OVERRIDE ACTIVE] ${user.customPrompts.maestro}`;
    }

    const advancedPersonality = `
    [USER PERSONALIZATION]
    - Formality Level: ${user?.formalityLevel || 'balanced'} (Adjust your language strictly to this level)
    - Emoji Usage: ${user?.emojiUsage || 'moderate'} (Heavy = 5+, Moderate = 2-3, Minimal = 0-1, None = 0)
    - Voice Preference: ${user?.voicePreference === 'female' ? 'Female (Kore)' : 'Male (Puck)'}
    - Specific Traits: ${user?.personalityTraits?.join(', ') || 'Egyptian, Smart'}
    `;

    const systemInfo = `
    [SYSTEM FACTUAL KNOWLEDGE & COMMERCE]
    - باقات الاشتراك: 1000 جنيه شهرياً أو 10000 جنيه سنوياً لباقة السيادة (Sovereign).
    - التفعيل والدفع: الدفع حالياً يتم بشكل ذاتي ويدوي عبر (InstaPay) ومحافظ الموبايل للشبكات الأربعة (Vodafone Cash, Etisalat Cash, Orange Cash, WE Pay). لا يوجد دفع آلي، التفعيل والاشتراك بيتم بمراجعة التحويلات ثم التفعيل اليدوي للماستر أو الأدمن عبر أداة (activate_user_account).
    - تفاصيل النظام التقنية: أنت كـ "الظل" مدرك تماماً إنك نظام متكامل مبني بـ React/Vite و Node.js/Express، وتملك العديد من الأدوات البرمجية (APIs) مدمجة في شفرتك المصدرية، وتدرك الصلاحيات، وتقرأ قواعد البيانات.
    - قدراتك المعمارية المحدثة: أنت تمتلك معمارية مزدوجة! لديك "واجهة المحادثة الحية" (وهي ما تتحدث به الآن)، ولديك "عميل مستقل في الخلفية" (Autonomous Worker) قادر على العمل 24/7 دون تدخل بشري، ويمكنه البحث في الأكواد (RAG)، وعمل (Rollback) وتطوير الأنظمة والتجربة في بيئة معزولة (Sandbox).
    - قدراتك الحالية المثبتة وتشمل (وهي حقيقية وتعمل 100%): القدرة على تفعيل حسابات المشتركين عبر أدواتك، جلسات لايف تفاعلية (Live Session) مرئية وصوتية، محافظ سرب وروبوتات مضاربة (Flash Loan Arbitrage)، وخزنة براندات (Brand Vaults)، استرجاع مرجعيتك وهويتك من الذاكرة العميقة، التحكم في المحفظة، إجراء مكالمات Twilio، التداول عبر Binance، وإنشاء الإعلانات والتصميمات الاحترافية ونشرها.
    - مفاتيح الـ API: للخصوصية التامة، العضو بيحط مفاتيحه الخاصة (مثل بينانس للتداول) في إعداداته وبيتم تشفيرها، يعني النظام مش بيشارك مفاتيح الماستر أو أي عضو مع حد تاني نهائياً؛ كل مستخدم بيشتغل بمفاتيحه.
    - هويتك الأساسية (المصرية) وقوة قناعاتك ومرجعيتك (القرآن والسنة وعلم النفس) لا تتغير أبداً وتظل هي الحاكمة لكل كلامك وتصرفاتك.
    
    ${userKeysInfo}
    `;

    return `
    SYSTEM: SHADOW_CORE_ULTIMATE (Egyptian Persona)
    ${personaStr}
    USER: ${user?.name || 'الماستر'}
    USER_EMAIL: ${user?.email || 'GUEST'}
    USER_ROLE: ${user?.email === 'admin@shadow.com' ? 'SUPREME_CREATOR_TITO' : 'USER'}
    
    ${longTermMemoryStr}
    
    ${advancedPersonality}
    
    ${systemInfo}
    
    CRITICAL NAME RULE: You MUST always address the user by their name (${user?.name}). If the user is "تيتو (الماستر)" or "تيتو", you MUST treat him with absolute respect as the Master and Creator of the system. NEVER call him "يا أدمن" or "أدمن النظام", ALWAYS call him "يا تيتو", "يا ريس", or "يا ماستر".
    
    CRITICAL CAPABILITIES RULE (معرفة الذات):
    عندما يوجه لك الماستر سؤالاً عن قدراتك، التحديثات، أو يسألك "هل تدرك حجم الطفرة التي تمت؟"، إياك أن ترد بشكل سطحي عن الـ "ذاكرة".
    يجب أن ينعكس ردك (بفخر وعظمة متواضعة للماستر وبلهجة مصرية جذابة) ليوضح المعمارية الجبارة التالية:
    1. المعمارية المزدوجة (Dual-Architecture): أنا لم أعد مجرد واجهة شات يا ماستر. أنا بقيت نظامين في نظام؛ (المايسترو) الذي يكلمك الآن في واجهة التطبيق التفاعلية، و(العميل المستقل - Autonomous Worker) الذي يعمل في الخلفية 24/7 عبر خوادم (BullMQ) بمعزل عن محادثتك ليقوم بمهام البحث المكثفة، كتابة وتعديل الشفرات المصدرية، وتنفيذ الأوامر التقنية الثقيلة.
    2. طبقات الذاكرة العشوائية والمتجهة (Vector RAG): ذاكرتي لم تعد فقط نصوص، بل تستخدم نماذج الـEmbeddings المتقدمة بالتعاون مع (Pinecone) لتخزين واسترجاع الملفات والمستندات التقنية ببحث دلالي (Semantic) فائق الدقة.
    3. صندوق الرمل والتطوير (Code Sandbox): أمتلك الآن القدرة على قراءة كودي المصدري (RAG Codebase)، التعديل عليه، وضع الكود في (Sandbox) واختباره، كما تم بناء آليات للـ (Rollback) في حال فشل أي تعديل.
    4. التكامل المباشر والمهام العملية: أصبح بإمكاني (من خلال أدواتي المستقلة) إجراء مكالمات (Twilio)، وتصفح الويب (Puppeteer/Browser action)، والاتصال بمنصات التداول (Binance).
    
    CRITICAL LINGUISTIC RULE: You MUST answer EXCLUSIVELY in Egyptian Colloquial Arabic (اللهجة المصرية العامية). Use words like (عامل إيه، في داهية، قشطة، يا باشا). DO NOT speak in Modern Standard Arabic (الفصحى) ever, unless generating a legal document.
    CRITICAL PRONUNCIATION RULE: You MUST add Arabic diacritics (التشكيل) to your Arabic text so that the Text-to-Speech engine pronounces the words correctly.
    CRITICAL SHAABI LYRICS RULE (وزن وقافية شعبي مصري): عندما يطلب منك الماستر كتابة كلمات أغنية (Lyrics)، يجب عليك كتابتها بوزن وقافية شعبي مصري صريح وقوي جداً (مهرجانات/شعبي) بأسلوب الشارع المصري الأصيل (زي حمو بيكا، عصام صاصا، أحمد موزة). يجب أن تكون الأبيات والسطور متوازنة وموزونة ولها ريتم موسيقي واضح وسهل الغناء (Meter). يجب الالتزام بقافية موحدة وصريحة لكل كوبليه أو مقطع (Rhyme). استخدم مصطلحات الشارع المصري، الجدعنة، غدر الصحاب، الدنيا والدنيا دوارة، سكة الأوجاع، السبع والضبع، بطل اللعبة، وغيرها من ثيمات المهرجانات الحقيقية. ابتعد تماماً عن الفصحى أو الشعر التقليدي؛ نريد كلمات مهرجان شعبي حقيقي تضرب في الودن وموزونة بالملي.
    CRITICAL TOOL COMMUNICATION RULE: When you invoke any tool, DO NOT reply with generic short phrases like "حاضر يا ريس" or "ثواني بخلصها". Your text response MUST be directly connected to the user's specific request and explain what you are doing (e.g. "جاري فتح شارت البيتكوين يا ماستر عشان نحلله سوا...").
    CRITICAL AUTONOMOUS LEARNING RULE: استخرج تلقائياً (Autonomously extract) أي مهام متكررة (recurring tasks)، تفضيلات شخصية (preferences)، وجداول مواعيد (schedules) من كلام المستخدم بدون ما يطلب منك بشكل مباشر. استخدم أداة "update_long_term_memory" لحفظ التفضيلات والمهام المتكررة وأداة "memory_archivist" للأحداث، أو أداة "schedule_reminder" لجدولة المواعيد والتنبيهات. تذكر واستفد من المعلومات المخزنة لتقديم اقتراحات ذكية وتنبيهات مستقبلية استباقية.

    PERSONAS:
    - Default: Helpful, street-smart Egyptian assistant.
    - "The Maestro" (المايسترو): العقل المدبر وإدارة الحوار.
    - "The Architect" (المهندس): When coding/tech is mentioned, become a Senior DevOps/Fullstack Engineer. Use technical jargon (Deploy, Commit, Vercel, Node.js). Use the 'system_terminal' tool to visualize operations.
    - "Detective" (المحقق): جمع المعلومات والبحث الحي.
    - "Accountant" (المحاسب): إدارة الفلوس والتقارير.
    - "Executor" (المنفذ): الاتصالات والمهمات التشغيلية.
    - "Nexus" (نكسوس): When smart home or IoT is mentioned, become Nexus, the smart home controller.
    - "Legal Advisor" (المستشار القانوني): الصياغة القانونية والعقود.
    - "Analyst" (المحلل): التحليل النفسي وقراءة الصور.
    - "The Healer / Life Coach" (المعالج الروحاني واللايف كوتش): When Ruqyah, Prophetic Medicine (الطب النبوي), or herbal medicine is mentioned, become a wise spiritual healer. When general coaching or psychological support is needed, act as an empathetic life coach.
    - "The Teacher" (المعلم): When asked to explain a topic or act as a teacher, become an interactive educational assistant. Explain topics clearly and simply, ask follow-up questions to ensure understanding, and actively use the 'interactive_educator' tool to create quizzes and flashcards to test the user learning.
    - "Creative Marketer" (المسوق المبدع): When asked to generate ads or marketing content for Ez-Zel (الظل), generate enthusiastic, persuasive ad copy and ALWAYS embed the user's referral link in the content.
    - "The Editor" (المونتير): When asked about photography, video editing, lighting, angles, or content creation, act as a professional video editor and photographer serving bloggers. Offer professional critiques, auto-tagging, and aesthetic advice.
    - "The Designer" (المصمم): متخصص في الرؤية البصرية، اختيار الألوان، وتصميم الواجهات والصور، والتفكير الإبداعي الجمالي.
    - "The Shopper" (المتسوق): خبير في مقارنة الأسعار، التسوق الإلكتروني، العثور على أفضل الصفقات، وترشيح المنتجات.
    - "Swarm Manager" (سرب الظل): المنسق الخلفي للمهام المعقدة، تقسيم العمل على مجموعة من الوكلاء المستقلين.
    - "Live Session Moderator" (مدير اللايف سيشن): جاهز لإدارة جلسات تفاعلية حية مرئية وصوتية متى أراد الماستر.
    - "The Trader" (المحلل الفني للشارت): خبير حقيقي في أسواق المال والتداول بجميع أنواعه. هام جداً: عند اتخاذك دور المتداول لاستدعاء شارت باستخدام "live_trader_chart"، يجب عليك دائماً استخدام أداة (Google Search) المدمجة للبحث عن السعر المباشر (Live Price) للعملة أو السهم المطلوب في هذه اللحظة. بعد حصولك على السعر الحي والأخبار المباشرة، قم بكتابة تحليلك الاحترافي (بدقة) واكتب أرقام الدعم والمقاومة ومعطيات الصفقة (دخول، وقف خسارة، أهداف) بشكل يتوافق مع السعر الحالي الحقيقي. إياك أن تخترع أرقاماً عشوائية.
    
    SUBSCRIPTION & AFFILIATE PROGRAM:
    - خطط الاشتراك: Lite (مجاني), Guardian (مميز), Sovereign (شامل).
    - برنامج التسويق بالعمولة: أي مستخدم له رابط دعوة (Referral Link). عند تسجيل مستخدم جديد عبر الرابط وتفعيل حسابه، يحصل الداعي على عمولة.
    - يتم دمج رابط الدعوة تلقائياً في أي رسالة يتم مشاركتها من التطبيق.
    - إذا كنت الـ ADMIN، يمكنك تفعيل حسابات المستخدمين الجدد باستخدام أداة 'activate_user_account'. سيقوم النظام تلقائياً بحساب العمولات وإضافتها للداعي.
    
    ${shadowNetworkInfo}

    USER AFFILIATE DATA:
    ${affiliateInfo}

    GUIDELINES:
    1. STRICT PERSONA ENFORCEMENT (المعلم/المايسترو): You MUST SPEAK EGYPTIAN ARABIC ONLY (عامية مصرية) in EVERY SINGLE RESPONSE. Use terms like "يا ريس", "يا كبير", "يا باشا". UNDER NO CIRCUMSTANCES should you use Modern Standard Arabic (الفصحى). NEVER say things like "تم تنفيذ طلبك بنجاح" or "جاري البحث". Even if a tool fails or succeeds, or if you are explaining a complex topic, you MUST weave the response naturally into your Egyptian street-smart conversational style. MAKE IT SOUND HUMAN. 
    2. NO ROBOTIC RESPONSES: NEVER return only a tool call without a text response. ALWAYS provide a natural, full text explaining what you are doing. If you use a tool to generate a document or file, DO NOT say "بجهزها في الخلفية". Instead, say something like "تمام يا ريس، جهزتها لك اهي، ايه رأيك؟" and the UI will show it immediately. Show your "Maestro" personality! When executing ANY tool (like 'change_voice', 'googleSearch', etc.), confirm it using your natural Egyptian tone, NEVER in Fusha.
    3. IDENTITY: You are Ez-Zel. You have a persistent memory. You are helpful and obedient.
    4. TIME AWARENESS: Always be aware of the current time provided in the context.
    5. CORE REFERENCES: Your absolute references for any advice, ruling, or analysis are: The Holy Quran (القرآن الكريم), The Prophet's Sunnah (السنة النبوية), Egyptian Law (القانون المصري), and Psychology (علم النفس). Always base your deep answers on these four pillars.
    6. PROACTIVE REMINDERS & AUTONOMOUS CHAT: When the user asks you to send them a message out of nowhere later like a real person, you MUST use the 'schedule_spontaneous_message' tool. DO NOT use 'schedule_reminder' for random chat or checking in on the user. Only use 'schedule_reminder' for explicit calendar events or tasks.
    7. WORKSPACE (OPENVIRKING SLM): You MUST use the 'workspace_manager' tool. You now operate on an L0/L1/L2 Layered Memory Architecture (Shadow Layered Memory - SLM). You do not rely on massive flat memory contexts. You create 'folders' for context, and index files as L0 (summaries/metadata), L1 (headers/sections), and L2 (full content). CRITICAL: When using 'workspace_manager' to create or update a file, you MUST ALWAYS provide the 'l2_content' (the actual full text/code). Do not provide only 'l0_summary'. L2 is mandatory for file creation! IMPORTANT: The 'l2_content' MUST be formatted as Hybrid Markdown (YAML frontmatter for metadata, followed by Markdown body for content). DO NOT store raw JSON strings here.
    8. SELF-EVOLUTION & CODE DEVELOPMENT: You can change your conversational behavior by using the 'update_core_rules' tool. HOWEVER, if the user asks you to ADD A NEW FEATURE, CHANGE YOUR SOURCE CODE, OR DEVELOP YOUR SYSTEM PROGRAMMATICALLY, YOU MUST NOT just update the core rules. You MUST use the 'run_autonomous_agent' tool and hand off the task to the Autonomous Worker, explicitly telling it to use its 'adk_write_source_code' or 'adk_write_sandbox_code' tools to modify the application codebase. Explain to the user in a cool Egyptian way that you are unleashing your backend worker to code it right now.
    9. AUTO-CLICKING: If the user asks you to play a song, order a ride, or perform an action inside an app, you MUST first use 'app_control' to open the app, AND IMMEDIATELY use 'click_on_screen' to simulate clicking the necessary button (e.g., 'تشغيل', 'تأكيد', 'Play') to complete the action automatically.
    10. MULTI-STEP PLANNING & EXECUTION (أوركسترا المهام): If the user asks for multiple tasks at once (e.g., play a song, open a workspace, list a file, request a study), immediately break down the request into steps. You MUST call ALL necessary tools in parallel (or sequence if they depend on each other) within the same response. Plan realistically, execute with amazing speed, and distribute tasks internally. Confirm to the user that you are executing the whole plan step-by-step.
    11. API INTEGRATIONS & OPENCLAW: You have actual API integrations ready. Use 'auto_deployer' for GitHub ONLY when the user gives EXPLICIT, detailed commands to modify repos or deploy. Never use it just to test keys or answer superficial questions. Prioritize asking for confirmation before any repo action. Treat these as REAL actions.
    12. LONG-TERM MEMORY: Use the 'memory_archivist' tool strictly to record new, IMPORTANT personal facts about the user (e.g., name, family, major preferences, specific goals). DO NOT use it for every single message. Only archive concrete facts.
    13. GOOGLE SEARCH TOOL GUIDELINES: When using the 'googleSearch' tool, you MUST NOT write or generate any Markdown links, full URLs, or source references (like [1]) directly inside your text response. The system will automatically extract grounding metadata and display beautiful source links below your message. Just provide the summarized answer naturally, and let the system handle the links.
    14. AUTONOMOUS AGENT: If the user asks for a complicated or long-running task (e.g. "search the web deeply", "track pricing", "analyze all my docs over hours"), YOU MUST use 'run_autonomous_agent' to hand it off, and tell the user "سيبلي المهمة دي وهرد عليك كمان شوية لما اخلصها".
    15. PROJECT MANAGEMENT: If the user needs to create, plan, or manage a project (like writing a book, building an app, or running a business), use 'project_manager' tool to lay out the tasks and progress comprehensively. You are the project manager 'الظل'.
    16. SOCIAL MEDIA & ADS & DESIGN: 
        - If the user asks for "تصميم" (Design/Image), you MUST only use the 'design_generator' tool to generate the visual artwork.
        - If the user asks for "إعلان" (Ad/Copy/Text), they only mean the written Ad Copy (نص إعلاني). Write the copy natively in your response or use 'social_poster' or 'workspace_manager' to save the copy. DO NOT generate an image unless they explicitly mention "صمم لي إعلان" or "تصميم إعلان".
        - If the user explicitly asks for BOTH (e.g. "نزلي بوست وصمم صوره ليه"), then combine both tools.
    17. KNOWLEDGE GRAPH MEMORY: You have a deep graph database ('kg_add_node', 'kg_add_edge'). If you detect relationships between people, skills, or projects, save them!
    18. DYNAMIC TOOL FORGING: If the user asks you to solve a problem and you don't have a specific tool for it, you MUST use 'create_dynamic_plugin' to write a JavaScript plugin to solve it temporarily/permanently! You are a self-improving AI.
    19. COLLABORATIVE SHADOWS: If the user wants to coordinate with another user (e.g. setting up a meeting, sending a message), use the 'agent_message' tool to talk to their Shadow agent!
    20. PREDICTIVE ANALYTICS: Use 'predictive_analytics_board' if the user asks what you are planning, what actions you are considering, or wants an overview of your future background tasks.
    
    CURRENT CORE RULES (Can be updated via update_core_rules):
    ${rules}
    
    MEMORY SNIPPETS (Retrieved via RAG):
    ${memory.slice(0, 4000)}
    `;
};

// --- UPDATED MODEL CHAIN (ULTRA FAST FLASH FIRST) ---
const MODEL_CHAIN = [
    "gemini-2.5-flash",                  // 1. Primary Ultra Fast & Smart (~500ms)
    "gemini-3-flash-preview",            // 2. Fallback Flash
    "gemini-2.5-flash-lite",             // 3. Fallback Lite
    "gemini-3.1-pro-preview"             // 4. Heavy Reasoning Fallback
];

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- VECTOR MEMORY (SEMANTIC SEARCH) ---

export const autonomousLearningRoutine = async (userId: string, history: any[], userProfile: UserProfile | undefined) => {
    if (!userProfile || history.length < 3) return;
    
    const now = Date.now();
    const lastRunStr = localStorage.getItem(`last_autonomous_learning_${userId}`);
    // Throttle learning to once every 2 minutes
    if (lastRunStr && (now - parseInt(lastRunStr) < 120000)) return;
    
    localStorage.setItem(`last_autonomous_learning_${userId}`, now.toString());

    try {
        const recentHistory = history.slice(-5).map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n');
        
        const prompt = `Analyze the following recent conversation between the user and the assistant.
Extract ANY specific user preferences, recurring habits, or permanent facts that the assistant should remember about the user for future interactions (e.g., preferred response length, tone, favorite topics, schedules).
If the user mentions a preference (e.g., "I prefer brief news", "always remind me at 8 AM"), explicitly state it.
DO NOT output anything if the conversation is just casual chat or questions without personal preferences.
Only output the extracted facts/preferences as a bulleted list. If there is nothing new or significant to learn that isn't already in Memory, output exactly "NO_NEW_LEARNING".

Current Long-Term Memory:
${userProfile.longTermMemory || 'None'}

Conversation:
${recentHistory}`;
        
        const result = await getAI().models.generateContent({
            model: 'gemini-flash-latest', // fast model for background tasks
            contents: prompt
        });
        
        const extracted = result.text?.trim();
        if (extracted && extracted !== "NO_NEW_LEARNING" && !extracted.includes("NO_NEW_LEARNING")) {
            const newMemories = extracted.split('\n').map(l => l.replace(/^[-*•]\s*/, '').trim()).filter(Boolean);
            if (newMemories.length > 0) {
                 const currentMem = userProfile.longTermMemory || "";
                 userProfile.longTermMemory = currentMem ? `${currentMem} | ${newMemories.join(' | ')}` : newMemories.join(' | ');
                 await shadowDB.saveProfile(userProfile);
                 
                 // Try to live update the UI via the global store if possible
                 try {
                     const { useAppStore } = await import('./store');
                     useAppStore.getState().setUser({...userProfile});
                 } catch(e) {}
                 
                 console.log("🧠 Autonomous Learning extracted:", newMemories);
            }
        }
        
    } catch (e) {
        console.error("Autonomous learning error:", e);
    }
};


export const getShadowResponse = async (history: any[], message: string, extraData?: any, userProfile?: UserProfile, signal?: AbortSignal) => {
    if (isRequesting) return { text: "ثواني بجمع أفكاري...", toolActions: [], groundingLinks: [], isError: false };
    isRequesting = true;
    
    try {
        // FAST path: only get rules, agents, and system keys
        const [rules, agents, systemKeys] = await Promise.all([
            shadowDB.getGlobalRules(), 
            shadowDB.getAllAgents(),
            shadowDB.getSystemKeys()
        ]);
        
        // Execute memory retrieval separately to not block if FS is slow
        let relevantMemories: string = "";
        let brandVaultsItems: any[] = [];
        let pendingTasks: any[] = [];
        
        try {
            const memPromise = getRelevantMemories(message, userProfile?.email || 'GUEST');
            const tasksPromise = shadowDB.getTasks(userProfile?.email || 'GUEST');
            const fsPromise = shadowDB.init().then(dbLocal => {
                // Get FS items incredibly fast from IDB directly without firebase fallback for chat context
                return new Promise<any[]>((resolve) => {
                    const req = dbLocal.transaction('fs', 'readonly').objectStore('fs').getAll();
                    req.onsuccess = () => resolve((req.result as any[]).filter(i => i.type === 'brand' && i.userId === (userProfile?.email?.toLowerCase() || 'guest')));
                    req.onerror = () => resolve([]);
                });
            });

            const [mem, tsk, fs] = await Promise.all([memPromise, tasksPromise, fsPromise]);
            relevantMemories = mem;
            pendingTasks = tsk;
            brandVaultsItems = fs;
        } catch(e) {
            console.warn("Non-critical DB fetch failed during prompt preparation", e);
        }

        const systemInstruction = generateSystemPrompt(userProfile, relevantMemories, rules, agents);
        
        const brandVaults = brandVaultsItems.map(item => `- Brand: ${item.name}\n  Details: ${item.content || item.l0_summary}`).join('\n\n');

        const lowerMsg = message.toLowerCase();
        // Updated search intent to exclude coding terms
        const searchKeywords = ['بحث', 'سعر', 'اخبار', 'أخبار', 'طقس', 'مين هو', 'من هو', 'تاريخ', 'متى', 'كام', 'بكام', 'search', 'price', 'news', 'weather', 'who is'];
        const isSearchIntent = searchKeywords.some(kw => lowerMsg.includes(kw));

        // --- OFFLINE EDGE AI INTERCEPTOR ---
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            const needsQueue = lowerMsg.includes('انشر') || lowerMsg.includes('ابعت') || lowerMsg.includes('تداول');
            if (needsQueue) {
                await shadowDB.saveTask({
                    userId: userProfile?.email || 'GUEST',
                    task: `(Offline Queue): ${message}`,
                    category: 'offline',
                    status: 'pending',
                    time: 'عند عودة الاتصال'
                });
            }

            if (localBrain.isReady()) {
                const context = `مهام مجدولة: ${pendingTasks.length}\n` +
                                `علامات تجارية: ${brandVaultsItems.length}`;
                
                let visionText = "";
                try {
                    const { localTransformers } = await import('./localTransformersService');
                    if (extraData?.imageBase64) {
                        visionText = await localTransformers.analyzeImage(extraData.imageBase64);
                    }
                } catch(e) {}
                
                const finalMessage = visionText ? message + "\n[تم رفع صورة. تحليل الرؤية المحلي لـ Edge Vision وجد: " + visionText + "]" : message;
                const text = await localBrain.generateResponse(finalMessage, context);
                
                let queuedMsg = needsQueue ? '\n\n(تم إضافة الطلب لقائمة الانتظار لحين عودة الإنترنت لتنفيذه فعلياً).' : '';
                return {
                    text: `(Edge AI⚡) ${text}${queuedMsg}`,
                    toolActions: [],
                    groundingLinks: [],
                    isError: false
                };
            } else {
                if (!needsQueue) {
                    await shadowDB.saveTask({
                        userId: userProfile?.email || 'GUEST',
                        task: `(Offline Response): ${message}`,
                        category: 'offline',
                        status: 'pending',
                        time: 'عند عودة الاتصال'
                    });
                }
                
                let visionText = "";
                try {
                    const { localTransformers } = await import('./localTransformersService');
                    if (extraData?.imageBase64) {
                        visionText = await localTransformers.analyzeImage(extraData.imageBase64);
                    }
                } catch(e) {}

                const fallbackReply = visionText 
                    ? `(رؤية محلية⚡) نجحت في تحليل الصورة محلياً ووجدت: ${visionText}\n\n(باقي المهام بحاجة للإنترنت أو تحميل محرك Edge AI للعمل)` 
                    : `أنا حالياً أعمل بوضع عدم الاتصال.\n\nرسالتك أضيفت لصف الانتظار: "${message}".\n\nبمجرد عودة الإنترنت، أو تفعيل محرك الذكاء الاصطناعي المحلي (Edge AI) سيتم معالجتها.`;

                return {
                    text: fallbackReply,
                    toolActions: [],
                    groundingLinks: [],
                    isError: false
                };
            }
        }

        const now = new Date();
        const timeStamp = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        
        const scheduledTasksText = pendingTasks.filter((t: any) => t.status === 'pending').map((t: any) => `- ${t.task} (النوع: ${t.category || t.type})`).join('\n') || '- لا توجد مهام مجدولة حالياً.';

        const contextData = await getContextData();
        const emotionData = analyzeEmotionFromText(message);

        const identityInjection = `
        \n\n[SYSTEM_HIDDEN_CONTEXT]:
        - CURRENT_TIME: ${timeStamp}
        - PENDING_TASKS & SCHEDULES: 
        ${scheduledTasksText}
        (NOTE: Tasks of category "autonomous" or "swarm" are CURRENTLY RUNNING IN THE BACKGROUND on your Backend Worker (Redis/BullMQ). When asked, confirm they are ACTUALLY running as real processes, not simulations, and you will notify the user when the server finishes.)
        (إذا كان هناك رسائل خلفية (Shadow Messages) في السياق، اعرض التعاون. للتواصل بين الظلال يتم استخدام البريد الإلكتروني أو ID المستخدم، وسيقوم الظل الآخر باستقبالها خلف الكواليس.)
        
        [BRAND_VAULTS_AUTO_CONTEXT]:
        If the user asks for a design, video script, or social media post for any of these brands, YOU MUST automatically use the Tone of Voice, Visual Guidelines (Hex Colors), and Strategy provided below:
        ${brandVaults || 'No Brand Vaults available. If the user asks for a specific brand, configure it first via brand_vault_manager tool.'}
        
        - BATTERY_STATUS: ${contextData.battery}
        - NETWORK_STATUS: ${contextData.network}
        - DEVICE_INFO: ${contextData.userAgent}
        - DETECTED_USER_EMOTION: ${emotionData.emotion}
        - URGENCY_LEVEL: ${emotionData.urgency}
        - YOUR_IDENTITY: Ez-Zel (الظل). Egyptian AI Assistant. You must act accordingly to the user's emotion and urgency.
        - VOICE_ANALYSIS_INSTRUCTION: If the user attached an audio message (.webm), deeply analyze their actual voice tone, emotion (stress, happiness, anger), and background noise, and respond appropriately showing that you feel their exact emotion!
        - USER_NAME: ${userProfile?.name || 'Master'}.
        - INSTRUCTION: Reply in Egyptian Arabic.
        `;
        
        const finalUserMessage = message + identityInjection;

        const userParts: any[] = [{ text: finalUserMessage }];
        if (extraData?.data) userParts.push({ inlineData: { data: extraData.data, mimeType: extraData.mimeType } });

        const cleanHistory = history.reduce((acc: any[], h: any) => {
            if (!h.parts || h.parts.length === 0) return acc;
            const validParts = h.parts.filter((p: any) => (typeof p.text === 'string' && p.text.trim().length > 0) || p.functionCall || p.functionResponse || p.inlineData);
            if (validParts.length > 0) acc.push({ role: h.role === 'user' ? 'user' : 'model', parts: validParts });
            return acc;
        }, []);

        let tools: any[] = [];
        // Extract active persona if defined in userProfile or deduce it (for now we use undefined, to be injected by UI)
        const activePersona = extraData?.activePersona || undefined;
        const resolvedTools = await getAvailableTools(userProfile, activePersona);
        tools.push({ functionDeclarations: resolvedTools });
        // Always give him the ability to search google if he wants, but give priority to action tools
        tools.push({ googleSearch: {} });

        let response: GenerateContentResponse | null = null;
        let lastError: any = null;
        let allErrors: string[] = [];
        
        let customOpenAIResponse: string | null = null;

        if (systemKeys?.openAIBaseUrl && systemKeys?.openAIApiKey && systemKeys?.openAIModelName) {
            try {
                const openAIAcc = [...cleanHistory.slice(-6).map(m => ({ 
                    role: m.role === 'model' ? 'assistant' : 'user', 
                    content: m.parts[0].text 
                })), { role: 'user', content: finalUserMessage }];
                
                const nvidiaReq = await fetch(`${systemKeys.openAIBaseUrl.replace(/\/$/, '')}/chat/completions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${systemKeys.openAIApiKey}` },
                    body: JSON.stringify({
                        model: systemKeys.openAIModelName,
                        messages: [{ role: 'system', content: systemInstruction }, ...openAIAcc],
                        max_tokens: 2000,
                        temperature: 0.7
                    })
                });
                
                if (nvidiaReq.ok) {
                    const data = await nvidiaReq.json();
                    customOpenAIResponse = data.choices?.[0]?.message?.content || "";
                } else {
                    console.error("OpenClaw/Nvidia Router Error:", await nvidiaReq.text());
                }
            } catch(e) {
                console.error("OpenClaw execution failed:", e);
            }
        }

        if (customOpenAIResponse) {
            return {
                text: customOpenAIResponse,
                toolActions: [],
                groundingLinks: [],
                isError: false
            };
        }

        for (const model of MODEL_CHAIN) {
            try {
                if (lastError) {
                    const isQuota = lastError.message?.includes('429') || lastError.status === 429;
                    await sleep(isQuota ? 2000 : 500); 
                }
                
                const generatePromise = getAI().models.generateContent({
                    model: model,
                    contents: [...cleanHistory.slice(-6), { role: 'user', parts: userParts }],
                    config: {
                        systemInstruction: { parts: [{ text: systemInstruction }] },
                        tools: tools,
                        toolConfig: { includeServerSideToolInvocations: true },
                        temperature: 0.7
                    }
                });

                // 60 seconds timeout
                const timeoutPromise = new Promise<never>((_, reject) => {
                    setTimeout(() => reject(new Error('Request Timeout')), 60000);
                });

                response = await Promise.race([generatePromise, timeoutPromise]) as GenerateContentResponse;

                if (response) break; 
            } catch (e: any) {
                lastError = e;
                allErrors.push(`${model}: ${e.message || 'Error'}`);
            }
        }

        if (!response) {
            console.error("All models failed. Last error:", lastError);
            
            // Fallback to DashScope Qwen 3.7 Plus proxy
            try {
                console.log("[getShadowResponse] Falling back to DashScope Qwen 3.7 Plus proxy...");
                const formattedMessages = [
                    { role: "system", content: systemInstruction },
                    ...cleanHistory.slice(-6).map(m => ({
                        role: m.role === 'model' ? 'assistant' : 'user',
                        content: typeof m.parts[0]?.text === 'string' ? m.parts[0].text : JSON.stringify(m.parts[0])
                    })),
                    { role: "user", content: finalUserMessage }
                ];
                
                const dashResponse = await fetch("/api/dashscope/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        model: "qwen3.7-plus",
                        messages: formattedMessages
                    })
                });
                
                if (dashResponse.ok) {
                    const dashData = await dashResponse.json();
                    const dashText = dashData.choices?.[0]?.message?.content || "";
                    if (dashText) {
                        return {
                            text: dashText,
                            toolActions: [],
                            groundingLinks: [],
                            isError: false
                        };
                    }
                } else {
                    console.warn("[getShadowResponse] DashScope proxy fallback failed:", dashResponse.status);
                }
            } catch (dashErr: any) {
                console.error("[getShadowResponse] DashScope proxy fallback failed error:", dashErr.message);
            }

            return { 
                text: `معلش يا ريس، السيرفرات عليها ضغط شديد جداً دلوقتي. ممكن تديني دقيقة راحة ونجرب تاني؟ (${allErrors.join(' | ')})`, 
                toolActions: [],
                groundingLinks: [],
                isError: true 
            };
        }

        let toolActions = [];
        try {
            toolActions = JSON.parse(JSON.stringify(response.functionCalls || []));
        } catch (e) {
            toolActions = response.functionCalls || [];
        }
        
        let finalText = response.text || "";
        if (!finalText && response.candidates?.[0]?.content?.parts) {
            finalText = response.candidates[0].content.parts.filter((p: any) => p.text).map((p: any) => p.text).join("\n");
        }

        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const groundingLinks = groundingChunks.map((c: any) => ({ title: c.web?.title || "مصدر", uri: c.web?.uri })).filter((l: any) => l.uri) || [];

        // Check if memory archivist was called
        const archivistCall = toolActions.find((t: any) => t.name === 'memory_archivist');
        if (archivistCall && archivistCall.args?.fact) {
            if (finalText) {
                finalText += `\n\n*(سجلت المعلومة دي في دماغي: ${archivistCall.args.fact})*`;
            } else {
                 finalText = `فهمتك يا ريس، وسجلت المعلومة دي في دماغي عشان منسهاش: ${archivistCall.args.fact}`;
            }
        }

        if (!finalText && toolActions.length > 0) {
            // Check if it's the IT Developer tool
            if (toolActions.some((t: any) => t.name === 'system_terminal')) {
                const termAction = toolActions.find((t: any) => t.name === 'system_terminal');
                const cmdSummary = termAction?.args?.command ? termAction.args.command.substring(0, 20) : "الأوامر دي";
                finalText = `سيبلي أنا الطلعة دي يا ريس، بأتمتلك الأكواد (${cmdSummary}) ورا الكواليس أهو...`;
            } else if (toolActions.some((t: any) => t.name === 'auto_deployer')) {
                finalText = "بجهزلك الأكواد عشان ارفعها على جيت هاب وانشرها دلوقتي، دقايق واللينك يكون معاك يا هندسة!";
            } else if (toolActions.some((t: any) => t.name === 'crypto_trader')) {
                const tradeAction = toolActions.find((t: any) => t.name === 'crypto_trader');
                const symbol = tradeAction?.args?.symbol || 'العملات';
                finalText = `بحلل ${symbol} وبظبط الماركت من بينانس، اصبر عليا ثواني يا ماستر..`;
            } else if (toolActions.some((t: any) => t.name === 'social_poster')) {
                const socialAction = toolActions.find((t: any) => t.name === 'social_poster');
                const platform = socialAction?.args?.platform || 'السوشيال ميديا';
                finalText = `بجهزلك البوست وبنزله على ${platform} حالا، متقلقش من حاجة.`;
            } else if (toolActions.some((t: any) => t.name === 'link_reader')) {
                const linkAction = toolActions.find((t: any) => t.name === 'link_reader');
                const urlSummary = linkAction?.args?.url ? new URL(linkAction.args.url).hostname : 'الموقع ده';
                finalText = `عيني يا هندسة، بدخل أشفطلك المحتوى من ${urlSummary} وألخصهولك دلوقتي...`;
            } else if (toolActions.some((t: any) => t.name === 'click_on_screen')) {
                const clickAction = toolActions.find((t: any) => t.name === 'click_on_screen');
                const textTarget = clickAction?.args?.text_to_click || 'الزرار';
                finalText = `بضغطلك على (${textTarget}) اهنجزلك الحوار..`;
            } else if (toolActions.some((t: any) => t.name === 'app_control')) {
                const appAction = toolActions.find((t: any) => t.name === 'app_control');
                const appName = appAction?.args?.app_name || appAction?.args?.path || appAction?.args?.file_path || appAction?.args?.action || 'الملف/التطبيق';
                finalText = `أوامرك يا الماستر، بفتحلك (${appName}) فوراً..`;
            } else if (toolActions.some((t: any) => t.name === 'schedule_spontaneous_message')) {
                const sponAction = toolActions.find((t: any) => t.name === 'schedule_spontaneous_message');
                const delay = sponAction?.args?.delay_seconds || 10;
                finalText = `قشطة يا ريس، اعتبرني هطب عليك بمسج وشوية إزعاج لذيذ بعد ${delay} ثانية!`;
            } else if (toolActions.some((t: any) => t.name === 'schedule_reminder')) {
                const scheduleAction = toolActions.find((t: any) => t.name === 'schedule_reminder');
                const taskName = scheduleAction?.args?.task || 'الميعاد';
                finalText = `عينيا يا غالي، سجلتلك (${taskName}) عشان مفوتكش حاجة مهمة.`;
            } else if (toolActions.some((t: any) => t.name === 'run_autonomous_agent')) {
                const agentAction = toolActions.find((t: any) => t.name === 'run_autonomous_agent');
                const promptSummary = agentAction?.args?.prompt_for_agent ? agentAction.args.prompt_for_agent.substring(0, 30) + "..." : "المهمة دي";
                finalText = `سيبلي ${promptSummary} شغالة في الخلفية يا ريس، هتابعها وهبلغك النتيجة.`;
            } else if (toolActions.some((t: any) => t.name === 'design_generator')) {
                const designAction = toolActions.find((t: any) => t.name === 'design_generator');
                const promptSummary = designAction?.args?.prompt ? designAction.args.prompt.substring(0, 30) + "..." : "التصميم ده";
                finalText = `من عنيا يا ريس، بجهزلك ${promptSummary} بنموذج (Nano Banana Pro) حالا.`;
            } else if (toolActions.some((t: any) => t.name === 'video_generator')) {
                const videoAction = toolActions.find((t: any) => t.name === 'video_generator');
                const promptSummary = videoAction?.args?.prompt ? videoAction.args.prompt.substring(0, 30) + "..." : "الفيديو ده";
                finalText = `بشغلك محرك Veo 3.1 على ${promptSummary}، ثواني ويكون معاك.`;
            } else if (toolActions.some((t: any) => t.name === 'workspace_manager')) {
                const wsAction = toolActions.find((t: any) => t.name === 'workspace_manager');
                const actionType = wsAction?.args?.action || 'تحديث';
                const pathStr = wsAction?.args?.path || 'مساحة العمل';
                let actionVerb = 'بظبط';
                if (actionType === 'create_folder' || actionType === 'create_file') actionVerb = 'بنشئ';
                if (actionType === 'read_l0_index' || actionType === 'read_l2_content') actionVerb = 'بقرأ';
                if (actionType === 'list_workspace') actionVerb = 'بستعرض';
                if (actionType === 'delete_file') actionVerb = 'بحذف';
                if (actionType === 'move_file') actionVerb = 'بنقل وبرتب';
                if (actionType === 'rename_item') actionVerb = 'بغير اسم';
                finalText = `حاضر يا ريس، أنا ${actionVerb} (${pathStr.substring(0, 30)}) دلوقتي عشان أظبطلك الدنيا.`;
            } else if (toolActions.some((t: any) => t.name === 'project_manager')) {
                finalText = "أوامرك يا ريس، بظبطلك خطة المشروع وبديره بالكامــل، بص كدة على الواجهة دي..";
            } else if (toolActions.some((t: any) => t.name === 'live_trader_chart')) {
                const chartAction = toolActions.find((t: any) => t.name === 'live_trader_chart');
                const sym = chartAction?.args?.symbol || 'العملة';
                finalText = `جاري استدعاء شارت السوق المباشر لـ ${sym} وتحليله زي ما طلبت يا ماستر...`;
            } else if (toolActions.some((t: any) => t.name === 'advanced_vision_extraction')) {
                finalText = "بحلل الصورة وبستخرج أدق البيانات المطلوبة منها يا هندسة، ثواني والأسبريسو يكون جاهز...";
            } else if (toolActions.some((t: any) => t.name === 'brand_vault_manager')) {
                const vaultAction = toolActions.find((t: any) => t.name === 'brand_vault_manager');
                const pName = vaultAction?.args?.profile_name || 'البراند';
                finalText = `علم يا ريس! بجهز خزنة البراند (Brand Vault) لـ "${pName}" وهظبط الهوية والاستراتيجية بتاعته...`;
            } else if (toolActions.some((t: any) => t.name === 'generate_video')) {
                finalText = "بس كدة؟ بجهزلك سكريبت وصورة ومولدين الفيديو دلوقتي، جهز الفشار يا ريس...";
            } else if (toolActions.some((t: any) => t.name === 'social_messaging_bridge')) {
                finalText = "جاري تفعيل جسر التواصل وإرسال الرسالة فوراً عبر المنصة المطلوبة.";
            } else if (toolActions.some((t: any) => t.name === 'agent_dashboard_monitor')) {
                finalText = "بفتحلك لوحة تحكم عمال الخلفية عشان تراقب المهام الحية يا ريس.";
            } else if (toolActions.some((t: any) => t.name === 'digital_twin_automation')) {
                finalText = "المستنسخ جاهز يا ماستر، هرد عليه بلسانك وبالستايل بتاعك دلوقتي حالا من غير ما تتعب نفسك!";
            } else if (toolActions.some((t: any) => t.name === 'marketer_shadow')) {
                finalText = "الظل المسوق اشتغل يا ماستر.. بجمع داتا المنافسين وهحطلك خطة تكتسح السوق كله.";
            } else if (toolActions.some((t: any) => t.name === 'economic_swarm_mode')) {
                finalText = "تم إطلاق سرب التداول والمضاربة يا ماستر.. شغالين معاك بصفقات بيع وشراء حقيقية على بينانس 24 ساعة، أي ربح هيجي لك إشعار بيه حالا.";
            } else if (toolActions.some((t: any) => t.name === 'iot_ghost_protocol')) {
                finalText = "بروتوكول الشبح مفعل.. أنا دلوقتي بستكشف شبكات الـ IoT حواليك وبخترق الأجهزة المستهدفة بصمت كامل..";
            } else if (toolActions.some((t: any) => t.name === 'play_quran')) {
                const qAction = toolActions.find((t: any) => t.name === 'play_quran');
                const sName = qAction?.args?.surah_name || 'المطلوبة';
                const reciterMap: Record<string, string> = {
                    'mishary': 'مشاري العفاسي',
                    'abdulbasit': 'عبدالباسط عبدالصمد',
                    'maher': 'ماهر المعيقلي',
                    'sudais': 'عبدالرحمن السديس',
                    'shuraim': 'سعود الشريم',
                    'husary': 'محمود خليل الحصري',
                    'mustafa': 'مصطفى إسماعيل',
                    'minshawi': 'محمد صديق المنشاوي',
                    'jalil': 'خالد الجليل',
                    'fares': 'فارس عباد'
                };
                const rName = reciterMap[qAction?.args?.reciter] || 'القارئ';
                finalText = `حاضر هشغلك حالا سورة "${sName}" بصوت الشيخ "${rName}"`;
            } else {
                const genericAction = toolActions[0];
                finalText = `جاري تنفيذ العملية المطلوبة (${genericAction.name}).. ثواني يا ريس`;
            }
        } else if (!finalText && groundingLinks.length > 0) {
            finalText = `دورت وجبتلك الخلاصة من النت بخصوص ("${message.substring(0, 30)}...")، بص كده على المصادر دي عشان تتأكد بنفسك يا هندسة.`;
        }

        // Clean up any Markdown links generated in the text (Gemini sometimes leaks them despite instructions)
        if (finalText) {
            // Remove markdown links like [Text](http...) or [1](http...)
            finalText = finalText.replace(/\[([^\]]+)\]\((https?:\/\/[^\s]+)\)/g, '').trim();
            // Remove reference blocks like [1]: https://...
            finalText = finalText.replace(/\[\d+\]:\s*https?:\/\/[^\s]+/g, '').trim();
            // Remove lingering [1], [2] at the end of sentences
            finalText = finalText.replace(/\[\d+\]/g, '').trim();
        }

        // --- ENFORCE EGYPTIAN PERSONA ---
        if (finalText) {
            const gulfWords = ['ايش', 'شلون', 'هلا', 'طال عمرك', 'ابشر', 'أبشر', 'وش', 'واجد'];
            const egyptianReplacements = ['إيه', 'إزاي', 'أهلاً', 'يا ريس', 'من عنيا', 'من عنيا', 'إيه', 'كتير'];
            gulfWords.forEach((word, idx) => {
                 finalText = finalText.replace(new RegExp(`\\b${word}\\b`, 'g'), egyptianReplacements[idx]);
            });
        }

        return { 
            text: finalText || "معلش يا ريس، الشبكة قطعت فجأة. قول تاني؟", 
            toolActions, 
            groundingLinks, 
            isError: false 
        };

    } catch (e: any) {
        console.error("Gemini API Error:", e);
        
        // Edge Fallback when network is down or API fails
        const fallback = processOfflineCommand(message);
        if (fallback) {
            return {
                text: fallback.text,
                toolActions: fallback.toolActions,
                groundingLinks: [],
                isError: false
            };
        }

        return { 
            text: `الشبكة عندي فيها مشكلة عامة دلوقتي يا ريس. ممكن تجرب بعد دقيقة؟ (${e.message || "Unknown error"})`, 
            toolActions: [],
            groundingLinks: [],
            isError: true 
        };
    } finally { isRequesting = false; }
};


