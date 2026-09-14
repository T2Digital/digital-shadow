const fs = require('fs');
let lines = fs.readFileSync('components/chat/ChatCardsRenderer.tsx', 'utf8').split('\n');
let replaced = false;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('export const renderChatCard = (')) {
        let signature = [];
        let j = i;
        while (!lines[j].includes(') => {')) {
            signature.push(lines[j]);
            j++;
        }
        signature.push(lines[j]); // the one with => {
        let sigStr = signature.join('\n');
        
        lines.splice(i, signature.length, 
`export const renderChatCard = (
    card: any, 
    i: number, 
    currentUser: any, 
    handleSend: (text: string, v?: any, inc?: any, skip?: boolean) => void,
    setSelectedWorkspaceFile: (card: any) => void
) => {
    return (
        <React.Suspense fallback={<div className="animate-pulse h-32 bg-[#1a1a1a] border border-gray-800 rounded-xl m-2" />}>
            {_renderChatCardInner(card, i, currentUser, handleSend, setSelectedWorkspaceFile)}
        </React.Suspense>
    );
};

const _renderChatCardInner = (
    card: any, 
    i: number, 
    currentUser: any, 
    handleSend: (text: string, v?: any, inc?: any, skip?: boolean) => void,
    setSelectedWorkspaceFile: (card: any) => void
) => {`);
        replaced = true;
        break;
    }
}
if (replaced) {
    fs.writeFileSync('components/chat/ChatCardsRenderer.tsx', lines.join('\n'));
    console.log('Fixed');
} else {
    console.log('Not found');
}
