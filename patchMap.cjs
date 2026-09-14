const fs = require('fs');
let c = fs.readFileSync('components/ArchitectureMap.tsx', 'utf8');

if (!c.includes("Briefcase")) {
    c = c.replace(
        "import { Cpu, Users, Zap, Database, Brain, Globe, Bot, Terminal, Image as ImageIcon, FileText, Search, Activity, Code, Server, CreditCard, MessageCircle, Briefcase, PlayCircle, HardDrive, Film, LayoutGrid, FolderOpen, CheckCircle, Mic, ShieldCheck }",
        "import { Cpu, Users, Zap, Database, Brain, Globe, Bot, Terminal, Image as ImageIcon, FileText, Search, Activity, Code, Server, CreditCard, MessageCircle, Briefcase, PlayCircle, HardDrive, Film, LayoutGrid, FolderOpen, CheckCircle, Mic, ShieldCheck, GraduationCap, TrendingUp, Megaphone, HeartHandshake } "
    );
}

// Add new Interactive connection lines
const newIntLines = `
                                { x1: 1000, y1: 600, x2: 1300, y2: 700, color: '#ec4899' }, // Accountant
                                { x1: 1000, y1: 600, x2: 1200, y2: 850, color: '#ec4899' }, // Legal
                                { x1: 1000, y1: 600, x2: 850, y2: 350, color: '#ec4899' }, // Teacher
`;
if (!c.includes("1300, y2: 700")) {
    c = c.replace(
        "{ x1: 1000, y1: 600, x2: 700, y2: 800, color: '#ec4899' }, // Maestro",
        "{ x1: 1000, y1: 600, x2: 700, y2: 800, color: '#ec4899' }, // Maestro" + newIntLines
    );
}

// Add new Autonomous connection lines
const newAutoLines = `
                                { x1: 1000, y1: 1400, x2: 700, y2: 1100, color: '#f97316' }, // Trader
                                { x1: 1000, y1: 1400, x2: 1200, y2: 1100, color: '#f97316' }, // Marketer
                                { x1: 1000, y1: 1400, x2: 650, y2: 1750, color: '#f97316' }, // Nexus
                                { x1: 1000, y1: 1400, x2: 900, y2: 1900, color: '#f97316' }, // Healer
`;
if (!c.includes("1200, y2: 1100, color: '#f97316'")) {
    c = c.replace(
        "{ x1: 1000, y1: 1400, x2: 1454, y2: 1440, color: '#f97316' }, // Security",
        "{ x1: 1000, y1: 1400, x2: 1454, y2: 1440, color: '#f97316' }, // Security" + newAutoLines
    );
}

const intNodes = `
                            {/* Accountant */}
                            <div className="absolute w-48 bg-transparent backdrop-blur-none border-2 border-pink-500/50 rounded-2xl p-4 shadow-[0_0_20px_rgba(236,72,153,0.4)] text-center backdrop-blur-md z-40 group hover:scale-125 hover:border-pink-400 hover:z-50 transition-all cursor-crosshair" style={{ left: 1300, top: 700 }}>
                                <CreditCard className="w-8 h-8 text-pink-400 mx-auto mb-2" />
                                <span className="text-sm text-pink-300 font-black block mb-1">المحاسب (Accountant)</span>
                                <span className="text-[10px] text-white/80 leading-relaxed block">دعم وحساب الأرباح، تقارير المصروفات، وبناء جداول مالية تفاعلية.</span>
                            </div>
                            {/* Legal Advisor */}
                            <div className="absolute w-48 bg-transparent backdrop-blur-none border-2 border-pink-500/50 rounded-2xl p-4 shadow-[0_0_20px_rgba(236,72,153,0.4)] text-center backdrop-blur-md z-40 group hover:scale-125 hover:border-pink-400 hover:z-50 transition-all cursor-crosshair" style={{ left: 1200, top: 850 }}>
                                <Briefcase className="w-8 h-8 text-pink-400 mx-auto mb-2" />
                                <span className="text-sm text-pink-300 font-black block mb-1">المستشار القانوني (Legal)</span>
                                <span className="text-[10px] text-white/80 leading-relaxed block">صياغة العقود، النصائح، وفحص الوثائق بموثوقية عالية.</span>
                            </div>
                            {/* Teacher */}
                            <div className="absolute w-48 bg-transparent backdrop-blur-none border-2 border-pink-500/50 rounded-2xl p-4 shadow-[0_0_20px_rgba(236,72,153,0.4)] text-center backdrop-blur-md z-40 group hover:scale-125 hover:border-pink-400 hover:z-50 transition-all cursor-crosshair" style={{ left: 850, top: 350 }}>
                                <Code className="w-8 h-8 text-pink-400 mx-auto mb-2" />
                                <span className="text-sm text-pink-300 font-black block mb-1">المعلم (Teacher)</span>
                                <span className="text-[10px] text-white/80 leading-relaxed block">تبسيط المفاهيم، اختبارات تفاعلية، ومتابعة تعلم الماستر.</span>
                            </div>
`;

if (!c.includes("المحاسب (Accountant)")) {
    c = c.replace(
        `{/* Maestro */}`,
        intNodes + `\n                            {/* Maestro */}`
    );
}

const autoNodes = `
                            {/* Trader */}
                            <div className="absolute w-48 bg-transparent backdrop-blur-none border-2 border-orange-500/50 rounded-2xl p-4 shadow-[0_0_20px_rgba(249,115,22,0.4)] text-center backdrop-blur-md z-40 group hover:scale-125 hover:border-orange-400 hover:z-50 transition-all cursor-crosshair" style={{ left: 700, top: 1100 }}>
                                <Activity className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                                <span className="text-sm text-orange-300 font-black block mb-1">المحلل الفني (Trader)</span>
                                <span className="text-[10px] text-white/80 leading-relaxed block">سرب التداول المباشر، جلب وتحليل الشارت، ومضاربات آلية (Binance).</span>
                            </div>
                            {/* Marketer */}
                            <div className="absolute w-48 bg-transparent backdrop-blur-none border-2 border-orange-500/50 rounded-2xl p-4 shadow-[0_0_20px_rgba(249,115,22,0.4)] text-center backdrop-blur-md z-40 group hover:scale-125 hover:border-orange-400 hover:z-50 transition-all cursor-crosshair" style={{ left: 1200, top: 1100 }}>
                                <Search className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                                <span className="text-sm text-orange-300 font-black block mb-1">المسوق (Marketer)</span>
                                <span className="text-[10px] text-white/80 leading-relaxed block">كتابة إعلانات إقناعية، دمج روابط دعوة، وتخطيط حملات شاملة.</span>
                            </div>
                            {/* Nexus */}
                            <div className="absolute w-48 bg-transparent backdrop-blur-none border-2 border-orange-500/50 rounded-2xl p-4 shadow-[0_0_20px_rgba(249,115,22,0.4)] text-center backdrop-blur-md z-40 group hover:scale-125 hover:border-orange-400 hover:z-50 transition-all cursor-crosshair" style={{ left: 650, top: 1750 }}>
                                <Cpu className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                                <span className="text-sm text-orange-300 font-black block mb-1">نكسوس (Nexus)</span>
                                <span className="text-[10px] text-white/80 leading-relaxed block">التحكم في الأجهزة وتفعيل Webhooks للمنازل الذكية (IoT).</span>
                            </div>
                            {/* Healer */}
                            <div className="absolute w-48 bg-transparent backdrop-blur-none border-2 border-orange-500/50 rounded-2xl p-4 shadow-[0_0_20px_rgba(249,115,22,0.4)] text-center backdrop-blur-md z-40 group hover:scale-125 hover:border-orange-400 hover:z-50 transition-all cursor-crosshair" style={{ left: 900, top: 1900 }}>
                                <CheckCircle className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                                <span className="text-sm text-orange-300 font-black block mb-1">المعالج (Healer)</span>
                                <span className="text-[10px] text-white/80 leading-relaxed block">الرقى، الطب النبوي، والاستناد إلى مصادر طبية وروحانية.</span>
                            </div>
`;

if (!c.includes("المحلل الفني (Trader)")) {
    c = c.replace(
        `{/* Ops Monitor */}`,
        autoNodes + `\n                            {/* Ops Monitor */}`
    );
}

// Make sure GraduationCap, TrendingUp, Megaphone, HeartHandshake imports are fixed
c = c.replace(/import \{ Cpu.*?\} from 'lucide-react';/, "import { Cpu, Users, Zap, Database, Brain, Globe, Bot, Terminal, Image as ImageIcon, FileText, Search, Activity, Code, Server, CreditCard, MessageCircle, Briefcase, PlayCircle, HardDrive, Film, LayoutGrid, FolderOpen, CheckCircle, Mic, ShieldCheck, GraduationCap, TrendingUp, Megaphone, HeartHandshake } from 'lucide-react';");

fs.writeFileSync('components/ArchitectureMap.tsx', c);
console.log("Patched ArchitectureMap.tsx");
