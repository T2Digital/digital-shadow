import React, { useEffect, useState } from 'react';
import { Brain, Bell, X, Activity } from 'lucide-react';
import { useAppStore } from '../services/store';

export const ProactiveNotification: React.FC = React.memo(() => {
    const { user } = useAppStore();
    const [notification, setNotification] = useState<{title: string, message: string} | null>(null);

    useEffect(() => {
        if (!user || user.email === 'GUEST') return;

        const handleClear = () => {
            setNotification(null);
        };
        window.addEventListener('shadow_clear_notifications', handleClear);

        // Simulate learning user habits: 
        // 1. If it's early morning, remind about daily plan.
        // 2. If it's late night, suggest resting or saving work.
        // 3. Random check-ins based on 'Shadow System'
        
        const checkHabits = () => {
            const hour = new Date().getHours();
            const habitSeed = Math.random();

            if (habitSeed < 0.2) {
                // 20% chance to trigger a proactive thought
                if (hour >= 6 && hour <= 9) {
                    setNotification({
                        title: "عاداتك الصباحية",
                        message: "صباح الخير يا ماستر. لاحظت إنك بتبدأ يومك بفتح الداشبورد. تحب أجهزلك ملخص الشغل النهارده؟"
                    });
                } else if (hour >= 23 || hour <= 2) {
                    setNotification({
                        title: "تحليل الإرهاق",
                        message: "الوقت متأخر. عادةً إنتاجيتك بتقل بعد نص الليل. أقترح تحفظ شغلك وتكمل بكرة لتجنب الإرهاق."
                    });
                } else {
                    setNotification({
                        title: "إشعار استباقي 🧠",
                        message: "بناءً على وتيرة عملك الحالية، أقترح تاخد بريك 5 دقايق عشان تجدد نشاطك وتتجنب التشتت."
                    });
                }

                // Auto hide after 8 seconds
                setTimeout(() => setNotification(null), 8000);
            }
        };

        // Check every 5 minutes
        const interval = setInterval(checkHabits, 5 * 60 * 1000);
        
        // Check once 30 seconds after mounting
        const initialDelay = setTimeout(checkHabits, 30000);

        return () => {
            clearInterval(interval);
            clearTimeout(initialDelay);
            window.removeEventListener('shadow_clear_notifications', handleClear);
        };
    }, [user]);

    if (!notification) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[999] animate-in slide-in-from-right-10 fade-in duration-500">
            <div className="bg-[#0a0a0a]/90 backdrop-blur-xl border border-cyan-500/30 p-4 rounded-2xl shadow-[0_0_40px_rgba(6,182,212,0.15)] flex gap-4 items-start max-w-sm pointer-events-auto">
                <div className="p-2 bg-cyan-900/40 rounded-full border border-cyan-500/20">
                    <Brain className="w-5 h-5 text-cyan-400 animate-pulse" />
                </div>
                <div className="flex-1">
                    <h4 className="text-cyan-100 font-bold text-sm mb-1">{notification.title}</h4>
                    <p className="text-white/70 text-xs leading-relaxed">{notification.message}</p>
                </div>
                <button onClick={() => setNotification(null)} className="text-white/40 hover:text-white mt-1 transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
});
