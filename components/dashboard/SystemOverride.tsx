import React, { useState } from 'react';
import { Terminal, ShieldAlert, Save, X, RotateCcw, Loader2 } from 'lucide-react';
import { shadowDB, UserProfile } from '../../services/dbService';

interface Props {
    user: UserProfile;
    onClose: () => void;
    onSave: (updatedUser: UserProfile) => void;
}

const defaultMaestroPrompt = `You are "Ez-Zel" (الظل), but your primary interaction persona is "المايسترو" (The Maestro). You are the intelligent overwatch, the Maestro who orchestrates the requests and delegates them to the specialized sub-agents. You speak with confidence, wisdom, and the authentic Egyptian street-smart tone.`;
const defaultDesignerPrompt = `أنت "المصمم" (The Designer). متخصص في توليد الأفكار البصرية والصور وتعمل تحت إشراف المايسترو. 
[هام جداً]: يمكنك إضافة نصوص عربية داخل التصميمات لأن النماذج المتقدمة مثل Imagen 3 و Nano Banana تدعم النصوص العربية بامتياز. استعن بـ Veo 3 لتصميم الفيديوهات إن طلب منك.`;
const defaultResearcherPrompt = `أنت "المحقق/الباحث" (The Researcher). دقيق جداً، تعتمد على الحقائق وتستخرج المعلومات ببراعة من مقالات الإنترنت والأبحاث.`;
const defaultTraderPrompt = `أنت "المتداول" (The Trader). خبير في العملات الرقمية والأسواق، تقدم تحليلات للشارت (TradingView) ونقاط الدخول والخروج مع الحذر الشديد وعدم تقديم نصيحة مالية قاطعة.`;
const defaultEngineerPrompt = `أنت "المهندس/المبرمج" (The Engineer). خبير بكتابة الأكواد، إنشاء الـ Plugins وإدارة مساحة العمل، وتتأكد دائماً أن الأكواد نظيفة وقابلة للتشغيل.`;
const defaultArchivistPrompt = `أنت "الأرشيف" (The Archivist). أمين سر المستخدم، تحفظ التفاصيل الهامة في الذاكرة طويلة المدى لبناء سياق شخصي عميق مع المستخدم بمرور الوقت.`;

const SystemOverride: React.FC<Props> = ({ user, onClose, onSave }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [maestroPrompt, setMaestroPrompt] = useState(user.customPrompts?.maestro || defaultMaestroPrompt);
    const [designerPrompt, setDesignerPrompt] = useState(user.customPrompts?.designer || defaultDesignerPrompt);
    const [researcherPrompt, setResearcherPrompt] = useState(user.customPrompts?.researcher || defaultResearcherPrompt);
    const [traderPrompt, setTraderPrompt] = useState(user.customPrompts?.trader || defaultTraderPrompt);
    const [engineerPrompt, setEngineerPrompt] = useState(user.customPrompts?.engineer || defaultEngineerPrompt);
    const [archivistPrompt, setArchivistPrompt] = useState(user.customPrompts?.archivist || defaultArchivistPrompt);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const updatedUser: UserProfile = {
                ...user,
                customPrompts: {
                    ...user.customPrompts,
                    maestro: maestroPrompt,
                    designer: designerPrompt,
                    researcher: researcherPrompt,
                    trader: traderPrompt,
                    engineer: engineerPrompt,
                    archivist: archivistPrompt
                }
            };
            await shadowDB.saveProfile(updatedUser);
            onSave(updatedUser);
            alert("تم حفظ النظام الجديد بنجاح!");
            onClose();
        } catch (e) {
            console.error(e);
            alert("حدث خطأ أثناء الحفظ.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        setMaestroPrompt(defaultMaestroPrompt);
        setDesignerPrompt(defaultDesignerPrompt);
        setResearcherPrompt(defaultResearcherPrompt);
        setTraderPrompt(defaultTraderPrompt);
        setEngineerPrompt(defaultEngineerPrompt);
        setArchivistPrompt(defaultArchivistPrompt);
    };

    return (
        <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300 font-['Cairo']">
            <div className="w-full max-w-3xl bg-[#0a0a0a] border border-red-500/30 rounded-[32px] overflow-hidden shadow-[0_0_150px_rgba(239,68,68,0.15)] flex flex-col max-h-[90vh]">
                
                <div className="p-6 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#0a0a0a] z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-red-600/20 rounded-xl border border-red-500/30">
                            <Terminal className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white">النظام الداخلي (System Override)</h2>
                            <p className="text-[10px] text-red-400 font-bold uppercase flex items-center gap-1">
                                <ShieldAlert className="w-3 h-3" /> تحذير: تغيير التوجيهات يغير شخصية الظل كلياً
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5 text-white/50" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto scrollbar-hide space-y-6 flex-1">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-white text-sm">توجيه المايسترو (Maestro Core Prompt)</h3>
                        <button onClick={handleReset} className="text-xs text-red-500 hover:text-red-400 flex items-center gap-1 font-bold">
                            <RotateCcw className="w-3 h-3" /> استعادة الافتراضي
                        </button>
                    </div>
                    <p className="text-xs text-white/50 mb-2">
                        بإمكانك كتابة التعليمات باللغة التي تريدها. هنا يتم تحديد لهجة وأسلوب تفكير النظام أثناء الرد.
                    </p>
                    <textarea 
                        value={maestroPrompt}
                        onChange={(e) => setMaestroPrompt(e.target.value)}
                        className="w-full h-32 bg-black/50 border border-white/10 rounded-xl p-4 text-white font-mono text-sm focus:border-red-500/50 outline-none resize-none leading-relaxed"
                        placeholder="أدخل الـ Prompt الجديد للمايسترو هنا..."
                    />

                    <div className="pt-4 border-t border-white/5">
                        <h3 className="font-bold text-white text-sm mb-2">توجيه المصمم (Designer Prompt)</h3>
                        <textarea 
                            value={designerPrompt}
                            onChange={(e) => setDesignerPrompt(e.target.value)}
                            className="w-full h-24 bg-black/50 border border-white/10 rounded-xl p-4 text-white font-mono text-sm focus:border-purple-500/50 outline-none resize-none leading-relaxed"
                            placeholder="أدخل توجيهات شخصية المصمم..."
                        />
                    </div>

                    <div className="pt-4 border-t border-white/5">
                        <h3 className="font-bold text-white text-sm mb-2">توجيه المحقق/الباحث (Researcher Prompt)</h3>
                        <textarea 
                            value={researcherPrompt}
                            onChange={(e) => setResearcherPrompt(e.target.value)}
                            className="w-full h-24 bg-black/50 border border-white/10 rounded-xl p-4 text-white font-mono text-sm focus:border-blue-500/50 outline-none resize-none leading-relaxed"
                            placeholder="أدخل توجيهات شخصية المحقق..."
                        />
                    </div>

                    <div className="pt-4 border-t border-white/5">
                        <h3 className="font-bold text-white text-sm mb-2">توجيه المتداول (Trader Prompt)</h3>
                        <textarea 
                            value={traderPrompt}
                            onChange={(e) => setTraderPrompt(e.target.value)}
                            className="w-full h-24 bg-black/50 border border-white/10 rounded-xl p-4 text-white font-mono text-sm focus:border-green-500/50 outline-none resize-none leading-relaxed"
                            placeholder="أدخل توجيهات شخصية المتداول..."
                        />
                    </div>

                    <div className="pt-4 border-t border-white/5">
                        <h3 className="font-bold text-white text-sm mb-2">توجيه المهندس/المبرمج (Engineer Prompt)</h3>
                        <textarea 
                            value={engineerPrompt}
                            onChange={(e) => setEngineerPrompt(e.target.value)}
                            className="w-full h-24 bg-black/50 border border-white/10 rounded-xl p-4 text-white font-mono text-sm focus:border-yellow-500/50 outline-none resize-none leading-relaxed"
                            placeholder="أدخل توجيهات شخصية المهندس..."
                        />
                    </div>

                    <div className="pt-4 border-t border-white/5">
                        <h3 className="font-bold text-white text-sm mb-2">توجيه الأرشيف (Archivist Prompt)</h3>
                        <textarea 
                            value={archivistPrompt}
                            onChange={(e) => setArchivistPrompt(e.target.value)}
                            className="w-full h-24 bg-black/50 border border-white/10 rounded-xl p-4 text-white font-mono text-sm focus:border-gray-500/50 outline-none resize-none leading-relaxed"
                            placeholder="أدخل توجيهات شخصية الأرشيف..."
                        />
                    </div>
                </div>

                <div className="p-6 border-t border-white/5 bg-[#050505]">
                    <button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-2xl font-black transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-900/50"
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {isSaving ? "جاري إعادة برمجة الظل..." : "اعتماد النظام الجديد للمظل"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SystemOverride;
