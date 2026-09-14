import React from 'react';
import { Share2, Mic } from 'lucide-react';

interface VoiceShareDialogProps {
    preparedShareData: { files: File[], title: string, text: string } | null;
    onClose: () => void;
}

export const VoiceShareDialog: React.FC<VoiceShareDialogProps> = ({ preparedShareData, onClose }) => {
    if (!preparedShareData) return null;

    const handleShare = async () => {
        try {
            if (navigator.canShare && navigator.canShare({ files: preparedShareData.files })) {
                await navigator.share(preparedShareData);
            } else {
                const url = URL.createObjectURL(preparedShareData.files[0]);
                const a = document.createElement('a'); 
                a.href = url; 
                a.download = 'shadow-voice.mp3'; 
                document.body.appendChild(a); 
                a.click(); 
                document.body.removeChild(a); 
                setTimeout(() => URL.revokeObjectURL(url), 1000);
            }
        } catch(e) {}
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[500] bg-black/95 flex items-center justify-center p-6 backdrop-blur-xl animate-in fade-in">
            <div className="bg-[#111] border border-indigo-500/30 p-8 rounded-[32px] max-w-sm w-full text-center shadow-[0_0_40px_rgba(99,102,241,0.2)]">
                <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Mic className="w-10 h-10 text-indigo-500 animate-pulse" />
                </div>
                <h3 className="text-xl font-black text-white mb-2">الملف الصوتي جاهز!</h3>
                <p className="text-white/50 text-xs mb-8 font-medium">تم تحضير المقطع الصوتي للظل وهو جاهز الآن لربطه بأي تطبيق للمشاركة.</p>
                
                <div className="flex flex-col gap-3">
                    <button 
                        onClick={handleShare}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-black text-white text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/50"
                    >
                        <Share2 className="w-5 h-5" /> مشاركة الصوت الآن
                    </button>
                    <button 
                        onClick={onClose}
                        className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-bold text-white/50 text-xs transition-colors"
                    >
                        إلغاء
                    </button>
                </div>
            </div>
        </div>
    );
};
