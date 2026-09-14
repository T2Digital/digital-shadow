import React, { useEffect, useState, useRef } from 'react';
import { Brain, Target, Zap, Activity, Clock, Database, CheckCircle2, Globe, BookOpen, Lightbulb, Play, Pause, DollarSign, MessageSquare, LogOut, ChevronRight, Fingerprint, Crown, User, Briefcase, Cpu, Link as LinkIcon, Save, X, Trash2, Megaphone, ExternalLink, Info, Shield, Terminal, FolderOpen, Wallet, Mic, Music } from 'lucide-react';
import { shadowDB, DBTask, DBFact, UserProfile } from '../services/dbService';
import { playShadowVoice, stopVoice, getShadowVoice } from '../services/geminiService';
import SovereignVault from './SovereignVault';
import ApiKeysVault from './dashboard/ApiKeysVault';
import SystemOverride from './dashboard/SystemOverride';
import WorkspaceExplorer from './WorkspaceExplorer';
import { MemoryVault } from './MemoryVault';
import { TasksModal } from './dashboard/TasksModal';
import { WorkspaceModal } from './dashboard/WorkspaceModal';
import { BrandManagerModal } from './dashboard/BrandManagerModal';
import { ShadowWalletModal } from './dashboard/ShadowWalletModal';
import { LiveSessionModal } from './dashboard/LiveSessionModal';
import { BrainRouterModal } from './dashboard/BrainRouterModal';
import { ProactiveReportsModal } from './dashboard/ProactiveReportsModal';
import { SocialMatrixModal } from './dashboard/SocialMatrixModal';
import { ContactsManagerModal } from './dashboard/ContactsManagerModal';
import { TafraDashboard } from './TafraDashboard';
import { Network, ActivitySquare, Share2, Orbit, Users, Phone } from 'lucide-react';
import { ResearchCenterModal, AdvisoryBoardModal, HologramModal } from './dashboard/MissingFeaturesModals';
import { MusicVaultModal } from './dashboard/MusicVaultModal';
import { AutonomousManager } from './AutonomousManager';

// --- ORBITAL UI COMPONENTS ---
const OrbitalStyles = () => (
    <style>
        {`
            @keyframes float-depth {
              0%, 100% { transform: translateY(0px) scale(1.0); }
              50% { transform: translateY(-15px) scale(1.1); filter: drop-shadow(0 20px 30px rgba(0,0,0,0.5)); }
            }
            @keyframes core-pulse {
              0%, 100% { transform: translate(-50%, -50%) scale(1); box-shadow: 0 0 80px rgba(168,85,247,0.3); }
              50% { transform: translate(-50%, -50%) scale(1.05); box-shadow: 0 0 120px rgba(168,85,247,0.6); }
            }
            .floater {
              animation: float-depth 6s ease-in-out infinite alternate;
              transform-style: preserve-3d;
              will-change: transform;
            }
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
        `}
    </style>
);

interface SatelliteProps {
    id: string;
    icon?: any;
    label: string;
    value?: string | number;
    colorClass: string;
    bgClass: string;
    borderClass: string;
    onClick?: () => void;
    size?: string;
    onDragStart: (id: string, e: React.PointerEvent) => void;
}

const SatelliteCard: React.FC<SatelliteProps> = ({ id, icon: Icon, label, value, colorClass, bgClass, borderClass, onClick, size = 'w-32 h-32 lg:w-40 lg:h-40', onDragStart }) => (
    <div 
        onPointerDown={(e) => onDragStart(id, e)}
        onClick={onClick} 
        className={`group relative ${size} rounded-full flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-125 shadow-lg ${bgClass} ${borderClass} border backdrop-blur-md canvas-bypass`}
    >
        {Icon && <Icon className={`${value !== undefined ? 'w-10 h-10 lg:w-14 lg:h-14' : 'w-1/2 h-1/2'} ${colorClass} relative z-10 transition-transform duration-[10s] ease-linear`} />}
        {value !== undefined && <div className={`mt-1 font-black text-xl lg:text-3xl leading-none ${colorClass}`}>{value}</div>}
        <div className="absolute -bottom-16 opacity-0 group-hover:opacity-100 transition-all pointer-events-none flex flex-col items-center z-50">
             <span className={`text-sm lg:text-lg font-bold ${colorClass} bg-black/90 px-4 py-2 rounded-xl border ${borderClass} whitespace-nowrap shadow-[0_10px_30px_rgba(0,0,0,0.8)] uppercase tracking-widest`}>
                 {label}
             </span>
        </div>
        <div className="absolute inset-0 rounded-full border border-white/5 opacity-50 group-hover:animate-ping"></div>
    </div>
);

interface Props {
  user: UserProfile;
  initialAction?: string | null;
  onClearAction?: () => void;
  onOpenChat: () => void;
  onOpenAffiliate: () => void;
  onLogout: () => void;
  onUpgrade?: () => void; 
  onStartAffiliate?: () => void; 
  onOpenWorkspace?: () => void;
}

const ORBIT_RADII = [220, 360, 500];
const ORBIT_SPEEDS = [0.005, -0.003, 0.002]; // radians per frame

import { VoiceSecurityGate } from './VoiceSecurityGate';

  // inside the Dashboard functional component:
const Dashboard: React.FC<Props> = ({ user, initialAction, onClearAction, onOpenChat, onOpenAffiliate, onLogout, onUpgrade, onStartAffiliate, onOpenWorkspace }) => {
  const [tasks, setTasks] = useState<DBTask[]>([]);
  const [memory, setMemory] = useState<DBFact[]>([]);
  const [syncRate, setSyncRate] = useState(0);
  const [liveSync, setLiveSync] = useState("0.00");
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'playing'>('idle');
  
  // Voice Gate
  const [pendingSecureAction, setPendingSecureAction] = useState<'nexus' | 'admin' | null>(null);

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
  const [showBrandsModal, setShowBrandsModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showAutonomousManager, setShowAutonomousManager] = useState(false);
  const [showLiveModal, setShowLiveModal] = useState(false);
  const [showBrainRouter, setShowBrainRouter] = useState(false);
  const [showProactiveReports, setShowProactiveReports] = useState(false);
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [showHologram, setShowHologram] = useState(false);
  const [showResearch, setShowResearch] = useState(false);
  const [showAdvisory, setShowAdvisory] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const [showTafraDashboard, setShowTafraDashboard] = useState(false);
  const [showMusicVault, setShowMusicVault] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Identity Resolver
  const getIdentity = () => {
      if (user.phone === 'GUEST') return { label: 'زائر مؤقت', sub: 'Guest Access', color: 'text-white/60', bg: 'bg-white/10', border: 'border-white/10', icon: User };
      if (user.affiliate?.isMarketer && user.tier === 'lite') return { label: 'شريك نجاح', sub: 'Affiliate Partner', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: Briefcase };
      if (user.email === 'admin@shadow.com') return { label: 'الماستر', sub: 'System Admin', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: Crown };
      return { label: 'عضو نخبة', sub: 'Sovereign Tier', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', icon: Fingerprint };
  };
  const identity = getIdentity();
  const isAdmin = user.email === 'admin@shadow.com' || user.email === 'TITO' || user.email === 'tito@shadow.com';

  // ORBITAL DRAG & DROP STATE
  const [orbitMap, setOrbitMap] = useState<Record<string, number>>({
      'tasks': 0, 'memory': 0, 'sync': 0, 'vault': 0, 'contacts': 0, 'music_vault': 0,
      'brains': 0, 'reports': 0, 'contentMachine': 0, 'podcast': 0,
      'identity': 1, 'affiliate': 1, 'upgrade': 1, 'social': 1,
      'voice': 2, 'override': 2, 'workspace': 2, 'logout': 2, 'nexus': 1, 'brands': 0, 'wallet': 0, 'live': 1,
      'hologram': 0, 'research': 1, 'advisory': 1
  });

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartTimer = useRef<any>(null);
  const dragStartPos = useRef<{ x: number, y: number } | null>(null);
  const satelliteRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const orbitAngles = useRef<number[]>([0, 0, 0]);

  // Keep latest state mapped for RAF
  const activeOrbitGroups = useRef<Record<number, any[]>>({ 0: [], 1: [], 2: [] });
  const activeDraggingId = useRef(draggingId);
  const activeDragPos = useRef(dragPos);

  useEffect(() => { activeDraggingId.current = draggingId; activeDragPos.current = dragPos; }, [draggingId, dragPos]);

  useEffect(() => {
      let interval = setInterval(() => {
         setLiveSync((syncRate + (Math.random() * 0.1) - 0.05).toFixed(2));
      }, 500);
      return () => clearInterval(interval);
  }, [syncRate]);

  useEffect(() => {
      let frame: number;
      const loop = () => {
          orbitAngles.current[0] += ORBIT_SPEEDS[0];
          orbitAngles.current[1] += ORBIT_SPEEDS[1];
          orbitAngles.current[2] += ORBIT_SPEEDS[2];
          
          Object.keys(activeOrbitGroups.current).forEach(orbitIdxStr => {
              const orbitIdx = parseInt(orbitIdxStr);
              const items = activeOrbitGroups.current[orbitIdx];
              const r = ORBIT_RADII[orbitIdx];
              const currentAngleOffset = orbitAngles.current[orbitIdx];
              
              items.forEach((item, i) => {
                  const el = satelliteRefs.current[item.id];
                  if (!el) return;

                  if (activeDraggingId.current === item.id) {
                      el.style.transform = `translate3d(${activeDragPos.current.x}px, ${activeDragPos.current.y}px, 0)`;
                  } else {
                      const spreadAngle = (Math.PI * 2) / items.length;
                      const elementAngle = currentAngleOffset + (spreadAngle * i);
                      const x = Math.cos(elementAngle) * r;
                      const y = Math.sin(elementAngle) * r;
                      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
                  }
              });
          });
          
          frame = requestAnimationFrame(loop);
      };
      frame = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(frame);
  }, []);

  const handlePointerDown = (id: string, e: React.PointerEvent) => {
      // Long press detection
      e.stopPropagation();
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const scale = rect.width / 1200;
      const x = (e.clientX - rect.left - rect.width / 2) / scale;
      const y = (e.clientY - rect.top - rect.height / 2) / scale;
      
      dragStartPos.current = { x: e.clientX, y: e.clientY };
      
      dragStartTimer.current = setTimeout(() => {
          setDraggingId(id);
          setDragPos({ x, y });
      }, 250); // 250ms long press to drag
  };

  const handleGlobalPointerMove = (e: PointerEvent) => {
      if (!draggingId && dragStartTimer.current && dragStartPos.current) {
          const dx = e.clientX - dragStartPos.current.x;
          const dy = e.clientY - dragStartPos.current.y;
          if (Math.hypot(dx, dy) > 10) {
              clearTimeout(dragStartTimer.current);
              dragStartTimer.current = null;
          }
      }
      if (draggingId) {
          const rect = containerRef.current?.getBoundingClientRect();
          if (!rect) return;
          const scale = rect.width / 1200;
          const x = (e.clientX - rect.left - rect.width / 2) / scale;
          const y = (e.clientY - rect.top - rect.height / 2) / scale;
          setDragPos({ x, y });
      }
  };

  const handleGlobalPointerUp = (e: PointerEvent) => {
      if (dragStartTimer.current) {
          clearTimeout(dragStartTimer.current);
          dragStartTimer.current = null;
      }
      if (draggingId) {
          // Snap to nearest orbit
          const dist = Math.hypot(dragPos.x, dragPos.y);
          let targetOrbit = 0;
          let minDist = Infinity;
          ORBIT_RADII.forEach((r, i) => {
              const d = Math.abs(dist - r);
              if (d < minDist) {
                  minDist = d;
                  targetOrbit = i;
              }
          });
          
          setOrbitMap(prev => ({ ...prev, [draggingId]: targetOrbit }));
          setDraggingId(null);
      }
  };

  useEffect(() => {
      window.addEventListener('pointermove', handleGlobalPointerMove);
      window.addEventListener('pointerup', handleGlobalPointerUp);
      return () => {
          window.removeEventListener('pointermove', handleGlobalPointerMove);
          window.removeEventListener('pointerup', handleGlobalPointerUp);
      };
  }, [draggingId, dragPos]);

  useEffect(() => {
      if (initialAction) {
          if (initialAction === 'open_vault') setShowVault(true);
          else if (initialAction === 'open_nexus') setShowNexusConfig(true);
          if (onClearAction) onClearAction();
      }
      loadData();
  }, [initialAction]);

  useEffect(() => {
      const handleDbUpdate = () => {
          console.log("[Dashboard Sync] Live update triggered!");
          loadData();
      };

      const handleOpenModal = (e: Event) => {
          const customEvent = e as CustomEvent;
          const modal = customEvent.detail?.modal;
          if (modal) {
              console.log(`[Dashboard Sync] Direct modal navigation: ${modal}`);
              if (modal === 'music_vault') setShowMusicVault(true);
              else if (modal === 'tasks') setShowTasksModal(true);
              else if (modal === 'memory') setShowMemoryModal(true);
              else if (modal === 'contacts') setShowContacts(true);
              else if (modal === 'brands') setShowBrandsModal(true);
              else if (modal === 'wallet') setShowWalletModal(true);
              else if (modal === 'live') setShowLiveModal(true);
              else if (modal === 'workspace') setShowWorkspace(true);
              else if (modal === 'vault') setShowVault(true);
              else if (modal === 'api_vault') setShowApiVault(true);
              else if (modal === 'brain_router') setShowBrainRouter(true);
              else if (modal === 'social') setShowSocialModal(true);
              else if (modal === 'hologram') setShowHologram(true);
              else if (modal === 'research') setShowResearch(true);
              else if (modal === 'advisory') setShowAdvisory(true);
              else if (modal === 'tafra') setShowTafraDashboard(true);
          }
      };

      window.addEventListener('shadow_db_updated', handleDbUpdate);
      window.addEventListener('shadow_open_modal', handleOpenModal);

      return () => {
          window.removeEventListener('shadow_db_updated', handleDbUpdate);
          window.removeEventListener('shadow_open_modal', handleOpenModal);
      };
  }, [user.phone, user.email]);

  const loadData = async () => {
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
      const greeting = `يا ريس، أنا مش مجرد تطبيق.. أنا ظلك.
      عقلك التاني اللي مبيناش.
      شيل من دماغك، وارميه عليا.
      أنا هنا عشان أحفظ أسرارك، وأدير حياتك، وأخليك دايماً سابق بخطوة.
      صباحك زي الفل يا ${name}.. أنا جاهز.`;
      await playShadowVoice(greeting, gender, undefined, () => setVoiceStatus('idle'));
  };

  const toggleVoice = () => {
      if (voiceStatus === 'playing') { stopVoice(); setVoiceStatus('idle'); } else { handleVoiceGreeting(); }
  };

  // Nexus Config
  const saveAction = async () => {
      if (!newActionKey || !newActionUrl) return;
      const cleanKey = newActionKey.trim().replace(/\s+/g, '_').toLowerCase();
      const updatedActions = { ...iotActions, [cleanKey]: newActionUrl };
      setIotActions(updatedActions);
      await shadowDB.saveProfile({ ...user, iotActions: updatedActions });
      setNewActionKey('');
      setNewActionUrl('');
  };

  const deleteAction = async (key: string) => {
      const updatedActions = { ...iotActions };
      delete updatedActions[key];
      setIotActions(updatedActions);
      await shadowDB.saveProfile({ ...user, iotActions: updatedActions });
  };

  // Define available items based on auth
  const allItems = [
      ...(user.phone !== 'GUEST' ? [
          { id: 'tasks', icon: Target, label: "المهام الشغالة", value: tasks.filter(t => t.status === 'pending').length, colorClass: "text-amber-500", bgClass: "bg-amber-500/10", borderClass: "border-amber-500/30", onClick: () => setShowTasksModal(true) },
          { id: 'phone_agent', icon: Phone, label: "هاتف الظل والحجز الذاتي 📞", colorClass: "text-cyan-400 animate-pulse", bgClass: "bg-cyan-500/20", borderClass: "border-cyan-500/50", onClick: () => setShowAutonomousManager(true) },
          { id: 'memory', icon: Database, label: "الذاكرة والأسرار", value: memory.length, colorClass: "text-purple-500", bgClass: "bg-purple-500/10", borderClass: "border-purple-500/30", onClick: () => setShowMemoryModal(true) },
          { id: 'contacts', icon: Phone, label: "جهات الاتصال (كاسبو)", colorClass: "text-emerald-500", bgClass: "bg-emerald-500/10", borderClass: "border-emerald-500/30", onClick: () => setShowContacts(true) },
          { id: 'brands', icon: Briefcase, label: "إدارة البراندات", value: undefined, colorClass: "text-pink-500", bgClass: "bg-pink-500/10", borderClass: "border-pink-500/30", onClick: () => setShowBrandsModal(true) },
          { id: 'wallet', icon: Wallet, label: "محفظة السرب ₿", value: "ETH", colorClass: "text-emerald-500", bgClass: "bg-emerald-500/10", borderClass: "border-emerald-500/30", onClick: () => setShowWalletModal(true) },
          { id: 'live', icon: Mic, label: "الجلسة الحية المتصلة 🎙️", colorClass: "text-blue-500", bgClass: "bg-blue-500/10", borderClass: "border-blue-500/30", onClick: () => setShowLiveModal(true) },
          { id: 'social', icon: Share2, label: "الشبكة العنكبوتية (Social Matrix)", colorClass: "text-blue-400", bgClass: "bg-blue-500/10", borderClass: "border-blue-500/30", onClick: () => setShowSocialModal(true) },
          { id: 'vault', icon: Shield, label: "مفاتيح API", colorClass: "text-red-500", bgClass: "bg-red-500/10", borderClass: "border-red-500/30", onClick: () => setShowApiVault(true) },
          { id: 'music_vault', icon: Music, label: "ألبوم الأغاني 🎵", colorClass: "text-fuchsia-400", bgClass: "bg-fuchsia-500/10", borderClass: "border-fuchsia-500/30", onClick: () => setShowMusicVault(true) },
          { id: 'sync', icon: Activity, label: "تزامن النظام", value: liveSync + '%', colorClass: "text-cyan-500", bgClass: "bg-cyan-500/10", borderClass: "border-cyan-500/30" },
          { id: 'tafra', icon: Cpu, label: "تحديث الطفرة ⚡", colorClass: "text-purple-400 animate-pulse", bgClass: "bg-purple-500/10", borderClass: "border-purple-500/30", onClick: () => setShowTafraDashboard(true) },
      ] : []),
      { id: 'hologram', icon: Orbit, label: "غرفة الهولوجرام", colorClass: "text-purple-400", bgClass: "bg-purple-500/10", borderClass: "border-purple-500/30", onClick: () => setShowHologram(true) },
      { id: 'research', icon: BookOpen, label: "مركز أبحاث الظل", colorClass: "text-blue-400", bgClass: "bg-blue-500/10", borderClass: "border-blue-500/30", onClick: () => setShowResearch(true) },
      { id: 'advisory', icon: Users, label: "مجلس استشاري الظل", colorClass: "text-amber-400", bgClass: "bg-amber-500/10", borderClass: "border-amber-500/30", onClick: () => setShowAdvisory(true) },
      { id: 'identity', icon: identity.icon, label: identity.label, colorClass: identity.color, bgClass: identity.bg, borderClass: identity.border, onClick: () => setShowVault(true) },
      { id: 'affiliate', icon: user.phone === 'GUEST' ? Megaphone : DollarSign, label: user.phone === 'GUEST' ? "سوق للظل واربح" : "بيزنس العيلة (تسويق)", colorClass: "text-emerald-400", bgClass: "bg-emerald-500/10", borderClass: "border-emerald-500/30", onClick: user.phone === 'GUEST' ? onStartAffiliate : onOpenAffiliate },
      ...((user.tier === 'sovereign' || user.phone === 'TITO') ? [
          { id: 'nexus', icon: Cpu, label: "نكسوس (التحكم المنزلي IoT)", colorClass: "text-cyan-400", bgClass: "bg-cyan-500/10", borderClass: "border-cyan-500/30", onClick: () => setPendingSecureAction('nexus') },
          { id: 'brains', icon: Network, label: "محرك العقول الشامل", colorClass: "text-indigo-400", bgClass: "bg-indigo-500/10", borderClass: "border-indigo-500/30", onClick: () => setShowBrainRouter(true) },
          { id: 'reports', icon: ActivitySquare, label: "الوعي الزمني (التقارير)", colorClass: "text-green-400", bgClass: "bg-green-500/10", borderClass: "border-green-500/30", onClick: () => setShowProactiveReports(true) },
          { id: 'contentMachine', icon: Play, label: "ماكينة المحتوى الذكية", colorClass: "text-red-400", bgClass: "bg-red-500/10", borderClass: "border-red-500/30" },
          { id: 'podcast', icon: Mic, label: "بودكاست الظل و آدم", colorClass: "text-blue-400", bgClass: "bg-blue-500/10", borderClass: "border-blue-500/30" }
      ] : [
          { id: 'upgrade', icon: Crown, label: "انضم للنخبة (ترقية)", colorClass: "text-white", bgClass: "bg-white/10", borderClass: "border-white/30", onClick: onUpgrade }
      ]),
      { id: 'voice', icon: voiceStatus === 'playing' ? Pause : Play, label: "رسالة التوجيه (صوت الظل)", colorClass: voiceStatus === 'playing' ? 'text-amber-500' : 'text-white/40', bgClass: voiceStatus === 'playing' ? 'bg-amber-500/20' : 'bg-white/5', borderClass: voiceStatus === 'playing' ? 'border-amber-500/50' : 'border-white/10', onClick: toggleVoice },
      ...(isAdmin ? [
          { id: 'override', icon: Terminal, label: "النظام الداخلي (Override)", colorClass: "text-red-500", bgClass: "bg-red-900/20", borderClass: "border-red-500/30", onClick: () => setPendingSecureAction('admin') },
          { id: 'workspace', icon: FolderOpen, label: "مساحة العمل (Workspace)", colorClass: "text-purple-500", bgClass: "bg-purple-900/20", borderClass: "border-purple-500/30", onClick: onOpenWorkspace }
      ] : []),
      { id: 'logout', icon: LogOut, label: "خروج مؤقت", colorClass: "text-gray-400", bgClass: "bg-white/5", borderClass: "border-white/10", onClick: onLogout }
  ];

  // Group items by orbit
  const orbitGroups: { [key: number]: typeof allItems } = { 0: [], 1: [], 2: [] };
  allItems.forEach(item => {
      let o = orbitMap[item.id];
      if (o === undefined) o = 1; // default fallback
      orbitGroups[o].push(item);
  });
  activeOrbitGroups.current = orbitGroups;

  return (
    <div className="fixed inset-0 w-full h-full bg-transparent text-white font-['Cairo'] overflow-hidden flex items-center justify-center select-none touch-none">
        <OrbitalStyles />
        
        {/* Responsive scaling container */}
        <div ref={containerRef} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] pointer-events-none flex items-center justify-center scale-[0.35] sm:scale-[0.55] md:scale-[0.75] lg:scale-[0.9] xl:scale-100" style={{ transformOrigin: 'center center' }}>
            
            {/* Draw Ring Lines */}
            {ORBIT_RADII.map((r, i) => (
                <div key={i} className={`absolute inset-0 rounded-full border-[1.5px] opacity-100 m-auto pointer-events-none transition-all duration-300 ${isOffline ? 'border-cyan-500/40' : 'border-white/40'}`} 
                     style={{ width: `${r * 2}px`, height: `${r * 2}px`, boxShadow: draggingId ? `0 0 50px rgba(100, 200, 255, 0.3)` : (isOffline ? '0 0 30px rgba(6, 182, 212, 0.1), inset 0 0 20px rgba(6, 182, 212, 0.1)' : '0 0 30px rgba(255, 255, 255, 0.05), inset 0 0 20px rgba(255,255,255,0.05)') }}>
                </div>
            ))}

            {/* Orbiting Elements */}
            {Object.keys(orbitGroups).map((orbitIdxStr) => {
                const orbitIdx = parseInt(orbitIdxStr);
                const items = orbitGroups[orbitIdx];
                
                return items.map((item, i) => {
                    const isDragging = draggingId === item.id;

                    return (
                        <div 
                            key={item.id}
                            ref={el => { satelliteRefs.current[item.id] = el }}
                            className={`absolute flex items-center justify-center pointer-events-auto ${isDragging ? 'z-[100] scale-125 transition-transform' : ''}`}
                            style={{ 
                                opacity: isDragging ? 0.9 : 1
                            }}
                        >
                            <div className="floater">
                                <SatelliteCard 
                                    id={item.id}
                                    icon={item.icon} 
                                    label={item.label} 
                                    value={item.value} 
                                    colorClass={item.colorClass} 
                                    bgClass={item.bgClass} 
                                    borderClass={item.borderClass} 
                                    onClick={item.onClick}
                                    onDragStart={handlePointerDown}
                                />
                            </div>
                        </div>
                    );
                });
            })}

            {/* --- OFFLINE BANNER --- */}
            {isOffline && (
                <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-cyan-900/40 border border-cyan-500/50 backdrop-blur-md px-8 py-3 rounded-full flex items-center gap-3 z-[100] animate-in slide-in-from-top-10 shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></div>
                    <span className="text-cyan-100 font-bold text-sm tracking-widest">إتصال بشبكة العقد (Offline Edge AI Mode)</span>
                </div>
            )}

            {/* --- THE CORE (SUN) --- */}
            <div 
                onClick={onOpenChat}
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 lg:w-64 lg:h-64 rounded-full ${isOffline ? 'bg-gradient-to-br from-cyan-600/40 to-black border-cyan-500/50 hover:bg-cyan-900/60' : 'bg-gradient-to-br from-purple-600/40 to-black border-purple-500/50 hover:bg-purple-900/60'} border flex flex-col items-center justify-center cursor-pointer group pointer-events-auto z-50 transition-all font-cairo shadow-2xl`}
                style={{ animation: 'core-pulse 4s ease-in-out infinite' }}
            >
                <div className={`absolute inset-0 rounded-full ${isOffline ? 'bg-cyan-500/20' : 'bg-purple-500/20'} animate-ping opacity-20`}></div>
                <Brain className={`w-16 h-16 lg:w-24 lg:h-24 text-white relative z-10 mb-2 ${isOffline ? 'fill-cyan-300/30' : 'fill-purple-300/30'} group-hover:scale-110 transition-transform duration-500`} />
                <span className="text-white text-lg lg:text-3xl font-black tracking-widest uppercase relative z-10 drop-shadow-[0_2px_10px_rgba(255,255,255,0.5)]">الظل الرقمي</span>
                {isOffline && <span className="text-cyan-400 text-[10px] lg:text-xs mt-1 font-bold tracking-[0.3em]">LOCAL NODE</span>}
                {!isOffline && (
                    <span className="text-xs lg:text-base text-purple-200 font-bold uppercase relative z-10 tracking-[0.3em] mt-1 shadow-black drop-shadow-md">
                        {user.phone === 'GUEST' ? 'تجربة محدودة' : 'الدخول للاجتماع'}
                    </span>
                )}
            </div>

        </div>

        {/* --- MODALS REUSED EXACTLY AS BEFORE --- */}
        {showVault && (
            <SovereignVault user={user} onVaultReady={() => setShowVault(false)} />
        )}

        {pendingSecureAction && (
            <VoiceSecurityGate 
                onClose={() => setPendingSecureAction(null)} 
                onSuccess={() => {
                    const action = pendingSecureAction;
                    setPendingSecureAction(null);
                    if (action === 'nexus') setShowNexusConfig(true);
                    if (action === 'admin') setShowSystemOverride(true);
                }}
            />
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
                             طريقة الربط (Home Assistant Local Bridge / eWeLink):
                        </h4>
                        <ol className="text-xs text-white/70 space-y-3 list-decimal list-inside leading-relaxed p-2">
                            <li>ادخل شبكة الماستر المنزلية <b>Home Assistant</b> أو <b>IFTTT.com</b> واعمل Webhooks.</li>
                            <li>في حالة (Home Assistant)، قم بكتابة روابط اللوكال الخاصة بك هنا (http://192.168.1.10:8123/api/webhook/YOUR_ID). </li>
                            <li>يعمل النظام كعميل (Capacitor/Native) ويستطيع الجسر إرسال الأوامر للشبكة المحلية مباشرة بحرية على هاتفك.</li>
                            <li>ضيف الرابط ده هنا تحت باسم الحدث. وقول للظل: "ولع النور"، وهو هينفذ.</li>
                        </ol>
                        <p className="text-[10px] text-white/40 mt-3 font-medium">ملاحظة: استخدام شبكات الـ Local Proxy يستلزم أن يكون الهاتف على نفس الشبكة المنزلية.</p>
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

        {showContacts && (
            <ContactsManagerModal onClose={() => setShowContacts(false)} />
        )}

        {showWorkspace && (
            <WorkspaceModal user={user} onClose={() => setShowWorkspace(false)} />
        )}

        {showBrandsModal && (
            <BrandManagerModal user={user} onClose={() => setShowBrandsModal(false)} />
        )}

        {showWalletModal && (
            <ShadowWalletModal onClose={() => setShowWalletModal(false)} />
        )}

        {showLiveModal && (
            <LiveSessionModal user={user} onClose={() => setShowLiveModal(false)} />
        )}

        {showBrainRouter && (
            <BrainRouterModal onClose={() => setShowBrainRouter(false)} />
        )}

        {showProactiveReports && (
            <ProactiveReportsModal onClose={() => setShowProactiveReports(false)} />
        )}

        {showSocialModal && (
            <SocialMatrixModal user={user} onClose={() => setShowSocialModal(false)} />
        )}

        {showHologram && (
            <HologramModal onClose={() => setShowHologram(false)} />
        )}

        {showResearch && (
            <ResearchCenterModal onClose={() => setShowResearch(false)} />
        )}

        {showAdvisory && (
            <AdvisoryBoardModal onClose={() => setShowAdvisory(false)} />
        )}

        {showTafraDashboard && (
            <TafraDashboard onClose={() => setShowTafraDashboard(false)} />
        )}

        {showMusicVault && (
            <MusicVaultModal user={user} onClose={() => setShowMusicVault(false)} />
        )}

        {showAutonomousManager && (
            <AutonomousManager onClose={() => setShowAutonomousManager(false)} />
        )}

    </div>
  );
};

export default Dashboard;
