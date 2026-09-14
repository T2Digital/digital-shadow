
import React from 'react';
import { X, Sparkles, Brain, Shield, Info, Activity } from 'lucide-react';

interface Props {
    pillarId: string;
    data: { status: string; advice: string } | null;
    onClose: () => void;
}

const PillarDetail: React.FC<Props> = ({ pillarId, data, onClose }) => {
    const titles: Record<string, string> = {
        spiritual: 'الجانب الروحاني',
        productivity: 'الجانب العملي',
        growth: 'الجانب المعرفي',
        health: 'الجانب الصحي',
        finance: 'الجانب المالي'
    };

    const subtitles: Record<string, string> = {
        spiritual: 'علاقتك مع الله وهدوء نفسك',
        productivity: 'أهدافك، مهامك، ومسار إنجازك',
        growth: 'تطوير مهاراتك واستثمارك في عقلك',
        health: 'طاقتك البدنية وعاداتك الصحية',
        finance: 'توازنك المالي وتخطيطك للمستقبل'
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl animate-in fade-in zoom-in duration-300">
            <div className="w-full max-w-xl glass rounded-[40px] p-8 md:p-12 relative border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)]">
                <button onClick={onClose} className="absolute top-8 left-8 p-3 hover:bg-white/10 rounded-full transition-all group">
                    <X className="w-6 h-6 text-white/40 group-hover:text-white" />
                </button>
                
                <div className="flex flex-col items-center text-center mb-10">
                    <div className="inline-block p-5 rounded-full bg-gradient-to-br from-purple-500/20 to-transparent border border-purple-500/20 mb-6 shadow-xl">
                        <Activity className="w-10 h-10 text-purple-400" />
                    </div>
                    <h2 className="text-4xl font-black tracking-tight">{titles[pillarId] || 'الجانب'}</h2>
                    <p className="text-purple-300/40 text-xs font-bold uppercase tracking-[0.3em] mt-3">{subtitles[pillarId]}</p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <div className="bg-white/5 p-8 rounded-[32px] border border-white/5 relative group hover:border-white/10 transition-all">
                        <div className="absolute -right-2 -top-2 opacity-10 group-hover:opacity-20 transition-all">
                            <Shield className="w-20 h-20 text-white" />
                        </div>
                        <h4 className="text-[10px] font-black text-white/20 uppercase mb-3 flex items-center gap-2 tracking-widest">
                            <Info className="w-3 h-3" /> التقرير الحالي
                        </h4>
                        <p className="text-xl font-bold leading-relaxed text-white/90">{data?.status || 'أنا لسه بجمع خيوط الجانب ده من كلامنا.. اتكلم معايا أكتر.'}</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-600/20 to-transparent p-8 rounded-[32px] border border-purple-500/20 relative group hover:border-purple-500/40 transition-all">
                        <div className="absolute -right-2 -top-2 opacity-10 group-hover:opacity-20 transition-all">
                            <Sparkles className="w-20 h-20 text-purple-400" />
                        </div>
                        <h4 className="text-[10px] font-black text-purple-400/40 uppercase mb-3 flex items-center gap-2 tracking-widest">
                            <Brain className="w-3 h-3" /> بصيرة الظل
                        </h4>
                        <p className="text-base italic leading-relaxed text-purple-100">
                            "{data?.advice || 'بمجرد ما أعرفك أكتر، هحطلك هنا الخلاصة اللي تريح بالك وتظبط حالك.'}"
                        </p>
                    </div>
                </div>

                <div className="mt-10 pt-6 border-t border-white/5 text-center">
                    <p className="text-[9px] text-white/10 font-bold uppercase tracking-[0.5em]">Shadow Core Feedback System</p>
                </div>
            </div>
        </div>
    );
};

export default PillarDetail;
