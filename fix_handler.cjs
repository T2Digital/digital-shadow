const fs = require('fs');
let lines = fs.readFileSync('services/chatToolHandler.ts', 'utf8').split('\n');
lines.splice(10, 0, '    const uiCards: any[] = [];');
fs.writeFileSync('services/chatToolHandler.ts', lines.join('\n'));
