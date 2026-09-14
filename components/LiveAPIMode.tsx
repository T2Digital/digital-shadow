import React, { useState, useEffect, useRef } from 'react';
import { Mic, X, Waves, Video, Monitor, StopCircle } from 'lucide-react';
import { useAppStore } from '../services/store';
import { getShadowResponse, speakNative, stopVoice } from '../services/geminiService';

export const LiveAPIMode: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { user } = useAppStore();
    const [isScreenShared, setIsScreenShared] = useState(false);
    const [status, setStatus] = useState('Connecting to Deepmind WebRTC...');
    const [isActive, setIsActive] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [botReply, setBotReply] = useState('');

    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setStatus('Connected: Live Session Active');
            startListening();
        }, 1500);

        return () => {
            clearTimeout(timer);
            stopListening();
            stopVoice(); // if system holds native or remote TTS
            window.speechSynthesis.cancel();
        };
    }, []);

    const startListening = () => {
        setIsActive(true);
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            const recognition = new SpeechRec();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'ar-EG';

            recognition.onresult = (event: any) => {
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        handleFinalTranscript(event.results[i][0].transcript);
                    } else {
                        setTranscript(event.results[i][0].transcript);
                    }
                }
            };
            
            recognition.onerror = () => {};
            recognition.onend = () => {
                if (recognitionRef.current && status !== "Thinking..." && status !== "Speaking...") {
                    try { recognition.start(); } catch(e) {}
                }
            };
            
            try {
                recognition.start();
                recognitionRef.current = recognition;
            } catch(e) {
                console.warn(e);
            }
        }
    };

    const stopListening = () => {
        setIsActive(false);
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
    };

    const handleFinalTranscript = async (text: string) => {
        if (!text.trim()) return;
        setTranscript(text);
        setStatus("Thinking...");
        
        // Stop listening temporarily to avoid feedback
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        
        try {
            const promptContext = `أنت الآن في جلسة صوتا وصورة حقيقية ومباشرة Live Session. الرد يجب أن يكون قصيراً جداً (عبارة أو جملتين بحد أقصى للرد السريع) ومباشراً وبلسانك المعتاد كظل (بلهجة مصرية جذابة وثقة وفخر إنك شغال من متصفحه بدون سيرفرات). المستخدم قال لك تواً صوتاً: ${text}`;
            const res = await getShadowResponse([], promptContext, undefined, user);
            const reply = res.text || "الرد وصل";
            
            setBotReply(reply);
            speak(reply);
        } catch(e: any) {
            setBotReply("عذراً، هناك مشكلة في معالجة طلبك.");
            setStatus("Connected: Live Session Active");
            if (recognitionRef.current) {
                try { recognitionRef.current.start(); } catch(e) {}
            }
        }
    };

    const speak = async (text: string) => {
        setStatus("Speaking...");
        
        try {
            await speakNative(text, 'alloy', () => {
                 setStatus("Connected: Live Session Active");
                 if (recognitionRef.current && isActive) {
                     try { recognitionRef.current.start(); } catch(e) {}
                 }
            });
        } catch (e) {
            // fallback if native speech fails
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'ar-SA';
            utterance.rate = 1.15;
            
            utterance.onend = () => {
                 setStatus("Connected: Live Session Active");
                 if (recognitionRef.current && isActive) {
                     try { recognitionRef.current.start(); } catch(e) {}
                 }
            };
            
            window.speechSynthesis.speak(utterance);
        }
    };

    const toggleScreenShare = async () => {
        if (!isScreenShared) {
            try {
                await navigator.mediaDevices.getDisplayMedia({ video: true });
                setIsScreenShared(true);
            } catch (e) {
                console.warn(e);
            }
        } else {
            setIsScreenShared(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in">
            <button onClick={onClose} className="absolute top-6 left-6 p-4 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                <X className="w-6 h-6 text-white" />
            </button>
            <div className="absolute top-6 right-6">
                <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full font-bold text-xs flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    {status}
                </div>
            </div>

            <div className="relative mb-12 mt-12">
                <div className={`w-48 h-48 rounded-full blur-3xl absolute inset-0 ${status === 'Speaking...' ? 'bg-fuchsia-500/40 animate-ping' : status === 'Thinking...' ? 'bg-amber-500/40 animate-pulse' : 'bg-blue-500/20 animate-pulse'}`}></div>
                <div className={`w-48 h-48 rounded-full flex flex-col items-center justify-center bg-black/50 backdrop-blur-md shadow-[0_0_100px_rgba(59,130,246,0.3)] relative z-10 border-2 transition-all duration-500 ${status === 'Speaking...' ? 'border-fuchsia-400 scale-110 shadow-[0_0_150px_rgba(217,70,239,0.5)]' : status === 'Thinking...' ? 'border-amber-400' : 'border-blue-500/50'}`}>
                    <Waves className={`w-16 h-16 ${status === 'Speaking...' ? 'text-fuchsia-400 animate-bounce' : status === 'Thinking...' ? 'text-amber-400 animate-spin' : 'text-blue-400 animate-pulse'}`} />
                    <span className="text-white font-black mt-2 tracking-widest text-lg">الظل</span>
                </div>
            </div>

            <div className="text-center mb-8 max-w-2xl px-6 h-32 flex flex-col items-center justify-center">
                {botReply ? (
                    <div className="text-2xl font-bold text-fuchsia-400 tracking-wide font-['Cairo'] mb-4" dir="rtl">
                        "{botReply}"
                    </div>
                ) : (
                    <div className="text-white/50 text-sm leading-relaxed font-['Cairo']" dir="rtl">
                        تحدث بحرية، الإستجابة فورية. الإدراك البصري الآلي مٌفعل. الردود سريعة ومختصرة لجلسات النقاش.
                    </div>
                )}
                
                {transcript && (
                    <div className="text-blue-400/80 text-lg font-['Cairo'] italic mt-4" dir="rtl">
                        أنت: "{transcript}"
                    </div>
                )}
            </div>

            <div className="flex gap-6 mt-auto mb-10">
                <button 
                    onClick={toggleScreenShare}
                    className={`p-6 rounded-full border shadow-2xl transition-all ${isScreenShared ? 'bg-purple-600 border-purple-500 text-white shadow-[0_0_30px_rgba(168,85,247,0.5)]' : 'bg-[#111] border-white/10 text-white/50 hover:bg-white/10'}`}
                >
                    <Monitor className="w-8 h-8" />
                </button>
                <button 
                    onClick={isActive ? stopListening : startListening}
                    className={`p-6 rounded-full text-white shadow-[0_0_50px_rgba(59,130,246,0.6)] border transition-all ${isActive ? 'bg-blue-600 border-blue-400 animate-bounce' : 'bg-red-600 border-red-500 hover:bg-red-500'}`}
                >
                    {isActive ? <Mic className="w-8 h-8" /> : <StopCircle className="w-8 h-8" />}
                </button>
                <button className="p-6 rounded-full border bg-[#111] border-white/10 text-white/50 hover:bg-white/10 transition-all">
                    <Video className="w-8 h-8" />
                </button>
            </div>
        </div>
    );
};
