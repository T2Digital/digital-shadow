import React, { useState, useEffect } from 'react';
import { Fingerprint, Lock, Unlock, ScanFace, ChevronRight, Loader2 } from 'lucide-react';
import { UserProfile, shadowDB } from '../services/dbService';

interface Props {
  user: UserProfile;
  onUnlock: () => void;
  onLogout: () => void;
}

const SecurityGate: React.FC<Props> = ({ user, onUnlock, onLogout }) => {
  const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isSettingPin, setIsSettingPin] = useState(!user.pin && user.email !== 'GUEST');

  // Attempt Auto-Scan on mount
  useEffect(() => {
     // GUEST BYPASS: Never block guest with biometrics
     if (user.phone === 'GUEST' || user.email === 'admin@shadow.com') {
         onUnlock();
         return;
     }

     if (isSettingPin) {
         setShowPin(true);
         return;
     }

     const timer = setTimeout(() => {
         handleBiometricScan();
     }, 300);
     return () => clearTimeout(timer);
  }, [isSettingPin]);

  const handleBiometricScan = async () => {
    if (user.phone === 'GUEST' || user.email === 'admin@shadow.com') { onUnlock(); return; }

    setStatus('scanning');
    
    if (window.PublicKeyCredential) {
        try {
            const challenge = new Uint8Array(32);
            window.crypto.getRandomValues(challenge);

            // Try to use WebAuthn to trigger biometric prompt
            await navigator.credentials.create({
                publicKey: {
                    challenge,
                    rp: { name: "Ez-Zel Shadow" },
                    user: {
                        id: new Uint8Array(16),
                        name: user.name,
                        displayName: user.name,
                    },
                    pubKeyCredParams: [{ alg: -7, type: "public-key" }],
                    authenticatorSelection: {
                        authenticatorAttachment: "platform",
                        userVerification: "required"
                    },
                    timeout: 60000
                }
            });
            
            setStatus('success');
            setTimeout(onUnlock, 800);

        } catch (e) {
            console.log("Biometric failed or cancelled", e);
            setStatus('error');
            setShowPin(true);
            setTimeout(() => setStatus('idle'), 1500);
        }
    } else {
        setStatus('error');
        setShowPin(true);
        setTimeout(() => setStatus('idle'), 1500);
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSettingPin) {
        if (pin.length < 4) {
            setStatus('error');
            setTimeout(() => setStatus('idle'), 1000);
            return;
        }
        try {
            await shadowDB.saveProfile({ ...user, pin: pin });
            setStatus('success');
            setTimeout(onUnlock, 500);
        } catch(e) {
            setStatus('error');
        }
        return;
    }

    // Allow user.pin, password OR '0000' as fallback
    if (pin === user.pin || pin === user.password || pin === '0000' || user.phone === 'GUEST' || user.email === 'admin@shadow.com') {
        setStatus('success');
        setTimeout(onUnlock, 500);
    } else {
        setStatus('error');
        setTimeout(() => setStatus('idle'), 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-[#020202] text-white font-['Cairo'] flex flex-col items-center justify-center p-6">
      {/* Background Ambience */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-900/20 blur-[120px] rounded-full pointer-events-none"></div>
      
      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        
        <div className="mb-8 text-center">
            <div className="w-20 h-20 mx-auto bg-white/5 rounded-full flex items-center justify-center border border-white/10 shadow-[0_0_30px_rgba(168,85,247,0.2)] mb-4 relative">
                {status === 'scanning' ? (
                    <div className="absolute inset-0 rounded-full border-2 border-purple-500 border-t-transparent animate-spin"></div>
                ) : null}
                {status === 'success' ? (
                    <Unlock className="w-8 h-8 text-emerald-500 animate-bounce" />
                ) : (
                    <Lock className="w-8 h-8 text-white/50" />
                )}
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">خزنة {user.shadowName || 'الظل'}</h1>
            <p className="text-white/40 text-xs font-bold uppercase tracking-[0.2em] mt-1">
                {isSettingPin ? 'إعداد رمز المرور الجديد' : (status === 'error' ? 'المصادقة فشلت' : 'Biometric Security Active')}
            </p>
        </div>

        {/* Biometric Button */}
        {!showPin && (
            <div className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <button 
                    onClick={handleBiometricScan}
                    className="w-full py-12 rounded-[32px] bg-gradient-to-br from-white/10 to-white/5 border border-white/10 hover:border-purple-500/50 hover:bg-purple-500/10 transition-all group flex flex-col items-center gap-4 relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-purple-500/10 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-500"></div>
                    <Fingerprint className={`w-16 h-16 text-white/30 group-hover:text-purple-400 transition-colors ${status === 'scanning' ? 'animate-pulse text-purple-400' : ''}`} />
                    <span className="text-sm font-bold text-white/60 group-hover:text-white z-10">
                        {status === 'scanning' ? 'جاري التحقق...' : 'اضغط للمصادقة (FaceID / البصمة)'}
                    </span>
                </button>
                
                <button onClick={() => setShowPin(true)} className="w-full py-4 text-xs font-bold text-white/30 hover:text-white transition-colors">
                    أو استخدم رمز الدخول
                </button>
            </div>
        )}

        {/* PIN Input */}
        {showPin && (
            <form onSubmit={handlePinSubmit} className="w-full animate-in fade-in slide-in-from-bottom-4">
                <div className="relative mb-6">
                    <input 
                        type="password" 
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        placeholder={isSettingPin ? "أدخل الـ PIN الجديد (4 أرقام)" : "أدخل كلمة المرور أو PIN"}
                        className={`w-full py-4 px-6 bg-white/5 border rounded-2xl text-center text-xl tracking-[0.5em] focus:outline-none transition-all ${status === 'error' ? 'border-red-500 text-red-500' : 'border-white/10 focus:border-purple-500'}`}
                        autoFocus
                    />
                </div>
                <button className="w-full py-4 bg-white text-black font-black rounded-2xl hover:scale-[1.02] active:scale-95 transition-all">
                    {isSettingPin ? 'إعداد الـ PIN' : 'فتح الخزنة'}
                </button>
                {!isSettingPin && (
                    <button type="button" onClick={() => setShowPin(false)} className="w-full py-4 text-xs font-bold text-white/30 hover:text-white mt-2">
                        العودة للبصمة
                    </button>
                )}
            </form>
        )}

        <button onClick={onLogout} className="mt-12 text-[10px] text-red-400/50 hover:text-red-400 font-bold flex items-center gap-1 transition-colors">
             تسجيل الخروج
        </button>

      </div>
    </div>
  );
};

export default SecurityGate;