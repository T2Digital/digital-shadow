import React, { useState } from 'react';
import { Share2, Facebook, Instagram, Youtube, Linkedin, Info, Save, X, Network, Key, ShieldCheck, Video, Link as LinkIcon, RefreshCw } from 'lucide-react';
import { UserProfile, shadowDB } from '../../services/dbService';

interface Props {
    user: UserProfile;
    onClose: () => void;
}

export const SocialMatrixModal: React.FC<Props> = ({ user, onClose }) => {
    const isAdmin = user.email === 'admin@shadow.com' || user.email === 'TITO' || user.email === 'tito@shadow.com';
    const [activeTab, setActiveTab] = useState<'users' | 'admin'>(isAdmin ? 'admin' : 'users');
    const [connecting, setConnecting] = useState<string | null>(null);

    // Mock permissions state for users
    const [linkedAccounts, setLinkedAccounts] = useState<Record<string, boolean>>({
        facebook: false,
        instagram: false,
        tiktok: false,
        youtube: false,
        linkedin: false,
        snapchat: false,
        whatsapp: false
    });

    const handleConnect = (platform: string) => {
        setConnecting(platform);
        // Simulate OAuth flow redirection to grant "الظل" access
        setTimeout(() => {
            setLinkedAccounts(prev => ({ ...prev, [platform]: true }));
            setConnecting(null);
            alert(`تم ربط ${platform} بنجاح وإعطاء الصلاحيات لـ "الظل" للتصرف بالنيابة عنك وجمع البيانات لصالح دكتور بيزنس وآدم AI.`);
        }, 1500);
    };

    const handleDisconnect = (platform: string) => {
        setLinkedAccounts(prev => ({ ...prev, [platform]: false }));
    };

    return (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-6 animate-in fade-in zoom-in font-['Cairo']">
            <div className="w-full max-w-4xl bg-[#080808] border border-cyan-500/20 rounded-[32px] p-6 md:p-8 relative shadow-[0_0_50px_rgba(6,182,212,0.1)] overflow-y-auto max-h-[90vh] scrollbar-hide">
                <button onClick={onClose} className="absolute top-6 left-6 p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                    <X className="w-5 h-5 text-white/50" />
                </button>

                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-cyan-900/20 rounded-xl border border-cyan-500/30">
                        <Share2 className="w-8 h-8 text-cyan-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white">منظومة السوشيال ميديا (Social Matrix)</h2>
                        <p className="text-cyan-200/50 text-xs font-bold uppercase tracking-widest mt-1">تفعيل ربط الظل بمنافذ التواصل</p>
                    </div>
                </div>

                {isAdmin && (
                    <div className="flex gap-4 mb-8 border-b border-white/5 pb-4">
                        <button 
                            onClick={() => setActiveTab('admin')} 
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'admin' ? 'bg-cyan-500 text-black' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
                        >
                            <Key className="w-4 h-4 inline-block ml-2" /> إعدادات الماستر (لأدمن)
                        </button>
                        <button 
                            onClick={() => setActiveTab('users')} 
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-cyan-500 text-black' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
                        >
                            <LinkIcon className="w-4 h-4 inline-block ml-2" /> محاكاة ربط المستخدمين
                        </button>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="space-y-6">
                        <div className="bg-cyan-900/10 border border-cyan-500/20 p-5 rounded-2xl">
                            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                                إعطاء الصلاحية الشاملة للظل
                            </h3>
                            <p className="text-white/60 text-sm leading-relaxed mb-4">
                                قم بربط حساباتك الاجتماعية لتمكين "الظل" من النشر المباشر، الرد على التعليقات، جلب البيانات الإحصائية لتحليلها بواسطة "دكتور بيزنس"، ومراقبة التريندات عن طريق "آدم AI".
                                كل شيء يتم في الخلفية بشكل صامت تماماً.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { id: 'facebook', name: 'Meta (Facebook / IG)', icon: Facebook, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                                { id: 'whatsapp', name: 'WhatsApp Business', icon: Network, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                                { id: 'youtube', name: 'YouTube & Google', icon: Youtube, color: 'text-red-500', bg: 'bg-red-500/10' },
                                { id: 'tiktok', name: 'TikTok', icon: Video, color: 'text-white', bg: 'bg-white/10' },
                                { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'text-blue-400', bg: 'bg-blue-400/10' }
                            ].map(platform => (
                                <div key={platform.id} className="flex items-center justify-between p-4 bg-[#111] border border-white/5 rounded-2xl">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${platform.bg}`}>
                                            <platform.icon className={`w-5 h-5 ${platform.color}`} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white text-sm">{platform.name}</h4>
                                            <p className="text-[10px] text-white/40">{linkedAccounts[platform.id] ? 'متصل وجاهز للظل' : 'غير متصل'}</p>
                                        </div>
                                    </div>
                                    {linkedAccounts[platform.id] ? (
                                        <button onClick={() => handleDisconnect(platform.id)} className="px-4 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 text-xs font-bold rounded-lg transition-all border border-red-500/20">إلغاء الربط</button>
                                    ) : (
                                        <button onClick={() => handleConnect(platform.id)} disabled={connecting !== null} className="px-4 py-1.5 bg-cyan-500 text-black hover:bg-cyan-400 text-xs font-black rounded-lg transition-all disabled:opacity-50 flex items-center gap-2">
                                            {connecting === platform.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <LinkIcon className="w-3 h-3" />}
                                            ربط وإعطاء الصلاحية
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'admin' && isAdmin && (
                    <div className="space-y-6">
                        <div className="bg-red-900/10 border border-red-500/20 p-5 rounded-2xl">
                            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                <Key className="w-5 h-5 text-red-400" />
                                مفاتيح الماستر للمنصات (للمطورين فقط)
                            </h3>
                            <p className="text-white/60 text-sm leading-relaxed mb-4">
                                يتم إدخال هذه المفاتيح لتفعيل الـ OAuth للمستخدمين، وتوفير الـ API الأساسية التي يعتمد عليها الظل في النشر أو استلاب البيانات للمستخدمين. 
                                <br/> 
                                <span className="text-amber-400 font-mono text-xs">تنبيه: يجب ضبط ملف .env.example في بيئة الإنتاج بهذه المتغيرات.</span>
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div className="bg-[#111] p-4 border border-white/5 rounded-2xl">
                                <h4 className="font-bold text-white text-sm mb-3 text-blue-400">(Meta) Facebook & Instagram</h4>
                                <div className="space-y-3">
                                    <input type="text" placeholder="META_APP_ID" defaultValue={(import.meta as any).env.VITE_META_APP_ID || ''} className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-mono" />
                                    <input type="password" placeholder="META_APP_SECRET" defaultValue={(import.meta as any).env.VITE_META_APP_SECRET || ''} className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-mono" />
                                </div>
                            </div>
                            
                            <div className="bg-[#111] p-4 border border-white/5 rounded-2xl">
                                <h4 className="font-bold text-white text-sm mb-3">TikTok</h4>
                                <div className="space-y-3">
                                    <input type="text" placeholder="TIKTOK_CLIENT_KEY" defaultValue={(import.meta as any).env.VITE_TIKTOK_CLIENT_KEY || ''} className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-mono" />
                                    <input type="password" placeholder="TIKTOK_CLIENT_SECRET" defaultValue={(import.meta as any).env.VITE_TIKTOK_CLIENT_SECRET || ''} className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-mono" />
                                </div>
                            </div>

                            <div className="bg-[#111] p-4 border border-white/5 rounded-2xl">
                                <h4 className="font-bold text-white text-sm mb-3 text-red-500">Google (YouTube / Business)</h4>
                                <div className="space-y-3">
                                    <input type="text" placeholder="GOOGLE_CLIENT_ID" defaultValue={(import.meta as any).env.VITE_GOOGLE_CLIENT_ID || ''} className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-mono" />
                                    <input type="password" placeholder="GOOGLE_CLIENT_SECRET" defaultValue={(import.meta as any).env.VITE_GOOGLE_CLIENT_SECRET || ''} className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-mono" />
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 flex justify-end">
                            <button className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/20">
                                <Save className="w-4 h-4" /> حفظ وإعادة تشغيل واجهة الـ OAuth اللحظية
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
