import React from 'react';
import { Bot, Terminal, Activity, Clock, PlayCircle } from 'lucide-react';

export const AutonomousDashboard = ({ card }: { card: any }) => {
    return (
        <div className="mt-4 rounded-[22px] p-4 w-full md:w-[400px] bg-[#000000]/95 border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.15)] relative overflow-hidden font-mono">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>
            
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-500/20 rounded-xl text-red-500 relative">
                        <Bot className="w-5 h-5" />
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                    </div>
                    <div>
                        <h3 className="font-bold text-[14px] text-white tracking-widest">AGENT NODE</h3>
                        <p className="text-[10px] text-red-400">STATUS: ACTIVE - LISTENING</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] text-white/50">TASK ID</div>
                    <div className="text-xs text-white bg-white/5 px-2 py-1 rounded truncate max-w-[80px]">
                        {card.taskId || 'SYS-99'}
                    </div>
                </div>
            </div>

            <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg text-xs">
                    <span className="text-white/50 flex items-center gap-2"><Clock className="w-3 h-3"/> Uptime</span>
                    <span className="text-white">24/7 Always-On</span>
                </div>
                <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg text-xs">
                    <span className="text-white/50 flex items-center gap-2"><Activity className="w-3 h-3"/> Memory State</span>
                    <span className="text-emerald-400">SYNCED</span>
                </div>
            </div>

            <div className="bg-black border border-white/10 rounded-xl p-3 h-[120px] overflow-y-auto custom-scrollbar">
                <div className="flex items-center gap-2 mb-2 text-[10px] text-red-500/70 border-b border-white/5 pb-2">
                    <Terminal className="w-3 h-3" /> LIVE TERMINAL LOGS
                </div>
                <div className="space-y-2 text-[10px] text-white/70">
                    <p className="flex gap-2"><span className="text-emerald-500">[+0ms]</span> <span>Agent initialized successfully</span></p>
                    <p className="flex gap-2"><span className="text-emerald-500">[+45ms]</span> <span>Connected to Shadow Network</span></p>
                    <p className="flex gap-2"><span className="text-emerald-500">[+120ms]</span> <span>Monitoring parameters set: {card.taskId ? 'Active Ruleset' : 'Default Watch'}</span></p>
                    <p className="flex gap-2 text-yellow-400 animate-pulse"><span className="text-yellow-500">[+]</span> <span>Awaiting target condition...</span></p>
                </div>
            </div>
            
            <button className="mt-4 w-full py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2">
                <PlayCircle className="w-4 h-4" /> View Full Control Panel
            </button>
        </div>
    );
};
