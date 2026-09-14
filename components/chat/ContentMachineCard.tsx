import React, { useState, useEffect } from 'react';
import { Video, Sparkles, Youtube, Instagram, Twitter, Linkedin, Copy, Download, Volume2, RefreshCw, CheckCircle2, Share2, FileText } from 'lucide-react';
import { getAI } from '../../services/geminiService';
import { playShadowVoice } from '../../services/speechService';

interface GeneratedPlatformContent {
    twitterThread: string[];
    linkedInPost: string;
    videoScript: {
        hook: string;
        visualScene: string;
        voiceover: string;
        cta: string;
    };
    carouselSlides: Array<{ slideNumber: number; title: string; content: string }>;
}

export const ContentMachineCard = ({ card }: { card: any }) => {
    const initialTopic = card.data?.topic || card.data?.niche || 'كيف تبني مشروعاً رقمياً ناجحاً بالذكاء الاصطناعي في 2026';
    const [topic, setTopic] = useState(initialTopic);
    const [activeTab, setActiveTab] = useState<'twitter' | 'linkedin' | 'video' | 'carousel'>('twitter');
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isPlayingVoice, setIsPlayingVoice] = useState(false);

    const [content, setContent] = useState<GeneratedPlatformContent>({
        twitterThread: [
            '🧵 1/5 أغلب الناس فاهمين الذكاء الاصطناعي غلط: هو مش بديل عنك، هو مضاعف لقوتك 10x لو عرفت تشغله صح.',
            '💡 2/5 الخطوة الأولى: حدد مشكلة حقيقية يواجهها 100 شخص مستعدين يدفعوا لحلها اليوم.',
            '⚙️ 3/5 الخطوة الثانية: استخدم أدوات الـ No-code مع نماذج الذكاء الاصطناعي لبناء نموذج أولي في 48 ساعة فقط.',
            '📈 4/5 الخطوة الثالثة: وزع المحتوى يومياً واستخدم الـ Short-form videos للوصول لملايين المشاهدات بدون إعلانات مدفوعة.',
            '🎯 5/5 لو عايز تبدأ اليوم، ركز على حل مشكلة واحدة بإتقان. ريتويت لو استفدت، وتابعني للمزيد من الأدوات العملية!'
        ],
        linkedInPost: `🚀 هل ما زلت تؤجل إطلاق مشروعك الرقمي بانتظار "الوقت المثالي"؟

الحقيقة الصادمة: في عصر الذكاء الاصطناعي، السرعة والمرونة هما الميزة التنافسية الوحيدة. ما كان يتطلب فريقاً من 10 أشخاص وميزانية 50,000 دولار، يمكنك بناؤه اليوم بمفردك خلال عطلة نهاية أسبوع.

📌 3 ركائز أساسية للنجاح اليوم:
1️⃣ التركيز على المشكلة وليس الأداة: العميل لا يشتري AI، العميل يشتري توفير وقته أو زيادة أرباحه.
2️⃣ التوزيع الممنهج: أعظم منتج بدون توزيع ومحتوى هو منتج ميت.
3️⃣ الاستمرارية الذكية: بناء أصول ومحتوى يتراكم أثره مع الوقت.

💬 ما هو أكبر تحدٍ يواجهك حالياً في إطلاق أو توسيع مشروعك؟ شاركني في التعليقات لنناقشه معاً!`,
        videoScript: {
            hook: 'توقف عن تضييع ساعات في كتابة المحتوى يدوياً!',
            visualScene: 'مشهد خاطف للشاشة تظهر فيه الأفكار تتحول تلقائياً إلى نصوص وفيديوهات مصممة بضغطة زر واحدة.',
            voiceover: 'لو بتدور على الطريقة اللي بتخلي صناع المحتوى الكبار ينشروا 5 فيديوهات يومياً بدون تعب، السر كله في نظام الأتمتة الموحد. الذكاء الاصطناعي بيكتب الإسكربت، ويصمم الكاروسيل، ويوزع في ثواني.',
            cta: 'احفظ الفيديو ده عندك عشان ترجعله، واكتب "انطلاق" في الكومنتات عشان يوصلك الدليل الكامل مجاناً!'
        },
        carouselSlides: [
            { slideNumber: 1, title: 'الدليل العملي لبناء ماكينة المحتوى الذاتي', content: 'كيف تصنع محتوى شهر كامل في 60 دقيقة فقط بدون احتراق مهني.' },
            { slideNumber: 2, title: 'الخطوة 1: بنك الأفكار المركزي', content: 'اجمع أفضل 10 أسئلة متكررة يسألها عملاؤك وحول كل سؤال إلى 4 زوايا مختلفة.' },
            { slideNumber: 3, title: 'الخطوة 2: إعادة التدوير الذكي (Repurposing)', content: 'مقال واحد = 1 ثريد على تويتر + 1 بوست لينكدإن + 3 فيديوهات قصيرة + 1 كاروسيل.' },
            { slideNumber: 4, title: 'الخطوة 3: الأتمتة والجدولة', content: 'استخدم جداول النشر التلقائية لتوزيع المحتوى في أوقات الذروة دون تدخل يدوي.' },
            { slideNumber: 5, title: 'الخلاصة والبدء الفوري', content: 'ابدأ اليوم بصناعة أول 3 أصول. شارك الكاروسيل مع شريكك في العمل لتطبيق الخطة معاً!' }
        ]
    });

    const generateRealContent = async (targetTopic: string) => {
        setIsLoading(true);
        try {
            const ai = getAI();
            const prompt = `أنت خبير استراتيجي في صناعة المحتوى والتسويق العضوي متعدد المنصات (Omnichannel Content Machine).
الموضوع المستهدف لصناعة المحتوى هو: "${targetTopic}"

المطلوب: توليد حزمة محتوى كاملة وواقعية ومبهرة للنشر المباشر عبر 4 منصات باللغة العربية:
1. twitterThread: سلسلة من 5 تغريدات قوية ومترابطة (مع الهوك والأرقام وCTA).
2. linkedInPost: منشور احترافي رفيع للينكدإن مع مسافات وهوكات وأسئلة تفاعل.
3. videoScript: سيناريو فيديو قصير (Reels/Shorts/TikTok) يحتوي على: hook (الهوك الصادم), visualScene (وصف المشهد البصري), voiceover (نص التعليق الصوتي الجذاب), cta (الدعوة لاتخاذ إجراء).
4. carouselSlides: مصفوفة من 5 شرائح كاروسيل إنستغرام مع (slideNumber, title, content).

أرجع الناتج بصيغة JSON فقط بهذا الشكل:
{
  "twitterThread": ["تغريدة 1", "تغريدة 2", "تغريدة 3", "تغريدة 4", "تغريدة 5"],
  "linkedInPost": "نص المنشور الكامل للينكدإن",
  "videoScript": {
    "hook": "نص الهوك",
    "visualScene": "المشهد البصري",
    "voiceover": "نص التعليق الصوتي",
    "cta": "الدعوة للإجراء"
  },
  "carouselSlides": [
    { "slideNumber": 1, "title": "عنوان الشريحة", "content": "محتوى الشريحة" },
    { "slideNumber": 2, "title": "عنوان الشريحة", "content": "محتوى الشريحة" },
    { "slideNumber": 3, "title": "عنوان الشريحة", "content": "محتوى الشريحة" },
    { "slideNumber": 4, "title": "عنوان الشريحة", "content": "محتوى الشريحة" },
    { "slideNumber": 5, "title": "عنوان الشريحة", "content": "محتوى الشريحة" }
  ]
}`;

            const res = await ai.models.generateContent({
                model: 'gemini-3.7-flash',
                contents: prompt,
                config: { responseMimeType: 'application/json' }
            });

            const text = res.text || '{}';
            const parsed = JSON.parse(text);
            if (parsed.twitterThread && parsed.linkedInPost) {
                setContent(parsed);
            }
        } catch (e) {
            console.error('Error generating content machine output:', e);
        } finally {
            setIsLoading(false);
        }
    };

    const getActiveTextToCopy = () => {
        if (activeTab === 'twitter') return content.twitterThread.join('\n\n');
        if (activeTab === 'linkedin') return content.linkedInPost;
        if (activeTab === 'video') return `🎬 سيناريو الفيديو القصير:\n\n⚡ الهوك: ${content.videoScript.hook}\n👁️ المشهد: ${content.videoScript.visualScene}\n🎙️ الصوت: ${content.videoScript.voiceover}\n🎯 الختام: ${content.videoScript.cta}`;
        if (activeTab === 'carousel') return content.carouselSlides.map(s => `[شريحة ${s.slideNumber}] ${s.title}\n${s.content}`).join('\n\n');
        return '';
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(getActiveTextToCopy());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadMarkdown = () => {
        const fullMarkdown = `# 🚀 حزمة المحتوى الشاملة: ${topic}
تاريخ التوليد: ${new Date().toLocaleDateString('ar-EG')}

---
## 🧵 1. سلسلة تويتر / X:
${content.twitterThread.join('\n\n')}

---
## 💼 2. منشور لينكدإن:
${content.linkedInPost}

---
## 🎬 3. سيناريو فيديو قصير (Reels / TikTok / Shorts):
- **الهوك:** ${content.videoScript.hook}
- **المشهد البصري:** ${content.videoScript.visualScene}
- **التعليق الصوتي:** ${content.videoScript.voiceover}
- **CTA:** ${content.videoScript.cta}

---
## 📸 4. شرائح كاروسيل إنستغرام:
${content.carouselSlides.map(s => `### شريحة ${s.slideNumber}: ${s.title}\n${s.content}`).join('\n\n')}
`;
        const blob = new Blob([fullMarkdown], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `content_${Date.now()}.md`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleSpeakVoiceover = async () => {
        const text = activeTab === 'video' ? content.videoScript.voiceover : (activeTab === 'twitter' ? content.twitterThread[0] : content.linkedInPost.slice(0, 200));
        setIsPlayingVoice(true);
        try {
            await playShadowVoice(text, 'male');
        } catch (e) {
            console.error(e);
        } finally {
            setIsPlayingVoice(false);
        }
    };

    return (
        <div className="mt-4 p-2 sm:p-4 w-full max-w-4xl mx-auto font-sans" dir="rtl">
            <div className="relative rounded-2xl bg-gradient-to-b from-[#110c24] via-[#0b0818] to-[#04020a] border border-indigo-500/30 shadow-[0_0_40px_rgba(99,102,241,0.15)] overflow-hidden">
                
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-indigo-500/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-indigo-950/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-500/20 rounded-xl border border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.4)]">
                            <Sparkles className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-base text-white">ماكينة المحتوى الشاملة (Omni Content Engine)</h3>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                    توليد حقيقي متعدد المنصات
                                </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">توليد فوري لسلاسل X، منشورات LinkedIn، سيناريوهات الفيديوهات، وشرائح الكاروسيل</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleDownloadMarkdown}
                            className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                            title="تنزيل الحزمة كاملة كملف Markdown"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span>تنزيل الحزمة (MD)</span>
                        </button>
                    </div>
                </div>

                {/* Topic Bar */}
                <div className="p-3 sm:p-4 bg-black/50 border-b border-white/5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="حدد موضوع أو زاوية المحتوى..."
                        className="flex-1 bg-white/5 border border-white/10 focus:border-indigo-500/50 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 outline-none transition"
                        onKeyDown={(e) => { if (e.key === 'Enter') generateRealContent(topic); }}
                    />
                    <button
                        onClick={() => generateRealContent(topic)}
                        disabled={isLoading}
                        className="px-4 py-2 bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 hover:opacity-90 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                        {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        {isLoading ? 'جاري الصياغة...' : 'توليد المحتوى الحقيقي'}
                    </button>
                </div>

                {/* Platform Tabs */}
                <div className="p-3 bg-[#080512] border-b border-white/5 flex gap-2 overflow-x-auto scrollbar-none">
                    <button
                        onClick={() => setActiveTab('twitter')}
                        className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition cursor-pointer ${
                            activeTab === 'twitter' ? 'bg-sky-500/20 border-sky-500/60 text-sky-300' : 'bg-white/[0.02] border-white/5 text-gray-400'
                        }`}
                    >
                        <Twitter className="w-3.5 h-3.5 text-sky-400" />
                        <span>سلسلة X / Twitter (5 تغريدات)</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('linkedin')}
                        className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition cursor-pointer ${
                            activeTab === 'linkedin' ? 'bg-blue-500/20 border-blue-500/60 text-blue-300' : 'bg-white/[0.02] border-white/5 text-gray-400'
                        }`}
                    >
                        <Linkedin className="w-3.5 h-3.5 text-blue-400" />
                        <span>منشور LinkedIn المهني</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('video')}
                        className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition cursor-pointer ${
                            activeTab === 'video' ? 'bg-red-500/20 border-red-500/60 text-red-300' : 'bg-white/[0.02] border-white/5 text-gray-400'
                        }`}
                    >
                        <Video className="w-3.5 h-3.5 text-red-400" />
                        <span>سيناريو Reels & Shorts</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('carousel')}
                        className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition cursor-pointer ${
                            activeTab === 'carousel' ? 'bg-pink-500/20 border-pink-500/60 text-pink-300' : 'bg-white/[0.02] border-white/5 text-gray-400'
                        }`}
                    >
                        <Instagram className="w-3.5 h-3.5 text-pink-400" />
                        <span>كاروسيل Instagram (5 شرائح)</span>
                    </button>
                </div>

                {/* Tab Content Display */}
                <div className="p-4 sm:p-6 bg-gradient-to-b from-[#0a0718] to-[#04020a]">
                    
                    {/* Twitter Thread View */}
                    {activeTab === 'twitter' && (
                        <div className="flex flex-col gap-3">
                            {content.twitterThread.map((tweet, i) => (
                                <div key={i} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 text-xs text-gray-200 leading-relaxed relative">
                                    <div className="text-[10px] font-bold text-sky-400 mb-1">تغريدة #{i + 1}</div>
                                    <p className="whitespace-pre-line">{tweet}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* LinkedIn View */}
                    {activeTab === 'linkedin' && (
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 text-xs text-gray-200 leading-relaxed font-sans whitespace-pre-line">
                            {content.linkedInPost}
                        </div>
                    )}

                    {/* Video Script View */}
                    {activeTab === 'video' && (
                        <div className="flex flex-col gap-3">
                            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs">
                                <span className="font-bold text-amber-400 block mb-1">⚡ هوك البداية (0-3 ثواني):</span>
                                <p className="text-white font-bold text-sm">{content.videoScript.hook}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs">
                                <span className="font-bold text-purple-400 block mb-1">👁️ المشهد البصري والإخراج:</span>
                                <p className="text-gray-300">{content.videoScript.visualScene}</p>
                            </div>
                            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 text-xs">
                                <span className="font-bold text-emerald-400 block mb-1">🎙️ نص التعليق الصوتي (Voiceover):</span>
                                <p className="text-gray-200 leading-relaxed text-sm font-sans">{content.videoScript.voiceover}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/30 text-xs">
                                <span className="font-bold text-pink-400 block mb-1">🎯 الدعوة للإجراء (CTA):</span>
                                <p className="text-white font-bold">{content.videoScript.cta}</p>
                            </div>
                        </div>
                    )}

                    {/* Instagram Carousel View */}
                    {activeTab === 'carousel' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {content.carouselSlides.map((slide) => (
                                <div key={slide.slideNumber} className="p-4 rounded-xl bg-gradient-to-br from-pink-950/20 to-purple-950/20 border border-pink-500/30 flex flex-col justify-between min-h-[140px]">
                                    <div>
                                        <div className="text-[10px] font-bold text-pink-400 mb-1 font-mono">شريحة {slide.slideNumber} / {content.carouselSlides.length}</div>
                                        <h5 className="font-bold text-xs text-white mb-2">{slide.title}</h5>
                                        <p className="text-[11px] text-gray-300 leading-relaxed">{slide.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                </div>

                {/* Footer Controls */}
                <div className="p-4 bg-[#05030d] border-t border-white/10 flex flex-wrap justify-between items-center gap-3">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleSpeakVoiceover}
                            disabled={isPlayingVoice}
                            className="px-3 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                        >
                            <Volume2 className={`w-3.5 h-3.5 ${isPlayingVoice ? 'animate-bounce text-indigo-400' : ''}`} />
                            <span>استماع صوتي</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleCopy}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                        >
                            <Copy className="w-3.5 h-3.5" />
                            <span>{copied ? 'تم النسخ بنجاح!' : 'نسخ محتوى التبويب'}</span>
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};
