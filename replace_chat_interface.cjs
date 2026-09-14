const fs = require('fs');
let lines = fs.readFileSync('components/ChatInterface.tsx', 'utf8').split('\n');

const startIndex = 856; // const uiCards: any[] = [];
// In the original file, the tool loop ended at line 1869:
// `          }` (end of for loop)
// Wait! Previously we found `const handleSend starts at 750 and ends at 1948`

const newLines = [
  ...lines.slice(0, startIndex),
  "      let uiCards: any[] = [];",
  "      if (result.toolActions && result.toolActions.length > 0) {",
  "          const { processToolActions } = await import('../services/chatToolHandler');",
  "          uiCards = await processToolActions(result.toolActions, currentUser, { handleSend, setMessages, setShowTradingBoard: () => {} });",
  "      }",
  ...lines.slice(1870) // 1869 was the closing `}` of the for loop, so 1870 is the line after it
];

fs.writeFileSync('components/ChatInterface.tsx', newLines.join('\n'));
