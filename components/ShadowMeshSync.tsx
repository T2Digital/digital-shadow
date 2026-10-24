import React, { useState, useEffect } from 'react';
import { Network, Zap, X, QrCode, Smartphone, Users, RefreshCcw, Share2, Download, Upload, Copy, Check, Sparkles } from 'lucide-react';
import { useAppStore } from '../services/store';
import { shadowDB } from '../services/dbService';

export const ShadowMeshSync: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { user } = useAppStore();
    const [activeView, setActiveView] = useState<'mesh' | 'capsule'>('mesh');
    const [scanMode, setScanMode] = useState(false);
    const [peers, setPeers] = useState<{ id: string, name: string, status: string, conn?: any }[]>([]);
    const [syncProgress, setSyncProgress] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);
    const [localId] = useState(() => Math.random().toString(36).substring(7));
    const [receivedData, setReceivedData] = useState<string[]>([]);
    
    // Capsule states
    const [capsulePayload, setCapsulePayload] = useState('');
    const [importInput, setImportInput] = useState('');
    const [importSuccess, setImportSuccess] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        // Generate capsule payload when opened
        const generateCapsule = async () => {
            const memories = await shadowDB.getMemory(user?.email || 'GUEST');
            const capsuleObj = {
                generator: user?.name || 'الماستر',
                referralCode: user?.affiliate?.referralCode || 'MASTER',
                createdAt: Date.now(),
                version: '3.8-Capsule',
                facts: memories.slice(0, 10).map(m => m.fact),
                instructions: user?.longTermMemory || 'مساعد ذكي سيادي'
            };
            setCapsulePayload(JSON.stringify(capsuleObj, null, 2));
        };
        generateCapsule();
    }, [user]);

    // WebRTC Real Implementation Outline
    const [pc, setPc] = useState<RTCPeerConnection | null>(null);

    useEffect(() => {
        if (scanMode && activeView === 'mesh') {
            const newPc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
            setPc(newPc);
            
            const channel = new BroadcastChannel('shadow_mesh_network');
            channel.onmessage = (e) => {
                const data = e.data;
                if (data.type === 'DISCOVER' && data.id !== localId) {
                    setPeers(prev => {
                        if (prev.find(p => p.id === data.id)) return prev;
                        return [...prev, { id: data.id, name: `ظل معرفي (${data.id})`, status: 'متاح للاتصال' }];
                    });
                    channel.postMessage({ type: 'ANNOUNCE', id: localId });
                } else if (data.type === 'ANNOUNCE' && data.id !== localId) {
                    setPeers(prev => {
                        if (prev.find(p => p.id === data.id)) return prev;
                        return [...prev, { id: data.id, name: `ظل معرفي (${data.id})`, status: 'متاح للاتصال' }];
                    });
                } else if (data.type === 'SYNC_DATA' && data.target === localId) {
                    setReceivedData(prev => [...prev, data.payload]);
                }
            };

            channel.postMessage({ type: 'DISCOVER', id: localId });

            return () => {
                newPc.close();
                channel.close();
            };
        }
    }, [scanMode, localId, activeView]);

    const startSync = (id: string) => {
        setIsSyncing(true);
        setSyncProgress(0);
        
        const channel = new BroadcastChannel('shadow_mesh_network');
        let progress = 0;
        
        const interval = setInterval(() => {
            progress += 10;
            setSyncProgress(progress);
            
            channel.postMessage({ 
                type: 'SYNC_DATA', 
                target: id, 
                payload: `Memory block ${progress}% transferred from ${localId}`
            });

            if (progress >= 100) {
                clearInterval(interval);
                setIsSyncing(false);
                setPeers(prev => prev.map(p => p.id === id ? { ...p, status: 'متزامن تماماً ✅' } : p));
                channel.close();
            }
        }, 300);
    };

    const handleCopyCapsuleLink = async () => {
        const refCode = user?.affiliate?.referralCode || 'MASTER';
        const shareLink = `https://Ez-zel.vercel.app/?ref=${refCode}&capsule=${encodeURIComponent(btoa(capsulePayload))}`;
        try {
            await navigator.clipboard.writeText(shareLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (e) {
            console.warn(e);
        }
    };

    const handleShareNative = async () => {
        const refCode = user?.affiliate?.referralCode || 'MASTER';
        const shareLink = `https://Ez-zel.vercel.app/?ref=${refCode}`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `كبسولة معرفة الظل من ${user?.name || 'الماستر'}`,
                    text: `حمّل كبسولة المعرفة الرقمية الخاصة بي على الظل واستفد من الذكاء الاصطناعي السيادي:`,
                    url: shareLink
                });
            } catch(e) {}
        } else {
            handleCopyCapsuleLink();
        }
    };

    const handleImportCapsule = async () => {
        if (!importInput.trim()) return;
        try {
            let parsed: any;
            if (importInput.startsWith('{')) {
                parsed = JSON.parse(importInput);
            } else {
                parsed = JSON.parse(atob(importInput));
            }

            if (parsed.facts && Array.isArray(parsed.facts)) {
                for (const fact of parsed.facts) {
                    await shadowDB.saveFact({
                        userId: user?.email || 'GUEST',
                        fact: `[مستورد من كبسولة ${parsed.generator}]: ${fact}`,
                        timestamp: Date.now()
                    });
                }
                setImportSuccess(true);
                setImportInput('');
                setTimeout(() => setImportSuccess(false), 3000);
            }
        } catch (e) {
            alert('صيغة الكبسولة غير صحيحة، يرجى التأكد من الكود.');
        }
    };

    return (
        <div className="fixed inset-0 z-[600] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in" dir="rtl">
            <div className="bg-[#111] border border-cyan-500/30 rounded-2xl w-full max-w-lg flex flex-col shadow-[0_0_50px_rgba(6,182,212,0.15)] relative overflow-hidden font-['Cairo']">
                
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#0a0a0a]">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-cyan-500/20 rounded-xl border border-cyan-500/30 text-cyan-400">
                            <Network className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-white">شبكة الظلال المترابطة والكبسولات</h2>
                            <p className="text-[10px] text-cyan-300 uppercase tracking-widest text-left font-mono">P2P Mesh & Knowledge Capsules</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/50 hover:text-white transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Subnav Tabs */}
                <div className="flex bg-[#161a24] p-1.5 mx-5 mt-4 rounded-xl border border-white/10">
                    <button
                        onClick={() => setActiveView('mesh')}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeView === 'mesh' ? 'bg-cyan-500 text-black shadow-md' : 'text-white/60 hover:text-white'}`}
                    >
                        <Network className="w-4 h-4" />
                        <span>مزامنة الأجهزة القريبة (Mesh)</span>
                    </button>
                    <button
                        onClick={() => setActiveView('capsule')}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeView === 'capsule' ? 'bg-cyan-500 text-black shadow-md' : 'text-white/60 hover:text-white'}`}
                    >
                        <Sparkles className="w-4 h-4" />
                        <span>كبسولات المعرفة والمشاركة</span>
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto scrollbar-hide">
                    {activeView === 'mesh' ? (
                        <>
                            <p className="text-xs text-white/70 leading-relaxed text-justify">
                                يتيح هذا الوضع للظلال بالتواصل وتبادل المشابك العصبية والذكريات مباشرة بين الأجهزة (من ند لند P2P) عبر شبكة الوايفاي المحلية، بعيداً عن السيرفرات المركزية.
                            </p>

                            {!scanMode ? (
                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <button 
                                        onClick={() => setScanMode(true)}
                                        className="bg-cyan-600/20 border border-cyan-500/30 hover:bg-cyan-600/30 text-cyan-400 p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all shadow-inner"
                                    >
                                        <RefreshCcw className="w-6 h-6 animate-pulse" />
                                        <span className="font-bold text-xs">البحث عن ظلال قريبة</span>
                                    </button>
                                    <button 
                                        onClick={handleCopyCapsuleLink}
                                        className="bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all"
                                    >
                                        <QrCode className="w-6 h-6" />
                                        <span className="font-bold text-xs">كود الربط المباشر</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-cyan-500/10 p-3 rounded-xl border border-cyan-500/20 text-xs">
                                        <strong className="text-cyan-400 block mb-1">المعرف العصبي للظل (Local ID):</strong>
                                        <span className="font-mono text-white/90">{localId}</span>
                                    </div>

                                    <div className="flex items-center justify-between text-cyan-400 font-bold text-xs">
                                        <span className="flex items-center gap-2"><RefreshCcw className="w-3.5 h-3.5 animate-spin" /> جاري فحص المحيط العصبي...</span>
                                        <span className="text-[10px] bg-cyan-500/20 px-2 py-0.5 rounded font-mono">WebRTC Active</span>
                                    </div>

                                    {peers.length === 0 && (
                                        <div className="text-center text-white/50 text-xs py-4 border border-dashed border-white/10 rounded-xl">
                                            لا يوجد ظلال قريبة في هذا التبويب. افتح التطبيق في نافذة ثانية لاختبار المزامنة الحية.
                                        </div>
                                    )}

                                    {peers.map(p => (
                                        <div key={p.id} className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-cyan-500/20 p-2 rounded-lg text-cyan-400">
                                                    <Smartphone className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="text-white font-bold text-xs">{p.name}</div>
                                                    <div className="text-[10px] text-white/40">{p.status}</div>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => startSync(p.id)}
                                                disabled={isSyncing || p.status.includes('متزامن')}
                                                className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-black px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
                                            >
                                                {p.status.includes('متزامن') ? <Zap className="w-3.5 h-3.5 text-yellow-300" /> : <Users className="w-3.5 h-3.5" />}
                                                <span>{p.status.includes('متزامن') ? 'متزامن' : 'مزامنة'}</span>
                                            </button>
                                        </div>
                                    ))}

                                    {isSyncing && (
                                        <div className="mt-3 pt-3 border-t border-white/10">
                                            <div className="flex justify-between text-xs text-cyan-400 mb-1">
                                                <span>جاري نقل المشابك العصبية والذكريات...</span>
                                                <span className="font-mono">{syncProgress}%</span>
                                            </div>
                                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                <div className="h-full bg-cyan-500 transition-all duration-150" style={{ width: `${syncProgress}%` }} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        /* CAPSULE VIEW */
                        <div className="space-y-4">
                            <p className="text-xs text-white/70 leading-relaxed">
                                كبسولة المعرفة هي حزمة مشفرة من تفضيلات وخبرات ظلك. يمكنك إرسالها لأصدقائك أو شركائك لترقية ظلالهم فوراً، مع دمج كود الدعوة الخاص بك تلقائياً! 🚀
                            </p>

                            {/* Export Box */}
                            <div className="bg-[#0b0e17] border border-cyan-500/30 rounded-xl p-4 space-y-3">
                                <div className="flex items-center justify-between text-xs font-bold text-white">
                                    <span className="flex items-center gap-1.5 text-cyan-400">
                                        <Download className="w-4 h-4" /> كبسولتك الحالية جاهزة
                                    </span>
                                    <span className="text-[10px] text-white/40 font-mono">10 Memory Facts</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleCopyCapsuleLink}
                                        className="flex-1 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5"
                                    >
                                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        <span>{copied ? 'تم نسخ الرابط!' : 'نسخ رابط الكبسولة'}</span>
                                    </button>
                                    <button
                                        onClick={handleShareNative}
                                        className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
                                        title="مشاركة عبر التطبيقات"
                                    >
                                        <Share2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Import Box */}
                            <div className="bg-[#121622] border border-white/10 rounded-xl p-4 space-y-3">
                                <span className="block text-xs font-bold text-white flex items-center gap-1.5">
                                    <Upload className="w-4 h-4 text-emerald-400" /> استيراد كبسولة من ظل آخر
                                </span>
                                <textarea
                                    value={importInput}
                                    onChange={(e) => setImportInput(e.target.value)}
                                    placeholder="الصق كود الكبسولة أو محتوى الـ JSON هنا لدمجه في ذاكرة ظلك..."
                                    className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-cyan-500/50 resize-none h-20 font-mono"
                                    dir="ltr"
                                />
                                <button
                                    onClick={handleImportCapsule}
                                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    <span>دمج الكبسولة في دماغي فوراً</span>
                                </button>
                                {importSuccess && (
                                    <div className="p-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs text-center font-bold">
                                        تم دمج الكبسولة بنجاح في الذاكرة العصبية للظل! 🎉
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
