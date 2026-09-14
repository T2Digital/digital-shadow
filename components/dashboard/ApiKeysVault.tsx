import React, { useState } from 'react';
import { Key, Shield, EyeOff, Eye, Save, X, Loader2 } from 'lucide-react';
import { shadowDB, UserProfile } from '../../services/dbService';
import { VaultCrypto } from '../../services/vaultCryptoService';

interface Props {
    user: UserProfile;
    onClose: () => void;
    onSave: (updatedUser: UserProfile) => void;
}

const ApiKeysVault: React.FC<Props> = ({ user, onClose, onSave }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [visibility, setVisibility] = useState<Record<string, boolean>>({});
    
    const [keys, setKeys] = useState<{
        binanceApiKey: string;
        binanceSecretKey: string;
        twilioSid: string;
        twilioAuthToken: string;
        twilioWhatsAppNumber: string;
        metaAccessToken: string;
    }>({
        binanceApiKey: user.personalKeys?.binanceApiKey ? VaultCrypto.decryptE2E(user.personalKeys.binanceApiKey) : '',
        binanceSecretKey: user.personalKeys?.binanceSecretKey ? VaultCrypto.decryptE2E(user.personalKeys.binanceSecretKey) : '',
        twilioSid: user.personalKeys?.twilioSid ? VaultCrypto.decryptE2E(user.personalKeys.twilioSid) : '',
        twilioAuthToken: user.personalKeys?.twilioAuthToken ? VaultCrypto.decryptE2E(user.personalKeys.twilioAuthToken) : '',
        twilioWhatsAppNumber: user.personalKeys?.twilioWhatsAppNumber ? VaultCrypto.decryptE2E(user.personalKeys.twilioWhatsAppNumber) : '',
        metaAccessToken: user.personalKeys?.metaAccessToken ? VaultCrypto.decryptE2E(user.personalKeys.metaAccessToken) : '',
    });

    const toggleVisibility = (key: keyof typeof keys) => {
        setVisibility(prev => ({ ...prev, [key as string]: !prev[key as string] }));
    };

    const handleChange = (key: keyof typeof keys, value: string) => {
        setKeys(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const encryptedKeys = {
                githubToken: user.personalKeys?.githubToken || '',
                vercelToken: user.personalKeys?.vercelToken || '',
                openaiApiKey: user.personalKeys?.openaiApiKey || '',
                anthropicApiKey: user.personalKeys?.anthropicApiKey || '',
                geminiApiKey: user.personalKeys?.geminiApiKey || '',
                binanceApiKey: keys.binanceApiKey ? VaultCrypto.encryptE2E(keys.binanceApiKey) : '',
                binanceSecretKey: keys.binanceSecretKey ? VaultCrypto.encryptE2E(keys.binanceSecretKey) : '',
                twilioSid: keys.twilioSid ? VaultCrypto.encryptE2E(keys.twilioSid) : '',
                twilioAuthToken: keys.twilioAuthToken ? VaultCrypto.encryptE2E(keys.twilioAuthToken) : '',
                twilioWhatsAppNumber: keys.twilioWhatsAppNumber ? VaultCrypto.encryptE2E(keys.twilioWhatsAppNumber) : '',
                metaAccessToken: keys.metaAccessToken ? VaultCrypto.encryptE2E(keys.metaAccessToken) : '',
            };

            const updatedUser: UserProfile = {
                ...user,
                personalKeys: encryptedKeys
            };
            
            await shadowDB.saveProfile(updatedUser);
            onSave(updatedUser);
            alert("تم تشفير وحفظ المفاتيح في خزينة البيانات بنجاح.");
            onClose();
        } catch (e) {
            console.error("Failed to save keys", e);
            alert("حدث خطأ أثناء حفظ المفاتيح.");
        } finally {
            setIsSaving(false);
        }
    };

    const renderInput = (label: string, field: keyof typeof keys, placeholder: string) => (
        <div className="mb-4 relative">
            <label className="block text-xs font-bold text-white/50 mb-1">{label}</label>
            <div className="relative">
                <input
                    type={visibility[field] ? "text" : "password"}
                    value={keys[field]}
                    onChange={(e) => handleChange(field, e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-purple-500/50 outline-none pr-10 font-mono text-sm"
                />
                <button 
                    onClick={() => toggleVisibility(field)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
                >
                    {visibility[field] ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300 font-['Cairo']">
            <div className="w-full max-w-2xl bg-[#0a0a0a] border border-purple-500/30 rounded-[32px] overflow-hidden shadow-[0_0_100px_rgba(168,85,247,0.15)] flex flex-col max-h-[90vh]">
                
                <div className="p-6 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#0a0a0a] z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-purple-600/20 rounded-xl border border-purple-500/30">
                            <Key className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white">خزينة المفاتيح (Vault API)</h2>
                            <p className="text-[10px] text-emerald-400 font-bold uppercase flex items-center gap-1">
                                <Shield className="w-3 h-3" /> مشفرة E2E ولا يتم مشاركتها أبداً
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5 text-white/50" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto scrollbar-hide space-y-6 flex-1">
                    <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-2xl">
                        <p className="text-xs text-orange-200/80 leading-relaxed font-bold">
                            هذه المفاتيح تستخدم فقط بواسطة حسابك أثناء طلب المهام المستقلة، ويتم تشفيرها محلياً قبل حفظها في قاعدة البيانات السحابية. لا يستطيع أحد غيرك (ولا حتى النظام نفسه في المهام العامة) قراءتها.
                        </p>
                    </div>

                    <div className="space-y-6">
                        {/* Binance Keys */}
                        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
                            <h3 className="text-sm font-bold text-yellow-500 mb-4 flex items-center gap-2">
                                🟡 Binance Trading API
                            </h3>
                            {renderInput("Binance API Key", "binanceApiKey", "e.g., v8X3z...")}
                            {renderInput("Binance Secret Key", "binanceSecretKey", "e.g., L9kP...")}
                        </div>

                        {/* Twilio Keys */}
                        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
                            <h3 className="text-sm font-bold text-red-500 mb-4 flex items-center gap-2">
                                🔴 Twilio WhatsApp API
                            </h3>
                            {renderInput("Twilio Account SID", "twilioSid", "e.g., ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")}
                            {renderInput("Twilio Auth Token", "twilioAuthToken", "e.g., your_auth_token")}
                            {renderInput("Twilio WhatsApp Number", "twilioWhatsAppNumber", "e.g., whatsapp:+14155238886")}
                        </div>

                        {/* Meta Keys */}
                        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
                            <h3 className="text-sm font-bold text-blue-500 mb-4 flex items-center gap-2">
                                🔵 Meta / Facebook Graph API
                            </h3>
                            {renderInput("Meta Access Token", "metaAccessToken", "e.g., EAAGm0PX4ZC... ")}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-white/5 bg-[#050505]">
                    <button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-2xl font-black transition-colors flex items-center justify-center gap-2 shadow-lg shadow-purple-900/50"
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {isSaving ? "جاري التشفير والحفظ..." : "حفظ وتشفير مفاتيحي"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ApiKeysVault;
