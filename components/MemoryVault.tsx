import React, { useEffect, useState, useRef } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Brain, Trash2, X, Activity, Plus, Save, Database, Shield, FileText, Cloud, Download, Upload, Network } from 'lucide-react';
import { useAppStore } from '../services/store';
import { shadowDB } from '../services/dbService';
import { memorizeFact } from '../services/geminiService';

export const MemoryVault: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { user, setUser } = useAppStore();
    const [activeTab, setActiveTab] = useState<'facts' | 'graph' | 'rules' | 'context' | 'backup'>('graph');
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Facts & Graph State
    const [memories, setMemories] = useState<any[]>([]);
    const [loadingFacts, setLoadingFacts] = useState(true);
    const [newFact, setNewFact] = useState('');

    // Rules State
    const [rules, setRules] = useState('');
    const [savingRules, setSavingRules] = useState(false);

    // Context State
    const [context, setContext] = useState('');
    const [savingContext, setSavingContext] = useState(false);

    const loadData = async () => {
        if (user?.email) {
            const mems = await shadowDB.getMemory(user.email);
            setMemories(mems.filter(m => m.fact).reverse());
            setContext(user.longTermMemory || '');
        }
        setLoadingFacts(false);
        const globalRules = await shadowDB.getGlobalRules();
        setRules(globalRules || '');
    };

    useEffect(() => {
        loadData();
    }, [user, activeTab]);

    const handleDeleteFact = async (id: number) => {
        await shadowDB.deleteMemory(id);
        setMemories(prev => prev.filter(m => m.id !== id));
    };

    const handleAddFact = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFact.trim() || !user || user.email === 'GUEST') return;
        
        await memorizeFact(user.email, newFact.trim());
        setNewFact('');
        loadData();
    };

    const handleSaveRules = async () => {
        setSavingRules(true);
        await shadowDB.updateGlobalRules(rules);
        setSavingRules(false);
    };

    const handleSaveContext = async () => {
        if (!user || user.email === 'GUEST') return;
        setSavingContext(true);
        const updatedUser = { ...user, longTermMemory: context };
        await shadowDB.saveProfile(updatedUser);
        setUser(updatedUser);
        setSavingContext(false);
    };

    const handleExportBackup = async () => {
        if (!user?.email) return;
        try {
            const profiles = await shadowDB.getProfile(user.email);
            const history = await shadowDB.getHistory(user.email);
            const rules = await shadowDB.getGlobalRules();
            const memory = await shadowDB.getMemory(user.email);
            
            const backupData = {
                timestamp: Date.now(),
                version: '1.0',
                profiles: [profiles],
                history,
                rules,
                memory
            };
            
            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `shadow_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            alert('تم استخراج النسخة الاحتياطية بنجاح.');
        } catch (e: any) {
            alert('خطأ أثناء التصدير: ' + e.message);
        }
    };

    const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);
                if (data.profiles && data.profiles.length > 0) {
                    await shadowDB.saveProfile(data.profiles[0]);
                }
                if (data.rules) {
                    await shadowDB.updateGlobalRules(data.rules);
                }
                alert('تم استيراد النسخة الاحتياطية بنجاح.');
                loadData();
            } catch (error) {
                alert('الملف غير صالح أو مشوه.');
            }
        };
        reader.readAsText(file);
    };

    const renderGraph = () => {
        return (
            <div className="relative w-full h-full bg-[#030008] overflow-hidden flex items-center justify-center p-4">
                {/* Simulated Neural Graph Background Grid - Space Alien Theme */}
                <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-purple-900/10 to-[#030008]"></div>
                
                {/* Floating Stardust / Alien Particles */}
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] animate-[pulse_8s_infinite]"></div>

                <div className="w-full h-full relative border border-cyan-500/20 rounded-xl bg-[#030008]/60 overflow-hidden shadow-[inset_0_0_80px_rgba(30,58,138,0.5)]">
                    <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none">
                        <defs>
                            <pattern id="hexGrid" width="60" height="103.923" patternUnits="userSpaceOnUse" patternTransform="scale(0.5)">
                                <path fill="none" stroke="rgba(6,182,212,0.3)" strokeWidth="1" d="M30 0l25.98 15v30L30 60 4.02 45V15z"/>
                                <path fill="none" stroke="rgba(6,182,212,0.15)" strokeWidth="1" d="M30 103.923l25.98-15v-30L30 43.923l-25.98 15v30z M60 51.962l25.98-15v-30L60 6.962l-25.98 15v30z M0 51.962L25.98 36.962v-30L0 6.962l-25.98 15v30z"/>
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#hexGrid)" />
                    </svg>
                    
                    {memories.length === 0 ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-cyan-400/50 font-mono text-sm tracking-[0.3em] uppercase">
                            <Activity className="w-12 h-12 mb-4 opacity-50 animate-pulse" />
                            No alien neural signatures detected
                        </div>
                    ) : (
                        <div className="absolute inset-0">
                            <TransformWrapper
                                initialScale={1}
                                minScale={0.1}
                                maxScale={4}
                                centerOnInit={true}
                                limitToBounds={false}
                                panning={{ disabled: false }}
                                wheel={{ step: 0.1 }}
                            >
                               {({ zoomIn, zoomOut, resetTransform }) => (
                                 <>
                                   <div className="absolute top-4 right-4 z-[60] flex flex-col gap-2 bg-black/40 backdrop-blur-md p-2 rounded-xl border border-white/10 shadow-lg pointer-events-auto">
                                     <button onClick={() => zoomIn()} className="p-2 hover:bg-white/10 rounded-lg text-cyan-400 transition-colors tooltip tooltip-left" data-tip="تكبير">+</button>
                                     <button onClick={() => zoomOut()} className="p-2 hover:bg-white/10 rounded-lg text-cyan-400 transition-colors tooltip tooltip-left" data-tip="تصغير">-</button>
                                     <button onClick={() => resetTransform()} className="p-2 hover:bg-white/10 rounded-lg text-cyan-400 transition-colors tooltip tooltip-left" data-tip="توسيط">⟲</button>
                                   </div>
                                <TransformComponent wrapperStyle={{ width: '100%', height: '100%', cursor: 'grab' }} contentStyle={{ width: '1500px', height: '1000px' }}>
                                    <div className="relative w-[1500px] h-[1000px] mx-auto my-auto">
                                <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                                    <defs>
                                        <filter id="neonGlowCore" x="-50%" y="-50%" width="200%" height="200%">
                                            <feGaussianBlur stdDeviation="8" result="blur" />
                                            <feMerge>
                                                <feMergeNode in="blur" />
                                                <feMergeNode in="SourceGraphic" />
                                            </feMerge>
                                        </filter>
                                        <filter id="neonGlowLine" x="-20%" y="-20%" width="140%" height="140%">
                                            <feGaussianBlur stdDeviation="3" result="blur" />
                                            <feMerge>
                                                <feMergeNode in="blur" />
                                                <feMergeNode in="blur" />
                                                <feMergeNode in="SourceGraphic" />
                                            </feMerge>
                                        </filter>
                                        <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                                            <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.8" />
                                            <stop offset="100%" stopColor="#ec4899" stopOpacity="0.8" />
                                        </linearGradient>
                                    </defs>
                                    
                                    {/* Draw simulated alien connections */}
                                    {memories.slice(0, 20).map((m, i) => {
                                        if (i === memories.length - 1) return null;
                                        // Random organic paths
                                        const x1 = 200 + ((i % 6) * 220) + (Math.sin(i)*50);
                                        const y1 = 150 + (Math.floor(i / 6) * 220) + (Math.cos(i)*50);
                                        const x2 = 200 + (((i+1) % 6) * 220) + (Math.sin(i+1)*50);
                                        const y2 = 150 + (Math.floor((i+1) / 6) * 220) + (Math.cos(i+1)*50);
                                        
                                        const cx = (x1 + x2) / 2 + (Math.random() * 100 - 50);
                                        const cy = (y1 + y2) / 2 + (Math.random() * 100 - 50);
                                        
                                        return (
                                            <g key={`connection-${i}`}>
                                                {/* Background faint line */}
                                                <path d={`M ${x1+70} ${y1+35} Q ${cx} ${cy} ${x2+70} ${y2+35}`} stroke="rgba(139,92,246,0.15)" strokeWidth="2" fill="none" />
                                                {/* Glowing animated pulse line */}
                                                <path d={`M ${x1+70} ${y1+35} Q ${cx} ${cy} ${x2+70} ${y2+35}`} stroke="url(#neonGradient)" strokeWidth="2" fill="none" filter="url(#neonGlowLine)" strokeDasharray="10 20" className="animate-[dash_2s_linear_infinite]" />
                                            </g>
                                        )
                                    })}

                                    {/* Central Master Node Connections */}
                                    {memories.slice(0, 20).map((m, i) => {
                                        const x1 = 200 + ((i % 6) * 220) + (Math.sin(i)*50);
                                        const y1 = 150 + (Math.floor(i / 6) * 220) + (Math.cos(i)*50);
                                        return (
                                            <path key={`mline-${i}`} d={`M ${x1+70} ${y1+35} C ${x1+70} 500, 750 ${y1+35}, 750 500`} stroke="rgba(6,182,212,0.3)" strokeWidth="1.5" fill="none" filter="url(#neonGlowLine)" strokeDasharray="5 15" className="animate-[dash_3s_linear_infinite_reverse]" />
                                        );
                                    })}
                                </svg>

                                {/* Center Master Node: The Alien Brain */}
                                <div className="absolute rounded-full border-4 border-cyan-400 bg-cyan-900/40 shadow-[0_0_80px_rgba(6,182,212,0.8)] flex flex-col items-center justify-center cursor-default z-30 backdrop-blur-xl animate-[pulse_4s_ease-in-out_infinite]" style={{ left: 670, top: 420, width: 160, height: 160 }}>
                                    <div className="absolute inset-0 rounded-full border border-cyan-300 opacity-50 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                                    <Brain className="w-12 h-12 text-cyan-300 mb-2 filter drop-shadow-[0_0_10px_rgba(103,232,249,0.8)]" />
                                    <div className="text-cyan-100 font-black text-center text-sm tracking-widest uppercase filter drop-shadow-[0_0_5px_rgba(6,182,212,1)]">
                                        Core Syntax
                                    </div>
                                    <div className="text-[9px] text-cyan-300/80 font-mono mt-1">NEXUS ACTIVE</div>
                                </div>

                                {/* Graph Nodes: The Alien Data Clusters */}
                                {memories.slice(0, 20).map((m, i) => {
                                    const left = 200 + ((i % 6) * 220) + (Math.sin(i)*50);
                                    const top = 150 + (Math.floor(i / 6) * 220) + (Math.cos(i)*50);
                                    const isRecent = i < 3;
                                    const floatDelay = `${(i % 5) * 0.5}s`;
                                    
                                    return (
                                        <div key={m.id} className="absolute group z-20 cursor-pointer w-[140px] flex flex-col items-center" style={{ left, top, animation: `float_${(i%3)+4}s_ease-in-out_infinite`, animationDelay: floatDelay }}>
                                            <div className={`relative w-8 h-8 rounded-full border-2 ${isRecent ? 'border-pink-500 bg-pink-500/20 shadow-[0_0_30px_rgba(236,72,153,0.8)]' : 'border-purple-500 bg-purple-900/40 shadow-[0_0_20px_rgba(168,85,247,0.5)]'} flex items-center justify-center backdrop-blur-md`}>
                                                <div className={`w-3 h-3 rounded-full ${isRecent ? 'bg-pink-400 animate-pulse outline outline-2 outline-offset-2 outline-pink-500/50' : 'bg-purple-400'}`}></div>
                                                {/* Orbiting data speck */}
                                                {isRecent && <div className="absolute w-full h-full animate-[spin_3s_linear_infinite]"><div className="w-1.5 h-1.5 bg-cyan-300 rounded-full absolute top-[-3px] left-1/2 -translate-x-1/2 shadow-[0_0_10px_rgba(103,232,249,1)]"></div></div>}
                                            </div>
                                            
                                            <div className="mt-3 relative">
                                                {/* Cyberpunk styled text box */}
                                                <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/90 to-transparent backdrop-blur-xl border-t-2 border-l border-r border-[#ffffff10] rounded-t-lg -z-10 group-hover:border-t-cyan-400/80 transition-colors duration-300"></div>
                                                <div className="p-3 text-center text-[11px] font-bold text-white/90 shadow-2xl opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all group-hover:-translate-y-1 group-hover:text-cyan-100 flex flex-col gap-1 items-center">
                                                    <span className="line-clamp-3 leading-relaxed">{m.fact}</span>
                                                    <span className="text-[8px] text-fuchsia-400/60 font-mono tracking-widest mt-1 opacity-0 group-hover:opacity-100 transition-opacity">DATA_{m.id}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                    </div>
                                </TransformComponent>
                                </>
                               )}
                            </TransformWrapper>
                        </div>
                    )}
                    <style dangerouslySetInnerHTML={{__html: `
                        @keyframes dash { to { stroke-dashoffset: -30; } }
                        @keyframes float_4s { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
                        @keyframes float_5s { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
                        @keyframes float_6s { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
                    `}} />
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[600] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
            <div className="bg-[#111] border border-fuchsia-500/20 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-[0_0_50px_rgba(217,70,239,0.1)] relative overflow-hidden font-['Cairo']" dir="rtl">
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#0a0a0a]">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-fuchsia-500/20 rounded-xl border border-fuchsia-500/30 shadow-[0_0_15px_rgba(217,70,239,0.3)]">
                            <Brain className="w-6 h-6 text-fuchsia-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white">خزانة الذاكرة (Memory Vault)</h2>
                            <p className="text-[10px] text-fuchsia-300 font-mono tracking-widest mt-1 flex items-center gap-1">
                                <Activity className="w-3 h-3 animate-pulse" /> Shadow SLM Database Management
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/50 hover:text-white transition-all">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                {/* Tabs */}
                <div className="flex border-b border-white/5 bg-[#0d0d0d] px-4 overflow-x-auto scrollbar-hide">
                    <button 
                        onClick={() => setActiveTab('graph')}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'graph' ? 'border-fuchsia-500 text-fuchsia-400' : 'border-transparent text-white/50 hover:text-white/80'}`}
                    >
                        <Network className="w-4 h-4" /> الخريطة الذهنية
                    </button>
                    <button 
                        onClick={() => setActiveTab('facts')}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'facts' ? 'border-fuchsia-500 text-fuchsia-400' : 'border-transparent text-white/50 hover:text-white/80'}`}
                    >
                        <Database className="w-4 h-4" /> البيانات الخام
                    </button>
                    <button 
                        onClick={() => setActiveTab('rules')}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'rules' ? 'border-blue-500 text-blue-400' : 'border-transparent text-white/50 hover:text-white/80'}`}
                    >
                        <Shield className="w-4 h-4" /> القوانين التأسيسية
                    </button>
                    <button 
                        onClick={() => setActiveTab('context')}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'context' ? 'border-amber-500 text-amber-400' : 'border-transparent text-white/50 hover:text-white/80'}`}
                    >
                        <FileText className="w-4 h-4" /> سياق الماستر
                    </button>
                    <button 
                        onClick={() => setActiveTab('backup')}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'backup' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-white/50 hover:text-white/80'}`}
                    >
                        <Cloud className="w-4 h-4" /> تزامن ونسخ
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-0 bg-[#0a0a0a] relative">
                    {/* GRAPH TAB */}
                    {activeTab === 'graph' && renderGraph()}

                    {/* FACTS TAB */}
                    {activeTab === 'facts' && (
                        <div className="flex flex-col h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                            <div className="p-4 border-b border-white/5 bg-black/50 sticky top-0 z-10">
                                <form onSubmit={handleAddFact} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newFact}
                                        onChange={(e) => setNewFact(e.target.value)}
                                        placeholder="أضف حقيقة أو معلومة جديدة يدوياً..."
                                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-fuchsia-500/50 transition-colors"
                                    />
                                    <button type="submit" disabled={!newFact.trim()} className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-4 py-2 font-bold rounded-xl transition-all flex items-center gap-2 disabled:opacity-50">
                                        <Plus className="w-4 h-4" /> إضافة
                                    </button>
                                </form>
                            </div>
                            
                            <div className="p-4 space-y-3">
                                {loadingFacts ? (
                                    <div className="flex justify-center py-10 text-white/30 text-xs">جاري تحميل الذاكرة...</div>
                                ) : memories.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-white/30 gap-2">
                                        <Database className="w-12 h-12 opacity-50" />
                                        <p className="text-sm font-bold">لاتوجد حقائق مستخرجة حتى الآن.</p>
                                    </div>
                                ) : (
                                    memories.map((m, i) => (
                                        <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 flex gap-3 items-center group transition-all hover:bg-white/10">
                                            <div className="flex-1">
                                                <p className="text-sm text-white/90 leading-6">{m.fact}</p>
                                                <p className="text-[10px] text-white/30 mt-1 font-mono" dir="ltr">
                                                    ID: {m.id} | {new Date(m.createdAt || Date.now()).toLocaleString('ar-EG')}
                                                </p>
                                            </div>
                                            <button onClick={() => handleDeleteFact(m.id)} className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all opacity-0 group-hover:opacity-100 min-w-10 flex justify-center items-center">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* RULES TAB */}
                    {activeTab === 'rules' && (
                        <div className="flex flex-col h-full p-4 gap-4">
                            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl text-xs text-blue-200">
                                القوانين التأسيسية هي التعليمات الجذرية التي تحدد كيف يتصرف الظل الرقمي (المايسترو). قم بتعديلها لتغيير سلوكه الأساسي بالكامل.
                            </div>
                            <textarea
                                value={rules}
                                onChange={e => setRules(e.target.value)}
                                className="flex-1 bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-blue-100 font-mono focus:border-blue-500/50 outline-none resize-none"
                                placeholder="اكتب القوانين الأساسية هنا..."
                            />
                            <div className="flex justify-end pt-2">
                                <button onClick={handleSaveRules} disabled={savingRules} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 font-bold rounded-xl transition-all flex items-center gap-2">
                                    {savingRules ? <Activity className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    حفظ القوانين
                                </button>
                            </div>
                        </div>
                    )}

                    {/* CONTEXT TAB */}
                    {activeTab === 'context' && (
                        <div className="flex flex-col h-full p-4 gap-4">
                            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-xs text-amber-200">
                                هذا هو سياقك الشخصي (Long-Term Memory). كل ما يستنتجه النظام عن شخصيتك وعملك يتم تخزينه هنا لتوجيه الإجابات لتناسبك.
                            </div>
                            <textarea
                                value={context}
                                onChange={e => setContext(e.target.value)}
                                className="flex-1 bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-amber-100 font-sans leading-loose focus:border-amber-500/50 outline-none resize-none"
                                placeholder="سياق المستخدم..."
                            />
                            <div className="flex justify-end pt-2">
                                <button onClick={handleSaveContext} disabled={savingContext || !user || user.email === 'GUEST'} className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white px-6 py-3 font-bold rounded-xl transition-all flex items-center gap-2">
                                    {savingContext ? <Activity className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    حفظ السياق
                                </button>
                            </div>
                        </div>
                    )}

                    {/* BACKUP TAB */}
                    {activeTab === 'backup' && (
                        <div className="flex flex-col h-full p-6 gap-6">
                            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-xs text-emerald-200">
                                نظام الظل المعرفي يعمل بالكامل محلياً لضمان أفضل خصوصية. احرص على أخذ نسخة احتياطية بشكل دوري لتتمكن من استخدام الظل على أجهزة أخرى.
                            </div>
                            
                            <input 
                                type="file" 
                                className="hidden" 
                                accept=".json" 
                                ref={fileInputRef} 
                                onChange={handleImportBackup} 
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3 hover:bg-white/10 transition-colors cursor-pointer" onClick={handleExportBackup}>
                                    <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-2 text-blue-400">
                                        <Download className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-white font-bold text-lg">تصدير العقل (Export)</h3>
                                    <p className="text-white/50 text-xs">تحميل ملف مشفر يحتوي على ذاكرتك الكاملة وتفضيلاتك</p>
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3 hover:bg-white/10 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                    <div className="w-16 h-16 bg-fuchsia-500/20 rounded-full flex items-center justify-center mb-2 text-fuchsia-400">
                                        <Upload className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-white font-bold text-lg">حقن العقل (Import)</h3>
                                    <p className="text-white/50 text-xs">رفع ملف الذاكرة المعرفية لاستعادة بياناتك على هذا الجهاز</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


