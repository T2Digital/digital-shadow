const fs = require('fs');

let code = fs.readFileSync('services/geminiService.ts', 'utf8');

const importsToAdd = `
import { actionTools } from './toolsConfig';
import { localBrain } from './localBrainService';
import { getContextData, analyzeEmotionFromText } from './sensorService';
let isRequesting = false;
`;

code = code.replace(
    'import { processOfflineCommand } from "./offlineEdgeService";',
    'import { processOfflineCommand } from "./offlineEdgeService";\n' + importsToAdd
);

fs.writeFileSync('services/geminiService.ts', code);
console.log('Patched geminiService.ts imports');
