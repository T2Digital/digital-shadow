import React from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Cpu, Users, Zap, Database, Brain, Globe, Bot, Terminal, Image as ImageIcon, FileText, Search, Activity, Code, Server, CreditCard, MessageCircle, Briefcase, PlayCircle, HardDrive, Film, LayoutGrid, FolderOpen, CheckCircle, Mic, ShieldCheck, GraduationCap, TrendingUp, Megaphone, HeartHandshake, PenTool, Video, ShoppingCart, CloudCog, Radio } from 'lucide-react';

export const ArchitectureMap = () => {
    return (
        <div className="w-full h-full min-h-[500px] rounded-2xl border border-cyan-500/20 bg-[#020005] overflow-hidden relative shadow-[inset_0_0_100px_rgba(6,182,212,0.15)] flex items-center justify-center p-0">
            {/* Alien Grid Background */}
            <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] animate-[pulse_10s_infinite] pointer-events-none"></div>

            <div className="absolute inset-0">
                <TransformWrapper
                    initialScale={0.35}
                    minScale={0.1}
                    maxScale={3}
                    centerOnInit={true}
                    limitToBounds={false}
                    wheel={{ step: 0.1 }}
                    panning={{ disabled: false }}
                >
                  {({ zoomIn, zoomOut, resetTransform }) => (
                    <>
                      <div className="absolute top-4 right-4 z-[60] flex flex-col gap-2 bg-black/40 backdrop-blur-md p-2 rounded-xl border border-white/10 shadow-lg">
                        <button onClick={() => zoomIn()} className="p-2 hover:bg-white/10 rounded-lg text-cyan-400 transition-colors tooltip tooltip-left" data-tip="تكبير">+</button>
                        <button onClick={() => zoomOut()} className="p-2 hover:bg-white/10 rounded-lg text-cyan-400 transition-colors tooltip tooltip-left" data-tip="تصغير">-</button>
                        <button onClick={() => resetTransform()} className="p-2 hover:bg-white/10 rounded-lg text-cyan-400 transition-colors tooltip tooltip-left" data-tip="توسيط">⟲</button>
                      </div>
                    <TransformComponent wrapperStyle={{ width: '100%', height: '100%', cursor: 'grab' }} contentStyle={{ width: '3000px', height: '2000px' }}>
                    <div className="relative w-[3000px] h-[2000px]">
                        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-0">
                            <defs>
                                <filter id="glowArchFull" x="-20%" y="-20%" width="140%" height="140%">
                                    <feGaussianBlur stdDeviation="4" result="blur" />
                                    <feMerge>
                                        <feMergeNode in="blur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                                <linearGradient id="coreToPersona" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#06b6d4" />
                                    <stop offset="100%" stopColor="#ec4899" />
                                </linearGradient>
                            </defs>
                            
                            {/* Dynamic connection lines generated automatically */}
                            {[
                                // CORE (1500, 1000) to Main Hubs
                                { x1: 1500, y1: 1000, x2: 1000, y2: 600, color: '#ec4899' }, // Personas (Interactive)
                                { x1: 1500, y1: 1000, x2: 1000, y2: 1400, color: '#f97316' }, // Personas (Autonomous)
                                { x1: 1500, y1: 1000, x2: 2000, y2: 600, color: '#8b5cf6' }, // Capabilities 
                                { x1: 1500, y1: 1000, x2: 1500, y2: 1500, color: '#06b6d4' }, // Infra & Core Func
                                { x1: 1500, y1: 1000, x2: 2000, y2: 1400, color: '#f59e0b' }, // Memory & System

                                // PERSONAS (Interactive) -> Sub
                                { x1: 1000, y1: 600, x2: 600, y2: 400, color: '#ec4899' }, // Leader
                                { x1: 1000, y1: 600, x2: 1100, y2: 300, color: '#ec4899' }, // Detective
                                { x1: 1000, y1: 600, x2: 700, y2: 800, color: '#ec4899' }, // Accountant
                                { x1: 1000, y1: 600, x2: 1300, y2: 700, color: '#ec4899' }, // Legal
                                { x1: 1000, y1: 600, x2: 1200, y2: 850, color: '#ec4899' }, // Marketer
                                { x1: 1000, y1: 600, x2: 800, y2: 300, color: '#ec4899' }, // Designer
                                { x1: 1000, y1: 600, x2: 1400, y2: 400, color: '#ec4899' }, // Editor
                                { x1: 1000, y1: 600, x2: 1400, y2: 550, color: '#ec4899' }, // Shopper
                                
                                // PERSONAS (Autonomous) -> Sub
                                { x1: 1000, y1: 1400, x2: 600, y2: 1200, color: '#f97316' }, // Executor
                                { x1: 1000, y1: 1400, x2: 500, y2: 1500, color: '#f97316' }, // Healer
                                { x1: 1000, y1: 1400, x2: 800, y2: 1700, color: '#f97316' }, // Analyst
                                { x1: 1000, y1: 1400, x2: 1200, y2: 1700, color: '#f97316' }, // Nexus
                                { x1: 1000, y1: 1400, x2: 1354, y2: 1240, color: '#f97316' }, // Archivist
                                { x1: 1000, y1: 1400, x2: 700, y2: 1450, color: '#f97316' }, // Swarm Manager
                                { x1: 1000, y1: 1400, x2: 1400, y2: 1550, color: '#f97316' }, // Live Session

                                { x1: 1000, y1: 1400, x2: 1354, y2: 1240, color: '#f97316' }, // Sound
                                { x1: 1000, y1: 1400, x2: 1454, y2: 1440, color: '#f97316' }, // Security
                                { x1: 1000, y1: 1400, x2: 700, y2: 1100, color: '#f97316' }, // Trader
                                { x1: 1000, y1: 1400, x2: 1200, y2: 1100, color: '#f97316' }, // Marketer
                                { x1: 1000, y1: 1400, x2: 650, y2: 1750, color: '#f97316' }, // Nexus
                                { x1: 1000, y1: 1400, x2: 900, y2: 1900, color: '#f97316' }, // Healer


                                // CAPABILITIES -> Sub
                                { x1: 2000, y1: 600, x2: 1800, y2: 300, color: '#8b5cf6' }, // Live Coding
                                { x1: 2000, y1: 600, x2: 2300, y2: 400, color: '#8b5cf6' }, // Media Suite
                                { x1: 2000, y1: 600, x2: 2400, y2: 700, color: '#8b5cf6' }, // Autonomous Gen
                                { x1: 2000, y1: 600, x2: 2200, y2: 850, color: '#8b5cf6' }, // Voice / AV
                                { x1: 2000, y1: 600, x2: 1700, y2: 800, color: '#8b5cf6' }, // Dynamic Cards UI

                                // INFRA -> Sub
                                { x1: 1500, y1: 1500, x2: 1400, y2: 1800, color: '#06b6d4' }, // Firebase
                                { x1: 1500, y1: 1500, x2: 1700, y2: 1750, color: '#06b6d4' }, // Local IndexedDB
                                { x1: 1500, y1: 1500, x2: 1600, y2: 1900, color: '#06b6d4' }, // External APIs
                                { x1: 1500, y1: 1500, x2: 1200, y2: 1800, color: '#06b6d4' }, // Admin Dashboard

                                // MEMORY -> Sub
                                { x1: 2000, y1: 1400, x2: 2200, y2: 1200, color: '#f59e0b' }, // Vector RAG
                                { x1: 2000, y1: 1400, x2: 1800, y2: 1600, color: '#f59e0b' }, // LTM
                                { x1: 2000, y1: 1400, x2: 2300, y2: 1500, color: '#f59e0b' }, // Vault
                                { x1: 2000, y1: 1400, x2: 2100, y2: 1700, color: '#f59e0b' }, // Fact DB
                                { x1: 2000, y1: 1400, x2: 2400, y2: 1700, color: '#f59e0b' }, // Global Directives
                                
                            ].map((line, idx) => (
                                <g key={`archlinefull-${idx}`}>
                                    <path d={`M ${line.x1} ${line.y1} Q ${(line.x1+line.x2)/2} ${(line.y1+line.y2)/2 - 50} ${line.x2} ${line.y2}`} stroke={line.color} strokeWidth="3" fill="none" opacity="0.3" strokeDasharray="5 10" />
                                    <path d={`M ${line.x1} ${line.y1} Q ${(line.x1+line.x2)/2} ${(line.y1+line.y2)/2 - 50} ${line.x2} ${line.y2}`} stroke={line.color} strokeWidth="3" fill="none" filter="url(#glowArchFull)" strokeDasharray="20 40" className="animate-[dash_3s_linear_infinite]" />
                                </g>
                            ))}
                        </svg>

                        {/* =======================================================
                            CORE HUB
                            ======================================================= */}
                        <div className="absolute w-[240px] h-[240px] bg-[#020005]/90 backdrop-blur-2xl border border-cyan-400 rounded-full flex flex-col items-center justify-center shadow-[0_0_100px_rgba(6,182,212,0.8)] z-50 animate-[pulse_5s_ease-in-out_infinite]" style={{ left: 1530, top: 880 }}>
                            <Cpu className="w-20 h-20 text-cyan-300 mb-2 drop-shadow-[0_0_15px_currentColor]" />
                            <span className="font-black text-cyan-100 text-xl uppercase tracking-[0.2em] text-center leading-tight">Shadow<br/>Master Core</span>
                            <span className="text-[10px] text-cyan-400 font-mono mt-2">V3.1 OMNI-AGENT</span>
                        </div>

                        {/* =======================================================
                            INTERACTIVE PERSONAS HUB (Pink)
                            ======================================================= */}
                        <div className="absolute w-[180px] h-[180px] bg-pink-950/60 backdrop-blur-xl border border-pink-500 rounded-full flex flex-col items-center justify-center shadow-[0_0_60px_rgba(236,72,153,0.5)] z-40" style={{ left: 1060, top: 510 }}>
                            <Users className="w-12 h-12 text-pink-400 mb-1 drop-shadow-[0_0_10px_currentColor]" />
                            <span className="font-bold text-pink-100 text-base uppercase tracking-widest text-center leading-tight">Interactive<br/>Personas</span>
                        </div>
                            {/* 1. Leader */}
                            <div className="absolute w-44 bg-transparent backdrop-blur-none border-2 border-pink-500/50 rounded-2xl p-3 shadow-[0_0_20px_rgba(236,72,153,0.4)] text-center backdrop-blur-md z-40 group hover:scale-125 hover:border-pink-400 hover:z-50 transition-all cursor-crosshair" style={{ left: 600, top: 400 }}>
                                <Code className="w-8 h-8 text-pink-400 mx-auto mb-2" />
                                <span className="text-sm text-pink-300 font-black block mb-1">المايسترو (Leader)</span>
                            </div>
                            {/* 2. Detective */}
                            <div className="absolute w-44 bg-transparent backdrop-blur-none border-2 border-pink-500/50 rounded-2xl p-3 shadow-[0_0_20px_rgba(236,72,153,0.4)] text-center backdrop-blur-md z-40 group hover:scale-125 hover:border-pink-400 hover:z-50 transition-all cursor-crosshair" style={{ left: 1100, top: 300 }}>
                                <Search className="w-8 h-8 text-pink-400 mx-auto mb-2" />
                                <span className="text-sm text-pink-300 font-black block mb-1">المحقق (Detective)</span>
                            </div>
                            {/* 3. Accountant */}
                            <div className="absolute w-44 bg-transparent backdrop-blur-none border-2 border-pink-500/50 rounded-2xl p-3 shadow-[0_0_20px_rgba(236,72,153,0.4)] text-center backdrop-blur-md z-40 group hover:scale-125 hover:border-pink-400 hover:z-50 transition-all cursor-crosshair" style={{ left: 700, top: 800 }}>
                                <CreditCard className="w-8 h-8 text-pink-400 mx-auto mb-2" />
                                <span className="text-sm text-pink-300 font-black block mb-1">المحاسب (Accountant)</span>
                            </div>
                            {/* 4. Legal */}
                            <div className="absolute w-44 bg-transparent backdrop-blur-none border-2 border-pink-500/50 rounded-2xl p-3 shadow-[0_0_20px_rgba(236,72,153,0.4)] text-center backdrop-blur-md z-40 group hover:scale-125 hover:border-pink-400 hover:z-50 transition-all cursor-crosshair" style={{ left: 1300, top: 700 }}>
                                <Briefcase className="w-8 h-8 text-pink-400 mx-auto mb-2" />
                                <span className="text-sm text-pink-300 font-black block mb-1">المحامي (Legal)</span>
                            </div>
                            {/* 5. Marketer */}
                            <div className="absolute w-44 bg-transparent backdrop-blur-none border-2 border-pink-500/50 rounded-2xl p-3 shadow-[0_0_20px_rgba(236,72,153,0.4)] text-center backdrop-blur-md z-40 group hover:scale-125 hover:border-pink-400 hover:z-50 transition-all cursor-crosshair" style={{ left: 1200, top: 850 }}>
                                <Megaphone className="w-8 h-8 text-pink-400 mx-auto mb-2" />
                                <span className="text-sm text-pink-300 font-black block mb-1">المسوق (Marketer)</span>
                            </div>
                            {/* 6. Designer */}
                            <div className="absolute w-44 bg-transparent backdrop-blur-none border-2 border-pink-500/50 rounded-2xl p-3 shadow-[0_0_20px_rgba(236,72,153,0.4)] text-center backdrop-blur-md z-40 group hover:scale-125 hover:border-pink-400 hover:z-50 transition-all cursor-crosshair" style={{ left: 800, top: 300 }}>
                                <PenTool className="w-8 h-8 text-pink-400 mx-auto mb-2" />
                                <span className="text-sm text-pink-300 font-black block mb-1">المصمم (Designer)</span>
                            </div>
                            {/* 7. Editor */}
                            <div className="absolute w-44 bg-transparent backdrop-blur-none border-2 border-pink-500/50 rounded-2xl p-3 shadow-[0_0_20px_rgba(236,72,153,0.4)] text-center backdrop-blur-md z-40 group hover:scale-125 hover:border-pink-400 hover:z-50 transition-all cursor-crosshair" style={{ left: 1400, top: 400 }}>
                                <Video className="w-8 h-8 text-pink-400 mx-auto mb-2" />
                                <span className="text-sm text-pink-300 font-black block mb-1">المونتير (Editor)</span>
                            </div>
                            {/* 8. Shopper */}
                            <div className="absolute w-44 bg-transparent backdrop-blur-none border-2 border-pink-500/50 rounded-2xl p-3 shadow-[0_0_20px_rgba(236,72,153,0.4)] text-center backdrop-blur-md z-40 group hover:scale-125 hover:border-pink-400 hover:z-50 transition-all cursor-crosshair" style={{ left: 1400, top: 550 }}>
                                <ShoppingCart className="w-8 h-8 text-pink-400 mx-auto mb-2" />
                                <span className="text-sm text-pink-300 font-black block mb-1">المتسوق (Shopper)</span>
                            </div>
{/* =======================================================
                            AUTONOMOUS PERSONAS HUB (Orange)
                            ======================================================= */}
                        <div className="absolute w-[180px] h-[180px] bg-orange-950/60 backdrop-blur-xl border border-orange-500 rounded-full flex flex-col items-center justify-center shadow-[0_0_60px_rgba(249,115,22,0.5)] z-40" style={{ left: 1060, top: 1310 }}>
                            <Bot className="w-12 h-12 text-orange-400 mb-1 drop-shadow-[0_0_10px_currentColor]" />
                            <span className="font-bold text-orange-100 text-base uppercase tracking-widest text-center leading-tight">Autonomous<br/>Agents</span>
                        </div>
                            {/* 9. Executor */}
                            <div className="absolute w-44 bg-transparent backdrop-blur-none border-2 border-orange-500/50 rounded-2xl p-3 shadow-[0_0_20px_rgba(249,115,22,0.4)] text-center backdrop-blur-md z-40 group hover:scale-125 hover:border-orange-400 hover:z-50 transition-all cursor-crosshair" style={{ left: 600, top: 1200 }}>
                                <Terminal className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                                <span className="text-sm text-orange-300 font-black block mb-1">المنفذ (Executor)</span>
                            </div>
                            {/* 10. Healer / Life Coach */}
                            <div className="absolute w-44 bg-transparent backdrop-blur-none border-2 border-orange-500/50 rounded-2xl p-3 shadow-[0_0_20px_rgba(249,115,22,0.4)] text-center backdrop-blur-md z-40 group hover:scale-125 hover:border-orange-400 hover:z-50 transition-all cursor-crosshair" style={{ left: 500, top: 1500 }}>
                                <HeartHandshake className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                                <span className="text-sm text-orange-300 font-black block mb-1">اللايف كوتش (Life Coach)</span>
                            </div>
                            {/* 11. Analyst */}
                            <div className="absolute w-44 bg-transparent backdrop-blur-none border-2 border-orange-500/50 rounded-2xl p-3 shadow-[0_0_20px_rgba(249,115,22,0.4)] text-center backdrop-blur-md z-40 group hover:scale-125 hover:border-orange-400 hover:z-50 transition-all cursor-crosshair" style={{ left: 800, top: 1700 }}>
                                <Activity className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                                <span className="text-sm text-orange-300 font-black block mb-1">المحلل (Analyst)</span>
                            </div>
                            {/* 12. Nexus */}
                            <div className="absolute w-44 bg-transparent backdrop-blur-none border-2 border-orange-500/50 rounded-2xl p-3 shadow-[0_0_20px_rgba(249,115,22,0.4)] text-center backdrop-blur-md z-40 group hover:scale-125 hover:border-orange-400 hover:z-50 transition-all cursor-crosshair" style={{ left: 1200, top: 1700 }}>
                                <Cpu className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                                <span className="text-sm text-orange-300 font-black block mb-1">نكسوس (Nexus)</span>
                            </div>
                            {/* 13. Archivist */}
                            <div className="absolute w-44 bg-transparent backdrop-blur-none border-2 border-orange-500/50 rounded-2xl p-3 shadow-[0_0_20px_rgba(249,115,22,0.4)] text-center backdrop-blur-md z-40 group hover:scale-125 hover:border-orange-400 hover:z-50 transition-all cursor-crosshair" style={{ left: 1354, top: 1240 }}>
                                <Database className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                                <span className="text-sm text-orange-300 font-black block mb-1">الأرشيف (Archivist)</span>
                            </div>
                            {/* 14. Swarm Manager */}
                            <div className="absolute w-44 bg-transparent backdrop-blur-none border-2 border-orange-500/50 rounded-2xl p-3 shadow-[0_0_20px_rgba(249,115,22,0.4)] text-center backdrop-blur-md z-40 group hover:scale-125 hover:border-orange-400 hover:z-50 transition-all cursor-crosshair" style={{ left: 700, top: 1450 }}>
                                <CloudCog className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                                <span className="text-sm text-orange-300 font-black block mb-1">سرب الظل (Swarm)</span>
                            </div>
                            {/* 15. Live Session */}
                            <div className="absolute w-44 bg-transparent backdrop-blur-none border-2 border-orange-500/50 rounded-2xl p-3 shadow-[0_0_20px_rgba(249,115,22,0.4)] text-center backdrop-blur-md z-40 group hover:scale-125 hover:border-orange-400 hover:z-50 transition-all cursor-crosshair" style={{ left: 1400, top: 1550 }}>
                                <Radio className="w-8 h-8 text-orange-400 mx-auto mb-2 z-10 relative" />
                                <span className="text-sm text-orange-300 font-black block mb-1 relative z-10">اللايف سيشن (Live Session)</span>
                            </div>
{/* =======================================================
                            CAPABILITIES HUB (Purple)
                            ======================================================= */}
                        <div className="absolute w-[180px] h-[180px] bg-purple-950/60 backdrop-blur-xl border border-purple-500 rounded-full flex flex-col items-center justify-center shadow-[0_0_60px_rgba(139,92,246,0.5)] z-40" style={{ left: 2060, top: 510 }}>
                            <Zap className="w-12 h-12 text-purple-400 mb-1 drop-shadow-[0_0_10px_currentColor]" />
                            <span className="font-bold text-purple-100 text-base uppercase tracking-widest text-center leading-tight">Capabilities<br/>& Tools</span>
                        </div>
                            {/* Live Coding */}
                            <div className="absolute w-48 bg-transparent backdrop-blur-none border-2 border-purple-500/50 rounded-2xl p-4 shadow-[0_0_20px_rgba(139,92,246,0.4)] text-center backdrop-blur-md z-40 group hover:scale-125 hover:border-purple-400 hover:z-50 transition-all cursor-crosshair" style={{ left: 1854, top: 240 }}>
                                <Code className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                                <span className="text-sm text-purple-300 font-black block mb-1">البرمجة الحية (Live Sandboxing)</span>
                                <span className="text-[10px] text-white/80 leading-relaxed block">دعم Vite/React، تعديل فوري (HMR / Sync)، والتشغيل داخل المتصفح بأكواد آمنة وبيئة تجريبية معزولة.</span>
                            </div>
                            {/* Media Suite */}
                            <div className="absolute w-48 bg-transparent backdrop-blur-none border-2 border-purple-500/50 rounded-2xl p-4 shadow-[0_0_20px_rgba(139,92,246,0.4)] text-center backdrop-blur-md z-40 group hover:scale-125 hover:border-purple-400 hover:z-50 transition-all cursor-crosshair" style={{ left: 2354, top: 340 }}>
                                <Film className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                                <span className="text-sm text-purple-300 font-black block mb-1">منصة الميديا (Media Suite)</span>
                                <span className="text-[10px] text-white/80 leading-relaxed block">دعم Stable Diffusion، جلب فيديوهات (Pixabay API)، وإرفاق مستندات بصيغ PDF, CSV, Images.</span>
                            </div>
                            {/* Autonomous Gen */}
                            <div className="absolute w-48 bg-transparent backdrop-blur-none border-2 border-purple-500/50 rounded-2xl p-4 shadow-[0_0_20px_rgba(139,92,246,0.4)] text-center backdrop-blur-md z-40 group hover:scale-125 hover:border-purple-400 hover:z-50 transition-all cursor-crosshair" style={{ left: 2454, top: 620 }}>
                                <LayoutGrid className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                                <span className="text-sm text-purple-300 font-black block mb-1">التخيل المستقل (Autonomous Gen)</span>
                                <span className="text-[10px] text-white/80 leading-relaxed block">مهام الخلفية: توليد خطط، إعادة هيكلة البيانات تلقائياً دون أمر صريح وتحديث الواجهات.</span>
                            </div>
                            {/* Voice / AV */}
                            <div className="absolute w-48 bg-transparent backdrop-blur-none border-2 border-purple-500/50 rounded-2xl p-4 shadow-[0_0_20px_rgba(139,92,246,0.4)] text-center backdrop-blur-md z-40 group hover:scale-125 hover:border-purple-400 hover:z-50 transition-all cursor-crosshair" style={{ left: 2254, top: 790 }}>
                                <Mic className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                                <span className="text-sm text-purple-300 font-black block mb-1">المعالجة الصوتية (Shadow Voice)</span>
                                <span className="text-[10px] text-white/80 leading-relaxed block">دمج LameJS لتحويل الردود إلى ملفات MP3 متزامنة (TTS) وتخزينها سحابيا بـ FreeHost CDN.</span>
                            </div>
                            {/* Dynamic Cards */}
                            <div className="absolute w-48 bg-transparent backdrop-blur-none border-2 border-purple-500/50 rounded-2xl p-4 shadow-[0_0_20px_rgba(139,92,246,0.4)] text-center backdrop-blur-md z-40 group hover:scale-125 hover:border-purple-400 hover:z-50 transition-all cursor-crosshair" style={{ left: 1754, top: 740 }}>
                                <FileText className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                                <span className="text-sm text-purple-300 font-black block mb-1">الكروت التفاعلية (Chat Cards UI)</span>
                                <span className="text-[10px] text-white/80 leading-relaxed block">محرك تصيير داخلي للـ markdown والخرائط والنماذج والأدوات داخل فقاعات المحادثة.</span>
                            </div>


                        {/* =======================================================
                            INFRASTRUCTURE HUB (Cyan)
                            ======================================================= */}
                        <div className="absolute w-[180px] h-[180px] bg-cyan-950/60 backdrop-blur-xl border border-cyan-500 rounded-full flex flex-col items-center justify-center shadow-[0_0_60px_rgba(6,182,212,0.5)] z-40" style={{ left: 1560, top: 1410 }}>
                            <Database className="w-12 h-12 text-cyan-400 mb-1 drop-shadow-[0_0_10px_currentColor]" />
                            <span className="font-bold text-cyan-100 text-base uppercase tracking-widest text-center leading-tight">Infra &<br/>System Base</span>
                        </div>
                            {/* Firebase */}
                            <div className="absolute w-48 bg-transparent backdrop-blur-none border-2 border-cyan-500/50 rounded-2xl p-4 shadow-[0_0_20px_rgba(6,182,212,0.4)] text-center backdrop-blur-md z-40 group hover:scale-125 hover:border-cyan-400 hover:z-50 transition-all cursor-crosshair" style={{ left: 1454, top: 1740 }}>
                                <Globe className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                                <span className="text-sm text-cyan-300 font-black block mb-1">سحابة البيانات (Cloud Firebase)</span>
                                <span className="text-[10px] text-white/80 leading-relaxed block">تخزين آمن للمستخدمين، الميزانيات، الكوبونات الفعالة، وسجل الشات المشفر.</span>
                            </div>
                            {/* Local IndexedDB */}
                            <div className="absolute w-48 bg-transparent backdrop-blur-none border-2 border-cyan-500/50 rounded-2xl p-4 shadow-[0_0_20px_rgba(6,182,212,0.4)] text-center backdrop-blur-md z-40 group hover:scale-125 hover:border-cyan-400 hover:z-50 transition-all cursor-crosshair" style={{ left: 1754, top: 1690 }}>
                                <HardDrive className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                                <span className="text-sm text-cyan-300 font-black block mb-1">قاعدة التخزين المنسوقة (IndexedDB)</span>
                                <span className="text-[10px] text-white/80 leading-relaxed block">Dexie.js للبحث الفوري، تخزين الجلسات (Sessions)، ومعالجات الدفع المسبوعة من API.</span>
                            </div>
                            {/* External APIs */}
                            <div className="absolute w-48 bg-transparent backdrop-blur-none border-2 border-cyan-500/50 rounded-2xl p-4 shadow-[0_0_20px_rgba(6,182,212,0.4)] text-center backdrop-blur-md z-40 group hover:scale-125 hover:border-cyan-400 hover:z-50 transition-all cursor-crosshair" style={{ left: 1654, top: 1840 }}>
                                <Cpu className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                                <span className="text-sm text-cyan-300 font-black block mb-1">الوصلات الخارجية (External APIs)</span>
                                <span className="text-[10px] text-white/80 leading-relaxed block">Gemini 3.1 Pro، Stripe/Paypal للتعامل المالي، إرسال البريد (Resend/SendGrid).</span>
                            </div>
                            {/* Admin */}
                            <div className="absolute w-48 bg-transparent backdrop-blur-none border-2 border-cyan-500/50 rounded-2xl p-4 shadow-[0_0_20px_rgba(6,182,212,0.4)] text-center backdrop-blur-md z-40 group hover:scale-125 hover:border-cyan-400 hover:z-50 transition-all cursor-crosshair" style={{ left: 1254, top: 1740 }}>
                                <ShieldCheck className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                                <span className="text-sm text-cyan-300 font-black block mb-1">لوحة الأدمن المركزية (Admin DB)</span>
                                <span className="text-[10px] text-white/80 leading-relaxed block">نظام شامل للإحصائيات الحية، إدارة الموارد، قبول السحب، ورسائل الـ System Broadcast.</span>
                            </div>


                        {/* =======================================================
                            MEMORY HUB (Amber)
                            ======================================================= */}
                        <div className="absolute w-[180px] h-[180px] bg-amber-950/60 backdrop-blur-xl border border-amber-500 rounded-full flex flex-col items-center justify-center shadow-[0_0_60px_rgba(245,158,11,0.5)] z-40" style={{ left: 2060, top: 1310 }}>
                            <Brain className="w-12 h-12 text-amber-400 mb-1 drop-shadow-[0_0_10px_currentColor]" />
                            <span className="font-bold text-amber-100 text-base uppercase tracking-widest text-center leading-tight">Memory<br/>& Lore</span>
                        </div>
                            {/* LTM */}
                            <div className="absolute w-48 bg-transparent backdrop-blur-none border-2 border-amber-500/50 rounded-2xl p-4 shadow-[0_0_20px_rgba(245,158,11,0.4)] text-center backdrop-blur-md z-40 group hover:scale-125 hover:border-amber-400 hover:z-50 transition-all cursor-crosshair" style={{ left: 1854, top: 1540 }}>
                                <Database className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                                <span className="text-sm text-amber-300 font-black block mb-1">الذاكرة طويلة المدى (LTM)</span>
                                <span className="text-[10px] text-white/80 leading-relaxed block">استنتاجات تلقائية (تفضيلات المستخدم، النغمة، لغة البرمجة المفضلة) لحفظ سياق دائم.</span>
                            </div>
                            {/* Vector RAG */}
                            <div className="absolute w-48 bg-transparent backdrop-blur-none border-2 border-amber-500/50 rounded-2xl p-4 shadow-[0_0_20px_rgba(245,158,11,0.4)] text-center backdrop-blur-md z-40 group hover:scale-125 hover:border-amber-400 hover:z-50 transition-all cursor-crosshair" style={{ left: 2254, top: 1140 }}>
                                <Search className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                                <span className="text-sm text-amber-300 font-black block mb-1">البحث المعرفي والأساس (Vector RAG)</span>
                                <span className="text-[10px] text-white/80 leading-relaxed block">آلية استرجاع البيانات الدلالية لمعرفة تاريخ المشاريع والإجابة بناءً على وثائق محددة سابقا.</span>
                            </div>
                            {/* Vault */}
                            <div className="absolute w-48 bg-transparent backdrop-blur-none border-2 border-amber-500/50 rounded-2xl p-4 shadow-[0_0_20px_rgba(245,158,11,0.4)] text-center backdrop-blur-md z-40 group hover:scale-125 hover:border-amber-400 hover:z-50 transition-all cursor-crosshair" style={{ left: 2354, top: 1440 }}>
                                <FolderOpen className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                                <span className="text-sm text-amber-300 font-black block mb-1">خزينة الملفات (Vault DB)</span>
                                <span className="text-[10px] text-white/80 leading-relaxed block">حفظ الصور، نواتج الكود المخصصة، مستندات الـ PDF للرجوع إليها كـ Attachments سرية.</span>
                            </div>
                            {/* Fact DB */}
                            <div className="absolute w-48 bg-transparent backdrop-blur-none border-2 border-amber-500/50 rounded-2xl p-4 shadow-[0_0_20px_rgba(245,158,11,0.4)] text-center backdrop-blur-md z-40 group hover:scale-125 hover:border-amber-400 hover:z-50 transition-all cursor-crosshair" style={{ left: 2154, top: 1640 }}>
                                <CheckCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                                <span className="text-sm text-amber-300 font-black block mb-1">موسوعة الحقائق (Fact Base)</span>
                                <span className="text-[10px] text-white/80 leading-relaxed block">أرشفة الأوامر الثابتة والعادات للمستخدم بدقة تصل لـ 100% كي لا يضطر لتكرار نفسه أبداً.</span>
                            </div>
                            {/* Global Directives */}
                            <div className="absolute w-48 bg-transparent backdrop-blur-none border-2 border-amber-500/50 rounded-2xl p-4 shadow-[0_0_20px_rgba(245,158,11,0.4)] text-center backdrop-blur-md z-40 group hover:scale-125 hover:border-amber-400 hover:z-50 transition-all cursor-crosshair" style={{ left: 2454, top: 1640 }}>
                                <MessageCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                                <span className="text-sm text-amber-300 font-black block mb-1">الإرشادات الجوهرية (Directives)</span>
                                <span className="text-[10px] text-white/80 leading-relaxed block">مجموعة تعليمات النظام الأساسية، شخصية الظل العميقة وأسلوبه في الإجابة (Tone Control).</span>
                            </div>

                        {/* =======================================================
                            WOW ELEMENTS & PARTICLES
                            ======================================================= */}
                        <div className="absolute inset-0 pointer-events-none">
                            {/* Moving scanner line */}
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-cyan-500/50 shadow-[0_0_20px_#06b6d4] animate-[scan_6s_ease-in-out_infinite_alternate]" />
                            
                            {/* Floating Orbs */}
                            <div className="absolute top-[30%] left-[20%] w-32 h-32 bg-pink-500/10 rounded-full blur-3xl animate-[pulse_4s_infinite]" />
                            <div className="absolute top-[70%] left-[80%] w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl animate-[pulse_6s_infinite]" />
                            <div className="absolute top-[40%] left-[60%] w-40 h-40 bg-purple-500/10 rounded-full blur-3xl animate-[pulse_5s_infinite]" />
                            
                            {/* Data Nodes */}
                            <div className="absolute top-[20%] left-[40%] w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_10px_#06b6d4] animate-ping" />
                            <div className="absolute top-[80%] left-[30%] w-3 h-3 bg-pink-400 rounded-full shadow-[0_0_10px_#ec4899] animate-ping" style={{ animationDuration: '3s' }} />
                            <div className="absolute top-[60%] left-[75%] w-2 h-2 bg-purple-400 rounded-full shadow-[0_0_10px_#8b5cf6] animate-ping" style={{ animationDuration: '2s' }} />
                            <div className="absolute top-[15%] left-[85%] w-1 h-1 bg-orange-400 rounded-full shadow-[0_0_5px_#f97316] animate-ping" style={{ animationDuration: '4s' }} />
                        </div>
                    </div>
                    </TransformComponent>
                    </>
                  )}
                </TransformWrapper>
            </div>
            
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes dash { to { stroke-dashoffset: -60; } }
                @keyframes scan {
                    0% { transform: translateY(0); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { transform: translateY(2000px); opacity: 0; }
                }
            `}} />
            
            {/* Guide overlay */}
            <div className="absolute bottom-4 left-4 bg-transparent backdrop-blur-none backdrop-blur border border-white/10 p-3 rounded-xl z-50 text-[10px] text-white/60 font-mono shadow-2xl pointer-events-none">
                <div className="flex items-center gap-2 mb-1"><Globe className="w-3 h-3 text-cyan-400" /> Pan = Drag to move around map</div>
                <div className="flex items-center gap-2 mb-1"><Search className="w-3 h-3 text-pink-400" /> Zoom = Scroll / Pinch</div>
                <div className="flex items-center gap-2"><Bot className="w-3 h-3 text-orange-400" /> Hover = Expand Agent Info</div>
            </div>
        </div>
    );
};
