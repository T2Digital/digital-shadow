import React, { useState } from 'react';
import { X, Smartphone, Layers, Mic, Volume2, ShieldAlert, Cpu, Eye, Network, BrainCircuit, HeartPulse } from 'lucide-react';
import { NativeShadow } from '../services/nativeShadowPlugin';

export const NativeSettings: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handleAction = async (actionId: string, actionFn: () => Promise<any>) => {
      setLoadingAction(actionId);
      try {
          await actionFn();
          alert('تم تنفيذ العملية أو محاكاتها بنجاح.');
      } catch (e) {
          alert('حدث خطأ أثناء التنفيذ: ' + e);
      } finally {
          setLoadingAction(null);
      }
  };

  return (
      <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in zoom-in font-['Cairo']" dir="rtl">
          <div className="w-full max-w-2xl bg-[#080808] border border-cyan-500/20 rounded-[32px] p-8 relative shadow-[0_0_50px_rgba(6,182,212,0.1)] overflow-y-auto max-h-[90vh]">
              <button onClick={onClose} className="absolute top-6 left-6 p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                  <X className="w-5 h-5 text-white/50" />
              </button>

              <div className="flex items-center gap-4 mb-6 text-cyan-400">
                  <div className="p-3 bg-cyan-900/20 rounded-xl border border-cyan-500/30">
                      <Smartphone className="w-8 h-8" />
                  </div>
                  <div>
                      <h2 className="text-2xl font-black text-white">إعدادات النظام العميق</h2>
                      <p className="text-white/50 text-sm mt-1">المرحلة القادمة: تحويل الظل إلى كيان مسيطر (God Mode)</p>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Hybrid AI Core */}
                  <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-2xl p-5 border border-blue-500/30 flex flex-col gap-3 col-span-1 md:col-span-2 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex items-start gap-4 relative z-10">
                          <div className="relative shrink-0 mt-1">
                              <BrainCircuit className="w-8 h-8 text-blue-400" />
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-purple-500 rounded-full animate-ping" />
                          </div>
                          <div>
                              <h3 className="font-bold text-white text-lg">الذكاء الهجين (Hybrid AI) - العقل المزدوج</h3>
                              <p className="text-white/70 text-sm leading-relaxed mt-2">
                                  هذا هو المعيار الذهبي: دمج نموذج <b>Gemma 2B</b> محلياً عبر (MediaPipe / AICore / Core ML) للمهام اللحظية والبيانات الحساسة بسرعة 0ms، مع توجيه المهام المعقدة سحابياً إلى نموذج <b>Gemini Pro</b>. أقصى سرعة، وأعلى خصوصية.
                              </p>
                          </div>
                      </div>
                      <div className="mt-3 flex gap-2 justify-end relative z-10">
                          <button onClick={() => handleAction('hybrid-ai', () => NativeShadow.initHybridAI())} className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded-lg text-sm transition-all font-bold flex items-center gap-2">
                              {loadingAction === 'hybrid-ai' ? 'جاري التحميل...' : 'تنشيط العقلين معاً'}
                          </button>
                      </div>
                  </div>

                  {/* Foreground Service */}
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                          <Cpu className="w-6 h-6 text-emerald-400 shrink-0 mt-1" />
                          <div>
                              <h3 className="font-bold text-white text-md">الاستيقاظ في الخلفية</h3>
                              <p className="text-white/50 text-xs leading-relaxed mt-1">
                                  يعمل في الخلفية لمعالجة الأوامر والشاشة مغلقة تماماً.
                              </p>
                          </div>
                      </div>
                      <div className="mt-auto flex justify-end">
                          <button onClick={() => handleAction('start-fg', () => NativeShadow.startForegroundService({ title: 'الظل', body: 'المساعد يعمل' }))} className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs transition-all font-bold">
                              {loadingAction === 'start-fg' ? 'جاري...' : 'تفعيل'}
                          </button>
                      </div>
                  </div>

                  {/* System Overlay */}
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                          <Layers className="w-6 h-6 text-amber-400 shrink-0 mt-1" />
                          <div>
                              <h3 className="font-bold text-white text-md">الواجهة العائمة</h3>
                              <p className="text-white/50 text-xs leading-relaxed mt-1">
                                  الظهور فوق كل التطبيقات (واتساب، يوتيوب).
                              </p>
                          </div>
                      </div>
                      <div className="mt-auto flex gap-2 justify-end">
                          <button onClick={() => handleAction('req-overlay', () => NativeShadow.requestOverlayPermission())} className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-lg text-xs transition-all font-bold">صلاحية</button>
                          <button onClick={() => handleAction('show-overlay', () => NativeShadow.showSystemOverlay())} className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-lg text-xs transition-all font-bold">إظهار</button>
                      </div>
                  </div>

                  {/* API-Free Speech Recognition */}
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                          <Mic className="w-6 h-6 text-purple-400 shrink-0 mt-1" />
                          <div>
                              <h3 className="font-bold text-white text-md">تعرف صوتي Offline</h3>
                              <p className="text-white/50 text-xs leading-relaxed mt-1">
                                  فهم سريع للكلام بدون إنترنت باستخدام نموذج Whisper.
                              </p>
                          </div>
                      </div>
                      <div className="mt-auto flex justify-end">
                          <button onClick={() => handleAction('whisper', () => NativeShadow.initOfflineWhisper({ language: 'ar-EG' }))} className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded-lg text-xs transition-all font-bold">تهيئة</button>
                      </div>
                  </div>

                  {/* Fast Native TTS */}
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                          <Volume2 className="w-6 h-6 text-blue-400 shrink-0 mt-1" />
                          <div>
                              <h3 className="font-bold text-white text-md">سرعة النطق (Native TTS)</h3>
                              <p className="text-white/50 text-xs leading-relaxed mt-1">
                                  رد صوتي لحظي بدون انتظار الـ API.
                              </p>
                          </div>
                      </div>
                      <div className="mt-auto flex justify-end">
                          <button onClick={() => handleAction('tts', () => NativeShadow.fastNativeTTS({ text: 'هذه رسالة اختبار' }))} className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg text-xs transition-all font-bold">اختبار الصوت</button>
                      </div>
                  </div>

                  {/* Accessibility Service Control */}
                  <div className="bg-rose-900/10 rounded-2xl p-4 border border-rose-500/20 flex flex-col gap-3 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex items-start gap-3 relative z-10">
                          <Eye className="w-6 h-6 text-rose-400 shrink-0 mt-1" />
                          <div>
                              <h3 className="font-bold text-white text-md">التحكم بالشاشة (Accessibility)</h3>
                              <p className="text-white/50 text-xs leading-relaxed mt-1">
                                  الظل يقدر "يشوف" الشاشة ويضغط على الأزرار بدالك (مثلاً يفتح واتساب ويبعت رسالة بنفسه).
                              </p>
                          </div>
                      </div>
                      <div className="mt-auto flex justify-end relative z-10">
                          <button className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-xs transition-all font-bold">قريباً</button>
                      </div>
                  </div>

                  {/* Proactive Context (Sensors & Location) */}
                  <div className="bg-indigo-900/10 rounded-2xl p-4 border border-indigo-500/20 flex flex-col gap-3 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex items-start gap-3 relative z-10">
                          <Network className="w-6 h-6 text-indigo-400 shrink-0 mt-1" />
                          <div>
                              <h3 className="font-bold text-white text-md">الوعي المكاني (Context API)</h3>
                              <p className="text-white/50 text-xs leading-relaxed mt-1">
                                  يتعرف لو ركبت عربيتك ويشغل الأخبار، أو لو وصلت الجيم يجهزلك نظام التمرين تلقائياً بدون ما تتكلم.
                              </p>
                          </div>
                      </div>
                      <div className="mt-auto flex justify-end relative z-10">
                          <button className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-lg text-xs transition-all font-bold">قريباً</button>
                      </div>
                  </div>

                  {/* Local Indexing (Private RAG) */}
                  <div className="bg-fuchsia-900/10 rounded-2xl p-4 border border-fuchsia-500/20 flex flex-col gap-3 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex items-start gap-3 relative z-10">
                          <BrainCircuit className="w-6 h-6 text-fuchsia-400 shrink-0 mt-1" />
                          <div>
                              <h3 className="font-bold text-white text-md">الذاكرة المحلية (Neural RAG)</h3>
                              <p className="text-white/50 text-xs leading-relaxed mt-1">
                                  الظل يقوم بفهرسة كل ملفاتك الشخصية، الصور، المستندات والرسائل على الموبايل ويسحب منها المعلومات.
                              </p>
                          </div>
                      </div>
                      <div className="mt-auto flex justify-end relative z-10">
                          <button className="px-3 py-1.5 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/20 rounded-lg text-xs transition-all font-bold">قريباً</button>
                      </div>
                  </div>

                  {/* Biometric Emotion Analysis */}
                  <div className="bg-orange-900/10 rounded-2xl p-4 border border-orange-500/20 flex flex-col gap-3 relative overflow-hidden group col-span-1 md:col-span-2">
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex items-start gap-3 relative z-10">
                          <HeartPulse className="w-6 h-6 text-orange-400 shrink-0 mt-1" />
                          <div>
                              <h3 className="font-bold text-white text-md">تحليل المشاعر والصوت</h3>
                              <p className="text-white/50 text-xs leading-relaxed mt-1">
                                  يحلل نبرة صوتك، سرعة كلامك عشان يعرف لو إنت متوتر، غاضب، أو هادئ، ويغير طريقة رده (مثلاً يرد باختصار لو إنت مستعجل أو في خطر).
                              </p>
                          </div>
                      </div>
                      <div className="mt-auto flex justify-end relative z-10">
                          <button className="px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 rounded-lg text-xs transition-all font-bold">مرحلة متقدمة جداً</button>
                      </div>
                  </div>
              </div>
          </div>
      </div>
  );
};
