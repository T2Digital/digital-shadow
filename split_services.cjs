const fs = require('fs');

const createService = (name, files, extraImports = '') => {
    let content = `// Auto-generated split
import { GoogleGenAI, Type, Modality, FunctionDeclaration } from "@google/genai";
import { Capacitor } from '@capacitor/core';
import { shadowDB, UserProfile, AgentProfile } from "./dbService";
import { getDeviceContext, triggerDeviceAction } from "./deviceService";
import { getAI } from "./geminiService";
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

// 1. mediaService
createService('mediaService', ['generateImageNative', 'startVideoGenerationNative'], `import axios from 'axios';`);

// 2. speechService
createService('speechService', ['audioCache', 'stopVoice', 'speakNative', 'generateMp3FromShadowVoice', 'playShadowVoice', 'getShadowVoice'], `import { TextToSpeech } from "@capacitor-community/text-to-speech";
import { getShadowResponse } from "./geminiService";`);

// 3. ragService
createService('ragService', ['generateEmbedding', 'memorizeFact', 'getRelevantMemories', 'analyzeMediaForArchive']);

// Now we need to patch geminiService.ts to remove these and instead export them from the new files
const geminiLines = fs.readFileSync('services/geminiService.ts', 'utf8').split('\n');
let newGemini = [];
let skipMode = false;
const exportedToSkip = [
    'audioCache', 'stopVoice', 'speakNative', 'generateMp3FromShadowVoice', 'playShadowVoice', 'getShadowVoice',
    'generateImageNative', 'startVideoGenerationNative',
    'generateEmbedding', 'memorizeFact', 'getRelevantMemories', 'analyzeMediaForArchive'
];

let i = 0;
while (i < geminiLines.length) {
    const line = geminiLines[i];
    let skippingLine = false;
    for (const ex of exportedToSkip) {
        if (line.startsWith(`export const ${ex}`) || line.startsWith(`export let ${ex}`)) {
            skipMode = true;
            break;
        }
    }
    
    if (skipMode) {
        // Wait till next export or end, wait no, some functions could have export functions inside? No.
        // What if we just skip until we see another `export const `?
        // But some variables inside might use `export const`. So this is risky.
    } else {
        newGemini.push(line);
    }
    i++;
}
// Actually, it's safer to just overwrite `geminiService.ts` from scratch OR append `export * from './mediaService';` etc. But we might have circular dependencies.
