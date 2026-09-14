const fs = require('fs');

let c = fs.readFileSync('components/ArchitectureMap.tsx', 'utf8');

c = c.replace(/\{ \/\* PERSONAS \(Interactive\) -> Sub \*\/[\s\S]*?\{ \/\* PERSONAS \(Autonomous\) -> Sub \*\//, `{ /* PERSONAS \& Lines */
                                { x1: 1000, y1: 600, x2: 600, y2: 400, color: '#ec4899' }, // Leader
                                { x1: 1000, y1: 600, x2: 1100, y2: 300, color: '#ec4899' }, // Detective
                                { x1: 1000, y1: 600, x2: 700, y2: 800, color: '#ec4899' }, // Accountant
                                { x1: 1000, y1: 600, x2: 1300, y2: 700, color: '#ec4899' }, // Legal
                                { x1: 1000, y1: 600, x2: 1200, y2: 850, color: '#ec4899' }, // Marketer
                                { x1: 1000, y1: 1400, x2: 600, y2: 1200, color: '#f97316' }, // Executor
                                { x1: 1000, y1: 1400, x2: 500, y2: 1500, color: '#f97316' }, // Healer
                                { x1: 1000, y1: 1400, x2: 800, y2: 1700, color: '#f97316' }, // Analyst
                                { x1: 1000, y1: 1400, x2: 1200, y2: 1700, color: '#f97316' }, // Nexus
                                { x1: 1000, y1: 1400, x2: 1354, y2: 1240, color: '#f97316' }, // Archivist
                                { /* PERSONAS (Autonomous) -> Sub */`);

const interactiveNodes = `{/* 1. Leader */}
                            <div className="absolute w-48 bg-transparent backdrop-blur-none border-2 border-pink-500/50 rounded-2xl p-4 shadow-[0_0_20px_rgba(236,72,153,0.4)] text-center backdrop-blur-md z-40 group hover:scale-125 hover:border-pink-400 hover:z-50 transition-all cursor-crosshair" style={{ left: 600, top: 400 }}>
                                <Code className="w-8 h-8 text-pink-400 mx-auto mb-2" />
                                <span className="text-sm text-pink-300 font-black block mb-1">المايسترو (Leader)</span>
                                <span className="text-[10px] text-white/80 leading-relaxed block">المدير، الحكيم، صاحب القرار يتحدث بلهجة مصرية قوية.</span>
                            </div>
                            {/* 2. Detective */}
                            <div className="absolute w-48 bg-transparent backdrop-blur-none border-2 border-pink-500/50 rounded-2xl p-4 shadow-[0_0_20px_rgba(236,72,153,0.4)] text-center backdrop-blur-md z-40 group hover:scale-125 hover:border-pink-400 hover:z-50 transition-all cursor-crosshair" style={{ left: 1100, top: 300 }}>
                                <Search className="w-8 h-8 text-pink-400 mx-auto mb-2" />
                                <span className="text-sm text-pink-300 font-black block mb-1">المحقق (Detective)</span>
                                <span className="text-[10px] text-white/80 leading-relaxed block">البحث الحي عن المعلومات والأسعار في الويب.</span>
                            </div>
                            {/* 3. Accountant */}
                            <div className="absolute w-48 bg-transparent backdrop-blur-none border-2 border-pink-500/50 rounded-2xl p-4 shadow-[0_0_20px_rgba(236,72,153,0.4)] text-center backdrop-blur-md z-40 group hover:scale-125 hover:border-pink-400 hover:z-50 transition-all cursor-crosshair" style={{ left: 700, top: 800 }}>
                                <CreditCard className="w-8 h-8 text-pink-400 mx-auto mb-2" />
                                <span className="text-sm text-pink-300 font-black block mb-1">المحاسب (Accountant)</span>
                                <span className="text-[10px] text-white/80 leading-relaxed block">دعم وحساب الأرباح وبناء جداول مالية.</span>
                            </div>
                            {/* 4. Legal */}
                            <div className="absolute w-48 bg-transparent backdrop-blur-none border-2 border-pink-500/50 rounded-2xl p-4 shadow-[0_0_20px_rgba(236,72,153,0.4)] text-center backdrop-blur-md z-40 group hover:scale-125 hover:border-pink-400 hover:z-50 transition-all cursor-crosshair" style={{ left: 1300, top: 700 }}>
                                <Briefcase className="w-8 h-8 text-pink-400 mx-auto mb-2" />
                                <span className="text-sm text-pink-300 font-black block mb-1">المستشار القانوني (Legal)</span>
                                <span className="text-[10px] text-white/80 leading-relaxed block">صياغة العقود والنصائح القانونية.</span>
                            </div>
                            {/* 5. Marketer */}
                            <div className="absolute w-48 bg-transparent backdrop-blur-none border-2 border-pink-500/50 rounded-2xl p-4 shadow-[0_0_20px_rgba(236,72,153,0.4)] text-center backdrop-blur-md z-40 group hover:scale-125 hover:border-pink-400 hover:z-50 transition-all cursor-crosshair" style={{ left: 1200, top: 850 }}>
                                <Megaphone className="w-8 h-8 text-pink-400 mx-auto mb-2" />
                                <span className="text-sm text-pink-300 font-black block mb-1">المسوق (Marketer)</span>
                                <span className="text-[10px] text-white/80 leading-relaxed block">خطط تسويقية وكتابة محتوى بيعي.</span>
                            </div>`;

const autonomousNodes = `{/* 6. Executor */}
                            <div className="absolute w-48 bg-transparent backdrop-blur-none border-2 border-orange-500/50 rounded-2xl p-4 shadow-[0_0_20px_rgba(249,115,22,0.4)] text-center backdrop-blur-md z-40 group hover:scale-125 hover:border-orange-400 hover:z-50 transition-all cursor-crosshair" style={{ left: 600, top: 1200 }}>
                                <Terminal className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                                <span className="text-sm text-orange-300 font-black block mb-1">المنفذ (Executor)</span>
                                <span className="text-[10px] text-white/80 leading-relaxed block">الذراع اليمين لتنفيذ المهام وجدولة المواعيد.</span>
                            </div>
                            {/* 7. Healer */}
                            <div className="absolute w-48 bg-transparent backdrop-blur-none border-2 border-orange-500/50 rounded-2xl p-4 shadow-[0_0_20px_rgba(249,115,22,0.4)] text-center backdrop-blur-md z-40 group hover:scale-125 hover:border-orange-400 hover:z-50 transition-all cursor-crosshair" style={{ left: 500, top: 1500 }}>
                                <HeartHandshake className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                                <span className="text-sm text-orange-300 font-black block mb-1">المعالج (Healer)</span>
                                <span className="text-[10px] text-white/80 leading-relaxed block">الدعم النفسي والطب النبوي والاستشارات.</span>
                            </div>
                            {/* 8. Analyst */}
                            <div className="absolute w-48 bg-transparent backdrop-blur-none border-2 border-orange-500/50 rounded-2xl p-4 shadow-[0_0_20px_rgba(249,115,22,0.4)] text-center backdrop-blur-md z-40 group hover:scale-125 hover:border-orange-400 hover:z-50 transition-all cursor-crosshair" style={{ left: 800, top: 1700 }}>
                                <Activity className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                                <span className="text-sm text-orange-300 font-black block mb-1">المحلل (Analyst)</span>
                                <span className="text-[10px] text-white/80 leading-relaxed block">قراءة ما وراء الصور وتحليل المواقف والشخصيات.</span>
                            </div>
                            {/* 9. Nexus */}
                            <div className="absolute w-48 bg-transparent backdrop-blur-none border-2 border-orange-500/50 rounded-2xl p-4 shadow-[0_0_20px_rgba(249,115,22,0.4)] text-center backdrop-blur-md z-40 group hover:scale-125 hover:border-orange-400 hover:z-50 transition-all cursor-crosshair" style={{ left: 1200, top: 1700 }}>
                                <Cpu className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                                <span className="text-sm text-orange-300 font-black block mb-1">نكسوس (Nexus)</span>
                                <span className="text-[10px] text-white/80 leading-relaxed block">مهندس المنزل الذكي IoT والتحكم بالأجهزة المقترنة.</span>
                            </div>
                            {/* 10. Archivist */}
                            <div className="absolute w-48 bg-transparent backdrop-blur-none border-2 border-orange-500/50 rounded-2xl p-4 shadow-[0_0_20px_rgba(249,115,22,0.4)] text-center backdrop-blur-md z-40 group hover:scale-125 hover:border-orange-400 hover:z-50 transition-all cursor-crosshair" style={{ left: 1354, top: 1240 }}>
                                <Database className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                                <span className="text-sm text-orange-300 font-black block mb-1">الأرشيف (Archivist)</span>
                                <span className="text-[10px] text-white/80 leading-relaxed block">ذاكرة حديدية لحفظ المعلومات واسترجاعها تلقائياً.</span>
                            </div>`;

c = c.replace(/\{\/\* Dev \*\/\}[\s\S]*?(?=\{\/\* =======================================================)/, interactiveNodes + "\n");
c = c.replace(/\{\/\* Web Researcher \*\/\}[\s\S]*?(?=\{\/\* =======================================================\n                            CAPABILITIES HUB)/, autonomousNodes + "\n");

// ensure imports
if (!c.includes('HeartHandshake')) {
   c = c.replace("import ", "import { HeartHandshake } from 'lucide-react';\nimport ");
}

fs.writeFileSync('components/ArchitectureMap.tsx', c);
