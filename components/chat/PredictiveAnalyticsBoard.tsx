import React from 'react';
import { Activity, ArrowUpRight, ArrowDownRight, Minus, Check, Clock, AlertCircle } from 'lucide-react';

interface Metric {
    name: string;
    value: string;
    trend: 'up' | 'down' | 'neutral';
}

interface PredictedAction {
    description: string;
    probability: number;
    request_approval: boolean;
}

interface PredictiveAnalyticsBoardProps {
    title: string;
    metrics: Metric[];
    predicted_actions: PredictedAction[];
    onApproveAction?: (actionDescription: string) => void;
}

export const PredictiveAnalyticsBoard: React.FC<PredictiveAnalyticsBoardProps> = ({ title, metrics, predicted_actions, onApproveAction }) => {
    return (
        <div className="bg-[#121212] border border-white/10 rounded-xl overflow-hidden font-sans shadow-lg my-4" dir="rtl">
            <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 p-4 border-b border-white/10 flex items-center gap-3">
                <Activity className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold text-white tracking-tight">{title}</h3>
            </div>
            
            <div className="p-5 space-y-6">
                {/* Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {metrics.map((m, idx) => (
                        <div key={idx} className="bg-black/30 p-3 rounded-lg border border-white/5 flex flex-col gap-1 relative overflow-hidden group">
                            <div className="text-xs text-white/50">{m.name}</div>
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-white">{m.value}</span>
                                {m.trend === 'up' && <ArrowUpRight className="w-4 h-4 text-emerald-400" />}
                                {m.trend === 'down' && <ArrowDownRight className="w-4 h-4 text-rose-400" />}
                                {m.trend === 'neutral' && <Minus className="w-4 h-4 text-gray-400" />}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Predicted Actions */}
                <div className="space-y-3">
                    <h4 className="text-sm font-medium text-white/70 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        قرارات يدرسها الظل المستقبلية
                    </h4>
                    
                    <div className="space-y-2">
                        {predicted_actions.map((act, idx) => (
                            <div key={idx} className="bg-black/20 hover:bg-black/40 transition-colors p-3 rounded-lg border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                                <div className="flex items-start gap-3">
                                    <div className="mt-1">
                                        {act.probability >= 80 ? <AlertCircle className="w-4 h-4 text-amber-400" /> : <Activity className="w-4 h-4 text-blue-400" />}
                                    </div>
                                    <div>
                                        <div className="text-sm text-white/90">{act.description}</div>
                                        <div className="text-xs text-white/40 mt-1">احتمالية الحدوث: {act.probability}%</div>
                                    </div>
                                </div>
                                {act.request_approval && (
                                    <button 
                                        onClick={() => onApproveAction && onApproveAction(act.description)}
                                        className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-medium rounded-md transition-colors"
                                    >
                                        <Check className="w-3 h-3" />
                                        اعتماد مبكر
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
