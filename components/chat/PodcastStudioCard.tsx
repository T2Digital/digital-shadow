import React, { useState, useEffect, useRef } from 'react';
import { Mic2, Headphones, Activity, Radio, Play, Pause, Download, Volume2, Sparkles, RefreshCw, Copy, CheckCircle2 } from 'lucide-react';
import { getAI } from '../../services/geminiService';

interface PodcastLine {
    speaker: 'الظل' | 'سارة';
    voice: string;
    text: string;
}

export const PodcastStudioCard = ({ card }: { card: any }) => {
    const initialTopic = card.data?.episode_topic || card.data?.topic || 'أسرار بناء الثروة الرقمية وأتمتة المشاريع بالذكاء الاصطناعي';
    const [topic, setTopic] = useState(initialTopic);
    const [isGenerating, setIsGenerating] = useState(false);
    const [script, setScript] = useState<PodcastLine[]>([
        {
            speaker: 'الظل',
            voice: 'ar-EG-ShakirNeural',
            text: 'يا هلا بيك في حلقة جديدة ومميزة جداً من بودكاست الظل الرقمي. النهاردة معانا موضوع بيشغل بال كل رائد أعمال ومبرمج.'
        },
        {
            speaker: 'سارة',
            voice: 'ar-EG-SalmaNeural',
            text: 'أهلاً يا ظل، وسعيدة جداً بوجودي معاك. السر الحقيقي اللي هنكشفه النهاردة هو إزاي توظف الذكاء الاصطناعي كفريق عمل متكامل مش مجرد أداة شات.'
        },
        {
            speaker: 'الظل',
            voice: 'ar-EG-ShakirNeural',
            text: 'كلام مظبوط 100%. لما تعمل نظام أتمتة بيشتغل بالنيابة عنك 24 ساعة، أنت بتكسب أغلى حاجة في حياتك: وهي وقتك وحريتك.'
        },
        {
            speaker: 'سارة',
            voice: 'ar-EG-SalmaNeural',
            text: 'بالظبط، وده اللي بيفرق بين شخص بيشتغل 16 ساعة في اليوم، وشخص بيبني إمبراطورية بأنظمة ذكية مستدامة.'
        }
    ]);

    const [currentLineIndex, setCurrentLineIndex] = useState<number | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioLoading, setAudioLoading] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const generateRealPodcastScript = async (targetTopic: string) => {
        setIsGenerating(true);
        try {
            const ai = getAI();
            const prompt = `أنت منتج ومخرج بودكاست احترافي خبير في إعداد حوارات صوتية طبيعية ومثيرة جداً (High-engagement Dual Speaker Podcast).
الموضوع المطلوب للحلقة هو: "${targetTopic}"

الشخصيات:
1. "الظل" (المقدم الرئيسي - نبرة مصرية واثقة، ذكية وجذابة).
2. "سارة" (الضيفة الخبيرة المتخصصة - نبرة مصرية مثقفة ورصينة).

المطلوب: كتابة حوار بودكاست ممتع وقصير ومكثف (5 إلى 6 مقاطع حوارية متبادلة) باللهجة المصرية الراقية الذكية.
أرجع الناتج بصيغة JSON فقط بهذا الشكل:
{
  "dialogue": [
    { "speaker": "الظل", "voice": "ar-EG-ShakirNeural", "text": "نص كلام الظل..." },
    { "speaker": "سارة", "voice": "ar-EG-SalmaNeural", "text": "رد سارة الخبيرة..." },
    { "speaker": "الظل", "voice": "ar-EG-ShakirNeural", "text": "تعليق الظل..." },
    { "speaker": "سارة", "voice": "ar-EG-SalmaNeural", "text": "إضافة سارة..." },
    { "speaker": "الظل", "voice": "ar-EG-ShakirNeural", "text": "خاتمة الحلقة والـ CTA القوي..." }
  ]
}`;

            const response = await ai.models.generateContent({
                model: 'gemini-3.7-flash',
                contents: prompt,
                config: { responseMimeType: 'application/json' }
            });

            const text = response.text || '{}';
            const parsed = JSON.parse(text);
            if (parsed.dialogue && Array.isArray(parsed.dialogue)) {
                setScript(parsed.dialogue);
            }
        } catch (e) {
            console.error('Error generating podcast script:', e);
        } finally {
            setIsGenerating(false);
        }
    };

    const playLineAudio = async (index: number) => {
        if (index >= script.length) {
            setIsPlaying(false);
            setCurrentLineIndex(null);
            return;
        }

        const line = script[index];
        setCurrentLineIndex(index);
        setIsPlaying(true);
        setAudioLoading(true);

        try {
            const res = await fetch('/api/tts/edge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: line.text,
                    voice: line.voice || (line.speaker === 'الظل' ? 'ar-EG-ShakirNeural' : 'ar-EG-SalmaNeural'),
                    rate: '+5%',
                    pitch: '+0Hz'
                })
            });

            if (!res.ok) throw new Error('TTS Failed');

            const blob = await res.blob();
            const audioUrl = URL.createObjectURL(blob);
            
            if (audioRef.current) {
                audioRef.current.pause();
            }

            const audio = new Audio(audioUrl);
            audioRef.current = audio;
            setAudioLoading(false);

            audio.onended = () => {
                URL.revokeObjectURL(audioUrl);
                // Next speaker line
                if (index + 1 < script.length) {
                    playLineAudio(index + 1);
                } else {
                    setIsPlaying(false);
                    setCurrentLineIndex(null);
                }
            };

            audio.onerror = () => {
                setAudioLoading(false);
                setIsPlaying(false);
            };

            await audio.play();
        } catch (e) {
            console.error('Playback error:', e);
            setAudioLoading(false);
            setIsPlaying(false);
        }
    };

    const handleStop = () => {
        if (audioRef.current) {
            audioRef.current.pause();
        }
        setIsPlaying(false);
        setCurrentLineIndex(null);
    };

    const handleDownloadScript = () => {
        const text = `# 🎙️ بودكاست الظل الرقمي: ${topic}\n\n` +
            script.map(l => `**[${l.speaker}]:** ${l.text}`).join('\n\n');
        const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `podcast_script_${Date.now()}.md`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="mt-4 p-2 sm:p-4 w-full max-w-4xl mx-auto font-sans" dir="rtl">
            <div className="relative rounded-2xl bg-gradient-to-b from-[#180c05] via-[#100702] to-[#060301] border border-orange-500/30 shadow-[0_0_40px_rgba(249,115,22,0.15)] overflow-hidden">
                
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-orange-500/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-orange-950/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-orange-500/20 rounded-xl border border-orange-500/40 shadow-[0_0_15px_rgba(249,115,22,0.4)]">
                            <Mic2 className="w-6 h-6 text-orange-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-base text-white">استوديو بودكاست الظل الثنائي (Dual AI Studio)</h3>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30 flex items-center gap-1">
                                    <Radio className="w-3 h-3 text-orange-400 animate-pulse" />
                                    توليد صوتي ثنائي حقيقي
                                </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">حوار حي ومتبادل بين المضيف (الظل) والضيفة الخبيرة (سارة) بأصوات طبيعية</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleDownloadScript}
                            className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span>تنزيل الإسكربت</span>
                        </button>
                    </div>
                </div>

                {/* Topic Bar */}
                <div className="p-3 sm:p-4 bg-black/50 border-b border-white/5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="حدد موضوع حلقة البودكاست..."
                        className="flex-1 bg-white/5 border border-white/10 focus:border-orange-500/50 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 outline-none transition"
                        onKeyDown={(e) => { if (e.key === 'Enter') generateRealPodcastScript(topic); }}
                    />
                    <button
                        onClick={() => generateRealPodcastScript(topic)}
                        disabled={isGenerating}
                        className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-black font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                        {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        {isGenerating ? 'جاري كتابة الحلقة...' : 'تأليف حلقة جديدة'}
                    </button>
                </div>

                {/* Main Studio Arena */}
                <div className="p-4 sm:p-6 bg-gradient-to-b from-[#140a04] to-[#070301]">
                    
                    {/* Speakers Card */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className={`p-3 rounded-xl border transition-all ${
                            currentLineIndex !== null && script[currentLineIndex]?.speaker === 'الظل'
                                ? 'bg-orange-500/20 border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.4)] scale-102'
                                : 'bg-white/[0.02] border-white/5'
                        }`}>
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-orange-500/20 border border-orange-500/40 text-orange-400">
                                    <Headphones className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="font-bold text-xs text-white">الظل (المضيف الرئيسي)</div>
                                    <div className="text-[10px] text-orange-400/80 font-mono">صوت: شاكر المصري</div>
                                </div>
                            </div>
                        </div>

                        <div className={`p-3 rounded-xl border transition-all ${
                            currentLineIndex !== null && script[currentLineIndex]?.speaker === 'سارة'
                                ? 'bg-amber-500/20 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)] scale-102'
                                : 'bg-white/[0.02] border-white/5'
                        }`}>
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400">
                                    <Mic2 className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="font-bold text-xs text-white">سارة (الضيفة الخبيرة)</div>
                                    <div className="text-[10px] text-amber-400/80 font-mono">صوت: سلمى المصرية</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Dialogue Lines */}
                    <div className="flex flex-col gap-2.5 max-h-72 overflow-y-auto pr-1">
                        {script.map((line, idx) => {
                            const isCurrent = currentLineIndex === idx;
                            const isShadow = line.speaker === 'الظل';
                            return (
                                <div
                                    key={idx}
                                    onClick={() => playLineAudio(idx)}
                                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                                        isCurrent 
                                            ? 'bg-orange-500/15 border-orange-500/70 shadow-[0_0_15px_rgba(249,115,22,0.25)]' 
                                            : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]'
                                    }`}
                                >
                                    <button 
                                        className={`p-2 rounded-lg border shrink-0 ${
                                            isShadow ? 'bg-orange-500/20 border-orange-500/40 text-orange-400' : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                                        }`}
                                    >
                                        {isCurrent && isPlaying ? <Activity className="w-3.5 h-3.5 animate-pulse" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                                    </button>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className={`font-bold text-xs ${isShadow ? 'text-orange-400' : 'text-amber-400'}`}>
                                                {line.speaker}
                                            </span>
                                            {isCurrent && isPlaying && (
                                                <span className="text-[10px] text-emerald-400 font-bold animate-pulse">جاري التحدث...</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-200 leading-relaxed font-sans">{line.text}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                </div>

                {/* Footer Controls */}
                <div className="p-4 bg-[#080402] border-t border-white/10 flex justify-between items-center">
                    <div className="text-xs text-gray-400">
                        {isPlaying ? (
                            <span className="flex items-center gap-2 text-orange-400">
                                <Activity className="w-4 h-4 animate-bounce" />
                                <span>البودكاست قيد التشغيل المباشر...</span>
                            </span>
                        ) : (
                            <span>اضغط على أي مقطع للاستماع أو شغل الحلقة بالكامل</span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {isPlaying ? (
                            <button
                                onClick={handleStop}
                                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-lg"
                            >
                                <Pause className="w-4 h-4 fill-current" />
                                <span>إيقاف التشغيل</span>
                            </button>
                        ) : (
                            <button
                                onClick={() => playLineAudio(0)}
                                disabled={script.length === 0}
                                className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-black font-bold text-xs rounded-xl transition flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(249,115,22,0.4)]"
                            >
                                <Play className="w-4 h-4 fill-current" />
                                <span>تشغيل الحلقة بالكامل</span>
                            </button>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};
