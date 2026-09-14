import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Rewind, FastForward, Gauge, Waves, Loader2 } from 'lucide-react';

interface InlineVoicePlayerProps {
    base64Pcm?: string;
    onEnded: () => void;
    isActive?: boolean;
    isLoading?: boolean;
    onPlay?: () => void;
}

const pcmBase64ToWavUrl = async (base64: string) => {
    // If it's already a data or blob URL, return as-is
    if (base64.startsWith('data:') || base64.startsWith('blob:') || base64.startsWith('http://') || base64.startsWith('https://')) return base64;
    
    // Otherwise assume it's raw 16-bit PCM at 24000 Hz from Gemini
    try {
        let u8: Uint8Array;
        try {
            const res = await fetch(`data:application/octet-stream;base64,${base64}`);
            const buffer = await res.arrayBuffer();
            u8 = new Uint8Array(buffer);
        } catch (e) {
            const byteCharacters = atob(base64);
            u8 = new Uint8Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                u8[i] = byteCharacters.charCodeAt(i);
            }
        }
        
        const dataBytes = u8.length % 2 === 0 ? u8.length : u8.length - 1;
        const u8Even = new Uint8Array(u8.buffer, 0, dataBytes);
        const bufferWav = new ArrayBuffer(44 + dataBytes);
        const view = new DataView(bufferWav);
        
        const setUint16 = (pos: number, data: number) => view.setUint16(pos, data, true);
        const setUint32 = (pos: number, data: number) => view.setUint32(pos, data, true);
        
        setUint32(0, 0x46464952); setUint32(4, 36 + dataBytes); setUint32(8, 0x45564157);
        setUint32(12, 0x20746d66); setUint32(16, 16); setUint16(20, 1); setUint16(22, 1);
        setUint32(24, 24000); setUint32(28, 24000 * 2); setUint16(32, 2); setUint16(34, 16);
        setUint32(36, 0x61746164); setUint32(40, dataBytes);
        new Uint8Array(bufferWav, 44).set(u8Even);
        
        const blob = new Blob([bufferWav], { type: 'audio/wav' });
        return URL.createObjectURL(blob);
    } catch(e) {
        console.error("Failed to convert audio", e);
        return "";
    }
};

export const InlineVoicePlayer: React.FC<InlineVoicePlayerProps> = ({ base64Pcm, onEnded, isActive, isLoading, onPlay }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [audioUrl, setAudioUrl] = useState("");
    
    // Abstract wave heights for visualization
    const [waves] = useState(() => Array.from({ length: 30 }, () => Math.random() * 0.8 + 0.2));

    useEffect(() => {
        let isMounted = true;
        let urlResult = "";
        
        const loadWav = async () => {
            if (!base64Pcm) {
                setAudioUrl("");
                return;
            }
            const url = await pcmBase64ToWavUrl(base64Pcm);
            if (isMounted) {
                urlResult = url;
                setAudioUrl(url);
            }
        };
        loadWav();
        
        return () => {
            isMounted = false;
            if (urlResult.startsWith('blob:')) URL.revokeObjectURL(urlResult);
        }
    }, [base64Pcm]);

    useEffect(() => {
        if (isActive && audioUrl && audioRef.current && !isPlaying) {
            setupAudioContext();
            audioRef.current.play().then(() => {
                setIsPlaying(true);
                startAnalyzing();
                if (onPlay) onPlay();
            }).catch(e => console.log("Auto-play prevented", e));
        } else if (!isActive && audioRef.current && isPlaying) {
            audioRef.current.pause();
            stopAnalyzing();
            setIsPlaying(false);
        }
    }, [isActive, isPlaying, audioUrl]);

    const analyzerRef = useRef<AnalyserNode | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    const startAnalyzing = () => {
        const updateLevel = () => {
            if (!isPlaying && audioRef.current?.paused) return;
            
            let normalizedLevel = 0;
            
            // If analyzer works, use it
            if (analyzerRef.current) {
                const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
                analyzerRef.current.getByteFrequencyData(dataArray);
                let sum = 0;
                for(let i = 0; i < dataArray.length; i++) sum += dataArray[i];
                normalizedLevel = Math.min(1, (sum / dataArray.length) / 128);
            }
            
            // Fallback for CORS-tainted audio or disabled analyzer (fake lip-sync)
            if (normalizedLevel === 0 && !audioRef.current?.paused) {
                normalizedLevel = 0.15 + (Math.random() * 0.4);
            }
            
            window.dispatchEvent(new CustomEvent('shadow_audio_level', { detail: { level: normalizedLevel } }));
            animationFrameRef.current = requestAnimationFrame(updateLevel);
        };
        
        updateLevel();
    };

    const setupAudioContext = () => {
        // Try creating standard AudioContext but if it fails or mutes (due to CORS), we'll rely on the fallback in startAnalyzing
        // Note: For external files, creating a MediaElementSource steals the audio and mutes it output if tainted.
        // We will NOT use MediaElementSource for any HTTP URLs to ensure native playback ALWAYS works.
        if (audioUrl.startsWith('http://') || audioUrl.startsWith('https://')) {
             return; // Skip Web Audio API for external URLs completely
        }

        if (!audioRef.current || audioContextRef.current) return;
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioContextRef.current = ctx;
            const source = ctx.createMediaElementSource(audioRef.current);
            sourceRef.current = source;
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            analyzerRef.current = analyser;
            
            source.connect(analyser);
            analyser.connect(ctx.destination);
        } catch (e) {
            console.error("Audio context setup failed:", e);
        }
    };

    const stopAnalyzing = () => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        window.dispatchEvent(new CustomEvent('shadow_audio_level', { detail: { level: 0 } }));
    };

    const togglePlay = () => {
        if (!audioUrl) {
            if (onPlay) onPlay();
            return;
        }
        if (!audioRef.current) return;
        
        if (isPlaying) {
            audioRef.current.pause();
            stopAnalyzing();
            setIsPlaying(false);
            if (isActive) onEnded(); // treat pressing pause as ending the external playback session
        } else {
            setupAudioContext();
            if (audioContextRef.current?.state === 'suspended') {
                audioContextRef.current.resume();
            }
            audioRef.current.play().then(() => {
                setIsPlaying(true);
                startAnalyzing();
                if (onPlay) onPlay();
            }).catch(e => console.log("Play failed", e));
        }
    };

    useEffect(() => {
        return () => {
            stopAnalyzing();
            if (audioContextRef.current) {
                audioContextRef.current.close().catch(e => {});
            }
        };
    }, []);

    const handleTimeUpdate = () => {
        if (!audioRef.current) return;
        setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100 || 0);
    };

    const handleLoadedMetadata = () => {
        if (!audioRef.current) return;
        setDuration(audioRef.current.duration);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!audioRef.current) return;
        const value = Number(e.target.value);
        audioRef.current.currentTime = (value / 100) * audioRef.current.duration;
        setProgress(value);
    };

    const handleSpeedChange = () => {
        if (!audioRef.current) return;
        let newRate = 1;
        if (playbackRate === 1) newRate = 1.5;
        else if (playbackRate === 1.5) newRate = 2;
        else newRate = 1;
        audioRef.current.playbackRate = newRate;
        setPlaybackRate(newRate);
    };

    const skipForward = () => {
        if (!audioRef.current) return;
        audioRef.current.currentTime = Math.min(audioRef.current.duration, audioRef.current.currentTime + 5);
    };

    const skipBackward = () => {
        if (!audioRef.current) return;
        audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 5);
    };

    const formatTime = (time: number) => {
        if (isNaN(time) || !isFinite(time)) return "0:00";
        const m = Math.floor(time / 60);
        const s = Math.floor(time % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const currentTime = audioRef.current?.currentTime || 0;

    const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();
        togglePlay();
    };

    return (
        <div className="flex flex-col gap-2 mt-3 bg-black/40 border border-white/10 rounded-xl p-3 shadow-inner" dir="ltr">
            {audioUrl && (
                <audio 
                    ref={audioRef} 
                    src={audioUrl || undefined} 
                    onTimeUpdate={handleTimeUpdate} 
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={() => { setIsPlaying(false); setProgress(0); onEnded(); }}
                    className="hidden" 
                />
            )}
            
            <div className="flex items-center gap-3">
                <button 
                    onClick={handleInteraction} 
                    onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); togglePlay(); }}
                    className={`w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center hover:bg-blue-500/30 transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] shrink-0 ${isLoading ? 'opacity-80' : ''}`}
                >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />)}
                </button>
                
                <div className="flex-1 flex flex-col gap-1">
                    {/* Visual Waves & scrubber */}
                    <div className="relative h-6 flex items-center group cursor-pointer w-full">
                        <div className="absolute inset-0 flex items-center gap-0.5 pointer-events-none">
                            {waves.map((h, i) => {
                                const waveProgress = (i / waves.length) * 100;
                                const isPassed = waveProgress <= progress;
                                return (
                                    <div 
                                        key={i} 
                                        className={`flex-1 rounded-full transition-all duration-150 ${isPassed ? 'bg-blue-400' : 'bg-white/20'}`}
                                        style={{ height: `${h * 100}%` }}
                                    ></div>
                                );
                            })}
                        </div>
                        <input 
                            type="range" 
                            min="0" max="100" 
                            value={isNaN(progress) ? 0 : progress} 
                            onChange={handleSeek} 
                            className="absolute inset-0 w-full opacity-0 cursor-pointer"
                        />
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center">
                    <button onClick={handleSpeedChange} className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded font-mono text-[10px] text-white/80 transition-all whitespace-nowrap">
                        {playbackRate}x
                    </button>
                </div>
            </div>

            <div className="flex items-center justify-between mt-1 px-1">
                <span className="text-[10px] text-white/50 font-mono">{formatTime(currentTime)}</span>
                
                <div className="flex gap-4">
                    <button onClick={skipBackward} className="text-white/40 hover:text-white transition-all"><Rewind className="w-3 h-3" /></button>
                    <button onClick={skipForward} className="text-white/40 hover:text-white transition-all"><FastForward className="w-3 h-3" /></button>
                </div>

                <span className="text-[10px] text-white/50 font-mono">{formatTime(duration)}</span>
            </div>
        </div>
    );
};
