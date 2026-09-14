
import React, { useEffect, useState } from 'react';
import { shadowDB, UserProfile } from '../services/dbService';
import { DollarSign, UserPlus, ShieldCheck, Briefcase, Activity } from 'lucide-react';

const maskName = (name: string) => {
    if (!name) return 'مستخدم';
    const parts = name.trim().split(' ');
    if (parts.length > 1) {
        return `${parts[0]} ${parts[1][0]}...`; 
    }
    return name.substring(0, 3) + '...';
};

const LiveTickers: React.FC = () => {
    const [items, setItems] = useState<any[]>([]);
    const [pulses, setPulses] = useState<any[]>([]);

    useEffect(() => {
        const loadStats = async () => {
            const profiles = await shadowDB.getAllProfiles();
            const combinedItems: any[] = [];

            // 1. Extract Payouts
            profiles.forEach(p => {
                if (p.affiliate?.payoutHistory) {
                    p.affiliate.payoutHistory.forEach(h => {
                        combinedItems.push({
                            type: 'payout',
                            name: p.name,
                            amount: h.amount,
                            timestamp: h.date,
                            time: new Date(h.date).toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})
                        });
                    });
                }
            });

            // 2. Extract New Members
            profiles.forEach(p => {
                if (p.status === 'active' && p.email !== 'admin@shadow.com' && p.phone !== 'GUEST') {
                    let planName = 'عضوية تجريبية';
                    let type = 'guest';

                    if (p.tier === 'sovereign') {
                        planName = 'انضم للنخبة';
                        type = 'member';
                    } else if (p.affiliate?.isMarketer) {
                        planName = 'شريك مسوق';
                        type = 'marketer';
                    }

                    combinedItems.push({
                        type: 'join',
                        subtype: type,
                        name: p.name,
                        plan: planName,
                        timestamp: p.joinedAt,
                        time: new Date(p.joinedAt).toLocaleDateString('ar-EG')
                    });
                }
            });

            // Sort by timestamp descending (newest first) and take top 20 mixed
            const sorted = combinedItems.sort((a, b) => b.timestamp - a.timestamp).slice(0, 20);
            setItems(sorted);
        };

        loadStats();
        const interval = setInterval(loadStats, 30000); 

        // Listen to pulses
        const checkPulse = async () => {
            const pulse = await shadowDB.getGlobalPulse();
            if (pulse && pulse.timestamp > Date.now() - 86400000) { // Only last 24h
                setPulses(prev => {
                    if (!prev.find(p => p.timestamp === pulse.timestamp)) {
                        return [{
                            type: 'pulse',
                            text: pulse.text,
                            timestamp: pulse.timestamp,
                            time: new Date(pulse.timestamp).toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})
                        }, ...prev].slice(0, 5);
                    }
                    return prev;
                });
            }
        };
        checkPulse();
        const pulseInterval = setInterval(checkPulse, 10000);

        return () => {
            clearInterval(interval);
            clearInterval(pulseInterval);
        };
    }, []);

    const displayItems = [...pulses, ...items].sort((a, b) => b.timestamp - a.timestamp).slice(0, 20);

    if (displayItems.length === 0) return null;

    return (
        <>
            <style>{`
                @keyframes marquee {
                    0% { transform: translateX(100%); }
                    100% { transform: translateX(-100%); }
                }
                .animate-marquee-custom {
                    animation: marquee 40s linear infinite;
                }
                .pause-on-hover:hover {
                    animation-play-state: paused;
                }
            `}</style>
            
            <div className="pointer-events-none z-[160] fixed inset-x-0 bottom-0 h-[32px] w-full overflow-hidden bg-black/95 border-t border-white/10 backdrop-blur-md flex items-center shadow-[0_-5px_20px_rgba(0,0,0,0.8)]">
                
                {/* Static Label */}
                <div className="absolute right-0 top-0 bottom-0 px-4 bg-black z-20 flex items-center gap-2 border-l border-white/10">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Live Activity</span>
                </div>

                {/* Fade Gradients */}
                <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-black to-transparent z-10"></div>
                <div className="absolute right-24 top-0 bottom-0 w-16 bg-gradient-to-l from-black to-transparent z-10"></div>

                {/* Rotating Content */}
                <div className="flex animate-marquee-custom pause-on-hover whitespace-nowrap gap-8 items-center pr-32 pointer-events-auto">
                    {displayItems.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-[10px] font-bold text-white/90">
                            {/* Icon Based on Type */}
                            {item.type === 'pulse' ? (
                                <Activity className="w-3 h-3 text-cyan-400" />
                            ) : item.type === 'payout' ? (
                                <DollarSign className="w-3 h-3 text-emerald-400" />
                            ) : item.subtype === 'member' ? (
                                <ShieldCheck className="w-3 h-3 text-purple-400" />
                            ) : item.subtype === 'marketer' ? (
                                <Briefcase className="w-3 h-3 text-amber-400" />
                            ) : (
                                <UserPlus className="w-3 h-3 text-white/30" />
                            )}

                            {/* Text Content */}
                            {item.type === 'pulse' ? (
                                <span className="text-cyan-400">{item.text}</span>
                            ) : item.type === 'payout' ? (
                                <>
                                    <span className="text-emerald-400 font-mono">{item.amount} ج.م</span>
                                    <span className="text-white/40">تم تحويلها لـ</span>
                                    <span className="text-white">{maskName(item.name)}</span>
                                </>
                            ) : (
                                <>
                                    <span className="text-white">{maskName(item.name)}</span>
                                    <span className={`px-2 py-0.5 rounded text-[9px] ${
                                        item.subtype === 'member' ? 'bg-purple-900/30 text-purple-300 border border-purple-500/20' : 
                                        (item.subtype === 'marketer' ? 'bg-amber-900/30 text-amber-300 border border-amber-500/20' : 'bg-white/10 text-white/50')
                                    }`}>
                                        {item.plan}
                                    </span>
                                </>
                            )}
                            
                            <span className="text-[9px] text-white/20 font-mono">({item.time})</span>
                            <span className="mx-2 text-white/10">•</span>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

export default React.memo(LiveTickers);
