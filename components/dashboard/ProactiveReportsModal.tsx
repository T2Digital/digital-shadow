import React from 'react';
import { X, ActivitySquare, Clock, CheckCircle2, AlertTriangle, FileText, MessageCircle } from 'lucide-react';

interface ReportsModalProps {
    onClose: () => void;
}

export const ProactiveReportsModal: React.FC<ReportsModalProps> = ({ onClose }) => {
    
    const reports = [
        {
            id: 1,
            time: 'منذ ساعتين',
            title: 'تقارير خدمة العملاء (آدم)',
            desc: 'قام بالرد على 50 استفساراً على صفحة الفيسبوك، منها 3 شكاوى تم تصعيدها لك.',
            icon: MessageCircle,
            type: 'info'
        },
        {
            id: 2,
            time: 'اليوم، 08:00 صباحاً',
            title: 'تحديث خطة المحتوى (د. بزنس)',
            desc: 'تم الانتهاء من صياغة خطة محتوى الأسبوع القادم ورفعها في مساحة العمل. هل أنشرها؟',
            icon: FileText,
            type: 'action'
        },
        {
            id: 3,
            time: 'أمس، 11:30 مساءً',
            title: 'محفظة السرب',
            desc: 'تم إتمام صفقة Arbitrage ناجحة عبر عقد Shadow. صافي الربح 15 MATIC. تم التحويل لمحفظة الظل.',
            icon: CheckCircle2,
            type: 'success'
        },
        {
            id: 4,
            time: 'أمس، 05:00 مساءً',
            title: 'صحة النظام',
            desc: 'لوحظ استهلاك عالي لمساحة التخزين في الذاكرة المحلية (IndexedDB). يرجى المراجعة.',
            icon: AlertTriangle,
            type: 'warning'
        }
    ];

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in zoom-in">
            <div className="w-full max-w-2xl bg-[#080808] border border-green-500/20 rounded-[40px] p-8 relative shadow-[0_0_50px_rgba(34,197,94,0.1)] overflow-y-auto max-h-[90vh] scrollbar-hide">
                <button onClick={onClose} className="absolute top-6 left-6 p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                    <X className="w-5 h-5 text-white/50" />
                </button>
                
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-green-900/20 rounded-xl border border-green-500/30">
                        <ActivitySquare className="w-8 h-8 text-green-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white">الوعي الزمني والمبادرة</h2>
                        <p className="text-green-200/50 text-xs font-bold uppercase tracking-widest">Proactivity & Temporal Context</p>
                    </div>
                </div>

                <div className="bg-white/5 p-5 rounded-[24px] border border-white/5 mb-8">
                    <p className="text-sm text-white/70 leading-relaxed">
                        الظل لا ينتظر أوامرك دائماً. يقوم بتشغيل نفسه دورياً، يتابع سير العمل بين جميع الوكلاء (د. بزنس، آدم، نكسوس، السرب) 
                        ويقدم لك تقريراً شاملاً بالاكتشافات والإجراءات التي أتمها بالنيابة عنك، مع طلب إذنك في القرارات المصيرية.
                    </p>
                </div>

                <div className="relative border-r-2 border-white/10 pr-6 space-y-8">
                    {reports.map((report) => {
                        const Icon = report.icon;
                        let colorClass = 'text-blue-400';
                        let bgClass = 'bg-blue-500/10';
                        let borderClass = 'border-blue-500/30';
                        
                        if (report.type === 'action') { colorClass = 'text-amber-400'; bgClass = 'bg-amber-500/10'; borderClass = 'border-amber-500/30'; }
                        if (report.type === 'success') { colorClass = 'text-emerald-400'; bgClass = 'bg-emerald-500/10'; borderClass = 'border-emerald-500/30'; }
                        if (report.type === 'warning') { colorClass = 'text-red-400'; bgClass = 'bg-red-500/10'; borderClass = 'border-red-500/30'; }

                        return (
                            <div key={report.id} className="relative">
                                {/* Timeline Dot */}
                                <div className={`absolute -right-[35px] top-4 w-4 h-4 rounded-full border-2 border-[#080808] ${bgClass.replace('/10', '')} z-10`}></div>
                                
                                <div className={`p-5 rounded-2xl border bg-black/40 ${borderClass} hover:bg-white/[0.02] transition-colors`}>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className={`p-2 rounded-lg ${bgClass}`}>
                                            <Icon className={`w-4 h-4 ${colorClass}`} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white text-sm">{report.title}</h3>
                                            <div className="flex items-center gap-1 text-[10px] text-white/40 mt-0.5">
                                                <Clock className="w-3 h-3" />
                                                <span>{report.time}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-white/60 leading-relaxed mt-3">
                                        {report.desc}
                                    </p>
                                    
                                    {report.type === 'action' && (
                                        <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
                                            <button className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-all flex-1">
                                                موافقة (نشر المخطط)
                                            </button>
                                            <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-bold transition-all flex-1">
                                                تعديل قبل النشر
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
