import React, { useState, useEffect } from 'react';
import { DollarSign, Youtube, TrendingUp, Users, Presentation, LineChart } from 'lucide-react';

export const RevenueMatrixCard = ({ card }: { card: any }) => {
    const [stats, setStats] = useState({
        revenue: 0,
        subs: 0,
        views: 0
    });
    const [isLiveApi, setIsLiveApi] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const fetchRealStats = async () => {
            try {
                // Simulating call to server-side YouTube API proxy
                // The actual backend would use process.env.YOUTUBE_API_KEY
                const res = await fetch('/api/services/youtube-stats');
                if (res.ok) {
                    const data = await res.json();
                    if (isMounted && data.realData) {
                       setStats(data.stats);
                       setIsLiveApi(true);
                       return true;
                    }
                }
                return false;
            } catch (e) {
                return false;
            }
        };

        const execute = async () => {
            const hasRealData = await fetchRealStats();
            
            if (!hasRealData && isMounted) {
                // Fallback / Starting values if no API keys are hooked up
                let r = 1420.50; let s = 25400; let v = 104500;
                setStats({ revenue: r, subs: s, views: v });
                
                const interval = setInterval(() => {
                    if (!isMounted) return;
                    setStats(prev => ({
                        revenue: prev.revenue + (Math.random() * 0.5),
                        subs: prev.subs + Math.floor(Math.random() * 3),
                        views: prev.views + Math.floor(Math.random() * 15)
                    }));
                }, 2000);
                return interval;
            } else if (hasRealData && isMounted) {
                 // Polling real data every 1 minute
                 const interval = setInterval(fetchRealStats, 60000);
                 return interval;
            }
        };
        
        let intRef: any;
        execute().then(ref => { intRef = ref; });

        return () => {
            isMounted = false;
            if (intRef) clearInterval(intRef);
        };
    }, []);

    return (
        <div className="mt-4 rounded-[22px] p-6 w-full md:w-[450px] bg-black border border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.15)] relative overflow-hidden group font-mono">
            {/* Holographic background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
            <div className="absolute top-0 right-0 w-full h-[100px] bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none" />
            
            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/20 rounded-lg border border-emerald-500/40">
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-xs tracking-widest uppercase">Revenue Matrix Live</h3>
                        <p className={`text-[10px] mt-1 flex items-center gap-1 ${isLiveApi ? 'text-emerald-400' : 'text-yellow-500'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isLiveApi ? 'bg-emerald-400' : 'bg-yellow-500'}`} /> 
                            {isLiveApi ? 'Live API Sync Active' : 'Placeholder Mode (Connect API in settings)'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 relative z-10 mb-4">
                <div className="bg-[#0a0a0a] border border-[#222] p-4 rounded-xl flex flex-col items-center justify-center relative overflow-hidden">
                    <DollarSign className="w-20 h-20 text-emerald-500/10 absolute -right-4 -bottom-4" />
                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-2 z-10">Live Revenue</span>
                    <span className="text-3xl font-black text-emerald-400 z-10 tracking-tighter">${stats.revenue.toFixed(2)}</span>
                </div>
                <div className="flex flex-col gap-4">
                    <div className="bg-[#0a0a0a] border border-[#222] p-3 rounded-xl flex items-center justify-between">
                        <div>
                            <span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest block mb-1">Subscribers</span>
                            <span className="text-lg font-black text-white">{stats.subs.toLocaleString()}</span>
                        </div>
                        <Users className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="bg-[#0a0a0a] border border-[#222] p-3 rounded-xl flex items-center justify-between">
                        <div>
                            <span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest block mb-1">Total Views</span>
                            <span className="text-lg font-black text-white">{stats.views.toLocaleString()}</span>
                        </div>
                        <Youtube className="w-5 h-5 text-red-500" />
                    </div>
                </div>
            </div>
            
            <div className="relative z-10 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-colors cursor-pointer">
                <span>View Full YouTube Studio Hologram</span>
                <LineChart className="w-4 h-4" />
            </div>
        </div>
    );
};
