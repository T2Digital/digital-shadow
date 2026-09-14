const fs = require('fs');

let code = fs.readFileSync('services/geminiService.ts', 'utf8');

// Insert imports at the top
const imports = `
import { actionTools } from './toolsConfig';
import { localBrain } from './localBrainService';
import { getContextData, analyzeEmotionFromText } from './offlineEdgeService';
`;

code = code.replace(
    'import { processOfflineCommand } from "./offlineEdgeService";',
    'import { processOfflineCommand, getContextData, analyzeEmotionFromText } from "./offlineEdgeService";\nimport { actionTools } from "./toolsConfig";\nimport localBrainService from "./localBrainService";\nlet isRequesting = false;\n'
);

// We don't know the exact export of localBrainService, but usually it's `export const localBrain = new LocalBrainService()` or similar.
// Wait, I should check what is exported from localBrainService.ts
