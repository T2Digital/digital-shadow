const fs = require('fs');
const lines = fs.readFileSync('services/geminiService.ts', 'utf8').split('\n');
console.log('Total lines:', lines.length);

let currentFn = null;
let currentBlock = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('export const ') && !line.startsWith('export const getAI')) {
        if (currentFn) {
            fs.writeFileSync(`dump_${currentFn}.txt`, currentBlock.join('\n'));
        }
        currentFn = line.split(' ')[2].split('=')[0];
        currentBlock = [line];
    } else if (currentFn) {
        currentBlock.push(line);
    }
}
if (currentFn) {
    fs.writeFileSync(`dump_${currentFn}.txt`, currentBlock.join('\n'));
}

