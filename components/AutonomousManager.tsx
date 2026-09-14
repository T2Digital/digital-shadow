import React, { useEffect, useState, useRef } from 'react';
import { 
  Bot, RefreshCw, X, PlayCircle, CheckCircle, Clock, 
  GitCommit, Network, Radio, Sparkles, Terminal as TerminalIcon, 
  Smile, Volume2, Code, Share2, Plus, Trash2, Maximize2, 
  Flame, ShieldAlert, Cpu, Layers, HelpCircle, CornerDownLeft,
  Phone, PhoneCall, PhoneIncoming, PhoneOff, MessageCircle, Send,
  ShieldCheck, ShoppingBag, Plane, Hotel, Car, Utensils, AlertTriangle,
  Mic, MicOff, VolumeX, Check, ArrowRight, Activity, Zap
} from 'lucide-react';
import { useAppStore } from '../services/store';
import { shadowDB, DBTask } from '../services/dbService';
import { omnichannelService, PhoneCallSession, OmnichannelConfig } from '../services/omnichannelService';
import { actionBookingEngine, AutonomousActionRequest, ActionCategory } from '../services/actionBookingEngine';
import { speakNative, stopVoice } from '../services/speechService';

export const AutonomousManager: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { user } = useAppStore();
  const [activeTab, setActiveTab] = useState<'phone' | 'actions' | 'omnichannel' | 'react_loops' | 'flow'>('phone');
  const [tasks, setTasks] = useState<DBTask[]>([]);
  const [loading, setLoading] = useState(true);

  // --- PHONE AGENT STATES ---
  const [phoneConfig, setPhoneConfig] = useState<OmnichannelConfig>(omnichannelService.getConfig());
  const [activeCall, setActiveCall] = useState<PhoneCallSession | null>(null);
  const [callHistory, setCallHistory] = useState<PhoneCallSession[]>(omnichannelService.getHistory());
  const [callReasonInput, setCallReasonInput] = useState('متابعة المهام ومراجعة الحجوزات اليومية');
  const [isMicActive, setIsMicActive] = useState(false);
  const [userSpeechInput, setUserSpeechInput] = useState('');
  const [isSpeakingCall, setIsSpeakingCall] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const callTimerRef = useRef<any>(null);

  // --- AUTONOMOUS ACTIONS & BOOKING STATES ---
  const [actionCategory, setActionCategory] = useState<ActionCategory>('flight');
  const [actionPrompt, setActionPrompt] = useState('احجزلي تذكرة طيران ذهاب وعودة من القاهرة إلى دبي الأسبوع القادم بأفضل سعر');
  const [isGeneratingAction, setIsGeneratingAction] = useState(false);
  const [activeAction, setActiveAction] = useState<AutonomousActionRequest | null>(null);
  const [actionHistory, setActionHistory] = useState<AutonomousActionRequest[]>(actionBookingEngine.getHistory());

  // --- OMNICHANNEL MESSAGING STATES ---
  const [omniChannelTarget, setOmniChannelTarget] = useState<'whatsapp' | 'telegram'>('telegram');
  const [omniMessageText, setOmniMessageText] = useState('يا ماستر، كل المهام والحجوزات تحت السيطرة والأمور تمام! 🚀');
  const [chatSimulatorMessages, setChatSimulatorMessages] = useState<Array<{ sender: 'shadow' | 'user'; platform: 'whatsapp' | 'telegram'; text: string; time: string }>>([
    { sender: 'shadow', platform: 'telegram', text: 'أهلاً يا ماستر! أنا الظل متصل معك عبر تليجرام وجاهز لأي أوامر أو استفسارات.', time: '10:00 AM' },
    { sender: 'user', platform: 'telegram', text: 'شيكلي على أسعار الطيران لدبي كده', time: '10:02 AM' },
    { sender: 'shadow', platform: 'telegram', text: 'لقيت رحلة ممتازة على طيران الإمارات بـ 4,200 جنيه. تحب أبدأ إجراءات الحجز؟', time: '10:03 AM' }
  ]);
  const [simUserReply, setSimUserReply] = useState('');

  // --- CANVASMIND FLOW STATES ---
  const [flowLogs, setFlowLogs] = useState<string[]>([]);

  // Sync with services
  useEffect(() => {
    const unsubOmni = omnichannelService.subscribe((event, data) => {
      if (event === 'call_started' || event === 'call_connected') {
        setActiveCall({ ...data });
      } else if (event === 'call_ended') {
        setActiveCall(null);
        setCallHistory(omnichannelService.getHistory());
      } else if (event === 'call_speech_start') {
        setIsSpeakingCall(true);
      } else if (event === 'call_speech_end') {
        setIsSpeakingCall(false);
      } else if (event === 'call_user_speech') {
        if (activeCall) {
          setActiveCall({ ...activeCall });
        }
      }
    });

    const unsubActions = actionBookingEngine.subscribe((event, action) => {
      setActiveAction({ ...action });
      setActionHistory(actionBookingEngine.getHistory());
    });

    return () => {
      unsubOmni();
      unsubActions();
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, []);

  // Call timer effect
  useEffect(() => {
    if (activeCall && activeCall.status === 'connected') {
      setCallDuration(0);
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    }
  }, [activeCall?.status]);

  const handleStartOutboundCall = async () => {
    const session = await omnichannelService.startOutboundCall(callReasonInput);
    setActiveCall(session);
  };

  const handleStartInboundCall = async () => {
    const session = await omnichannelService.startInboundCall();
    setActiveCall(session);
  };

  const handleEndCall = () => {
    omnichannelService.endCall();
    setActiveCall(null);
  };

  const handleSendCallUserSpeech = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userSpeechInput.trim() || !activeCall) return;
    const text = userSpeechInput;
    setUserSpeechInput('');
    await omnichannelService.userSpeakInCall(text);
  };

  const handleTriggerAction = async () => {
    if (!actionPrompt.trim()) return;
    setIsGeneratingAction(true);
    try {
      const act = await actionBookingEngine.initiateAction(actionPrompt, actionCategory);
      setActiveAction(act);
    } finally {
      setIsGeneratingAction(false);
    }
  };

  const handleApproveAction = async (confirmed: boolean) => {
    if (!activeAction) return;
    const updated = await actionBookingEngine.approveAction(activeAction.id, confirmed);
    setActiveAction(updated);
  };

  const handleSendOmnichannelTest = async () => {
    if (!omniMessageText.trim()) return;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatSimulatorMessages(prev => [...prev, { sender: 'shadow', platform: omniChannelTarget, text: omniMessageText, time }]);
    
    if (omniChannelTarget === 'telegram') {
      await omnichannelService.sendTelegramMessage(omniMessageText);
    } else {
      await omnichannelService.sendWhatsAppMessage(omniMessageText);
    }
    setOmniMessageText('');
  };

  const handleUserSimReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simUserReply.trim()) return;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userText = simUserReply;
    setSimUserReply('');
    setChatSimulatorMessages(prev => [...prev, { sender: 'user', platform: omniChannelTarget, text: userText, time }]);

    // Automatic Shadow response in simulator
    setTimeout(async () => {
      const responseTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      let reply = `تمام يا ماستر! استلمت طلبك عبر ${omniChannelTarget === 'telegram' ? 'تليجرام' : 'واتساب'} وجاري تنفيذه فوراً بدقة تامة.`;
      if (userText.includes('طيران') || userText.includes('حجز') || userText.includes('اطلب')) {
        reply = `تم استلام أمر الشراء/الحجز: "${userText}". قمت ببدء دورة ReAct والفحص بصمام الأمان وسأوافيك بالتفاصيل! 🛡️`;
      }
      setChatSimulatorMessages(prev => [...prev, { sender: 'shadow', platform: omniChannelTarget, text: reply, time: responseTime }]);
    }, 1000);
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-6 bg-black/80 backdrop-blur-xl animate-fadeIn" dir="rtl">
      <div className="w-full max-w-6xl h-[92vh] bg-[#0c0f17] border border-cyan-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white relative">
        
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-[#111625] to-[#0c0f17]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Bot className="w-6 h-6 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-lg text-white">مركز القيادة والأفعال الفائقة للظل</h2>
                <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  Super-Agent V4
                </span>
              </div>
              <p className="text-xs text-white/50">الهاتف الصوتي المباشر • واتساب وتليجرام • محرك الحجز والشراء الآلي</p>
            </div>
          </div>

          {/* TABS */}
          <div className="flex items-center bg-black/40 p-1 rounded-2xl border border-white/10">
            <button
              onClick={() => setActiveTab('phone')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'phone' ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30' : 'text-white/60 hover:text-white'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>المكالمات والهاتف</span>
            </button>
            <button
              onClick={() => setActiveTab('actions')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'actions' ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30' : 'text-white/60 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>الحجز والشراء الآلي</span>
            </button>
            <button
              onClick={() => setActiveTab('omnichannel')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'omnichannel' ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30' : 'text-white/60 hover:text-white'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>واتساب وتليجرام</span>
            </button>
            <button
              onClick={() => setActiveTab('react_loops')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'react_loops' ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30' : 'text-white/60 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>صمام الأمان (ReAct)</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTENT BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: PHONE & VOICE CALL AGENT */}
          {activeTab === 'phone' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Phone line badge & Controls */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Phone SIM Card */}
                <div className="bg-gradient-to-br from-[#121927] to-[#0c101c] border border-cyan-500/40 p-5 rounded-2xl shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                      <span className="text-xs font-bold text-emerald-400">خط الاتصال الصوتي نشط 24/7</span>
                    </div>
                    <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30">GSM / SIP HD</span>
                  </div>

                  <div className="space-y-1 mb-4">
                    <div className="text-[11px] text-white/50">رقم هاتف الظل الخاص (Shadow Direct Line):</div>
                    <div className="text-2xl font-black font-mono text-cyan-300 tracking-wider flex items-center justify-between">
                      <span>{phoneConfig.shadowPhoneNumber}</span>
                      <PhoneCall className="w-5 h-5 text-cyan-400" />
                    </div>
                  </div>

                  <div className="text-xs text-white/60 bg-black/40 p-3 rounded-xl border border-white/5 space-y-1">
                    <div className="flex justify-between">
                      <span>رقم هاتف الماستر:</span>
                      <span className="font-mono text-white font-bold">{phoneConfig.userPhoneNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>محرك الصوت:</span>
                      <span className="text-emerald-400 font-bold">اللهجة المصرية الطبيعية فائقة الدقة</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <button
                      onClick={handleStartOutboundCall}
                      disabled={!!activeCall}
                      className="py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-black font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <PhoneCall className="w-4 h-4" />
                      <span>اتصل بي الآن</span>
                    </button>
                    <button
                      onClick={handleStartInboundCall}
                      disabled={!!activeCall}
                      className="py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:opacity-50 text-black font-black text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <PhoneIncoming className="w-4 h-4" />
                      <span>اتصل بالظل</span>
                    </button>
                  </div>

                  <div className="mt-3">
                    <label className="text-[11px] text-white/60 mb-1 block">موضوع أو سبب المكالمة:</label>
                    <input
                      type="text"
                      value={callReasonInput}
                      onChange={(e) => setCallReasonInput(e.target.value)}
                      placeholder="مثال: متابعة حجز الطيران وتحديث أسعار التداول"
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Call History */}
                <div className="bg-[#121622] border border-white/10 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-cyan-400" />
                      <span>سجل المكالمات الصوتية الأخيرة</span>
                    </h3>
                    <span className="text-[10px] text-white/40">{callHistory.length} مكالمة</span>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {callHistory.length === 0 ? (
                      <p className="text-xs text-white/40 text-center py-4">لا توجد مكالمات مسجلة بعد</p>
                    ) : (
                      callHistory.map((call, idx) => (
                        <div key={idx} className="bg-black/30 p-2.5 rounded-xl border border-white/5 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2.5">
                            <div className={`p-1.5 rounded-lg ${call.direction === 'outbound' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
                              {call.direction === 'outbound' ? <PhoneCall className="w-3.5 h-3.5" /> : <PhoneIncoming className="w-3.5 h-3.5" />}
                            </div>
                            <div>
                              <div className="font-bold text-white/90">{call.reason || 'مكالمة ذكية'}</div>
                              <div className="text-[10px] text-white/40">{new Date(call.startTime).toLocaleTimeString()} • {call.durationSeconds || 0} ثانية</div>
                            </div>
                          </div>
                          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">مكتملة</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Live Active Phone Screen */}
              <div className="lg:col-span-7">
                <div className="h-full bg-gradient-to-b from-[#101524] to-[#0a0d17] border border-cyan-500/30 rounded-3xl p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden min-h-[480px]">
                  
                  {activeCall ? (
                    <div className="flex-1 flex flex-col justify-between space-y-6">
                      {/* Active Call Top Bar */}
                      <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                            <Bot className="w-7 h-7 text-black" />
                          </div>
                          <div>
                            <h3 className="font-black text-white text-base">الظل الرقمي | Ez-Zel Voice</h3>
                            <p className="text-xs text-cyan-300 font-mono">
                              {activeCall.status === 'ringing' ? 'جاري الرنين والاتصال...' : `متصل الآن • ${formatDuration(callDuration)}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                            activeCall.status === 'connected' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            <Activity className="w-3.5 h-3.5" />
                            <span>{activeCall.status === 'connected' ? 'مكالمة حية HD' : 'اتصال...'}</span>
                          </span>
                        </div>
                      </div>

                      {/* Waveform / Visualizer */}
                      <div className="flex flex-col items-center justify-center py-6 space-y-4">
                        <div className="relative">
                          <div className={`w-28 h-28 rounded-full bg-gradient-to-tr from-cyan-500/20 to-emerald-500/20 border-2 border-cyan-400 flex items-center justify-center transition-all ${
                            isSpeakingCall ? 'scale-110 shadow-[0_0_50px_rgba(6,182,212,0.6)]' : 'scale-100'
                          }`}>
                            <Bot className="w-12 h-12 text-cyan-400" />
                          </div>
                          {isSpeakingCall && (
                            <span className="absolute -bottom-2 bg-emerald-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full left-1/2 -translate-x-1/2 animate-pulse">
                              الظل يتحدث الآن...
                            </span>
                          )}
                        </div>

                        {/* Real-time Voice Waves simulation */}
                        <div className="flex items-center gap-1.5 h-8">
                          {[40, 70, 90, 60, 30, 85, 100, 55, 75, 45, 95, 65, 35].map((h, i) => (
                            <div
                              key={i}
                              style={{ height: isSpeakingCall ? `${h}%` : '20%' }}
                              className="w-1.5 bg-gradient-to-t from-cyan-500 to-emerald-400 rounded-full transition-all duration-150"
                            />
                          ))}
                        </div>
                      </div>

                      {/* Live Call Transcript */}
                      <div className="bg-black/50 border border-white/10 rounded-2xl p-4 max-h-48 overflow-y-auto space-y-2.5 text-xs">
                        <div className="text-[10px] text-white/40 border-b border-white/5 pb-1">تفريغ المحادثة الصوتية الحية:</div>
                        {activeCall.transcript.length === 0 ? (
                          <div className="text-white/40 text-center py-2">جاري استماع الظل لنبرة صوتك...</div>
                        ) : (
                          activeCall.transcript.map((msg, i) => (
                            <div key={i} className={`flex gap-2 ${msg.speaker === 'shadow' ? 'text-cyan-300' : 'text-emerald-300'}`}>
                              <span className="font-bold shrink-0">{msg.speaker === 'shadow' ? 'الظل:' : 'أنت:'}</span>
                              <span className="text-white/90">{msg.text}</span>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Talk Back Control in Call */}
                      <div className="space-y-3">
                        <form onSubmit={handleSendCallUserSpeech} className="flex gap-2">
                          <input
                            type="text"
                            value={userSpeechInput}
                            onChange={(e) => setUserSpeechInput(e.target.value)}
                            placeholder="تحدث بصوتك أو اكتب ردك في المكالمة..."
                            className="flex-1 bg-black/60 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white placeholder-white/40 focus:outline-none focus:border-cyan-500"
                          />
                          <button
                            type="submit"
                            className="px-5 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs rounded-2xl shadow-lg transition-all"
                          >
                            تحدث في المكالمة
                          </button>
                        </form>

                        {/* End Call Button */}
                        <div className="flex justify-center pt-2">
                          <button
                            onClick={handleEndCall}
                            className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white font-black text-xs rounded-full shadow-lg shadow-red-500/30 flex items-center gap-2 transition-all"
                          >
                            <PhoneOff className="w-4 h-4" />
                            <span>إنهاء المكالمة</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Idle Phone Screen */
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-6">
                      <div className="w-24 h-24 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shadow-xl shadow-cyan-500/10">
                        <Phone className="w-10 h-10 text-cyan-400" />
                      </div>
                      <div className="max-w-md space-y-2">
                        <h3 className="text-lg font-black text-white">هاتف الظل الصوتي الذكي في وضع الاستعداد</h3>
                        <p className="text-xs text-white/60 leading-relaxed">
                          يمكنك التحدث مع الظل مباشرة كأنك تجري مكالمة تليفونية مع شخص حقيقي بصوت مصري طبيعي وسريع، أو الضغط على "اتصل بي الآن" ليقوم الظل بالاتصال برقمك فوراً عند انتهاء الحجوزات والمهام.
                        </p>
                      </div>
                      <div className="flex gap-4">
                        <button
                          onClick={handleStartOutboundCall}
                          className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-black text-xs rounded-2xl shadow-xl shadow-emerald-500/20 hover:scale-105 transition-all flex items-center gap-2"
                        >
                          <PhoneCall className="w-4 h-4" />
                          <span>ابدأ مكالمة تجريبية الآن</span>
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AUTONOMOUS BOOKING & SHOPPING ACTION ENGINE */}
          {activeTab === 'actions' && (
            <div className="space-y-6">
              
              {/* Category selector */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { id: 'flight', label: 'حجز طيران', icon: Plane, color: 'from-blue-500 to-cyan-500', desc: 'مقارنة الرحلات وحجز التذاكر' },
                  { id: 'hotel', label: 'حجز فنادق', icon: Hotel, color: 'from-purple-500 to-indigo-500', desc: 'أفضل الإقامات والغرف' },
                  { id: 'food', label: 'طلب طعام', icon: Utensils, color: 'from-amber-500 to-orange-500', desc: 'توصيل الوجبات والمطاعم' },
                  { id: 'ride', label: 'حجز أوبر ومواصلات', icon: Car, color: 'from-emerald-500 to-teal-500', desc: 'طلب سيارة وتحديد الوجهة' },
                  { id: 'ecommerce', label: 'شراء أونلاين', icon: ShoppingBag, color: 'from-pink-500 to-rose-500', desc: 'شراء منتجات وتتبع الأسعار' },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = actionCategory === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActionCategory(item.id as ActionCategory)}
                      className={`p-4 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-gradient-to-br ' + item.color + ' text-black font-bold border-white/40 shadow-xl'
                          : 'bg-[#121622] border-white/10 hover:border-white/20 text-white'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <Icon className={`w-6 h-6 ${isSelected ? 'text-black' : 'text-cyan-400'}`} />
                        {isSelected && <CheckCircle className="w-4 h-4 text-black" />}
                      </div>
                      <div>
                        <div className="text-sm font-black">{item.label}</div>
                        <div className={`text-[10px] ${isSelected ? 'text-black/70' : 'text-white/40'}`}>{item.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Action Prompt Form */}
              <div className="bg-[#121622] border border-cyan-500/30 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-sm font-black text-white">تفاصيل أمر الحجز أو الشراء الذاتي:</h3>
                  </div>
                  <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 font-bold">
                    Zero-Mistake Guardrail Protected 🛡️
                  </span>
                </div>

                <div className="flex gap-3">
                  <input
                    type="text"
                    value={actionPrompt}
                    onChange={(e) => setActionPrompt(e.target.value)}
                    placeholder="اكتب طلبك بالتفصيل (مثال: احجزلي تذكرة طيران للقاهرة أو اطلبلي بيتزا مارجريتا)"
                    className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    onClick={handleTriggerAction}
                    disabled={isGeneratingAction}
                    className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-black font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 shrink-0"
                  >
                    {isGeneratingAction ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    <span>تخطيط وتنفيذ الحجز</span>
                  </button>
                </div>
              </div>

              {/* Active Action Pipeline Display */}
              {activeAction && (
                <div className="bg-[#0e1320] border border-cyan-500/40 rounded-3xl p-6 space-y-6 shadow-2xl animate-fadeIn">
                  
                  {/* Action Summary Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 text-[10px] font-black uppercase rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          {activeAction.category.toUpperCase()}
                        </span>
                        <h3 className="text-lg font-black text-white">{activeAction.title}</h3>
                      </div>
                      <p className="text-xs text-white/60 mt-1">الطلب: "{activeAction.userPrompt}"</p>
                    </div>

                    <div className="bg-black/50 px-5 py-3 rounded-2xl border border-white/10 text-left font-mono">
                      <div className="text-xs text-white/50">المبلغ المقدر النهائي:</div>
                      <div className="text-xl font-black text-emerald-400">{activeAction.estimatedCost.amount} {activeAction.estimatedCost.currency}</div>
                    </div>
                  </div>

                  {/* ReAct 5-Step Pipeline visualizer */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-white/80">مراحل التفكير والتنفيذ الذاتي (ReAct Loop):</h4>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      {activeAction.steps.map((step, idx) => (
                        <div
                          key={idx}
                          className={`p-3.5 rounded-2xl border flex flex-col justify-between space-y-2 transition-all ${
                            step.status === 'completed'
                              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                              : step.status === 'running'
                              ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-300 animate-pulse'
                              : step.status === 'waiting_confirmation'
                              ? 'bg-amber-950/40 border-amber-500/60 text-amber-300'
                              : 'bg-black/30 border-white/5 text-white/40'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold">{step.stepIndex}</span>
                            {step.status === 'completed' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                            {step.status === 'running' && <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />}
                            {step.status === 'waiting_confirmation' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                          </div>
                          <div>
                            <div className="text-xs font-bold leading-tight">{step.title}</div>
                            <div className="text-[10px] opacity-70 mt-1">{step.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Guardrail Rules Checklist */}
                  {activeAction.guardrails.length > 0 && (
                    <div className="bg-black/40 border border-emerald-500/30 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                        <ShieldCheck className="w-4 h-4" />
                        <span>نتائج فحص صمام الأمان (Zero-Mistake Audit):</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        {activeAction.guardrails.map((g, i) => (
                          <div key={i} className="flex items-center gap-2 text-white/80 bg-white/5 p-2 rounded-xl">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>{g.rule}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Human In The Loop Confirmation Gate */}
                  {activeAction.status === 'awaiting_human_approval' && (
                    <div className="bg-gradient-to-r from-amber-950/40 via-cyan-950/40 to-emerald-950/40 border-2 border-amber-400/50 p-6 rounded-2xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-amber-400 font-black text-sm">
                          <AlertTriangle className="w-5 h-5" />
                          <span>صمام الأمان بانتظار موافقتك النهائية قبل الخصم وإتمام الحجز</span>
                        </div>
                        <p className="text-xs text-white/70">
                          المبلغ المطلوب تأكيده: <strong className="text-emerald-400 font-mono text-sm">{activeAction.estimatedCost.amount} {activeAction.estimatedCost.currency}</strong> لصالح {activeAction.title}.
                        </p>
                      </div>

                      <div className="flex gap-3 shrink-0">
                        <button
                          onClick={() => handleApproveAction(true)}
                          className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>تأكيد ودفع فوري</span>
                        </button>
                        <button
                          onClick={() => handleApproveAction(false)}
                          className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-all"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Completed Receipt */}
                  {activeAction.status === 'completed' && activeAction.receiptSummary && (
                    <div className="bg-emerald-950/40 border border-emerald-500/40 p-5 rounded-2xl space-y-2">
                      <div className="flex items-center gap-2 text-emerald-400 font-black text-sm">
                        <CheckCircle className="w-5 h-5" />
                        <span>تم إصدار إيصال الحجز وتأكيد العملية بنجاح تام!</span>
                      </div>
                      <pre className="text-xs font-mono text-emerald-200/90 whitespace-pre-wrap bg-black/40 p-3 rounded-xl border border-white/5">
                        {activeAction.receiptSummary}
                      </pre>
                    </div>
                  )}

                </div>
              )}

              {/* Past Actions History */}
              <div className="bg-[#121622] border border-white/10 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span>سجل الحجوزات والعمليات السابقة</span>
                </h3>

                <div className="space-y-2">
                  {actionHistory.length === 0 ? (
                    <p className="text-xs text-white/40 text-center py-4">لا توجد عمليات سابقة</p>
                  ) : (
                    actionHistory.map((act, i) => (
                      <div key={i} className="bg-black/30 p-3 rounded-xl border border-white/5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-0.5 text-[9px] font-bold rounded-md bg-white/10 text-cyan-300 uppercase">{act.category}</span>
                          <div>
                            <div className="font-bold text-white">{act.title}</div>
                            <div className="text-[10px] text-white/40 font-mono">{act.bookingReference || 'ID: ' + act.id}</div>
                          </div>
                        </div>
                        <div className="text-left font-mono">
                          <span className="text-emerald-400 font-bold">{act.estimatedCost.amount} {act.estimatedCost.currency}</span>
                          <span className="block text-[9px] text-emerald-300">مكتمل ومؤكد</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: OMNICHANNEL WHATSAPP & TELEGRAM */}
          {activeTab === 'omnichannel' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Settings & Credentials */}
              <div className="lg:col-span-5 space-y-5">
                <div className="bg-[#121622] border border-white/10 rounded-2xl p-5 space-y-4">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-cyan-400" />
                    <span>إعدادات قنوات المراسلة الفورية</span>
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-white/80 font-bold block">توكن بوت تليجرام الحقيقي (Telegram Bot Token):</label>
                        <a 
                          href="https://t.me/BotFather" 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1"
                        >
                          <span>إنشاء بوت مجاني في دقيقة @BotFather</span>
                        </a>
                      </div>
                      <input
                        type="text"
                        value={phoneConfig.telegramBotToken}
                        placeholder="ضع التوكن هنا: 123456789:ABCDefgh..."
                        onChange={(e) => {
                          const updated = { ...phoneConfig, telegramBotToken: e.target.value };
                          setPhoneConfig(updated);
                          omnichannelService.saveConfig(updated);
                        }}
                        className="w-full bg-black/50 border border-cyan-500/40 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-400 shadow-inner"
                      />
                      <p className="text-[10px] text-white/50 mt-1">بمجرد وضع التوكن الخاص بك، ستصلك رسائل الظل وتنبيهات الحجوزات على تليجرام فوراً مجاناً 100%.</p>
                    </div>

                    <div>
                      <label className="text-white/60 mb-1 block">رابط Webhook استقبال الرسائل (Telegram Webhook):</label>
                      <div className="bg-black/50 p-2.5 rounded-xl border border-white/5 font-mono text-[10px] text-cyan-300 select-all flex items-center justify-between">
                        <span>{window.location.origin}/api/agent/telegram/webhook</span>
                        <span className="text-[9px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded">جاهز ونشط</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-white/60 mb-1 block">رابط Webhook استقبال الواتساب (WhatsApp Cloud API):</label>
                      <div className="bg-black/50 p-2.5 rounded-xl border border-white/5 font-mono text-[10px] text-emerald-300 select-all">
                        https://ais-dev-zwosrl6vh4m2ky2wijzz4c-39654759589.europe-west3.run.app/api/webhooks/kapso
                      </div>
                    </div>

                    <div className="pt-2 flex flex-col gap-2">
                      <button
                        onClick={handleSendOmnichannelTest}
                        className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-black rounded-xl text-xs shadow-lg transition-all"
                      >
                        إرسال رسالة تجريبية الآن 🚀
                      </button>
                      <button
                        onClick={async () => {
                          const { proactiveWakeupService } = await import('../services/proactiveWakeupService');
                          const res = await proactiveWakeupService.generateAndDispatchMorningBriefing(user);
                          alert("تم توليد وإرسال الإحاطة الصباحية الاستباقية بنجاح:\n\n" + res);
                        }}
                        className="w-full py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-amber-300 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
                      >
                        <span>🌅 تشغيل رسالة الإحاطة الصباحية الاستباقية فوراً</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Chat Simulator */}
              <div className="lg:col-span-7">
                <div className="bg-[#101420] border border-cyan-500/30 rounded-3xl p-5 flex flex-col justify-between h-[520px] shadow-2xl">
                  
                  {/* Channel Switcher */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setOmniChannelTarget('telegram')}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                          omniChannelTarget === 'telegram' ? 'bg-blue-500 text-white' : 'bg-white/5 text-white/60'
                        }`}
                      >
                        تليجرام (@EzZelShadowBot)
                      </button>
                      <button
                        onClick={() => setOmniChannelTarget('whatsapp')}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                          omniChannelTarget === 'whatsapp' ? 'bg-emerald-500 text-black' : 'bg-white/5 text-white/60'
                        }`}
                      >
                        واتساب (WhatsApp Business)
                      </button>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono">Live Two-Way Stream</span>
                  </div>

                  {/* Messages Feed */}
                  <div className="flex-1 overflow-y-auto py-4 space-y-3">
                    {chatSimulatorMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex flex-col max-w-[80%] ${
                          msg.sender === 'user' ? 'mr-auto items-start' : 'ml-auto items-end'
                        }`}
                      >
                        <div
                          className={`p-3 rounded-2xl text-xs leading-relaxed ${
                            msg.sender === 'user'
                              ? 'bg-emerald-600 text-white rounded-br-none'
                              : 'bg-[#1b2234] border border-cyan-500/30 text-cyan-100 rounded-bl-none'
                          }`}
                        >
                          {msg.text}
                        </div>
                        <span className="text-[9px] text-white/40 mt-1 px-1">{msg.time}</span>
                      </div>
                    ))}
                  </div>

                  {/* Reply Input Form */}
                  <form onSubmit={handleUserSimReply} className="flex gap-2 border-t border-white/10 pt-3">
                    <input
                      type="text"
                      value={simUserReply}
                      onChange={(e) => setSimUserReply(e.target.value)}
                      placeholder={`أرسل رسالة أو أمر تجريبي عبر ${omniChannelTarget === 'telegram' ? 'تليجرام' : 'واتساب'}...`}
                      className="flex-1 bg-black/50 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      type="submit"
                      className="p-3 bg-cyan-500 hover:bg-cyan-400 text-black rounded-2xl shadow-lg transition-all"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>

                </div>
              </div>

            </div>
          )}

          {/* TAB 4: REACT LOOPS & GUARDRAILS */}
          {activeTab === 'react_loops' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#121622] border border-emerald-500/30 p-5 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-black text-sm">
                    <ShieldCheck className="w-5 h-5" />
                    <span>صمام أمان المعاملات (Zero-Mistake)</span>
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed">
                    منع تنفيذ أي خصم مالي أو حجز طيران أو فندق دون فحص الحدود السعرية وطلب توقيع الماستر.
                  </p>
                </div>

                <div className="bg-[#121622] border border-cyan-500/30 p-5 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-cyan-400 font-black text-sm">
                    <RefreshCw className="w-5 h-5" />
                    <span>حلقة التفكير والتصحيح (ReAct Loop)</span>
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed">
                    تقسيم كل هدف معقد إلى خطوات وتدقيق نتائج كل خطوة وتصحيح الأخطاء تلقائياً قبل المتابعة.
                  </p>
                </div>

                <div className="bg-[#121622] border border-purple-500/30 p-5 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-purple-400 font-black text-sm">
                    <PhoneCall className="w-5 h-5" />
                    <span>الاتصال الاستباقي للطوارئ</span>
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed">
                    إجراء مكالمة هاتفية فورية لرقمك عند حدوث أي فرصة تداول نادرة أو انخفاض سعر تذكرة تتابعها.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
