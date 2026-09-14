import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import { LocalDeepDive } from '../LocalDeepDive';
import { BoardroomMeetingCard } from '../chat/BoardroomMeetingCard';
import ShadowVisual from '../ShadowVisual';

export const ResearchCenterModal = ({ onClose }: { onClose: () => void }) => (
    <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-xl flex items-center justify-center p-2 md:p-6 animate-in fade-in zoom-in">
        <div className="w-full max-w-7xl h-[95vh] bg-[#050505] border border-blue-500/20 rounded-[40px] p-6 relative shadow-[0_0_50px_rgba(59,130,246,0.1)] overflow-hidden flex flex-col">
            <button onClick={onClose} className="absolute top-6 left-6 p-2 bg-white/5 rounded-full hover:bg-white/10 z-50 text-white/50 hover:text-white">
                <X className="w-6 h-6" />
            </button>
            <div className="flex-1 w-full overflow-y-auto scrollbar-hide py-4 relative z-40 pt-10">
                <LocalDeepDive onClose={onClose} />
            </div>
        </div>
    </div>
);

export const AdvisoryBoardModal = ({ onClose }: { onClose: () => void }) => {
    // Array of the actual Shadow Council members
    const realShadowMembers = [
        'المايسترو', 'المهندس', 'المحقق', 'المحاسب', 'المنفذ', 
        'نكسوس', 'المستشار', 'المحلل', 'المعالج', 'المحلل الفني'
    ];

    return (
        <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-xl flex items-center justify-center p-2 md:p-6 animate-in fade-in zoom-in">
            <div className="w-full max-w-5xl h-[85vh] bg-[#050505] border border-amber-500/20 rounded-[40px] p-6 relative shadow-[0_0_50px_rgba(245,158,11,0.1)] overflow-hidden flex flex-col items-center">
                <button onClick={onClose} className="absolute top-6 left-6 p-2 bg-white/5 rounded-full hover:bg-white/10 z-50 text-white/50 hover:text-white">
                    <X className="w-6 h-6" />
                </button>
                <h2 className="text-3xl font-black text-amber-500 mb-6 mt-8 md:mt-2 text-center w-full">مجلس استشاري الظل (الدائرة الداخلية)</h2>
                <div className="flex-1 w-full overflow-y-auto scrollbar-hide custom-scrollbar">
                    <BoardroomMeetingCard card={{ data: { members: realShadowMembers, issue: "انعقاد جلسة مجلس الظل المعرفي للمناقشة واتخاذ القرار العاجل" } }} />
                </div>
            </div>
        </div>
    );
};

export const HologramModal = ({ onClose }: { onClose: () => void }) => (
    <div className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center animate-in fade-in zoom-in p-6">
         <button onClick={onClose} className="absolute top-6 left-6 p-3 bg-white/10 rounded-full hover:bg-white/20 z-50 transition-all text-white">
             <X className="w-6 h-6" />
         </button>
         <h2 className="absolute top-10 right-10 text-xl md:text-3xl font-black text-purple-400 tracking-widest uppercase z-40 drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]">Hologram Engine</h2>
         
         <div className="relative w-full h-full flex flex-col items-center justify-center transform scale-125">
             <ShadowVisual pulse="spiritual" size="normal" />
         </div>
         
         <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-center z-40">
            <p className="text-white/50 text-sm font-bold uppercase tracking-[0.4em] mb-2">النواة الهولوجرامية نشطة</p>
         </div>
    </div>
);
