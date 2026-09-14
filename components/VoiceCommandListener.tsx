import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Settings, Trash2, X, Sparkles, Command, HelpCircle, Check, Play, Square, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../services/store';
import { NativeSettings } from './NativeSettings';
import { playShadowVoiceStreaming, stopVoice, audioStreamQueue } from '../services/speechService';
import { getAI } from '../services/geminiService';

export const VoiceCommandListener: React.FC = () => {
    const { user, isAppLocked, setIsAppLocked, setView } = useAppStore();
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isResponding, setIsResponding] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [streamingReply, setStreamingReply] = useState('');
    const [matchedCommand, setMatchedCommand] = useState<string | null>(null);
    const [showHelp, setShowHelp] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [audioLevel, setAudioLevel] = useState(0);

    const recognitionRef = useRef<any>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const silenceTimeoutRef = useRef<any>(null);
    const transcriptRef = useRef<string>('');

    // Listen to real-time audio levels from streaming voice synthesis
    useEffect(() => {
        const handleVoiceLevel = (e: any) => {
            if (isSpeaking) {
                setAudioLevel(e.detail?.level || 0);
            }
        };

        const handleVoiceEnded = () => {
            setIsSpeaking(false);
            setIsResponding(false);
            setAudioLevel(0);
        };

        window.addEventListener('shadow_audio_level', handleVoiceLevel);
        window.addEventListener('shadow_voice_ended', handleVoiceEnded);

        return () => {
            window.removeEventListener('shadow_audio_level', handleVoiceLevel);
            window.removeEventListener('shadow_voice_ended', handleVoiceEnded);
            stopVoice();
        };
    }, [isSpeaking]);

    // Audio confirmation beep
    const playBeep = (freq = 800, duration = 0.15, type: OscillatorType = 'sine') => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            osc.type = type;
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + duration);
        } catch (e) {
            console.warn("Audio feedback blocked", e);
        }
    };

    // Text to speech streaming feedback helper - starts streaming immediately on first sentence
    const speakFeedback = (text: string) => {
        try {
            setIsSpeaking(true);
            setStreamingReply(text);
            const voicePref = user?.voicePreference || 'male';
            playShadowVoiceStreaming(text, voicePref, undefined, () => {
                setIsSpeaking(false);
            });
        } catch (e) {
            console.warn("Streaming speech feedback failed", e);
            setIsSpeaking(false);
        }
    };

    // Streaming AI Voice Assistant handler for unlisted questions & conversational commands
    const handleStreamingAIResponse = async (userSpeech: string) => {
        setIsResponding(true);
        setStreamingReply('');
        setMatchedCommand('الظل يجيب مباشرة...');
        setIsSpeaking(true);

        const voicePref = user?.voicePreference || 'male';
        const sessionId = audioStreamQueue.startSession(() => {
            setIsSpeaking(false);
            setIsResponding(false);
        });

        try {
            const ai = getAI();
            const responseStream = await ai.models.generateContentStream({
                model: 'gemini-2.5-flash',
                contents: [
                    {
                        role: 'user',
                        parts: [{
                            text: `أنت المساعد الذكي "الظل". أجب على المستخدم باختصار وبلهجة مصرية ذكية وواثقة ومباشرة جداً في جملة أو جملتين سريعتين على سؤاله أو طلبه الصوتي: "${userSpeech}". لا تستخدم رموز تعبيرية معقدة في النطق.`
                        }]
                    }
                ]
            });

            let textBuffer = '';
            let fullText = '';
            const sentenceDelimiters = /[.!؟،؛\n]/;

            for await (const chunk of responseStream) {
                const chunkText = chunk.text || '';
                fullText += chunkText;
                textBuffer += chunkText;
                setStreamingReply(fullText);

                let match;
                while ((match = textBuffer.search(sentenceDelimiters)) !== -1) {
                    const sentence = textBuffer.slice(0, match + 1).trim();
                    textBuffer = textBuffer.slice(match + 1);
                    if (sentence.length > 1) {
                        audioStreamQueue.enqueueSentence(sentence, voicePref, sessionId);
                    }
                }
            }

            if (textBuffer.trim().length > 0) {
                audioStreamQueue.enqueueSentence(textBuffer.trim(), voicePref, sessionId);
            }

            audioStreamQueue.markCompleted(sessionId);
        } catch (e) {
            console.error("AI Streaming Voice Error:", e);
            speakFeedback("أنا معك يا سيدي، كيف أقدر أساعدك اليوم؟");
            setIsResponding(false);
        }
    };

    const handleStopSpeech = () => {
        stopVoice();
        audioStreamQueue.stop();
        setIsSpeaking(false);
        setIsResponding(false);
        setAudioLevel(0);
    };

    const commands = [
        {
            id: 'settings',
            phrases: [
                'افتح الإعدادات', 'افتح الاعدادات', 'إعدادات النظام', 'اعدادات النظام', 'التحكم العاصف', 'التحكم العميق', 'الضبط', 'افتح الضبط',
                'open settings', 'show settings', 'settings', 'system settings', 'open deep settings', 'deep settings'
            ],
            action: () => {
                setShowSettings(true);
                speakFeedback("تم فتح إعدادات النظام");
            },
            label: 'إعدادات النظام',
            sublabel: 'افتح الإعدادات / Open settings',
            icon: <Settings className="w-4 h-4 text-cyan-400" />
        },
        {
            id: 'notifications',
            phrases: [
                'امسح الإشعارات', 'امسح الاشعارات', 'مسح الإشعارات', 'مسح الاشعارات', 'حذف التنبيهات', 'الغاء التنبيهات', 'الغاء التنبيه', 'مسح التنبيهات',
                'clear notifications', 'delete notifications', 'remove notifications', 'clear alerts', 'dismiss alerts', 'clear notification'
            ],
            action: () => {
                // Dispatch general app notification clear
                window.dispatchEvent(new CustomEvent('shadow_clear_notifications'));
                speakFeedback("تم مسح كافة التنبيهات بنجاح");
                playBeep(400, 0.3, 'triangle');
            },
            label: 'مسح التنبيهات',
            sublabel: 'امسح الإشعارات / Clear notifications',
            icon: <Trash2 className="w-4 h-4 text-red-400" />
        },
        {
            id: 'chat',
            phrases: [
                'افتح الشات', 'شات', 'دردشة', 'الدردشة', 'محادثة', 'كلم الظل',
                'open chat', 'go to chat', 'start chat', 'chat', 'show chat'
            ],
            action: () => {
                setView('chat');
                speakFeedback("تم فتح الدردشة");
            },
            label: 'مساعد الظل الذكي',
            sublabel: 'افتح الشات / Open chat',
            icon: <Sparkles className="w-4 h-4 text-purple-400" />
        },
        {
            id: 'dashboard',
            phrases: [
                'الرئيسية', 'افتح اللوحة', 'لوحة التحكم', 'داشبورد', 'الداشبورد', 'الرئيسيه',
                'open dashboard', 'go to dashboard', 'home', 'dashboard', 'show dashboard'
            ],
            action: () => {
                setView('dashboard');
                speakFeedback("تم الانتقال إلى لوحة التحكم");
            },
            label: 'لوحة التحكم الرئيسية',
            sublabel: 'الرئيسية / Open dashboard',
            icon: <Command className="w-4 h-4 text-emerald-400" />
        },
        {
            id: 'workspace',
            phrases: [
                'افتح الملفات', 'مساحة العمل', 'ملفات', 'الملفات', 'مساحه العمل',
                'open workspace', 'go to workspace', 'files', 'workspace', 'show workspace'
            ],
            action: () => {
                setView('workspace');
                speakFeedback("تم فتح مساحة العمل");
            },
            label: 'مساحة العمل والملفات',
            sublabel: 'مساحة العمل / Open workspace',
            icon: <Command className="w-4 h-4 text-blue-400" />
        },
        {
            id: 'music',
            phrases: [
                'افتح الموسيقى', 'الموسيقى', 'الاستوديو', 'استوديو الموسيقى', 'افتح استوديو الموسيقى',
                'open music', 'go to music', 'music studio', 'music', 'show music'
            ],
            action: () => {
                window.dispatchEvent(new CustomEvent('shadow_open_modal', { detail: { modal: 'music_vault' } }));
                speakFeedback("تم تفعيل استوديو الإنتاج الصوتي");
            },
            label: 'استوديو الموسيقى',
            sublabel: 'افتح استوديو الموسيقى / Open music',
            icon: <Command className="w-4 h-4 text-amber-400" />
        },
        {
            id: 'lock',
            phrases: [
                'اقفل التطبيق', 'قفل', 'تأمين', 'تامين', 'قفل الشاشة', 'تأمين التطبيق',
                'lock screen', 'lock app', 'secure app', 'lock'
            ],
            action: () => {
                setIsAppLocked(true);
                speakFeedback("تم تأمين التطبيق وقفل الشاشة بنجاح");
            },
            label: 'تأمين وقفل الشاشة',
            sublabel: 'اقفل التطبيق / Lock app',
            icon: <Command className="w-4 h-4 text-rose-400" />
        },
        {
            id: 'unlock',
            phrases: [
                'افتح القفل', 'فتح', 'إلغاء القفل', 'الغاء القفل', 'افتح التطبيق',
                'unlock screen', 'unlock app', 'unlock'
            ],
            action: () => {
                setIsAppLocked(false);
                speakFeedback("تم إلغاء قفل الحماية بنجاح");
            },
            label: 'إلغاء قفل الحماية',
            sublabel: 'افتح القفل / Unlock app',
            icon: <Command className="w-4 h-4 text-green-400" />
        },
        {
            id: 'tasks',
            phrases: [
                'افتح المهام', 'المهام', 'جدول المهام', 'مهام',
                'open tasks', 'show tasks', 'tasks', 'todo list', 'todo'
            ],
            action: () => {
                window.dispatchEvent(new CustomEvent('shadow_open_modal', { detail: { modal: 'tasks' } }));
                speakFeedback("تم فتح جدول المهام المجدولة");
            },
            label: 'جدول المهام اليومية',
            sublabel: 'افتح المهام / Open tasks',
            icon: <Command className="w-4 h-4 text-indigo-400" />
        },
        {
            id: 'memory',
            phrases: [
                'افتح الذاكرة', 'الذاكرة', 'مخزن الذاكرة', 'الذاكره',
                'open memory', 'show memory', 'memory vault', 'memory'
            ],
            action: () => {
                window.dispatchEvent(new CustomEvent('shadow_open_modal', { detail: { modal: 'memory' } }));
                speakFeedback("تم استرجاع مخزن الذاكرة العميقة");
            },
            label: 'مخزن الذاكرة العميقة',
            sublabel: 'افتح الذاكرة / Open memory',
            icon: <Command className="w-4 h-4 text-teal-400" />
        },
        {
            id: 'contacts',
            phrases: [
                'جهات الاتصال', 'افتح جهات الاتصال', 'الناس', 'الاصدقاء',
                'open contacts', 'show contacts', 'contacts'
            ],
            action: () => {
                window.dispatchEvent(new CustomEvent('shadow_open_modal', { detail: { modal: 'contacts' } }));
                speakFeedback("تم فتح سجل جهات الاتصال");
            },
            label: 'سجل جهات الاتصال',
            sublabel: 'جهات الاتصال / Open contacts',
            icon: <Command className="w-4 h-4 text-orange-400" />
        },
        {
            id: 'wallet',
            phrases: [
                'افتح المحفظة', 'المحفظة', 'محفظتي', 'المحفظه',
                'open wallet', 'show wallet', 'wallet'
            ],
            action: () => {
                window.dispatchEvent(new CustomEvent('shadow_open_modal', { detail: { modal: 'wallet' } }));
                speakFeedback("تم فتح المحفظة المشفرة");
            },
            label: 'المحفظة والتمويل المالي',
            sublabel: 'افتح المحفظة / Open wallet',
            icon: <Command className="w-4 h-4 text-violet-400" />
        }
    ];

    const matchAndExecuteCommand = (text: string) => {
        const normalized = text.toLowerCase().trim();
        for (const cmd of commands) {
            for (const phrase of cmd.phrases) {
                if (normalized.includes(phrase.toLowerCase())) {
                    setMatchedCommand(cmd.label);
                    playBeep(1000, 0.2, 'sine');
                    setTimeout(() => {
                        cmd.action();
                    }, 500);
                    return true;
                }
            }
        }
        return false;
    };

    const startListening = async () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("ميزة التعرف على الصوت غير مدعومة في متصفحك الحالي.");
            return;
        }

        if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = null;
        }

        playBeep(600, 0.1, 'sine');
        setIsListening(true);
        setTranscript('جاري الاستماع...');
        transcriptRef.current = '';
        setMatchedCommand(null);

        // Setup Speech Recognition
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = true;
        rec.lang = 'ar-EG'; // Primary Arabic (supports both Arabic and English triggers perfectly)

        rec.onresult = (e: any) => {
            let current = '';
            for (let i = e.resultIndex; i < e.results.length; ++i) {
                current += e.results[i][0].transcript;
            }
            setTranscript(current);
            transcriptRef.current = current;

            // Clear any previous silence timeout
            if (silenceTimeoutRef.current) {
                clearTimeout(silenceTimeoutRef.current);
            }

            // Set auto-submit timeout: if user remains silent for 900ms, auto-stop recording to execute command
            silenceTimeoutRef.current = setTimeout(() => {
                console.log("[Voice Command] Silence detected, auto-submitting...");
                try {
                    rec.stop();
                } catch (err) {
                    console.warn("Error auto-stopping recognition:", err);
                }
            }, 900);
        };

        rec.onend = () => {
            setIsListening(false);
            stopAudioAnalyzer();
            
            if (silenceTimeoutRef.current) {
                clearTimeout(silenceTimeoutRef.current);
                silenceTimeoutRef.current = null;
            }

            const finalTranscript = transcriptRef.current;
            
            // On speech complete, analyze the command
            if (finalTranscript && finalTranscript !== 'جاري الاستماع...') {
                const executed = matchAndExecuteCommand(finalTranscript);
                if (!executed) {
                    playBeep(450, 0.15, 'sine');
                    handleStreamingAIResponse(finalTranscript);
                }
            }
        };

        rec.onerror = (e: any) => {
            console.error("Speech Recognition Error", e);
            setIsListening(false);
            stopAudioAnalyzer();
            if (silenceTimeoutRef.current) {
                clearTimeout(silenceTimeoutRef.current);
                silenceTimeoutRef.current = null;
            }
        };

        recognitionRef.current = rec;
        rec.start();

        // Start premium audio level visualizer
        startAudioAnalyzer();
    };

    const stopListening = () => {
        if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = null;
        }
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) {}
        }
        setIsListening(false);
        stopAudioAnalyzer();
    };

    const startAudioAnalyzer = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 32;
            
            const source = audioCtx.createMediaStreamSource(stream);
            source.connect(analyser);

            audioContextRef.current = audioCtx;
            analyserRef.current = analyser;
            sourceRef.current = source;
            dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

            const updateLevel = () => {
                if (!analyserRef.current || !dataArrayRef.current) return;
                analyserRef.current.getByteFrequencyData(dataArrayRef.current);
                let sum = 0;
                for (let i = 0; i < dataArrayRef.current.length; i++) {
                    sum += dataArrayRef.current[i];
                }
                const avg = sum / dataArrayRef.current.length;
                setAudioLevel(avg / 128); // normalize roughly
                animationFrameRef.current = requestAnimationFrame(updateLevel);
            };
            updateLevel();
        } catch (e) {
            console.warn("Failed to start speech visual analyzer:", e);
        }
    };

    const stopAudioAnalyzer = () => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        if (sourceRef.current) {
            try {
                sourceRef.current.mediaStream.getTracks().forEach(t => t.stop());
            } catch (e) {}
            sourceRef.current = null;
        }
        if (audioContextRef.current) {
            try {
                audioContextRef.current.close();
            } catch (e) {}
            audioContextRef.current = null;
        }
        setAudioLevel(0);
    };

    useEffect(() => {
        return () => {
            stopAudioAnalyzer();
        };
    }, []);

    if (!user) return null;

    return (
        <>
            {/* Global Listening and Overlay Dialog - Fully Draggable */}
            <motion.div
                drag
                dragMomentum={false}
                dragElastic={0.05}
                whileHover={{ scale: 1.02 }}
                style={{ touchAction: 'none', bottom: '24px', left: '24px' }}
                className="fixed z-[9999] font-['Cairo'] flex items-center gap-3 select-none cursor-grab active:cursor-grabbing bg-black/40 p-2 rounded-full border border-cyan-500/20 shadow-lg hover:border-cyan-400 transition-all duration-300"
                title="اسحب مايك الأوامر لأي مكان على الشاشة / Drag anywhere"
            >
                <AnimatePresence>
                    {(isListening || isSpeaking || isResponding || transcript || streamingReply || matchedCommand) && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, x: -20 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.9, x: -20 }}
                            className="bg-[#080808]/95 backdrop-blur-2xl border border-cyan-500/30 rounded-3xl p-5 shadow-[0_0_50px_rgba(6,182,212,0.15)] max-w-sm flex flex-col gap-3 text-right"
                            dir="rtl"
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-cyan-400 font-bold text-xs uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                                    <span className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-emerald-400' : 'bg-cyan-400'}`}></span>
                                    {isSpeaking ? 'بث صوتي مباشر (Streaming)' : isListening ? 'الاستماع نشط' : 'الظل الصوتي'}
                                </span>
                                <button
                                    onClick={() => {
                                        handleStopSpeech();
                                        setTranscript('');
                                        setStreamingReply('');
                                        setMatchedCommand(null);
                                    }}
                                    className="p-1.5 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* User speech transcript or AI response */}
                            {isListening ? (
                                <p className="text-white font-extrabold text-sm leading-relaxed min-h-[40px]">
                                    {transcript || 'تكلم الآن...'}
                                </p>
                            ) : (
                                <p className="text-white font-bold text-sm leading-relaxed min-h-[40px]">
                                    {streamingReply || transcript || matchedCommand || 'جاهز للاستماع...'}
                                </p>
                            )}

                            {/* Soundwave representation (Mic input or Streaming Audio output) */}
                            {(isListening || isSpeaking) && (
                                <div className="flex gap-1 justify-center py-2">
                                    {[...Array(8)].map((_, i) => (
                                        <div
                                            key={i}
                                            className={`w-1 rounded-full transition-all duration-75 ${isSpeaking ? 'bg-emerald-400' : 'bg-cyan-400'}`}
                                            style={{
                                                height: `${Math.max(4, (Math.max(audioLevel, isSpeaking ? 0.35 : 0.1) * 35) * (i % 2 === 0 ? 0.8 : 1.3))}px`,
                                            }}
                                        />
                                    ))}
                                </div>
                            )}

                            {matchedCommand && !isSpeaking && (
                                <div className="mt-1 p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-emerald-400 text-xs font-bold">
                                    <Check className="w-4 h-4 shrink-0" />
                                    <span>تم التوجيه: {matchedCommand}</span>
                                </div>
                            )}

                            {isSpeaking && (
                                <button
                                    onClick={handleStopSpeech}
                                    className="w-full py-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                                >
                                    <VolumeX className="w-3.5 h-3.5" /> إيقاف الصوت
                                </button>
                            )}

                            {isListening && (
                                <button
                                    onClick={stopListening}
                                    className="w-full py-2.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                                >
                                    <Square className="w-3.5 h-3.5" /> إلغاء الأمر الصوتي
                                </button>
                            )}

                            {/* Mini hints on dragging */}
                            <div className="text-[10px] text-white/30 text-center mt-0.5">
                                اسحب المايك لأي مكان بالجهة التي تريحك
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main Microphone Button */}
                <div className="flex flex-col items-center gap-1.5">
                    <motion.button
                        onClick={isSpeaking ? handleStopSpeech : isListening ? stopListening : startListening}
                        animate={isListening ? {
                            boxShadow: [
                                "0 0 20px rgba(6,182,212,0.4)",
                                "0 0 45px rgba(6,182,212,0.8)",
                                "0 0 20px rgba(6,182,212,0.4)"
                            ]
                        } : isSpeaking ? {
                            boxShadow: [
                                "0 0 20px rgba(16,185,129,0.4)",
                                "0 0 45px rgba(16,185,129,0.8)",
                                "0 0 20px rgba(16,185,129,0.4)"
                            ]
                        } : {
                            y: [0, -3, 0]
                        }}
                        style={{
                            scale: isListening ? 1.1 + (audioLevel * 0.4) : isSpeaking ? 1.05 + (audioLevel * 0.2) : 1
                        }}
                        transition={(isListening || isSpeaking) ? {
                            boxShadow: {
                                duration: 1.2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }
                        } : {
                            y: {
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }
                        }}
                        className={`w-11 h-11 rounded-full flex items-center justify-center shadow-2xl relative transition-all duration-300 ${
                            isListening
                                ? 'bg-cyan-500 text-black border-2 border-cyan-300'
                                : isSpeaking
                                ? 'bg-emerald-500 text-black border-2 border-emerald-300'
                                : 'bg-[#0a0a0a]/90 hover:bg-cyan-950/20 text-cyan-400 border border-cyan-500/40 hover:border-cyan-400'
                        }`}
                        title="التحكم الصوتي المباشر (اسحبني)"
                    >
                        {isSpeaking ? (
                            <Volume2 className="w-5 h-5 animate-pulse" />
                        ) : (
                            <Mic className="w-5 h-5" />
                        )}

                        {/* Ripples when listening or speaking */}
                        {isListening && (
                            <>
                                <span className="absolute inset-0 rounded-full bg-cyan-400/30 animate-ping" />
                                <span className="absolute -inset-2 rounded-full border border-cyan-400/30 animate-pulse" />
                            </>
                        )}
                        {isSpeaking && (
                            <>
                                <span className="absolute inset-0 rounded-full bg-emerald-400/30 animate-ping" />
                                <span className="absolute -inset-2 rounded-full border border-emerald-400/30 animate-pulse" />
                            </>
                        )}
                    </motion.button>

                    {/* Help trigger */}
                    <button
                        onClick={() => setShowHelp(!showHelp)}
                        className="p-1 bg-black/60 hover:bg-black/90 text-white/50 hover:text-white rounded-full border border-white/5 transition-all text-xs flex items-center gap-1 scale-90"
                    >
                        <HelpCircle className="w-3 h-3" />
                        <span className="text-[9px] font-bold">الأوامر</span>
                    </button>
                </div>
            </motion.div>

            {/* Help cheatsheet panel */}
            <AnimatePresence>
                {showHelp && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6 font-['Cairo'] text-right"
                        dir="rtl"
                    >
                        <div className="bg-[#080808] border border-cyan-500/20 w-full max-w-xl rounded-[32px] p-6 md:p-8 relative shadow-2xl max-h-[85vh] flex flex-col">
                            <button
                                onClick={() => setShowHelp(false)}
                                className="absolute top-6 left-6 p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
                            >
                                <X className="w-5 h-5 text-white/50" />
                            </button>

                            <div className="flex items-center gap-3 text-cyan-400 mb-6">
                                <Command className="w-8 h-8" />
                                <div>
                                    <h3 className="text-xl font-black text-white">التحكم الصوتي بالظل</h3>
                                    <p className="text-white/50 text-xs">الأوامر المدعومة باللغتين العربية والإنجليزية</p>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-hide">
                                {commands.map((cmd) => (
                                    <div
                                        key={cmd.id}
                                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl flex items-center justify-between transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-cyan-950/40 rounded-xl border border-cyan-500/20">
                                                {cmd.icon}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-white">{cmd.label}</h4>
                                                <p className="text-white/40 text-[11px] font-medium mt-0.5">{cmd.sublabel}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <span className="text-[10px] font-mono bg-cyan-500/15 border border-cyan-500/25 text-cyan-300 px-2 py-0.5 rounded-full font-bold">
                                                Active
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 pt-4 border-t border-white/5 text-center">
                                <p className="text-xs text-white/40">انقر على المايك الصغير، وقول الأمر الصوتي وسينفذه الظل فوراً!</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Render Deep Settings system overlay */}
            {showSettings && (
                <NativeSettings onClose={() => setShowSettings(false)} />
            )}
        </>
    );
};
