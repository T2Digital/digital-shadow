const fs = require('fs');
let lines = fs.readFileSync('services/chatToolHandler.ts', 'utf8').split('\n');
// Ensure it ends properly:
// 1. Find last '}' before 'return uiCards'
// 2. We don't need 'for' loop brackets if they are misaligned, but wait, the loop was opened explicitly.

const correctedCode = `
import { shadowDB, DBTask, UserProfile } from './dbService';
import { submitAutonomousTask } from './autonomousAgentService';
import { memorizeFact, playShadowVoice, generateMp3FromShadowVoice, generateImageNative, getShadowResponse } from './geminiService';
import { performNativeAction } from './deviceService';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export interface ToolHandlerContext {
    handleSend: (text: string, audio?: Blob, existingAudio?: string, isHidden?: boolean, ignoreLimit?: boolean) => void;
    setMessages: any;
    setShowTradingBoard: (b: boolean) => void;
}

export const processToolActions = async (
    toolActions: any[],
    currentUser: UserProfile,
    ctx: ToolHandlerContext
): Promise<any[]> => {
    const uiCards: any[] = [];
    if (!toolActions || toolActions.length === 0) return uiCards;
    
    const { handleSend, setMessages, setShowTradingBoard } = ctx;
    
    for (const t of toolActions) {
`;

// Read the original ChatInterface.tsx to get EXACTLY the body of the loop
const origLines = fs.readFileSync('components/ChatInterface.tsx.tmp', 'utf8').split('\n');
// Wait, we removed it from ChatInterface.tsx.tmp !!! We need to use the previous chatToolHandler.ts before my rewrite.
// Fortunately, the body is inside lines 24 to 1033.

let body = lines.slice(24, lines.length - 5).join('\n'); 

fs.writeFileSync('services/chatToolHandler.ts', correctedCode + body + '\n    }\n    return uiCards;\n};\n');
