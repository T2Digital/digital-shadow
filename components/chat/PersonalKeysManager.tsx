import React, { useState, useEffect } from 'react';
import { X, Key, Shield, AlertTriangle, Lock } from 'lucide-react';
import { UserProfile, shadowDB } from '../../services/dbService';
import CryptoJS from 'crypto-js';

interface Props {
    onClose: () => void;
    currentUser: UserProfile;
}

const ENCRYPTION_SECRET = "shadow_aes_secret_key_v1"; // In production, this should be a user PIN or biometric key

export const PersonalKeysManager: React.FC<Props> = ({ onClose, currentUser }) => {
    const [personalKeys, setPersonalKeys] = useState<{ [key: string]: string }>({});
    const [isEncrypted, setIsEncrypted] = useState(false);
    const [pin, setPin] = useState('');
    const [isUnlocked, setIsUnlocked] = useState(false);

    useEffect(() => {
        if (currentUser.personalKeys) {
            // Check if they are encrypted
            if (currentUser.personalKeys['_encrypted']) {
                setIsEncrypted(true);
            } else {
                setPersonalKeys(currentUser.personalKeys);
                setIsUnlocked(true);
            }
        } else {
            setIsUnlocked(true);
        }
    }, [currentUser]);

    const unlockBox = () => {
        if (!pin) return;
        try {
            const encryptedData = currentUser.personalKeys?.['data'] || '';
            const bytes = CryptoJS.AES.decrypt(encryptedData, pin);
            const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
            setPersonalKeys(decryptedData);
            setIsUnlocked(true);
        } catch (e) {
            alert('الرقم السري غير صحيح أو مشكلة في فك التشفير.');
        }
    };

    const handleSavePersonalKeys = async () => {
        if (!pin) {
            alert('يجب إدخال رقم سري قوي لحماية مفاتيحك (تشفير AES-256).');
            return;
        }
        
        // Encrypt the keys
        const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(personalKeys), pin).toString();
        
        const updatedUser = { 
            ...currentUser, 
            personalKeys: {
                _encrypted: "true",
                data: encryptedData
            } 
        };
        
        await shadowDB.saveProfile(updatedUser);
        onClose();
        alert('تم حفظ وتشفير مفاتيحك الخاصة بنجاح بتشفير AES-256!');
    };

    return (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in zoom-in">
            <div className="w-full max-w-2xl bg-[#080808] border border-purple-500/20 rounded-[40px] p-8 relative shadow-[0_0_50px_rgba(168,85,247,0.1)] overflow-y-auto max-h-[90vh] scrollbar-hide font-['Cairo']" dir="rtl">
                <button onClick={onClose} className="absolute top-6 left-6 p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><X className="w-5 h-5 text-white/50" /></button>
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-purple-900/20 rounded-xl border border-purple-500/30">
                        <Key className="w-8 h-8 text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white">مفاتيحي الخاصة Secured</h2>
                        <p className="text-purple-200/50 text-xs font-bold uppercase tracking-widest">AES-256 Encrypted Vault</p>
                    </div>
                </div>
                
                {!isUnlocked ? (
                    <div className="bg-white/5 p-6 rounded-2xl border border-red-500/30 flex flex-col items-center justify-center text-center gap-4">
                        <Lock className="w-12 h-12 text-red-500 mb-2" />
                        <h3 className="text-white font-bold text-lg">الخزنة مشفرة</h3>
                        <p className="text-white/50 text-sm">أدخل الرقم السري لفك تشفير المحتويات.</p>
                        <input 
                            type="password"
                            placeholder="الرقم السري"
                            className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-center tracking-widest outline-none focus:border-purple-500 w-full max-w-xs"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                        />
                        <button onClick={unlockBox} className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-all w-full max-w-xs">فك التشفير</button>
                    </div>
                ) : (
                    <>
                        <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20 mb-6 text-sm text-red-200 flex gap-3">
                            <AlertTriangle className="w-6 h-6 flex-shrink-0" />
                            <p>جميع المفاتيح المدخلة هنا يتم تشفيرها محلياً بخوارزمية (AES-256) قبل حفظها. لن يمكن لأي جهة أو سيرفر قراءتها بدون رقمك السري.</p>
                        </div>
                        
                        <div className="space-y-4 mb-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-white/70 text-xs font-bold mb-2 uppercase tracking-widest">OpenAI API Key</label>
                                    <input type="password" value={personalKeys.openaiApiKey || ''} onChange={e => setPersonalKeys({ ...personalKeys, openaiApiKey: e.target.value })} className="w-full bg-[#111] border border-white/5 rounded-xl px-4 py-3 text-white/90 text-sm focus:border-purple-500/50 outline-none transition-all placeholder:text-white/20" placeholder="sk-..." />
                                </div>
                                <div>
                                    <label className="block text-white/70 text-xs font-bold mb-2 uppercase tracking-widest">Anthropic API Key</label>
                                    <input type="password" value={personalKeys.anthropicApiKey || ''} onChange={e => setPersonalKeys({ ...personalKeys, anthropicApiKey: e.target.value })} className="w-full bg-[#111] border border-white/5 rounded-xl px-4 py-3 text-white/90 text-sm focus:border-purple-500/50 outline-none transition-all placeholder:text-white/20" placeholder="sk-ant-..." />
                                </div>
                            </div>
                            <div>
                                <label className="block text-white/70 text-xs font-bold mb-2 uppercase tracking-widest">Gemini API Key (مفتاح إضافي)</label>
                                <input type="password" value={personalKeys.geminiApiKey || ''} onChange={e => setPersonalKeys({ ...personalKeys, geminiApiKey: e.target.value })} className="w-full bg-[#111] border border-white/5 rounded-xl px-4 py-3 text-white/90 text-sm focus:border-purple-500/50 outline-none transition-all placeholder:text-white/20" placeholder="AIzaSy..." />
                            </div>
                            
                            <hr className="border-white/5 my-4" />

                            <div>
                                <label className="block text-white/70 text-xs font-bold mb-2 uppercase tracking-widest">GitHub Token (للنشر على جت هاب)</label>
                                <input type="password" value={personalKeys.githubToken || ''} onChange={e => setPersonalKeys({ ...personalKeys, githubToken: e.target.value })} className="w-full bg-[#111] border border-white/5 rounded-xl px-4 py-3 text-white/90 text-sm focus:border-purple-500/50 outline-none transition-all placeholder:text-white/20" placeholder="ghp_..." />
                            </div>
                            <div>
                                <label className="block text-white/70 text-xs font-bold mb-2 uppercase tracking-widest">Vercel Token (لرفع المشاريع)</label>
                                <input type="password" value={personalKeys.vercelToken || ''} onChange={e => setPersonalKeys({ ...personalKeys, vercelToken: e.target.value })} className="w-full bg-[#111] border border-white/5 rounded-xl px-4 py-3 text-white/90 text-sm focus:border-purple-500/50 outline-none transition-all" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-white/70 text-xs font-bold mb-2 uppercase tracking-widest">Binance API Key</label>
                                    <input type="password" value={personalKeys.binanceApiKey || ''} onChange={e => setPersonalKeys({ ...personalKeys, binanceApiKey: e.target.value })} className="w-full bg-[#111] border border-white/5 rounded-xl px-4 py-3 text-white/90 text-sm focus:border-purple-500/50 outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="block text-white/70 text-xs font-bold mb-2 uppercase tracking-widest">Binance Secret</label>
                                    <input type="password" value={personalKeys.binanceSecretKey || ''} onChange={e => setPersonalKeys({ ...personalKeys, binanceSecretKey: e.target.value })} className="w-full bg-[#111] border border-white/5 rounded-xl px-4 py-3 text-white/90 text-sm focus:border-purple-500/50 outline-none transition-all" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-white/70 text-xs font-bold mb-2 uppercase tracking-widest">Meta Access Token (لنشر البوستات)</label>
                                <input type="password" value={personalKeys.metaAccessToken || ''} onChange={e => setPersonalKeys({ ...personalKeys, metaAccessToken: e.target.value })} className="w-full bg-[#111] border border-white/5 rounded-xl px-4 py-3 text-white/90 text-sm focus:border-purple-500/50 outline-none transition-all mb-4" />
                                
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-white/70 text-xs font-bold mb-2 uppercase tracking-widest">Meta App ID</label>
                                        <input type="text" value={personalKeys.metaAppId || ''} onChange={e => setPersonalKeys({ ...personalKeys, metaAppId: e.target.value })} className="w-full bg-[#111] border border-white/5 rounded-xl px-4 py-3 text-white/90 text-sm focus:border-purple-500/50 outline-none transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-white/70 text-xs font-bold mb-2 uppercase tracking-widest">Meta App Secret</label>
                                        <input type="password" value={personalKeys.metaAppSecret || ''} onChange={e => setPersonalKeys({ ...personalKeys, metaAppSecret: e.target.value })} className="w-full bg-[#111] border border-white/5 rounded-xl px-4 py-3 text-white/90 text-sm focus:border-purple-500/50 outline-none transition-all" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-white/70 text-xs font-bold mb-2 uppercase tracking-widest">X (Twitter) API Key</label>
                                        <input type="password" value={personalKeys.xApiKey || ''} onChange={e => setPersonalKeys({ ...personalKeys, xApiKey: e.target.value })} className="w-full bg-[#111] border border-white/5 rounded-xl px-4 py-3 text-white/90 text-sm focus:border-purple-500/50 outline-none transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-white/70 text-xs font-bold mb-2 uppercase tracking-widest">X (Twitter) API Secret</label>
                                        <input type="password" value={personalKeys.xApiSecret || ''} onChange={e => setPersonalKeys({ ...personalKeys, xApiSecret: e.target.value })} className="w-full bg-[#111] border border-white/5 rounded-xl px-4 py-3 text-white/90 text-sm focus:border-purple-500/50 outline-none transition-all" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-white/70 text-xs font-bold mb-2 uppercase tracking-widest">TikTok Key</label>
                                        <input type="password" value={personalKeys.tiktokKey || ''} onChange={e => setPersonalKeys({ ...personalKeys, tiktokKey: e.target.value })} className="w-full bg-[#111] border border-white/5 rounded-xl px-4 py-3 text-white/90 text-sm focus:border-purple-500/50 outline-none transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-white/70 text-xs font-bold mb-2 uppercase tracking-widest">Youtube API Key</label>
                                        <input type="password" value={personalKeys.youtubeKey || ''} onChange={e => setPersonalKeys({ ...personalKeys, youtubeKey: e.target.value })} className="w-full bg-[#111] border border-white/5 rounded-xl px-4 py-3 text-white/90 text-sm focus:border-purple-500/50 outline-none transition-all" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-white/70 text-xs font-bold mb-2 uppercase tracking-widest">Snapchat Client ID</label>
                                    <input type="password" value={personalKeys.snapchatKey || ''} onChange={e => setPersonalKeys({ ...personalKeys, snapchatKey: e.target.value })} className="w-full bg-[#111] border border-white/5 rounded-xl px-4 py-3 text-white/90 text-sm focus:border-purple-500/50 outline-none transition-all" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-black/50 border border-white/5 p-4 rounded-xl mb-6">
                            <label className="block text-white/90 text-sm font-bold mb-2">رقم سري للتشفير (PIN / Password)</label>
                            <input 
                                type="password" 
                                value={pin} 
                                onChange={e => setPin(e.target.value)} 
                                className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white text-center tracking-widest outline-none focus:border-purple-500" 
                                placeholder="أدخل رقم سري قوي للتشفير" 
                            />
                        </div>

                        <button onClick={handleSavePersonalKeys} className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black text-lg transition-all shadow-[0_0_30px_rgba(168,85,247,0.4)] flex items-center justify-center gap-2">
                            <Shield className="w-5 h-5" /> حفظ آمن وتشفير
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};
