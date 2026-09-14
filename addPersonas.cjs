const fs = require('fs');
let c = fs.readFileSync('components/ArchitectureMap.tsx', 'utf8');

const autonomousNodes = `
                            {/* Sound Engineer */}
                            <div className="absolute w-48 bg-transparent backdrop-blur-none border-2 border-orange-500/50 rounded-2xl p-4 shadow-[0_0_20px_rgba(249,115,22,0.4)] text-center backdrop-blur-md z-40 group hover:scale-125 hover:border-orange-400 hover:z-50 transition-all cursor-crosshair" style={{ left: 1354, top: 1240 }}>
                                <Mic className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                                <span className="text-sm text-orange-300 font-black block mb-1">مهندس الصوت (Sound)</span>
                                <span className="text-[10px] text-white/80 leading-relaxed block">توليد المقاطع الصوتية (TTS)، تحويل النصوص، وتحليل الصوت الذكي.</span>
                            </div>
                            {/* Security Expert */}
                            <div className="absolute w-48 bg-transparent backdrop-blur-none border-2 border-orange-500/50 rounded-2xl p-4 shadow-[0_0_20px_rgba(249,115,22,0.4)] text-center backdrop-blur-md z-40 group hover:scale-125 hover:border-orange-400 hover:z-50 transition-all cursor-crosshair" style={{ left: 1454, top: 1440 }}>
                                <ShieldCheck className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                                <span className="text-sm text-orange-300 font-black block mb-1">خبير الأمان (Security)</span>
                                <span className="text-[10px] text-white/80 leading-relaxed block">تشفير الملفات، قواعد البيانات، جدار حماية للأطراف الثالثة.</span>
                            </div>
`;

if (!c.includes("مهندس الصوت (Sound)")) {
    c = c.replace('{/* Ops Monitor */}', autonomousNodes + '\n                            {/* Ops Monitor */}');
    
    // add connection lines
    const newLines = `
                                { x1: 1000, y1: 1400, x2: 1354, y2: 1240, color: '#f97316' }, // Sound
                                { x1: 1000, y1: 1400, x2: 1454, y2: 1440, color: '#f97316' }, // Security
`;
    c = c.replace("{ x1: 1000, y1: 1400, x2: 1200, y2: 1700, color: '#f97316' }, // Ops Monitor", "{ x1: 1000, y1: 1400, x2: 1200, y2: 1700, color: '#f97316' }, // Ops Monitor\n" + newLines);

    fs.writeFileSync('components/ArchitectureMap.tsx', c);
}
