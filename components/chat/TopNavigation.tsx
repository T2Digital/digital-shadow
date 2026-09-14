import React from 'react';
import { Home, Search, X, Brain, Activity, AlertTriangle, Cloud, RefreshCw, CloudOff, Ear, DollarSign, Shield, Waves, Key, Smartphone, Volume2, VolumeX, Crown, Bot, Cpu, Music, Phone } from 'lucide-react';
import { ShadowFace } from '../ShadowFace';

interface TopNavigationProps {
    onBack: () => void;
    onNavigateTo?: (section: string) => void;
    isAdmin?: boolean;
    isSearchActive: boolean;
    setIsSearchActive: (val: boolean) => void;
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    searchInputRef: React.RefObject<HTMLInputElement>;
    appStatus: 'idle' | 'listening' | 'thinking' | 'speaking';
    isTito: boolean;
    getGreetingSubtitle: () => React.ReactNode;
    isSentinelMode: boolean;
    toggleSentinelMode: () => void;
    speechSupported: boolean;
    syncStatus: 'synced' | 'syncing' | 'offline' | 'error';
    onOpenAffiliate?: () => void;
    isRestrictedMode: boolean;
    hasVoiceSignature: boolean;
    setShowVoiceBiometricsManager: (val: boolean) => void;
    setShowLiveAPIMode: (val: boolean) => void;
    setShowMemoryVault: (val: boolean) => void;
    setShowLocalDeepDive?: (val: boolean) => void;
    setShowPersonalKeys: (val: boolean) => void;
    setShowNativeSettings: (val: boolean) => void;
    setShowAutonomousManager?: (val: boolean) => void;
    setShowShadowMesh?: (val: boolean) => void;
    runningTasks?: number;
    isMuted: boolean;
    setIsMuted: (val: boolean) => void;
    audioLevel: number;
    onFaceClick: () => void;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
    onBack, onNavigateTo, isAdmin, isSearchActive, setIsSearchActive, searchQuery, setSearchQuery, searchInputRef,
    appStatus, isTito, getGreetingSubtitle, isSentinelMode, toggleSentinelMode,
    speechSupported, syncStatus, onOpenAffiliate, isRestrictedMode,
    hasVoiceSignature, setShowVoiceBiometricsManager, setShowLiveAPIMode,
    setShowMemoryVault, setShowLocalDeepDive, setShowPersonalKeys, setShowNativeSettings, setShowAutonomousManager, setShowShadowMesh, runningTasks = 0,
    isMuted, setIsMuted, audioLevel, onFaceClick
}) => {
    return (
        <div className="py-2 px-4 border-b border-white/10 bg-[#0a0a0a] flex flex-col gap-2 shrink-0 z-50 shadow-md relative transition-all">
            <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all group shrink-0">
                        <Home className="w-4 h-4 group-hover:text-cyan-400 transition-colors" />
                    </button>
                    {!isSearchActive && (
                        <div className="overflow-hidden">
                            <h1 className="text-base font-black tracking-tighter leading-none text-white whitespace-nowrap">غرفة عمليات الظل</h1>
                            <div className="flex items-center gap-1 mt-1">
                                <span className={`text-[10px] font-bold truncate ${isTito ? 'text-amber-500' : 'text-purple-500'}`}>{getGreetingSubtitle()}</span>
                                <span className="text-[10px] text-white/30">•</span>
                                <span className={`text-[9px] font-bold uppercase tracking-widest ${isSentinelMode ? 'text-red-500 animate-pulse' : 'text-white/40'}`}>{isSentinelMode ? 'Sentinel ON' : 'Live'}</span>
                            </div>
                        </div>
                    )}
                </div>
                {isSearchActive ? (
                    <div className="flex-1 flex items-center gap-2 animate-in fade-in slide-in-from-right-2 ml-3">
                        <div className="relative flex-1">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                            <input 
                                ref={searchInputRef} 
                                type="text" 
                                value={searchQuery} 
                                onChange={(e) => setSearchQuery(e.target.value)} 
                                placeholder="ابحث في الذاكرة..." 
                                className="w-full bg-[#1a1a1a] border border-white/10 rounded-full py-1.5 pr-9 pl-4 text-sm text-white focus:border-purple-500/50 outline-none" 
                            />
                        </div>
                        <button onClick={() => { setIsSearchActive(false); setSearchQuery(''); }} className="p-1.5 bg-white/5 rounded-full hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-all">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center pointer-events-auto">
                        <ShadowFace 
                            appStatus={appStatus} 
                            audioLevel={audioLevel} 
                            size="small" 
                            onClick={onFaceClick} 
                        />
                    </div>
                )}
            </div>
            
            {/* Tool buttons row directly underneath title/user */}
            {!isSearchActive && (
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1 px-1">
                    {!speechSupported && (
                        <div className="flex shrink-0 items-center justify-center p-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400" title="متصفحك لا يدعم التعرف على الصوت">
                            <AlertTriangle className="w-4 h-4" />
                        </div>
                    )}
                    
                    {isAdmin && onNavigateTo && (
                        <button onClick={() => onNavigateTo('admin')} className="p-2 shrink-0 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 transition-all" title="لوحة القيادة">
                            <Crown className="w-4 h-4" />
                        </button>
                    )}
                    
                    <button onClick={toggleSentinelMode} className={`p-2 shrink-0 rounded-full border transition-all flex items-center justify-center ${isSentinelMode ? 'bg-red-600 text-white border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'bg-white/5 border-white/10 text-white/30 hover:text-white hover:border-white/20'}`} title={isSentinelMode ? 'الحارس نشط' : 'الحارس (للخلفية)'}>
                        <Ear className={`w-4 h-4 ${isSentinelMode ? 'animate-pulse' : ''}`} />
                    </button>
                    
                    {setShowAutonomousManager && (
                        <button onClick={() => setShowAutonomousManager(true)} className={`relative p-2 shrink-0 rounded-full border transition-all flex items-center justify-center ${runningTasks > 0 ? 'bg-fuchsia-600/20 text-fuchsia-400 border-fuchsia-500/50 shadow-[0_0_10px_rgba(217,70,239,0.2)]' : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/20'}`} title="المهام الآلية المستقلة">
                            <Bot className={`w-4 h-4 ${runningTasks > 0 ? 'animate-pulse' : ''}`} />
                            {runningTasks > 0 && <span className="absolute -top-1 -right-1 bg-fuchsia-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">{runningTasks}</span>}
                        </button>
                    )}
                    
                    {onOpenAffiliate && !isRestrictedMode && (
                        <button onClick={onOpenAffiliate} className="p-2 shrink-0 bg-emerald-900/20 border border-emerald-500/20 rounded-full text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all">
                            <DollarSign className="w-4 h-4" />
                        </button>
                    )}

                    {setShowAutonomousManager && (
                        <button 
                            onClick={() => setShowAutonomousManager(true)} 
                            className="p-2 shrink-0 bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 hover:from-cyan-500/30 hover:to-emerald-500/30 border border-cyan-500/40 text-cyan-300 rounded-full transition-all select-none shadow-lg shadow-cyan-500/10 flex items-center gap-1.5 px-3" 
                            title="الهاتف والمكالمات والحجوزات الفائقة (Super-Agent Hub)"
                        >
                            <Phone className="w-4 h-4 text-cyan-400" />
                            <span className="text-[10px] font-black hidden md:inline">هاتف الظل والحجوزات</span>
                        </button>
                    )}

                    {onNavigateTo && (
                        <button onClick={() => onNavigateTo('music')} className="p-2 shrink-0 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-400 rounded-full transition-all select-none" title="استوديو إنتاج وتلحين الأغاني">
                            <Music className="w-4 h-4" />
                        </button>
                    )}
                    
                    <button onClick={() => setIsSearchActive(true)} className="p-2 shrink-0 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-white/50 hover:text-white transition-all">
                        <Search className="w-4 h-4" />
                    </button>
                    
                    <button onClick={() => setShowVoiceBiometricsManager(true)} className={`p-2 shrink-0 rounded-full border transition-all ${hasVoiceSignature ? 'bg-purple-500/10 border-purple-500/50 text-purple-400' : 'bg-white/5 border-white/10 text-white/30 hover:text-white'}`} title="البصمة الصوتية">
                        <Shield className="w-4 h-4" />
                    </button>
                    
                    <button onClick={() => setShowLiveAPIMode(true)} className="p-2 shrink-0 rounded-full bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 transition-all select-none" title="Live API (محاكاة WebRTC)">
                        <Waves className="w-4 h-4" />
                    </button>
                    
                    <button onClick={() => setShowMemoryVault(true)} className="p-2 shrink-0 rounded-full bg-fuchsia-500/10 hover:bg-fuchsia-500/20 border border-fuchsia-500/20 text-fuchsia-400 transition-all select-none" title="الذاكرة المعرفية">
                        <Brain className="w-4 h-4" />
                    </button>
                    
                    {setShowLocalDeepDive && (
                        <button onClick={() => setShowLocalDeepDive(true)} className="p-2 shrink-0 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 transition-all select-none" title="الوضع المحلي الأوفلاين">
                            <Cpu className="w-4 h-4" />
                        </button>
                    )}
                    
                    {setShowShadowMesh && (
                        <button onClick={() => setShowShadowMesh(true)} className="p-2 shrink-0 rounded-full bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 transition-all select-none" title="الترابط الشبكي بين الظلال">
                            <span className="flex items-center justify-center">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="16" y="16" width="6" height="6" rx="1"></rect><rect x="2" y="16" width="6" height="6" rx="1"></rect><rect x="9" y="2" width="6" height="6" rx="1"></rect><path d="M5 16v-3a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v3"></path><path d="M12 12V8"></path></svg>
                            </span>
                        </button>
                    )}

                    {isAdmin && (
                        <button onClick={() => setShowPersonalKeys(true)} className="p-2 shrink-0 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-white/50 hover:text-white transition-all select-none" title="مفاتيحي الخاصة">
                            <Key className="w-4 h-4" />
                        </button>
                    )}
                    
                    <button onClick={() => setShowNativeSettings(true)} className="p-2 shrink-0 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 transition-all select-none" title="إعدادات النظام العميق">
                        <Smartphone className="w-4 h-4" />
                    </button>
                    
                    <button onClick={() => setIsMuted(!isMuted)} className={`p-2 shrink-0 rounded-full border transition-all ${isMuted ? 'bg-white/5 border-white/10 text-white/30' : 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400'}`}>
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    
                    <div className="shrink-0 flex items-center justify-center p-2 rounded-full bg-white/5 border border-white/10" title={`حالة المزامنة: ${syncStatus}`}>
                        {syncStatus === 'synced' && <Cloud className="w-4 h-4 text-emerald-400" />}
                        {syncStatus === 'syncing' && <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />}
                        {syncStatus === 'offline' && <CloudOff className="w-4 h-4 text-white/40" />}
                        {syncStatus === 'error' && <CloudOff className="w-4 h-4 text-red-500" />}
                    </div>
                </div>
            )}
        </div>
    );
};
