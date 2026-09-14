
import React, { useMemo, useState, useEffect } from 'react';
import { Moon, Zap, GraduationCap, HeartPulse, Wallet, Sparkles } from 'lucide-react';

interface AspectProps {
    id: string;
    title: string;
    icon: React.ReactNode;
    color: string;
    style: React.CSSProperties;
    onClick: (id: string) => void;
}

const Aspect: React.FC<AspectProps> = ({ id, title, icon, color, style, onClick }) => (
    <div 
        onClick={() => onClick(id)}
        style={style}
        className="absolute transition-all duration-1000 hover:scale-110 cursor-pointer z-50 group pointer-events-auto flex flex-col items-center"
    >
        <div className="flex flex-col items-center gap-2 relative">
            <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-1000`}></div>
            
            <div className={`w-16 h-16 md:w-20 md:h-20 rounded-[24px] glass border border-white/10 flex items-center justify-center shadow-2xl group-hover:border-purple-500/30 group-hover:bg-purple-500/5 transition-all bg-black/80 overflow-hidden`}>
                <div className="z-10 transform group-hover:scale-110 transition-transform duration-700">
                    {icon}
                </div>
            </div>

            {/* Label - Improved Aesthetics */}
            <div className="text-center mt-1">
                <span className="text-[10px] md:text-[11px] font-black text-white/40 uppercase tracking-[0.1em] group-hover:text-purple-400 transition-colors duration-500">{title}</span>
            </div>
            
            <div className="w-1 h-1 rounded-full bg-white/10 group-hover:bg-purple-500 transition-all"></div>
        </div>
    </div>
);

const FloatingPillars: React.FC<{ onPillarSelect: (id: string) => void }> = ({ onPillarSelect }) => {
    const [radius, setRadius] = useState(220);

    useEffect(() => {
        const updateRadius = () => {
            const width = window.innerWidth;
            if (width < 768) setRadius(width * 0.38);
            else setRadius(280);
        };
        updateRadius();
        window.addEventListener('resize', updateRadius);
        return () => window.removeEventListener('resize', updateRadius);
    }, []);

    const aspects = [
        { id: 'spiritual', title: 'الروحاني', icon: <Moon className="w-6 h-6 md:w-8 md:h-8 text-emerald-400" />, color: 'from-emerald-500 to-transparent', angle: 0 },
        { id: 'productivity', title: 'العملي', icon: <Zap className="w-6 h-6 md:w-8 md:h-8 text-amber-400" />, color: 'from-amber-500 to-transparent', angle: 72 },
        { id: 'growth', title: 'المعرفي', icon: <GraduationCap className="w-6 h-6 md:w-8 md:h-8 text-blue-400" />, color: 'from-blue-500 to-transparent', angle: 144 },
        { id: 'health', title: 'الصحي', icon: <HeartPulse className="w-6 h-6 md:w-8 md:h-8 text-red-400" />, color: 'from-red-500 to-transparent', angle: 216 },
        { id: 'finance', title: 'المالي', icon: <Wallet className="w-6 h-6 md:w-8 md:h-8 text-purple-400" />, color: 'from-purple-500 to-transparent', angle: 288 },
    ];

    return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible">
            <div className="relative w-full h-full">
                {aspects.map((a) => {
                    const radian = (a.angle - 90) * (Math.PI / 180);
                    const x = Math.cos(radian) * radius;
                    const y = Math.sin(radian) * radius;
                    return (
                        <Aspect 
                            key={a.id} 
                            {...a} 
                            style={{ 
                                left: '50%',
                                top: '50%',
                                transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                            }}
                            onClick={onPillarSelect} 
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default FloatingPillars;
