import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Only show if not already installed (basic check)
      if (!window.matchMedia('(display-mode: standalone)').matches) {
          setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:w-80 z-[150] animate-in slide-in-from-bottom-10 fade-in duration-700">
      <div className="bg-[#111] border border-purple-500/30 rounded-2xl p-4 shadow-[0_0_30px_rgba(168,85,247,0.3)] flex items-center justify-between relative overflow-hidden group">
        <div className="absolute inset-0 bg-purple-600/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
        
        <div className="flex items-center gap-3 relative z-10">
            <div className="p-2 bg-purple-600 rounded-xl shadow-lg">
                <Download className="w-5 h-5 text-white animate-bounce" />
            </div>
            <div>
                <h4 className="text-sm font-black text-white">تثبيت الظل (App)</h4>
                <p className="text-[10px] text-white/50">تجربة كاملة بدون متصفح</p>
            </div>
        </div>

        <div className="flex items-center gap-2 relative z-10">
            <button onClick={handleInstall} className="px-3 py-1.5 bg-white text-black text-xs font-bold rounded-lg hover:scale-105 transition-transform">تثبيت</button>
            <button onClick={() => setIsVisible(false)} className="p-1.5 hover:bg-white/10 rounded-full transition-colors"><X className="w-4 h-4 text-white/30" /></button>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;