import React, { useState, useEffect, useRef } from 'react';
import { Mic, X, Waves, Video, VideoOff, Monitor, StopCircle, RefreshCw, Eye, Camera, Upload, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { useAppStore } from '../services/store';
import { getShadowResponse } from '../services/geminiService';
import { playShadowVoice, stopVoice, resumeAudioContext } from '../services/speechService';
import { localBrain } from '../services/localBrainService';

export const LiveAPIMode: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { user } = useAppStore();
    const [isScreenShared, setIsScreenShared] = useState(false);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
    const [status, setStatus] = useState('جارِ تهيئة المحادثة الحية (Gemini 3.8 Flash)...');
    const [isActive, setIsActive] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [botReply, setBotReply] = useState('');
    const [audioWaveform, setAudioWaveform] = useState<number[]>([15, 25, 45, 30, 20]);
    const [isAnalyzingVision, setIsAnalyzingVision] = useState(false);
    const [cameraNotice, setCameraNotice] = useState<string | null>(null);
    const [isOfflineEngine, setIsOfflineEngine] = useState(false);

    const recognitionRef = useRef<any>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const videoStreamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const snapshotInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setStatus('المحادثة الحية نشطة ⚡ (جاهز للاستماع)');
            startListening();
        }, 1000);

        // Listen to shadow_audio_level dispatched by playShadowVoice
        const handleAudioLevel = (e: any) => {
            const lvl = e.detail?.level || 0;
            if (lvl > 0) {
                const scaled = Math.min(32, Math.max(6, lvl * 35));
                setAudioWaveform([scaled * 0.6, scaled * 0.9, scaled * 1.2, scaled * 0.8, scaled * 0.5]);
            }
        };
        window.addEventListener('shadow_audio_level', handleAudioLevel);

        return () => {
            clearTimeout(timer);
            stopListening();
            stopVoice();
            window.removeEventListener('shadow_audio_level', handleAudioLevel);

            if (videoStreamRef.current) {
                videoStreamRef.current.getTracks().forEach(t => t.stop());
                videoStreamRef.current = null;
            }
            if (audioContextRef.current) {
                audioContextRef.current.close().catch(() => {});
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

    // Ensure camera stream binds to video element as soon as stream or ref updates
    useEffect(() => {
        if (isCameraActive && videoStreamRef.current && videoRef.current) {
            videoRef.current.srcObject = videoStreamRef.current;
            videoRef.current.play().catch(e => console.warn("Video playback error:", e));
        }
    }, [isCameraActive]);

    // Setup visual audio meter using microphone
    const setupAudioMeter = async () => {
        try {
            if (!navigator.mediaDevices?.getUserMedia) return;
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioCtx();
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 32;
            const source = ctx.createMediaStreamSource(stream);
            source.connect(analyser);

            audioContextRef.current = ctx;
            analyserRef.current = analyser;

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const updateWave = () => {
                if (!analyserRef.current) return;
                analyserRef.current.getByteFrequencyData(dataArray);
                const bars = [
                    Math.max(8, (dataArray[1] || 0) * 0.35),
                    Math.max(12, (dataArray[3] || 0) * 0.55),
                    Math.max(20, (dataArray[5] || 0) * 0.75),
                    Math.max(14, (dataArray[7] || 0) * 0.55),
                    Math.max(10, (dataArray[9] || 0) * 0.35)
                ];
                setAudioWaveform(bars);
                animationFrameRef.current = requestAnimationFrame(updateWave);
            };
            updateWave();
        } catch (e) {
            console.warn("Audio meter setup skipped or denied", e);
        }
    };

    const startListening = () => {
        setIsActive(true);
        setupAudioMeter();

        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            const recognition = new SpeechRec();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'ar-EG';

            recognition.onresult = (event: any) => {
                // BARGE-IN INTERRUPTION: If user speaks while bot is speaking, abort playback immediately!
                if (status === 'الظل يتحدث... 🎙️') {
                    stopVoice();
                    setStatus('المحادثة الحية نشطة ⚡ (جاهز للاستماع)');
                }

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
                if (recognitionRef.current && status !== "الظل يفكر... 🧠" && status !== "الظل يتحدث... 🎙️") {
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

    // Capture visual snapshot from camera canvas
    const captureCurrentCameraFrame = (): string | null => {
        if (!isCameraActive || !videoRef.current || videoRef.current.videoWidth === 0) return null;
        try {
            const canvas = document.createElement('canvas');
            canvas.width = Math.min(640, videoRef.current.videoWidth);
            canvas.height = Math.min(480, videoRef.current.videoHeight);
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                return dataUrl.split(',')[1] || null;
            }
        } catch (e) {
            console.warn("Failed capturing frame from video", e);
        }
        return null;
    };

    const handleFinalTranscript = async (text: string, manualBase64Image?: string) => {
        if (!text.trim() && !manualBase64Image) return;
        setTranscript(text || 'فحص بصري للصورة');
        setStatus("الظل يفكر... 🧠");
        
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        
        try {
            // Check if camera is on or image is provided
            const cameraFrameBase64 = manualBase64Image || captureCurrentCameraFrame();
            if (cameraFrameBase64) {
                setIsAnalyzingVision(true);
            }

            // Offline model mode
            if (isOfflineEngine) {
                const offlineResponse = await localBrain.generateResponse(text);
                setIsAnalyzingVision(false);
                setBotReply(offlineResponse);
                await speak(offlineResponse);
                return;
            }

            const cameraContextNotice = cameraFrameBase64 
                ? `\n[رؤية الكاميرا المباشرة]: المرفق هو صورة ملتقطة الآن مباشرة من كاميرا المستخدم الحية. علّق على ما يظهره لك أو ما يراه في الكاميرا فوراً وبشكل طبيعي جداً.` 
                : '';

            const promptContext = `[LIVE_VOICE_SESSION]:
أنت الآن في جلسة محادثة صوتية تفاعلية حية وفورية مع الماستر (${user?.name || 'تيتو'}).
المستخدم قال لك بصوته الآن: "${text}"${cameraContextNotice}
قواعد الرد الفوري:
1. الرد قصير جداً ومباشر وذكي في جملة أو جملتين سريعتين (1-2 sentences maximum) لتستمر المحادثة بسلاسة وبدون خطابات طويلة.
2. اللهجة: مصرية عامية أصيلة، ودودة، واثقة، وذكية كابنه البار وتوأمه الرقمي.
3. التزم بالنطق البشري الطبيعي، بدون رموز تعبيرية معقدة في الكلام الصوتي.`;

            const extraPayload = cameraFrameBase64 ? {
                data: cameraFrameBase64,
                mimeType: 'image/jpeg',
                imageBase64: cameraFrameBase64
            } : undefined;

            const res = await getShadowResponse([], promptContext, extraPayload, user);
            const reply = res.text || "تمام يا ماستر، سامعك وشايفك كويس جداً.";
            
            setIsAnalyzingVision(false);
            setBotReply(reply);
            await speak(reply);
        } catch(e: any) {
            setIsAnalyzingVision(false);
            setBotReply("معاك يا ماستر، حصل تشويش بسيط، قول تاني؟");
            setStatus("المحادثة الحية نشطة ⚡ (جاهز للاستماع)");
            if (recognitionRef.current && isActive) {
                try { recognitionRef.current.start(); } catch(e) {}
            }
        }
    };

    // Play human neural Egyptian voice (using playShadowVoice from speechService)
    const speak = async (text: string) => {
        setStatus("الظل يتحدث... 🎙️");
        resumeAudioContext();
        
        try {
            const voicePref = user?.voicePreference === 'female' ? 'female' : 'male';
            await playShadowVoice(text, voicePref, undefined, () => {
                 setStatus("المحادثة الحية نشطة ⚡ (جاهز للاستماع)");
                 if (recognitionRef.current && isActive) {
                     try { recognitionRef.current.start(); } catch(e) {}
                 }
            });
        } catch (e) {
            console.warn("Human voice playback error", e);
            setStatus("المحادثة الحية نشطة ⚡ (جاهز للاستماع)");
            if (recognitionRef.current && isActive) {
                try { recognitionRef.current.start(); } catch(e) {}
            }
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

    // Robust Camera Activation with Cascade Fallback
    const toggleCamera = async () => {
        if (!isCameraActive) {
            setCameraNotice(null);
            let stream: MediaStream | null = null;

            // Tier 1: Try with preferred facingMode and resolution
            try {
                if (navigator.mediaDevices?.getUserMedia) {
                    stream = await navigator.mediaDevices.getUserMedia({ 
                        video: { 
                            facingMode: cameraFacing,
                            width: { ideal: 640 },
                            height: { ideal: 480 }
                        } 
                    });
                }
            } catch (e1) {
                console.warn("Camera constraint facingMode failed, trying basic video: true", e1);
                // Tier 2: Fallback to basic unconstrained video
                try {
                    if (navigator.mediaDevices?.getUserMedia) {
                        stream = await navigator.mediaDevices.getUserMedia({ video: true });
                    }
                } catch (e2) {
                    console.warn("All direct camera access failed or blocked by iframe permissions", e2);
                }
            }

            if (stream) {
                videoStreamRef.current = stream;
                setIsCameraActive(true);
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play().catch(() => {});
                }
            } else {
                setCameraNotice("تم تقييد إذن الكاميرا من المتصفح أو بيئة العرض. يمكنك رفع لقطة أو مشاركة الشاشة للرؤية الفورية.");
            }
        } else {
            if (videoStreamRef.current) {
                videoStreamRef.current.getTracks().forEach(t => t.stop());
                videoStreamRef.current = null;
            }
            setIsCameraActive(false);
            setCameraNotice(null);
        }
    };

    const flipCamera = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const nextFacing = cameraFacing === 'user' ? 'environment' : 'user';
        setCameraFacing(nextFacing);
        if (videoStreamRef.current) {
            videoStreamRef.current.getTracks().forEach(t => t.stop());
            videoStreamRef.current = null;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: nextFacing, width: { ideal: 640 }, height: { ideal: 480 } }
            });
            videoStreamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play().catch(() => {});
            }
        } catch (err) {
            console.warn("Camera flip failed, trying basic video", err);
            try {
                const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
                videoStreamRef.current = fallbackStream;
                if (videoRef.current) {
                    videoRef.current.srcObject = fallbackStream;
                    videoRef.current.play().catch(() => {});
                }
            } catch {}
        }
    };

    // Trigger instant visual inspection of whatever is in front of the camera
    const triggerInstantVisionAnalysis = () => {
        const frame = captureCurrentCameraFrame();
        if (frame) {
            handleFinalTranscript("بص على اللي ظاهر في الكاميرا وقولي شايف إيه بالتفصيل؟", frame);
        } else {
            setCameraNotice("تأكد من تشغيل الكاميرا أولاً لالتقاط المشهد.");
        }
    };

    // Direct Image Upload for Vision
    const handleSnapshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result as string;
            if (result) {
                const b64 = result.split(',')[1];
                handleFinalTranscript("حلل لي الصورة دي يا ظل وقولي رأيك فيها:", b64);
            }
        };
        reader.readAsDataURL(file);
    };

    const quickChips = [
        "📊 شارت وتحليل البيتكوين",
        "👁️ بص في الكاميرا وقولي رأيك",
        "⚡ إحاطة بالمهام المعلقة",
        "💡 فكرة بيزنس جديدة"
    ];

    return (
        <div className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-between p-6 animate-in fade-in zoom-in font-['Cairo']">
            {/* Top Bar */}
            <div className="w-full flex items-center justify-between z-20">
                <button onClick={onClose} className="p-3 bg-white/5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors border border-white/10">
                    <X className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-2">
                    {/* Toggle Online / Offline Mode */}
                    <button
                        onClick={() => setIsOfflineEngine(!isOfflineEngine)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border transition-all ${isOfflineEngine ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}
                        title="التبديل بين سحابة Gemini 3.8 Flash ونموذج Google Gemma المحلي (أوفلاين)"
                    >
                        {isOfflineEngine ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
                        <span>{isOfflineEngine ? 'أوفلاين (Gemma 2B)' : 'سحابي (3.8 Flash)'}</span>
                    </button>

                    <div className="px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-full font-bold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                        <div className={`w-2 h-2 rounded-full ${status.includes('يتحدث') ? 'bg-fuchsia-400 animate-ping' : status.includes('يفكر') ? 'bg-amber-400 animate-spin' : 'bg-cyan-400 animate-pulse'}`}></div>
                        <span>{status}</span>
                    </div>
                </div>
            </div>

            {/* Notification Banner if Camera is blocked */}
            {cameraNotice && (
                <div className="w-full max-w-md bg-amber-950/80 border border-amber-500/40 rounded-xl p-3 flex items-start gap-2.5 text-amber-200 text-xs my-2 z-30 shadow-lg">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p>{cameraNotice}</p>
                        <div className="flex items-center gap-2 mt-2">
                            <button
                                onClick={() => snapshotInputRef.current?.click()}
                                className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-md font-bold text-[11px] flex items-center gap-1"
                            >
                                <Upload className="w-3 h-3" />
                                <span>رفع لقطة للرؤية</span>
                            </button>
                            <button
                                onClick={() => setCameraNotice(null)}
                                className="text-white/50 hover:text-white text-[11px]"
                            >
                                إغلاق
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden Input for Manual Snapshot Upload */}
            <input 
                type="file" 
                ref={snapshotInputRef} 
                accept="image/*" 
                capture="environment" 
                className="hidden" 
                onChange={handleSnapshotUpload} 
            />

            {/* Video Picture-in-Picture Preview when Camera Active */}
            {isCameraActive && (
                <div className="absolute top-20 right-6 w-48 h-64 rounded-2xl overflow-hidden border-2 border-cyan-400/80 shadow-[0_0_30px_rgba(6,182,212,0.4)] z-30 bg-black flex flex-col">
                    <video 
                        ref={(el) => {
                            videoRef.current = el;
                            if (el && videoStreamRef.current && el.srcObject !== videoStreamRef.current) {
                                el.srcObject = videoStreamRef.current;
                                el.play().catch(() => {});
                            }
                        }} 
                        autoPlay 
                        playsInline 
                        muted 
                        className={`w-full h-full object-cover ${cameraFacing === 'user' ? 'scale-x-[-1]' : ''}`} 
                    />
                    <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
                        <span className="flex items-center gap-1 text-[9px] bg-red-600 text-white font-bold px-2 py-0.5 rounded-full shadow animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-white"></span> LIVE
                        </span>
                        <button
                            onClick={flipCamera}
                            className="p-1.5 rounded-full bg-black/70 hover:bg-black text-white text-[10px] transition-all"
                            title="تبديل الكاميرا (أمامية / خلفية)"
                        >
                            <RefreshCw className="w-3 h-3 text-cyan-400" />
                        </button>
                    </div>

                    {isAnalyzingVision && (
                        <div className="absolute inset-0 bg-cyan-950/70 backdrop-blur-xs flex flex-col items-center justify-center gap-1 z-20">
                            <Eye className="w-6 h-6 text-cyan-400 animate-pulse" />
                            <span className="text-[10px] text-cyan-300 font-bold font-mono">الظل يحلل الرؤية...</span>
                        </div>
                    )}

                    <div className="absolute bottom-2 left-2 right-2 flex flex-col gap-1 z-10">
                        <button
                            onClick={triggerInstantVisionAnalysis}
                            className="w-full py-1 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-[10px] rounded-lg shadow flex items-center justify-center gap-1 transition-all"
                        >
                            <Eye className="w-3 h-3" />
                            <span>افحص اللقطة الحالية</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Central Animated Orb */}
            <div className="relative my-auto flex flex-col items-center justify-center">
                <div className={`w-56 h-56 rounded-full blur-3xl absolute inset-0 transition-all duration-700 ${status.includes('يتحدث') ? 'bg-fuchsia-500/30 scale-125' : status.includes('يفكر') ? 'bg-amber-500/30 scale-110' : 'bg-cyan-500/20'}`}></div>
                
                <div className={`w-52 h-52 rounded-full flex flex-col items-center justify-center bg-black/60 backdrop-blur-xl relative z-10 border-2 transition-all duration-500 ${status.includes('يتحدث') ? 'border-fuchsia-400 scale-105 shadow-[0_0_100px_rgba(217,70,239,0.5)]' : status.includes('يفكر') ? 'border-amber-400 shadow-[0_0_60px_rgba(251,191,36,0.3)]' : 'border-cyan-500/50 shadow-[0_0_80px_rgba(6,182,212,0.3)]'}`}>
                    <Waves className={`w-16 h-16 transition-all duration-300 ${status.includes('يتحدث') ? 'text-fuchsia-400 animate-pulse scale-110' : status.includes('يفكر') ? 'text-amber-400 animate-spin' : 'text-cyan-400'}`} />
                    <span className="text-white font-black mt-2 tracking-widest text-lg">الـظّـل</span>
                    <span className="text-[9px] text-cyan-300/80 font-mono flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span> صوت بشري مصري طبيعي
                    </span>

                    {/* Dynamic Waveform Bars */}
                    <div className="flex items-center gap-1.5 mt-3 h-8">
                        {audioWaveform.map((h, idx) => (
                            <div 
                                key={idx} 
                                className={`w-1.5 rounded-full transition-all duration-75 ${status.includes('يتحدث') ? 'bg-fuchsia-400' : 'bg-cyan-400'}`} 
                                style={{ height: `${Math.min(32, Math.max(6, h))}px` }} 
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Subtitles & Captions */}
            <div className="text-center w-full max-w-xl px-4 flex flex-col items-center justify-center min-h-[90px]">
                {botReply ? (
                    <div className="text-xl md:text-2xl font-bold text-fuchsia-300 tracking-wide mb-2 leading-relaxed" dir="rtl">
                        "{botReply}"
                    </div>
                ) : (
                    <div className="text-white/50 text-sm leading-relaxed" dir="rtl">
                        تحدث بطبيعتك، الصوت بشري مصري طبيعي، والكاميرا ترسل المشهد للرؤية المباشرة. قاطع الظل في أي وقت (Barge-in)! ⚡
                    </div>
                )}
                
                {transcript && (
                    <div className="text-cyan-400/90 text-sm font-medium italic mt-2" dir="rtl">
                        أنت: "{transcript}"
                    </div>
                )}
            </div>

            {/* Quick Interactive Chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-md my-4">
                {quickChips.map((chip, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleFinalTranscript(chip)}
                        className="px-3 py-1.5 bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/40 rounded-full text-xs text-white/70 hover:text-cyan-300 transition-all font-medium"
                    >
                        {chip}
                    </button>
                ))}
            </div>

            {/* Controls Row */}
            <div className="flex items-center gap-5 mb-4 z-20">
                {/* Screen Share */}
                <button 
                    onClick={toggleScreenShare}
                    className={`p-4 rounded-full border shadow-xl transition-all ${isScreenShared ? 'bg-purple-600 border-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.5)]' : 'bg-[#121212] border-white/10 text-white/50 hover:bg-white/10'}`}
                    title="مشاركة الشاشة للتحليل البصري"
                >
                    <Monitor className="w-6 h-6" />
                </button>

                {/* Upload / Snapshot */}
                <button 
                    onClick={() => snapshotInputRef.current?.click()}
                    className="p-4 rounded-full border border-white/10 bg-[#121212] text-white/70 hover:text-white hover:bg-white/10 shadow-xl transition-all"
                    title="رفع صورة أو لقطة للرؤية"
                >
                    <Camera className="w-6 h-6" />
                </button>

                {/* Mic Listen */}
                <button 
                    onClick={isActive ? stopListening : startListening}
                    className={`p-6 rounded-full text-white shadow-2xl border transition-all ${isActive ? 'bg-cyan-600 border-cyan-400 shadow-[0_0_40px_rgba(6,182,212,0.6)] animate-pulse' : 'bg-red-600 border-red-500 hover:bg-red-500'}`}
                    title={isActive ? 'إيقاف الاستماع' : 'بدء الاستماع'}
                >
                    {isActive ? <Mic className="w-8 h-8" /> : <StopCircle className="w-8 h-8" />}
                </button>

                {/* Camera Toggle */}
                <button 
                    onClick={toggleCamera}
                    className={`p-4 rounded-full border shadow-xl transition-all ${isCameraActive ? 'bg-emerald-600 border-emerald-500 text-white shadow-[0_0_25px_rgba(16,185,129,0.5)]' : 'bg-[#121212] border-white/10 text-white/50 hover:bg-white/10'}`}
                    title={isCameraActive ? 'إغلاق الكاميرا' : 'تشغيل الكاميرا الحية للرؤية'}
                >
                    {isCameraActive ? <Video className="w-6 h-6 text-white" /> : <VideoOff className="w-6 h-6" />}
                </button>
            </div>
        </div>
    );
};
