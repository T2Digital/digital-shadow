import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mic, Camera, Monitor, MessageSquare, Video, X, Loader2, Maximize, Send, Paperclip } from 'lucide-react';
import { getShadowResponse, playShadowVoice, stopVoice, resumeAudioContext, analyzeMediaForArchive } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { ShadowFace } from './ShadowFace';
import { shadowDB, DBMessage } from '../services/dbService';

interface FloatingShadowAvatarProps {
    user: any;
    onNavigateChat: () => void;
    hide?: boolean;
}

export const FloatingShadowAvatar: React.FC<FloatingShadowAvatarProps> = React.memo(({ user, onNavigateChat, hide }) => {
    const [tapCount, setTapCount] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [mode, setMode] = useState<'idle' | 'recording' | 'vision' | 'camera' | 'thinking' | 'speaking'>('idle');
    const [currentAction, setCurrentAction] = useState<string>('');
    const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
    const [isFrontCamera, setIsFrontCamera] = useState(true);
    
    const clickTimeout = useRef<NodeJS.Timeout | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const recognitionRef = useRef<any>(null);
    const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    const [isCapturingVideo, setIsCapturingVideo] = useState(false);
    const videoAskMode = useRef(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const videoChunksRef = useRef<Blob[]>([]);
    const submitAudioRef = useRef<(() => void) | null>(null);

    const [pendingMedia, setPendingMedia] = useState<{type: 'image' | 'video' | 'audio', data: string, mimeType: string, url: string} | null>(null);

    const [isRadialMenuOpen, setIsRadialMenuOpen] = useState(false);
    const pressTimer = useRef<NodeJS.Timeout | null>(null);
    const singleClickTimer = useRef<NodeJS.Timeout | null>(null);
    const clickCount = useRef(0);
    const isLongPress = useRef(false);
    const isPointerDown = useRef(false);
    const isDragging = useRef(false);

    const navigate = useNavigate();
    const location = useLocation();

    const [showQuickInput, setShowQuickInput] = useState(false);
    const [quickInputText, setQuickInputText] = useState('');

    useEffect(() => {
        if (videoRef.current && mediaStream) {
            videoRef.current.srcObject = mediaStream;
        }
    }, [mediaStream, mode]);

    const stopAllModes = () => {
        submitAudioRef.current = null;
        if (mediaStream) {
            mediaStream.getTracks().forEach(t => t.stop());
            setMediaStream(null);
        }
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch(e){}
        }
        if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = null;
        }
        stopVoice();
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        setIsCapturingVideo(false);
        setIsRadialMenuOpen(false);
        setMode('idle');
        setCurrentAction('');
        setShowQuickInput(false);
        setQuickInputText('');
        setPendingMedia(null);
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        isPointerDown.current = true;
        isLongPress.current = false;
        
        if (singleClickTimer.current) {
            clearTimeout(singleClickTimer.current);
            singleClickTimer.current = null;
        }

        if (mode === 'camera') {
            pressTimer.current = setTimeout(() => {
                if (isPointerDown.current) {
                    isLongPress.current = true;
                    if (clickCount.current === 0) {
                        capturePhoto(true);
                    } else if (clickCount.current === 1) {
                        toggleVideoRecording(true);
                    }
                    clickCount.current = 0;
                }
            }, 600);
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        isPointerDown.current = false;
        if (pressTimer.current) clearTimeout(pressTimer.current);

        if (isDragging.current) {
            return;
        }

        if (mode !== 'idle' && mode !== 'camera' && mode !== 'vision' && mode !== 'recording') {
            return;
        }

        if (mode === 'camera') {
            if (isLongPress.current) {
                isLongPress.current = false;
                return;
            }
            clickCount.current += 1;
            
            singleClickTimer.current = setTimeout(() => {
                if (clickCount.current === 1) {
                    capturePhoto(false);
                } else if (clickCount.current === 2) {
                    toggleVideoRecording(false);
                } else if (clickCount.current >= 3) {
                    setIsFrontCamera(!isFrontCamera);
                    startCamera(!isFrontCamera);
                }
                clickCount.current = 0;
            }, 300);
            return;
        }

        if (mode === 'idle') {
            clickCount.current += 1;
            singleClickTimer.current = setTimeout(() => {
                if (clickCount.current === 1 || clickCount.current === 2) {
                    setIsAnimating(true);
                    setTimeout(() => setIsAnimating(false), 200);
                    setIsRadialMenuOpen(prev => !prev);
                } else if (clickCount.current === 3) {
                    setIsRadialMenuOpen(false);
                    startVision();
                } else if (clickCount.current >= 4) {
                    setIsRadialMenuOpen(false);
                    startCamera(false);
                }
                clickCount.current = 0;
            }, 350);
            return;
        }

        if (mode === 'recording') {
            if (submitAudioRef.current) {
                submitAudioRef.current();
                submitAudioRef.current = null;
            } else {
                stopAllModes();
            }
            return;
        }

        // For non-camera modes like vision
        if (mode === 'vision') {
            stopAllModes();
            return;
        }
    };

    const saveMediaToWorkspace = async (type: 'image' | 'video', url: string, base64: string) => {
        setCurrentAction('جاري التحليل والأرشفة...');
        
        let title = `${type === 'image' ? 'Photo' : 'Video'}_${Date.now()}`;
        let summary = `التقاط ${type === 'image' ? 'صورة' : 'فيديو'} من الكاميرا`;
        let tags: string[] = [];

        try {
            const aiData = await analyzeMediaForArchive(base64, type === 'image' ? 'image/jpeg' : 'video/webm');
            if (aiData && aiData.title) title = aiData.title;
            if (aiData && aiData.summary) summary = aiData.summary;
            if (aiData && aiData.keywords) tags = aiData.keywords;
        } catch(err) {
            console.error("AI Analysis failed:", err);
        }

        await shadowDB.createFSItem({
            userId: user.email || 'GUEST',
            parentId: null,
            name: `${title.replace(/ /g, '_')}.${type === 'image' ? 'jpg' : 'webm'}`,
            type: type,
            content: url, // For local DB, url or base64 can be stored depending on the viewer.
            l0_summary: summary,
            l1_metadata: tags.join(' | '),
            l2_content: url,
            createdAt: Date.now()
        });
        
        setCurrentAction('تم الحفظ في مساحة العمل');
        setTimeout(() => { if (mode === 'camera') setCurrentAction('عيون المايسترو (اضغط للتبديل)'); else setCurrentAction(''); }, 2000);
    };

    const capturePhoto = (ask: boolean) => {
        if (!videoRef.current) return;
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg');
        const base64Data = dataUrl.split(',')[1];
        
        if (ask) {
            setPendingMedia({ type: 'image', data: base64Data, mimeType: 'image/jpeg', url: dataUrl });
            setQuickInputText('');
            setShowQuickInput(true);
            setMode('idle'); // Change mode so the quick input shows up
        } else {
            saveMediaToWorkspace('image', dataUrl, base64Data);
        }
    };

    const toggleVideoRecording = (ask: boolean) => {
        if (isCapturingVideo) {
            // Stop recording
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }
            setIsCapturingVideo(false);
            if (ask) {
                // Wait for onstop
                videoAskMode.current = true;
            } else {
                videoAskMode.current = false;
            }
        } else {
            // Start recording
            if (!mediaStream) return;
            videoChunksRef.current = [];
            const recorder = new MediaRecorder(mediaStream, { mimeType: 'video/webm' });
            recorder.ondataavailable = e => { if (e.data.size > 0) videoChunksRef.current.push(e.data); };
            recorder.onstop = () => {
                const blob = new Blob(videoChunksRef.current, { type: 'video/webm' });
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = () => {
                    const dataUrl = reader.result as string;
                    const base64Data = dataUrl.split(',')[1];
                    if (videoAskMode.current) {
                        setPendingMedia({ type: 'video', data: base64Data, mimeType: 'video/webm', url: dataUrl });
                        setQuickInputText('');
                        setShowQuickInput(true);
                        setMode('idle');
                    } else {
                        saveMediaToWorkspace('video', dataUrl, base64Data);
                    }
                };
            };
            recorder.start(100);
            mediaRecorderRef.current = recorder;
            setIsCapturingVideo(true);
            videoAskMode.current = ask;
            setCurrentAction('جاري تسجيل فيديو... (اضغط لمستين للإيقاف)');
        }
    };

    const processInteraction = async (text: string, playAudioReply: boolean = true, extraData?: {data: string, mimeType: string, type: 'audio'|'image'|'video'}) => {
        const hasContent = text.trim() || extraData;
        if (!hasContent) {
            setCurrentAction('مفيش حاجة اتهيألي');
            setTimeout(stopAllModes, 2000);
            return;
        }

        setMode('thinking');
        setCurrentAction('جاري التفكير...');
        setShowQuickInput(false);

        try {
            const isAudio = extraData?.type === 'audio';
            const userMsg: DBMessage = {
                id: Date.now(),
                role: 'user',
                text: isAudio && !text.trim() ? 'رسالة صوتية 🎤' : (text || 'صورة مرفقة 🖼️'),
                timestamp: Date.now(),
                userId: user.email || 'GUEST',
                voiceData: isAudio ? `data:${extraData.mimeType};base64,${extraData.data}` : undefined,
                image: extraData?.type === 'image' ? `data:${extraData.mimeType};base64,${extraData.data}` : undefined,
            };
            await shadowDB.saveMessage(userMsg);
            window.dispatchEvent(new CustomEvent('shadow_new_message', { detail: userMsg }));

            const response = await getShadowResponse([], text, extraData, user);
            
            const modelMsg: DBMessage = {
                id: Date.now(),
                role: 'model',
                text: response.text,
                timestamp: Date.now(),
                userId: user.email || 'GUEST',
            };
            await shadowDB.saveMessage(modelMsg);
            window.dispatchEvent(new CustomEvent('shadow_new_message', { detail: modelMsg }));

            if (playAudioReply && response.text) {
                setMode('speaking');
                setCurrentAction('المايسترو بيتكلم...');
                await playShadowVoice(response.text, user.voicePreference || 'male', undefined, stopAllModes);
            } else {
                stopAllModes();
                setCurrentAction('رديت جوه الشات 😎');
                setTimeout(() => setCurrentAction(''), 3000);
            }
        } catch(err) {
            setCurrentAction('حصلت مشكلة!');
            console.error(err);
            setTimeout(stopAllModes, 2000);
        }
    };

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleQuickSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const hasContent = quickInputText.trim() || selectedFile || pendingMedia;
        if (hasContent) {
            
            let extra = undefined;
            if (pendingMedia) {
                extra = {
                    data: pendingMedia.data,
                    mimeType: pendingMedia.mimeType,
                    type: pendingMedia.type === 'video' ? 'video' : 'image'
                } as any;
            }

            // Include file handling logic if selectedFile exists
            processInteraction(quickInputText || 'شوف دي كده', true, extra);
            
            setQuickInputText('');
            setSelectedFile(null);
            setPendingMedia(null);
            setShowQuickInput(false);
        }
    };

    const startRecording = async () => {
        setMode('recording');
        setCurrentAction('المايسترو بيسمعك... (اضغط للإرسال)');
        try {
            await resumeAudioContext();
            
            // Audio Blob Recording Setup
            let recorder: MediaRecorder | null = null;
            let audioChunks: Blob[] = [];
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            if (mediaStream) mediaStream.getTracks().forEach(t => t.stop());
            setMediaStream(stream);

            recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            recorder.ondataavailable = e => { if (e.data.size > 0) audioChunks.push(e.data); };
            recorder.start(100);

            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            
            let finalAccumulated = '';
            let isProcessed = false;

            const submitInteraction = (text: string) => {
                if (isProcessed) return;
                isProcessed = true;
                if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
                
                if (recorder && recorder.state !== 'inactive') {
                    recorder.stop();
                }
                setTimeout(() => {
                    stream.getTracks().forEach(t => t.stop());
                    if (audioChunks.length > 0) {
                        const blob = new Blob(audioChunks, { type: 'audio/webm' });
                        const reader = new FileReader();
                        reader.readAsDataURL(blob);
                        reader.onloadend = () => {
                            const base64data = (reader.result as string).split(',')[1];
                            processInteraction(text, true, { data: base64data, mimeType: 'audio/webm', type: 'audio' });
                        };
                    } else {
                        processInteraction(text);
                    }
                }, 200);
            };

            submitAudioRef.current = () => {
                submitInteraction(finalAccumulated);
            };

            if (SpeechRecognition) {
                const rec = new SpeechRecognition();
                rec.lang = 'ar-EG';
                rec.continuous = true;
                rec.interimResults = true;
                recognitionRef.current = rec;

                rec.onresult = (e: any) => {
                    let interim = '';
                    for (let i = e.resultIndex; i < e.results.length; ++i) {
                        if (e.results[i].isFinal) {
                            finalAccumulated += e.results[i][0].transcript + ' ';
                        } else {
                            interim += e.results[i][0].transcript;
                        }
                    }
                    const currentText = (finalAccumulated + interim).trim();
                    
                    if (currentText.length > 20) {
                        setCurrentAction('... ' + currentText.substring(currentText.length - 20));
                    } else {
                        setCurrentAction('بيسمعك: ' + currentText);
                    }
                };

                rec.onend = () => {
                    if (!isProcessed && submitAudioRef.current) {
                        try { rec.start(); } catch(e){} // Keep listening until explicitly stopped
                    }
                };

                rec.start();
            } else {
                // If no speech recognition, just record until manual stop
            }
        } catch(e) {
            setCurrentAction('تم رفض المايك!');
            setTimeout(stopAllModes, 2000);
        }
    };

    const startCamera = async (front: boolean = true) => {
        setMode('camera');
        setCurrentAction('عيون المايسترو (اضغط للتبديل)');
        try {
            if (mediaStream) mediaStream.getTracks().forEach(t => t.stop());
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: front ? 'user' : 'environment' },
                audio: false
            });
            setMediaStream(stream);
        } catch(e) {
            setCurrentAction('مش قادر افتح الكاميرا!');
            setTimeout(stopAllModes, 2000);
        }
    };

    const startVision = async () => {
        setMode('vision');
        setCurrentAction('تحليل الشاشة...');
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
            setMediaStream(stream);
        } catch(e) {
            setCurrentAction('تم إلغاء الشاشة');
            setTimeout(stopAllModes, 2000);
        }
    };

    const radialItems = [
        { id: 'chat', label: 'شات', icon: <MessageSquare className="w-5 h-5"/>, color: 'text-blue-400', bg: 'hover:bg-blue-500/20', shadow: 'hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]', action: () => { setShowQuickInput(true); setIsRadialMenuOpen(false); } },
        { id: 'mic', label: 'صوت', icon: <Mic className="w-5 h-5"/>, color: 'text-red-400', bg: 'hover:bg-red-500/20', shadow: 'hover:shadow-[0_0_20px_rgba(239,68,68,0.5)]', action: () => { startRecording(); setIsRadialMenuOpen(false); } },
        { id: 'camera', label: 'كاميرا', icon: <Camera className="w-5 h-5"/>, color: 'text-purple-400', bg: 'hover:bg-purple-500/20', shadow: 'hover:shadow-[0_0_20px_rgba(168,85,247,0.5)]', action: () => { startCamera(false); setIsRadialMenuOpen(false); } },
        { id: 'vision', label: 'شاشة', icon: <Monitor className="w-5 h-5"/>, color: 'text-green-400', bg: 'hover:bg-green-500/20', shadow: 'hover:shadow-[0_0_20px_rgba(34,197,94,0.5)]', action: () => { startVision(); setIsRadialMenuOpen(false); } },
    ];

    // Do not show widget if explicitly hidden or inside chat page as a fallback
    if (hide || !user || location.pathname === '/chat' || location.pathname.startsWith('/chat/')) return null;

    let shadowFaceStatus: 'idle' | 'listening' | 'speaking' | 'thinking' = 'idle';
    if (mode === 'recording') shadowFaceStatus = 'listening';
    if (mode === 'thinking') shadowFaceStatus = 'thinking';
    if (mode === 'speaking') shadowFaceStatus = 'speaking';

    return (
        <>
        <motion.div 
            drag 
            dragMomentum={false}
            onDragStart={() => { isDragging.current = true; }}
            onDragEnd={() => { setTimeout(() => { isDragging.current = false; }, 50); }}
            style={{ touchAction: 'none', bottom: '130px', left: 'calc(50% - 36px)' }}
            initial={{ x: 0, y: 0 }}
            className="fixed z-[9999] flex flex-col items-center font-['Cairo'] no-canvas-pan"
        >
            {/* Live Media Overlay */}
            {(mode === 'camera' || mode === 'vision') && mediaStream && (
                <div className="absolute bottom-[90px] left-0 w-48 h-64 bg-black rounded-3xl border-2 border-purple-500 overflow-hidden shadow-[0_0_40px_rgba(168,85,247,0.5)] animate-in slide-in-from-bottom-5">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    <button onClick={stopAllModes} className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-red-500">
                        <X className="w-4 h-4" />
                    </button>
                    {isCapturingVideo && (
                        <button onClick={(e) => { e.stopPropagation(); toggleVideoRecording(false); }} className="absolute bottom-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-red-600 shadow-md text-white rounded-full text-xs animate-pulse">
                            انهاء الفيديو
                        </button>
                    )}
                    {mode === 'camera' && !isCapturingVideo && (
                        <div className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-white/70 font-bold drop-shadow-md px-1">
                            لمسة: صورة | 2 لمسة: فيديو<br/>لمسة طويلة: سؤال
                        </div>
                    )}
                </div>
            )}

            {currentAction && (
                <div className={`mb-3 flex items-center justify-between gap-3 text-xs font-bold px-4 py-2 rounded-full border shadow-lg backdrop-blur-xl animate-in fade-in ${mode === 'recording' || mode === 'speaking' || isCapturingVideo ? 'bg-red-900/60 border-red-500 text-red-200 shadow-[0_0_20px_rgba(248,113,113,0.4)]' : 'bg-black/80 border-cyan-500 text-cyan-200'}`}>
                    <span className="max-w-[120px] truncate">{currentAction}</span>
                    {mode !== 'idle' && mode !== 'thinking' && mode !== 'speaking' && (
                        <button onClick={(e) => { e.stopPropagation(); stopAllModes(); }} className="text-white/50 hover:text-white bg-white/10 rounded-full p-1">
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </div>
            )}
            
            <div className="relative w-[72px] h-[72px]">
                <div 
                    onPointerDown={handlePointerDown}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    className={`absolute inset-0 group rounded-full flex items-center justify-center transition-all duration-300 ${isAnimating ? 'scale-90' : 'scale-100'} shadow-[0_0_35px_rgba(168,85,247,0.4)] overflow-hidden cursor-move`}
                >
                    {/* Active radar ping effect */}
                    <div className={`absolute inset-0 rounded-full border ${mode === 'recording' ? 'border-red-500 bg-red-500/10 animate-ping opacity-30' : isRadialMenuOpen ? 'border-blue-500 bg-blue-500/20 animate-pulse opacity-50' : 'border-purple-500 opacity-20'}`}></div>
                    
                    {/* Rotating ring */}
                    <div className={`absolute inset-[-10%] rounded-full border-t-2 ${mode === 'recording' ? 'border-red-400' : 'border-purple-300'} opacity-50 ${mode !== 'idle' ? 'animate-[spin_2s_linear_infinite]' : ''}`}></div>
                    
                    <ShadowFace 
                        appStatus={shadowFaceStatus}
                        size="small"
                        className="!w-full !h-full rounded-full !border-0 !shadow-none !bg-transparent scale-125"
                    />
                    
                    <div className={`absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full border-2 border-black z-20 ${mode === 'recording' ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                </div>
                
                {/* Radial Menu */}
                <AnimatePresence>
                    {isRadialMenuOpen && mode === 'idle' && (
                        <>
                            {/* Backdrop overlay to close menu if clicked outside (but since it's floating, just clicking the avatar closes it, or any other action) */}
                            {radialItems.map((item, index) => {
                                // Elegant diagonal cross arrangement around the avatar
                                const angles = [-45, -135, 135, 45]; // Top-right, Top-left, Bottom-left, Bottom-right
                                const radius = 80; // Distance from center
                                const rad = angles[index] * (Math.PI / 180);
                                const x = Math.cos(rad) * radius;
                                const y = Math.sin(rad) * radius;

                                return (
                                    <motion.button
                                        key={item.id}
                                        initial={{ opacity: 0, scale: 0.5, x: 0, y: 0, rotate: -45 }}
                                        animate={{ opacity: 1, scale: 1, x, y, rotate: 0 }}
                                        exit={{ opacity: 0, scale: 0.5, x: 0, y: 0, rotate: 45 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 15, delay: index * 0.08 }}
                                        onClick={(e) => { e.stopPropagation(); item.action(); }}
                                        onPointerDown={(e) => e.stopPropagation()} // Prevent dragging the avatar when clicking items
                                        className={`absolute top-1/2 left-1/2 -mt-7 -ml-7 w-14 h-14 rounded-full flex flex-col items-center justify-center border border-white/20 backdrop-blur-2xl bg-black/40 transition-all duration-300 ${item.color} ${item.bg} ${item.shadow} z-10 group/item hover:border-white/50 hover:scale-110 shadow-2xl overflow-hidden`}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-500"></div>
                                        {item.icon}
                                        {/* Label tooltip purely visual */}
                                        <div className="absolute -bottom-8 opacity-0 group-hover/item:opacity-100 transition-all duration-300 bg-black/90 text-[11px] font-bold tracking-wider text-white px-3 py-1 rounded-full border border-white/20 whitespace-nowrap shadow-lg translate-y-2 group-hover/item:translate-y-0">
                                            {item.label}
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </>
                    )}
                </AnimatePresence>

                {/* Floating tooltips */}
                {mode === 'idle' && !currentAction && !isRadialMenuOpen && (
                    <div className="absolute left-[85px] top-1/2 -translate-y-1/2 w-[180px] opacity-0 group-hover:opacity-100 transition-all pointer-events-none text-right">
                        <div className="bg-black/80 backdrop-blur-md border border-white/10 p-3 rounded-2xl text-[10px] text-white/80 leading-relaxed shadow-xl">
                            <span className="block font-bold text-purple-400 mb-1">المايسترو معاك:</span>
                            • اضغط لفتح القائمة السحرية<br/>
                            • اسحبني لتحريكي<br/>
                            <span className="text-white/50 text-[8px] mt-1 block">(يوجد اختصارات داخل الكاميرا)</span>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
            {/* Quick Input Popup moved outside motion.div */}
            {showQuickInput && mode === 'idle' && (
                <div className="fixed bottom-24 right-6 w-80 max-w-[calc(100vw-32px)] bg-black/80 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-2 flex flex-col gap-2 shadow-[0_0_30px_rgba(168,85,247,0.3)] animate-in slide-in-from-bottom-5 z-[99999]" onPointerDown={(e) => e.stopPropagation()}>
                    {pendingMedia && (
                        <div className="relative w-full h-32 rounded-lg overflow-hidden border border-purple-500/30">
                            {pendingMedia.type === 'video' ? (
                                <video src={pendingMedia.url || undefined} className="w-full h-full object-cover" controls />
                            ) : (
                                <img src={pendingMedia.url || undefined} className="w-full h-full object-cover" />
                            )}
                            <button onClick={() => setPendingMedia(null)} className="absolute top-1 right-1 p-1 bg-black/50 rounded-full hover:bg-black/80 text-white">
                                <X className="w-3 h-3"/>
                            </button>
                        </div>
                    )}
                    {selectedFile && !pendingMedia && (
                        <div className="flex items-center justify-between bg-purple-900/30 px-3 py-1.5 rounded-lg border border-purple-500/20 mx-1 mt-1">
                            <span className="text-xs text-purple-200 truncate pr-4">{selectedFile.name}</span>
                            <button onClick={() => setSelectedFile(null)} className="text-purple-300 hover:text-white">
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    setSelectedFile(e.target.files[0]);
                                }
                            }}
                        />
                        <button onClick={() => fileInputRef.current?.click()} type="button" className="p-2 text-white/50 hover:text-purple-400 bg-white/5 rounded-xl transition-colors">
                            <Paperclip className="w-5 h-5" />
                        </button>
                        <form onSubmit={handleQuickSubmit} className="flex-1 flex gap-2">
                            <input 
                                type="text" 
                                value={quickInputText}
                                onChange={(e) => setQuickInputText(e.target.value)}
                                placeholder="أسأل المايسترو..."
                                className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/30"
                                autoFocus
                            />
                            <button type="submit" disabled={!quickInputText.trim() && !selectedFile} className="p-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl transition-colors">
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
});
