
import React, { useState, useEffect, useRef } from 'react';
import { Users, CreditCard, Activity, Search, CheckCircle, XCircle, Image as ImageIcon, ShieldCheck, Zap, X, Bot, Infinity, LogOut, DollarSign, Server, Eye, Database, Globe, Cpu, FolderOpen, Radio, MessageSquare, Mic, Save, Lock, LayoutGrid, Smartphone, Wallet, TrendingUp, Briefcase, Ban, Megaphone, Send, Heart, Feather, Bell, Settings, Edit3, Plus, Trash2, FileText, Brain, UploadCloud, Paperclip, Terminal, Tag, BarChart2, MessageCircle, ShoppingCart, GraduationCap, Palette, Film, Network } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { shadowDB, UserProfile, DBFeedback, AgentProfile } from '../services/dbService';
import ChatInterface from './ChatInterface';
import { ArchitectureMap } from './ArchitectureMap';

interface Props {
    onLogout: () => void;
    onSwitchToUserMode: () => void; 
    onNavigateTo?: (section: string) => void;
}

interface AgentInfo {
    id: string;
    name: string;
    role: string;
    status: string;
    description: string;
    color: string;
    icon: any;
}

const AdminDashboard: React.FC<Props> = ({ onLogout, onSwitchToUserMode, onNavigateTo }) => {
  const [activeView, setActiveView] = useState<'members' | 'marketers' | 'feedback' | 'requests' | 'chat' | 'core' | 'broadcast' | 'payouts' | 'coupons' | 'analytics' | 'settings' | 'architecture'>('analytics');
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [feedbacks, setFeedbacks] = useState<DBFeedback[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [newCoupon, setNewCoupon] = useState({ code: '', discount: 0, maxUses: 100 });
  const [isSavingCoupon, setIsSavingCoupon] = useState(false);
  const [selectedProof, setSelectedProof] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState<'rules' | 'broadcast' | null>(null);
  
  // Exclude system/admin accounts for accurate metrics
  const realProfiles = profiles.filter(p => {
      const emailLower = (p.email || '').toLowerCase();
      return emailLower !== 'tito' && emailLower !== 'guest' && !emailLower.includes('admin');
  });

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [globalRules, setGlobalRules] = useState('');
  const [isSavingRules, setIsSavingRules] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentInfo | null>(null);
  const [agentDbData, setAgentDbData] = useState<AgentProfile | null>(null);
  const [isSavingAgent, setIsSavingAgent] = useState(false);
  const [newKnowledgeItem, setNewKnowledgeItem] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  
  // Payout Modal State
  const [selectedPayoutMarketer, setSelectedPayoutMarketer] = useState<UserProfile | null>(null);

  const getGrowthData = () => {
    // Generate data for the last 7 days based on real profiles
    const data = [];
    const now = new Date();
    // Normalize to start of today for precise bucketing
    now.setHours(23, 59, 59, 999);
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dayEnd = d.getTime();
      
      const dayName = d.toLocaleDateString('ar-EG', { weekday: 'short' });
      const usersUpToDay = realProfiles.filter(p => p.joinedAt && p.joinedAt <= dayEnd).length;
      
      data.push({ name: dayName, users: usersUpToDay });
    }
    return data;
  };

  const calculateTotalExpectedProfit = () => {
      // Base calculation on active members and their billing cycle
      let total = 0;
      realProfiles.forEach(p => {
          if (p.status === 'active') {
              if (p.subscriptionCycle === 'yearly') {
                  total += 8000; // Assuming 20% discount on 10000 for yearly as mentioned in Payment.tsx
              } else {
                  total += 1000; // Monthly assuming Elite
              }
          }
      });
      return total;
  };

  const expectedProfit = calculateTotalExpectedProfit();
  const growthData = getGrowthData();

  // Admin Profile
  const [adminProfile, setAdminProfile] = useState<UserProfile>({ 
      email: 'admin@shadow.com', name: 'تيتو', shadowName: 'تيتو', tier: 'sovereign', status: 'active', joinedAt: Date.now(), password: 'admin',
      affiliate: { isMarketer: true, referralCode: 'tito123', totalEarnings: 0, referralsCount: 0, payoutHistory: [] }
  });

  const [isSavingSystemKeys, setIsSavingSystemKeys] = useState(false);
  const [systemKeys, setSystemKeys] = useState<{
      githubToken: string;
      vercelToken: string;
      binanceApiKey: string;
      binanceSecretKey: string;
      metaToken: string;
      metaPageId: string;
      openAIBaseUrl?: string;
      openAIApiKey?: string;
      openAIModelName?: string;
      pineconeApiKey?: string;
      pineconeHost?: string;
  }>({ githubToken: '', vercelToken: '', binanceApiKey: '', binanceSecretKey: '', metaToken: '', metaPageId: '' });

  useEffect(() => { 
      if ('Notification' in window && Notification.permission === 'granted') setNotificationsEnabled(true);
      const initData = async () => {
          const adminProf = await shadowDB.getProfile('admin@shadow.com');
          if (adminProf) setAdminProfile(adminProf);
          const [allProfiles, allFeedback, rules, keys] = await Promise.all([shadowDB.getAllProfiles(), shadowDB.getAllFeedback(), shadowDB.getGlobalRules(), shadowDB.getSystemKeys()]);
          setProfiles(allProfiles);
          setFeedbacks(allFeedback.reverse());
          setGlobalRules(rules);
          if (keys) setSystemKeys(keys as any);
          
          // Fetch coupons
          try {
              const allCoupons = await shadowDB.getAllCoupons?.() || [];
              setCoupons(allCoupons);
          } catch(e) {}

          shadowDB.subscribeToAdminFeed((updated) => { if(updated.length > 0) setProfiles(updated); }, (updated) => { if(updated.length > 0) setFeedbacks(updated.reverse()); });
      };
      initData();

      return () => {
          if (shadowDB.adminUnsubscribe) {
              shadowDB.adminUnsubscribe();
              shadowDB.adminUnsubscribe = undefined;
          }
      };
  }, []); 

  const handleSaveSystemKeys = async () => {
      setIsSavingSystemKeys(true);
      try {
          const cleanKeys = Object.fromEntries(Object.entries(systemKeys).filter(([_, v]) => v !== undefined));
          await shadowDB.saveSystemKeys(cleanKeys as any);
          alert("تم حفظ مفاتيح النظام بنجاح");
      } catch (err: any) {
          console.error(err);
          alert("حدث خطأ أثناء الحفظ. تأكد من صلاحياتك: " + err.message);
      } finally {
          setIsSavingSystemKeys(false);
      }
  };

  const handleCreateCoupon = async () => {
      if (!newCoupon.code || newCoupon.discount <= 0) return;
      setIsSavingCoupon(true);
      const couponData = {
          code: newCoupon.code.toUpperCase(),
          discountAmount: newCoupon.discount,
          type: 'fixed' as 'fixed' | 'percent',
          maxUses: newCoupon.maxUses,
          usedCount: 0,
          createdBy: adminProfile.email,
          createdAt: Date.now()
      };
      await shadowDB.saveCoupon(couponData);
      setCoupons([...coupons, couponData]);
      setNewCoupon({ code: '', discount: 0, maxUses: 100 });
      setIsSavingCoupon(false);
  };

  const startVoiceDictation = (target: 'rules' | 'broadcast') => {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) { alert("المتصفح لا يدعم الإملاء الصوتي (جرب Chrome)"); return; }
      const rec = new SpeechRecognition(); rec.lang = 'ar-EG';
      rec.onstart = () => setIsListening(target);
      rec.onresult = (e: any) => { const text = e.results[0][0].transcript; if (target === 'rules') setGlobalRules(prev => prev + " " + text); else setBroadcastMessage(prev => prev + " " + text); };
      rec.onend = () => setIsListening(null);
      rec.start();
  };

  const handleAgentClick = async (agent: AgentInfo) => {
      setSelectedAgent(agent);
      let data = await shadowDB.getAgentProfile(agent.id);
      if (!data) data = { id: agent.id, name: agent.name, role: agent.role, isActive: true, systemInstruction: `أنت ${agent.role}. مهمتك: ${agent.description}.`, knowledgeBase: [], lastUpdated: Date.now() };
      setAgentDbData(data);
  };

  const saveAgentChanges = async () => { if (!agentDbData) return; setIsSavingAgent(true); await shadowDB.saveAgentProfile({ ...agentDbData, lastUpdated: Date.now() }); setTimeout(() => setIsSavingAgent(false), 800); };
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]; if (!file || !agentDbData) return; setIsUploadingFile(true); const reader = new FileReader(); const isText = file.type.includes('text') || file.name.endsWith('.txt');
      reader.onload = async (ev) => { const content = ev.target?.result as string; if (isText) { const updatedKnowledge = [...agentDbData.knowledgeBase, `[FILE: ${file.name}]\n${content}`]; setAgentDbData({ ...agentDbData, knowledgeBase: updatedKnowledge }); } else { const newDoc = { name: file.name, mimeType: file.type || 'application/pdf', data: content }; setAgentDbData({ ...agentDbData, documents: [...(agentDbData.documents || []), newDoc] }); } setIsUploadingFile(false); if (fileInputRef.current) fileInputRef.current.value = ''; };
      if (isText) reader.readAsText(file); else reader.readAsDataURL(file);
  };
  const removeDocument = (index: number) => { if (!agentDbData || !agentDbData.documents) return; const updatedDocs = agentDbData.documents.filter((_, i) => i !== index); setAgentDbData({ ...agentDbData, documents: updatedDocs }); };

  const handleStatusUpdate = async (email: string, status: 'active' | 'blocked' | 'pending') => {
    const profile = await shadowDB.getProfile(email);
    if (profile) {
        if (status === 'active' && profile.status !== 'active' && profile.referredBy && !profile.commissionPaid) {
            const amount = profile.subscriptionCycle === 'yearly' ? 1000 : 100;
            await shadowDB.registerReferral(profile.referredBy, amount);
            profile.commissionPaid = true; 
        }
        await shadowDB.saveProfile({ ...profile, status });
        setProfiles(prev => prev.map(p => p.email === email ? { ...p, status } : p));
    }
  };

  const handleSendBroadcast = async () => { if (!broadcastMessage.trim()) return; setIsBroadcasting(true); await shadowDB.setGlobalPulse(broadcastMessage); setBroadcastMessage(''); setIsBroadcasting(false); alert("تم إطلاق نبض الظل."); };
  const saveGlobalRules = async () => { setIsSavingRules(true); await shadowDB.updateGlobalRules(globalRules); setTimeout(() => setIsSavingRules(false), 1000); };

  const handleConfirmPayout = async (email: string, payoutId: number) => {
      if (confirm("تأكيد صرف المبلغ للمسوق؟")) {
          await shadowDB.approvePayout(email, payoutId);
          const updated = await shadowDB.getAllProfiles();
          setProfiles(updated);
          setSelectedPayoutMarketer(null); // Close modal if open
      }
  };

  const councilAgents: AgentInfo[] = [
      { id: 'maestro_core', name: 'The Maestro', role: 'المايسترو', status: 'LEADER', description: 'العقل المدبر وإدارة الحوار.', color: 'purple', icon: <Brain className="w-5 h-5" /> },
      { id: 'developer_core', name: 'The Architect', role: 'المهندس', status: 'ONLINE', description: 'Senior DevOps. كتابة أكواد، Deploy، وإدارة السيرفرات.', color: 'blue', icon: <Terminal className="w-5 h-5" /> },
      { id: 'detective', name: 'Detective', role: 'المحقق', status: 'ONLINE', description: 'جمع المعلومات والبحث الحي.', color: 'emerald', icon: <Globe className="w-5 h-5" /> },
      { id: 'accountant', name: 'Accountant', role: 'المحاسب', status: 'ACTIVE', description: 'إدارة الفلوس والتقارير.', color: 'emerald', icon: <DollarSign className="w-5 h-5" /> },
      { id: 'executor', name: 'Executor', role: 'المنفذ', status: 'ACTIVE', description: 'الاتصالات والمهمات التشغيلية.', color: 'amber', icon: <Zap className="w-5 h-5" /> },
      { id: 'nexus', name: 'Nexus', role: 'نكسوس', status: 'READY', description: 'التحكم في المنزل الذكي (IoT).', color: 'cyan', icon: <Cpu className="w-5 h-5" /> },
      { id: 'legal_advisor', name: 'Legal Advisor', role: 'المستشار', status: 'READY', description: 'الصياغة القانونية والعقود.', color: 'blue', icon: <FileText className="w-5 h-5" /> },
      { id: 'analyst', name: 'Analyst', role: 'المحلل', status: 'ONLINE', description: 'التحليل النفسي وقراءة الصور.', color: 'purple', icon: <Eye className="w-5 h-5" /> },
      { id: 'healer', name: 'The Healer', role: 'المعالج', status: 'READY', description: 'الجانب الروحاني والنفسي.', color: 'red', icon: <Feather className="w-5 h-5" /> },
      { id: 'trader', name: 'The Trader', role: 'المحلل الفني', status: 'ONLINE', description: 'خبير أسواق المال وتداول الشارت.', color: 'green', icon: <TrendingUp className="w-5 h-5" /> },
      { id: 'smart_shopper', name: 'Smart Shopper', role: 'المتسوق الذكي', status: 'ONLINE', description: 'خبير التسوق وتعبئة البيانات لطلبات الدفع عند الاستلام.', color: 'orange', icon: <ShoppingCart className="w-5 h-5" /> },
      { id: 'educator', name: 'Educator', role: 'المعلم', status: 'ONLINE', description: 'مساعد تعليمي للأطفال والطلاب والمدرسين.', color: 'amber', icon: <GraduationCap className="w-5 h-5" /> },
      { id: 'pro_designer', name: 'Pro Designer', role: 'المصمم المحترف', status: 'ONLINE', description: 'خبير إنشاء وتوليد الصور والفيديوهات.', color: 'pink', icon: <Palette className="w-5 h-5" /> },
      { id: 'life_coach', name: 'Life Coach', role: 'المدرب الرياضي والنفسي', status: 'ONLINE', description: 'دعم وتحفيز الرياضيين والتوجيه النفسي.', color: 'red', icon: <Activity className="w-5 h-5" /> },
      { id: 'editor', name: 'The Editor', role: 'المونتير', status: 'ONLINE', description: 'مصمم ومونتير فيديو للمدونين وصناع المحتوى.', color: 'cyan', icon: <Film className="w-5 h-5" /> },
  ];

  const filteredProfiles = realProfiles.filter(p => (p.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) || (p.email || '').toLowerCase().includes((searchQuery || '').toLowerCase()));
  const pendingRequests = realProfiles.filter(p => p.status === 'pending' && p.paymentProof);
  const activeMembers = filteredProfiles.filter(p => p.status === 'active');
  const marketersList = filteredProfiles.filter(p => p.affiliate && (p.affiliate.isMarketer || (p.affiliate.payoutHistory && p.affiliate.payoutHistory.length > 0) || p.affiliate.referralCode));

  return (
    <div className="min-h-screen bg-transparent text-white flex flex-col font-['Cairo'] pb-48">
      <div className="p-6 md:p-8 flex justify-between items-center bg-black/50 border-b border-white/5 sticky top-0 z-50 backdrop-blur-md">
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center font-black text-black">A</div><h2 className="text-xl font-black">Shadow <span className="text-amber-500">HQ</span></h2></div>
          <div className="flex items-center gap-2">
              <button onClick={onSwitchToUserMode} className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-bold hover:bg-white/10 transition-all">وضع المستخدم</button>
              <button onClick={onLogout} className="p-2 text-red-500 hover:bg-red-900/20 rounded-full transition-all"><LogOut className="w-5 h-5" /></button>
          </div>
      </div>

      <div className="flex-1 p-6 space-y-8 relative z-10">
        {activeView !== 'core' && activeView !== 'broadcast' && activeView !== 'architecture' && (
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3 relative z-10">
                {councilAgents.map(agent => {
                    const colorMap: Record<string, string> = {
                        purple: "text-purple-400 group-hover:bg-purple-500/10 group-hover:border-purple-500/30",
                        blue: "text-blue-400 group-hover:bg-blue-500/10 group-hover:border-blue-500/30",
                        emerald: "text-emerald-400 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/30",
                        amber: "text-amber-400 group-hover:bg-amber-500/10 group-hover:border-amber-500/30",
                        cyan: "text-cyan-400 group-hover:bg-cyan-500/10 group-hover:border-cyan-500/30",
                        red: "text-red-400 group-hover:bg-red-500/10 group-hover:border-red-500/30",
                        green: "text-green-400 group-hover:bg-green-500/10 group-hover:border-green-500/30",
                        orange: "text-orange-400 group-hover:bg-orange-500/10 group-hover:border-orange-500/30",
                        pink: "text-pink-400 group-hover:bg-pink-500/10 group-hover:border-pink-500/30"
                    };
                    const colorClass = colorMap[agent.color] || "text-white group-hover:bg-white/10";
                    return (
                        <div key={agent.id} onClick={() => handleAgentClick(agent)} className={`p-4 rounded-2xl border border-white/5 bg-[#080808]/80 backdrop-blur-md flex flex-col items-center cursor-pointer transition-all group ${colorClass}`}>
                            <div className={`p-3 rounded-full bg-white/5 mb-2 group-hover:scale-110 transition-transform ${colorMap[agent.color] ? colorMap[agent.color].split(' ')[0] : 'text-white'}`}>{agent.icon}</div>
                            <span className="text-[9px] font-black uppercase text-white/40 group-hover:text-white transition-colors">{agent.name}</span>
                        </div>
                    );
                })}
            </div>
        )}

        {/* --- MARKETERS VIEW RESTORED --- */}
        {activeView === 'marketers' && (
            <>
                <h3 className="text-sm font-black text-emerald-500 mb-4 flex items-center gap-2"><Briefcase className="w-4 h-4" /> فريق المسوقين ({marketersList.length})</h3>
                {marketersList.map(u => {
                    const pendingPayouts = u.affiliate?.payoutHistory?.filter(h => h.status === 'pending') || [];
                    const totalPending = pendingPayouts.reduce((sum, h) => sum + h.amount, 0);
                    
                    return (
                        <div key={u.email} className="p-5 bg-[#111] rounded-[24px] border border-emerald-500/20 mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-emerald-500/40 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 font-bold border border-emerald-500/20">{u.name[0]}</div>
                                <div>
                                    <h4 className="font-bold text-base text-white">{u.name}</h4>
                                    <p className="text-[10px] opacity-50 font-mono">{u.email}</p>
                                    <div className="flex gap-3 mt-1">
                                        <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-white/60">كود: <span className="font-bold text-white">{u.affiliate?.referralCode}</span></span>
                                        <span className="text-[10px] bg-emerald-900/20 px-2 py-0.5 rounded text-emerald-400">إجمالي الأرباح: {u.affiliate?.totalEarnings || 0}ج</span>
                                    </div>
                                </div>
                            </div>

                            {totalPending > 0 ? (
                                <div className="flex items-center gap-4 bg-black/40 p-3 rounded-xl border border-amber-500/20">
                                    <div className="text-right">
                                        <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">مطلوب سحب</p>
                                        <p className="text-xl font-black text-white">{totalPending} ج.م</p>
                                    </div>
                                    <button onClick={() => setSelectedPayoutMarketer(u)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-900/20 transition-all">
                                        <DollarSign className="w-4 h-4" /> صرف
                                    </button>
                                </div>
                            ) : (
                                <span className="text-[10px] text-white/20 font-bold bg-white/5 px-3 py-1 rounded-lg">لا توجد مستحقات</span>
                            )}
                        </div>
                    );
                })}
            </>
        )}

        {/* PENDING REQUESTS */}
        {activeView === 'requests' && (
            <>
                <h3 className="text-sm font-black text-amber-500 mb-4 flex items-center gap-2"><CreditCard className="w-4 h-4" /> طلبات الاشتراك ({pendingRequests.length})</h3>
                {pendingRequests.length === 0 ? <p className="text-white/30 text-xs text-center py-10">مفيش طلبات جديدة يا ريس.</p> : pendingRequests.map(u => (
                    <div key={u.email} className="p-6 rounded-[24px] border border-amber-500/30 bg-amber-500/5 flex flex-col gap-4 mb-4">
                        <div className="flex justify-between items-start">
                            <div><h3 className="font-black text-lg">{u.name}</h3><p className="text-xs opacity-50">{u.email}</p><span className="text-[10px] text-amber-300 font-bold bg-amber-900/20 px-2 py-1 rounded mt-1 inline-block">{u.subscriptionCycle === 'yearly' ? 'سنوي (10,000)' : 'شهري (1,000)'}</span></div>
                            <button onClick={() => setSelectedProof(u.paymentProof!)} className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all"><ImageIcon className="w-5 h-5 text-white" /></button>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => handleStatusUpdate(u.email, 'active')} className="flex-1 py-3 bg-emerald-600 rounded-xl text-xs font-bold hover:scale-[1.02] transition-transform">تفعيل العضوية</button>
                            <button onClick={() => handleStatusUpdate(u.email, 'blocked')} className="p-3 bg-red-600/20 rounded-xl text-red-500 hover:bg-red-600 hover:text-white transition-all"><X className="w-5 h-5" /></button>
                        </div>
                    </div>
                ))}
            </>
        )}

        {/* ACTIVE MEMBERS */}
        {activeView === 'members' && (
            <>
                <h3 className="text-sm font-black text-purple-500 mb-4 flex items-center gap-2"><Users className="w-4 h-4" /> الأعضاء النشطين ({activeMembers.length})</h3>
                {activeMembers.map(u => (
                    <div key={u.email} className="p-4 bg-[#111] rounded-2xl border border-white/5 flex justify-between items-center mb-2 hover:border-purple-500/30 transition-all">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center font-bold text-purple-400">{u.name[0]}</div>
                            <div><h4 className="font-bold text-sm">{u.name}</h4><p className="text-[10px] opacity-40">{u.email}</p></div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex gap-2 border-r border-white/10 pr-4">
                                <button onClick={async () => {
                                    const updated = { ...u, agentPowers: { ...u.agentPowers, developer: !u.agentPowers?.developer } };
                                    await shadowDB.saveProfile(updated, true);
                                    setProfiles(prev => prev.map(p => p.email === u.email ? updated : p));
                                }} className={`p-2 rounded-lg transition-all ${u.agentPowers?.developer ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-white/5 text-white/30 hover:bg-white/10'}`} title="عضلات البرمجة (Developer)">
                                    <Terminal className="w-4 h-4" />
                                </button>
                                <button onClick={async () => {
                                    const updated = { ...u, agentPowers: { ...u.agentPowers, trader: !u.agentPowers?.trader } };
                                    await shadowDB.saveProfile(updated, true);
                                    setProfiles(prev => prev.map(p => p.email === u.email ? updated : p));
                                }} className={`p-2 rounded-lg transition-all ${u.agentPowers?.trader ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'bg-white/5 text-white/30 hover:bg-white/10'}`} title="عضلات التداول (Trader)">
                                    <TrendingUp className="w-4 h-4" />
                                </button>
                                <button onClick={async () => {
                                    const updated = { ...u, agentPowers: { ...u.agentPowers, social: !u.agentPowers?.social } };
                                    await shadowDB.saveProfile(updated, true);
                                    setProfiles(prev => prev.map(p => p.email === u.email ? updated : p));
                                }} className={`p-2 rounded-lg transition-all ${u.agentPowers?.social ? 'bg-pink-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.5)]' : 'bg-white/5 text-white/30 hover:bg-white/10'}`} title="عضلات السوشيال (Social)">
                                    <Globe className="w-4 h-4" />
                                </button>
                            </div>
                            <button onClick={() => handleStatusUpdate(u.email, 'blocked')} className="text-red-500 text-[10px] font-bold border border-red-500/30 px-3 py-1 rounded-full hover:bg-red-900/20">تجميد</button>
                        </div>
                    </div>
                ))}
            </>
        )}

        {/* FEEDBACK */}
        {activeView === 'feedback' && (
            <>
                <h3 className="text-sm font-black text-purple-500 mb-4 flex items-center gap-2"><MessageSquare className="w-4 h-4" /> آراء الأعضاء ({feedbacks.length})</h3>
                {feedbacks.map((f, i) => (
                    <div key={i} className="p-4 bg-[#111] rounded-2xl border border-purple-500/20 mb-2 hover:border-purple-500/40 transition-all">
                        <div className="flex justify-between mb-2"><span className="text-xs font-black text-purple-400">{f.userName}</span><span className="text-[9px] opacity-30">{new Date(f.timestamp).toLocaleString()}</span></div>
                        <p className="text-sm opacity-80 leading-relaxed">{f.message}</p>
                    </div>
                ))}
            </>
        )}

        {/* CORE / RULES */}
        {activeView === 'core' && (
            <div className="flex-1 flex flex-col gap-4 h-full">
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl mb-2 flex items-center gap-3">
                    <ShieldCheck className="w-6 h-6 text-red-500" />
                    <div><h3 className="font-bold text-red-400">النواة الحية (Live Core)</h3><p className="text-[10px] text-white/50">تعديل قوانين الظل الأساسية. (مساحة الكتابة مكبرة)</p></div>
                </div>
                <div className="flex-1 bg-black border border-white/10 rounded-2xl p-4 relative flex flex-col min-h-[500px]">
                    <textarea 
                        value={globalRules} 
                        onChange={(e) => setGlobalRules(e.target.value)} 
                        className="w-full flex-1 bg-transparent text-emerald-500 font-mono text-sm outline-none resize-none leading-relaxed p-2" 
                        placeholder="// اكتب قوانين السيادة هنا..." 
                    />
                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                        <button onClick={() => startVoiceDictation('rules')} className={`p-4 rounded-full transition-all ${isListening === 'rules' ? 'bg-red-600 animate-pulse shadow-lg shadow-red-600/50' : 'bg-white/10 text-white hover:bg-white/20'}`}><Mic className="w-6 h-6" /></button>
                        <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest">{globalRules.length} chars</span>
                    </div>
                </div>
                <button onClick={saveGlobalRules} disabled={isSavingRules} className="w-full py-4 bg-white text-black font-black rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2">
                    {isSavingRules ? <Activity className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    {isSavingRules ? 'جاري التعميم...' : 'حفظ ونشر التعديلات'}
                </button>
            </div>
        )}

        {/* ARCHITECTURE MAP */}
        {activeView === 'architecture' && (
            <div className="flex-1 flex flex-col gap-4 h-[75vh] relative">
                <div className="bg-cyan-500/10 border border-cyan-500/20 p-4 rounded-2xl flex items-center gap-3 z-10 shrink-0">
                    <Network className="w-6 h-6 text-cyan-500 animate-pulse" />
                    <div><h3 className="font-bold text-cyan-400">خريطة المعمارية والبرمجة الحية</h3><p className="text-[10px] text-cyan-400/50">شخصيات الظل، الإمكانيات، المراجع، والذاكرة الدائمة</p></div>
                </div>
                
                <div className="flex-1 w-full h-full relative">
                    <ArchitectureMap />
                </div>
            </div>
        )}

        {/* COUPONS */}
        {activeView === 'coupons' && (
            <div className="flex-1 flex flex-col gap-4">
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl mb-2 flex items-center gap-3">
                    <Tag className="w-6 h-6 text-emerald-500" />
                    <div><h3 className="font-bold text-emerald-400">إدارة الكوبونات</h3><p className="text-[10px] text-white/50">إنشاء ومتابعة أكواد الخصم</p></div>
                </div>
                
                <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
                    <h4 className="text-sm font-black text-white mb-4">إنشاء كوبون جديد</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="text-[10px] text-white/40 font-bold mb-1 block">كود الخصم (مثال: VIP2024)</label>
                            <input type="text" value={newCoupon.code} onChange={(e) => setNewCoupon({...newCoupon, code: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl p-3 text-white font-mono text-sm outline-none focus:border-emerald-500/50 uppercase" placeholder="الكود" />
                        </div>
                        <div>
                            <label className="text-[10px] text-white/40 font-bold mb-1 block">قيمة الخصم (ج.م)</label>
                            <input type="number" value={newCoupon.discount || ''} onChange={(e) => setNewCoupon({...newCoupon, discount: Number(e.target.value)})} className="w-full bg-black border border-white/10 rounded-xl p-3 text-white font-mono text-sm outline-none focus:border-emerald-500/50" placeholder="المبلغ" />
                        </div>
                        <div>
                            <label className="text-[10px] text-white/40 font-bold mb-1 block">الحد الأقصى للاستخدام</label>
                            <input type="number" value={newCoupon.maxUses || ''} onChange={(e) => setNewCoupon({...newCoupon, maxUses: Number(e.target.value)})} className="w-full bg-black border border-white/10 rounded-xl p-3 text-white font-mono text-sm outline-none focus:border-emerald-500/50" placeholder="عدد المرات" />
                        </div>
                    </div>
                    <button onClick={handleCreateCoupon} disabled={isSavingCoupon || !newCoupon.code || newCoupon.discount <= 0} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-white/5 disabled:text-white/20 text-white font-black rounded-xl transition-all flex items-center justify-center gap-2">
                        {isSavingCoupon ? <Activity className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                        إضافة الكوبون
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {coupons.map((c, i) => (
                        <div key={i} className="bg-[#111] border border-white/5 rounded-2xl p-4 flex justify-between items-center hover:border-emerald-500/30 transition-all">
                            <div>
                                <h4 className="font-black text-lg text-emerald-400 font-mono tracking-widest">{c.code}</h4>
                                <p className="text-[10px] text-white/40 mt-1">خصم: <span className="text-white font-bold">{c.discountAmount} ج.م</span> | الاستخدام: <span className="text-white font-bold">{c.usedCount}/{c.maxUses}</span></p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                <Tag className="w-5 h-5 text-emerald-500" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
        {activeView === 'broadcast' && (
            <div className="flex-1 flex flex-col gap-4">
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl mb-2 flex items-center gap-3">
                    <Megaphone className="w-6 h-6 text-amber-500" />
                    <div><h3 className="font-bold text-amber-400">نبض الظل (Shadow Pulse)</h3><p className="text-[10px] text-white/50">رسالة تظهر لجميع المستخدمين فوراً (Global Alert)</p></div>
                </div>
                <div className="flex-1 bg-[#111] border border-amber-500/20 rounded-2xl p-6 relative">
                    <textarea value={broadcastMessage} onChange={(e) => setBroadcastMessage(e.target.value)} className="w-full h-full bg-transparent text-lg text-white outline-none resize-none placeholder:text-white/20 min-h-[300px]" placeholder="اكتب رسالتك هنا..." />
                    <button onClick={() => startVoiceDictation('broadcast')} className={`absolute bottom-4 left-4 p-4 rounded-full transition-all ${isListening === 'broadcast' ? 'bg-red-600 animate-pulse shadow-lg shadow-red-600/50' : 'bg-white/10 text-white hover:bg-white/20'}`}><Mic className="w-6 h-6" /></button>
                </div>
                <button onClick={handleSendBroadcast} disabled={isBroadcasting} className="w-full py-4 bg-amber-500 text-black font-black rounded-xl hover:bg-amber-400 transition-all flex items-center justify-center gap-2">
                    {isBroadcasting ? <Activity className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    إرسال النبض للجميع
                </button>
            </div>
        )}

        {/* SETTINGS / API KEYS */}
        {activeView === 'settings' && (
            <div className="flex-1 flex flex-col gap-4">
                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl mb-2 flex items-center gap-3">
                    <Settings className="w-6 h-6 text-blue-500" />
                    <div><h3 className="font-bold text-blue-400">إعدادات النظام (System Keys)</h3><p className="text-[10px] text-white/50">إدارة مفاتيح الـ API للـ Autonomous Agents</p></div>
                </div>
                
                <div className="bg-[#111] p-6 rounded-2xl border border-white/5 mb-4 space-y-4">
                    <h4 className="text-white font-bold text-sm mb-4 border-b border-white/10 pb-2">عضلات المبرمج (Deployment)</h4>
                    <div>
                        <label className="text-xs text-white/40 block mb-1">GitHub Personal Access Token</label>
                        <input type="password" value={systemKeys?.githubToken || ''} onChange={(e) => setSystemKeys({...systemKeys, githubToken: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl p-3 text-white text-sm" placeholder="ghp_..." />
                    </div>
                    <div>
                        <label className="text-xs text-white/40 block mb-1">Vercel API Token</label>
                        <input type="password" value={systemKeys?.vercelToken || ''} onChange={(e) => setSystemKeys({...systemKeys, vercelToken: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl p-3 text-white text-sm" placeholder="Bearer..." />
                    </div>
                </div>

                <div className="bg-[#111] p-6 rounded-2xl border border-white/5 mb-4 space-y-4">
                    <h4 className="text-white font-bold text-sm mb-4 border-b border-white/10 pb-2">عضلات المتداول (Binance)</h4>
                    <div>
                        <label className="text-xs text-white/40 block mb-1">Binance API Key</label>
                        <input type="password" value={systemKeys?.binanceApiKey || ''} onChange={(e) => setSystemKeys({...systemKeys, binanceApiKey: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl p-3 text-white text-sm" />
                    </div>
                    <div>
                        <label className="text-xs text-white/40 block mb-1">Binance Secret Key</label>
                        <input type="password" value={systemKeys?.binanceSecretKey || ''} onChange={(e) => setSystemKeys({...systemKeys, binanceSecretKey: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl p-3 text-white text-sm" />
                    </div>
                </div>

                <div className="bg-[#111] p-6 rounded-2xl border border-white/5 mb-4 space-y-4">
                    <h4 className="text-white font-bold text-sm mb-4 border-b border-white/10 pb-2">عضلات السوشيال (Meta)</h4>
                    <div>
                        <label className="text-xs text-white/40 block mb-1">Meta Page Access Token</label>
                        <input type="password" value={systemKeys?.metaToken || ''} onChange={(e) => setSystemKeys({...systemKeys, metaToken: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl p-3 text-white text-sm" placeholder="EAAG..." />
                    </div>
                    <div>
                        <label className="text-xs text-white/40 block mb-1">Meta Page ID</label>
                        <input type="text" value={systemKeys?.metaPageId || ''} onChange={(e) => setSystemKeys({...systemKeys, metaPageId: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl p-3 text-white text-sm" />
                    </div>

                    <div className="md:col-span-2 pt-4 border-t border-white/10 mt-2">
                        <div className="flex items-center gap-2 mb-4">
                            <Cpu className="w-5 h-5 text-purple-400" />
                            <h3 className="font-bold text-white text-lg">OpenClaw AI Router (Nvidia NIM / Local Models)</h3>
                        </div>
                        <p className="text-xs text-white/40 mb-4">
                            قم بتحديد هذه الإعدادات لتحويل عقل الظل إلى النماذج المدعومة من Nvidia (مثل Llama 3) أو أي نموذج يدعم OpenAI Protocol. اتركها فارغة لاستخدام Gemini الأساسي.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-white/40 block mb-1">AI Base URL (ex: https://integrate.api.nvidia.com/v1)</label>
                                <input type="text" value={systemKeys?.openAIBaseUrl || ''} onChange={(e) => setSystemKeys({...systemKeys, openAIBaseUrl: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl p-3 text-white text-sm" placeholder="https://integrate.api.nvidia.com/v1" />
                            </div>
                            <div>
                                <label className="text-xs text-white/40 block mb-1">AI API Key (Nvidia / OpenAI Key)</label>
                                <input type="password" value={systemKeys?.openAIApiKey || ''} onChange={(e) => setSystemKeys({...systemKeys, openAIApiKey: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl p-3 text-white text-sm" placeholder="nvapi-..." />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-xs text-white/40 block mb-1">Model Name (ex: meta/llama3-70b-instruct)</label>
                                <input type="text" value={systemKeys?.openAIModelName || ''} onChange={(e) => setSystemKeys({...systemKeys, openAIModelName: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl p-3 text-white text-sm" placeholder="meta/llama3-70b-instruct" />
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-2 pt-4 border-t border-white/10 mt-2">
                        <div className="flex items-center gap-2 mb-4">
                            <Database className="w-5 h-5 text-emerald-400" />
                            <h3 className="font-bold text-white text-lg">الذاكرة العميقة (Pinecone Vector DB)</h3>
                        </div>
                        <p className="text-xs text-white/40 mb-4">
                            اربط حساب Pinecone لتحويل ذاكرة الظل إلى Semantic Vector Database تمكنه من استرجاع مئات الحقائق فائق السرعة عبر Pinecone API.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-white/40 block mb-1">Pinecone API Key</label>
                                <input type="password" value={systemKeys?.pineconeApiKey || ''} onChange={(e) => setSystemKeys({...systemKeys, pineconeApiKey: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl p-3 text-white text-sm" placeholder="pcsk_..." />
                            </div>
                            <div>
                                <label className="text-xs text-white/40 block mb-1">Pinecone Index Host</label>
                                <input type="text" value={systemKeys?.pineconeHost || ''} onChange={(e) => setSystemKeys({...systemKeys, pineconeHost: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl p-3 text-white text-sm" placeholder="https://shadow-index-xxxx.svc.pinecone.io" />
                            </div>
                        </div>
                    </div>
                </div>

                <button onClick={handleSaveSystemKeys} disabled={isSavingSystemKeys} className="w-full py-4 mt-6 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl transition-all flex items-center justify-center gap-2">
                    {isSavingSystemKeys ? <Activity className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    حفظ المفاتيح
                </button>
            </div>
        )}

        {/* PAYOUT MODAL */}
        {selectedPayoutMarketer && (
            <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-md p-4 flex items-center justify-center animate-in zoom-in">
                <div className="bg-[#111] border border-emerald-500/30 rounded-[32px] p-8 w-full max-w-md relative shadow-2xl">
                    <button onClick={() => setSelectedPayoutMarketer(null)} className="absolute top-6 left-6 p-2 bg-white/5 rounded-full hover:bg-white/10"><X className="w-5 h-5" /></button>
                    
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                            <DollarSign className="w-8 h-8 text-emerald-400" />
                        </div>
                        <h2 className="text-2xl font-black text-white">صرف أرباح</h2>
                        <p className="text-white/50 text-sm mt-1">{selectedPayoutMarketer.name}</p>
                    </div>

                    <div className="bg-black/50 p-4 rounded-2xl border border-white/5 mb-6 space-y-3">
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                            <span className="text-white/40 text-xs font-bold">المبلغ المستحق</span>
                            <span className="text-xl font-black text-emerald-400">
                                {selectedPayoutMarketer.affiliate?.payoutHistory.filter(h => h.status === 'pending').reduce((a,b) => a + b.amount, 0)} ج.م
                            </span>
                        </div>
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                            <span className="text-white/40 text-xs font-bold">طريقة التحويل</span>
                            <span className="text-sm font-bold text-white uppercase">{selectedPayoutMarketer.affiliate?.payoutDetails?.method || 'غير محدد'}</span>
                        </div>
                        <div>
                            <p className="text-white/40 text-xs font-bold mb-1">بيانات الحساب</p>
                            <p className="font-mono text-lg font-black text-white tracking-widest bg-white/5 p-2 rounded-lg text-center select-all">
                                {selectedPayoutMarketer.affiliate?.payoutDetails?.number || 'لم يتم إدخال رقم'}
                            </p>
                            <p className="text-center text-[10px] text-white/30 mt-1">{selectedPayoutMarketer.affiliate?.payoutDetails?.name}</p>
                        </div>
                    </div>

                    <button 
                        onClick={() => {
                            const pending = selectedPayoutMarketer.affiliate?.payoutHistory.find(h => h.status === 'pending');
                            if (pending) handleConfirmPayout(selectedPayoutMarketer.email, pending.date);
                        }}
                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 transition-all"
                    >
                        <CheckCircle className="w-5 h-5" /> تأكيد التحويل (Mark as Paid)
                    </button>
                </div>
            </div>
        )}

        {/* AGENT CONTROL MODAL */}
        {selectedAgent && agentDbData && (
            <div className="fixed inset-0 z-[250] bg-black/95 backdrop-blur-md p-4 flex items-center justify-center animate-in zoom-in">
                <div className="max-w-4xl w-full bg-[#111] border border-white/10 rounded-[32px] relative shadow-2xl flex flex-col h-[90vh]">
                    <div className={`h-1 w-full bg-gradient-to-r from-${selectedAgent.color}-500 to-transparent absolute top-0 rounded-t-[32px]`}></div>
                    
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                         <div className="flex items-center gap-4">
                             <div className={`p-4 rounded-full bg-${selectedAgent.color}-500/10 text-${selectedAgent.color}-400`}>{selectedAgent.icon}</div>
                             <div><h2 className="text-2xl font-black text-white">{selectedAgent.name} Control</h2><p className="text-white/40 text-xs font-mono uppercase tracking-widest">{selectedAgent.role}</p></div>
                         </div>
                         <div className="flex items-center gap-2">
                            <button onClick={saveAgentChanges} disabled={isSavingAgent} className="px-6 py-3 bg-white text-black rounded-xl font-black flex items-center gap-2 hover:bg-gray-200 transition-all">{isSavingAgent ? <Activity className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{isSavingAgent ? '...' : 'Save'}</button>
                            <button onClick={() => setSelectedAgent(null)} className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-white/50 hover:text-white"><X className="w-6 h-6" /></button>
                         </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        <div className="bg-[#080808] p-6 rounded-2xl border border-white/5">
                            <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2 uppercase tracking-widest"><Brain className="w-4 h-4 text-purple-500" /> 1. العقل (Instruction)</h3>
                            <textarea value={agentDbData.systemInstruction} onChange={(e) => setAgentDbData({ ...agentDbData, systemInstruction: e.target.value })} className="w-full h-48 bg-black border border-white/10 rounded-xl p-4 text-white font-mono text-sm leading-relaxed resize-none focus:border-purple-500/50 outline-none" />
                        </div>

                        <div className="bg-[#080808] p-6 rounded-2xl border border-white/5">
                            <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2 uppercase tracking-widest"><FolderOpen className="w-4 h-4 text-amber-500" /> 2. المصادر والملفات (Files - Secret Sauce)</h3>
                            <p className="text-[10px] text-white/40 mb-4">هنا تكمن القوة. زود العميل ده بملفات PDF أو Text متخصصة عشان يبقى خبير في مجاله.</p>
                            
                            <div className="mb-4">
                                <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.txt,.json,.md,.csv" onChange={handleFileUpload} />
                                <button onClick={() => fileInputRef.current?.click()} disabled={isUploadingFile} className="w-full py-4 border-2 border-dashed border-white/10 hover:border-amber-500/50 hover:bg-amber-500/5 rounded-xl text-white/40 hover:text-amber-400 flex flex-col items-center gap-2 transition-all">
                                    {isUploadingFile ? <Activity className="w-6 h-6 animate-spin" /> : <UploadCloud className="w-6 h-6" />}
                                    <span className="text-xs font-bold">{isUploadingFile ? 'جاري الرفع...' : 'اضغط لرفع ملف (PDF, TXT, JSON)'}</span>
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-2">
                                {agentDbData.documents?.map((doc, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 group hover:border-amber-500/30">
                                        <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500"><FileText className="w-4 h-4" /></div>
                                        <div className="flex-1"><p className="text-xs font-bold text-white">{doc.name}</p><p className="text-[10px] text-white/30 font-mono uppercase">{doc.mimeType}</p></div>
                                        <button onClick={() => removeDocument(idx)} className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- ANALYTICS VIEW --- */}
        {activeView === 'analytics' && (
            <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 border border-amber-500/20">
                        <BarChart2 className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-black text-white">تحليل البيانات (Analytics)</h3>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 bg-[#0a0a0a]/80 backdrop-blur-md rounded-[24px] border border-white/5 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <h4 className="text-[10px] uppercase font-black text-white/40 mb-1">إجمالي الأعضاء</h4>
                        <div className="text-2xl font-black text-white flex items-center gap-2">
                            {realProfiles.length} <Users className="w-4 h-4 text-white/20" />
                        </div>
                    </div>
                    <div className="p-5 bg-[#0a0a0a]/80 backdrop-blur-md rounded-[24px] border border-white/5 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <h4 className="text-[10px] uppercase font-black text-white/40 mb-1">الأعضاء النشطين</h4>
                        <div className="text-2xl font-black text-emerald-400 flex items-center gap-2">
                            {realProfiles.filter(p => p.status === 'active').length} <CheckCircle className="w-4 h-4 text-emerald-500/30" />
                        </div>
                    </div>
                    <div className="p-5 bg-[#0a0a0a]/80 backdrop-blur-md rounded-[24px] border border-white/5 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <h4 className="text-[10px] uppercase font-black text-white/40 mb-1">المسوقين (Affiliates)</h4>
                        <div className="text-2xl font-black text-amber-500 flex items-center gap-2">
                            {realProfiles.filter(p => p.affiliate && p.affiliate.isMarketer).length} <Briefcase className="w-4 h-4 text-amber-500/30" />
                        </div>
                    </div>
                    <div className="p-5 bg-[#0a0a0a]/80 backdrop-blur-md rounded-[24px] border border-white/5 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <h4 className="text-[10px] uppercase font-black text-white/40 mb-1">الربح المتوقع (إجمالي)</h4>
                        <div className="text-2xl font-black text-purple-400 flex items-center gap-2">
                            {expectedProfit.toLocaleString()}ج <Wallet className="w-4 h-4 text-purple-500/30" />
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-[#080808]/80 backdrop-blur-md rounded-[32px] border border-white/5 w-full flex flex-col justify-center min-h-[350px]">
                     <h4 className="text-sm font-bold text-white mb-6">نمو الأعضاء (آخر 7 أيام)</h4>
                     <div className="flex-1 w-full relative min-h-[250px]">
                         <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={growthData}>
                                <defs>
                                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                <XAxis dataKey="name" stroke="#ffffff50" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                <YAxis stroke="#ffffff50" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                <RechartsTooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '12px', fontSize: '12px' }} />
                                <Area type="monotone" dataKey="users" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        )}
      </div>

      <nav className="fixed bottom-[32px] left-0 w-full bg-black/95 border-t border-white/10 z-[100] rounded-t-[40px]">
        <div className="flex items-center justify-start md:justify-center max-w-full md:max-w-4xl mx-auto overflow-x-auto gap-4 px-6 pt-5 pb-6 scrollbar-none relative z-[105]">
            <button onClick={() => setActiveView('analytics')} className={`flex flex-col items-center flex-shrink-0 min-w-[50px] gap-1 transition-all ${activeView === 'analytics' ? 'text-white scale-110' : 'text-white/30 hover:text-white/60'}`}><BarChart2 className="w-5 h-5" /><span className="text-[8px] font-bold">تحليل</span></button>
            <button onClick={() => setActiveView('members')} className={`flex flex-col items-center flex-shrink-0 min-w-[50px] gap-1 transition-all ${activeView === 'members' ? 'text-white scale-110' : 'text-white/30 hover:text-white/60'}`}><Users className="w-5 h-5" /><span className="text-[8px] font-bold">الأعضاء</span></button>
            <button onClick={() => setActiveView('marketers')} className={`flex flex-col items-center flex-shrink-0 min-w-[50px] gap-1 transition-all ${activeView === 'marketers' ? 'text-white scale-110' : 'text-white/30 hover:text-white/60'}`}><Briefcase className="w-5 h-5" /><span className="text-[8px] font-bold">المسوقين</span></button>
            <button onClick={() => { if(onNavigateTo) onNavigateTo('affiliate'); }} className={`flex flex-col items-center flex-shrink-0 min-w-[50px] gap-1 transition-all text-white/30 hover:text-white/60`}><DollarSign className="w-5 h-5" /><span className="text-[8px] font-bold">عمولاتي</span></button>
            <button onClick={() => setActiveView('requests')} className={`flex flex-col items-center flex-shrink-0 min-w-[50px] gap-1 transition-all ${activeView === 'requests' ? 'text-white scale-110' : 'text-white/30 hover:text-white/60'}`}><CreditCard className="w-5 h-5" /><span className="text-[8px] font-bold">الطلبات</span></button>
            
            <button onClick={() => { if(onNavigateTo) onNavigateTo('chat'); }} className="flex-shrink-0 min-w-[48px] w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center text-black shadow-[0_0_20px_rgba(245,158,11,0.5)] hover:scale-110 transition-transform"><Bot className="w-6 h-6" /></button>

            <button onClick={() => setActiveView('settings')} className={`flex flex-col items-center flex-shrink-0 min-w-[50px] gap-1 transition-all ${activeView === 'settings' ? 'text-white scale-110' : 'text-white/30 hover:text-white/60'}`}><Settings className="w-5 h-5" /><span className="text-[8px] font-bold">المفاتيح</span></button>
            <button onClick={() => setActiveView('feedback')} className={`flex flex-col items-center flex-shrink-0 min-w-[50px] gap-1 transition-all ${activeView === 'feedback' ? 'text-white scale-110' : 'text-white/30 hover:text-white/60'}`}><MessageCircle className="w-5 h-5" /><span className="text-[8px] font-bold">الآراء</span></button>
            <button onClick={() => setActiveView('coupons')} className={`flex flex-col items-center flex-shrink-0 min-w-[50px] gap-1 transition-all ${activeView === 'coupons' ? 'text-white scale-110' : 'text-white/30 hover:text-white/60'}`}><Tag className="w-5 h-5" /><span className="text-[8px] font-bold">كوبونات</span></button>
            <button onClick={() => setActiveView('broadcast')} className={`flex flex-col items-center flex-shrink-0 min-w-[50px] gap-1 transition-all ${activeView === 'broadcast' ? 'text-white scale-110' : 'text-white/30 hover:text-white/60'}`}><Megaphone className="w-5 h-5" /><span className="text-[8px] font-bold">النبض</span></button>
            <button onClick={() => setActiveView('core')} className={`flex flex-col items-center flex-shrink-0 min-w-[50px] gap-1 transition-all ${activeView === 'core' ? 'text-white scale-110' : 'text-white/30 hover:text-white/60'}`}><Cpu className="w-5 h-5" /><span className="text-[8px] font-bold">النواة</span></button>
            <button onClick={() => setActiveView('architecture')} className={`flex flex-col items-center flex-shrink-0 min-w-[50px] gap-1 transition-all ${activeView === 'architecture' ? 'text-white scale-110' : 'text-white/30 hover:text-white/60'}`}><Network className="w-5 h-5" /><span className="text-[8px] font-bold">المعمارية</span></button>
        </div>
      </nav>

      {selectedProof && <div className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center p-4" onClick={() => setSelectedProof(null)}><img src={selectedProof || undefined} className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl" /><button className="absolute top-6 right-6 p-3 bg-red-600 rounded-full text-white"><X className="w-6 h-6" /></button></div>}
    </div>
  );
};

export default AdminDashboard;
