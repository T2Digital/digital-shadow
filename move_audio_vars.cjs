const fs = require('fs');
let gemini = fs.readFileSync('services/geminiService.ts', 'utf8');

// remove resumeAudioContext from gemini
gemini = gemini.replace(/let audioCtx: AudioContext \| null = null;[\s\S]*?\} catch \(e\) \{ return null; \}\n\}/, '');
fs.writeFileSync('services/geminiService.ts', gemini);

let speech = fs.readFileSync('services/speechService.ts', 'utf8');
// remove resumeAudioContext import from geminiService
speech = speech.replace('import { getAI, resumeAudioContext } from "./geminiService";', 'import { getAI } from "./geminiService";\nlet audioCtx: AudioContext | null = null;\nlet currentSource: AudioBufferSourceNode | null = null;\n\nexport function resumeAudioContext() {\n    try {\n        if (!audioCtx) {\n            const CtxClass = (window.AudioContext || (window as any).webkitAudioContext);\n            if (CtxClass) audioCtx = new CtxClass({ sampleRate: 24000 });\n        }\n        if (audioCtx && (audioCtx.state === "suspended" || (audioCtx.state as string) === "interrupted")) {\n            audioCtx.resume().catch(() => {});\n        }\n        if ("speechSynthesis" in window && window.speechSynthesis.paused) {\n            window.speechSynthesis.resume();\n        }\n        return audioCtx;\n    } catch (e) { return null; }\n}\n');

fs.writeFileSync('services/speechService.ts', speech);
console.log('Moved audio variables to speechService');
