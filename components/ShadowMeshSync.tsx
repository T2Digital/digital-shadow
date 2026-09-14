import React, { useState, useEffect } from 'react';
import { Network, Zap, X, QrCode, Smartphone, Users, RefreshCcw } from 'lucide-react';

export const ShadowMeshSync: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [scanMode, setScanMode] = useState(false);
    const [peers, setPeers] = useState<{ id: string, name: string, status: string, conn?: any }[]>([]);
    const [syncProgress, setSyncProgress] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);
    const [localId] = useState(() => Math.random().toString(36).substring(7));
    const [receivedData, setReceivedData] = useState<string[]>([]);
    
    // WebRTC Real Implementation Outline
    const [pc, setPc] = useState<RTCPeerConnection | null>(null);

    useEffect(() => {
        if (scanMode) {
            // Setup WebRTC local info
            const newPc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
            setPc(newPc);
            
            // In a real P2P Mesh, you need a signaling server. 
            // Because we don't have one, we simulate the discovery of peers via BroadcastChannel (works between tabs/windows perfectly as a local Mesh)
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
    }, [scanMode, localId]);

    const startSync = (id: string) => {
        setIsSyncing(true);
        setSyncProgress(0);
        
        // Real Sync via BroadcastChannel (representing WebRTC datachannel locally)
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

    return (
        <div className="fixed inset-0 z-[600] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in" dir="rtl">
            <div className="bg-[#111] border border-blue-500/30 rounded-2xl w-full max-w-lg flex flex-col shadow-[0_0_50px_rgba(59,130,246,0.15)] relative overflow-hidden font-['Cairo']">
                
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-blue-500/10 bg-[#0a0a0a]">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-500/30">
                            <Network className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white">شبكة الظلال المترابطة (Mesh)</h2>
                            <p className="text-[10px] text-blue-300 mt-1 uppercase tracking-widest text-left">P2P Offline Sync</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/50 hover:text-white transition-all">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    <p className="text-sm text-white/70 leading-relaxed text-justify">
                        يتيح هذا الوضع للظلال المعرفية بالتواصل وتبادل الذكريات والبيانات الحساسة بشكل مباشر بين الأجهزة (من ند لند) عبر شبكة الوايفاي المحلية أو البلوتوث، بعيداً عن السيرفرات المركزية.
                    </p>

                    {!scanMode ? (
                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => setScanMode(true)}
                                className="bg-blue-600/20 border border-blue-500/30 hover:bg-blue-600/30 text-blue-400 p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all shadow-inner"
                            >
                                <RefreshCcw className="w-8 h-8" />
                                <span className="font-bold text-sm">البحث عن ظلال قريبة</span>
                            </button>
                            <button className="bg-white/5 border border-white/10 hover:bg-white/10 text-white/50 p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all">
                                <QrCode className="w-8 h-8" />
                                <span className="font-bold text-sm">عرض كود الربط</span>
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/20 mb-4 text-xs">
                                <strong className="text-blue-400 block mb-1">المعرف الخاص بك (Local ID):</strong>
                                <span className="font-mono text-white/80">{localId}</span>
                            </div>

                            <div className="flex items-center justify-between text-blue-400 font-bold mb-4">
                                <span className="flex items-center gap-2"><RefreshCcw className="w-4 h-4 animate-spin" /> جاري فحص المحيط...</span>
                                <span className="text-xs bg-blue-500/20 px-2 py-1 rounded">WebRTC P2P</span>
                            </div>

                            {peers.length === 0 && (
                                <div className="text-center text-white/50 text-sm py-4 border border-dashed border-white/10 rounded-xl">
                                    لا يوجد ظلال قريبة. افتح التطبيق في نافذة أخرى أو متصفح آخر لاختبار المزامنة.
                                </div>
                            )}

                            {peers.map(p => (
                                <div key={p.id} className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400">
                                            <Smartphone className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="text-white font-bold">{p.name}</div>
                                            <div className="text-xs text-white/40">{p.status}</div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => startSync(p.id)}
                                        disabled={isSyncing || p.status.includes('متزامن')}
                                        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-[0_0_10px_rgba(59,130,246,0.3)] transition-all"
                                    >
                                        {p.status.includes('متزامن') ? <Zap className="w-4 h-4 text-yellow-400" /> : <Users className="w-4 h-4" />}
                                        {p.status.includes('متزامن') ? 'اكتملت المزامنة' : 'مزامنة المعرفة'}
                                    </button>
                                </div>
                            ))}

                            {isSyncing && (
                                <div className="mt-4 pt-4 border-t border-white/5">
                                    <div className="flex justify-between text-xs text-blue-400 mb-2">
                                        <span>جاري نقل المشابك العصبية والذكريات...</span>
                                        <span>{syncProgress}%</span>
                                    </div>
                                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 transition-all duration-150" style={{ width: `${syncProgress}%` }} />
                                    </div>
                                </div>
                            )}
                            {receivedData.length > 0 && (
                                <div className="mt-6 pt-4 border-t border-white/10">
                                    <h4 className="text-yellow-400 font-bold mb-2 text-sm flex items-center gap-2">
                                        <Zap className="w-4 h-4" /> بيانات واردة عبر شبكة الظلال:
                                    </h4>
                                    <div className="bg-black/50 p-3 rounded-lg text-xs font-mono text-white/70 h-32 overflow-y-auto">
                                        {receivedData.map((data, i) => (
                                            <div key={i} className="mb-1 text-emerald-400">&gt; {data}</div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
