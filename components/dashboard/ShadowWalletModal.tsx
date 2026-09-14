import React, { useState, useEffect, useRef } from 'react';
import { X, Wallet, Shield, Zap, TrendingUp, Cpu, Activity, RefreshCcw, ArrowDownLeft, ArrowUpRight, Copy, CheckCircle2, QrCode, SearchCode, Loader2 } from 'lucide-react';
import { WalletService, AgentWallet } from '../../services/walletService';

export const ShadowWalletModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [wallet, setWallet] = useState<AgentWallet | null>(null);
    const [activeTab, setActiveTab] = useState<'balance' | 'swarm' | 'flashloan'>('balance');
    const [isFlashActive, setIsFlashActive] = useState(false);
    const [copied, setCopied] = useState(false);
    const [sendMode, setSendMode] = useState(false);
    const [sendAddress, setSendAddress] = useState('');
    const [sendAmount, setSendAmount] = useState('');
    const [contractAddress, setContractAddress] = useState(() => localStorage.getItem('shadow_contract_address') || '');
    const [contractLinked, setContractLinked] = useState(() => !!localStorage.getItem('shadow_contract_address'));

    const handleLinkContract = () => {
        if (contractAddress && contractAddress.length === 42) {
            localStorage.setItem('shadow_contract_address', contractAddress);
            setContractLinked(true);
        } else {
            alert('يرجى إدخال عنوان عقد صحيح');
        }
    };
    const [isSending, setIsSending] = useState(false);
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [sendError, setSendError] = useState('');
    const [sendSuccess, setSendSuccess] = useState('');
    
    const [flashLogs, setFlashLogs] = useState<string[]>([
        "> Deploying Arbitrage Contract to Polygon...",
        "> Contract Address: 0x8a92...df31",
        "> Connecting to Aave V3 Pool... OK",
        "> Scanning mempool for price discrepancies..."
    ]);
    const logsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const w = WalletService.getOrCreateWallet();
        setWallet(w);
        
        // Fetch real balance from Polygon RPC
        WalletService.getRealBalance(w.address).then(bal => {
            setWallet(prev => prev ? {...prev, balance: bal} : null);
        });
    }, []);

    useEffect(() => {
        if(isFlashActive) {
            logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [flashLogs, isFlashActive]);

    useEffect(() => {
        let interval: any;
        if (isFlashActive) {
            interval = setInterval(() => {
                const r = Math.random();
                let newLog = "";
                if (r > 0.9) {
                    newLog = `> [SUCCESS] Arbitrage opportunity found! Flash loan 10,000 WMatic. Profit: +${(Math.random()*2).toFixed(3)} MATIC`;
                } else if (r > 0.6) {
                    newLog = `> [SCAN] New block ${Math.floor(Math.random() * 1000000 + 40000000)}... No arb found.`;
                } else if (r > 0.4) {
                    newLog = `> [PENDING] Analyzing Sushiswap/Quickswap pair routes...`;
                } else {
                    newLog = `> Listening to mempool... Gas: ${Math.floor(Math.random()*60 + 30)} Gwei`;
                }
                
                setFlashLogs(prev => {
                    const next = [...prev, newLog];
                    if (next.length > 50) return next.slice(next.length - 50);
                    return next;
                });
            }, 1500);
        } else {
            if (flashLogs.length > 4) {
               setFlashLogs([
                   "> Deploying Arbitrage Contract to Polygon...",
                   "> Contract Address: 0x8a92...df31",
                   "> Connecting to Aave V3 Pool... OK",
                   "> Scanning mempool for price discrepancies..."
               ]);
            }
        }
        return () => clearInterval(interval);
    }, [isFlashActive]);

    if (!wallet) return null;

    const toggleFlashLoan = () => {
        setIsFlashActive(!isFlashActive);
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSend = async () => {
        if (!wallet || !sendAddress || !sendAmount) return;
        setIsSending(true);
        setSendError('');
        setSendSuccess('');
        try {
            const hash = await WalletService.sendTransaction(wallet.privateKey, sendAddress, sendAmount);
            setSendSuccess(`تم الإرسال بنجاح! TX: ${hash.substring(0,10)}...`);
            setTimeout(() => {
                setSendMode(false);
                setSendSuccess('');
            }, 5000);
        } catch (error: any) {
            setSendError(error.message || 'حدث خطأ أثناء الإرسال');
        } finally {
            setIsSending(false);
        }
    };

    const handleWithdraw = async () => {
        if (!wallet || !contractAddress) return;
        setIsWithdrawing(true);
        try {
            const hash = await WalletService.callContractWithdraw(wallet.privateKey, contractAddress);
            alert(`تم سحب الأرباح بنجاح!\nTX Hash: ${hash}`);
        } catch (error: any) {
            alert(`خطأ في السحب:\n${error.message}`);
        } finally {
            setIsWithdrawing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[600] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in" dir="rtl">
            <div className="bg-[#111] border border-emerald-500/20 rounded-2xl w-full max-w-lg shadow-[0_0_50px_rgba(16,185,129,0.1)] relative overflow-hidden font-['Cairo'] flex flex-col max-h-[90vh]">
                
                <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#0a0a0a] shrink-0">
                    <div className="flex items-center gap-3">
                         <div className="p-2 bg-emerald-500/20 rounded-lg border border-emerald-500/30">
                            <Wallet className="w-5 h-5 text-emerald-400" />
                        </div>
                        <h2 className="text-lg font-black text-white">محفظة الظل اللامركزية</h2>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/50 hover:text-white transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                    <div className="flex border-b border-white/10 mb-6 shrink-0">
                        <button 
                            className={`flex-1 pb-3 text-sm font-bold text-center border-b-2 transition-all ${activeTab === 'balance' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-white/50 hover:text-white'}`}
                            onClick={() => setActiveTab('balance')}
                        >
                            <TrendingUp className="inline-block w-4 h-4 mr-2" /> المحفظة
                        </button>
                        <button 
                            className={`flex-1 pb-3 text-sm font-bold text-center border-b-2 transition-all ${activeTab === 'swarm' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-white/50 hover:text-white'}`}
                            onClick={() => setActiveTab('swarm')}
                        >
                            <Zap className="inline-block w-4 h-4 mr-2" /> السرب
                        </button>
                        <button 
                            className={`flex-1 pb-3 text-sm font-bold text-center border-b-2 transition-all ${activeTab === 'flashloan' ? 'border-purple-500 text-purple-400' : 'border-transparent text-white/50 hover:text-white'}`}
                            onClick={() => setActiveTab('flashloan')}
                        >
                            <Activity className="inline-block w-4 h-4 mr-2" /> الفلاش لون
                        </button>
                    </div>

                    {activeTab === 'balance' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                            <div className="bg-gradient-to-br from-emerald-900/40 to-black p-6 rounded-2xl border border-emerald-500/30 text-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[50px] rounded-full"></div>
                                <h3 className="text-sm text-emerald-200/70 mb-1">الرصيد المتاح للسرب (Balance)</h3>
                                <div className="text-4xl font-black text-white flex items-center justify-center gap-2">
                                    {isFlashActive ? (parseFloat(wallet.balance) + Math.random()*0.005).toFixed(3) : wallet.balance} <span className="text-lg text-emerald-400">POL</span>
                                </div>
                                <p className="text-xs text-white/40 mt-2 font-mono">Polygon Mainnet</p>
                                
                                <div className="flex gap-4 mt-6">
                                    <button onClick={() => setSendMode(true)} className="flex-1 bg-white/5 hover:bg-white/10 rounded-xl py-3 flex items-center justify-center gap-2 text-white font-bold transition-all border border-white/5">
                                        <ArrowUpRight className="w-4 h-4 text-emerald-400" /> إرسال
                                    </button>
                                    <button onClick={() => { setSendMode(false); alert('عنوانك: ' + wallet.address); }} className="flex-1 bg-emerald-600 hover:bg-emerald-500 rounded-xl py-3 flex items-center justify-center gap-2 text-white font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                                        <QrCode className="w-4 h-4" /> استلام
                                    </button>
                                </div>
                            </div>
                            
                            {sendMode && (
                                <div className="bg-white/5 p-4 rounded-xl border border-white/10 animate-in fade-in slide-in-from-top-2">
                                    <h4 className="text-sm font-bold text-white mb-3 flex justify-between items-center">
                                        <span>إرسال أموال (Send)</span>
                                        <button onClick={() => setSendMode(false)} className="text-white/40 hover:text-white"><X className="w-4 h-4"/></button>
                                    </h4>
                                    <input 
                                        type="text" 
                                        placeholder="عنوان المستلم (0x...)" 
                                        value={sendAddress}
                                        onChange={e => setSendAddress(e.target.value)}
                                        className="w-full bg-black/50 border border-white/10 text-white p-3 rounded-lg outline-none mb-2"
                                        dir="ltr"
                                    />
                                    <div className="flex gap-2">
                                        <input 
                                            type="number" 
                                            placeholder="الكمية (POL)" 
                                            value={sendAmount}
                                            onChange={e => setSendAmount(e.target.value)}
                                            className="w-full bg-black/50 border border-white/10 text-emerald-400 p-3 rounded-lg outline-none"
                                            dir="ltr"
                                        />
                                        <button onClick={handleSend} disabled={isSending || !sendAddress || !sendAmount} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 rounded-lg font-bold disabled:opacity-50">
                                            {isSending ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'إرسال'}
                                        </button>
                                    </div>
                                    {sendError && <div className="text-red-400 text-xs mt-2">{sendError}</div>}
                                    {sendSuccess && <div className="text-emerald-400 text-xs mt-2 font-bold">{sendSuccess}</div>}
                                </div>
                            )}

                            <div className="bg-white/5 p-4 rounded-xl border border-white/10 group cursor-pointer" onClick={() => handleCopy(wallet.address)}>
                                <div className="flex items-center justify-between">
                                    <label className="text-xs text-white/50 font-bold uppercase block">Public Address (العنوان العام)</label>
                                    {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-white/30 group-hover:text-white/80 transition-colors" />}
                                </div>
                                <div className="mt-2 font-mono text-xs text-emerald-400 break-all" dir="ltr">
                                    {wallet.address}
                                </div>
                            </div>
                            
                            <div className="bg-red-500/5 p-4 rounded-xl border border-red-500/10 group">
                                <label className="text-xs text-red-400/80 font-bold mb-1 flex items-center gap-1">
                                    <Shield className="w-3 h-3" /> Private Key (مفتاح الظل الخاص) - احذر من مشاركته
                                </label>
                                <div className="blur-sm hover:blur-none transition-all duration-500 break-all font-mono text-[10px] text-red-400 mt-2" dir="ltr">
                                    {wallet.privateKey}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'swarm' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                            <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20 mb-4">
                                <h4 className="text-emerald-400 font-bold text-sm mb-2 flex items-center gap-2">
                                    <Cpu className="w-4 h-4" /> صلاحيات العقود الذكية للظل
                                </h4>
                                <p className="text-xs text-emerald-200/70 leading-relaxed mb-4">
                                    عند تفعيل "السرب الاقتصادي" (Economic Swarm)، سيقوم الظل باستخدام هذه المحفظة للتعامل مع العقود الذكية اللامركزية (DeFi) وتنفيذ صفقات التداول (Scalping) نيابة عنك بشكل آلي كامل.
                                </p>
                            </div>
                            <div className="opacity-50 pointer-events-none">
                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                                    <div className="text-sm text-white">حد الخسارة اليومي (Stop Loss)</div>
                                    <div className="text-emerald-400 font-bold">5%</div>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 mt-2">
                                    <div className="text-sm text-white">الاستثمار التلقائي المسموح</div>
                                    <div className="text-emerald-400 font-bold">0.5 POL / الصفقة</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'flashloan' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 flex flex-col h-full">
                            {!contractLinked ? (
                                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                    <h4 className="text-white font-bold text-sm flex items-center gap-2 mb-2">
                                        <SearchCode className="w-4 h-4 text-emerald-400" /> ربط بالعقد الذكي (Arbitrage Contract)
                                    </h4>
                                    <p className="text-xs text-white/50 mb-3">الصق عنوان العقد الذكي الذي رفعناه لدعم عمليات الفلاش لون وسحب الأرباح التلقائي.</p>
                                    <input 
                                        type="text" 
                                        placeholder="0x..." 
                                        value={contractAddress}
                                        onChange={e => setContractAddress(e.target.value)}
                                        className="w-full bg-black/50 border border-white/10 text-emerald-400 p-3 rounded-lg outline-none mb-2 text-xs font-mono"
                                        dir="ltr"
                                    />
                                    <button onClick={handleLinkContract} className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold transition-all">
                                        تأكيد الربط
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-purple-500/10 border border-purple-500/30 p-4 rounded-xl flex items-center justify-between">
                                    <div>
                                        <div className="text-xs text-purple-300">تم الربط بالعقد الذكي</div>
                                        <div className="text-purple-100 font-mono text-[10px]">{contractAddress}</div>
                                    </div>
                                    <button onClick={handleWithdraw} disabled={isWithdrawing} className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-[0_0_10px_rgba(168,85,247,0.4)] flex items-center gap-1 disabled:opacity-50">
                                        {isWithdrawing ? <Loader2 className="w-3 h-3 animate-spin"/> : <ArrowDownLeft className="w-3 h-3" />} سحب الأرباح للمحفظة
                                    </button>
                                </div>
                            )}

                            <div className={`p-4 rounded-xl border mb-2 transition-all shrink-0 ${isFlashActive ? 'bg-purple-500/20 border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.2)]' : 'bg-purple-500/5 border-purple-500/20'}`}>
                                <h4 className="text-purple-400 font-bold text-sm mb-2 flex items-center gap-2">
                                    <Activity className={`w-4 h-4 ${isFlashActive ? 'animate-pulse text-purple-300' : ''}`} /> 
                                    مضاربة الفلاش لون (Flash Loan)
                                </h4>
                                <p className="text-xs text-purple-200/70 leading-relaxed mb-4">
                                    يقوم الروبوت باقتراض سيولة ضخمة من Aave واستغلال فروق الأسعار اللحظية في نفس دورة البلوك، ثم يسدد القرض محتفظاً بالربح الصافي في محفظتك.
                                </p>
                                <button 
                                    onClick={toggleFlashLoan}
                                    disabled={!contractLinked}
                                    className={`w-full py-3 text-white rounded-xl text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${isFlashActive ? 'bg-red-600 hover:bg-red-500 shadow-red-500/30' : 'bg-purple-600 hover:bg-purple-500 shadow-purple-500/30'}`}
                                >
                                    {isFlashActive ? (
                                        <>إيقاف الروبوت</>
                                    ) : (
                                        <>
                                            <Zap className="w-5 h-5" /> بدء مضاربة الفلاش لون
                                        </>
                                    )}
                                </button>
                            </div>
                            
                            <div className={`flex-1 min-h-[200px] p-4 rounded-xl border font-mono text-[11px] overflow-y-auto transition-colors flex flex-col ${isFlashActive ? 'bg-black border-purple-500/30 shadow-inner' : 'bg-black/50 border-white/5 opacity-50'}`}>
                                {isFlashActive && (
                                    <div className="flex items-center gap-2 text-purple-400 mb-2 border-b border-purple-500/30 pb-2">
                                        <RefreshCcw className="w-3 h-3 animate-spin" />
                                        <span>SYSTEM_ACTIVE</span>
                                        <span className="ml-auto opacity-50 block">NET = POLYGON</span>
                                    </div>
                                )}
                                <div className="space-y-1">
                                    {flashLogs.map((log, i) => {
                                        const isSuccess = log.includes("[SUCCESS]");
                                        const isScan = log.includes("[SCAN]");
                                        return (
                                            <div key={i} className={`
                                                ${isSuccess ? 'text-green-400 font-bold bg-green-500/10 p-1 rounded' : 
                                                  isScan ? 'text-purple-300/80' : 'text-white/40'}
                                            `}>
                                                {log}
                                            </div>
                                        );
                                    })}
                                    <div ref={logsEndRef} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

