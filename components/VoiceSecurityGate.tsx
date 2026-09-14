import React, { useState, useEffect } from 'react';
import { Mic, Loader2, X, ShieldAlert } from 'lucide-react';
import { voiceBiometrics } from '../services/voiceBiometricsService';

export const VoiceSecurityGate: React.FC<{
    onSuccess: () => void;
    onClose: () => void;
}> = ({ onSuccess, onClose }) => {
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Automatically start listening on mount
        handleVerify();
        return () => {
             // Cleanup stream if needed
        };
    }, []);

    const handleVerify = async () => {
        setIsListening(true);
        setError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Wait 2-3 seconds for user to speak
            const result = await voiceBiometrics.verify(stream, 3000);
            
            // Stop mic
            stream.getTracks().forEach(t => t.stop());

            if (result.verified) {
                 onSuccess();
            } else {
                 setError("لم يتم التعرف على الصوت (مرفوض)");
                 setIsListening(false);
            }
        } catch (e: any) {
            console.error("Mic error:", e);
            setError("حدث خطأ في الميكروفون المرجو الموافقة على الصلاحية.");
            setIsListening(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[700] bg-black/95 flex items-center justify-center p-4 backdrop-blur-xl animate-in fade-in" dir="rtl">
            <div className="bg-[#111] border border-cyan-500/20 rounded-3xl w-full max-w-md p-8 relative flex flex-col items-center text-center shadow-[0_0_50px_rgba(6,182,212,0.1)]">
                <button onClick={onClose} className="absolute top-6 left-6 p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                    <X className="w-5 h-5 text-white/50" />
                </button>
                
                <div className="w-24 h-24 rounded-full bg-cyan-900/20 border border-cyan-500/30 flex items-center justify-center mb-6 relative">
                    <div className={`absolute inset-0 rounded-full ${isListening ? 'animate-ping bg-cyan-500/20' : ''}`} />
                    <ShieldAlert className="w-10 h-10 text-cyan-400 relative z-10" />
                </div>
                
                <h2 className="text-2xl font-black text-white mb-2">جدار الحماية الفعلي</h2>
                <p className="text-white/50 text-sm mb-8 leading-relaxed">
                    من فضلك تحدّث الآن ليتم مطابقة تردّدات صوتك (Voice Wave Analysis) للسماح بالوصول لخصائص Sovereign ونكسوس.
                </p>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-xl mb-6 w-full font-bold">
                        {error}
                    </div>
                )}

                {isListening ? (
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                        <span className="text-cyan-400 font-bold text-sm tracking-wide">جاري الاستماع للتردد الصوتي (٣ ثواني)...</span>
                    </div>
                ) : (
                    <button onClick={handleVerify} className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2">
                        <Mic className="w-5 h-5" />
                        المحاولة مرة أخرى
                    </button>
                )}
            </div>
        </div>
    );
};
