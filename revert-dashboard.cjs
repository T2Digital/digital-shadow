const fs = require('fs');
const _path = 'components/Dashboard.tsx';

let originalContent = `import React, { useEffect, useState, useRef } from 'react';
import { Brain, Target, Zap, Activity, Clock, Database, CheckCircle2, Globe, BookOpen, Lightbulb, Play, Pause, DollarSign, MessageSquare, LogOut, ChevronRight, Fingerprint, Crown, User, Briefcase, Cpu, Link as LinkIcon, Save, X, Trash2, Megaphone, ExternalLink, Info, Shield, Terminal, FolderOpen } from 'lucide-react';
import { shadowDB, DBTask, DBFact, UserProfile } from '../services/dbService';
import { playShadowVoice, stopVoice, getShadowVoice } from '../services/geminiService';
import SovereignVault from './SovereignVault';
import ApiKeysVault from './dashboard/ApiKeysVault';
import SystemOverride from './dashboard/SystemOverride';
import WorkspaceExplorer from './WorkspaceExplorer';
import { MemoryVault } from './MemoryVault';
import { TasksModal } from './dashboard/TasksModal';
import { WorkspaceModal } from './dashboard/WorkspaceModal';

// --- ORBITAL UI COMPONENTS ---
const OrbitalStyles = () => (
    <style>
        {\`
            @keyframes spin-slow {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes reverse-spin-slow {
              from { transform: rotate(360deg); }
              to { transform: rotate(0deg); }
            }
            
            .spinner {
              animation-name: spin-slow;
              animation-timing-function: linear;
              animation-iteration-count: infinite;
            }
            
            .anti-spinner {
              animation-name: reverse-spin-slow;
              animation-timing-function: linear;
              animation-iteration-count: infinite;
            }

            .space-map {
              background-image: 
                radial-gradient(circle at center, transparent 0%, #000 100%),
                linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
              background-size: 100% 100%, 60px 60px, 60px 60px;
              background-position: center center;
            }
            
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
        \`}
    </style>
);

const OrbitalRing: React.FC<{ radius: number, speed: number, children: React.ReactNode }> = ({ radius, speed, children }) => {
    const items = React.Children.toArray(children);
    return (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ width: radius*2, height: radius*2 }}>
            <div className="absolute inset-0 rounded-full border border-white/5 border-dashed opacity-40"></div>
            <div className="absolute top-1/2 left-1/2 w-0 h-0 flex items-center justify-center spinner" style={{ animationDuration: \`\${speed}s\` }}>
                {items.map((child, i) => {
                    const angle = (360 / items.length) * i;
                    return (
                        <div key={i} className="absolute pointer-events-auto" style={{ transform: \`rotate(\${angle}deg)\` }}>
                            <div className="absolute" style={{ transform: \`translateY(-\${radius}px)\` }}>
                                <div className="anti-spinner flex items-center justify-center" style={{ animationDuration: \`\${speed}s\` }}>
                                    <div style={{ transform: \`rotate(-\${angle}deg)\` }}>
                                        {child}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

interface SatelliteProps {
    icon?: any;
    label: string;
    value?: string | number;
    colorClass: string;
    bgClass: string;
    borderClass: string;
    onClick?: () => void;
    size?: string;
}

const SatelliteCard: React.FC<SatelliteProps> = ({ icon: Icon, label, value, colorClass, bgClass, borderClass, onClick, size = 'w-12 h-12 md:w-16 md:h-16' }) => (
    <div onClick={onClick} className={\`group relative \${size} rounded-full flex flex-col items-center justify-center backdrop-blur-md cursor-pointer transition-transform hover:scale-110 shadow-lg \${bgClass} \${borderClass} border\`}>
        {Icon && <Icon className={\`\${value !== undefined ? 'w-4 h-4 md:w-5 md:h-5' : 'w-1/2 h-1/2'} \${colorClass} relative z-10\`} />}
        {value !== undefined && <div className={\`mt-1 font-black text-[10px] md:text-sm leading-none \${colorClass}\`}>{value}</div>}
        <div className="absolute -bottom-12 opacity-0 group-hover:opacity-100 transition-all pointer-events-none flex flex-col items-center z-50">
             <span className={\`text-[9px] md:text-xs font-bold \${colorClass} bg-black/90 px-3 py-1.5 rounded-lg border \${borderClass} whitespace-nowrap shadow-xl uppercase tracking-widest\`}>
                 {label}
             </span>
        </div>
        <div className={\`absolute inset-0 rounded-full border border-white/5 opacity-50 group-hover:animate-ping\`}></div>
    </div>
);

// --- END ORBITAL COMPONENTS ---

interface Props {
  user: UserProfile;
  initialAction?: string | null;
  onClearAction?: () => void;
  onOpenChat: () => void;
  onOpenAffiliate: () => void;
  onLogout: () => void;
  onUpgrade?: () => void; 
  onStartAffiliate?: () => void; 
}

const Dashboard: React.FC<Props> = ({ user, initialAction, onClearAction, onOpenChat, onOpenAffiliate, onLogout, onUpgrade, onStartAffiliate }) => {
  const [tasks, setTasks] = useState<DBTask[]>([]);
  const [memory, setMemory] = useState<DBFact[]>([]);
  const [syncRate, setSyncRate] = useState(0);
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'playing'>('idle');
  
  // Nexus / IoT Modal State
  const [showNexusConfig, setShowNexusConfig] = useState(false);
  const [iotActions, setIotActions] = useState<{ [key: string]: string }>(user.iotActions || {});
  const [newActionKey, setNewActionKey] = useState('');
  const [newActionUrl, setNewActionUrl] = useState('');

  // Vault State
  const [showVault, setShowVault] = useState(false);
  const [showApiVault, setShowApiVault] = useState(false);
  const [showSystemOverride, setShowSystemOverride] = useState(false);
  const [showWorkspace, setShowWorkspace] = useState(false);
  const [showTasksModal, setShowTasksModal] = useState(false);
  const [showMemoryModal, setShowMemoryModal] = useState(false);
  const [selectedTaskIdx, setSelectedTaskIdx] = useState<number | null>(null);

  const [editingTask, setEditingTask] = useState<DBTask | null>(null);

  // --- IDENTITY RESOLVER ---
  const getIdentity = () => {
      if (user.phone === 'GUEST') {
          return { label: 'زائر مؤقت', sub: 'Guest Access', color: 'text-white/60', bg: 'bg-white/10', border: 'border-white/10', icon: User };
      }
      if (user.affiliate?.isMarketer && user.tier === 'lite') {
          return { label: 'شريك نجاح', sub: 'Affiliate Partner', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: Briefcase };
      }
      if (user.email === 'admin@shadow.com') {
          return { label: 'الماستر', sub: 'System Admin', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: Crown };
      }
      return { label: 'عضو نخبة', sub: 'Sovereign Tier', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', icon: Fingerprint };
  };

  const identity = getIdentity();

  // Handle Deep Links
  useEffect(() => {
      if (initialAction) {
          if (initialAction === 'open_vault') {
              setShowVault(true);
          } else if (initialAction === 'open_nexus') {
              setShowNexusConfig(true);
          }
          if (onClearAction) onClearAction();
      }
  }, [initialAction]);

  useEffect(() => {
    loadData();
    // NOTE: Alarm Logic Moved to App.tsx to run globally.
  }, []);

  const loadData = async () => {
        // FETCH DATA FOR SPECIFIC USER ID
        const [allTasks, allMemory, rate] = await Promise.all([
            shadowDB.getTasks(user.phone), 
            shadowDB.getMemory(user.phone),
            shadowDB.getSyncStats()
        ]);
        setTasks(allTasks.reverse());
        setMemory(allMemory.reverse());
        setSyncRate(rate);
  };

  const handleVoiceGreeting = async () => {
      setVoiceStatus('playing');
      const name = user.name.split(' ')[0];
      const gender = user.voicePreference || 'male'; 
      
      const greeting = \`يا ريس، أنا مش مجرد تطبيق.. أنا ظلك.
      عقلك التاني اللي مبيناش.
      شيل من دماغك، وارميه عليا.
      أنا هنا عشان أحفظ أسرارك، وأدير حياتك، وأخليك دايماً سابق بخطوة.
      صباحك زي الفل يا \${name}.. أنا جاهز.\`;
      
      await playShadowVoice(greeting, gender, undefined, () => setVoiceStatus('idle'));
  };

  const toggleVoice = () => {
      if (voiceStatus === 'playing') { stopVoice(); setVoiceStatus('idle'); } else { handleVoiceGreeting(); }
  };

  // --- NEXUS CONFIG LOGIC ---
  const saveAction = async () => {
      if (!newActionKey || !newActionUrl) return;
      // Normalize key to be AI friendly (replace spaces with underscores)
      const cleanKey = newActionKey.trim().replace(/\\s+/g, '_').toLowerCase();
      const updatedActions = { ...iotActions, [cleanKey]: newActionUrl };
      setIotActions(updatedActions);
      const updatedUser = { ...user, iotActions: updatedActions };
      await shadowDB.saveProfile(updatedUser);
      setNewActionKey('');
      setNewActionUrl('');
  };

  const deleteAction = async (key: string) => {
      const updatedActions = { ...iotActions };
      delete updatedActions[key];
      setIotActions(updatedActions);
      const updatedUser = { ...user, iotActions: updatedActions };
      await shadowDB.saveProfile(updatedUser);
  };

  const isAdmin = user.email === 'admin@shadow.com' || user.email === 'TITO' || user.email === 'tito@shadow.com';

  return (
    <div className="h-full w-full bg-[#020202] text-white font-['Cairo'] overflow-auto scrollbar-hide space-map relative">
        <OrbitalStyles />
        
        {/* Responsive scaling container to allow panning/scrolling or fitting on desktop */}
        <div className="relative min-w-[800px] min-h-[800px] w-full h-full flex items-center justify-center overflow-hidden">
            
            {/* --- THE CORE (SUN) --- */}
            <div 
                onClick={onOpenChat}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 md:w-48 md:h-48 rounded-full bg-gradient-to-br from-purple-900/60 to-black border border-purple-500/50 flex flex-col items-center justify-center cursor-pointer group shadow-[0_0_80px_rgba(168,85,247,0.3)] z-50 hover:scale-110 hover:shadow-[0_0_120px_rgba(168,85,247,0.5)] transition-all"
            >
                <div className="absolute inset-0 rounded-full bg-purple-500/20 animate-ping opacity-30"></div>
                <div className="absolute inset-4 rounded-full bg-purple-500/10 blur-xl group-hover:bg-purple-500/30 transition-all"></div>
                
                <Brain className="w-10 h-10 md:w-14 md:h-14 text-white fill-purple-300/30 relative z-10 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-white text-xs md:text-xl font-black tracking-widest uppercase relative z-10 drop-shadow-md">الظل الرقمي</span>
                <span className="text-[8px] md:text-xs text-purple-300 font-bold uppercase relative z-10 tracking-[0.3em] mt-1">
                    {user.phone === 'GUEST' ? 'تجربة محدودة' : 'الدخول للاجتماع'}
                </span>
            </div>

            {/* --- ORBIT 1: INNER (Speed: 40s) --- */}
            {user.phone !== 'GUEST' && (
                <OrbitalRing radius={160} speed={40}>
                    <SatelliteCard 
                        icon={Target} label="المهام الشغالة" value={tasks.filter(t => t.status === 'pending').length} 
                        colorClass="text-amber-500" bgClass="bg-amber-500/10" borderClass="border-amber-500/30" onClick={() => setShowTasksModal(true)} 
                    />
                    <SatelliteCard 
                        icon={Database} label="الذاكرة والأسرار" value={memory.length} 
                        colorClass="text-purple-500" bgClass="bg-purple-500/10" borderClass="border-purple-500/30" onClick={() => setShowMemoryModal(true)} 
                    />
                    <SatelliteCard 
                        icon={Activity} label="تزامن النظام" value={syncRate + '%'} 
                        colorClass="text-cyan-500" bgClass="bg-cyan-500/10" borderClass="border-cyan-500/30" 
                    />
                    <SatelliteCard 
                        icon={Shield} label="خزينة المفاتيح API" 
                        colorClass="text-emerald-500" bgClass="bg-emerald-500/10" borderClass="border-emerald-500/30" onClick={() => setShowApiVault(true)} 
                    />
                </OrbitalRing>
            )}

            {/* --- ORBIT 2: MIDDLE (Speed: 55s) --- */}
            <OrbitalRing radius={260} speed={55}>
                <SatelliteCard 
                    icon={identity.icon} label={identity.label} 
                    colorClass={identity.color} bgClass={identity.bg} borderClass={identity.border} onClick={() => setShowVault(true)} size="w-14 h-14 md:w-20 md:h-20"
                />
                
                {user.phone === 'GUEST' ? (
                    <SatelliteCard 
                        icon={Megaphone} label="سوق للظل واربح" 
                        colorClass="text-emerald-400" bgClass="bg-emerald-500/10" borderClass="border-emerald-500/30" onClick={onStartAffiliate} size="w-14 h-14 md:w-20 md:h-20"
                    />
                ) : (
                    <SatelliteCard 
                        icon={DollarSign} label="بيزنس العيلة (تسويق)" 
                        colorClass="text-emerald-400" bgClass="bg-emerald-500/10" borderClass="border-emerald-500/30" onClick={onOpenAffiliate} size="w-14 h-14 md:w-20 md:h-20"
                    />
                )}

                {user.phone === 'GUEST' ? (
                    <SatelliteCard 
                        icon={Crown} label="انضم للنخبة (ترقية)" 
                        colorClass="text-white" bgClass="bg-white/10" borderClass="border-white/30" onClick={onUpgrade} size="w-14 h-14 md:w-20 md:h-20"
                    />
                ) : ((user.tier === 'sovereign' || user.phone === 'TITO') ? (
                    <SatelliteCard 
                        icon={Cpu} label="نكسوس (التحكم المنزلي IoT)" 
                        colorClass="text-cyan-400" bgClass="bg-cyan-500/10" borderClass="border-cyan-500/30" onClick={() => setShowNexusConfig(true)} size="w-14 h-14 md:w-20 md:h-20"
                    />
                ) : (
                   <SatelliteCard 
                        icon={Crown} label="انضم للنخبة (ترقية)" 
                        colorClass="text-white" bgClass="bg-white/10" borderClass="border-white/30" onClick={onUpgrade} size="w-14 h-14 md:w-20 md:h-20"
                    />
                ))}
            </OrbitalRing>

            {/* --- ORBIT 3: OUTER (Speed: 80s) --- */}
            <OrbitalRing radius={360} speed={80}>
                <SatelliteCard 
                    icon={voiceStatus === 'playing' ? Pause : Play} label="رسالة التوجيه (صوت الظل)" 
                    colorClass={voiceStatus === 'playing' ? 'text-amber-500' : 'text-white/40'} 
                    bgClass={voiceStatus === 'playing' ? 'bg-amber-500/20' : 'bg-white/5'} 
                    borderClass={voiceStatus === 'playing' ? 'border-amber-500/50' : 'border-white/10'} 
                    onClick={toggleVoice} 
                />
                
                {isAdmin ? (
                    <SatelliteCard 
                        icon={Terminal} label="النظام الداخلي (Override)" 
                        colorClass="text-red-500" bgClass="bg-red-900/20" borderClass="border-red-500/30" onClick={() => setShowSystemOverride(true)} 
                    />
                ) : <div className="hidden" />}
                
                {isAdmin ? (
                    <SatelliteCard 
                        icon={FolderOpen} label="مساحة العمل (Workspace)" 
                        colorClass="text-purple-500" bgClass="bg-purple-900/20" borderClass="border-purple-500/30" onClick={() => setShowWorkspace(true)} 
                    />
                ) : <div className="hidden" />}
                
                <SatelliteCard 
                    icon={LogOut} label="خروج مؤقت" 
                    colorClass="text-gray-400" bgClass="bg-white/5" borderClass="border-white/10" onClick={onLogout} 
                />
            </OrbitalRing>
        </div>

        {/* --- MODALS REUSED EXACTLY AS BEFORE --- */}
        {showVault && (
            <SovereignVault user={user} onVaultReady={() => setShowVault(false)} />
        )}

        {showApiVault && (
            <ApiKeysVault user={user} onClose={() => setShowApiVault(false)} onSave={(updatedUser) => {
                setShowApiVault(false);
            }} />
        )}

        {showNexusConfig && (
            <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in zoom-in">
                <div className="w-full max-w-2xl bg-[#080808] border border-cyan-500/20 rounded-[40px] p-8 relative shadow-[0_0_50px_rgba(6,182,212,0.1)] overflow-y-auto max-h-[90vh] scrollbar-hide">
                    <button onClick={() => setShowNexusConfig(false)} className="absolute top-6 left-6 p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><X className="w-5 h-5 text-white/50" /></button>
                    
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-cyan-900/20 rounded-xl border border-cyan-500/30">
                            <Cpu className="w-8 h-8 text-cyan-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white">إعدادات التحكم المنزلي</h2>
                            <p className="text-cyan-200/50 text-xs font-bold uppercase tracking-widest">Smart Home / IoT Nexus</p>
                        </div>
                    </div>

                    <div className="bg-white/5 p-5 rounded-[24px] border border-white/5 mb-6">
                        <h4 className="flex items-center gap-2 text-sm font-black text-white mb-2">
                             <Info className="w-4 h-4 text-cyan-400" />
                             طريقة الربط (eWeLink / Tuya):
                        </h4>
                        <ol className="text-xs text-white/70 space-y-3 list-decimal list-inside leading-relaxed p-2">
                            <li>ادخل موقع <b>IFTTT.com</b> واعمل Create New Applet.</li>
                            <li>في خانة (If This) اختار <b>Webhooks</b>، وسمي الحدث (مثلاً: <span className="text-amber-400 font-mono">room_light</span>).</li>
                            <li>في خانة (Then That) اختار <b>eWeLink</b> أو <b>Smart Life</b> وحدد الجهاز (مثلاً: اللمبة تشتغل).</li>
                            <li>انسخ رابط الويب هوك (Webhook URL) من إعدادات IFTTT.</li>
                            <li>ضيف الرابط ده هنا تحت، بنفس الاسم اللي اخترته (room_light).</li>
                            <li>قول للظل: "ولع نور الغرفة"، وهو هينفذ فوراً.</li>
                        </ol>
                        <p className="text-[10px] text-white/40 mt-3 font-medium">ملاحظة: هذه هي الطريقة المعيارية لربط الأجهزة الذكية عبر الإنترنت بدون Hardware Hub خاص.</p>
                        <a href="https://ifttt.com/maker_webhooks" target="_blank" className="inline-flex items-center gap-1 mt-3 px-4 py-2 bg-cyan-900/30 rounded-lg text-xs font-bold text-cyan-400 hover:text-cyan-300 border border-cyan-500/20">
                            فتح موقع IFTTT للإعداد <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>

                    <div className="space-y-4 mb-6">
                        {Object.entries(iotActions).map(([key, url]) => (
                            <div key={key} className="flex items-center gap-3 p-3 bg-[#111] rounded-2xl border border-white/5">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Zap className="w-3 h-3 text-amber-500" />
                                        <span className="text-sm font-bold text-white">{key}</span>
                                    </div>
                                    <span className="text-[10px] text-white/30 font-mono truncate block max-w-[200px] md:max-w-md">{url}</span>
                                </div>
                                <button onClick={() => deleteAction(key)} className="p-2 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        ))}
                    </div>

                    <div className="bg-[#151515] p-4 rounded-[24px] border border-white/10">
                        <h4 className="text-xs font-black text-white/50 mb-3 uppercase">إضافة جهاز جديد</h4>
                        <div className="flex flex-col gap-3">
                            <input 
                                type="text" 
                                placeholder="اسم الأمر (مثلاً: living_room)" 
                                value={newActionKey} 
                                onChange={(e) => setNewActionKey(e.target.value)} 
                                className="bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-cyan-500/50 outline-none" 
                            />
                            <input 
                                type="text" 
                                placeholder="رابط الويب هوك (Webhook URL)" 
                                value={newActionUrl} 
                                onChange={(e) => setNewActionUrl(e.target.value)} 
                                className="bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-cyan-500/50 outline-none font-mono" 
                            />
                            <button onClick={saveAction} className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/20">
                                <Save className="w-4 h-4" /> حفظ الجهاز
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        )}

        {showSystemOverride && (
          <SystemOverride 
            user={user} 
            onClose={() => setShowSystemOverride(false)} 
            onSave={() => setShowSystemOverride(false)} 
          />
        )}

        {showTasksModal && (
            <TasksModal 
                tasks={tasks}
                onClose={() => setShowTasksModal(false)}
                onTasksChanged={loadData}
            />
        )}

        {showMemoryModal && (
            <MemoryVault onClose={() => setShowMemoryModal(false)} />
        )}

        {showWorkspace && (
            <WorkspaceModal user={user} onClose={() => setShowWorkspace(false)} />
        )}

    </div>
  );
};

export default Dashboard;
`;

fs.writeFileSync(_path, originalContent, 'utf8');
console.log('Restoration complete!');
