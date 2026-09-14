
import React, { useEffect, useState } from 'react';
import { shadowDB } from '../services/dbService';
import { Eye, Activity, Fingerprint } from 'lucide-react';

interface Props {
  pulse: 'calm' | 'focused' | 'spiritual' | 'warning' | 'curious';
  size?: 'normal' | 'small';
}

const ShadowVisual: React.FC<Props> = ({ pulse, size = 'normal' }) => {
  const [syncRate, setSyncRate] = useState(0);

  useEffect(() => {
    const fetchSync = async () => setSyncRate(await shadowDB.getSyncStats());
    fetchSync();
    const interval = setInterval(fetchSync, 10000);
    return () => clearInterval(interval);
  }, []);

  const getColor = () => {
    switch(pulse) {
      case 'spiritual': return 'text-cyan-400 border-cyan-500/50 shadow-cyan-500/20';
      case 'warning': return 'text-red-500 border-red-500/50 shadow-red-500/20';
      default: return 'text-purple-500 border-purple-500/50 shadow-purple-500/20';
    }
  };

  const coreSize = size === 'small' ? 'w-32 h-32' : 'w-48 h-48 md:w-64 md:h-64';

  return (
    <div className={`relative flex items-center justify-center animate-in zoom-in duration-700`}>
      {/* Background Glow */}
      <div className={`absolute inset-0 bg-gradient-to-tr from-purple-900/20 to-cyan-900/20 rounded-full blur-[100px] opacity-40 animate-pulse`}></div>
      
      {/* Main Core */}
      <div className={`${coreSize} relative bg-black rounded-full flex flex-col items-center justify-center border border-white/10 shadow-2xl z-10 group overflow-hidden`}>
        <div className={`absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent opacity-50`}></div>
        
        {/* Animated Rings */}
        <div className={`absolute inset-2 rounded-full border border-dashed border-white/20 animate-[spin_20s_linear_infinite] opacity-30`}></div>
        <div className={`absolute inset-6 rounded-full border border-dotted border-white/10 animate-[spin_15s_linear_infinite_reverse] opacity-50`}></div>
        
        <div className="z-20 flex flex-col items-center gap-3">
            <div className={`p-4 rounded-full border bg-white/5 backdrop-blur-md ${getColor()} shadow-[0_0_30px_currentColor] transition-all duration-1000 group-hover:scale-110`}>
                <Fingerprint className="w-8 h-8 md:w-12 md:h-12 animate-pulse" />
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-black/80 rounded-full border border-white/10">
                <Activity className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] font-mono text-white/80 tracking-widest">{syncRate}% SYNC</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ShadowVisual;
