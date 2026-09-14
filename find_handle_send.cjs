const fs = require('fs');
const content = fs.readFileSync('components/ChatInterface.tsx', 'utf8');
const lines = content.split('\n');

let startIndex = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const handleSend =')) {
    startIndex = i;
    break;
  }
}

let braceCount = 0;
let endIndex = -1;
let started = false;

for (let i = startIndex; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('{')) {
    braceCount += (line.match(/\{/g) || []).length;
    started = true;
  }
  if (line.includes('}')) {
    braceCount -= (line.match(/\}/g) || []).length;
  }
  
  if (started && braceCount === 0) {
    endIndex = i;
    break;
  }
}

console.log(`handleSend starts at ${startIndex + 1} and ends at ${endIndex + 1}`);
