import React from 'react';
import { Loader2, Activity, Briefcase, CheckCircle, Clock, Copy, ExternalLink, FileText, FolderOpen, Layout, Printer, Smartphone, Download, Share2, Globe, Users, Bot, Terminal, Play, Pause } from 'lucide-react';
import { useAppStore } from '../../services/store';
import LiveAgentAction from '../LiveAgentAction';
import { getCardIcon, handleAppCardAction } from './ToolCardRenderer';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip } from 'recharts';
const InteractiveEducator = React.lazy(() => import('./InteractiveEducator').then(m => ({ default: m.InteractiveEducator })));
const TradingViewChart = React.lazy(() => import('./TradingViewChart').then(m => ({ default: m.TradingViewChart })));
const AutonomousDashboard = React.lazy(() => import('./AutonomousDashboard').then(m => ({ default: m.AutonomousDashboard })));
const VideoDisplay = React.lazy(() => import('./VideoDisplay').then(m => ({ default: m.VideoDisplay })));
const PredictiveAnalyticsBoard = React.lazy(() => import('./PredictiveAnalyticsBoard').then(m => ({ default: m.PredictiveAnalyticsBoard })));
const ExpenseTrackerCard = React.lazy(() => import('./ExpenseTrackerCard').then(m => ({ default: m.ExpenseTrackerCard })));
const MuslimCompanionCard = React.lazy(() => import('./MuslimCompanionCard').then(m => ({ default: m.MuslimCompanionCard })));
const ContentMachineCard = React.lazy(() => import('./ContentMachineCard').then(m => ({ default: m.ContentMachineCard })));
const PodcastStudioCard = React.lazy(() => import('./PodcastStudioCard').then(m => ({ default: m.PodcastStudioCard })));
const CommandCenterCard = React.lazy(() => import('./CommandCenterCard').then(m => ({ default: m.CommandCenterCard })));
const MemoryConstellationCard = React.lazy(() => import('./MemoryConstellationCard').then(m => ({ default: m.MemoryConstellationCard })));
const CyberDefenseMapCard = React.lazy(() => import('./CyberDefenseMapCard').then(m => ({ default: m.CyberDefenseMapCard })));
const TrendHunterCard = React.lazy(() => import('./TrendHunterCard').then(m => ({ default: m.TrendHunterCard })));
const BoardroomMeetingCard = React.lazy(() => import('./BoardroomMeetingCard').then(m => ({ default: m.BoardroomMeetingCard })));
const RevenueMatrixCard = React.lazy(() => import('./RevenueMatrixCard').then(m => ({ default: m.RevenueMatrixCard })));
const OfflineGhostModeCard = React.lazy(() => import('./OfflineGhostModeCard').then(m => ({ default: m.OfflineGhostModeCard })));
const LeadGeneratorCard = React.lazy(() => import('./LeadGeneratorCard').then(m => ({ default: m.LeadGeneratorCard })));

const QuranPlayerCard = ({ card }: { card: any }) => {
    const audioRef = React.useRef<HTMLAudioElement>(null);
    const hasAutoplayedRef = React.useRef(false);

    React.useEffect(() => {
        const handleVoiceEnded = () => {
            // Only autoplay if this card was created recently (< 2 minutes old)
            // and we haven't already autoplayed it.
            const isRecent = card.timestamp && (Date.now() - card.timestamp < 120000);
            if (audioRef.current && !hasAutoplayedRef.current && isRecent) {
                hasAutoplayedRef.current = true;
                audioRef.current.play().catch(e => console.log('Autoplay prevented', e));
            }
        };
        window.addEventListener('shadow_voice_ended', handleVoiceEnded);
        return () => window.removeEventListener('shadow_voice_ended', handleVoiceEnded);
    }, [card.timestamp]);

    const surahNumStr = String(card.surah_number).padStart(3, '0');
    const reciterMap: Record<string, string> = {
        'mishary': 'https://server8.mp3quran.net/afs/',
        'abdulbasit': 'https://server7.mp3quran.net/basit/',
        'maher': 'https://server12.mp3quran.net/maher/',
        'sudais': 'https://server11.mp3quran.net/sds/',
        'shuraim': 'https://server7.mp3quran.net/shrm/',
        'husary': 'https://server13.mp3quran.net/husr/',
        'mustafa': 'https://server8.mp3quran.net/mustafa/',
        'minshawi': 'https://server10.mp3quran.net/minsh/',
        'jalil': 'https://server10.mp3quran.net/jleel/',
        'fares': 'https://server8.mp3quran.net/frs_a/'
    };
    const reciterNameMap: Record<string, string> = {
        'mishary': 'مشاري العفاسي',
        'abdulbasit': 'عبدالباسط عبدالصمد',
        'maher': 'ماهر المعيقلي',
        'sudais': 'عبدالرحمن السديس',
        'shuraim': 'سعود الشريم',
        'husary': 'محمود خليل الحصري',
        'mustafa': 'مصطفى إسماعيل',
        'minshawi': 'محمد صديق المنشاوي',
        'jalil': 'خالد الجليل',
        'fares': 'فارس عباد'
    };
    
    const baseUrl = reciterMap[card.reciter] || reciterMap['mishary'];
    const audioUrl = `${baseUrl}${surahNumStr}.mp3`;
    const surahNameDisplay = card.surah_name ? `سورة ${card.surah_name}` : `سورة رقم ${card.surah_number}`;
    
    return (
        <div className="mt-4 rounded-[22px] p-5 w-full md:w-[350px] bg-gradient-to-br from-[#022c22]/80 to-[#064e3b]/80 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.15)] relative overflow-hidden backdrop-blur-md hover:shadow-[0_0_40px_rgba(16,185,129,0.25)] transition-all">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-400"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl rounded-tr-[22px] pointer-events-none"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-[#064e3b] flex items-center justify-center border-2 border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)] shrink-0 p-1">
                        <div className="w-full h-full rounded-full border border-emerald-500/50 flex items-center justify-center">
                            <span className="text-xl font-bold text-emerald-300 font-['Amiri']">{card.surah_number}</span>
                        </div>
                    </div>
                    <div>
                        <h3 className="font-extrabold text-white text-lg font-['Amiri'] tracking-wide">{surahNameDisplay}</h3>
                        <p className="text-xs text-emerald-200 mt-1 opacity-90">{reciterNameMap[card.reciter] || 'مشاري العفاسي'}</p>
                    </div>
                </div>
            </div>
            <div className="relative z-10 w-full bg-black/40 rounded-[20px] p-1 border border-white/5">
                <audio ref={audioRef} controls src={audioUrl} className="w-full h-12 rounded-[16px] outline-none" style={{ filter: 'invert(1) hue-rotate(180deg) brightness(1.2)' }} crossOrigin="anonymous" />
            </div>
        </div>
    );
};

const MusicPlayerCard = ({ title, description, audioData }: { title: string, description: string, audioData: string }) => {
    const [isPlaying, setIsPlaying] = React.useState(false);
    const audioRef = React.useRef<HTMLAudioElement | null>(null);
    const [progress, setProgress] = React.useState(0);
    const [currentTime, setCurrentTime] = React.useState(0);
    const [duration, setDuration] = React.useState(0);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play().catch(e => console.error(e));
            setIsPlaying(true);
        }
    };

    const handleTimeUpdate = () => {
        if (!audioRef.current) return;
        const cur = audioRef.current.currentTime;
        const dur = audioRef.current.duration || 0;
        setCurrentTime(cur);
        setProgress(dur > 0 ? (cur / dur) * 100 : 0);
    };

    const handleLoadedMetadata = () => {
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
        <div className="mt-4 bg-[#111] border border-fuchsia-500/30 rounded-[22px] p-5 shadow-[0_0_25px_rgba(217,70,239,0.1)] relative overflow-hidden w-full md:w-[400px]" dir="rtl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-fuchsia-500 to-purple-500"></div>
            
            <div className="flex items-center gap-4 mb-4">
                <button 
                    onClick={togglePlay}
                    className="w-12 h-12 bg-fuchsia-600 hover:bg-fuchsia-500 rounded-full flex items-center justify-center hover:scale-105 transition-all text-white shrink-0 shadow-lg shadow-fuchsia-950/20"
                >
                    {isPlaying ? <Pause className="w-5 h-5 text-white fill-white" /> : <Play className="w-5 h-5 text-white fill-white mr-0.5" />}
                </button>
                <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-white text-sm truncate">{title}</h3>
                    <p className="text-[10px] text-fuchsia-300 font-mono tracking-widest mt-0.5 uppercase">AI MUSIC PRODUCTION</p>
                </div>
            </div>

            {/* Audio tag */}
            <audio 
                ref={audioRef} 
                src={audioData} 
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
                className="hidden" 
            />

            {/* Seek Bar */}
            <div className="flex items-center gap-2 text-[10px] font-mono text-white/40 mb-4">
                <span>{formatTime(currentTime)}</span>
                <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={progress} 
                    onChange={handleProgressChange}
                    className="flex-1 accent-fuchsia-500 h-1 bg-white/10 rounded-lg cursor-pointer animate-none" 
                />
                <span>{formatTime(duration)}</span>
            </div>

            {/* Description/Lyrics accordion */}
            {description && (
                <div className="bg-black/40 p-3 rounded-xl border border-white/5 max-h-36 overflow-y-auto">
                    <p className="text-xs text-white/70 whitespace-pre-line leading-relaxed text-center">
                        {description}
                    </p>
                </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2 mt-4">
                <div className="flex items-center gap-2">
                    <a 
                        href={audioData}
                        download="AI_Track.wav"
                        className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors border border-white/5 text-center"
                    >
                        <Download className="w-3.5 h-3.5" /> تحميل الملف
                    </a>
                    <button 
                        onClick={() => {
                            const text = encodeURIComponent(`اسمع الأغنية دي اللي لسه مألفها بالذكاء الاصطناعي مع ظلي الرقمي!\n🔥🎵`);
                            const whatsappUrl = `https://wa.me/?text=${text}`;
                            window.open(whatsappUrl, '_blank');
                        }}
                        className="flex-1 bg-[#128C7E]/10 hover:bg-[#128C7E]/20 text-[#25D366] font-medium py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors border border-[#128C7E]/20"
                    >
                        <Share2 className="w-3.5 h-3.5" /> مشاركة واتساب
                    </button>
                </div>
                <button 
                    onClick={() => {
                        // Switch view to dashboard
                        useAppStore.setState({ view: 'dashboard' });
                        // Trigger opening music vault modal in Dashboard
                        setTimeout(() => {
                            window.dispatchEvent(new CustomEvent('shadow_open_modal', { detail: { modal: 'music_vault' } }));
                        }, 200);
                    }}
                    className="w-full bg-fuchsia-500/10 hover:bg-fuchsia-500/20 text-fuchsia-400 font-medium py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors border border-fuchsia-500/20"
                >
                    <FolderOpen className="w-3.5 h-3.5" /> عرض بالخزنة والألبوم 🎵
                </button>
            </div>
        </div>
    );
};

export const renderChatCard = (
    card: any, 
    i: number, 
    currentUser: any, 
    handleSend: (text: string, v?: any, inc?: any, skip?: boolean) => void,
    setSelectedWorkspaceFile: (card: any) => void
) => {
    return (
        <React.Suspense fallback={<div className="animate-pulse h-32 bg-[#1a1a1a] border border-gray-800 rounded-xl m-2" />}>
            {_renderChatCardInner(card, i, currentUser, handleSend, setSelectedWorkspaceFile)}
        </React.Suspense>
    );
};

const _renderChatCardInner = (
    card: any, 
    i: number, 
    currentUser: any, 
    handleSend: (text: string, v?: any, inc?: any, skip?: boolean) => void,
    setSelectedWorkspaceFile: (card: any) => void
) => {
      if (card.cardType === 'swarm_manager') {
          return (
              <div key={i} className="bg-[#121212] border border-emerald-500/30 rounded-xl overflow-hidden font-sans shadow-[0_0_15px_rgba(16,185,129,0.1)] my-4" dir="rtl">
                  <div className="bg-gradient-to-r from-emerald-900/30 to-teal-900/30 p-4 border-b border-emerald-500/20 flex items-center gap-3">
                      <Users className="w-5 h-5 text-emerald-400" />
                      <div>
                          <h3 className="font-semibold text-emerald-300 tracking-tight">{card.title}</h3>
                          <div className="text-xs text-emerald-500/70 mt-0.5">سرب تفكير جماعي يعمل بالتوازي</div>
                      </div>
                  </div>
                  <div className="p-4 space-y-3">
                      {card.tasks.map((task: any, idx: number) => (
                          <div key={idx} className="bg-black/40 border border-white/5 rounded-lg p-3 flex gap-3 items-start relative overflow-hidden group">
                              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/50"></div>
                              <div className="bg-emerald-500/10 p-2 rounded-md shrink-0">
                                  <Bot className="w-4 h-4 text-emerald-400" />
                              </div>
                              <div>
                                  <div className="text-sm font-bold text-white/90">عميل: {task.agent_role}</div>
                                  <div className="text-xs text-white/50 leading-relaxed mt-1">المهمة: {task.instruction}</div>
                              </div>
                              <div className="mr-auto self-center">
                                  <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          );
      }
      if (card.cardType === 'predictive_board') {
          return <React.Fragment key={i}><PredictiveAnalyticsBoard title={card.title} metrics={card.metrics || []} predicted_actions={card.predicted_actions || []} onApproveAction={(desc) => handleSend(`وافق على القرار: ${desc}`, undefined, undefined, false)} /></React.Fragment>;
      }
      if (card.cardType === 'interactive_educator') {
          return <React.Fragment key={i}><InteractiveEducator card={card} /></React.Fragment>;
      }
      if (card.cardType === 'tradingview_chart') {
          return <React.Fragment key={i}><TradingViewChart card={card} /></React.Fragment>;
      }
      if (card.cardType === 'autonomous_dashboard') {
          return <React.Fragment key={i}><AutonomousDashboard card={card} /></React.Fragment>;
      }
      if (card.cardType === 'video_display') {
          return <React.Fragment key={i}><VideoDisplay card={card} /></React.Fragment>;
      }
      if (card.cardType === 'live_action') {
          return <LiveAgentAction key={i} actionType={card.actionType} args={card.args} userProfile={currentUser} onComplete={(resultText) => {
              handleSend(resultText, undefined, undefined, true);
          }} />;
      }
      if (card.cardType === 'autonomous_agent') {
          return (
              <div key={i} className="mt-4 bg-[#111] border border-fuchsia-500/30 rounded-[22px] p-5 shadow-[0_0_30px_rgba(217,70,239,0.15)] relative overflow-hidden w-full md:w-[450px]">
                  <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-fuchsia-500/20 rounded-full animate-spin-slow">
                              <Loader2 className="w-6 h-6 text-fuchsia-400" />
                          </div>
                          <div>
                              <h3 className="font-black text-white text-sm">عميل مستقل قيد التشغيل</h3>
                              <p className="text-[10px] text-fuchsia-300 font-mono">AUTONOMOUS_BACKGROUND_TASK</p>
                          </div>
                      </div>
                      <div className="px-3 py-1 bg-fuchsia-500/10 text-fuchsia-400 text-xs font-bold rounded-full border border-fuchsia-500/20">
                          Running
                      </div>
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                      <p className="text-xs text-white/80 leading-relaxed font-bold">{card.description}</p>
                  </div>
                  <div className="mt-3 text-[10px] text-white/40 text-center flex items-center justify-center gap-1">
                      <Activity className="w-3 h-3 text-fuchsia-400 animate-pulse" />
                      يتم المعالجة في الخلفية، سيتم إشعارك عند الانتهاء.
                  </div>
              </div>
          );
      }
      if (card.cardType === 'project_manager') {
          return (
              <div key={i} className="mt-4 rounded-[22px] p-5 w-full md:w-[450px] bg-gradient-to-br from-indigo-900/40 to-black border border-indigo-500/30 shadow-2xl relative overflow-hidden">
                  <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                          <div className="p-3 bg-indigo-500/20 rounded-xl"><Briefcase className="w-6 h-6 text-indigo-400" /></div>
                          <div>
                              <h3 className="font-black text-white text-md">{card.data.title || "مشروع جديد"}</h3>
                              <p className="text-xs text-indigo-300 mt-0.5 max-w-[200px] truncate">{card.data.description}</p>
                          </div>
                      </div>
                      <div className="text-right">
                          <div className="text-2xl font-black text-indigo-400">{Math.round(card.data.progress || 0)}%</div>
                          <div className="text-[10px] text-white/50 font-bold uppercase">إنجاز</div>
                      </div>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2 mb-5 overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${card.data.progress || 0}%` }}></div>
                  </div>
                  <div className="space-y-2">
                      {card.data.tasks && parseInt(card.data.tasks.length) > 0 ? card.data.tasks.slice(0, 4).map((t: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center p-2 rounded-lg bg-white/5 border border-white/5">
                              <span className="text-xs font-bold text-white/80">{t.title}</span>
                              {t.status === 'done' ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Clock className="w-4 h-4 text-amber-500" />}
                          </div>
                      )) : <div className="text-xs text-white/50 text-center py-2">لا توجد مهام حتى الآن</div>}
                      {card.data.tasks && card.data.tasks.length > 4 && (
                          <div className="text-[10px] text-center text-indigo-400 pt-1 font-bold">+ {card.data.tasks.length - 4} مهام أخرى المخفية</div>
                      )}
                  </div>
              </div>
          );
      }
      if (card.cardType === 'brand_vault') {
          return (
              <div key={i} className="mt-4 rounded-[22px] p-5 w-full md:w-[450px] bg-gradient-to-br from-purple-900/40 to-black border border-purple-500/30 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-purple-500"></div>
                  <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                          <div className="p-3 bg-purple-500/20 rounded-xl"><Briefcase className="w-6 h-6 text-purple-400" /></div>
                          <div>
                              <h3 className="font-black text-white text-md">{card.data.profile_name || "براند جديد"}</h3>
                              <p className="text-xs text-purple-300 mt-0.5 font-mono">{card.data.action === 'create' ? 'Brand Vault Created' : 'Brand Vault Updated'}</p>
                          </div>
                      </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                      {card.data.visual_guidelines && (
                          <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                              <div className="text-[10px] text-purple-400 font-bold mb-1 uppercase tracking-wider">Visuals</div>
                              <div className="text-xs text-white/80 line-clamp-2">{card.data.visual_guidelines}</div>
                          </div>
                      )}
                      {card.data.tone_of_voice && (
                          <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                              <div className="text-[10px] text-purple-400 font-bold mb-1 uppercase tracking-wider">Tone of Voice</div>
                              <div className="text-xs text-white/80 line-clamp-2">{card.data.tone_of_voice}</div>
                          </div>
                      )}
                  </div>
                  {(card.data.strategy || card.data.competitors) && (
                      <div className="bg-white/5 p-3 rounded-xl border border-white/10 mb-2">
                         <div className="text-[10px] text-purple-400 font-bold mb-1 uppercase tracking-wider">Strategy & Positioning</div>
                         <div className="text-xs text-white/80 line-clamp-2">{card.data.strategy} {card.data.competitors ? `| Competitors: ${card.data.competitors}` : ''}</div>
                      </div>
                  )}
                  {card.data.knowledge_base_links && card.data.knowledge_base_links.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                          {card.data.knowledge_base_links.map((link: string, idx: number) => (
                              <a key={idx} href={link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] bg-purple-500/20 text-purple-200 px-2 py-1 rounded border border-purple-500/30 hover:bg-purple-500/40">
                                  <ExternalLink className="w-3 h-3" />
                                  Link {idx + 1}
                              </a>
                          ))}
                      </div>
                  )}
              </div>
          );
      }
      if (card.cardType === 'system_terminal') {
          return (
              <div key={i} className="mt-4 bg-[#0a0a0a] rounded-[16px] border border-white/20 overflow-hidden w-full md:w-[450px] shadow-2xl font-mono text-left" dir="ltr">
                  <div className="bg-[#1a1a1a] px-4 py-2 flex items-center gap-2 border-b border-white/10">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="ml-2 text-[10px] text-white/40 font-bold">ez-zel@shadow-core:~</span>
                  </div>
                  <div className="p-4 text-xs font-mono">
                      <div className="text-emerald-400 mb-2">$ {card.data.command_type || 'executing...'}</div>
                      <pre className="text-white/80 whitespace-pre-wrap">{card.data.logs}</pre>
                      <div className="mt-2 text-white/50 animate-pulse">_</div>
                  </div>
              </div>
          );
      }
      if (card.cardType === 'task_success') {
          if (card.audioData) {
              return <MusicPlayerCard key={i} title={card.title} description={card.description} audioData={card.audioData} />;
          }
          return (
              <div key={i} className="mt-4 bg-[#111] p-4 rounded-[22px] border border-emerald-500/20 flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-full"><CheckCircle className="w-5 h-5 text-emerald-500" /></div>
                  <div><h3 className="font-bold text-white text-sm">{card.title}</h3><p className="text-[10px] text-white/50">{card.description}</p></div>
              </div>
          );
      }
      if (card.cardType === 'business_doc') {
          return (
            <div key={i} className="mt-4 bg-white text-black rounded-[22px] p-6 shadow-2xl printable-invoice w-full md:w-[600px] border border-black/10 overflow-hidden relative print:w-full print:border-none print:shadow-none print:m-0 print:p-0">
                {/* Header Section */}
                <div className="flex justify-between items-start mb-8 border-b-2 border-black pb-6 px-2">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-black rounded-xl border-2 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)] flex items-center justify-center print:border-black print:shadow-none">
                                <span className="text-white text-xl font-black mb-1">E</span>
                            </div>
                            <div>
                                <h1 className="text-2xl font-black tracking-tight uppercase">Ez-Zel <span className="text-cyan-600">Enterprise</span></h1>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Digital Shadow System</p>
                            </div>
                        </div>
                        <div className="mt-6 flex flex-col gap-1">
                            <h2 className="text-3xl font-black">{card.data.docType === 'quote' ? 'عرض السعـر' : (card.data.docType === 'contract' ? 'عقـد اتفـاق' : (card.data.docType === 'cv' ? 'سيـرة ذاتيـة' : 'فـاتـورة'))}</h2>
                            <p className="text-xs text-gray-400 font-bold tracking-widest" dir="ltr">DOCUMENT ID: <span className="text-black font-mono">EZ-{Math.floor(Math.random() * 90000) + 10000}</span></p>
                        </div>
                    </div>
                    <div className="text-right flex flex-col gap-1 mt-14">
                        <p className="font-black text-sm text-gray-400 uppercase tracking-widest">التاريـخ</p>
                        <p className="text-sm font-bold font-mono bg-gray-100 px-3 py-1 rounded-md border border-gray-200" dir="ltr">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    </div>
                </div>

                {/* Client Section */}
                <div className="mb-8 px-2">
                    <div className="inline-block bg-black text-white px-3 py-1 rounded-md mb-3">
                        <p className="text-[10px] uppercase font-black tracking-widest">{card.data.docType === 'cv' ? 'الاسم' : 'مقدم إلى'}</p>
                    </div>
                    <h3 className="text-2xl font-black text-gray-800 border-l-4 border-cyan-500 pl-3 leading-none">{card.data.clientName}</h3>
                </div>

                {/* Contract Body (Optional) */}
                {card.data.contractBody && (
                    <div className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200 shadow-inner">
                        <h4 className="text-xs font-black uppercase text-gray-400 mb-4 tracking-widest border-b border-gray-200 pb-2">{card.data.docType === 'cv' ? 'الملخص والتفاصيل' : 'تفاصيل العقد للشروط والأحكام'}</h4>
                        <div className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap font-medium">{card.data.contractBody}</div>
                    </div>
                )}

                {/* Items Table */}
                {card.data.items && card.data.items.length > 0 && (
                    <div className="mb-8 overflow-hidden rounded-xl border border-gray-200">
                        <table className="w-full text-right text-sm">
                            <thead className="bg-gray-100 text-gray-600 font-black uppercase text-[10px] tracking-wider">
                                <tr>
                                    <th className="py-3 px-4">البند / الوصف</th>
                                    <th className="py-3 px-4 text-left w-32">القيمة (EGP)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {card.data.items.map((item: any, idx: number) => (
                                    <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                                        <td className="py-4 px-4 font-bold text-gray-800">{item.desc}</td>
                                        <td className="py-4 px-4 text-left font-mono font-bold text-gray-900 bg-gray-50/50" dir="ltr">{(item.price || 0).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Total Section */}
                {card.data.items && card.data.items.length > 0 && (
                    <div className="flex justify-end px-2 mb-10">
                        <div className="w-full md:w-1/2 flex justify-between items-center p-4 rounded-xl bg-black text-white shadow-xl transform hover:scale-[1.02] transition-transform">
                            <span className="font-black text-sm tracking-widest uppercase">الإجمالي النهائي</span>
                            <div className="flex items-center gap-2">
                                <span className="font-black text-2xl font-mono text-cyan-400" dir="ltr">{card.data.items.reduce((s:number, i:any) => s + (i.price || 0), 0).toLocaleString()}</span>
                                <span className="text-xs font-bold text-gray-400">EGP</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer Notes */}
                <div className="mt-12 text-center border-t border-gray-200 pt-6">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Generated by Ez-Zel Digital Shadow</p>
                    <p className="text-[9px] text-gray-300">This document is electronically verified.</p>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex gap-3 print:hidden">
                    <button onClick={() => window.print()} className="flex-1 py-3 bg-black text-white rounded-xl font-black flex items-center justify-center gap-2 hover:bg-gray-800 transition-all text-sm shadow-xl active:scale-95">
                        <Printer className="w-4 h-4" /> طباعة المستند
                    </button>
                    {card.data.contractBody && (
                        <button onClick={() => {
                            const contractText = `عقد اتفاق\n\nالطرف الثاني: ${card.data.clientName}\n\n${card.data.contractBody}`;
                            navigator.clipboard.writeText(contractText);
                            alert('تم نسخ نص العقد!');
                        }} className="px-4 py-3 border-2 border-black rounded-xl font-black flex items-center justify-center gap-2 hover:bg-gray-100 transition-all text-sm active:scale-95">
                            <Copy className="w-4 h-4" /> نسخ النص
                        </button>
                    )}
                </div>
            </div>
          );
      }
      if (card.cardType === 'mobile_agent_action') {
          return (
              <div key={i} className="mt-3 bg-indigo-900/20 border border-indigo-500/30 rounded-[22px] p-4 overflow-hidden relative w-full md:w-[320px]">
                  <div className="flex items-start gap-3">
                      <div className="p-2 bg-indigo-500/20 rounded-xl shrink-0">
                          <Smartphone className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div className="flex-1">
                          <h4 className="text-xs font-bold text-indigo-300 mb-1">{card.title}</h4>
                          <p className="text-[11px] text-white/70 leading-relaxed">{card.description}</p>
                          <div className="mt-2 text-[10px] text-indigo-400/50 font-mono">
                              [NATIVE_CALL: ShadowAgent.clickOnText("{card.target_text}")]
                          </div>
                      </div>
                  </div>
              </div>
          );
      }
      if (card.cardType === 'workspace_item') {
          const contentToUse = card.l2_content || card.content;
          const isImage = (card.itemType === 'image' || (typeof card.title === 'string' && card.title.match(/\.(png|jpe?g|gif|webp|svg)$/i))) && contentToUse && typeof contentToUse === 'string' && (contentToUse.startsWith('http') || contentToUse.startsWith('data:') || contentToUse.startsWith('blob:') || contentToUse.startsWith('/'));
          const isVideo = (card.itemType === 'video' || (typeof card.title === 'string' && card.title.match(/\.(mp4|webm|ogg|mov)$/i))) && contentToUse && typeof contentToUse === 'string' && (contentToUse.startsWith('http') || contentToUse.startsWith('data:') || contentToUse.startsWith('blob:') || contentToUse.startsWith('/'));

          return (
              <div key={i} className="mt-4 rounded-[22px] p-4 w-full md:w-[320px] bg-[#1a1a1a]/95 border border-white/20 shadow-xl overflow-hidden relative">
                  <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-white/5 rounded-xl text-emerald-400 shrink-0">
                          {card.itemType === 'folder' ? <FolderOpen className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                      </div>
                      <div className="flex-1 overflow-hidden">
                          <h3 className="font-bold text-sm text-white truncate" dir="ltr">{card.title}</h3>
                          <p className="text-[10px] text-emerald-500/80 mt-0.5 truncate">{card.description}</p>
                      </div>
                  </div>
                  {isImage && (
                      <div className="mb-4 rounded-xl overflow-hidden bg-black border border-white/5 flex items-center justify-center">
                          <img src={contentToUse || undefined} alt={card.title} className="w-full h-auto object-contain max-h-[250px]" crossOrigin="anonymous" referrerPolicy="no-referrer" />
                      </div>
                  )}
                  {isVideo && (
                      <div className="mb-4 rounded-xl overflow-hidden bg-black border border-white/5 flex items-center justify-center">
                          <video src={contentToUse || undefined} controls className="w-full h-auto object-contain max-h-[250px]" crossOrigin="anonymous" />
                      </div>
                  )}
                  {card.itemType === 'file' && (
                      <button onClick={() => setSelectedWorkspaceFile(card)} className="w-full py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-xs">
                          <ExternalLink className="w-3 h-3" /> فتح الملف
                      </button>
                  )}
              </div>
          );
      }
      if (card.cardType === 'image_display') {
          return (
              <div key={i} className="mt-4 rounded-[22px] p-2 w-full md:w-[320px] bg-[#1a1a1a]/95 border border-white/20 shadow-xl overflow-hidden relative">
                  <img src={card.url || undefined} alt={card.title} className="w-full h-auto rounded-xl object-contain mb-2 bg-black" crossOrigin="anonymous" referrerPolicy="no-referrer" />
                  <div className="p-2">
                       <h3 className="font-bold text-sm text-white truncate px-1">{card.title}</h3>
                       <p className="text-[10px] text-white/50 mt-1 px-1">{card.description}</p>
                       <div className="flex items-center gap-2 mt-4 px-1 pb-1">
                           <button onClick={async () => {
                                try {
                                    const proxyUrl = `/api/proxy?url=${encodeURIComponent(card.url)}`;
                                    const res = await fetch(proxyUrl);
                                    const blob = await res.blob();
                                    const blobUrl = window.URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = blobUrl;
                                    a.download = `shadow_design_${Date.now()}.png`;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
                                } catch (e) {
                                    window.open(card.url, '_blank');
                                }
                           }} className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center gap-2 text-[10px] text-white/80 transition-colors">
                               <Download className="w-3.5 h-3.5" /> تحميل
                           </button>
                           <button onClick={async () => {
                                try {
                                    const proxyUrl = `/api/proxy?url=${encodeURIComponent(card.url)}`;
                                    const res = await fetch(proxyUrl);
                                    const blob = await res.blob();
                                    const file = new File([blob], 'shadow_design.png', { type: blob.type });
                                    if (navigator.canShare && navigator.canShare({ files: [file] })) {
                                        await navigator.share({
                                            title: card.title,
                                            files: [file]
                                        });
                                    } else if (navigator.share) {
                                        navigator.share({ title: card.title, url: card.url }).catch(() => {});
                                    } else {
                                        navigator.clipboard.writeText(card.url);
                                    }
                                } catch (e) {
                                    if (navigator.share) {
                                        navigator.share({ title: card.title, url: card.url }).catch(() => {});
                                    } else {
                                        navigator.clipboard.writeText(card.url);
                                    }
                                }
                           }} className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center gap-2 text-[10px] text-white/80 transition-colors">
                               <Share2 className="w-3.5 h-3.5" /> مشاركة
                           </button>
                           <button onClick={() => handleSend(`انشر التصميم ده على السوشيال ميديا: ${card.url}`, null, null, true)} className="flex-1 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center gap-2 text-[10px] font-bold transition-colors">
                               <Globe className="w-3.5 h-3.5" /> نشر
                           </button>
                       </div>
                  </div>
              </div>
          );
      }
      if (card.cardType === 'chart_display') {
          const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];
          return (
              <div key={i} className="mt-4 rounded-[22px] p-4 w-full md:w-[380px] bg-[#000000]/95 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)] overflow-hidden relative group">
                  <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
                          <Activity className="w-5 h-5" />
                      </div>
                      <div>
                          <h3 className="font-bold text-[15px] text-white">{card.title}</h3>
                          <p className="text-[11px] text-white/50">تحليل بيانات</p>
                      </div>
                  </div>
                  <div className="h-[200px] w-full text-xs" dir="ltr">
                      <ResponsiveContainer width="100%" height="100%">
                          {card.chartType === 'line' ? (
                              <LineChart data={card.data}>
                                  <XAxis dataKey="name" stroke="#666" tick={{fill: '#888'}} />
                                  <YAxis stroke="#666" tick={{fill: '#888'}} />
                                  <Tooltip contentStyle={{backgroundColor: '#111', borderColor: '#333', borderRadius: '8px'}} itemStyle={{color: '#10b981'}} />
                                  <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981'}} activeDot={{r: 6}} />
                              </LineChart>
                          ) : card.chartType === 'pie' ? (
                              <PieChart>
                                  <Pie data={card.data} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={5} dataKey="value">
                                      {card.data.map((entry: any, index: number) => (
                                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                      ))}
                                  </Pie>
                                  <Tooltip contentStyle={{backgroundColor: '#111', borderColor: '#333', borderRadius: '8px'}} />
                              </PieChart>
                          ) : (
                              <BarChart data={card.data}>
                                  <XAxis dataKey="name" stroke="#666" tick={{fill: '#888'}} />
                                  <YAxis stroke="#666" tick={{fill: '#888'}} />
                                  <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: '#111', borderColor: '#333', borderRadius: '8px'}} />
                                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                              </BarChart>
                          )}
                      </ResponsiveContainer>
                  </div>
                  {card.description && (
                      <div className="mt-4 p-3 bg-white/5 border border-white/10 rounded-xl">
                          <p className="text-xs leading-relaxed text-white/80 font-medium">{card.description}</p>
                      </div>
                  )}
              </div>
          );
      }
      if (card.cardType === 'quran_player') {
          return <QuranPlayerCard key={i} card={card} />;
      }
      if (card.cardType === 'expense_tracker') {
          return <ExpenseTrackerCard key={i} card={card} />;
      }
      if (card.cardType === 'muslim_companion') {
          return <MuslimCompanionCard key={i} card={card} />;
      }
      if (card.cardType === 'content_machine') {
          return <ContentMachineCard key={i} card={card} />;
      }
      if (card.cardType === 'podcast_studio') {
          return <PodcastStudioCard key={i} card={card} />;
      }
      if (card.cardType === 'global_command_center') {
          return <CommandCenterCard key={i} card={card} />;
      }
      if (card.cardType === 'memory_constellation') {
          return <MemoryConstellationCard key={i} card={card} />;
      }
      if (card.cardType === 'cyber_defense_map') {
          return <CyberDefenseMapCard key={i} card={card} />;
      }
      if (card.cardType === 'trend_hunter_ai') {
          return <TrendHunterCard key={i} card={card} />;
      }
      if (card.cardType === 'boardroom_meeting') {
          return <BoardroomMeetingCard key={i} card={card} />;
      }
      if (card.cardType === 'revenue_matrix') {
          return <RevenueMatrixCard key={i} card={card} />;
      }
      if (card.cardType === 'offline_ghost_mode') {
          return <OfflineGhostModeCard key={i} card={card} />;
      }
      if (card.cardType === 'lead_generator_hunter') {
          return <LeadGeneratorCard key={i} card={card} />;
      }
      if (card.cardType === 'system_log') {
          return (
              <div key={i} className="mt-4 bg-[#111] p-4 rounded-[16px] border border-blue-500/20 flex flex-col gap-2 font-mono text-left w-full md:w-[380px]" dir="ltr">
                  <div className="flex items-center gap-2">
                     <Terminal className="w-4 h-4 text-blue-400" />
                     <span className="text-blue-400 text-xs font-bold">{card.title || 'System Log'}</span>
                  </div>
                  <pre className="text-white/70 text-[10px] whitespace-pre-wrap">{card.description}</pre>
              </div>
          );
      }
      return (
        <div key={i} className={`mt-4 rounded-[22px] p-4 w-full md:w-[320px] bg-[#0f0f0f]/90 border border-white/10`}>
            <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-xl bg-white/10`}>{getCardIcon(card.cardType, card.number)}</div>
                <div><h3 className={`font-black text-xs text-white`}>{card.title}</h3><p className="text-[10px] text-white/50 truncate max-w-[200px]">{card.description}</p></div>
            </div>
            {(card.cardType === 'internal_nav' || card.url || card.cardType === 'deep_link_fallback') && (
                <button onClick={() => handleAppCardAction(card)} className={`w-full py-2.5 font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 text-xs border bg-white/10 hover:bg-white/20 text-white border-white/10`}>
                    {card.cardType === 'internal_nav' ? <Layout className="w-3 h-3" /> : <ExternalLink className="w-3 h-3" />}
                    {card.cardType === 'internal_nav' ? 'فتح الصفحة' : 'فتح الرابط'}
                </button>
            )}
        </div>
      );
};
