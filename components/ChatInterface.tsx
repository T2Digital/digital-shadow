import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Mic, Waves, Square, Volume2, VolumeX, Play, Pause, Brain, Activity, Mic2, Paperclip, X, Zap, Lock, Crown, Globe, Sun, ArrowLeft, Loader2, Sparkles, ArrowRight, DollarSign, RotateCcw, Home, Clock, MessageCircle, Share2, Copy, Shield, Download, Smartphone, Cpu, HelpCircle, Star, Search, ExternalLink, PhoneCall, CheckCircle, Ear, RefreshCw, StopCircle, MapPin, Hotel, Music, Video, Grid, Camera, Edit3, Car, Landmark, CreditCard, FileText, Printer, PenTool, Layout, Calculator, Terminal, Cloud, CloudOff, AlertTriangle, FolderOpen, Key, Briefcase } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { App as CapacitorApp } from '@capacitor/app';
import { getShadowResponse, playShadowVoice, stopVoice, getShadowVoice, resumeAudioContext, audioCache, memorizeFact, generateImageNative, autonomousLearningRoutine, generateMp3FromShadowVoice } from '../services/geminiService';
import { shadowDB, DBMessage, DBTask, UserProfile } from '../services/dbService';
import { submitAutonomousTask } from '../services/autonomousAgentService';
import { getDeviceContext, performNativeAction } from '../services/deviceService';
import { WakeWordEngine } from '../services/wakeWordService';
import { voiceBiometrics } from '../services/voiceBiometricsService';
const CapabilitiesGuide = React.lazy(() => import('./CapabilitiesGuide'));
const VoiceBiometricsManager = React.lazy(() => import('./VoiceBiometricsManager').then(m => ({ default: m.VoiceBiometricsManager })));
const NativeSettings = React.lazy(() => import('./NativeSettings').then(m => ({ default: m.NativeSettings })));
const WorkspaceFileViewer = React.lazy(() => import('./chat/WorkspaceFileViewer').then(m => ({ default: m.WorkspaceFileViewer })));
const VoiceShareDialog = React.lazy(() => import('./chat/VoiceShareDialog').then(m => ({ default: m.VoiceShareDialog })));
import { ListeningOverlay } from './chat/ListeningOverlay';
const SensoryHUD = React.lazy(() => import('./SensoryHUD').then(m => ({ default: m.SensoryHUD })));
const MemoryVault = React.lazy(() => import('./MemoryVault').then(m => ({ default: m.MemoryVault })));
const LiveAPIMode = React.lazy(() => import('./LiveAPIMode').then(m => ({ default: m.LiveAPIMode })));
const PersonalKeysManager = React.lazy(() => import('./chat/PersonalKeysManager').then(m => ({ default: m.PersonalKeysManager })));
import { TopNavigation } from './chat/TopNavigation';
import { MessageBubble } from './chat/MessageBubble';
import { ShadowFace } from './ShadowFace';
import { renderChatCard } from './chat/ChatCardsRenderer';
import LiveAgentAction from './LiveAgentAction';
import { ChatInputArea } from './chat/ChatInputArea';
import { ToolCardRenderer, handleAppCardAction, getCardIcon } from './chat/ToolCardRenderer';
const PredictiveAnalyticsBoard = React.lazy(() => import('./chat/PredictiveAnalyticsBoard').then(m => ({ default: m.PredictiveAnalyticsBoard })));
import { useAppStore } from '../services/store';
import { useChatStore } from '../services/chatStore';
const AutonomousManager = React.lazy(() => import('./AutonomousManager').then(m => ({ default: m.AutonomousManager })));
const LiveTradingBoard = React.lazy(() => import('./LiveTradingBoard').then(m => ({ default: m.LiveTradingBoard })));
const LocalDeepDive = React.lazy(() => import('./LocalDeepDive').then(m => ({ default: m.LocalDeepDive })));
const ShadowMeshSync = React.lazy(() => import('./ShadowMeshSync').then(m => ({ default: m.ShadowMeshSync })));

interface Props {
    onBack: () => void; 
    onNavigateTo?: (section: string) => void; 
}

interface ExtendedMessage extends DBMessage {
    isError?: boolean;
}

const compressImage = (file: File): Promise<{ data: string, type: string, originalFile: File }> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800; 
                const scaleSize = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scaleSize;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    resolve({ data: dataUrl, type: 'image/jpeg', originalFile: file });
                }
            };
        };
    });
};

const highlightText = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={index} className="font-extrabold">{part.slice(2, -2)}</strong>;
        }
        return part;
    });
};

const ChatInterface: React.FC<Props> = ({ onBack, onNavigateTo }) => {
  const { user, handleUpgradeRequest: onUpgrade, latestSystemMessage: incomingSystemMessage } = useAppStore();
  const currentUser = user!;
  const isAdmin = currentUser ? (currentUser.email === 'TITO' || currentUser.email === 'tito@shadow.com' || currentUser.email === 'admin@shadow.com' || currentUser.email === 'ahmed.atya.daif@gmail.com' || (currentUser.tier === 'sovereign' && currentUser.name.includes('تيتو'))) : false;

  const [messages, setMessages] = useState<ExtendedMessage[]>([]);
  
  const messagesPerPage = 50;
  
  
    const {
      input, setInput, appStatus, setAppStatus, isMuted, setIsMuted, isSentinelMode, setIsSentinelMode, isSearchActive, setIsSearchActive,
      page, setPage, hasMoreMessages, setHasMoreMessages, speechSupported, setSpeechSupported, liveTranscript, setLiveTranscript,
      showCapabilities, setShowCapabilities, isProcessingImage, setIsProcessingImage, audioLevel, setAudioLevel, showBigFace, setShowBigFace,
      searchQuery, setSearchQuery, isOffline, setIsOffline, thinkingStep, setThinkingStep, isDreaming, setIsDreaming
  } = useChatStore();
  const appStatusRef = useRef(appStatus);
  useEffect(() => { appStatusRef.current = appStatus; }, [appStatus]);
  
  
  const wakeWordEngineRef = useRef<WakeWordEngine | null>(null);

  useEffect(() => {
      wakeWordEngineRef.current = new WakeWordEngine(() => {
          // When wake word is detected, trigger the main listening function
          try { Haptics.impact({ style: ImpactStyle.Heavy }); } catch(e) {}
          startListening();
      });

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
          setSpeechSupported(false);
      }

      return () => {
          if (wakeWordEngineRef.current) {
              wakeWordEngineRef.current.stop();
          }
      };
  }, []);

  const [pendingMedia, setPendingMedia] = useState<{data: string, type: string, originalFile: File} | null>(null);
  const [visualLevels, setVisualLevels] = useState<number[]>(new Array(20).fill(5));
  
  const [playingMessageId, setPlayingMessageId] = useState<number | null>(null);
  
  
  
  
  
  
  const wakeLockRef = useRef<any>(null);
  
  
  
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('synced');
  

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  const [showVoiceBiometricsManager, setShowVoiceBiometricsManager] = useState(false);
  const [showMemoryVault, setShowMemoryVault] = useState(false);
  const [showLiveAPIMode, setShowLiveAPIMode] = useState(false);
  const [showAutonomousManager, setShowAutonomousManager] = useState(false);
  const [showLocalDeepDive, setShowLocalDeepDive] = useState(false);
  const [showShadowMesh, setShowShadowMesh] = useState(false);
  const [hasVoiceSignature, setHasVoiceSignature] = useState(voiceBiometrics.hasSignature());
  const [selectedWorkspaceFile, setSelectedWorkspaceFile] = useState<any>(null);
  const [workspaceTab, setWorkspaceTab] = useState<'l0' | 'l1' | 'l2'>('l2');
  
  

  useEffect(() => {
    let idleTimer: NodeJS.Timeout;
    const resetIdle = () => {
        setIsDreaming(false);
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => setIsDreaming(true), 120000); // 2 minutes to dream
    };

    window.addEventListener('mousemove', resetIdle);
    window.addEventListener('keydown', resetIdle);
    window.addEventListener('touchstart', resetIdle);
    window.addEventListener('click', resetIdle);
    
    resetIdle();
    
    return () => {
        window.removeEventListener('mousemove', resetIdle);
        window.removeEventListener('keydown', resetIdle);
        window.removeEventListener('touchstart', resetIdle);
        window.removeEventListener('click', resetIdle);
        clearTimeout(idleTimer);
    };
  }, []);

  useEffect(() => {
    if (appStatus === 'thinking') {
      setThinkingStep(0);
      const interval = setInterval(() => {
        (useChatStore.getState().setThinkingStep(useChatStore.getState().thinkingStep + 1));
      }, 1800);
      return () => clearInterval(interval);
    }
  }, [appStatus]);

  const userAudioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastSystemMessageIdRef = useRef<number | undefined>(undefined);

  const [showPersonalKeys, setShowPersonalKeys] = useState(false);
  const [showNativeSettings, setShowNativeSettings] = useState(false);
  const [showTradingBoard, setShowTradingBoard] = useState(false);
  const [personalKeys, setPersonalKeys] = useState(currentUser.personalKeys || {});

  const handleSavePersonalKeys = async () => {
      const updatedUser = { ...currentUser, personalKeys };
      await shadowDB.saveProfile(updatedUser);
      setShowPersonalKeys(false);
      alert('تم حفظ مفاتيحك الخاصة بنجاح!');
  };
  const isSubmittingRef = useRef(false);
  
  const lastSpeechTimeRef = useRef<number>(0);
  const silenceCheckIntervalRef = useRef<any>(null);
  const shouldContinueListeningRef = useRef(false); 
  const currentTranscriptRef = useRef('');

  const isTito = currentUser.email === 'admin@shadow.com' || isAdmin;
  const isRestrictedMode = !isTito && (currentUser.email === 'GUEST' || (currentUser.tier === 'lite' && currentUser.affiliate?.isMarketer));
  const [isLimitReached, setIsLimitReached] = useState(false);

  const suspendSentinel = () => {
      if (isSentinelMode && passiveRecognitionRef.current) {
          try { passiveRecognitionRef.current.stop(); } catch(e){}
      }
  };

  const resumeSentinel = () => {
      // Logic handled by useEffect below to avoid stale state closures
  };

  useEffect(() => {
      if (appStatus === 'idle' && isSentinelMode && !shouldContinueListeningRef.current) {
          const timer = setTimeout(() => {
              startPassiveListening();
          }, 500);
          return () => clearTimeout(timer);
      }
  }, [appStatus, isSentinelMode]);

  useEffect(() => {
      shadowDB.onSyncStatusChange = (status) => {
          setSyncStatus(status);
      };
      return () => {
          shadowDB.onSyncStatusChange = null;
      };
  }, []);

  useEffect(() => {
      const resumeAudio = () => {
          resumeAudioContext();
      };
      window.addEventListener('click', resumeAudio);
      window.addEventListener('touchstart', resumeAudio);
      return () => {
          window.removeEventListener('click', resumeAudio);
          window.removeEventListener('touchstart', resumeAudio);
      };
  }, []);

  useEffect(() => {
    if (isRestrictedMode) {
        const trialStartStr = localStorage.getItem('shadow_guest_start');
        if (trialStartStr) {
            const trialStart = parseInt(trialStartStr);
            const now = Date.now();
            const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
            if (now - trialStart > threeDaysMs) setIsLimitReached(true);
            else setIsLimitReached(false);
        } else {
            setIsLimitReached(false);
        }
    } else {
        setIsLimitReached(false);
    }
  }, [isRestrictedMode]);

  const getGreetingSubtitle = () => {
      if (isTito) return `مرحباً تيتو (الماستر)`;
      if (currentUser.email === 'GUEST') return "مرحباً ضيف الظل";
      if (currentUser.affiliate?.isMarketer && currentUser.tier === 'lite') return `مرحباً ${currentUser.name.split(' ')[0]} (شريك)`;
      return `مرحباً ${currentUser.name.split(' ')[0]} (عضو نخبة)`;
  };

  useEffect(() => {
      let isMounted = true;
      const loadHistory = async () => {
          try {
              const uid = currentUser.email || 'GUEST';
              if (uid !== 'GUEST' && page === 1) {
                  await shadowDB.syncHistoryFast(uid);
              }
              const limit = messagesPerPage;
              const offset = (page - 1) * messagesPerPage;
              const paginatedHist = await shadowDB.getHistory(uid, limit, offset);
              
              if (isMounted) {
                  if (paginatedHist.length < messagesPerPage) {
                      setHasMoreMessages(false);
                  }

                  setMessages(prev => {
                      const existingIds = new Set(prev.map(m => m.id));
                      const newMsgs = paginatedHist.filter(m => !existingIds.has(m.id));
                      return [...newMsgs, ...prev].sort((a,b) => a.timestamp - b.timestamp);
                  });
              }
          } catch(e) { console.warn("History Load Error", e); }
      };
      
      loadHistory();

      if (currentUser.email !== 'GUEST') {
          shadowDB.subscribeToRealtime(currentUser.email, (table, payload) => {
              if (table === 'history' && isMounted) {
                  const newMsg = payload as DBMessage;
                  setMessages(prev => {
                      if (prev.some(m => m.timestamp === newMsg.timestamp)) return prev;
                      return [...prev, newMsg].sort((a,b) => a.timestamp - b.timestamp);
                  });
              }
          });
      }
      return () => { 
          isMounted = false; 
          shadowDB.unsubscribeRealtime();
      };
  }, [currentUser.email, page]);

  useEffect(() => {
      if (incomingSystemMessage && incomingSystemMessage.timestamp !== lastSystemMessageIdRef.current) {
          lastSystemMessageIdRef.current = incomingSystemMessage.timestamp;
          setMessages(prev => [...prev, incomingSystemMessage]);
      }
  }, [incomingSystemMessage]);

  useEffect(() => {
      const handleAutonomousMessage = async () => {
          const uid = currentUser.email || 'GUEST';
          const paginatedHist = await shadowDB.getHistory(uid, 50, 0); // Always fetch latest
          setMessages(paginatedHist.reverse());
      };
      
      const handleShadowNewMessage = (e: any) => {
          const msg = e.detail;
          setMessages(prev => {
              if (prev.some(m => m.id === msg.id)) return prev;
              return [...prev, msg];
          });
      };
      
      window.addEventListener('autonomous_message_received', handleAutonomousMessage);
      window.addEventListener('shadow_new_message', handleShadowNewMessage);
      return () => {
          window.removeEventListener('autonomous_message_received', handleAutonomousMessage);
          window.removeEventListener('shadow_new_message', handleShadowNewMessage);
      };
  }, [currentUser.email]);

  useEffect(() => {
    // Poll for collaborative shadow messages every 15 seconds
    const pollShadowMessages = async () => {
        const userId = currentUser.email;
        const shadowId = currentUser.shadowId;
        if (!userId && !shadowId) return;
        try {
            const msgs = [];
            if (userId) {
                const userMsgs = await shadowDB.getShadowMessages(userId);
                msgs.push(...userMsgs);
            }
            if (shadowId) {
                const shadowMsgs = await shadowDB.getShadowMessages(shadowId);
                msgs.push(...shadowMsgs);
            }
            
            // Filter unique pending messages for this user
            const pendingMsgs = msgs.filter((m: any, index: number, self: any[]) => 
                (m.toUserId === userId || m.toUserId === shadowId) && 
                m.status === 'pending' &&
                index === self.findIndex((t) => t.id === m.id)
            );

            for (let msg of pendingMsgs) {
                // Update status instantly to avoid duplicate processing
                await shadowDB.addShadowMessage({ ...msg, status: 'delivered' });
                
                // Inject message to AI via handleSend silently
                const hiddenPrompt = `[COLLABORATIVE_SHADOW_MESSAGE]\nالظل الخاص بالمستخدم (${msg.fromUserId}) يرسل لك هذه الرسالة التنسيقية:\n"${msg.content}"\n\n[INSTRUCTION]: هذه الرسالة جاءت لك في الخلفية. أخبر مستخدمك الحالي أنك تلقيت هذه الرسالة من ظل ${msg.fromUserId} واعرض عليه التعاون أو المزامنة!`;
                
                setTimeout(() => {
                    handleSend(hiddenPrompt, undefined, undefined, true);
                }, 100);
            }
        } catch (e) {
            console.error("Error polling shadow messages:", e);
        }
    };
    
    const interval = setInterval(pollShadowMessages, 15000);
    return () => clearInterval(interval);
  }, [currentUser.email]);

  useEffect(() => {
      const handleAudioLevel = (e: any) => setAudioLevel(e.detail.level);
      window.addEventListener('shadow_audio_level', handleAudioLevel);
      return () => window.removeEventListener('shadow_audio_level', handleAudioLevel);
  }, []);

  const keepAliveStreamRef = useRef<MediaStream | null>(null);

  const toggleSentinelMode = async () => {
      if (!isSentinelMode) {
          try {
              if ('wakeLock' in navigator) {
                  // @ts-ignore
                  wakeLockRef.current = await navigator.wakeLock.request('screen');
              }
          } catch (err) {}
          
          try {
              // Keep microphone active to avoid browser notification flashing
              keepAliveStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
          } catch (e) {}

          setIsSentinelMode(true);
          if (wakeWordEngineRef.current) wakeWordEngineRef.current.stop();
          startPassiveListening();
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
          audio.volume = 0.3;
          audio.play().catch(() => {});

      } else {
          if (wakeLockRef.current) {
              try { await wakeLockRef.current.release(); } catch(e){}
              wakeLockRef.current = null;
          }
          if (keepAliveStreamRef.current) {
              keepAliveStreamRef.current.getTracks().forEach(track => track.stop());
              keepAliveStreamRef.current = null;
          }
          setIsSentinelMode(false);
          stopPassiveListening();
          if (appStatus === 'idle') {
              setAppStatus('idle');
              if (wakeWordEngineRef.current) wakeWordEngineRef.current.start();
          }
      }
  };

  const passiveRecognitionRef = useRef<any>(null);
  
  const startPassiveListening = () => {
      if (shouldContinueListeningRef.current || appStatusRef.current === 'speaking') return;

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) return;
      
      if (passiveRecognitionRef.current) {
          try { passiveRecognitionRef.current.stop(); } catch(e) {}
      }

      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'ar-EG'; 

      rec.onresult = (e: any) => {
          if (shouldContinueListeningRef.current || isSubmittingRef.current || appStatusRef.current === 'speaking') return;
          const results = e.results;
          const transcript = results[results.length - 1][0].transcript.trim().toLowerCase();
          const wakeWords = ['يا ظل', 'يا شادو', 'يا تيتو', 'يا صاحبي', 'ya shadow', 'ya tito', 'ya sahby'];
          
          if (wakeWords.some(word => transcript.includes(word))) {
              stopPassiveListening(); 
              const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
              audio.volume = 0.5;
              audio.play().catch(() => {});
              startListening(); 
          }
      };

      rec.onend = () => {
          if (isSentinelMode && !shouldContinueListeningRef.current && !isSubmittingRef.current && appStatusRef.current !== 'speaking') {
              try { rec.start(); } catch(e) { setTimeout(startPassiveListening, 500); }
          }
      };
      
      try { rec.start(); } catch(e) {}
      passiveRecognitionRef.current = rec;
  };

  const stopPassiveListening = () => {
      if (passiveRecognitionRef.current) {
          try { passiveRecognitionRef.current.stop(); } catch(e) {}
          passiveRecognitionRef.current = null;
      }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change or on initial load
  useEffect(() => {
      if (scrollRef.current && page === 1) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
  }, [messages, appStatus, page]);

  // Force scroll to bottom after a slight delay to ensure rendering is complete
  useEffect(() => {
      const timer = setTimeout(() => {
          if (scrollRef.current && page === 1) {
              scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
      }, 100);
      return () => clearTimeout(timer);
  }, [messages.length, page]);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const activeRecognitionRef = useRef<any>(null);
  const rafIdRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const isCancelledRef = useRef<boolean>(false);

  const handleDeleteMessage = async (id: number) => {
      if (window.confirm("هل أنت متأكد من مسح هذه الرسالة؟")) {
          try {
              if (playingMessageId === id) {
                 handleStopPlayback();
              }
              await shadowDB.deleteMessage(id);
              setMessages(prev => prev.filter(m => m.id !== id));
          } catch (e) {
              console.error("Failed to delete message:", e);
          }
      }
  };

  const resetToIdle = useCallback(() => {
    if (isSubmittingRef.current) return;

    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
         recorderRef.current.onstop = null; 
         recorderRef.current.stop();
    }
    if (activeRecognitionRef.current) { 
        activeRecognitionRef.current.onend = null;
        activeRecognitionRef.current.stop(); 
        activeRecognitionRef.current = null; 
    }
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    if (silenceCheckIntervalRef.current) clearInterval(silenceCheckIntervalRef.current);

    shouldContinueListeningRef.current = false;
    currentTranscriptRef.current = '';
    isCancelledRef.current = false;
    
    setAppStatus('idle');
    setLiveTranscript('');
    setPendingMedia(null);

    // Resume Wake Word listening when idle, unless Sentinel Mode is active since it handles its own passive listening
    if (wakeWordEngineRef.current && !isSentinelMode) {
        wakeWordEngineRef.current.start();
    } else if (wakeWordEngineRef.current && isSentinelMode) {
        wakeWordEngineRef.current.stop();
    }

    if (isSentinelMode) setTimeout(startPassiveListening, 1000); 
  }, [isSentinelMode]);

  const startListening = async () => {
    if (isLimitReached || isSubmittingRef.current) return;
    
    try { await Haptics.impact({ style: ImpactStyle.Medium }); } catch(e) {}
    
    // Instant Barge-In: Stop all audio output and queue immediately when user initiates speech
    stopPassiveListening(); 
    stopVoice(); 
    setPlayingMessageId(null);
    resumeAudioContext(); 

    shouldContinueListeningRef.current = true;
    currentTranscriptRef.current = '';
    lastSpeechTimeRef.current = Date.now(); 
    
    setAppStatus('listening');
    setLiveTranscript('');
    isCancelledRef.current = false;

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          alert("عذراً، الميكروفون غير متوفر في هذا المتصفح.");
          resetToIdle();
          return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createMediaStreamSource(stream).context.createAnalyser();
      analyser.fftSize = 256; 
      source.connect(analyser);
      analyserRef.current = analyser;
      startWaveformLoop(); 

      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      
      recorder.onstop = () => { 
          stream.getTracks().forEach(track => track.stop()); 
      };
      recorder.start(100);
      recorderRef.current = recorder;

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
          const rec = new SpeechRecognition();
          rec.continuous = true;
          rec.interimResults = true;
          rec.lang = 'ar-EG';
          
          rec.onresult = (e: any) => {
              let interim = '';
              let final = '';
              for (let i = e.resultIndex; i < e.results.length; ++i) {
                  if (e.results[i].isFinal) final += e.results[i][0].transcript + ' '; 
                  else interim += e.results[i][0].transcript;
              }
              currentTranscriptRef.current = (currentTranscriptRef.current + final).replace(/undefined/g, ''); 
              setLiveTranscript(currentTranscriptRef.current + interim);
              
              if (final.trim() || interim.trim()) {
                  lastSpeechTimeRef.current = Date.now();
              }
          };
          
          rec.onend = () => {
              if (shouldContinueListeningRef.current && !isSubmittingRef.current && !isCancelledRef.current) {
                 try { rec.start(); } catch(e){}
              }
          }
          
          rec.start();
          activeRecognitionRef.current = rec;
      }

      // Voice Biometrics Verification
      if (voiceBiometrics.hasSignature()) {
          voiceBiometrics.verify(stream, 2000).then(result => {
              if (!result.verified && shouldContinueListeningRef.current) {
                  // Voice doesn't match
                  console.log("Voice verification failed. Similarity:", result.maxSimilarity);
                  cancelRecording();
                  const fakeMsg: ExtendedMessage = {
                      id: Date.now(),
                      role: 'model',
                      text: 'عذراً، البصمة الصوتية غير متطابقة. لا يمكنني تنفيذ الأمر.',
                      timestamp: Date.now(),
                      userId: currentUser.email || 'GUEST',
                      isError: true
                  };
                  setMessages(prev => [...prev, fakeMsg]);
                  playShadowVoice('عذراً، البصمة الصوتية غير متطابقة. لا يمكنني تنفيذ الأمر.', currentUser.voicePreference === 'female' ? 'female' : 'male');
              } else {
                  console.log("Voice verified. Similarity:", result.maxSimilarity);
              }
          });
      }

      if (silenceCheckIntervalRef.current) clearInterval(silenceCheckIntervalRef.current);
      silenceCheckIntervalRef.current = setInterval(() => {
          const timeSinceSpeech = Date.now() - lastSpeechTimeRef.current;
          if (timeSinceSpeech > 4000 && shouldContinueListeningRef.current && (currentTranscriptRef.current.trim().length > 2 || audioChunksRef.current.length > 10)) {
              stopListeningAndSend();
          }
      }, 500);

    } catch (e: any) { 
        console.error("Mic Error", e);
        let errorMsg = "فيه مشكلة في استخدام المايك.";
        if (e.name === 'NotAllowedError' || e.message?.includes('Permission denied')) {
            errorMsg = "انت رفضت صلاحية المايك يا ريس، أو المتصفح مانعها. ادخل على إعدادات المتصفح واسمح للمايك عشان أقدر أسمعك.";
        } else {
            errorMsg = "حصلت مشكلة في المايك: " + (e.message || String(e));
        }
        
        const fakeMsg: ExtendedMessage = {
            id: Date.now(),
            role: 'model',
            text: errorMsg,
            timestamp: Date.now(),
            userId: currentUser.email || 'GUEST',
            isError: true
        };
        setMessages(prev => [...prev, fakeMsg]);
        resetToIdle(); 
    }
  };

  const startWaveformLoop = () => {
    const dataArray = new Uint8Array(analyserRef.current?.frequencyBinCount || 0);
    const update = () => {
      if (analyserRef.current && shouldContinueListeningRef.current) {
        analyserRef.current.getByteFrequencyData(dataArray);
        const sum = dataArray.reduce((a, b) => a + b, 0);
        const average = sum / dataArray.length;
        if (average > 10) {
            lastSpeechTimeRef.current = Date.now();
        }
        setVisualLevels(Array.from(dataArray).slice(0, 20)); 
        rafIdRef.current = requestAnimationFrame(update);
      }
    };
    rafIdRef.current = requestAnimationFrame(update);
  };

  const stopListeningAndSend = () => {
      shouldContinueListeningRef.current = false;
      if (silenceCheckIntervalRef.current) clearInterval(silenceCheckIntervalRef.current);
      
      if (activeRecognitionRef.current) {
          activeRecognitionRef.current.onend = null; 
          activeRecognitionRef.current.stop();
          activeRecognitionRef.current = null;
      }
      
      if (recorderRef.current && recorderRef.current.state === 'recording') {
          recorderRef.current.onstop = () => {
              if (currentTranscriptRef.current.trim() || audioChunksRef.current.length > 5) {
                  const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                  handleSend(currentTranscriptRef.current, blob);
              } else {
                  resetToIdle();
              }
          };
          recorderRef.current.stop(); 
      } else {
          if (currentTranscriptRef.current.trim()) handleSend(currentTranscriptRef.current);
          else resetToIdle();
      }
  };

  const cancelRecording = () => {
      shouldContinueListeningRef.current = false;
      isCancelledRef.current = true;
      resetToIdle();
  };

  const handleSend = async (forcedText?: string, audioBlob?: Blob, existingAudioBase64?: string, isHiddenAction?: boolean, ignoreLimit?: boolean) => {
    if (isSubmittingRef.current || (isLimitReached && !ignoreLimit)) return;
    
    // Audio Keep-Alive
    const ctx = resumeAudioContext();
    if (ctx && !isMuted) {
        try {
            const silentBuffer = ctx.createBuffer(1, 1, 24000); 
            const source = ctx.createBufferSource();
            source.buffer = silentBuffer;
            source.connect(ctx.destination);
            source.start(0);
        } catch(e) {}
    }

    stopPassiveListening();
    stopVoice();

    const textToSend = forcedText || input;
    if ((!textToSend.trim() || textToSend.trim().length < 2) && !audioBlob && !pendingMedia && !existingAudioBase64) { 
        resetToIdle(); 
        return; 
    }

    isSubmittingRef.current = true;
    shouldContinueListeningRef.current = false;
    setIsSearchActive(false);
    
    const displayText = textToSend.trim() ? textToSend : ((audioBlob || existingAudioBase64) ? 'رسالة صوتية 🎤' : '');
    if (!isHiddenAction) setAppStatus('thinking');

    let userVoiceDataURI = existingAudioBase64 || '';
    let geminiAudioInput = ''; 
    
    if (existingAudioBase64) {
        geminiAudioInput = existingAudioBase64.includes(',') ? existingAudioBase64.split(',')[1] : existingAudioBase64;
    } else if (audioBlob) {
        userVoiceDataURI = await new Promise<string>((resolve) => { 
            const reader = new FileReader(); 
            reader.onload = () => resolve(reader.result as string); 
            reader.readAsDataURL(audioBlob); 
        });
        geminiAudioInput = userVoiceDataURI.split(',')[1];
    }

    const userMsg: ExtendedMessage = { 
        userId: currentUser.email || 'GUEST', 
        role: 'user', text: displayText, 
        timestamp: Date.now(), 
        image: pendingMedia?.type.startsWith('image/') ? pendingMedia?.data : undefined, 
        video: pendingMedia?.type.startsWith('video/') ? pendingMedia?.data : undefined,
        voiceData: userVoiceDataURI || undefined,
        isError: false,
        isHidden: isHiddenAction
    };
    
    let id = await shadowDB.saveMessage(userMsg);
    setMessages(prev => [...prev, { ...userMsg, id }]);
    
    const currentMedia = pendingMedia;
    if (!isHiddenAction) { setInput(''); setPendingMedia(null); setLiveTranscript(''); }
    abortControllerRef.current = new AbortController();

    try {
      let extra: any = undefined;
      if (geminiAudioInput) {
        extra = { data: geminiAudioInput, mimeType: 'audio/webm', type: 'audio' };
      } else if (currentMedia) {
        const base64Data = currentMedia.data.includes(',') ? currentMedia.data.split(',')[1] : currentMedia.data;
        extra = { 
          data: base64Data, 
          mimeType: currentMedia.type, 
          type: currentMedia.type.startsWith('video/') ? 'video' : 'image' 
        };
      }
      
      const history = await shadowDB.getHistory(currentUser.email || 'GUEST');
      const deviceCtx = await getDeviceContext();
      
      const result = await getShadowResponse(
          history.map(m => ({ role: m.role, parts: [{ text: m.text }] })), 
          displayText + "\n\n" + deviceCtx, 
          extra,
          currentUser,
          abortControllerRef.current.signal 
      );
      
      let finalResponseText = result.text;
      
      // Fallback text if tool was used but no text generated
      if (!finalResponseText && result.groundingLinks?.length > 0) {
          finalResponseText = "دي المصادر اللي لقيتها، بص عليها كده.";
      } else if (!finalResponseText && result.toolActions?.length > 0) {
          if (result.toolActions.some(t => t.name === 'system_terminal')) {
               finalResponseText = "ثواني بظبطلك الأكواد على السيرفر...";
          } else if (result.toolActions.some(t => t.name === 'auto_deployer')) {
              finalResponseText = "بجهزلك الأكواد عشان ارفعها على جيت هاب وانشرها دلوقتي، دقايق واللينك يكون معاك يا هندسة!";
          } else if (result.toolActions.some(t => t.name === 'crypto_trader')) {
              finalResponseText = "بحلل السوق وبظبط الماركت من بينانس، اصبر عليا ثواني يا ماستر..";
          } else if (result.toolActions.some(t => t.name === 'social_poster')) {
              finalResponseText = "بجهزلك البوست وبنزله على بيدج السوشيال حالا، متقلقش من حاجة.";
          } else {
               finalResponseText = "حاضر، هعملك اللي طلبته فوراً...";
          }
      }

      let uiCards: any[] = [];
      if (result.toolActions && result.toolActions.length > 0) {
          const { processToolActions } = await import('../services/chatToolHandler');
          uiCards = await processToolActions(result.toolActions, currentUser, { handleSend, setMessages, setShowTradingBoard: () => {} });
      }

      let voiceDataToSave: string | undefined = undefined;

      const modelMsg: ExtendedMessage = { 
          userId: currentUser.email || 'GUEST', 
          role: 'model', 
          text: finalResponseText, 
          timestamp: Date.now(), 
          groundingLinks: result.groundingLinks, 
          voiceData: voiceDataToSave, 
          isError: result.isError,
          uiCards: uiCards 
      };
      
      let modelId = await shadowDB.saveMessage(modelMsg);
      setMessages(prev => [...prev, { ...modelMsg, id: modelId }]);
      
      try { await Haptics.notification({ type: 'SUCCESS' as any }); } catch(e) {}
      
      isSubmittingRef.current = false;
      
      // Trigger Autonomous Learning in background
      if (currentUser.email !== 'GUEST') {
          autonomousLearningRoutine(currentUser.email, [...history, modelMsg], currentUser).catch(console.error);
      }

      // Always attempt to speak immediately unless explicitly muted, regardless of tools
      if (!isMuted && !result.isError && finalResponseText) {
          setPlayingMessageId(modelId);
          setAppStatus('speaking');
          resumeAudioContext();
          
          playShadowVoice(
              finalResponseText, 
              currentUser.voicePreference === 'female' ? 'female' : 'male', 
              undefined, 
              () => { 
                  setPlayingMessageId(null);
                  setAppStatus('idle'); 
                  if (isSentinelMode) resumeSentinel();
              },
              (loadedBase64) => {
                  setMessages(prev => prev.map(m => m.id === modelId ? { ...m, voiceData: loadedBase64 } : m));
                  shadowDB.updateMessage(modelId, { voiceData: loadedBase64 }).catch(() => {});
              }
          ).catch(e => {
              console.error("[Speech Playback Error]", e);
              setPlayingMessageId(null);
              setAppStatus('idle');
              if (isSentinelMode) resumeSentinel();
          });
      } else {
          setAppStatus('idle');
          if (isSentinelMode) resumeSentinel();
      }

    } catch (e: any) { 
        console.error("Error in handleSend:", e);
        const errorMsg: ExtendedMessage = {
            userId: currentUser.email || 'GUEST',
            role: 'model',
            text: "معلش يا ريس، حصل خطأ في النظام. ممكن تجرب تاني؟",
            timestamp: Date.now(),
            isError: true
        };
        setMessages(prev => [...prev, { ...errorMsg, id: Date.now() }]);
        isSubmittingRef.current = false;
        setAppStatus('idle');
        if (isSentinelMode) resumeSentinel();
    }
  };

  const [isSharingVoice, setIsSharingVoice] = useState<number | null>(null);
  const [preparedShareData, setPreparedShareData] = useState<{files: File[], title: string, text: string} | null>(null);

  const handleShareVoiceMessage = async (msg: DBMessage) => {
      setIsSharingVoice(msg.timestamp);
      try {
          const selectedVoice = currentUser.voicePreference === 'female' ? 'female' : 'male';
          let base64 = audioCache.get(msg.text);
          let neededFetch = false;
          if (!base64) {
              neededFetch = true;
              base64 = await getShadowVoice(msg.text, selectedVoice);
              if (base64) audioCache.set(msg.text, base64);
          }

          const voicePayload = await generateMp3FromShadowVoice(msg.text, selectedVoice);
          if (!voicePayload) {
              alert("عذراً، لم نتمكن من توليد الصوت للمشاركة.");
              return;
          }

          const parsedFile = voicePayload.file;

          const refCode = currentUser.affiliate?.referralCode || '';
          const referralLink = refCode ? `\n\nاشترك في الظل الرقمي واعمل نسختك من الرابط ده:\nhttps://Ez-zel.vercel.app?ref=${refCode}` : '';
          const shareText = `اسمع رد الظل 🤖🔥${referralLink}`;

          const shareObj = { title: 'صوت الظل', text: shareText, files: [parsedFile] };

          if (neededFetch) {
              // Store it and wait for next explicit user click
              setPreparedShareData(shareObj);
          } else {
              // Direct share immediately since no await stalled us
              if (navigator.canShare && navigator.canShare({ files: [parsedFile] })) {
                  try {
                      await navigator.share(shareObj);
                  } catch (err: any) {
                      if (err.name !== 'AbortError') setPreparedShareData(shareObj);
                  }
              } else {
                  setPreparedShareData(shareObj);
              }
          }
      } catch (e) {
          console.error("Share voice error:", e);
      } finally {
          setIsSharingVoice(null);
      }
  };

  const handleShareMessage = async (text: string) => {
      const refCode = currentUser.affiliate?.referralCode || '';
      const url = `https://Ez-zel.vercel.app/${refCode ? `?ref=${refCode}` : ''}`;
      if (navigator.share) {
          try { await navigator.share({ title: 'رسالة من الظل', text: `${text}\n\n💡 ${url}` }); } catch (e) {}
      } else {
          navigator.clipboard.writeText(`${text}\n\n${url}`);
          alert("تم النسخ مع رابط الدعوة!");
      }
  };

  const handleStopPlayback = () => { 
      stopVoice(); 
      if (userAudioPlayerRef.current) { userAudioPlayerRef.current.pause(); userAudioPlayerRef.current = null; } 
      setPlayingMessageId(null); 
      if (appStatus === 'speaking') {
          setAppStatus('idle');
          if (isSentinelMode) resumeSentinel();
      }
  };
  
  const handlePlayMessage = async (msg: DBMessage) => { 
      if (playingMessageId === msg.id) { handleStopPlayback(); return; } 
      
      resumeAudioContext();

      if (appStatus === 'speaking') handleStopPlayback();
      if (appStatus !== 'thinking') setAppStatus('speaking');

      suspendSentinel();
      
      if (msg.role === 'user' && msg.voiceData) { 
          setPlayingMessageId(msg.id!); 
      } else { 
          let finalVoiceData = msg.voiceData;
          if (!finalVoiceData) {
              setPlayingMessageId(msg.id!);
              const voicePayload = await generateMp3FromShadowVoice(msg.text, currentUser.voicePreference || 'male');
              if (voicePayload) {
                  finalVoiceData = voicePayload.base64;
                  setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, voiceData: finalVoiceData } : m));
                  if (msg.id) shadowDB.updateMessage(msg.id, { voiceData: finalVoiceData }).catch(e => console.error("Failed saving voice to db", e));
              }
          }
          if (finalVoiceData) {
              setPlayingMessageId(msg.id!);
              if (!msg.voiceData) {
                  playShadowVoice(msg.text, currentUser.voicePreference === 'female' ? 'female' : 'male', finalVoiceData, () => {
                      setPlayingMessageId(null);
                      if (appStatus !== 'thinking') setAppStatus('idle');
                      if (isSentinelMode) resumeSentinel();
                  });
              }
          } else {
              playShadowVoice(msg.text, currentUser.voicePreference === 'female' ? 'female' : 'male', undefined, () => {
                  setPlayingMessageId(null);
                  if (appStatus !== 'thinking') setAppStatus('idle');
                  if (isSentinelMode) resumeSentinel();
              });
          }
      } 
  };
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setIsProcessingImage(true);
          try {
              if (file.type.startsWith('image/')) {
                  const compressed = await compressImage(file);
                  setPendingMedia(compressed);
              } else if (file.type.startsWith('video/')) {
                  if (file.size > 20 * 1024 * 1024) { 
                      alert("حجم الفيديو كبير جداً. الحد الأقصى 20 ميجابايت.");
                      return;
                  }
                  const videoData = await new Promise<string>((resolve) => {
                      const reader = new FileReader();
                      reader.onload = () => resolve(reader.result as string);
                      reader.readAsDataURL(file);
                  });
                  setPendingMedia({ data: videoData, type: file.type, originalFile: file });
              } else if (file.name.endsWith('.zip') || file.type.includes('zip') || file.name.endsWith('.rar')) {
                  const JSZip = (await import('jszip')).default;
                  const zip = new JSZip();
                  const contents = await zip.loadAsync(file);
                  let tree: string[] = [];
                  contents.forEach((relativePath, zipEntry) => {
                      tree.push(zipEntry.name);
                  });
                  (window as any).lastUploadedZip = { file, contents };
                  const promptText = `[ZIP_PROJECT_UPLOAD]\nقام المستخدم برفع ملف مشروع مضغوط: ${file.name}\nيحتوي على الملفات التالية:\n${tree.slice(0, 50).join('\\n')}${tree.length > 50 ? '\\n... وعدة ملفات أخرى' : ''}\n\n[INSTRUCTION]: أخبر المستخدم أن المشروع تم استلامه وأنك كمهندس صيانة وتطوير جاهز لدمجه أو تحسينه. استخدم أدواتك المناسبة إذا لزم الأمر.`;
                  setTimeout(() => {
                      handleSend(promptText, undefined, undefined, true);
                  }, 500);
                  alert(`تم استلام ملف الكود: ${file.name}`);
              } else {
                  // Handle text / code / document chunking (L0, L1, L2)
                  const textContent = await file.text();
                  if (textContent) {
                      setAppStatus('thinking');
                      // Minimal SLM chunking strategy using Gemini
                      const prompt = `أنت محرك تقسيم البيانات الآلي. اعطني رداً بصيغة JSON فقط كالتالي:
{
  "l0_summary": "ملخص في سطرين فقط لمحتوى الملف",
  "l1_metadata": "أهم العناوين والمواضيع الموجودة، بصيغة أسماء أو نقاط قصيرة"
}
النص:
${textContent.substring(0, 10000)}`;

                      let l0 = 'لم يتم تحديد ملخص (تجاوز)';
                      let l1 = 'لم يتم تحديد بيانات';
                      
                      try {
                          const chunkResult = await getShadowResponse([{ role: 'user', parts: [{ text: prompt }] }], prompt);
                          const jsonMatch = chunkResult.text.match(/\{[\s\S]*\}/);
                          if (jsonMatch) {
                              const parsed = JSON.parse(jsonMatch[0]);
                              if (parsed.l0_summary) l0 = parsed.l0_summary;
                              if (parsed.l1_metadata) l1 = parsed.l1_metadata;
                          }
                      } catch (e) {
                          console.error("Chunking failed", e);
                      }

                      const fileObj = {
                           userId: currentUser.email || 'GUEST',
                           parentId: null,
                           name: file.name,
                           type: 'file' as any,
                           content: textContent,
                           l0_summary: l0,
                           l1_metadata: l1,
                           l2_content: textContent,
                           createdAt: Date.now()
                      };
                      await shadowDB.createFSItem(fileObj);
                      
                      // Instruct Gemini
                      handleSend(`[FILE_PROCESSING_ENGINE]\nقام المستخدم برفع ملف (${file.name}).\nL0_SUMMARY (ملخص): ${l0}\nL1_METADATA (بيانات): ${l1}\n\n[INSTRUCTION]: أخبر المستخدم أنه تم رفع الملف وتقسيمه لأجزاء وأنت جاهز للرد على استفساراته القائمة على الملف.`, undefined, undefined, true);
                  }
              }
          } catch(err) {
              console.error(err);
          } finally {
              setIsProcessingImage(false);
              if (fileInputRef.current) fileInputRef.current.value = '';
              if (cameraInputRef.current) cameraInputRef.current.value = '';
          }
      }
  };
  
  const handleScreenCapture = async () => {
      try {
          if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
              alert("عذراً، مشاركة الشاشة غير مدعومة في هذا المتصفح أو التطبيق.");
              return;
          }
          const stream = await navigator.mediaDevices.getDisplayMedia({ video: { displaySurface: "browser" } });
          const video = document.createElement('video');
          video.srcObject = stream;
          await video.play();

          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
              setPendingMedia({ data: dataUrl, type: 'image/jpeg', originalFile: new File([dataUrl], 'screen_capture.jpg') });
          }

          const tracks = stream.getTracks();
          tracks.forEach(track => track.stop());
      } catch (e) {
          console.error("Screen capture failed", e);
      }
  };
  
  const handleAppCardAction = async (card: any) => { 
      if (!card) return; 
      if (card.cardType === 'internal_nav') { 
          if (onNavigateTo) onNavigateTo(card.targetSection);
          return;
      }
      if (card.cardType === 'business_doc') { window.print(); return; }
      
      if (card.url) { 
          let cleanUrl = card.url.trim();
          if (!cleanUrl.match(/^[a-zA-Z0-9+-]+:/)) {
             cleanUrl = `https://${cleanUrl}`;
          }
          window.open(cleanUrl, '_blank', 'noopener,noreferrer'); 
      } 
  };

  const getCardIcon = (type: string, number?: string) => { 
      if (type === 'task_success') return <CheckCircle className="w-6 h-6 text-emerald-400" />;
      if (type === 'internal_nav') return <Layout className="w-6 h-6 text-purple-400" />;
      if (type === 'business_doc') return <Printer className="w-6 h-6 text-white" />;
      if (type === 'system_terminal') return <Terminal className="w-6 h-6 text-white" />;
      if (type === 'deep_link_fallback') {
          if (number === 'chat') return <MessageCircle className="w-6 h-6 text-green-400" />;
          if (number === 'video') return <Video className="w-6 h-6 text-red-400" />;
          if (number === 'phone') return <PhoneCall className="w-6 h-6 text-blue-400" />;
          if (number === 'car') return <Car className="w-6 h-6 text-white" />;
          if (number === 'search') return <Search className="w-6 h-6 text-cyan-400" />;
          if (number === 'hotel') return <Hotel className="w-6 h-6 text-amber-400" />;
          if (number === 'map') return <MapPin className="w-6 h-6 text-emerald-400" />;
          if (number === 'calculator') return <Calculator className="w-6 h-6 text-orange-400" />;
          return <ExternalLink className="w-6 h-6 text-blue-400" />;
      }
      return <ExternalLink className="w-6 h-6 text-white" />;
  };

  const renderCard = (card: any, i: number) => {
      return renderChatCard(card, i, currentUser, handleSend, setSelectedWorkspaceFile);
  };

  const displayedMessages = messages.filter(m => {
    if ((m as any).isHidden) return false;
    if (!m.text && (!m.uiCards || m.uiCards.length === 0)) return false;
    if (!isSearchActive || !searchQuery.trim()) return true;
    return (m.text || '').toLowerCase().includes((searchQuery || '').toLowerCase());
  });

  const colorVarStyle = currentUser.interfaceColor ? ({
    '--theme-color': currentUser.interfaceColor,
    '--theme-color-10': `${currentUser.interfaceColor}1a`,
    '--theme-color-50': `${currentUser.interfaceColor}80`
  } as React.CSSProperties) : {};

  return (
    <React.Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-[#0a0a0a]"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></div>}>
    <div className="flex flex-col h-full w-full bg-transparent text-white font-['Cairo'] overflow-hidden relative" style={colorVarStyle}>
      <div className="relative z-10 flex flex-col h-full w-full">
          {showCapabilities && <CapabilitiesGuide onClose={() => setShowCapabilities(false)} onJoin={onUpgrade} onAffiliate={() => onNavigateTo?.('affiliate')} />}
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="*/*" />
          <input type="file" ref={cameraInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" capture="environment" />

          {appStatus === 'listening' && (
                  <ListeningOverlay 
                      liveTranscript={liveTranscript}
                      visualLevels={visualLevels}
                      cancelRecording={cancelRecording}
                      stopListeningAndSend={stopListeningAndSend as any}
                  />
          )}

      {showVoiceBiometricsManager && (
          <VoiceBiometricsManager 
              onClose={() => setShowVoiceBiometricsManager(false)} 
              onSignaturesUpdated={() => setHasVoiceSignature(voiceBiometrics.hasSignature())} 
          />
      )}

      <TopNavigation 
        onBack={onBack}
        onNavigateTo={onNavigateTo}
        isAdmin={isAdmin}
        isSearchActive={isSearchActive}
        setIsSearchActive={setIsSearchActive}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchInputRef={searchInputRef}
        appStatus={appStatus}
        isTito={isTito as any}
        getGreetingSubtitle={getGreetingSubtitle as any}
        isSentinelMode={isSentinelMode}
        toggleSentinelMode={toggleSentinelMode}
        speechSupported={speechSupported}
        syncStatus={isOffline ? 'offline' : syncStatus}
        onOpenAffiliate={() => onNavigateTo?.('affiliate')}
        isRestrictedMode={isRestrictedMode}
        hasVoiceSignature={hasVoiceSignature}
        setShowVoiceBiometricsManager={setShowVoiceBiometricsManager}
        setShowLiveAPIMode={setShowLiveAPIMode}
        setShowMemoryVault={setShowMemoryVault}
        setShowLocalDeepDive={setShowLocalDeepDive}
        setShowPersonalKeys={setShowPersonalKeys}
        setShowNativeSettings={setShowNativeSettings}
        setShowAutonomousManager={setShowAutonomousManager}
        setShowShadowMesh={setShowShadowMesh}
        runningTasks={useAppStore(s => s.runningTasks)}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        audioLevel={audioLevel}
        onFaceClick={() => setShowBigFace(true)}
      />

      {/* OFFLINE CAPABILITY BANNER */}
      {isOffline && (
        <div className="bg-cyan-900/40 border-b border-cyan-500/50 backdrop-blur-md px-4 py-2 flex items-center justify-between z-10 shrink-0 shadow-[0_4px_30px_rgba(6,182,212,0.15)]">
          <div className="flex items-center gap-2">
            <CloudOff className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-100 font-bold text-xs tracking-widest">نمط الـ Edge AI مُفعل (انقطاع الاتصال)</span>
          </div>
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
             <span className="text-[10px] text-cyan-300/70 font-mono tracking-widest uppercase">Llama-3 (Local)</span>
          </div>
        </div>
      )}

      <div className="z-10 shrink-0 bg-black/80 backdrop-blur-md px-3 mt-2 md:px-6 md:mt-4">
        <SensoryHUD lastMessage={messages.length > 0 ? messages[messages.length - 1].text : ''} isThinking={appStatus === 'thinking'} />
      </div>

      {showBigFace && (
          <div className="absolute inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in" onClick={() => setShowBigFace(false)}>
              <div className="relative pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                  <ShadowFace appStatus={appStatus} audioLevel={audioLevel} size="large" />
              </div>
              <p className="text-white/30 text-sm mt-8 font-bold animate-pulse">انقر في أي مكان للإغلاق</p>
          </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 md:p-6 pb-64 space-y-4 scrollbar-hide relative">
        {isDreaming && (
            <div className="absolute top-10 left-1/2 -translate-x-1/2 z-0 opacity-50 flex flex-col items-center pointer-events-none fade-in">
                <Brain className="w-16 h-16 text-cyan-600 animate-pulse mb-4 opacity-50" />
                <h3 className="text-xl font-black text-cyan-400 tracking-widest blur-[0.5px]">نظام الحلم نشط</h3>
                <p className="text-xs text-cyan-300 font-bold mt-2">جاري أرشفة وتنظيم الخيوط العصبية...</p>
            </div>
        )}
        {hasMoreMessages && !isSearchActive && (
            <div className="w-full flex justify-center py-4">
                <button onClick={() => setPage(page + 1)} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-bold text-white/50 hover:text-white transition-all">
                    تحميل الرسائل السابقة
                </button>
            </div>
        )}
        {displayedMessages.map((m, idx) => (
          <MessageBubble
            key={idx}
            m={m as any}
            idx={idx}
            highlightText={highlightText as any}
            renderCard={renderCard}
            handleSend={handleSend}
            setInput={setInput}
            handleShareMessage={handleShareMessage}
            handleShareVoiceMessage={handleShareVoiceMessage}
            isSharingVoice={isSharingVoice}
            playingMessageId={playingMessageId}
            handleStopPlayback={handleStopPlayback}
            handlePlayMessage={handlePlayMessage}
            handleDeleteMessage={handleDeleteMessage}
          />
        ))}
        
        {appStatus === 'thinking' && !searchQuery && (
            <div className="flex justify-end animate-in fade-in slide-in-from-bottom-2 items-center gap-3">
                <div className="bg-[#0f0f0f] border border-purple-500/20 rounded-[20px] rounded-tr-none p-4 flex items-center gap-3 shadow-lg">
                    <Brain className="w-4 h-4 text-purple-500 animate-pulse" />
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-purple-400 animate-pulse tracking-wide">الظل بيفكر...</span>
                    </div>
                </div>
                <button onClick={() => { if(abortControllerRef.current) abortControllerRef.current.abort(); resetToIdle(); }} className="p-3 bg-red-600 rounded-full text-white shadow-lg"><StopCircle className="w-5 h-5" /></button>
            </div>
        )}
      </div>

      <ChatInputArea 
        input={input} 
        setInput={setInput} 
        pendingMedia={pendingMedia} 
        setPendingMedia={setPendingMedia} 
        isProcessingImage={isProcessingImage} 
        isSentinelMode={isSentinelMode} 
        isRestrictedMode={isRestrictedMode} 
        isAdmin={isAdmin} 
        isLimitReached={isLimitReached} 
        onUpgrade={onUpgrade} 
        onOpenAffiliate={() => onNavigateTo?.('affiliate')} 
        startListening={startListening} 
        handleSend={handleSend} 
        fileInputRef={fileInputRef} 
        cameraInputRef={cameraInputRef} 
        currentUser={currentUser} 
        handleScreenCapture={handleScreenCapture}
      />

      <VoiceShareDialog 
          preparedShareData={preparedShareData} 
          onClose={() => setPreparedShareData(null)} 
      />

      <WorkspaceFileViewer 
          file={selectedWorkspaceFile}
          workspaceTab={workspaceTab}
          setWorkspaceTab={setWorkspaceTab}
          onClose={() => setSelectedWorkspaceFile(null)}
          onPlayAudio={(text) => playShadowVoice(text, currentUser.voicePreference || 'male')}
          onShareAudio={async (text) => {
              const mp3 = await generateMp3FromShadowVoice(text, currentUser.voicePreference || 'male');
              if (mp3) {
                  const refCode = currentUser.affiliate?.referralCode || '';
                  const referralLink = refCode ? `\n\nاشترك في الظل الرقمي واعمل نسختك من الرابط ده:\nhttps://Ez-zel.vercel.app?ref=${refCode}` : '';
                  const shareText = `اسمع رد الظل 🤖🔥${referralLink}`;
                  const shareObj = { title: 'صوت الظل', text: shareText, files: [mp3.file] };
                  setPreparedShareData(shareObj);
              } else {
                  alert("فشل توليد الصوت.");
              }
          }}
      />

      {/* Modals */}
      {showLiveAPIMode && (
          <LiveAPIMode onClose={() => setShowLiveAPIMode(false)} />
      )}
      {showMemoryVault && (
          <MemoryVault onClose={() => setShowMemoryVault(false)} />
      )}
      {showAutonomousManager && (
          <AutonomousManager onClose={() => setShowAutonomousManager(false)} />
      )}
      {showLocalDeepDive && (
          <LocalDeepDive onClose={() => setShowLocalDeepDive(false)} />
      )}
      {showShadowMesh && (
          <ShadowMeshSync onClose={() => setShowShadowMesh(false)} />
      )}
      {showNativeSettings && (
          <NativeSettings onClose={() => setShowNativeSettings(false)} />
      )}
      {showTradingBoard && (
          <LiveTradingBoard onClose={() => setShowTradingBoard(false)} apiKey={currentUser.personalKeys?.binanceApiKey} apiSecret={currentUser.personalKeys?.binanceSecretKey} />
      )}
      {showPersonalKeys && (
          <PersonalKeysManager onClose={() => setShowPersonalKeys(false)} currentUser={currentUser} />
      )}

      </div>
    </div>
    </React.Suspense>
  );
};

export default ChatInterface;