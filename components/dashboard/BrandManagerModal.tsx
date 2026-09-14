import React, { useState, useEffect } from 'react';
import { X, Briefcase, Plus, Save, Trash2 } from 'lucide-react';
import { UserProfile, shadowDB } from '../../services/dbService';

export const BrandManagerModal: React.FC<{ user: UserProfile, onClose: () => void }> = ({ user, onClose }) => {
    const [brands, setBrands] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBrand, setSelectedBrand] = useState<any | null>(null);

    const [formName, setFormName] = useState('');
    const [formTone, setFormTone] = useState('');
    const [formVisuals, setFormVisuals] = useState('');
    const [formStrategy, setFormStrategy] = useState('');
    const [formCompetitors, setFormCompetitors] = useState('');

    useEffect(() => {
        loadBrands();
    }, []);

    const loadBrands = async () => {
        setLoading(true);
        const userId = user.email || 'GUEST';
        const items = await shadowDB.getFSItemsByUserId(userId);
        const brandItems = items.filter(i => i.type === 'brand');
        setBrands(brandItems);
        setLoading(false);
    };

    const handleSelectBrand = (b: any) => {
        setSelectedBrand(b);
        const data = JSON.parse(b.content || '{}');
        setFormName(data.profile_name || b.name);
        setFormTone(data.tone_of_voice || '');
        setFormVisuals(data.visual_guidelines || '');
        setFormStrategy(data.strategy || '');
        setFormCompetitors(data.competitors || '');
    };

    const handleNewBrand = () => {
        setSelectedBrand(null);
        setFormName('');
        setFormTone('');
        setFormVisuals('');
        setFormStrategy('');
        setFormCompetitors('');
    };

    const handleSave = async () => {
        if (!formName) return;
        const userId = user.email || 'GUEST';
        const data = {
            profile_name: formName,
            tone_of_voice: formTone,
            visual_guidelines: formVisuals,
            strategy: formStrategy,
            competitors: formCompetitors
        };

        if (selectedBrand) {
            await shadowDB.updateFSItem(selectedBrand.id, {
                name: formName,
                content: JSON.stringify(data),
                l0_summary: `${formTone || ''} ${formStrategy || ''}`.substring(0, 100)
            });
        } else {
            const brandId = (formName || '').toLowerCase().replace(/\s+/g, '_');
            await shadowDB.createFSItem({
                userId,
                parentId: null,
                name: formName,
                type: 'brand',
                content: JSON.stringify(data),
                l1_metadata: JSON.stringify({ brandId }),
                l0_summary: `${formTone || ''} ${formStrategy || ''}`.substring(0, 100),
                createdAt: Date.now()
            });
        }
        await loadBrands();
        handleNewBrand();
    };

    const handleDelete = async (id: any) => {
        await shadowDB.deleteFSItem(id);
        if (selectedBrand?.id === id) handleNewBrand();
        await loadBrands();
    };

    return (
        <div className="fixed inset-0 z-[600] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in" dir="rtl">
            <div className="bg-[#111] border border-pink-500/20 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-[0_0_50px_rgba(236,72,153,0.1)] relative overflow-hidden font-['Cairo']">
                <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#0a0a0a]">
                    <div className="flex items-center gap-3">
                         <div className="p-2 bg-pink-500/20 rounded-lg border border-pink-500/30">
                            <Briefcase className="w-5 h-5 text-pink-400" />
                        </div>
                        <h2 className="text-lg font-black text-white">إدارة العلامات التجارية (Brand Vaults)</h2>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/50 hover:text-white transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* Sidebar */}
                    <div className="w-full md:w-1/3 border-l border-white/5 bg-[#0d0d0d] flex flex-col h-full">
                        <div className="p-4 border-b border-white/5">
                            <button 
                                onClick={handleNewBrand}
                                className="w-full py-3 bg-pink-600 hover:bg-pink-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-pink-900/20 transition-all"
                            >
                                <Plus className="w-4 h-4" /> براند جديد
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {loading ? (
                                <div className="text-center text-white/40 text-sm py-4">جاري التحميل...</div>
                            ) : brands.length === 0 ? (
                                <div className="text-center text-white/40 text-sm py-8">لا يوجد براندات مسجلة بعد.</div>
                            ) : (
                                brands.map(b => (
                                    <div 
                                        key={b.id} 
                                        onClick={() => handleSelectBrand(b)}
                                        className={`p-3 rounded-xl cursor-pointer border transition-all ${selectedBrand?.id === b.id ? 'bg-pink-500/20 border-pink-500/50' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-sm font-bold text-white truncate">{b.name}</h3>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleDelete(b.id); }}
                                                className="text-red-500/50 hover:text-red-500"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Editor Form */}
                    <div className="flex-1 bg-[#111] overflow-y-auto p-6">
                        <h3 className="text-white font-black text-xl mb-6 flex items-center gap-2">
                            {selectedBrand ? 'تعديل البراند الواقف' : 'إضافة براند جديد السرب هيشتغل بيه'} 
                        </h3>
                        
                        <div className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-white/50 mb-2 uppercase tracking-wide">Brand Name (اسم البراند)</label>
                                <input 
                                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-pink-500/50 outline-none"
                                    value={formName} onChange={e => setFormName(e.target.value)} placeholder="مثال: متجر السعادة"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-white/50 mb-2 uppercase tracking-wide">Tone of Voice (نبرة الصوت)</label>
                                <textarea 
                                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-pink-500/50 outline-none h-24 resize-none"
                                    value={formTone} onChange={e => setFormTone(e.target.value)} placeholder="مثال: ودود، حماسي، يستخدم إيموجي كثير، يتحدث بلغة الشباب..."
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-white/50 mb-2 uppercase tracking-wide">Visual Guidelines & Colors (الهوية البصرية والألوان)</label>
                                <textarea 
                                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-pink-500/50 outline-none h-24 resize-none"
                                    value={formVisuals} onChange={e => setFormVisuals(e.target.value)} placeholder="مثال: الألوان الأساسية #FF0055 و #111111، الستايل مودرن ومينيماليست..."
                                />
                                <p className="text-[10px] text-pink-400 mt-1">دي الألوان اللي الظل (Gemini/Fal.ai) هيستخدمها تلقائي في أي بوست أو ديزاين يطلعه للبراند ده.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-white/50 mb-2 uppercase tracking-wide">Strategy (الاستراتيجية)</label>
                                    <textarea 
                                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-pink-500/50 outline-none h-24 resize-none"
                                        value={formStrategy} onChange={e => setFormStrategy(e.target.value)} placeholder="الجمهور المستهدف والقيمة المقدمة..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-white/50 mb-2 uppercase tracking-wide">Competitors (المنافسون)</label>
                                    <textarea 
                                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-pink-500/50 outline-none h-24 resize-none"
                                        value={formCompetitors} onChange={e => setFormCompetitors(e.target.value)} placeholder="أهم المنافسين في السوق..."
                                    />
                                </div>
                            </div>

                            <div className="pt-4">
                                <button 
                                    onClick={handleSave}
                                    className="px-8 py-3 bg-white text-black hover:bg-gray-200 rounded-xl font-black flex items-center justify-center gap-2 shadow-lg transition-all w-full md:w-auto"
                                >
                                    <Save className="w-5 h-5" /> حفظ في ذاكرة الظل الدائمة
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
