import React, { useState, useEffect, useRef } from 'react';
import { Mic, Loader2, Ear, User, X } from 'lucide-react';
import { voiceBiometrics } from '../services/voiceBiometricsService';
import { getShadowResponse, playShadowVoice, stopVoice, resumeAudioContext } from '../services/geminiService';
import { UserProfile } from '../services/dbService';

export const AssistantWidget: React.FC<{ user: UserProfile, onOpenApp: () => void }> = ({ user, onOpenApp }) => {
  const [appState, setAppState] = useState<'idle' | 'listening' | 'processing' | 'playing'>('idle');
  const [transcript, setTranscript] = useState('');
  
  const recognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
     return () => {
         stopCurrentAction();
     };
  }, []);

  const stopCurrentAction = () => {
      if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch(e){}
      }
      if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (audioRef.current) {
          audioRef.current.pause();
      }
      stopVoice();
      setAppState('idle');
      setTranscript('');
  };

  const startListening = async () => {
      try {
          await resumeAudioContext();
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamRef.current = stream;

          setAppState('listening');
          setTranscript('أنا أسمعك...');

          // Voice Biometrics Check
          if (voiceBiometrics.hasSignature()) {
              const { verified, maxSimilarity } = await voiceBiometrics.verify(stream, 2000);
              if (!verified) {
                  stopCurrentAction();
                  setTranscript('عفواً، البصمة الصوتية غير متطابقة.');
                  setTimeout(() => setTranscript(''), 3000);
                  return;
              }
          }

          const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
          if (!SpeechRecognition) {
              setTranscript('التعرف على الصوت غير مدعوم في متصفحك.');
              setTimeout(stopCurrentAction, 3000);
              return;
          }

          const rec = new SpeechRecognition();
          rec.continuous = false;
          rec.interimResults = true;
          rec.lang = 'ar-EG';
          recognitionRef.current = rec;

          let finalTranscript = '';

          rec.onresult = (e: any) => {
              let currentInterim = '';
              for (let i = e.resultIndex; i < e.results.length; ++i) {
                  if (e.results[i].isFinal) {
                      finalTranscript += e.results[i][0].transcript;
                  } else {
                      currentInterim += e.results[i][0].transcript;
                  }
              }
              setTranscript(finalTranscript || currentInterim);
          };

          rec.onend = async () => {
              if (finalTranscript) {
                  processCommand(finalTranscript);
              } else {
                  stopCurrentAction();
              }
          };

          rec.start();

      } catch (e) {
          console.error("Mic access denied or error:", e);
          stopCurrentAction();
          setTranscript('حدث خطأ في الميكروفون');
      }
  };

  const processCommand = async (text: string) => {
      setAppState('processing');
      setTranscript(text);

      try {
          // Send to Gemini
          const response = await getShadowResponse([], text, undefined, user);
          
          setAppState('playing');
          setTranscript(response.text.substring(0, 50) + (response.text.length > 50 ? '...' : ''));

          // Play audio
          await playShadowVoice(response.text, 'male', undefined, () => {
              stopCurrentAction();
          });

      } catch (error) {
          console.error("Gemini processing error:", error);
          setTranscript('حدث خطأ أثناء معالجة الطلب.');
          setTimeout(stopCurrentAction, 3000);
      }
  };

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none flex items-start justify-center pt-10 px-4 font-['Cairo']">
      <div className={`bg-[#0a0a0a]/95 backdrop-blur-xl border p-3 rounded-[32px] shadow-2xl pointer-events-auto flex items-center gap-4 transition-all duration-300 transform scale-100 max-w-[90vw] overflow-hidden ${
          appState === 'listening' ? 'border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.3)]' :
          appState === 'processing' ? 'border-purple-500 shadow-[0_0_40px_rgba(168,85,247,0.3)]' :
          appState === 'playing' ? 'border-cyan-500 shadow-[0_0_40px_rgba(6,182,212,0.3)]' :
          'border-white/10'
      }`}>
        
        {appState !== 'idle' && (
           <button onClick={stopCurrentAction} className="p-2 shrink-0 bg-white/5 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-all">
               <X className="w-5 h-5" />
           </button>
        )}

        {(appState !== 'idle' || transcript) && (
           <div className="flex flex-col flex-1 min-w-[150px] overflow-hidden px-2">
               <span className={`text-[10px] font-bold mb-1 ${
                   appState === 'listening' ? 'text-red-400' :
                   appState === 'processing' ? 'text-purple-400' :
                   appState === 'playing' ? 'text-cyan-400' :
                   'text-amber-400'
               }`}>
                   {appState === 'listening' ? 'الظل يستمع...' :
                    appState === 'processing' ? 'جاري التحليل التكتيكي...' :
                    appState === 'playing' ? 'الظل يتحدث' :
                    'تنبيه'}
               </span>
               <p className="text-white text-sm truncate font-medium" dir="rtl">{transcript}</p>
           </div>
        )}

        <button 
           onClick={() => {
              if (appState !== 'idle') {
                  stopCurrentAction();
              } else {
                  startListening();
              }
           }}
           onDoubleClick={onOpenApp}
           className={`w-14 h-14 shrink-0 rounded-full flex items-center justify-center transition-all ${
               appState === 'listening' ? 'bg-red-500 scale-105 shadow-[0_0_30px_rgba(239,68,68,0.6)]' :
               appState === 'processing' ? 'bg-purple-600 opacity-50 cursor-wait' :
               appState === 'playing' ? 'bg-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.6)]' :
               'bg-white/10 hover:bg-white/20 hover:scale-105 shadow-xl'
           }`}
           title="انقر للتحدث، مرتين لفتح التطبيق بالكامل"
        >
           {appState === 'processing' ? <Loader2 className="w-6 h-6 text-white animate-spin" /> :
            appState === 'playing' ? (
                <div className="flex gap-1 items-center justify-center h-full">
                   <div className="w-1 bg-white animate-[bounce_1s_infinite]" style={{height: '10px'}} />
                   <div className="w-1 bg-white animate-[bounce_1.2s_infinite]" style={{height: '18px', animationDelay: '0.1s'}} />
                   <div className="w-1 bg-white animate-[bounce_0.8s_infinite]" style={{height: '14px', animationDelay: '0.2s'}} />
               </div>
            ) :
            appState === 'listening' ? <Ear className="w-6 h-6 text-white animate-pulse" /> : 
            <Mic className="w-6 h-6 text-white" />}
        </button>
      </div>
    </div>
  );
};

