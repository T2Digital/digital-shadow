import React, { useState, useEffect } from 'react';
import { X, Network, Zap, Code, BrainCircuit, Server, Settings, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { localBrain } from '../../services/localBrainService';

interface BrainModalProps {
    onClose: () => void;
}

export const BrainRouterModal: React.FC<BrainModalProps> = ({ onClose }) => {
    const [activeBrain, setActiveBrain] = useState('router');
    const [isLocalReady, setIsLocalReady] = useState(localBrain.isReady());
    const [localProgress, setLocalProgress] = useState(localBrain.loadProgress);
    const [localProgressText, setLocalProgressText] = useState(localBrain.loadText);
    const [isLoadingLocal, setIsLoadingLocal] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setIsLocalReady(localBrain.isReady());
            setLocalProgress(localBrain.loadProgress);
            setLocalProgressText(localBrain.loadText);
        }, 500);
        return () => clearInterval(interval);
    }, []);

    const handleLoadLocalModel = async () => {
        setIsLoadingLocal(true);
        // Load local LLM
        await localBrain.initModel((p, text) => {
            setLocalProgress(p);
            setLocalProgressText(text);
        });
        
        // Load Transformer models (Vision, Audio, TTS)
        try {
            setLocalProgress(90);
            setLocalProgressText("جاري استدعاء محركات الرؤية والصوت (Transformers)...");
            const { localTransformers } = await import('../../services/localTransformersService');
            await localTransformers.initAll((text) => {
                setLocalProgressText(text);
            });
        } catch(e) {
            console.error("Transformers fallback error", e);
        }

        setIsLoadingLocal(false);
        setIsLocalReady(true);
    };

    const brains = [
        {
            id: 'router',
            name: 'مُوجه العقول الشامل (Brain Router)',
            description: 'النظام يختار النموذج الأنسب تلقائياً بناءً على المهمة لتحقيق أقصى كفاءة.',
            icon: Network,
            color: 'text-indigo-400',
            bg: 'bg-indigo-500/10',
            border: 'border-indigo-500/30'
        },
        {
            id: 'groq',
            name: 'Groq (Llama-3 70B)',
            description: 'للسرعة اللحظية الخارقة في البحث واتخاذ القرارات السريعة (سرعة الضوء).',
            icon: Zap,
            color: 'text-yellow-400',
            bg: 'bg-yellow-500/10',
            border: 'border-yellow-500/30'
        },
        {
            id: 'claude',
            name: 'Claude 3.5 Sonnet',
            description: 'لبرمجة الكود المعقد وتحليل الملفات الكبيرة بدقة عالية.',
            icon: Code,
            color: 'text-orange-400',
            bg: 'bg-orange-500/10',
            border: 'border-orange-500/30'
        },
        {
            id: 'gpt4o',
            name: 'GPT-4o',
            description: 'للمنطق المتوازن وصياغة المحتوى الاستراتيجي.',
            icon: BrainCircuit,
            color: 'text-green-400',
            bg: 'bg-green-500/10',
            border: 'border-green-500/30'
        },
        {
            id: 'local',
            name: 'Edge AI (Phi-3 / Llama-3)',
            description: 'عمل محلي بالكامل داخل متصفحك للحفاظ على الخصوصية وتقليل تكلفة الـ API والعمل بدون إنترنت.',
            icon: Server,
            color: 'text-cyan-400',
            bg: 'bg-cyan-500/10',
            border: 'border-cyan-500/30'
        }
    ];

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in zoom-in">
            <div className="w-full max-w-2xl bg-[#080808] border border-indigo-500/20 rounded-[40px] p-8 relative shadow-[0_0_50px_rgba(99,102,241,0.1)] overflow-y-auto max-h-[90vh] scrollbar-hide">
                <button onClick={onClose} className="absolute top-6 left-6 p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                    <X className="w-5 h-5 text-white/50" />
                </button>
                
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-indigo-900/20 rounded-xl border border-indigo-500/30">
                        <Network className="w-8 h-8 text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white">محرك العقول الشامل</h2>
                        <p className="text-indigo-200/50 text-xs font-bold uppercase tracking-widest">Universal Brain Router & Edge AI</p>
                    </div>
                </div>

                <div className="bg-white/5 p-5 rounded-[24px] border border-white/5 mb-6">
                    <p className="text-sm text-white/70 leading-relaxed">
                        هنا تحدد عقل "الظل". يمكنك ترك الخيار على "المُوجه الشامل" ليقوم الظل بتوزيع المهام تلقائياً: 
                        المهام السريعة لـ Groq، البرمجة لـ Claude، والصياغة لـ GPT. كما يمكنك تفعيل "Edge AI" لمعالجة بياناتك محلياً لضمان خصوصية 100%.
                    </p>
                </div>

                <div className="space-y-4">
                    {brains.map((brain) => {
                        const Icon = brain.icon;
                        const isActive = activeBrain === brain.id;
                        return (
                            <div 
                                key={brain.id}
                                onClick={() => setActiveBrain(brain.id)}
                                className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${isActive ? `${brain.bg} ${brain.border}` : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                            >
                                <div className={`p-3 rounded-lg ${isActive ? brain.bg : 'bg-black/50'}`}>
                                    <Icon className={`w-6 h-6 ${isActive ? brain.color : 'text-white/40'}`} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className={`font-bold ${isActive ? 'text-white' : 'text-white/70'}`}>{brain.name}</h3>
                                        {isActive && <CheckCircle2 className={`w-5 h-5 ${brain.color}`} />}
                                    </div>
                                    <p className="text-xs text-white/40 leading-relaxed">{brain.description}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {activeBrain === 'local' && (
                    <div className="mt-6 bg-cyan-900/20 p-5 rounded-2xl border border-cyan-500/30 flex items-start gap-4 transition-all">
                        <AlertCircle className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <div className="w-full">
                            <h4 className="text-sm font-bold text-cyan-400 mb-1">تجهيز الذكاء الاصطناعي المحلي (Edge AI)</h4>
                            
                            {!isLocalReady ? (
                                <>
                                    <p className="text-xs text-cyan-200/60 leading-relaxed mb-4">
                                        سيتم استخدام WebLLM لتحميل محرك LLM خفيف (Phi-3) للعمل داخل المتصفح. 
                                        حجم النموذج حوالي 2.2 جيجابايت، ويحتاج لكارت شاشة (GPU) حديث نسبياً للعمل بسلاسة. وسيتم تخزينه في الذاكرة المؤقتة (Cache) للعمل أوفلاين لاحقاً.
                                    </p>
                                    
                                    {isLoadingLocal ? (
                                        <div className="bg-black/40 rounded-xl p-4 border border-cyan-500/20">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                                                    <span className="text-xs font-bold text-cyan-200">جاري تحميل وتجهيز النموذج...</span>
                                                </div>
                                                <span className="text-xs font-mono text-cyan-400">{localProgress}%</span>
                                            </div>
                                            <div className="w-full bg-cyan-950 rounded-full h-1.5 mb-2 overflow-hidden">
                                                <div className="bg-cyan-400 h-1.5 rounded-full transition-all duration-300" style={{ width: `${localProgress}%` }}></div>
                                            </div>
                                            <p className="text-[10px] text-cyan-200/50 font-mono truncate">{localProgressText}</p>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={handleLoadLocalModel}
                                            className="px-4 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-sm font-bold transition-all w-full flex items-center justify-center gap-2"
                                        >
                                            <Server className="w-4 h-4" />
                                            شغّل محرك Edge AI الآن
                                        </button>
                                    )}
                                </>
                            ) : (
                                <div className="bg-cyan-950/50 rounded-xl p-4 border border-cyan-500/30 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/50">
                                        <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-cyan-100 mb-0.5">محرك Edge AI متصل وجاهز للعمل</p>
                                        <p className="text-[10px] text-cyan-200/60">الظل يمكنه الآن العمل بدون إنترنت ومعالجة بياناتك محلياً بشكل كامل.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
