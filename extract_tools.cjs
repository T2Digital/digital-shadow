const fs = require('fs');

const lines = fs.readFileSync('components/ChatInterface.tsx', 'utf8').split('\n');

const startIndex = 856; // `const uiCards: any[] = [];`
const endIndex = 1869; // `           }` of the for loop.

// Validate bounds
console.log("Start line text:", lines[startIndex]);
console.log("End line text:", lines[endIndex]);

const toolCode = lines.slice(startIndex, endIndex + 1).join('\n');

const toolHandlerContent = `
import { shadowDB, DBTask, UserProfile } from './dbService';
import { submitAutonomousTask } from './autonomousAgentService';
import { memorizeFact } from './geminiService';
import { performNativeAction } from './deviceService';

export const processToolActions = async (
    toolActions: any[],
    currentUser: UserProfile,
    handleSend: (text: string, audio?: Blob, existingAudio?: string, isHidden?: boolean, ignoreLimit?: boolean) => void
): Promise<any[]> => {
${toolCode}
    return uiCards;
};
`;

fs.writeFileSync('services/chatToolHandler.ts', toolHandlerContent);
console.log("chatToolHandler.ts created.");

const newLines = [
  ...lines.slice(0, startIndex),
  "      const { processToolActions } = await import('../services/chatToolHandler');",
  "      const uiCards = await processToolActions(result.toolActions, currentUser, handleSend);",
  ...lines.slice(endIndex + 1)
];

fs.writeFileSync('components/ChatInterface.tsx.tmp', newLines.join('\n'));
console.log("ChatInterface.tsx.tmp written. Original length:", lines.length, "New length:", newLines.length);
