const fs = require('fs');
let text = fs.readFileSync('services/chatToolHandler.ts', 'utf8');
let openCount = (text.match(/\{/g) || []).length;
let closeCount = (text.match(/\}/g) || []).length;
console.log(`Open: ${openCount}, Close: ${closeCount}`);
if (openCount > closeCount) {
   text += '\n}'.repeat(openCount - closeCount);
   fs.writeFileSync('services/chatToolHandler.ts', text);
   console.log('Fixed brackets');
}
if (closeCount > openCount) {
    console.log('Too many close brackets!');
}
