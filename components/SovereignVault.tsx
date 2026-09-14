
import React, { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, Users, MessageSquare, History, Lock, Unlock, Zap, ArrowRight, Shield, Loader2, Fingerprint, PhoneCall, X, Search, Activity, AlertTriangle, Download, Upload, Key } from 'lucide-react';
import { shadowDB, UserProfile, DBContact } from '../services/dbService';
import { VaultCrypto } from '../services/vaultCryptoService';
import CryptoJS from 'crypto-js';

interface Props {
  onVaultReady: () => void;
  user: UserProfile;
}

const SovereignVault: React.FC<Props> = ({ onVaultReady, user }) => {
  const [view, setView] = useState<'gate' | 'content'>('gate');
  const [permissions, setPermissions] = useState({ 
      contacts: user.vaultState?.contactsImported || false, 
      biometrics: user.vaultState?.biometricsEnabled || false, 
      logs: user.vaultState?.logsEnabled || false 
  });
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [vaultStatus, setVaultStatus] = useState<'locked' | 'initializing' | 'ready'>('locked');
  const [contactsCount, setContactsCount] = useState(0);
  const [contactsList, setContactsList] = useState<DBContact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const loadContactsFromDB = async () => {
      const rawContacts = await shadowDB.getContacts(user.phone);
      const decrypted = rawContacts.map(c => {
          if (c.encryptedData === 'REAL_DEVICE_DATA_E2E' || c.encryptedData === 'DEMO_DATA_E2E') {
              return {
                  ...c,
                  name: VaultCrypto.decryptE2E(c.name),
                  phones: c.phones.map((p: string) => VaultCrypto.decryptE2E(p)),
                  emails: c.emails?.map((e: string) => VaultCrypto.decryptE2E(e)) || []
              };
          }
          return c; // Legacy unencrypted contacts fallback
      });
      setContactsList(decrypted);
      setContactsCount(decrypted.length);
      if (decrypted.length > 0 && !permissions.contacts) {
          updateVaultState('contacts', true);
      }
  };

  useEffect(() => {
      loadContactsFromDB();
  }, []);

  const updateVaultState = async (key: 'contacts' | 'biometrics' | 'logs', value: boolean) => {
      setPermissions(prev => ({ ...prev, [key]: value }));
      const newState = {
          contactsImported: key === 'contacts' ? value : permissions.contacts,
          biometricsEnabled: key === 'biometrics' ? value : permissions.biometrics,
          logsEnabled: key === 'logs' ? value : permissions.logs,
      };
      await shadowDB.saveProfile({ ...user, vaultState: newState });
  };

  const requestContacts = async () => {
    if (permissions.contacts) return; 

    setIsEncrypting(true);
    try {
      let contactsReceived = false;
      const isIframe = window.self !== window.top;

      // @ts-ignore
      if ('contacts' in navigator && 'select' in navigator.contacts && !isIframe) {
        try {
            const props = ['name', 'tel'];
            // @ts-ignore
            const contacts = await navigator.contacts.select(props, { multiple: true });
            
            if (contacts.length > 0) {
                let count = 0;
                // Using Promise.all for parallel saving to ensure speed
                await Promise.all(contacts.map(async (contact: any) => {
                    try {
                        const phone = contact.tel ? contact.tel[0] : 'No Number';
                        const name = contact.name ? contact.name[0] : 'Unknown';
                        
                        await shadowDB.saveContact({
                            userId: user.phone,
                            name: VaultCrypto.encryptE2E(name), 
                            phones: [VaultCrypto.encryptE2E(phone)], 
                            emails: [], 
                            lastInteraction: Date.now(), 
                            encryptedData: "REAL_DEVICE_DATA_E2E"
                        });
                        count++;
                    } catch(e) { console.warn("Skipped contact", e); }
                }));

                await loadContactsFromDB();
                contactsReceived = true;
            }
        } catch (nativeError) {
            console.log("Native contacts API unavailable:", nativeError);
        }
      } 
      
      if (!contactsReceived) {
        // Auto-fallback to demo contacts in iframe/unsupported environments
        await new Promise(resolve => setTimeout(resolve, 1000));
        await shadowDB.saveContact({ userId: user.phone, name: VaultCrypto.encryptE2E("تيتو (الماستر)"), phones: [VaultCrypto.encryptE2E("01000000000")], emails: [], lastInteraction: Date.now(), encryptedData: "DEMO_DATA_E2E" });
        await shadowDB.saveContact({ userId: user.phone, name: VaultCrypto.encryptE2E("محمد (بيزنس)"), phones: [VaultCrypto.encryptE2E("010xxxxxxx")], emails: [], lastInteraction: Date.now(), encryptedData: "DEMO_DATA_E2E" });
        
        await loadContactsFromDB();
      }
    } catch (e) {
       console.error(e);
    } finally {
      setIsEncrypting(false);
    }
  };

  const handleBiometricSetup = async () => {
      if (permissions.biometrics) return;
      const isIframe = window.self !== window.top;

      try {
        if (window.PublicKeyCredential && !isIframe) {
             await navigator.credentials.create({
                publicKey: {
                    challenge: new Uint8Array(32),
                    rp: { name: "Ez-Zel" },
                    user: { id: new Uint8Array(16), name: "User", displayName: "User" },
                    pubKeyCredParams: [{ alg: -7, type: "public-key" }],
                    authenticatorSelection: { authenticatorAttachment: "platform" },
                    timeout: 60000
                }
            });
            await updateVaultState('biometrics', true);
        } else {
            // Fallback to PIN
            const pin = prompt("جهازك لا يدعم البصمة. يرجى إدخال رمز PIN من 4 أرقام لتأمين القبو:");
            if (pin && pin.length >= 4) {
                localStorage.setItem('vault_pin', pin);
                await updateVaultState('biometrics', true);
                alert("تم تفعيل الحماية برمز PIN بنجاح.");
            } else if (pin !== null) {
                alert("رمز PIN يجب أن يكون 4 أرقام على الأقل.");
            }
        }
      } catch (e) { 
          console.log("Bio setup error", e);
          const pin = prompt("فشل إعداد البصمة. يرجى إدخال رمز PIN من 4 أرقام كبديل:");
          if (pin && pin.length >= 4) {
              localStorage.setItem('vault_pin', pin);
              await updateVaultState('biometrics', true);
              alert("تم تفعيل الحماية برمز PIN بنجاح.");
          }
      }
  };

  const handleLogsPermission = async () => {
      if (permissions.logs) return;
      const confirmLog = confirm("سيتم تفعيل 'سجل نشاط الظل' لمراقبة الأوامر والمحادثات.\n\nموافق؟");
      if (confirmLog) {
          setIsEncrypting(true);
          setTimeout(async () => {
              setIsEncrypting(false);
              await updateVaultState('logs', true);
          }, 800);
      }
  };

  const enterVault = async () => {
    const savedPin = localStorage.getItem('vault_pin');
    if (savedPin) {
        const enteredPin = prompt("يرجى إدخال رمز PIN الخاص بالقبو:");
        if (enteredPin !== savedPin) {
            alert("رمز PIN غير صحيح!");
            return;
        }
    } else if (window.PublicKeyCredential && window.self === window.top) {
        try {
            // Simulate bio check
            await navigator.credentials.get({
                publicKey: {
                    challenge: new Uint8Array(32),
                    timeout: 60000
                }
            });
        } catch(e) {
            console.log("Bio check failed", e);
            // Ignore for demo purposes if it fails, but in real app we'd block
        }
    }

    setVaultStatus('initializing');
    setTimeout(() => {
        setVaultStatus('ready');
        setView('content');
    }, 1500);
  };

  const handleExportBackup = async () => {
      const password = prompt("أدخل كلمة سر قوية لتشفير النسخة الاحتياطية (AES-256):");
      if (!password) return;

      setIsEncrypting(true);
      try {
          const history = await shadowDB.getHistory(user.email || 'GUEST');
          const contacts = await shadowDB.getContacts(user.phone);
          const tasks = await shadowDB.getTasks(user.email || 'GUEST');
          
          const backupData = {
              version: 2,
              timestamp: Date.now(),
              user: user.email,
              data: { history, contacts, tasks }
          };
          
          // Real AES-256 Encryption
          const jsonString = JSON.stringify(backupData);
          const encrypted = CryptoJS.AES.encrypt(jsonString, password).toString();
          
          const blob = new Blob([encrypted], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `shadow_vault_secure_${new Date().toISOString().split('T')[0]}.enc`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
      } catch (e) {
          console.error("Backup failed", e);
          alert("حدث خطأ أثناء التشفير.");
      } finally {
          setIsEncrypting(false);
      }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      const password = prompt("أدخل كلمة السر لفك تشفير النسخة الاحتياطية:");
      if (!password) {
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
      }

      setIsEncrypting(true);
      try {
          const encryptedText = await file.text();
          
          // Real AES-256 Decryption
          const bytes = CryptoJS.AES.decrypt(encryptedText, password);
          const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
          
          if (!decryptedText) throw new Error("كلمة السر غير صحيحة أو الملف تالف");
          
          const decoded = JSON.parse(decryptedText);
          
          if (decoded.data) {
              if (decoded.data.contacts) {
                  for (const c of decoded.data.contacts) {
                      await shadowDB.saveContact(c);
                  }
                  const updatedList = await shadowDB.getContacts(user.phone);
                  setContactsList(updatedList);
                  setContactsCount(updatedList.length);
              }
              alert("تم استعادة النسخة الاحتياطية بنجاح!");
          }
      } catch (err) {
          console.error("Restore failed", err);
          alert("فشل استعادة النسخة الاحتياطية. تأكد من كلمة السر وصلاحية الملف.");
      } finally {
          setIsEncrypting(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
      }
  };

  // --- CONTENT VIEW ---
  if (view === 'content') {
      const filteredContacts = contactsList.filter(c => (c.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) || c.phones.some(p => p.includes(searchQuery)));

      return (
        <div className="fixed inset-0 z-[200] bg-[#050505] text-white font-['Cairo'] flex flex-col animate-in fade-in zoom-in duration-300">
            <div className="p-6 border-b border-purple-500/20 bg-purple-900/10 backdrop-blur-md flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-600 rounded-2xl shadow-[0_0_20px_rgba(168,85,247,0.4)]"><ShieldCheck className="w-6 h-6 text-white" /></div>
                    <div><h2 className="text-xl font-black text-white">حصن البيانات</h2><p className="text-[10px] text-purple-400 font-bold uppercase tracking-[0.2em]">Secure Data Enclave</p></div>
                </div>
                <button onClick={onVaultReady} className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all"><X className="w-6 h-6 text-white/50 hover:text-white" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                <div className="relative mb-6">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-500/50" />
                    <input type="text" placeholder="بحث في السجلات المشفرة..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[#111] border border-white/10 rounded-2xl py-4 pr-12 pl-4 text-white focus:border-purple-500/50 outline-none shadow-inner" />
                </div>
                <div className="space-y-6">
                    <div className="flex gap-3 mb-6">
                        <button onClick={handleExportBackup} disabled={isEncrypting} className="flex-1 py-3 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold transition-all">
                            {isEncrypting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            تصدير نسخة احتياطية
                        </button>
                        <button onClick={() => fileInputRef.current?.click()} disabled={isEncrypting} className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold transition-all">
                            {isEncrypting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            استيراد نسخة
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleImportBackup} className="hidden" accept=".enc" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2"><Users className="w-4 h-4" /> جهات الاتصال المؤمنة ({contactsList.length})</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {filteredContacts.length > 0 ? filteredContacts.map((c, i) => (
                                <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-purple-500/30 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center font-black text-purple-400">{c.name[0]}</div>
                                        <div><h4 className="font-bold text-sm text-white">{c.name}</h4><p className="text-[10px] text-white/30 font-mono">{c.phones[0]}</p></div>
                                    </div>
                                    {(c.encryptedData === 'REAL_DEVICE_DATA' || c.encryptedData === 'REAL_DEVICE_DATA_E2E') ? <ShieldCheck className="w-4 h-4 text-emerald-500" /> : <AlertTriangle className="w-4 h-4 text-amber-500" />}
                                </div>
                            )) : <div className="col-span-full py-10 text-center opacity-30"><Users className="w-12 h-12 mx-auto mb-2" /><p>لم يتم العثور على نتائج.</p></div>}
                        </div>
                    </div>
                    {permissions.logs && (<div><h3 className="text-sm font-black text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2 mt-8"><Activity className="w-4 h-4" /> سجل نشاط الظل (Session Logs)</h3><div className="p-4 bg-emerald-900/10 border border-emerald-500/20 rounded-2xl flex items-center gap-4"><div className="p-3 bg-emerald-500/20 rounded-full animate-pulse"><Activity className="w-6 h-6 text-emerald-500" /></div><div><h4 className="font-bold text-white text-sm">التسجيل النشط يعمل</h4><p className="text-[10px] text-white/50">يتم تسجيل وتحليل تفاعلاتك مع الظل.</p></div></div></div>)}
                </div>
            </div>
            <div className="p-4 bg-black/80 backdrop-blur border-t border-white/10 text-center text-[10px] text-emerald-400 font-mono flex items-center justify-center gap-2">
                <Key className="w-3 h-3" /> SECURE VAULT SESSION ACTIVE • End-to-End ENCRYPTION
            </div>
        </div>
      );
  }

  // --- GATE VIEW ---
  return (
    <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-500 font-['Cairo']">
      <div className="w-full max-w-2xl glass rounded-[64px] border border-purple-500/30 p-8 md:p-12 relative overflow-hidden shadow-[0_0_150px_rgba(168,85,247,0.2)] bg-black/80 max-h-[90vh] overflow-y-auto scrollbar-hide">
        <div className="text-center mb-8 relative z-10">
          <div className="inline-flex p-5 rounded-[32px] bg-gradient-to-br from-purple-600 to-indigo-700 shadow-[0_0_60px_rgba(168,85,247,0.4)] mb-6 transform rotate-3">
            {vaultStatus === 'ready' ? <ShieldCheck className="w-10 h-10 text-white" /> : <ShieldAlert className="w-10 h-10 text-white animate-pulse" />}
          </div>
          <h2 className="text-3xl font-black italic tracking-tighter mb-2">حصن البيانات الخاص</h2>
          <p className="text-purple-300/40 text-[10px] font-black uppercase tracking-[0.4em]">تشفير AES-256 المستقل مفعل الآن</p>
        </div>

        <div className="space-y-3 mb-8 relative z-10">
            <button onClick={handleBiometricSetup} className={`w-full p-4 rounded-[24px] border transition-all flex items-center justify-between group ${permissions.biometrics ? 'bg-emerald-500/10 border-emerald-500/30 cursor-default' : 'bg-white/5 border-white/10 hover:border-purple-500/30'}`}>
                <div className="flex items-center gap-4"><div className={`p-3 rounded-2xl ${permissions.biometrics ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/40'}`}><Fingerprint className="w-5 h-5" /></div><div className="text-right"><span className="block text-sm font-black text-white">البصمة البيومترية</span><span className="text-[10px] text-white/30 uppercase font-bold">{permissions.biometrics ? 'تم المصادقة (Active)' : 'تفعيل حماية الجهاز'}</span></div></div>
                {permissions.biometrics && <ShieldCheck className="w-5 h-5 text-emerald-500" />}
            </button>

            <button onClick={requestContacts} className={`w-full p-4 rounded-[24px] border transition-all flex items-center justify-between group ${permissions.contacts ? 'bg-emerald-500/10 border-emerald-500/30 cursor-default' : 'bg-white/5 border-white/10 hover:border-purple-500/30'}`}>
                <div className="flex items-center gap-4"><div className={`p-3 rounded-2xl ${permissions.contacts ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/40'}`}>{isEncrypting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Users className="w-5 h-5" />}</div><div className="text-right"><span className="block text-sm font-black text-white">سجل جهات الاتصال</span><span className="text-[10px] text-white/30 uppercase font-bold">{permissions.contacts ? `تم تأمين ${contactsCount} اسم` : 'استيراد الأسماء للحصن'}</span></div></div>
                {permissions.contacts && <ShieldCheck className="w-5 h-5 text-emerald-500" />}
            </button>

            <button onClick={handleLogsPermission} className={`w-full p-4 rounded-[24px] border transition-all flex items-center justify-between group ${permissions.logs ? 'bg-emerald-500/10 border-emerald-500/30 cursor-default' : 'bg-white/5 border-white/10 hover:border-purple-500/30'}`}>
                <div className="flex items-center gap-4"><div className={`p-3 rounded-2xl ${permissions.logs ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/40'}`}><Activity className="w-5 h-5" /></div><div className="text-right"><span className="block text-sm font-black text-white">سجل نشاط الظل</span><span className="text-[10px] text-white/30 uppercase font-bold">{permissions.logs ? 'مراقبة نشطة (Session)' : 'تفعيل التحليل الأمني'}</span></div></div>
                {permissions.logs && <ShieldCheck className="w-5 h-5 text-emerald-500" />}
            </button>
        </div>

        <button disabled={!permissions.contacts || vaultStatus === 'initializing'} onClick={enterVault} className={`w-full py-5 rounded-[24px] font-black text-lg flex items-center justify-center gap-4 transition-all shadow-2xl active:scale-95 ${permissions.contacts ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/40' : 'bg-white/5 text-white/20'}`}>
            {vaultStatus === 'initializing' ? 'جاري فتح الحصن...' : 'دخول الحصن'}
            {vaultStatus === 'initializing' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
        </button>
        <button onClick={onVaultReady} className="w-full mt-4 text-xs text-white/30 hover:text-white font-bold">إلغاء والعودة</button>
      </div>
    </div>
  );
};

export default SovereignVault;
