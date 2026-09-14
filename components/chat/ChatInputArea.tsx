import React, { useRef } from 'react';
import { Send, Mic, Ear, Paperclip, Camera, Loader2, X, DollarSign, Brain, Monitor } from 'lucide-react';
import { UserProfile } from '../../services/dbService';

interface ChatInputAreaProps {
  input: string;
  setInput: (val: string) => void;
  pendingMedia: { data: string, type: string, originalFile: File } | null;
  setPendingMedia: (media: { data: string, type: string, originalFile: File } | null) => void;
  isProcessingImage: boolean;
  isSentinelMode: boolean;
  isRestrictedMode: boolean;
  isAdmin: boolean;
  isLimitReached: boolean;
  onUpgrade: () => void;
  onOpenAffiliate?: () => void;
  startListening: () => void;
  handleSend: (forcedText?: string, audioBlob?: Blob, existingAudioBase64?: string, isHiddenAction?: boolean, ignoreLimit?: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  cameraInputRef: React.RefObject<HTMLInputElement>;
  currentUser: UserProfile;
  handleScreenCapture?: () => void;
}

export const ChatInputArea: React.FC<ChatInputAreaProps> = ({
  input, setInput, pendingMedia, setPendingMedia, isProcessingImage, isSentinelMode, isRestrictedMode, isAdmin, isLimitReached, onUpgrade, onOpenAffiliate, startListening, handleSend, fileInputRef, cameraInputRef, currentUser, handleScreenCapture
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value);

  return (
    <>
      <div className={`fixed bottom-[32px] left-0 w-full p-3 md:p-4 bg-[#0a0a0a] border-t border-white/5 z-50 transition-all duration-500 ${isLimitReached ? 'opacity-0 pointer-events-none translate-y-full' : 'opacity-100'}`}>
        {pendingMedia && (
          <div className="mb-2 flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg w-fit border border-white/10">
            <span className="text-[10px] text-white/70 font-bold">{pendingMedia.type.startsWith('video/') ? 'فيديو مرفق' : 'صورة مرفقة'}</span>
            <button onClick={() => setPendingMedia(null)}><X className="w-3 h-3 text-white/50 hover:text-red-400" /></button>
          </div>
        )}
        <div className="flex items-end gap-2 max-w-4xl mx-auto w-full">
            <div className="flex-1 bg-[#151515] border border-white/10 rounded-[24px] flex items-end p-2 focus-within:border-cyan-500/30 transition-colors shadow-inner">
                <div className="flex items-center gap-1 mb-0.5">
                    <button disabled={isProcessingImage} onClick={() => { if(fileInputRef.current) { fileInputRef.current.value = ''; fileInputRef.current.click(); } }} className={`p-2 transition-colors hover:bg-white/5 rounded-full ${isProcessingImage ? 'text-purple-500 animate-pulse' : 'text-white/20 hover:text-white'}`} title="إرفاق صورة">{isProcessingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}</button>
                    <button disabled={isProcessingImage} onClick={() => { if(cameraInputRef.current) { cameraInputRef.current.value = ''; cameraInputRef.current.click(); } }} className={`p-2 transition-colors hover:bg-white/5 rounded-full ${isProcessingImage ? 'text-purple-500 animate-pulse' : 'text-white/20 hover:text-white'}`} title="التقاط صورة/فيديو"><Camera className="w-5 h-5" /></button>
                    {handleScreenCapture && (
                      <button disabled={isProcessingImage} onClick={handleScreenCapture} className={`p-2 transition-colors hover:bg-white/5 rounded-full ${isProcessingImage ? 'text-purple-500 animate-pulse' : 'text-emerald-500/50 hover:text-emerald-400'}`} title="مشاركة الشاشة للظل"><Monitor className="w-5 h-5" /></button>
                    )}
                </div>
                <textarea 
                    value={input} 
                    onChange={handleInputChange} 
                    onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} 
                    placeholder={isRestrictedMode ? "اكتب رسالتك (فترة تجربة)..." : (isSentinelMode ? "وضع الحارس مفعل... (قول يا ظل)" : (isAdmin ? "أمرك يا ريس..." : "قولي يا ريس..."))} 
                    className="flex-1 bg-transparent border-none text-sm text-white placeholder:text-white/20 focus:ring-0 resize-none min-h-[50px] max-h-[150px] py-3 px-2 scrollbar-hide font-medium leading-relaxed outline-none focus:outline-none" 
                    rows={1} 
                    style={{ height: 'auto', minHeight: '50px' }} 
                    onInput={(e) => { const target = e.target as HTMLTextAreaElement; target.style.height = 'auto'; target.style.height = `${Math.min(target.scrollHeight, 150)}px`; }} 
                />
                {(input.trim() || pendingMedia) && <button onClick={() => handleSend()} className="p-3 bg-cyan-600 hover:bg-cyan-500 rounded-full transition-all shadow-lg hover:shadow-cyan-600/20 mb-0.5 animate-in zoom-in" style={{ backgroundColor: currentUser.interfaceColor || undefined, boxShadow: currentUser.interfaceColor ? `0 4px 14px ${currentUser.interfaceColor}40` : undefined }}><Send className="w-5 h-5 text-white" /></button>}
            </div>
            <button onClick={startListening} className={`p-4 rounded-[24px] border shadow-lg transition-all active:scale-95 mb-0.5 ${isSentinelMode ? 'bg-red-900/20 border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white' : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10'}`}><Mic className="w-6 h-6" /></button>
        </div>
      </div>

      {isLimitReached && (
          <div className="fixed bottom-[32px] left-0 w-full p-4 bg-[#111] border-t border-red-500/30 z-50 text-center animate-in slide-in-from-bottom-full">
              <p className="text-red-400 font-bold mb-3">انتهت فترة التجربة (3 أيام)</p>
              <div className="flex flex-col items-center justify-center gap-3">
                  <div className="flex items-center gap-3">
                      <button onClick={onUpgrade} className="px-6 py-2 bg-amber-500 text-black rounded-full font-black text-sm hover:scale-105 transition-transform shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                          اشترك الآن
                      </button>
                      {onOpenAffiliate && (
                          <button onClick={onOpenAffiliate} className="px-5 py-2 bg-emerald-500 text-black rounded-full font-black text-sm hover:scale-105 transition-transform shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center gap-2">
                              <DollarSign className="w-4 h-4" /> اعمل فلوس
                          </button>
                      )}
                  </div>
                  {currentUser.affiliate && (
                      <button onClick={() => {
                          handleSend("اكتب لي إعلان تسويقي جذاب جداً عنك (الظل) عشان أنشره على السوشيال ميديا وأجيب مشتركين من خلال رابط الإحالة بتاعي.", undefined, undefined, false, true);
                      }} className="px-5 py-2 bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-full font-bold text-xs hover:bg-purple-600/50 transition-colors flex items-center gap-2">
                          <Brain className="w-4 h-4" /> خلي الظل يكتب لك إعلان تنشره
                      </button>
                  )}
              </div>
          </div>
      )}
    </>
  );
};
