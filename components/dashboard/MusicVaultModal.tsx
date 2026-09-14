import React, { useState, useEffect, useRef } from 'react';
import { Music, X, Trash2, Play, Pause, Download, Share2, Loader2, Music4, Disc, Sparkles } from 'lucide-react';
import { shadowDB, DBFSItem } from '../../services/dbService';

interface TrackMetadata {
    title: string;
    prompt: string;
    timestamp: number;
    lyrics?: string;
    genre?: string;
}

export const MusicVaultModal: React.FC<{ user: { email: string }, onClose: () => void }> = ({ user, onClose }) => {
    const [tracks, setTracks] = useState<DBFSItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [playingId, setPlayingId] = useState<string | number | null>(null);
    const [currentAudioBase64, setCurrentAudioBase64] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [loadingTrackId, setLoadingTrackId] = useState<string | number | null>(null);
    
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);

    const loadTracks = async () => {
        setIsLoading(true);
        try {
            const allItems = await shadowDB.getFSItemsByUserId(user.email || 'GUEST');
            const audioItems = allItems.filter(item => item.type === 'audio');
            // Sort by creation date descending
            audioItems.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            setTracks(audioItems);
        } catch (e) {
            console.error("Failed to load tracks from DB", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadTracks();
    }, [user.email]);

    const handlePlayPause = async (track: DBFSItem) => {
        if (playingId === track.id) {
            if (isPlaying) {
                audioRef.current?.pause();
                setIsPlaying(false);
            } else {
                audioRef.current?.play().catch(e => console.error(e));
                setIsPlaying(true);
            }
        } else {
            // Stop current playback
            if (audioRef.current) {
                audioRef.current.pause();
                setIsPlaying(false);
            }
            
            setLoadingTrackId(track.id);
            try {
                const base64 = await shadowDB.getAudioSegment(String(track.id));
                if (base64) {
                    setCurrentAudioBase64(base64);
                    setPlayingId(track.id);
                    setIsPlaying(true);
                    
                    // Small timeout to allow state / audio src to bind
                    setTimeout(() => {
                        if (audioRef.current) {
                            audioRef.current.play().catch(err => {
                                console.error("Error playing audio:", err);
                            });
                        }
                    }, 100);
                } else {
                    alert("عذراً، لم نتمكن من استعادة ملف الصوت.");
                }
            } catch (err) {
                console.error("Failed to get audio segment:", err);
            } finally {
                setLoadingTrackId(null);
            }
        }
    };

    const handleDelete = async (trackId: string | number) => {
        if (!confirm("هل أنت متأكد من رغبتك في حذف هذه الأغنية من الخزنة؟")) return;
        
        try {
            if (playingId === trackId) {
                audioRef.current?.pause();
                setIsPlaying(false);
                setPlayingId(null);
                setCurrentAudioBase64(null);
            }
            await shadowDB.deleteFSItem(trackId, user.email || 'GUEST');
            // IDB uses deleteFSItem, let's also ensure audio segment is cleaned up
            setTracks(prev => prev.filter(t => t.id !== trackId));
        } catch (e) {
            console.error("Failed to delete track", e);
            alert("فشل حذف الأغنية.");
        }
    };

    const handleShare = (track: DBFSItem) => {
        let metadata: TrackMetadata = { title: "مقطع صوتي", prompt: "", timestamp: Date.now() };
        try {
            if (track.l1_metadata) {
                metadata = JSON.parse(track.l1_metadata);
            }
        } catch (e) {}

        const text = encodeURIComponent(`اسمع الأغنية دي اللي أنتجتها بالذكاء الاصطناعي مع الظل الرقمي (Digital Shadow)!\nالعنوان: ${metadata.title}\nالنوع: ${metadata.genre || 'موسيقى ظلية'}\n🔥🎵`);
        const whatsappUrl = `https://wa.me/?text=${text}`;
        window.open(whatsappUrl, '_blank');
    };

    // Audio event handlers
    const onTimeUpdate = () => {
        if (!audioRef.current) return;
        const cur = audioRef.current.currentTime;
        const dur = audioRef.current.duration || 0;
        setCurrentTime(cur);
        setProgress(dur > 0 ? (cur / dur) * 100 : 0);
    };

    const onLoadedMetadata = () => {
        if (!audioRef.current) return;
        setDuration(audioRef.current.duration || 0);
    };

    const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!audioRef.current || !duration) return;
        const newProgress = parseFloat(e.target.value);
        const newTime = (newProgress / 100) * duration;
        audioRef.current.currentTime = newTime;
        setProgress(newProgress);
        setCurrentTime(newTime);
    };

    const formatTime = (time: number) => {
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <div className="fixed inset-0 z-[600] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in font-['Cairo']" dir="rtl">
            <div className="bg-[#111] border border-fuchsia-500/20 rounded-2xl w-full max-w-3xl h-[85vh] flex flex-col shadow-[0_0_50px_rgba(217,70,239,0.1)] relative overflow-hidden">
                
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#0a0a0a]">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-fuchsia-500/20 rounded-xl border border-fuchsia-500/30 shadow-[0_0_15px_rgba(217,70,239,0.2)]">
                            <Music className="w-6 h-6 text-fuchsia-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white">ألبوم الأغاني والموسيقى</h2>
                            <p className="text-[10px] text-fuchsia-300 font-mono tracking-widest uppercase mt-1 flex items-center gap-1">
                                <Sparkles className="w-3 h-3 animate-pulse" /> AI Generated Music Studio Vault
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/50 hover:text-white transition-all">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full text-white/30 gap-3">
                            <Loader2 className="w-10 h-10 animate-spin text-fuchsia-400" />
                            <p className="text-sm font-bold">جاري استرجاع أرشيف الموسيقى الخاص بك...</p>
                        </div>
                    ) : tracks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-white/30 gap-4 text-center">
                            <Disc className="w-16 h-16 opacity-30 text-fuchsia-400 animate-spin-slow" />
                            <div>
                                <p className="text-base font-bold text-white/80">خزنة الأغاني فارغة حالياً</p>
                                <p className="text-xs text-white/40 mt-1 max-w-sm leading-relaxed">
                                    تستطيع طلب تأليف وتلحين الأغاني من "الموسيقار" في الشات، أو الذهاب إلى قسم AI Music Studio لصناعة مقاطعك الأولى وحفظها هنا.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {tracks.map((track) => {
                                let metadata: TrackMetadata = { title: "مقطع صوتي غير معروف", prompt: "", timestamp: Date.now() };
                                try {
                                    if (track.l1_metadata) {
                                        metadata = JSON.parse(track.l1_metadata);
                                    }
                                } catch (e) {}

                                const isCurrentPlaying = playingId === track.id;
                                const isCurrentLoading = loadingTrackId === track.id;

                                return (
                                    <div key={track.id} className={`bg-[#151515] border ${isCurrentPlaying ? 'border-fuchsia-500/40 bg-fuchsia-950/10' : 'border-white/5'} hover:border-white/10 rounded-2xl p-5 flex flex-col gap-4 transition-all relative overflow-hidden group`}>
                                        {/* Disc graphic on the side */}
                                        <div className="absolute left-4 top-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                                            <Disc className={`w-24 h-24 text-fuchsia-400 ${isCurrentPlaying && isPlaying ? 'animate-spin-slow' : ''}`} />
                                        </div>

                                        <div className="flex gap-4 items-start relative z-10">
                                            {/* Play/Pause Button */}
                                            <button 
                                                onClick={() => handlePlayPause(track)} 
                                                disabled={isCurrentLoading}
                                                className={`p-4 rounded-full ${isCurrentPlaying && isPlaying ? 'bg-fuchsia-600 hover:bg-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.4)]' : 'bg-[#222] hover:bg-[#333] border border-white/10'} text-white transition-all transform hover:scale-105 shrink-0 flex items-center justify-center`}
                                            >
                                                {isCurrentLoading ? (
                                                    <Loader2 className="w-6 h-6 animate-spin text-fuchsia-400" />
                                                ) : isCurrentPlaying && isPlaying ? (
                                                    <Pause className="w-6 h-6 fill-white" />
                                                ) : (
                                                    <Play className="w-6 h-6 fill-white mr-1" />
                                                )}
                                            </button>

                                            {/* Details */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-white text-base truncate">{metadata.title}</h3>
                                                    {metadata.genre && (
                                                        <span className="bg-fuchsia-500/10 text-fuchsia-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-fuchsia-500/20">
                                                            {metadata.genre}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-white/50 mt-1 line-clamp-2 leading-relaxed" title={metadata.prompt}>
                                                    {metadata.prompt || "مقطع صوتي مؤلف بالذكاء الاصطناعي."}
                                                </p>
                                                <div className="text-[10px] text-white/30 font-mono mt-2">
                                                    {new Date(track.createdAt || metadata.timestamp).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                </div>
                                            </div>

                                            {/* Top Corner Action Controls */}
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button 
                                                    onClick={() => handleShare(track)}
                                                    className="p-2 bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-400 text-white/40 rounded-xl transition-all"
                                                    title="مشاركة عبر واتساب"
                                                >
                                                    <Share2 className="w-4.5 h-4.5" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(track.id)}
                                                    className="p-2 bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-white/40 rounded-xl transition-all"
                                                    title="حذف"
                                                >
                                                    <Trash2 className="w-4.5 h-4.5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Player Panel (Active track only) */}
                                        {isCurrentPlaying && currentAudioBase64 && (
                                            <div className="bg-black/40 p-4 rounded-xl border border-white/5 mt-2 flex flex-col gap-3">
                                                <div className="flex items-center gap-3 text-xs font-mono text-white/60">
                                                    <span className="w-10 text-right">{formatTime(currentTime)}</span>
                                                    <input 
                                                        type="range" 
                                                        min="0" 
                                                        max="100" 
                                                        value={progress} 
                                                        onChange={handleProgressChange}
                                                        className="flex-1 accent-fuchsia-500 h-1 rounded-lg cursor-pointer bg-white/10" 
                                                    />
                                                    <span className="w-10 text-left">{formatTime(duration)}</span>
                                                </div>
                                                
                                                {/* Actions */}
                                                <div className="flex items-center justify-between mt-1">
                                                    {/* Download link */}
                                                    <a 
                                                        href={`data:audio/wav;base64,${currentAudioBase64}`}
                                                        download={`AI_Track_${metadata.title.replace(/\s+/g, '_')}.wav`}
                                                        className="flex items-center gap-1.5 text-xs text-fuchsia-400 hover:text-fuchsia-300 font-bold bg-fuchsia-500/10 hover:bg-fuchsia-500/20 px-3 py-1.5 rounded-lg border border-fuchsia-500/20 transition-all"
                                                    >
                                                        <Download className="w-3.5 h-3.5" /> تحميل الملف للرأس
                                                    </a>

                                                    <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                                                        <Music4 className="w-3.5 h-3.5 text-fuchsia-400" /> جاري تشغيل التوزيع
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Collapsible Lyrics view */}
                                        {metadata.lyrics && (
                                            <div className="border-t border-white/5 pt-3 mt-1">
                                                <details className="group">
                                                    <summary className="text-xs font-bold text-white/40 hover:text-white/60 cursor-pointer list-none flex items-center gap-1 select-none">
                                                        <span className="transition-transform group-open:rotate-90">◀</span>
                                                        <span>عرض كلمات الأغنية المكتوبة (Lyrics)</span>
                                                    </summary>
                                                    <p className="text-xs text-white/70 whitespace-pre-line mt-3 bg-black/30 p-3 rounded-xl border border-white/5 leading-relaxed font-serif text-center max-h-40 overflow-y-auto">
                                                        {metadata.lyrics}
                                                    </p>
                                                </details>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Hidden Audio element */}
                {currentAudioBase64 && (
                    <audio 
                        ref={audioRef}
                        src={`data:audio/wav;base64,${currentAudioBase64}`}
                        onTimeUpdate={onTimeUpdate}
                        onLoadedMetadata={onLoadedMetadata}
                        onEnded={() => setIsPlaying(false)}
                        className="hidden"
                    />
                )}
            </div>
        </div>
    );
};
