import React, { useState, useEffect } from 'react';
import { Users, Briefcase, Calculator, Scale, Cpu, Zap, Brain, Terminal, FileText, Play, CheckCircle2, Copy, Download, Volume2, Sparkles, RefreshCw } from 'lucide-react';
import { getAI } from '../../services/geminiService';
import { playShadowVoice } from '../../services/speechService';

interface ExecutiveOpinion {
    role: string;
    name: string;
    title: string;
    avatarBg: string;
    iconType: string;
    opinion: string;
    verdict: 'موافق بشدة' | 'موافق بحذر' | 'تحفظ تقني' | 'تحفظ مالي' | 'إقرار نهائي';
    score: number;
}

export const BoardroomMeetingCard = ({ card }: { card: any }) => {
    const initialTopic = card.data?.topic || card.data?.query || 'استراتيجية إطلاق وتوسيع المشروع وتعظيم الأرباح';
    const [topic, setTopic] = useState(initialTopic);
    const [isDebating, setIsDebating] = useState(false);
    const [activeTab, setActiveTab] = useState<number>(0);
    const [progress, setProgress] = useState(0);
    const [finalResolution, setFinalResolution] = useState<string>('');
    const [copied, setCopied] = useState(false);
    const [isPlayingVoice, setIsPlayingVoice] = useState(false);

    const [executives, setExecutives] = useState<ExecutiveOpinion[]>([
        {
            role: 'المايسترو (CEO)',
            name: 'الظل',
            title: 'رئيس المجلس التنفيذي',
            avatarBg: 'bg-purple-600/30 border-purple-500/50 text-purple-300',
            iconType: 'brain',
            opinion: 'الهدف الرئيسي هو تحقيق هيمنة سريعة في السوق بأقل تكلفة استحواذ ممكنة وأعلى قيمة مضافة للمستخدم.',
            verdict: 'إقرار نهائي',
            score: 95
        },
        {
            role: 'المهندس (CTO)',
            name: 'نكسوس-7',
            title: 'كبير مسؤولي التكنولوجيا',
            avatarBg: 'bg-blue-600/30 border-blue-500/50 text-blue-300',
            iconType: 'terminal',
            opinion: 'يجب بناء معمارية مرنة وقابلة للتوسع (Microservices & Serverless) مع تطبيق أعلى معايير التشفير والأمان من اليوم الأول.',
            verdict: 'موافق بشدة',
            score: 90
        },
        {
            role: 'المحاسب (CFO)',
            name: 'سفيان المالي',
            title: 'المدير المالي والتدقيق',
            avatarBg: 'bg-emerald-600/30 border-emerald-500/50 text-emerald-300',
            iconType: 'calculator',
            opinion: 'التركيز على الـ Unit Economics الإيجابي، والوصول لنقطة التعادل (Break-even) خلال 6 أشهر مع حرق سيولة منضبط.',
            verdict: 'موافق بحذر',
            score: 85
        },
        {
            role: 'المسوق (CMO)',
            name: 'فيكتور ريتش',
            title: 'قائد النمو والاستحواذ',
            avatarBg: 'bg-amber-600/30 border-amber-500/50 text-amber-300',
            iconType: 'zap',
            opinion: 'استخدام أسلوب الـ Growth Loops والمحتوى الفيروسي لجذب أول 10,000 عميل بدون ميزانيات إعلانية ضخمة.',
            verdict: 'موافق بشدة',
            score: 92
        },
        {
            role: 'المستشار (Legal)',
            name: 'د. عادل النبراوي',
            title: 'المستشار القانوني والامتثال',
            avatarBg: 'bg-cyan-600/30 border-cyan-500/50 text-cyan-300',
            iconType: 'scale',
            opinion: 'توثيق شروط الخدمة وسياسة الخصوصية والتوافق مع قوانين التجارة الإلكترونية وحماية البيانات لتفادي أي عقوبات.',
            verdict: 'موافق بحذر',
            score: 88
        }
    ]);

    const runLiveDebate = async (targetTopic: string) => {
        setIsDebating(true);
        setProgress(15);
        try {
            const ai = getAI();
            setProgress(35);
            const prompt = `أنت تمثل مجلس إدارة شركة عالمية (Shadow Executive Board) مكون من 5 خبراء متخصصين.
الموضوع المطروح للنقاش والقرار التنفيذي هو: "${targetTopic}"

المطلوب: توليد مداولة عميقة واستراتيجية حقيقية لكل عضو بالمجلس حول هذا الموضوع باللغة العربية بأسلوب احترافي رفيع، وتلخيص قرار المجلس النهائي.
أرجع الناتج بصيغة JSON فقط بهذا الشكل بالظبط:
{
  "executives": [
    {
      "role": "المايسترو (CEO)",
      "name": "الظل",
      "title": "رئيس المجلس التنفيذي",
      "opinion": "رأيه الاستراتيجي والقيادي المحدد للموضوع",
      "verdict": "إقرار نهائي",
      "score": 95
    },
    {
      "role": "المهندس (CTO)",
      "name": "نكسوس-7",
      "title": "كبير مسؤولي التكنولوجيا",
      "opinion": "تحليله التقني التفصيلي للبنية والأمان والتنفيذ",
      "verdict": "موافق بشدة",
      "score": 90
    },
    {
      "role": "المحاسب (CFO)",
      "name": "سفيان المالي",
      "title": "المدير المالي والتدقيق",
      "opinion": "تحليله للتكاليف والتدفقات النقدية وهامش الربحية",
      "verdict": "موافق بحذر",
      "score": 85
    },
    {
      "role": "المسوق (CMO)",
      "name": "فيكتور ريتش",
      "title": "قائد النمو والاستحواذ",
      "opinion": "استراتيجيته للاستحواذ على العملاء وبناء القيمة التسويقية",
      "verdict": "موافق بشدة",
      "score": 92
    },
    {
      "role": "المستشار (Legal)",
      "name": "د. عادل النبراوي",
      "title": "المستشار القانوني والامتثال",
      "opinion": "تحليله القانوني وتدابير الامتثال وحماية الملكية الفكرية",
      "verdict": "موافق بحذر",
      "score": 88
    }
  ],
  "finalResolution": "قرار المجلس التنفيذي الموحد الصارم وخارطة طريق العمل المباشرة (3-4 أسطر قوية ومحددة)"
}`;

            const response = await ai.models.generateContent({
                model: 'gemini-3.7-flash',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json'
                }
            });

            setProgress(85);
            const text = response.text || '{}';
            const parsed = JSON.parse(text);

            if (parsed.executives && Array.isArray(parsed.executives)) {
                const colors = [
                    'bg-purple-600/30 border-purple-500/50 text-purple-300',
                    'bg-blue-600/30 border-blue-500/50 text-blue-300',
                    'bg-emerald-600/30 border-emerald-500/50 text-emerald-300',
                    'bg-amber-600/30 border-amber-500/50 text-amber-300',
                    'bg-cyan-600/30 border-cyan-500/50 text-cyan-300'
                ];
                const icons = ['brain', 'terminal', 'calculator', 'zap', 'scale'];
                
                const updated = parsed.executives.map((e: any, idx: number) => ({
                    ...e,
                    avatarBg: colors[idx % colors.length],
                    iconType: icons[idx % icons.length]
                }));
                setExecutives(updated);
            }

            if (parsed.finalResolution) {
                setFinalResolution(parsed.finalResolution);
            }
            setProgress(100);
        } catch (e: any) {
            console.error('Error running boardroom debate:', e);
            setProgress(100);
        } finally {
            setIsDebating(false);
        }
    };

    useEffect(() => {
        if (card.data?.autoRun) {
            runLiveDebate(topic);
        }
    }, []);

    const getIcon = (type: string) => {
        switch (type) {
            case 'brain': return <Brain className="w-5 h-5" />;
            case 'terminal': return <Terminal className="w-5 h-5" />;
            case 'calculator': return <Calculator className="w-5 h-5" />;
            case 'zap': return <Zap className="w-5 h-5" />;
            case 'scale': return <Scale className="w-5 h-5" />;
            default: return <Users className="w-5 h-5" />;
        }
    };

    const handleCopyReport = () => {
        const report = `🏛️ تقرير مداولات مجلس إدارة الظل الاستشاري
📌 الموضوع المطروح: ${topic}
----------------------------------------
${executives.map(e => `👤 ${e.role} - ${e.name} (${e.title}):\nالحكم: ${e.verdict} (مؤشر التوافق: ${e.score}%)\nالرأي: ${e.opinion}\n`).join('\n')}
----------------------------------------
⚖️ القرار التنفيذي النهائي للمجلس:
${finalResolution || executives[0].opinion}`;
        
        navigator.clipboard.writeText(report);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const handleSpeakResolution = async () => {
        const textToSpeak = finalResolution || executives[0].opinion;
        if (!textToSpeak) return;
        setIsPlayingVoice(true);
        try {
            await playShadowVoice(`قرار مجلس إدارة الظل: ${textToSpeak}`, 'male');
        } catch (e) {
            console.error(e);
        } finally {
            setIsPlayingVoice(false);
        }
    };

    const currentExec = executives[activeTab] || executives[0];

    return (
        <div className="mt-4 p-2 sm:p-4 w-full max-w-4xl mx-auto font-sans" dir="rtl">
            <div className="relative rounded-2xl bg-gradient-to-b from-[#0d1322] via-[#090d16] to-[#04060a] border border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.12)] overflow-hidden">
                
                {/* Header */}
                <div className="p-4 sm:p-6 border-b border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-amber-500/20 rounded-xl border border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                            <Briefcase className="w-6 h-6 text-amber-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-lg text-white">مجلس إدارة الظل الاستشاري</h3>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                    <Sparkles className="w-3 h-3 text-amber-400 animate-spin" />
                                    مداولة حية بالذكاء المتعدد
                                </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">نقاش متعدد الوكلاء من 5 زوايا استراتيجية (تقنية، مالية، تسويقية، قانونية، وقيادية)</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                            onClick={() => runLiveDebate(topic)}
                            disabled={isDebating}
                            className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-black font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                        >
                            {isDebating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                            {isDebating ? 'جاري انعقاد المجلس...' : 'بدء المداولة الحية'}
                        </button>
                    </div>
                </div>

                {/* Topic Input Bar */}
                <div className="p-4 bg-black/40 border-b border-white/5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <span className="text-xs text-gray-400 font-bold whitespace-nowrap">موضوع الجلسة:</span>
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="اكتب الموضوع أو القرار الذي ترغب في طرحه على المجلس..."
                        className="flex-1 bg-white/5 border border-white/10 focus:border-amber-500/50 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 outline-none transition"
                        onKeyDown={(e) => { if (e.key === 'Enter') runLiveDebate(topic); }}
                    />
                </div>

                {/* Progress bar when debating */}
                {isDebating && (
                    <div className="w-full bg-white/5 h-1 overflow-hidden">
                        <div 
                            className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 h-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}

                {/* Executives Navigation Tabs */}
                <div className="p-3 sm:p-4 bg-[#070b12] border-b border-white/5 overflow-x-auto scrollbar-none">
                    <div className="flex gap-2 min-w-max">
                        {executives.map((exec, idx) => {
                            const isSelected = activeTab === idx;
                            return (
                                <button
                                    key={idx}
                                    onClick={() => setActiveTab(idx)}
                                    className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer ${
                                        isSelected 
                                            ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)]' 
                                            : 'bg-white/[0.03] border-white/5 text-gray-400 hover:bg-white/[0.06] hover:text-gray-200'
                                    }`}
                                >
                                    <div className={`p-1.5 rounded-lg border ${exec.avatarBg}`}>
                                        {getIcon(exec.iconType)}
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold">{exec.role}</div>
                                        <div className="text-[10px] text-gray-400 font-normal">{exec.name}</div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Active Executive View */}
                <div className="p-4 sm:p-6 bg-gradient-to-b from-[#0b101c] to-[#060910]">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-2xl border ${currentExec.avatarBg}`}>
                                {getIcon(currentExec.iconType)}
                            </div>
                            <div>
                                <h4 className="font-bold text-white text-base">{currentExec.name}</h4>
                                <p className="text-xs text-amber-400">{currentExec.title} • {currentExec.role}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold">
                                {currentExec.verdict}
                            </span>
                            <span className="text-xs text-gray-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                                مؤشر التوافق: <b className="text-amber-400">{currentExec.score}%</b>
                            </span>
                        </div>
                    </div>

                    <div className="my-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 text-sm text-gray-200 leading-relaxed font-sans">
                        <p className="whitespace-pre-line">{currentExec.opinion}</p>
                    </div>
                </div>

                {/* Final Unified Board Resolution */}
                <div className="p-4 sm:p-6 bg-[#04070d] border-t border-amber-500/20">
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-amber-400" />
                            <h4 className="font-bold text-sm text-amber-300">القرار التنفيذي النهائي المعتمد للمجلس</h4>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleSpeakResolution}
                                disabled={isPlayingVoice}
                                className="p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-1.5 transition cursor-pointer"
                                title="استمع للقرار بصوت الظل"
                            >
                                <Volume2 className={`w-3.5 h-3.5 ${isPlayingVoice ? 'animate-bounce text-amber-400' : ''}`} />
                                <span className="hidden sm:inline">استماع</span>
                            </button>
                            <button
                                onClick={handleCopyReport}
                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs flex items-center gap-1.5 transition cursor-pointer"
                                title="نسخ تقرير المجلس"
                            >
                                <Copy className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">{copied ? 'تم النسخ!' : 'نسخ التقرير'}</span>
                            </button>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-amber-500/[0.04] border border-amber-500/20 text-xs sm:text-sm text-amber-100/90 leading-relaxed">
                        {finalResolution || 'بناءً على التوافق بين الرؤية التقنية وهياكل التكلفة المحسوبة واستراتيجية النمو، يقر المجلس التنفيذي المضي قدماً في التنفيذ مع الالتزام بالضوابط القانونية ونقاط المراقبة المالية الأسبوعية.'}
                    </div>
                </div>

            </div>
        </div>
    );
};
