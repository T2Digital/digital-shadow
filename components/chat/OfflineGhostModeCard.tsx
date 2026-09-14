import React, { useState, useEffect } from 'react';
import { WifiOff, Cpu, DatabaseZap, LockKeyhole } from 'lucide-react';
import { CreateMLCEngine } from "@mlc-ai/web-llm";

export const OfflineGhostModeCard = ({ card }: { card: any }) => {
    const [status, setStatus] = useState('Initializing WebGPU Models...');
    const [progress, setProgress] = useState(0);
    const [active, setActive] = useState(false);

    useEffect(() => {
        let mounted = true;
        const initLocalLLM = async () => {
            try {
                // Using a very small model for fast load
                const engine = await CreateMLCEngine(
                    "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC",
                    { 
                        initProgressCallback: (p) => {
                            if (!mounted) return;
                            const pct = Math.floor(p.progress * 100);
                            setProgress(pct);
                            if (pct > 0 && pct < 100) {
                                setStatus("Downloading Weights (" + pct + "%)");
                            }
                        }
                    }
                );
                if (!mounted) return;
                
                // Expose globally for the chat component to use horizontally if needed
                (window as any).localEngine = engine;
                
                setStatus('Local LLM Ready. Ghost Mode Active.');
                setActive(true);
            } catch (err: any) {
                if (mounted) {
                    setStatus('WebGPU not supported or error: ' + err.message);
                }
            }
        };

        if (!(window as any).localEngine) {
            initLocalLLM();
        } else {
            setProgress(100);
            setStatus('Local LLM Ready. Ghost Mode Active.');
            setActive(true);
        }

        return () => { mounted = false; };
    }, []);

    return (
        <div className={`mt-4 rounded-[22px] p-5 w-full md:w-[400px] bg-black border ${active ? 'border-gray-500 shadow-[0_0_30px_rgba(255,255,255,0.1)]' : 'border-gray-800'} relative overflow-hidden transition-all duration-700`}>
            {/* Dark scanline bg */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4px_4px] pointer-events-none opacity-20" />
            
            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg border ${active ? 'bg-white text-black border-white' : 'bg-[#111] text-gray-500 border-[#333]'} transition-colors duration-500`}>
                        <WifiOff className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className={`font-black text-xs tracking-widest uppercase ${active ? 'text-white' : 'text-gray-500'}`}>Offline Ghost Mode</h3>
                        <p className="text-[9px] text-gray-500 mt-1 uppercase font-bold">Local WebGPU Inference</p>
                    </div>
                </div>
            </div>

            <div className="relative z-10 mb-4">
                <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase mb-2">
                    <span>{status}</span>
                    <span>{Math.floor(progress)}%</span>
                </div>
                <div className="w-full h-1 bg-[#111] rounded overflow-hidden">
                    <div className={`h-full transition-all duration-300 ${active ? 'bg-white' : 'bg-gray-600'}`} style={{ width: `${progress}%` }} />
                </div>
            </div>

            {active && (
                <div className="relative z-10 grid grid-cols-2 gap-2 animate-fade-in">
                    <div className="bg-[#111] border border-[#333] p-3 rounded-lg flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-gray-400" />
                         <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider w-full text-center">Local Compute</span>
                    </div>
                    <div className="bg-[#111] border border-[#333] p-3 rounded-lg flex items-center gap-2">
                        <DatabaseZap className="w-4 h-4 text-gray-400" />
                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider w-full text-center">Memory Synced</span>
                    </div>
                </div>
            )}
            
            <div className="relative z-10 mt-4 pt-3 border-t border-[#222] flex items-center justify-center gap-2 text-gray-500 text-[9px] uppercase tracking-widest">
                <LockKeyhole className="w-3 h-3" /> Data never leaves your device
            </div>
        </div>
    );
};
