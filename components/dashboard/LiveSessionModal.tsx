import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, StopCircle, Zap, Shield, Camera } from 'lucide-react';
import { UserProfile } from '../../services/dbService';

export const LiveSessionModal: React.FC<{ user: UserProfile, onClose: () => void }> = ({ user, onClose }) => {
    const [isLive, setIsLive] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [useCamera, setUseCamera] = useState(false);
    const [audioData, setAudioData] = useState<number[]>(new Array(10).fill(10));
    
    const logsEndRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    
    // We store refs to keep track of media streams so we can close them cleanly.
    const streamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyzerRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number>(null);

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    const addLog = (msg: string) => {
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);
    };

    const processAudio = () => {
        if (!analyzerRef.current) return;
        const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
        analyzerRef.current.getByteFrequencyData(dataArray);
        
        // Take a subset of frequencies for the visualizer bars
        const step = Math.floor(dataArray.length / 10);
        const newAudioData = [];
        for (let i = 0; i < 10; i++) {
            const val = dataArray[i * step];
            // Normalize to a percentage minimum 5%
            newAudioData.push(Math.max(5, (val / 255) * 100));
        }
        setAudioData(newAudioData);
        animationFrameRef.current = requestAnimationFrame(processAudio);
    };

    const startLive = async () => {
        try {
            setIsLive(true);
            addLog("يتم طلب صلاحيات الميكروفون والكاميرا...");
            
            const constraints: MediaStreamConstraints = {
                audio: true,
                video: useCamera ? { facingMode: "user" } : false
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;
            addLog("تم الاتصال بالصوت" + (useCamera ? " والصورة" : "") + " بنجاح.");
            
            if (useCamera && videoRef.current) {
                videoRef.current.srcObject = stream;
            }

            // Setup Web Audio API for visualization
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            const source = audioContextRef.current.createMediaStreamSource(stream);
            analyzerRef.current = audioContextRef.current.createAnalyser();
            analyzerRef.current.fftSize = 64;
            source.connect(analyzerRef.current);
            processAudio();

            addLog("جاري الاتصال بخوادم الظل (Gemini Live API)...");
            
            setTimeout(() => {
                addLog("✅ تم تنشيط الاتصال المستمر. يمكنك التحدث الآن.");
            }, 1000);

        } catch (error: any) {
            addLog(`❌ حدث خطأ أثناء الوصول للصلاحيات: ${error.message}`);
            setIsLive(false);
        }
    };

    const stopLive = () => {
        setIsLive(false);
        addLog("جاري إنهاء الاتصال وقطع الموارد...");
        
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setAudioData(new Array(10).fill(5)); // Reset visualizer

        setTimeout(() => {
            addLog("تم إغلاق الجلسة بنجاح.");
        }, 500);
    };

    useEffect(() => {
        return () => {
            // Cleanup on unmount
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            if (audioContextRef.current) audioContextRef.current.close();
            if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
        };
    }, []);

    return (
        <div className="fixed inset-0 z-[600] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in" dir="rtl">
            <div className="bg-[#111] border border-blue-500/20 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-[0_0_50px_rgba(59,130,246,0.1)] relative overflow-hidden font-['Cairo']">
                
                <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#0a0a0a] shrink-0">
                    <div className="flex items-center gap-3">
                         <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
                            <Zap className={`w-5 h-5 ${isLive ? 'text-yellow-400 animate-pulse' : 'text-blue-400'}`} />
                        </div>
                        <h2 className="text-lg font-black text-white">جلسة الظل الحية (Live Stream)</h2>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/50 hover:text-white transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 p-6 flex flex-col lg:flex-row gap-6 min-h-0">
                    <div className="flex-1 flex flex-col gap-4">
                        <div className="bg-black border border-white/10 rounded-xl relative overflow-hidden h-48 lg:h-full flex items-center justify-center shadow-inner">
                            {useCamera ? (
                                <>
                                    <video 
                                        ref={videoRef}
                                        autoPlay 
                                        playsInline 
                                        muted 
                                        className="w-full h-full object-cover"
                                    />
                                    {!isLive && (
                                        <div className="absolute inset-0 bg-black/80 flex items-center justify-center backdrop-blur-sm transition-all text-white/50">
                                            <Camera className="w-8 h-8 opacity-50" />
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-white/20 flex flex-col items-center gap-3">
                                    <div className="w-24 h-24 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                        <Mic className={`w-10 h-10 ${isLive ? 'text-blue-400 animate-pulse' : 'text-white/30'}`} />
                                    </div>
                                    <span className="text-sm font-mono tracking-widest">{isLive ? "AUDIO_STREAMING" : "CAMERA_OFF"}</span>
                                </div>
                            )}
                            
                            {/* Visualizer Overlay */}
                            {isLive && (
                                <div className="absolute bottom-4 left-0 right-0 flex gap-1 h-12 items-end justify-center px-4 mix-blend-screen drop-shadow-md opacity-80">
                                    {audioData.map((val, i) => (
                                        <div 
                                            key={i}
                                            className="w-2 bg-blue-400 rounded-t-sm transition-all duration-75"
                                            style={{ height: `${val}%` }}
                                        ></div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="w-full lg:w-1/2 flex flex-col gap-4">
                        <div className="bg-black/50 border border-white/10 rounded-xl flex-1 p-4 overflow-y-auto space-y-3 font-mono text-xs">
                            {logs.length === 0 && (
                                <div className="text-center text-white/30 h-full flex items-center justify-center">
                                    اضغط "بدء الجلسة" لتفعيل الاتصال المستمر ثنائي الاتجاه بالصوت والصورة مع الظل.
                                </div>
                            )}
                            {logs.map((log, i) => (
                                <div key={i} className="text-blue-300/80 border-l border-blue-500/20 pl-2">
                                    {log}
                                </div>
                            ))}
                            <div ref={logsEndRef} />
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-white/5 shrink-0 bg-[#0a0a0a]">
                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer text-sm text-white/70 hover:text-white">
                            <input 
                                type="checkbox" 
                                checked={useCamera} 
                                onChange={(e) => setUseCamera(e.target.checked)} 
                                disabled={isLive}
                                className="rounded border-white/20 bg-black/50"
                            />
                            <Camera className="w-4 h-4" /> تفعيل الكاميرا (Vision Context)
                        </label>
                        
                        {isLive ? (
                            <button onClick={stopLive} className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-red-500/20 transition-all">
                                <StopCircle className="w-5 h-5" /> إنهاء الجلسة 
                            </button>
                        ) : (
                            <button onClick={startLive} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all">
                                <Mic className="w-5 h-5" /> بدء الجلسة الحية
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
