import React, { useRef, useEffect, useState } from 'react';
import { BrainCircuit, GitCommit, Search, Plus, Sparkles, Database, Check, Tag } from 'lucide-react';
import { shadowDB, DBFact } from '../../services/dbService';

export interface MemoryNodeItem {
    id: string | number;
    fact: string;
    category?: string;
    timestamp: number;
}

export const MemoryConstellationCard = ({ card }: { card: any }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [facts, setFacts] = useState<MemoryNodeItem[]>([]);
    const [selectedFact, setSelectedFact] = useState<MemoryNodeItem | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [newFactText, setNewFactText] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const loadRealMemories = async () => {
        try {
            const stored = await shadowDB.getMemory('guest');
            if (stored && stored.length > 0) {
                const formatted: MemoryNodeItem[] = stored.map(s => ({
                    id: s.id || Date.now(),
                    fact: s.fact,
                    category: 'ذاكرة موثقة',
                    timestamp: s.timestamp || Date.now()
                }));
                setFacts(formatted);
                setSelectedFact(formatted[0]);
            } else {
                // Seed some meaningful initial facts if database is empty
                const initialFacts: MemoryNodeItem[] = [
                    { id: 1, fact: 'المستخدم يفضل الردود المباشرة والعملية ذات القيمة العالية.', category: 'تفضيلات', timestamp: Date.now() - 86400000 },
                    { id: 2, fact: 'الهدف الاستراتيجي الحالي: بناء إمبراطورية أتمتة رقمية والوصول إلى الحرية المالية.', category: 'أهداف', timestamp: Date.now() - 43200000 },
                    { id: 3, fact: 'اللهجة المفضلة للمساعد الصوتي: المصرية الفخمة الراقية (شاكر).', category: 'صوتيات', timestamp: Date.now() - 20000000 },
                    { id: 4, fact: 'المشاريع النشطة: نظام تشغيل الظل الرقمي وسرب الوكلاء المستقلين.', category: 'مشاريع', timestamp: Date.now() }
                ];
                setFacts(initialFacts);
                setSelectedFact(initialFacts[0]);
            }
        } catch (e) {
            console.error('Error loading facts:', e);
        }
    };

    useEffect(() => {
        loadRealMemories();
    }, []);

    const handleAddMemory = async () => {
        if (!newFactText.trim()) return;
        try {
            const newFact: DBFact = {
                userId: 'guest',
                fact: newFactText.trim(),
                timestamp: Date.now()
            };
            await shadowDB.saveFact(newFact);
            const nodeItem: MemoryNodeItem = {
                id: Date.now(),
                fact: newFact.fact,
                category: 'معرفة عامة',
                timestamp: newFact.timestamp
            };
            setFacts(prev => [nodeItem, ...prev]);
            setSelectedFact(nodeItem);
            setNewFactText('');
            setIsAdding(false);
        } catch (e) {
            console.error('Error saving fact:', e);
        }
    };

    const filteredFacts = facts.filter(f => 
        f.fact.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (f.category && f.category.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Canvas Visualizer
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = canvas.width = 400;
        let height = canvas.height = 200;

        const nodes = facts.map((fact, i) => {
            const angle = (i / Math.max(facts.length, 1)) * Math.PI * 2;
            const radius = 60 + (i % 3) * 20;
            return {
                id: fact.id,
                fact: fact.fact,
                x: width / 2 + Math.cos(angle) * radius,
                y: height / 2 + Math.sin(angle) * radius,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                size: fact.id === selectedFact?.id ? 7 : 4,
                color: fact.id === selectedFact?.id ? '#facc15' : '#c084fc'
            };
        });

        let animationId: number;
        const centerNode = { x: width / 2, y: height / 2, size: 8, color: '#38bdf8' };

        const draw = () => {
            ctx.fillStyle = '#06040c';
            ctx.fillRect(0, 0, width, height);

            // Draw center
            ctx.beginPath();
            ctx.arc(centerNode.x, centerNode.y, centerNode.size, 0, Math.PI * 2);
            ctx.fillStyle = centerNode.color;
            ctx.shadowColor = centerNode.color;
            ctx.shadowBlur = 12;
            ctx.fill();
            ctx.shadowBlur = 0;

            nodes.forEach(node => {
                node.x += node.vx;
                node.y += node.vy;

                if (node.x < 20 || node.x > width - 20) node.vx *= -1;
                if (node.y < 20 || node.y > height - 20) node.vy *= -1;

                // Line to center
                ctx.beginPath();
                ctx.moveTo(centerNode.x, centerNode.y);
                ctx.lineTo(node.x, node.y);
                ctx.strokeStyle = node.id === selectedFact?.id ? 'rgba(250, 204, 21, 0.4)' : 'rgba(192, 132, 252, 0.2)';
                ctx.lineWidth = node.id === selectedFact?.id ? 1.5 : 0.8;
                ctx.stroke();

                // Draw Node Circle
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
                ctx.fillStyle = node.color;
                ctx.shadowColor = node.color;
                ctx.shadowBlur = node.id === selectedFact?.id ? 15 : 6;
                ctx.fill();
                ctx.shadowBlur = 0;
            });

            animationId = requestAnimationFrame(draw);
        };

        draw();
        return () => cancelAnimationFrame(animationId);
    }, [facts, selectedFact]);

    return (
        <div className="mt-4 p-2 sm:p-4 w-full max-w-4xl mx-auto font-sans" dir="rtl">
            <div className="relative rounded-2xl bg-gradient-to-b from-[#0e071e] via-[#090514] to-[#04020a] border border-purple-500/30 shadow-[0_0_40px_rgba(168,85,247,0.15)] overflow-hidden">
                
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-purple-500/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-purple-950/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-purple-500/20 rounded-xl border border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                            <BrainCircuit className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-base text-white">كوكبة الذاكرة المعرفية (Active Knowledge Constellation)</h3>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                    ربط حقيقي بـ IndexedDB
                                </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">شبكة الروابط والذكريات المخزنة محلياً في جهازك بدون خوادم خارجية</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsAdding(!isAdding)}
                            className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>تثبيت حقيقة جديدة</span>
                        </button>
                    </div>
                </div>

                {/* Add Form if active */}
                {isAdding && (
                    <div className="p-3 sm:p-4 bg-purple-950/40 border-b border-purple-500/20 flex flex-col sm:flex-row gap-2">
                        <input
                            type="text"
                            value={newFactText}
                            onChange={(e) => setNewFactText(e.target.value)}
                            placeholder="اكتب حقيقة أو معلومة هامة ليتذكرها الظل عنك دائماً..."
                            className="flex-1 bg-black/60 border border-purple-500/30 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 outline-none"
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAddMemory(); }}
                        />
                        <button
                            onClick={handleAddMemory}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                            <Check className="w-3.5 h-3.5" />
                            <span>حفظ بالذاكرة</span>
                        </button>
                    </div>
                )}

                {/* Canvas & List Split */}
                <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
                    
                    {/* Visual Constellation Canvas */}
                    <div className="lg:col-span-5 flex flex-col items-center justify-center bg-black/50 border border-white/5 rounded-xl p-2 relative overflow-hidden">
                        <div className="text-[10px] text-gray-400 absolute top-2 right-2 font-mono flex items-center gap-1">
                            <Database className="w-3 h-3 text-purple-400" />
                            <span>{facts.length} عُقد متصلة</span>
                        </div>
                        <canvas ref={canvasRef} className="w-full h-[200px] block" />
                    </div>

                    {/* Facts List & Inspector */}
                    <div className="lg:col-span-7 flex flex-col gap-2">
                        <div className="relative mb-1">
                            <Search className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="بحث في ذاكرة الظل المخزنة..."
                                className="w-full bg-white/5 border border-white/10 rounded-lg pr-8 pl-3 py-1.5 text-xs text-white placeholder-gray-500 outline-none"
                            />
                        </div>

                        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                            {filteredFacts.map((fact) => {
                                const isSelected = selectedFact?.id === fact.id;
                                return (
                                    <div
                                        key={fact.id}
                                        onClick={() => setSelectedFact(fact)}
                                        className={`p-3 rounded-xl border transition-all cursor-pointer flex justify-between items-start gap-2 ${
                                            isSelected
                                                ? 'bg-purple-500/20 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                                                : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]'
                                        }`}
                                    >
                                        <div className="flex-1">
                                            <p className="text-xs text-gray-200 leading-relaxed font-sans">{fact.fact}</p>
                                        </div>
                                        {fact.category && (
                                            <span className="text-[10px] font-bold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded border border-purple-500/30 whitespace-nowrap shrink-0 flex items-center gap-1">
                                                <Tag className="w-2.5 h-2.5" />
                                                {fact.category}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
};
