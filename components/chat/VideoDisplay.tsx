import React, { useState } from 'react';
import { Film, Play, Loader2 } from 'lucide-react';

export const VideoDisplay = ({ card }: { card: any }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Use generated video URL or fallback
    const videoUrl = card.url || card.videoUrl || "https://cdn.pixabay.com/video/2023/10/22/186026-876800755_tiny.mp4";

    return (
        <div className="mt-4 rounded-[22px] p-2 w-full md:max-w-md bg-[#1a1a1a]/95 border border-white/20 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-orange-500 z-10"></div>
            
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center group" onClick={(e) => e.stopPropagation()}>
                {isLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
                        <Loader2 className="w-6 h-6 text-pink-500 animate-spin mb-2" />
                        <span className="text-[10px] text-pink-400 font-bold tracking-widest animate-pulse">LOADING VIDEO...</span>
                    </div>
                )}
                
                <video 
                    src={videoUrl || undefined} 
                    className={`w-full h-full object-contain transition-opacity duration-1000 ${isLoading ? 'opacity-0' : 'opacity-100'} cursor-pointer`}
                    autoPlay={false}
                    controls
                    playsInline
                    onCanPlay={() => {
                        setIsLoading(false);
                    }}
                />
            </div>

            <div className="p-3">
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-gradient-to-r from-pink-500 to-orange-500 rounded-lg text-white">
                        <Film className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="font-bold text-sm text-white truncate">AI Video Render</h3>
                </div>
                {card.prompt && (
                    <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                        <p className="text-[10px] text-white/70 italic line-clamp-3">"{card.prompt}"</p>
                    </div>
                )}
                {card.duration && (
                    <p className="text-[9px] text-white/40 mt-2 font-mono">ESTIMATED DURATION: {card.duration}s</p>
                )}
            </div>
        </div>
    );
};
