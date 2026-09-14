import React, { useState } from 'react';
import { Target, Clock, X, Trash2, Check, RefreshCw, Edit2, Play } from 'lucide-react';
import { DBTask, shadowDB } from '../../services/dbService';

export const TasksModal: React.FC<{ tasks: DBTask[], onClose: () => void, onTasksChanged: () => void }> = ({ tasks, onClose, onTasksChanged }) => {
    const [editingTask, setEditingTask] = useState<DBTask | null>(null);

    const toggleStatus = async (task: DBTask) => {
        const newStatus = task.status === 'pending' ? 'done' : 'pending';
        await shadowDB.saveTask({ ...task, status: newStatus });
        onTasksChanged();
    };

    const deleteTask = async (task: DBTask) => {
        if (!task.id) return;
        await shadowDB.deleteTask(task.id);
        onTasksChanged();
    };

    const saveEdit = async () => {
        if (!editingTask) return;
        await shadowDB.saveTask(editingTask);
        setEditingTask(null);
        onTasksChanged();
    };

    return (
        <div className="fixed inset-0 z-[600] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in" dir="rtl">
            <div className="bg-[#111] border border-amber-500/20 rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col shadow-[0_0_50px_rgba(245,158,11,0.1)] relative overflow-hidden font-['Cairo']">
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#0a0a0a]">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-500/20 rounded-xl border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                            <Target className="w-6 h-6 text-amber-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white">المهام والتذكيرات النشطة</h2>
                            <p className="text-[10px] text-amber-300 font-mono tracking-widest uppercase mt-1 flex items-center gap-1">
                                <Clock className="w-3 h-3 animate-pulse" /> Shadow Task Manager
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/50 hover:text-white transition-all">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                    {tasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-white/30 gap-2">
                            <Target className="w-12 h-12 opacity-50" />
                            <p className="text-sm font-bold">مفيش مهام مسجلة حالياً.</p>
                        </div>
                    ) : (
                        tasks.map((t, i) => (
                            <div key={i} className={`bg-white/5 border ${t.status === 'completed' ? 'border-emerald-500/30 bg-emerald-900/10' : 'border-white/10'} rounded-xl p-4 flex gap-4 items-start group transition-all`}>
                                <button onClick={() => toggleStatus(t)} className={`mt-1 p-1 rounded-full border ${t.status === 'completed' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-white/30 text-transparent hover:border-amber-500'} transition-colors`}>
                                    <Check className="w-4 h-4" />
                                </button>
                                
                                <div className="flex-1">
                                    {editingTask?.id === t.id ? (
                                        <div className="space-y-3">
                                            <input 
                                                type="text" 
                                                value={editingTask.task} 
                                                onChange={e => setEditingTask({...editingTask, task: e.target.value})}
                                                className="w-full bg-black/50 border border-white/20 rounded-lg p-2 text-sm text-white"
                                            />
                                            <div className="flex gap-2">
                                                <input 
                                                    type="time" 
                                                    value={editingTask.time} 
                                                    onChange={e => setEditingTask({...editingTask, time: e.target.value})}
                                                    className="bg-black/50 border border-white/20 rounded-lg p-2 text-sm text-white"
                                                />
                                                <label className="flex items-center gap-2 text-sm text-white/70">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={editingTask.recurring} 
                                                        onChange={e => setEditingTask({...editingTask, recurring: e.target.checked})}
                                                    />
                                                    تكرار يومي؟
                                                </label>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={saveEdit} className="px-4 py-2 bg-amber-600 text-white font-bold rounded-lg text-xs">حفظ</button>
                                                <button onClick={() => setEditingTask(null)} className="px-4 py-2 bg-white/10 text-white font-bold rounded-lg text-xs">إلغاء</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <p className={`text-sm font-bold ${t.status === 'completed' ? 'text-white/40 line-through' : 'text-white'} leading-6`}>{t.task}</p>
                                            <div className="flex items-center gap-4 mt-2">
                                                <p className="text-[11px] text-amber-500/70 font-mono font-bold">{t.time}</p>
                                                {t.recurring && <p className="text-[11px] text-purple-400 font-bold flex items-center gap-1"><RefreshCw className="w-3 h-3" /> متكرر</p>}
                                                {t.type === 'autonomous' && <p className="text-[11px] text-cyan-400 font-bold flex items-center gap-1"><Play className="w-3 h-3" /> مهمة خلفية</p>}
                                            </div>
                                        </>
                                    )}
                                </div>
                                
                                {!editingTask && (
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => setEditingTask(t)} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => deleteTask(t)} className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
