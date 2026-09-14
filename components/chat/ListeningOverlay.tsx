import React from 'react';
import { X, Square } from 'lucide-react';

interface ListeningOverlayProps {
    liveTranscript: string;
    visualLevels: number[];
    cancelRecording: () => void;
    stopListeningAndSend: () => void;
}

export const ListeningOverlay: React.FC<ListeningOverlayProps> = ({ liveTranscript, visualLevels, cancelRecording, stopListeningAndSend }) => {
    const avgLevel = visualLevels.reduce((a,b)=>a+b, 0) / visualLevels.length;
    const orbScale = 1 + (avgLevel / 255) * 0.8;
    const orbRotationY = avgLevel; // Rotate faster when loud
    
    return (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-300">
            <div className="absolute top-10 left-10"><button onClick={cancelRecording} className="p-4 bg-white/10 rounded-full hover:bg-white/20 text-white"><X className="w-8 h-8" /></button></div>
            
            <div className="text-center mb-16 relative z-10 w-full max-w-xl px-4">
                <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 mb-4 animate-pulse drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">الظل يستمع إليك...</h2>
                <p className="text-white/80 text-lg font-medium bg-black/50 p-4 rounded-2xl border border-white/10 min-h-[80px] flex items-center justify-center shadow-inner">{liveTranscript || "تحدث الآن..."}</p>
            </div>

            {/* 3D Interactive Geometric Avatar */}
            <div className="relative w-64 h-64 mb-16 flex items-center justify-center" style={{ perspective: '1000px' }}>
                <div 
                    className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-600 to-cyan-500 opacity-20 blur-3xl transition-opacity duration-75"
                    style={{ opacity: Math.max(0.2, avgLevel / 255) }}
                />
                
                <div 
                    className="relative w-40 h-40 transform-style-3d transition-transform duration-75"
                    style={{ 
                        transform: `scale(${orbScale}) rotateY(${orbRotationY}deg) rotateX(${avgLevel/2}deg)`,
                        transformStyle: 'preserve-3d'
                    }}
                >
                    {/* Inner Core */}
                    <div className="absolute inset-0 rounded-full bg-cyan-400/80 shadow-[0_0_50px_rgba(34,211,238,1)] animate-pulse" style={{ transform: 'translateZ(0px) scale(0.6)' }} />
                    
                    {/* Ring 1 */}
                    <div className="absolute inset-0 rounded-full border-4 border-purple-500/80" style={{ transform: 'translateZ(20px) rotateX(45deg) rotateY(45deg)' }} />
                    <div className="absolute inset-0 rounded-full border-4 border-cyan-500/80" style={{ transform: 'translateZ(-20px) rotateX(-45deg) rotateY(-45deg)' }} />
                    
                    {/* Ring 2 */}
                    <div className="absolute inset-0 rounded-full border-2 border-white/50" style={{ transform: `translateZ(40px) rotateX(90deg) rotateY(${avgLevel}deg)` }} />
                    <div className="absolute inset-0 rounded-full border-2 border-purple-400/50" style={{ transform: `translateZ(-40px) rotateX(-90deg) rotateY(${-avgLevel}deg)` }} />
                    
                    {/* Voice reactive particles */}
                    {visualLevels.slice(0, 8).map((level, i) => (
                        <div 
                            key={i} 
                            className="absolute w-2 h-2 rounded-full bg-cyan-300"
                            style={{ 
                                left: '50%', top: '50%',
                                transform: `rotate(${i * 45}deg) translateY(-${50 + (level / 2)}px) translateZ(${level / 2}px)`,
                                opacity: Math.max(0.2, level / 255)
                            }}
                        />
                    ))}
                </div>
            </div>

            <button onClick={stopListeningAndSend} className="p-6 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full border border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_50px_rgba(255,255,255,0.3)] transition-all hover:scale-110 active:scale-95 text-white group"><Square className="w-8 h-8 fill-current group-hover:text-red-400 transition-colors" /></button>
        </div>
    );
};
