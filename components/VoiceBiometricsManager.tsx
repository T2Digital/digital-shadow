import React, { useState, useEffect } from 'react';
import { Shield, Plus, X, Trash2, Edit2, Check, Mic, Loader2 } from 'lucide-react';
import { voiceBiometrics, VoiceProfile } from '../services/voiceBiometricsService';

interface Props {
  onClose: () => void;
  onSignaturesUpdated: () => void;
}

export const VoiceBiometricsManager: React.FC<Props> = ({ onClose, onSignaturesUpdated }) => {
  const [signatures, setSignatures] = useState<VoiceProfile[]>(voiceBiometrics.getSignatures());
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const refreshSignatures = () => {
    setSignatures([...voiceBiometrics.getSignatures()]);
    onSignaturesUpdated();
  };

  const handleEnroll = async () => {
    setIsEnrolling(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const newName = `بصمة ${signatures.length + 1}`;
      await voiceBiometrics.enroll(stream, newName, 4000);
      stream.getTracks().forEach(track => track.stop());
      refreshSignatures();
      alert("تم تسجيل البصمة الصوتية بنجاح!");
    } catch (e) {
      console.error("Voice enrollment failed", e);
      alert("فشل تسجيل البصمة الصوتية. تأكد من صلاحيات المايكروفون.");
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("هل أنت متأكد من مسح هذه البصمة؟")) {
      voiceBiometrics.deleteSignature(id);
      refreshSignatures();
    }
  };

  const handleStartEdit = (sig: VoiceProfile) => {
    setEditingId(sig.id);
    setEditName(sig.name);
  };

  const handleSaveEdit = (id: string) => {
    if (editName.trim()) {
      voiceBiometrics.updateSignatureName(id, editName.trim());
      refreshSignatures();
    }
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-[600] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in" dir="rtl">
      <div className="bg-[#151515] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#0a0a0a]">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-xl">
                    <Shield className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                    <h3 className="font-bold text-white tracking-wide">البصمة الصوتية</h3>
                    <p className="text-[10px] text-white/40">التحكم في الأصوات المسموح لها بإعطاء أوامر للظل</p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/50 hover:text-red-400 transition-all">
                <X className="w-5 h-5" />
            </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {signatures.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 text-white/10 mx-auto mb-3" />
              <p className="text-white/50 text-sm">لا توجد بصمات صوتية مسجلة.</p>
              <p className="text-white/40 text-[10px] mt-1 mb-4">الظل سيستجيب لأي صوت حتى تقوم بتسجيل بصمتك.</p>
            </div>
          ) : (
            <div className="space-y-3 mb-6">
              {signatures.map(sig => (
                <div key={sig.id} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10">
                  <div className="flex-1 min-w-0 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-600/20 flex items-center justify-center shrink-0">
                      <Mic className="w-4 h-4 text-purple-400" />
                    </div>
                    {editingId === sig.id ? (
                      <input 
                        type="text" 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="bg-[#0a0a0a] border border-purple-500/50 text-white text-sm rounded-lg px-2 py-1 w-full focus:outline-none focus:border-purple-500"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(sig.id)}
                      />
                    ) : (
                      <span className="text-white text-sm truncate font-medium">{sig.name}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0 mr-3">
                    {editingId === sig.id ? (
                      <button onClick={() => handleSaveEdit(sig.id)} className="p-1.5 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors">
                        <Check className="w-4 h-4" />
                      </button>
                    ) : (
                      <button onClick={() => handleStartEdit(sig)} className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => handleDelete(sig.id)} className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button 
            disabled={isEnrolling}
            onClick={handleEnroll}
            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${isEnrolling ? 'bg-purple-900/50 text-purple-300 border border-purple-500/30' : 'bg-purple-600 hover:bg-purple-500 text-white border border-purple-400/20'}`}
          >
            {isEnrolling ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                جاري التسجيل... (تحدث لمدة 4 ثوانٍ)
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                إضافة بصمة صوتية جديدة
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
