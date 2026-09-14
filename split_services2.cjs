const fs = require('fs');

const createService = (name, files, extraImports = '') => {
    let content = `// Auto-generated split
import { GoogleGenAI, Type, Modality, FunctionDeclaration } from "@google/genai";
import { Capacitor } from '@capacitor/core';
import { shadowDB, UserProfile, AgentProfile } from "./dbService";
import { getDeviceContext, triggerDeviceAction } from "./deviceService";
import { getAI, resumeAudioContext } from "./geminiService";
${extraImports}

`;
    for (const f of files) {
        if (fs.existsSync(`dump_${f}.txt`)) {
            content += fs.readFileSync(`dump_${f}.txt`, 'utf8') + '\n\n';
        }
    }
    fs.writeFileSync(`services/${name}.ts`, content);
    console.log(`Created ${name}.ts`);
};

createService('mediaService', ['generateImageNative', 'startVideoGenerationNative'], `import axios from 'axios';`);
createService('speechService', ['audioCache', 'stopVoice', 'speakNative', 'generateMp3FromShadowVoice', 'playShadowVoice', 'getShadowVoice'], `import { TextToSpeech } from "@capacitor-community/text-to-speech";\nimport { getShadowResponse } from "./geminiService";`);
createService('ragService', ['generateEmbedding', 'memorizeFact', 'getRelevantMemories', 'analyzeMediaForArchive']);

const geminiKeep = ['getAI', 'getAvailableTools', 'autonomousLearningRoutine', 'getShadowResponse'];

let newGemini = `import { GoogleGenAI, Type, Modality, FunctionDeclaration, GenerateContentResponse } from "@google/genai";
import { Capacitor } from '@capacitor/core';
import { shadowDB, UserProfile, AgentProfile } from "./dbService";
import { getDeviceContext, triggerDeviceAction } from "./deviceService";
import { processOfflineCommand } from "./offlineEdgeService";
import { getRelevantMemories } from "./ragService";

// Export everything from the new splits so imports in other files don't break immediately
export * from "./mediaService";
export * from "./ragService";
export * from "./speechService";

let _ai: GoogleGenAI | null = null;
export const getAI = () => {
    if (!_ai) {
        let rawKey = process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY || (import.meta as any).env?.GEMINI_API_KEY;
        const key = rawKey ? rawKey.replace(/^["']|["']$/g, '').trim() : undefined;
        if (!key) {
             _ai = new GoogleGenAI({ apiKey: "MISSING_KEY_ERROR_WILL_BE_THROWN_ON_USE", apiVersion: 'v1beta' });
             return _ai;
        }
        _ai = new GoogleGenAI({ apiKey: key, apiVersion: 'v1beta' });
    }
    return _ai;
};

// --- AUDIO CONTEXT MANAGEMENT ---
let audioCtx: AudioContext | null = null;
export function resumeAudioContext() {
    try {
        if (!audioCtx) {
            const CtxClass = (window.AudioContext || (window as any).webkitAudioContext);
            if (CtxClass) audioCtx = new CtxClass({ sampleRate: 24000 });
        }
        if (audioCtx && (audioCtx.state === 'suspended' || (audioCtx.state as string) === 'interrupted')) {
            audioCtx.resume().catch(() => {});
        }
        if ('speechSynthesis' in window && window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
        }
        return audioCtx;
    } catch (e) { return null; }
}

`;

for (const f of geminiKeep) {
    if (f !== 'getAI') {
        if (fs.existsSync(`dump_${f}.txt`)) {
            newGemini += fs.readFileSync(`dump_${f}.txt`, 'utf8') + '\n\n';
        }
    }
}

fs.writeFileSync('services/geminiService.ts', newGemini);
console.log('geminiService.ts rewritten successfully.');
