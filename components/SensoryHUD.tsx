import React, { useEffect, useState, useMemo } from 'react';
import { Activity, Battery, BrainCircuit, Cpu } from 'lucide-react';
import { getContextData, analyzeEmotionFromText, generateDynamicThinkingSteps } from '../services/sensorService';
import { getActiveTasksCount } from '../services/autonomousAgentService';

export const SensoryHUD: React.FC<{ lastMessage?: string; isThinking?: boolean }> = ({ lastMessage = '', isThinking = false }) => {
    const [battery, setBattery] = useState('جار القياس...');
    const [bgTasks, setBgTasks] = useState(0);
    const [thinkingStep, setThinkingStep] = useState(0);

    useEffect(() => {
        let isMounted = true;
        const updateContext = async () => {
            const ctx = await getContextData();
            if (isMounted) setBattery(ctx.battery);
        };
        updateContext();
        const interval = setInterval(updateContext, 10000); 
        return () => {
            isMounted = false;
            clearInterval(interval);
        }
    }, []);

    useEffect(() => {
        let isMounted = true;
        const updateTasks = () => {
            if (isMounted) setBgTasks(getActiveTasksCount());
        };
        window.addEventListener('autonomous_status_changed', updateTasks);
        updateTasks();
        return () => {
            isMounted = false;
            window.removeEventListener('autonomous_status_changed', updateTasks);
        }
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isThinking) {
            setThinkingStep(0);
            interval = setInterval(() => {
                setThinkingStep(prev => prev + 1);
            }, 1800);
        } else {
            setThinkingStep(0);
        }
        return () => clearInterval(interval);
    }, [isThinking]);

    const emotion = useMemo(() => {
        if (isThinking) {
            const steps = lastMessage ? generateDynamicThinkingSteps(lastMessage) : [
                "جاري استيعاب الطلب...",
                "البحث في الذاكرة المعرفية...",
                "تفعيل الوكلاء للعمل على المعطيات...",
                "تنسيق الإجابة في مسارات متعددة...",
                "المراجعة الأمنية والتدقيق...",
                "صياغة الرد النهائي..."
            ];
            return steps[Math.min(thinkingStep, steps.length - 1)];
        } else if (lastMessage) {
            const emo = analyzeEmotionFromText(lastMessage);
            return emo.emotion;
        }
        return 'في الانتظار 😐';
    }, [lastMessage, isThinking, thinkingStep]);

    return (
        <div className="flex gap-4 p-2 bg-white/5 border border-white/10 rounded-xl mb-3 text-xs font-['Cairo'] text-white/50 justify-between items-center px-4" dir="rtl">
            <div className="flex items-center gap-1.5" title="البطارية">
                <Battery className="w-3.5 h-3.5 text-emerald-500" />
                <span>{battery}</span>
            </div>
            {bgTasks > 0 && (
                <div className="flex items-center gap-1.5" title="مهام تعمل في الخلفية">
                    <Cpu className="w-3.5 h-3.5 text-orange-500 animate-spin" style={{ animationDuration: '3s' }} />
                    <span className="text-orange-400 font-bold">{bgTasks}</span>
                </div>
            )}
            <div className="flex items-center gap-1.5" title="الحالة">
                <BrainCircuit className={`w-3.5 h-3.5 ${isThinking ? 'text-amber-500 animate-pulse' : 'text-fuchsia-500'}`} />
                <span>{emotion}</span>
            </div>
        </div>
    );
};

