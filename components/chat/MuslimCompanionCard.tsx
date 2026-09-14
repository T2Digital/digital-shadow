import React, { useState, useEffect } from 'react';
import { Moon, Sun, BookHeart, Clock, Star, HeartHandshake } from 'lucide-react';
import { Play } from 'lucide-react'; // if we want to add audio button for azkar

export const MuslimCompanionCard = ({ card }: { card: any }) => {
    const [prayerTimes, setPrayerTimes] = useState<any>(null);
    const [sibhaCount, setSibhaCount] = useState(0);
    const [activeWird, setActiveWird] = useState('سبحان الله');
    const [targetCount, setTargetCount] = useState<number | null>(33);

    useEffect(() => {
        if (card.action === 'prayer_times') {
            // Using a free API for approximate times, default to Cairo if auto-detect fails
            fetch('https://api.aladhan.com/v1/timingsByCity?city=Cairo&country=Egypt&method=5')
                .then(res => res.json())
                .then(data => setPrayerTimes(data.data.timings))
                .catch(e => console.error("Prayer times error:", e));
        }

        // Load sibha count
        const savedCount = localStorage.getItem('shadow_sibha_count');
        const savedWird = localStorage.getItem('shadow_sibha_wird');
        const savedTarget = localStorage.getItem('shadow_sibha_target');
        
        if (savedCount) setSibhaCount(parseInt(savedCount) || 0);
        if (savedWird) setActiveWird(savedWird);
        if (savedTarget) setTargetCount(savedTarget === 'open' ? null : parseInt(savedTarget));

    }, [card]);

    const handleSibhaClick = () => {
        let newCount = sibhaCount + 1;
        
        // Vibrate
        if (window.navigator?.vibrate) {
            window.navigator.vibrate(50);
            if (targetCount === null && newCount % 33 === 0) window.navigator.vibrate([100, 50, 100]);
        }
        
        if (targetCount !== null && newCount >= targetCount) {
            if (window.navigator?.vibrate) window.navigator.vibrate([200, 100, 200]);
            newCount = 0; // Reset
        }
        
        setSibhaCount(newCount);
        localStorage.setItem('shadow_sibha_count', newCount.toString());
    };

    const handleReset = () => {
        setSibhaCount(0);
        localStorage.setItem('shadow_sibha_count', '0');
    };

    const handleTargetChange = (val: number | null) => {
        setTargetCount(val);
        localStorage.setItem('shadow_sibha_target', val === null ? 'open' : val.toString());
    };

    const handleWirdChange = (wird: string) => {
        setActiveWird(wird);
        localStorage.setItem('shadow_sibha_wird', wird);
        handleReset();
    };

    return (
        <div className="bg-gradient-to-tr from-[#0f1f2c] to-[#0a111a] border border-[#2a455a] rounded-3xl w-full md:w-[400px] mt-4 p-5 shadow-[0_0_30px_rgba(20,40,60,0.5)] font-sans relative overflow-hidden" dir="rtl">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4a7c9d 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
            
            <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="w-12 h-12 bg-teal-500/10 rounded-2xl flex items-center justify-center text-teal-400 border border-teal-500/20 shadow-[0_0_15px_rgba(20,184,166,0.2)]">
                    <Moon className="w-6 h-6 fill-current" />
                </div>
                <div>
                    <h3 className="font-bold text-white text-lg">الرفيق المسلم</h3>
                    <p className="text-teal-400/80 text-xs">Muslim Companion</p>
                </div>
            </div>

            {card.action === 'tafsir' && card.ayah_text && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-4 backdrop-blur-sm relative z-10">
                    <div className="flex items-center gap-2 mb-2 text-amber-400">
                        <BookHeart className="w-4 h-4" />
                        <span className="font-bold text-sm">تأمل وتدبر</span>
                    </div>
                    <p className="text-white text-base leading-loose font-bold quran-text text-center">﴿ {card.ayah_text} ﴾</p>
                    <div className="h-px bg-white/10 w-full my-3"></div>
                    <p className="text-white/60 text-xs leading-relaxed">
                        سيقوم المايسترو بتفسيرها فوراً ومشاركة أسباب النزول في المحادثة. يمكنك الاستماع لشرح مفصل.
                    </p>
                </div>
            )}

            {card.action === 'prayer_times' && (
                <div className="bg-black/40 border border-white/5 rounded-2xl p-4 mb-4 backdrop-blur-sm relative z-10">
                    <div className="flex items-center gap-2 mb-4 text-teal-400">
                        <Clock className="w-4 h-4" />
                        <span className="font-bold text-sm">مواقيت الصلاة (القاهرة)</span>
                    </div>
                    {prayerTimes ? (
                        <div className="grid grid-cols-5 gap-2 text-center" dir="ltr">
                            {[
                                { name: 'الفجر', key: 'Fajr' },
                                { name: 'الظهر', key: 'Dhuhr' },
                                { name: 'العصر', key: 'Asr' },
                                { name: 'المغرب', key: 'Maghrib' },
                                { name: 'العشاء', key: 'Isha' }
                            ].map(p => (
                                <div key={p.key} className="flex flex-col items-center">
                                    <span className="text-white/50 text-[10px] mb-1 font-bold">{p.name}</span>
                                    <span className="text-white text-xs font-mono bg-white/5 px-2 py-1 rounded w-full">{prayerTimes[p.key]}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-white/50 text-xs text-center py-2 animate-pulse">جاري جلب المواقيت...</p>
                    )}
                </div>
            )}

            {card.action === 'wird_and_sibha' && (
                <div className="flex flex-col items-center justify-center p-4 relative z-10">
                    {/* Controls */}
                    <div className="flex gap-2 mb-6 w-full max-w-[250px]">
                        <select 
                            value={activeWird}
                            onChange={(e) => handleWirdChange(e.target.value)}
                            className="bg-black/30 text-teal-300 text-xs rounded-xl px-3 py-2 border border-teal-500/20 outline-none flex-1 font-bold text-center appearance-none"
                        >
                            <option value="سبحان الله">سبحان الله</option>
                            <option value="الحمد لله">الحمد لله</option>
                            <option value="الله أكبر">الله أكبر</option>
                            <option value="لا إله إلا الله">لا إله إلا الله</option>
                            <option value="أستغفر الله">أستغفر الله</option>
                            <option value="الباقيات الصالحات">الباقيات الصالحات</option>
                        </select>
                        <select
                            value={targetCount === null ? 'open' : targetCount.toString()}
                            onChange={(e) => handleTargetChange(e.target.value === 'open' ? null : parseInt(e.target.value))}
                            className="bg-black/30 text-teal-300 text-xs rounded-xl px-3 py-2 border border-teal-500/20 outline-none flex-1 font-bold text-center appearance-none"
                        >
                            <option value="33">33 تسبيحة</option>
                            <option value="100">100 تسبيحة</option>
                            <option value="open">مفتوح</option>
                        </select>
                    </div>

                    <button 
                        onClick={handleSibhaClick}
                        className="w-32 h-32 rounded-full border-[6px] border-teal-500/30 flex items-center justify-center bg-gradient-to-b from-teal-900/40 to-black hover:scale-105 active:scale-95 active:border-teal-400 transition-all shadow-[0_0_40px_rgba(20,184,166,0.15)] group relative"
                    >
                        {targetCount && sibhaCount > 0 && (
                            <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none text-teal-400" viewBox="0 0 128 128">
                                <circle cx="64" cy="64" r="58" fill="none" stroke="currentColor" strokeWidth="6" strokeDasharray="364" strokeDashoffset={364 - (sibhaCount / targetCount) * 364} className="transition-all duration-300" />
                            </svg>
                        )}
                        <div className="flex flex-col items-center">
                            <span className="text-4xl font-black text-white group-active:text-teal-300 transition-colors z-10">{sibhaCount}</span>
                            <span className="text-teal-500/60 text-[10px] font-bold tracking-widest mt-1 z-10">{activeWird}</span>
                        </div>
                    </button>
                    
                    <button onClick={handleReset} className="mt-6 text-white/30 hover:text-white/60 text-[10px] uppercase tracking-wider font-bold transition-colors">
                        تصفير العداد
                    </button>
                    
                    <p className="text-white/40 text-xs mt-4 text-center">
                        المايسترو يحتفظ بعداد تسبيحاتك دائماً.
                    </p>
                </div>
            )}
        </div>
    );
};
