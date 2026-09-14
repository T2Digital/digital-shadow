const fs = require('fs');
let lines = fs.readFileSync('services/chatToolHandler.ts', 'utf8').split('\n');
// We just remove the last '}' that is unbalanced
let count = 0;
let text = lines.join('\n');
let openCount = (text.match(/\{/g) || []).length;
let closeCount = (text.match(/\}/g) || []).length;
while(closeCount > openCount) {
    let lastIndex = text.lastIndexOf('}');
    text = text.substring(0, lastIndex) + text.substring(lastIndex + 1);
    closeCount = (text.match(/\}/g) || []).length;
}
fs.writeFileSync('services/chatToolHandler.ts', text);
console.log('Fixed');
