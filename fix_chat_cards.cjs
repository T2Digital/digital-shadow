const fs = require('fs');
let code = fs.readFileSync('components/chat/ChatCardsRenderer.tsx', 'utf8');

// The imports are around line 6 to 22:
const lines = code.split('\n');
let newLines = [];
let transformedClasses = new Set();
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('import { ') && line.includes(' } from \'./') && !line.includes('ToolCardRenderer')) {
        const match = line.match(/import { (.*?) } from '(.*?)';/);
        if (match) {
            const comps = match[1].split(',').map(s => s.trim());
            comps.forEach(c => {
                if(c === 'ResponsiveContainer' || c=== 'LineChart' || c=== 'Line' || c=== 'BarChart' || c=== 'Bar' || c=== 'PieChart' || c=== 'Pie' || c=== 'Cell' || c=== 'XAxis' || c=== 'YAxis' || c=== 'Tooltip'){
                    // Not lazy loading recharts directly like this
                } else {
                    newLines.push(`const ${c} = React.lazy(() => import('${match[2]}').then(m => ({ default: m.${c} })));`);
                    transformedClasses.add(c);
                }
            });
            if (line.includes('recharts')) {
                newLines.push(line);
            }
        } else {
            newLines.push(line);
        }
    } else {
        newLines.push(line);
    }
}

code = newLines.join('\n');

// We also need to add suspense boundary in renderChatCard
// renderChatCard is exported as a function

let patchedRenderChatCard = code.replace(
    /export const renderChatCard = \(card: any, i: number\) => \{/g,
    `export const renderChatCard = (card: any, i: number) => {
    return (
        <React.Suspense fallback={<div className="animate-pulse h-32 bg-gray-100 rounded-xl" />}>
            {_renderChatCardInner(card, i)}
        </React.Suspense>
    );
}

const _renderChatCardInner = (card: any, i: number) => {`
);

fs.writeFileSync('components/chat/ChatCardsRenderer.tsx', patchedRenderChatCard);
console.log('Done transforming ChatCardsRenderer.tsx');
