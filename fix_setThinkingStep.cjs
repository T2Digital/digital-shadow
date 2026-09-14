const fs = require('fs');
let code = fs.readFileSync('components/ChatInterface.tsx', 'utf8');

code = code.replace(/setThinkingStep\(prev => prev \+ 1\)/g, "(useChatStore.getState().setThinkingStep(useChatStore.getState().thinkingStep + 1))");

// Actually, using useChatStore.getState() is safer inside setInterval because closures might trap old 'thinkingStep' state!
fs.writeFileSync('components/ChatInterface.tsx', code);
console.log('Fixed setThinkingStep');
