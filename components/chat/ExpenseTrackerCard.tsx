import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, DollarSign, PlusCircle, Calendar } from 'lucide-react';
import { shadowDB } from '../../services/dbService';

export const ExpenseTrackerCard = ({ card }: { card: any }) => {
    const [expenses, setExpenses] = useState<any[]>([]);
    
    useEffect(() => {
        // Load data on mount
        loadExpenses();
    }, []);

    const loadExpenses = () => {
        try {
            const data = localStorage.getItem('shadow_expenses');
            if (data) {
                setExpenses(JSON.parse(data));
            }
        } catch(e) {}
    };

    useEffect(() => {
        if (card.action === 'add_expense' && card.amount) {
            const newExp = {
                id: Date.now(),
                amount: card.amount,
                category: card.category || 'عام',
                note: card.note || '',
                date: new Date().toISOString()
            };
            
            // Avoid duplicate adds on re-render using timestamp
            const existing = localStorage.getItem('shadow_expenses');
            let exps = existing ? JSON.parse(existing) : [];
            if (!exps.find((e:any) => Math.abs(new Date(e.date).getTime() - new Date(newExp.date).getTime()) < 2000 && e.amount === newExp.amount)) {
                exps.push(newExp);
                localStorage.setItem('shadow_expenses', JSON.stringify(exps));
                setExpenses(exps);
            }
        }
    }, [card]);

    const total = expenses.reduce((sum, e) => sum + e.amount, 0);

    return (
        <div className="bg-gradient-to-br from-emerald-900/30 to-black border border-emerald-500/30 p-5 rounded-3xl w-full md:w-[400px] mt-4 shadow-2xl relative overflow-hidden font-sans" dir="rtl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full"></div>
            
            <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="w-12 h-12 bg-emerald-500/20 flex items-center justify-center rounded-xl text-emerald-400 backdrop-blur-md border border-emerald-500/30">
                    <Wallet className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-bold text-white text-lg">المحاسب الشخصي</h3>
                    <p className="text-emerald-400/80 text-xs text-left w-full" dir="ltr">Expense Tracker</p>
                </div>
            </div>

            <div className="bg-black/40 border border-white/5 rounded-2xl p-4 mb-4 backdrop-blur-sm">
                <p className="text-white/50 text-xs mb-1">إجمالي المصروفات</p>
                <div className="flex items-end gap-2">
                    <span className="text-3xl font-black text-white">{total.toLocaleString('ar-EG')}</span>
                    <span className="text-emerald-500 font-bold mb-1 border-b border-emerald-500/50">جنيه</span>
                </div>
            </div>

            {card.action === 'add_expense' && card.amount && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-center gap-3 mb-4 animate-in fade-in slide-in-from-top-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <PlusCircle className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-white font-bold text-sm">تم إضافة: {card.amount} جنيه</p>
                        <p className="text-white/50 text-xs line-clamp-1">{card.category} {card.note ? `- ${card.note}` : ''}</p>
                    </div>
                </div>
            )}

            <div className="space-y-2 mt-4 max-h-[150px] overflow-y-auto scrollbar-hide pr-1">
                {expenses.slice().reverse().slice(0, 5).map((exp, i) => (
                    <div key={exp.id || i} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center text-white/50">
                                <DollarSign className="w-3.5 h-3.5" />
                            </div>
                            <div>
                                <p className="text-white/90 text-sm font-bold">{exp.category}</p>
                                <p className="text-white/40 text-[10px]">{new Date(exp.date).toLocaleDateString('ar-EG')}</p>
                            </div>
                        </div>
                        <span className="text-red-400 font-bold font-mono text-sm">-{exp.amount} EGP</span>
                    </div>
                ))}
                {expenses.length === 0 && (
                    <p className="text-center text-white/40 text-xs py-4">لا توجد مصروفات مسجلة بعد</p>
                )}
            </div>
        </div>
    );
};
