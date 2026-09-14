const fs = require('fs');
let lines = fs.readFileSync('components/ChatInterface.tsx', 'utf8').split('\n');

for (let i = Math.max(0, 1205); i < lines.length; i++) {
    if (lines[i].includes('return (')) {
        lines.splice(i + 1, 0, '    <React.Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-[#0a0a0a]"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></div>}>');
        // add closing tag at the end right before the last closing div.
        let j = lines.length - 1;
        while (!lines[j].includes(');')) j--;
        lines.splice(j, 0, '    </React.Suspense>');
        break;
    }
}

fs.writeFileSync('components/ChatInterface.tsx', lines.join('\n'));
console.log('Done wrapping Suspense');
