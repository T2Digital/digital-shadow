import React, { useState } from 'react';
import { UserProfile, shadowDB } from '../services/dbService';
import { Copy, Wallet, Users, ArrowRight, Share2, DollarSign, TrendingUp, Save, CheckCircle, History, HandCoins, AlertTriangle } from 'lucide-react';

interface Props {
  user: UserProfile;
  onBack: () => void;
  onUpdateUser: (u: UserProfile) => void;
}

const AffiliateDashboard: React.FC<Props> = ({ user, onBack, onUpdateUser }) => {
  const [copied, setCopied] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState<'wallet' | 'instapay'>(user.affiliate?.payoutDetails?.method || 'wallet');
  const [payoutNumber, setPayoutNumber] = useState(user.affiliate?.payoutDetails?.number || '');
  const [payoutName, setPayoutName] = useState(user.affiliate?.payoutDetails?.name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  const activateAffiliate = async () => {
    const updatedUser = { 
        ...user, 
        affiliate: {
            ...(user.affiliate || {
                referralCode: (user.name.substring(0,3) + Math.floor(1000 + Math.random() * 9000)).toUpperCase(),
                totalEarnings: 0,
                referralsCount: 0,
                payoutHistory: []
            }),
            isMarketer: true
        } 
    };
    await shadowDB.saveProfile(updatedUser);
    onUpdateUser(updatedUser);
  };

  const savePayoutDetails = async () => {
      if (!user.affiliate) return;
      setIsSaving(true);
      const updatedUser = {
          ...user,
          affiliate: {
              ...user.affiliate,
              payoutDetails: {
                  method: payoutMethod,
                  number: payoutNumber,
                  name: payoutName
              }
          }
      };
      await shadowDB.saveProfile(updatedUser);
      onUpdateUser(updatedUser);
      setTimeout(() => setIsSaving(false), 1000);
  };

  const handleRequestPayout = async () => {
      if (!user.affiliate || user.affiliate.totalEarnings < 100) return;
      if (!payoutNumber || !payoutName) {
          alert("يرجى حفظ بيانات السحب أولاً.");
          return;
      }
      
      setIsRequesting(true);
      
      const newPayout = { 
          date: Date.now(), 
          amount: user.affiliate.totalEarnings, 
          status: 'pending' as const 
      };

      const updatedUser = {
          ...user,
          affiliate: {
              ...user.affiliate,
              totalEarnings: 0, // Reset balance to 0 (moved to pending)
              payoutHistory: [newPayout, ...user.affiliate.payoutHistory]
          }
      };

      await shadowDB.saveProfile(updatedUser);
      onUpdateUser(updatedUser);
      setIsRequesting(false);
      alert("تم إرسال طلب السحب بنجاح! سيتم المراجعة والتحويل قريباً.");
  };

  if (!user.affiliate?.isMarketer) {
      return (
          <div className="fixed inset-0 z-[100] bg-[#020202] text-white p-6 flex items-center justify-center font-['Cairo']">
              <div className="max-w-md w-full glass p-8 rounded-[40px] border border-emerald-500/20 text-center">
                  <div className="w-20 h-20 mx-auto bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20">
                      <DollarSign className="w-10 h-10 text-emerald-500" />
                  </div>
                  <h2 className="text-3xl font-black mb-2">بيزنس العيلة</h2>
                  <p className="text-white/50 text-sm mb-8 leading-relaxed font-medium">
                      مش بس مساعد شخصي.. ده شريك نجاح.
                      <br/>
                      افتح حساب "شريك" دلوقتي، وخد كود خاص بيك. أي حد من صحابك أو معارفك يشترك بالكود ده، هينزلك <span className="text-emerald-400 font-bold">10% عمولة</span> كاش فوراً.
                  </p>
                  <button onClick={activateAffiliate} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[20px] font-black shadow-lg shadow-emerald-900/40 transition-all">
                      ابدأ البيزنس
                  </button>
                  <button onClick={onBack} className="mt-4 text-xs text-white/30 hover:text-white">إلغاء والعودة</button>
              </div>
          </div>
      );
  }

  const referralLink = `https://Ez-zel.vercel.app/?ref=${user.affiliate.referralCode}`;

  const copyToClipboard = () => {
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
      if (navigator.share) {
          try {
              await navigator.share({
                  title: 'دعوة للانضمام للظل الرقمي',
                  text: `اشترك في "الظل" (Ez-Zel) أقوى مساعد شخصي بالذكاء الاصطناعي.. استخدم الكود بتاعي عشان تاخد خصم: ${user.affiliate?.referralCode}`,
                  url: referralLink
              });
          } catch (e) { console.log('Share cancelled'); }
      } else {
          copyToClipboard();
      }
  };

  return (
      <div className="fixed inset-0 z-[100] bg-[#020202] text-white overflow-y-auto font-['Cairo'] pb-28">
          <div className="p-6 md:p-10 max-w-2xl mx-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                  <button onClick={onBack} className="p-3 bg-white/5 rounded-full hover:bg-white/10"><ArrowRight className="w-5 h-5" /></button>
                  <h2 className="text-xl font-black text-white/90">خزنة الأرباح</h2>
              </div>

              {/* Wallet Card */}
              <div className="bg-gradient-to-br from-emerald-900/40 to-black p-8 rounded-[40px] border border-emerald-500/30 relative overflow-hidden mb-8 shadow-2xl">
                  <div className="absolute top-0 right-0 p-8 opacity-10"><Wallet className="w-32 h-32" /></div>
                  <div className="relative z-10">
                      <p className="text-emerald-400 font-bold uppercase tracking-widest text-xs mb-2">رصيدك المتاح (Total Earnings)</p>
                      <h3 className="text-5xl font-black text-white tracking-tighter mb-6">{user.affiliate.totalEarnings.toLocaleString()} <span className="text-lg text-emerald-500">ج.م</span></h3>
                      
                      {user.affiliate.totalEarnings >= 100 ? (
                          <button onClick={handleRequestPayout} disabled={isRequesting} className="bg-white text-black px-6 py-3 rounded-xl font-black text-sm hover:scale-105 transition-transform flex items-center gap-2">
                             {isRequesting ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : <HandCoins className="w-5 h-5" />}
                             طلب سحب الرصيد الآن
                          </button>
                      ) : (
                          <div className="inline-flex items-center gap-2 bg-black/30 px-4 py-2 rounded-xl border border-white/5">
                              <AlertTriangle className="w-4 h-4 text-white/50" />
                              <span className="text-xs text-white/50 font-bold">الحد الأدنى للسحب: 100 ج.م</span>
                          </div>
                      )}
                  </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="p-6 bg-[#111] rounded-[32px] border border-white/5">
                      <Users className="w-8 h-8 text-purple-500 mb-4" />
                      <h4 className="text-2xl font-black">{user.affiliate.referralsCount}</h4>
                      <p className="text-xs text-white/40 font-bold">من طرفك (الشلة)</p>
                  </div>
                  <div className="p-6 bg-[#111] rounded-[32px] border border-white/5">
                      <TrendingUp className="w-8 h-8 text-amber-500 mb-4" />
                      <h4 className="text-2xl font-black">10%</h4>
                      <p className="text-xs text-white/40 font-bold">عمولة (100ج - 1000ج)</p>
                  </div>
              </div>

              {/* Referral Tools */}
              <div className="p-6 bg-white/5 rounded-[32px] border border-white/10 mb-8">
                  <h4 className="font-bold text-white mb-4 flex items-center gap-2"><Share2 className="w-5 h-5" /> أدوات الانتشار</h4>
                  
                  <div className="bg-black/50 p-4 rounded-2xl border border-white/5 mb-4 text-center">
                      <p className="text-[10px] text-white/40 mb-2 uppercase tracking-widest font-bold">كود العيلة الخاص بيك</p>
                      <p className="text-3xl font-black text-emerald-400 tracking-widest font-mono">{user.affiliate.referralCode}</p>
                  </div>

                  <div className="flex items-center gap-2 bg-black/50 p-2 rounded-2xl border border-white/5">
                      <div className="flex-1 px-3 text-xs text-white/60 truncate font-mono">{referralLink}</div>
                      
                      <button onClick={handleNativeShare} className="p-3 bg-purple-600 rounded-xl text-white hover:bg-purple-500 transition-all shadow-lg">
                          <Share2 className="w-5 h-5" />
                      </button>
                      
                      <button onClick={copyToClipboard} className={`p-3 rounded-xl transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/40 hover:text-white'}`}>
                          <Copy className="w-5 h-5" />
                      </button>
                  </div>
              </div>

              {/* Withdrawal Settings */}
              <div className="p-6 bg-[#111] rounded-[32px] border border-white/5 mb-8">
                  <h4 className="font-bold text-white mb-4 flex items-center gap-2"><Wallet className="w-5 h-5" /> إعدادات السحب</h4>
                  <div className="space-y-4">
                      <div className="flex gap-2 bg-black/50 p-1 rounded-xl">
                          <button onClick={() => setPayoutMethod('wallet')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${payoutMethod === 'wallet' ? 'bg-emerald-600 text-white' : 'text-white/40'}`}>محفظة كاش</button>
                          <button onClick={() => setPayoutMethod('instapay')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${payoutMethod === 'instapay' ? 'bg-purple-600 text-white' : 'text-white/40'}`}>إنستاباي</button>
                      </div>
                      
                      <input 
                        type="text" 
                        placeholder="الاسم المسجل (ثلاثي)" 
                        value={payoutName} 
                        onChange={(e) => setPayoutName(e.target.value)} 
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500/50 outline-none" 
                      />
                      
                      <input 
                        type="text" 
                        placeholder={payoutMethod === 'wallet' ? "رقم المحفظة (01xxxxxxxxx)" : "عنوان الإنستاباي (name@instapay)"} 
                        value={payoutNumber} 
                        onChange={(e) => setPayoutNumber(e.target.value)} 
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500/50 outline-none font-mono" 
                      />
                      
                      <button onClick={savePayoutDetails} disabled={isSaving} className="w-full py-3 bg-white text-black rounded-xl font-black text-sm hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                          {isSaving ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                          {isSaving ? 'تم الحفظ' : 'حفظ بيانات السحب'}
                      </button>
                      <p className="text-[10px] text-white/30 text-center">التحويلات بتتم مراجعتها يدوياً كل أسبوع لضمان الأمان.</p>
                  </div>
              </div>

              {/* Payout History */}
              <div className="p-6 bg-[#111] rounded-[32px] border border-white/5 mb-8">
                   <h4 className="font-bold text-white mb-4 flex items-center gap-2"><History className="w-5 h-5" /> سجل المعاملات</h4>
                   {user.affiliate?.payoutHistory && user.affiliate.payoutHistory.length > 0 ? (
                       <div className="space-y-2">
                           {user.affiliate.payoutHistory.map((h, i) => (
                               <div key={i} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0 bg-white/5 rounded-xl px-4">
                                   <div>
                                       <p className="text-sm font-black text-white">{h.amount} ج.م</p>
                                       <p className="text-[10px] text-white/40">{new Date(h.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                                   </div>
                                   <span className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${h.status === 'pending' ? 'bg-amber-900/20 text-amber-400 border-amber-500/20' : 'bg-emerald-900/20 text-emerald-400 border-emerald-500/20'}`}>
                                       {h.status === 'pending' ? 'قيد المراجعة' : 'تم التحويل'}
                                   </span>
                               </div>
                           ))}
                       </div>
                   ) : (
                       <p className="text-xs text-white/30 text-center py-4">لا توجد عمليات سحب سابقة.</p>
                   )}
              </div>

          </div>
      </div>
  );
};

export default AffiliateDashboard;