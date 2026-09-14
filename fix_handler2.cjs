const fs = require('fs');

const extractInnerCode = () => {
    let lines = fs.readFileSync('components/ChatInterface.tsx.tmp', 'utf8').split('\n');
    let toolCode = fs.readFileSync('services/chatToolHandler.ts', 'utf8').split('\n');
    
    // We will just rewrite chatToolHandler.ts cleanly.
    return toolCode;
}

const toolLines = fs.readFileSync('services/chatToolHandler.ts', 'utf8').split('\n');

const fixedContent = `
import { shadowDB, DBTask, UserProfile } from './dbService';
import { submitAutonomousTask } from './autonomousAgentService';
import { memorizeFact, playShadowVoice, generateMp3FromShadowVoice, generateImageNative } from './geminiService';
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
${toolLines.slice(15, toolLines.length - 2).join('\n')}
    return uiCards;
};
`;

fs.writeFileSync('services/chatToolHandler.ts', fixedContent);
