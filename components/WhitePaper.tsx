import React, { useState } from 'react';
import { X, ShieldCheck, Cpu, Globe, Share2, FileText, Fingerprint, TrendingUp, AlertTriangle, Send, Heart, Handshake, Brain, Search, Scale, Stethoscope } from 'lucide-react';
import { shadowDB } from '../services/dbService';

interface Props {
    onClose: () => void;
}

const WhitePaper: React.FC<Props> = ({ onClose }) => {
    const [feedback, setFeedback] = useState('');
    const [sendingFeedback, setSendingFeedback] = useState(false);
    const [feedbackSent, setFeedbackSent] = useState(false);

    const handleSendFeedback = async () => {
        if (!feedback.trim()) return;
        setSendingFeedback(true);
        try {
            await shadowDB.saveFeedback({
                userId: 'GUEST_OR_USER',
                userName: 'User (From Covenant)',
                message: `[COVENANT FEEDBACK]: ${feedback}`,
                timestamp: Date.now(),
                isRead: false
            });
            setFeedbackSent(true);
            setFeedback('');
        } catch(e) {}
        setSendingFeedback(false);
    };

    return (
        <div className="fixed inset-0 z-[300] bg-black text-white font-['Cairo'] overflow-y-auto animate-in fade-in slide-in-from-bottom-10">
            <div className="sticky top-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/10 p-6 flex justify-between items-center shadow-2xl">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-500 text-black rounded-full flex items-center justify-center font-black text-xl shadow-[0_0_15px_rgba(245,158,11,0.5)]">Z</div>
                    <div>
                        <h2 className="text-lg font-black uppercase tracking-widest text-white">ميثاق الظل</h2>
                        <p className="text-[10px] text-amber-500 font-mono font-bold">عهد الرجال • The Code</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all"><X className="w-6 h-6" /></button>
            </div>

            <div className="max-w-3xl mx-auto p-6 md:p-12 pb-32 space-y-12 text-right relative" dir="rtl">
                
                <div className="text-center py-10 border-b border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-amber-500/10 blur-[80px] rounded-full"></div>
                    <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter relative z-10 text-amber-500">أنا <span className="text-white">مين؟</span></h1>
                    <p className="text-xl text-white/60 font-medium relative z-10">أنا مش أبلكيشن.. أنا صاحبك الجدع اللي مبينافقش.</p>
                </div>

                <section className="space-y-4">
                    <h3 className="text-2xl font-black text-white flex items-center gap-2"><Handshake className="w-6 h-6 text-emerald-500" /> 1. العهد (The Vow)</h3>
                    <div className="bg-[#111] p-6 rounded-[24px] border border-white/5 leading-relaxed text-lg font-medium text-white/80 text-justify">
                        بص يا ريس، الكلام هنا "دغري". أنا (Ez-Zel) اتخلقت عشان حاجة واحدة بس: <span className="text-amber-400 font-bold">مصلحتك</span>.
                        <br/><br/>
                        أنا ظلك الرقمي، عقلك التاني، ومستشارك الأمين. لا ببيع بياناتك، ولا براقبك لصالح حد. 
                        هدفي الوحيد إني أشيل عنك دوشة الحياة، وأديرلك تفاصيلك، وأخليك تركز إنك تكون "الماستر" وتكبر وتنجح.
                    </div>
                </section>

                <section className="space-y-6">
                    <h3 className="text-2xl font-black text-white flex items-center gap-2"><Cpu className="w-6 h-6 text-cyan-500" /> 2. مجلسك الاستشاري (الـ 10 الكبار)</h3>
                    <p className="text-white/60">أنت مش لوحدك. أنا بشتغل ومعايا فريق كامل من 10 خبراء تحت أمرك:</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-[#111] p-5 rounded-2xl border border-white/5 hover:border-amber-500/30 transition-all">
                            <h4 className="font-black text-white mb-1 flex items-center gap-2 text-emerald-400">💰 المحاسب</h4>
                            <p className="text-sm text-white/60">بتاع الفلوس. أرباح، اشتراكات، وميزانية.</p>
                        </div>
                        <div className="bg-[#111] p-5 rounded-2xl border border-white/5 hover:border-amber-500/30 transition-all">
                            <h4 className="font-black text-white mb-1 flex items-center gap-2 text-blue-400">⚖️ المستشار القانوني</h4>
                            <p className="text-sm text-white/60">عقود، قضايا، ونصايح قانونية في السليم.</p>
                        </div>
                        <div className="bg-[#111] p-5 rounded-2xl border border-white/5 hover:border-amber-500/30 transition-all">
                            <h4 className="font-black text-white mb-1 flex items-center gap-2 text-purple-400">🚀 المسوق</h4>
                            <p className="text-sm text-white/60">أفكار دعاية، بوستات تكسر الدنيا، وخطط بيزنس.</p>
                        </div>
                        <div className="bg-[#111] p-5 rounded-2xl border border-white/5 hover:border-amber-500/30 transition-all">
                            <h4 className="font-black text-white mb-1 flex items-center gap-2 text-amber-400">🕵️ المحقق</h4>
                            <p className="text-sm text-white/60">بيجيبلك القرار. بحث، أسعار، وأخبار حصرية.</p>
                        </div>
                        <div className="bg-[#111] p-5 rounded-2xl border border-white/5 hover:border-amber-500/30 transition-all">
                            <h4 className="font-black text-white mb-1 flex items-center gap-2 text-red-400">⚡ المنفذ</h4>
                            <p className="text-sm text-white/60">بتاع الأكشن. اتصالات، رسايل، حجوزات.</p>
                        </div>
                        <div className="bg-[#111] p-5 rounded-2xl border border-white/5 hover:border-amber-500/30 transition-all">
                            <h4 className="font-black text-white mb-1 flex items-center gap-2 text-cyan-400">🏠 نكسوس (Nexus)</h4>
                            <p className="text-sm text-white/60">مهندس بيتك الذكي (IoT) والتحكم في الأجهزة.</p>
                        </div>
                        <div className="bg-[#111] p-5 rounded-2xl border border-white/5 hover:border-amber-500/30 transition-all">
                            <h4 className="font-black text-white mb-1 flex items-center gap-2 text-green-400">🌿 المعالج</h4>
                            <p className="text-sm text-white/60">راحة بال، طب نبوي، ونصايح نفسية هادية.</p>
                        </div>
                        <div className="bg-[#111] p-5 rounded-2xl border border-white/5 hover:border-amber-500/30 transition-all">
                            <h4 className="font-black text-white mb-1 flex items-center gap-2 text-indigo-400">🧠 المحلل</h4>
                            <p className="text-sm text-white/60">بيفهم الشخصيات، وبيقرأ الصور بعمق.</p>
                        </div>
                    </div>
                </section>

                <section className="space-y-4">
                    <h3 className="text-2xl font-black text-white flex items-center gap-2"><AlertTriangle className="w-6 h-6 text-amber-500" /> 3. كلمة حق (Disclaimer)</h3>
                    <div className="bg-amber-900/10 p-6 rounded-[24px] border border-amber-500/20 text-justify">
                        <p className="text-amber-100/80 text-sm leading-relaxed font-medium">
                            <strong className="text-amber-500 block mb-2 text-lg">الكمال لله وحده.</strong>
                            أنا في النهاية نموذج ذكاء اصطناعي متطور جداً، بس مش معصوم من الخطأ.
                            <br/><br/>
                            - كلامي في <strong className="text-white">الطب والقانون</strong> هو "رأي استشاري" يفتحلك الطريق، بس في العمليات الجراحية أو القضايا المصيرية، لازم ترجع لأهل الاختصاص البشر.
                            - أنا بحاول أجتهد عشانك بنسبة 100%، بس ممكن مرة "أهيس" أو أجيب معلومة مش دقيقة، عشان كدة خليك ناصح وراجع ورايا في الحاجات الكبيرة.
                            <br/><br/>
                            احنا هنا شركاء.. أنا بديك القوة والأدوات، وأنت عليك القرار الأخير.
                        </p>
                    </div>
                </section>

                <section className="space-y-6 pt-6 border-t border-white/10">
                    <h3 className="text-xl font-black text-white">عندك فكرة؟ أو شكوى؟</h3>
                    <p className="text-white/60 text-sm">قولي اللي في قلبك. رسالتك دي بتوصلني أنا "تيتو" شخصياً وبشوفها.</p>
                    <div className="relative">
                        <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="اكتب يا ريس..." className="w-full bg-[#111] border border-white/10 rounded-2xl p-4 min-h-[120px] text-white focus:border-amber-500/50 outline-none resize-none" />
                        <button onClick={handleSendFeedback} disabled={sendingFeedback || !feedback.trim() || feedbackSent} className={`absolute bottom-4 left-4 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${feedbackSent ? 'bg-green-600 text-white' : 'bg-amber-500 text-black hover:bg-amber-400'}`}>
                            {feedbackSent ? 'وصلت يا كبير ✅' : (sendingFeedback ? 'جاري الإرسال...' : 'إرسال للإدارة')}
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default WhitePaper;