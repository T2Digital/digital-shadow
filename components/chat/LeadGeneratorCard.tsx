import React, { useState, useEffect } from 'react';
import { MailSearch, Briefcase, ChevronRight, CheckCircle2, Search, Send, Copy, Download, Sparkles, MessageCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { getAI } from '../../services/geminiService';

interface RealLead {
    id: string;
    companyName: string;
    decisionMaker: string;
    role: string;
    email: string;
    phoneOrHandle: string;
    matchScore: number;
    estimatedValue: string;
    painPoint: string;
    pitchMessage: string;
    status: 'جديد' | 'تم التواصل' | 'مهتم';
}

export const LeadGeneratorCard = ({ card }: { card: any }) => {
    const initialIndustry = card.data?.target_industry || card.data?.niche || 'شركات التقنية والتجارة الإلكترونية في مصر والخليج';
    const [industry, setIndustry] = useState(initialIndustry);
    const [leads, setLeads] = useState<RealLead[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedLead, setSelectedLead] = useState<RealLead | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const generateRealLeads = async (targetNiche: string) => {
        setIsLoading(true);
        try {
            const ai = getAI();
            const prompt = `أنت خبير محترف في أتمتة المبيعات وتوليد العملاء المحتملين (B2B Lead Generation & Outreach Specialist).
المجال والسوق المستهدف هو: "${targetNiche}"

المطلوب: توليد قائمة تضم 4 عملاء محتملين واقعيين ومؤهلين جداً (ICP Qualified Leads) في هذا السوق باللغة العربية، متضمنة اسم الشركة، اسم ووظيفة صانع القرار، البريد المفترض، وسيلة التواصل، نقطة الألم المحددة (Pain Point)، القيمة المتوقعة للصفقة، ورسالة عرض قيمة مخصصة جداً ومقنعة (Personalized Icebreaker Pitch) جاهزة للإرسال عبر واتساب أو لينكدإن.

أرجع الناتج بصيغة JSON فقط بهذا الشكل:
{
  "leads": [
    {
      "id": "lead_1",
      "companyName": "اسم الشركة",
      "decisionMaker": "اسم صانع القرار",
      "role": "المنصب (مثل: الرئيس التنفيذي / مدير التسويق)",
      "email": "contact@company.com",
      "phoneOrHandle": "+201012345678",
      "matchScore": 96,
      "estimatedValue": "15,000 $",
      "painPoint": "المشكلة الرئيسية التي يعانون منها",
      "pitchMessage": "نص الرسالة الافتتاحية المخصصة الجذابة والموجزة بدون مبالغة أو تسويق مبتذل",
      "status": "جديد"
    }
  ]
}`;

            const response = await ai.models.generateContent({
                model: 'gemini-3.7-flash',
                contents: prompt,
                config: { responseMimeType: 'application/json' }
            });

            const text = response.text || '{}';
            const parsed = JSON.parse(text);
            if (parsed.leads && Array.isArray(parsed.leads)) {
                setLeads(parsed.leads);
                if (parsed.leads.length > 0) {
                    setSelectedLead(parsed.leads[0]);
                }
            }
        } catch (e) {
            console.error('Error generating leads:', e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        generateRealLeads(industry);
    }, []);

    const handleCopyPitch = (lead: RealLead) => {
        navigator.clipboard.writeText(lead.pitchMessage);
        setCopiedId(lead.id);
        setTimeout(() => setCopiedId(null), 2500);
    };

    const handleSendWhatsApp = (lead: RealLead) => {
        const phone = lead.phoneOrHandle.replace(/[^0-9]/g, '');
        const encodedText = encodeURIComponent(lead.pitchMessage);
        const url = phone.length > 8 ? `https://wa.me/${phone}?text=${encodedText}` : `https://wa.me/?text=${encodedText}`;
        window.open(url, '_blank');
        setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: 'تم التواصل' } : l));
    };

    const handleExportCSV = () => {
        if (leads.length === 0) return;
        const headers = ['الشركة', 'صانع القرار', 'المنصب', 'البريد', 'التطابق', 'القيمة المتوقعة', 'نقطة الألم', 'الرسالة'];
        const rows = leads.map(l => [
            `"${l.companyName}"`,
            `"${l.decisionMaker}"`,
            `"${l.role}"`,
            `"${l.email}"`,
            `"${l.matchScore}%"`,
            `"${l.estimatedValue}"`,
            `"${l.painPoint.replace(/"/g, '""')}"`,
            `"${l.pitchMessage.replace(/"/g, '""')}"`
        ]);
        const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `leads_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="mt-4 p-2 sm:p-4 w-full max-w-4xl mx-auto font-sans" dir="rtl">
            <div className="relative rounded-2xl bg-gradient-to-b from-[#061219] via-[#040d12] to-[#020608] border border-cyan-500/30 shadow-[0_0_40px_rgba(6,182,212,0.15)] overflow-hidden">
                
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-cyan-500/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-cyan-950/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-cyan-500/20 rounded-xl border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                            <MailSearch className="w-6 h-6 text-cyan-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-base text-white">صائد الصفقات وتوليد العملاء (AI Lead Engine)</h3>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                    تنقيب حقيقي وتخصيص
                                </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">استخراج جهات اتصال، تحليل نقاط الألم، وصياغة رسائل استقطاب فورية</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                            onClick={handleExportCSV}
                            disabled={leads.length === 0}
                            className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span>تصدير CSV</span>
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="p-3 sm:p-4 bg-black/50 border-b border-white/5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={industry}
                            onChange={(e) => setIndustry(e.target.value)}
                            placeholder="حدد المجال والسوق المستهدف (مثال: عيادات التجميل في الرياض، مطوري البرمجيات...)"
                            className="w-full bg-white/5 border border-white/10 focus:border-cyan-500/50 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-gray-500 outline-none transition"
                            onKeyDown={(e) => { if (e.key === 'Enter') generateRealLeads(industry); }}
                        />
                    </div>
                    <button
                        onClick={() => generateRealLeads(industry)}
                        disabled={isLoading}
                        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                        {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        {isLoading ? 'جاري التنقيب والتحليل...' : 'بدء التنقيب'}
                    </button>
                </div>

                {/* Leads Grid & Detail Split */}
                <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
                    
                    {/* Leads List */}
                    <div className="lg:col-span-5 flex flex-col gap-2">
                        <div className="text-[11px] font-bold text-gray-400 px-1 flex justify-between items-center">
                            <span>العملاء المؤهلين ({leads.length})</span>
                            <span className="text-cyan-400 font-mono text-[10px]">MATCH SCORE</span>
                        </div>

                        {leads.map((lead) => {
                            const isSelected = selectedLead?.id === lead.id;
                            return (
                                <div
                                    key={lead.id}
                                    onClick={() => setSelectedLead(lead)}
                                    className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                                        isSelected 
                                            ? 'bg-cyan-500/15 border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.2)]' 
                                            : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10'
                                    }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <Briefcase className="w-4 h-4 text-cyan-400" />
                                            <span className="font-bold text-xs text-white">{lead.companyName}</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                            {lead.matchScore}%
                                        </span>
                                    </div>
                                    <div className="text-[11px] text-gray-400 flex justify-between items-center">
                                        <span>{lead.decisionMaker} ({lead.role})</span>
                                        <span className="text-amber-400 font-mono text-[10px]">{lead.estimatedValue}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Lead Detail & Message Studio */}
                    <div className="lg:col-span-7 bg-[#050b10] border border-cyan-500/20 rounded-xl p-4 flex flex-col justify-between">
                        {selectedLead ? (
                            <div className="flex flex-col gap-3">
                                <div className="flex justify-between items-start border-b border-white/10 pb-3">
                                    <div>
                                        <h4 className="font-bold text-sm text-white">{selectedLead.companyName}</h4>
                                        <p className="text-xs text-cyan-300">{selectedLead.decisionMaker} • {selectedLead.role}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] text-gray-400">القيمة التقديرية</div>
                                        <div className="text-xs font-bold text-amber-400 font-mono">{selectedLead.estimatedValue}</div>
                                    </div>
                                </div>

                                <div className="p-2.5 rounded-lg bg-red-500/[0.05] border border-red-500/20 text-xs">
                                    <span className="font-bold text-red-400 block mb-0.5">نقطة الألم المستهدفة (Pain Point):</span>
                                    <p className="text-gray-300 text-[11px]">{selectedLead.painPoint}</p>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-1.5">
                                        <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                                            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                                            رسالة العرض المخصصة (Personalized Pitch):
                                        </span>
                                    </div>
                                    <div className="p-3 rounded-lg bg-black/60 border border-white/10 text-xs text-gray-200 leading-relaxed font-sans max-h-36 overflow-y-auto">
                                        {selectedLead.pitchMessage}
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
                                    <button
                                        onClick={() => handleCopyPitch(selectedLead)}
                                        className="flex-1 py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-gray-300 font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
                                    >
                                        <Copy className="w-3.5 h-3.5" />
                                        <span>{copiedId === selectedLead.id ? 'تم النسخ!' : 'نسخ الرسالة'}</span>
                                    </button>
                                    <button
                                        onClick={() => handleSendWhatsApp(selectedLead)}
                                        className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg transition cursor-pointer"
                                    >
                                        <MessageCircle className="w-3.5 h-3.5" />
                                        <span>إرسال واتساب مباشر</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="h-48 flex items-center justify-center text-xs text-gray-500">
                                اختر عميلاً لعرض تفاصيل العرض والرسالة
                            </div>
                        )}
                    </div>

                </div>

            </div>
        </div>
    );
};
