const fs = require('fs');
const _path = 'components/Dashboard.tsx';
let content = fs.readFileSync(_path, 'utf8');

const newComponents = `
// --- ORBITAL UI COMPONENTS ---
const OrbitalStyles = () => (
    <style>
        {\`
            @keyframes spin-slow {
              from { transform: translateZ(0) rotate(0deg); }
              to { transform: translateZ(0) rotate(360deg); }
            }
            @keyframes reverse-spin-slow {
              from { transform: translateZ(0) rotate(360deg); }
              to { transform: translateZ(0) rotate(0deg); }
            }
            @keyframes float-depth {
              0%, 100% { transform: translateY(0px) scale(1); }
              50% { transform: translateY(-15px) scale(1.1); filter: drop-shadow(0 20px 30px rgba(0,0,0,0.5)); }
            }
            @keyframes twinkle {
              0%, 100% { opacity: 0.1; transform: translateZ(-50px) scale(0.8); }
              50% { opacity: 1; transform: translateZ(0px) scale(1.2); box-shadow: 0 0 10px 2px rgba(255,255,255,0.4); }
            }
            @keyframes core-pulse {
              0%, 100% { transform: translate(-50%, -50%) scale(1); box-shadow: 0 0 80px rgba(168,85,247,0.3); }
              50% { transform: translate(-50%, -50%) scale(1.05); box-shadow: 0 0 120px rgba(168,85,247,0.6); }
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
            
            .floater {
              animation: float-depth 6s ease-in-out infinite alternate;
              transform-style: preserve-3d;
            }

            .space-map {
              background-image: radial-gradient(circle at center, #0a001a 0%, #000 100%);
              perspective: 1000px;
            }
            
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }

            .glow-star {
              border-radius: 50%;
              background: #fff;
              position: absolute;
            }
        \`}
    </style>
);

const Starfield = () => {
    const stars = React.useMemo(() => {
        const starArr = [];
        for (let i=0; i<150; i++) {
             starArr.push({
                 left: \`\${Math.random() * 100}%\`,
                 top: \`\${Math.random() * 100}%\`,
                 size: \`\${Math.random() * 2 + 1}px\`,
                 delay: \`\${Math.random() * 5}s\`,
                 duration: \`\${Math.random() * 3 + 2}s\`,
                 opacity: Math.random() * 0.8 + 0.2
             });
        }
        return starArr;
    }, []);

    return (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden h-full w-full">
            {stars.map((star, i) => (
                <div key={i} className="glow-star" style={{
                    left: star.left,
                    top: star.top,
                    width: star.size,
                    height: star.size,
                    animation: \`twinkle \${star.duration} infinite alternate \${star.delay}\`,
                    opacity: star.opacity
                }}></div>
            ))}
            <div className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] bg-purple-900/10 rounded-full blur-[100px] mix-blend-screen pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 w-[30vw] h-[30vw] bg-cyan-900/10 rounded-full blur-[100px] mix-blend-screen pointer-events-none"></div>
        </div>
    );
};

const OrbitalRing: React.FC<{ radius: number, speed: number, children: React.ReactNode }> = ({ radius, speed, children }) => {
    const items = React.Children.toArray(children);
    return (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ width: radius*2, height: radius*2, transformStyle: 'preserve-3d' }}>
            <div className="absolute inset-0 rounded-full border border-white/5 border-dashed opacity-40"></div>
            <div className="absolute top-1/2 left-1/2 w-0 h-0 flex items-center justify-center spinner" style={{ animationDuration: \`\${speed}s\` }}>
                {items.map((child, i) => {
                    const angle = (360 / items.length) * i;
                    return (
                        <div key={i} className="absolute pointer-events-auto" style={{ transform: \`rotate(\${angle}deg)\` }}>
                            <div className="absolute" style={{ transform: \`translateY(-\${radius}px)\` }}>
                                <div className="anti-spinner flex items-center justify-center" style={{ animationDuration: \`\${speed}s\` }}>
                                    <div className="floater" style={{ animationDelay: \`-\${i}s\`, transform: \`rotate(-\${angle}deg)\` }}>
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
    <div onClick={onClick} className={\`group relative \${size} rounded-full flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-125 shadow-lg \${bgClass} \${borderClass} border backdrop-blur-md\`}>
        {Icon && <Icon className={\`\${value !== undefined ? 'w-4 h-4 md:w-5 md:h-5' : 'w-1/2 h-1/2'} \${colorClass} relative z-10\`} />}
        {value !== undefined && <div className={\`mt-1 font-black text-[10px] md:text-sm leading-none \${colorClass}\`}>{value}</div>}
        <div className="absolute -bottom-14 opacity-0 group-hover:opacity-100 transition-all pointer-events-none flex flex-col items-center z-50">
             <span className={\`text-[9px] md:text-xs font-bold \${colorClass} bg-black/90 px-3 py-1.5 rounded-lg border \${borderClass} whitespace-nowrap shadow-[0_10px_30px_rgba(0,0,0,0.8)] uppercase tracking-widest\`}>
                 {label}
             </span>
        </div>
        <div className={\`absolute inset-0 rounded-full border border-white/5 opacity-50 group-hover:animate-ping\`}></div>
    </div>
);

// --- END ORBITAL COMPONENTS ---
`;

const startIndex = content.indexOf('// --- ORBITAL UI COMPONENTS ---');
const endIndex = content.indexOf('// --- END ORBITAL COMPONENTS ---') + '// --- END ORBITAL COMPONENTS ---'.length;

content = content.substring(0, startIndex) + newComponents + content.substring(endIndex);

// Now update the return statement:
const newReturn = `
  return (
    <div className="h-full w-full bg-[#020202] text-white font-['Cairo'] overflow-hidden space-map relative flex items-center justify-center">
        <OrbitalStyles />
        <Starfield />
        
        {/* Responsive scaling container to always fit strictly in the center without scrollbars */}
        <div className="absolute w-[800px] h-[800px] pointer-events-none flex items-center justify-center scale-[0.4] sm:scale-50 md:scale-[0.8] lg:scale-100" style={{ transformOrigin: 'center center' }}>
            
            {/* --- THE CORE (SUN) --- */}
            <div 
                onClick={onOpenChat}
                className="absolute top-1/2 left-1/2 w-32 h-32 md:w-48 md:h-48 rounded-full bg-gradient-to-br from-purple-600/40 to-black border border-purple-500/50 flex flex-col items-center justify-center cursor-pointer group pointer-events-auto z-50 hover:bg-purple-900/60 transition-all"
                style={{ animation: 'core-pulse 4s ease-in-out infinite' }}
            >
                <div className="absolute inset-0 rounded-full bg-purple-500/20 animate-ping opacity-20"></div>
                
                <Brain className="w-10 h-10 md:w-14 md:h-14 text-white fill-purple-300/30 relative z-10 mb-2 group-hover:scale-110 transition-transform duration-500" />
                <span className="text-white text-xs md:text-xl font-black tracking-widest uppercase relative z-10 drop-shadow-[0_2px_10px_rgba(255,255,255,0.5)]">الظل الرقمي</span>
                <span className="text-[8px] md:text-xs text-purple-200 font-bold uppercase relative z-10 tracking-[0.3em] mt-1 shadow-black drop-shadow-md">
                    {user.phone === 'GUEST' ? 'تجربة محدودة' : 'الدخول للاجتماع'}
                </span>
            </div>

            {/* --- ORBIT 1: INNER (Speed: 30s) --- */}
            {user.phone !== 'GUEST' && (
                <OrbitalRing radius={150} speed={30}>
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

            {/* --- ORBIT 2: MIDDLE (Speed: 45s) --- */}
            <OrbitalRing radius={250} speed={45}>
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

            {/* --- ORBIT 3: OUTER (Speed: 70s) --- */}
            <OrbitalRing radius={350} speed={70}>
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
`;

const returnIndex = content.indexOf('  return (');
const modalIndex = content.indexOf('        {/* --- MODALS REUSED EXACTLY AS BEFORE --- */}');
content = content.substring(0, returnIndex) + newReturn + content.substring(modalIndex + '        {/* --- MODALS REUSED EXACTLY AS BEFORE --- */}'.length);

fs.writeFileSync(_path, content, 'utf8');
console.log('Update script prepared.');
