const fs = require('fs');
const lines = fs.readFileSync('components/ChatInterface.tsx', 'utf8').split('\n');
for(let i = 750; i < 1948; i++) {
  if (lines[i].includes('t.name ===') || lines[i].includes('t.name===')) {
    console.log(`${i+1}: ${lines[i].trim()}`);
  }
}
