const fs = require('fs');

let code = fs.readFileSync('components/chat/ChatCardsRenderer.tsx', 'utf8');

const regex = /export const renderChatCard = \(\n\s*card: any,\n\s*i: number,\n\s*currentUser: any,\n\s*handleSend: \(text: string, v\?: any, i\?: any, skip\?: boolean\) => void,\n\s*setSelectedWorkspaceFile: \(card: any\) => void\n\) => \{/;

if (regex.test(code)) {
    code = code.replace(regex, `export const renderChatCard = (
    card: any, 
    i: number, 
    currentUser: any, 
    handleSend: (text: string, v?: any, i?: any, skip?: boolean) => void,
    setSelectedWorkspaceFile: (card: any) => void
) => {
    return (
        <React.Suspense fallback={<div className="animate-pulse h-32 bg-gray-100 rounded-xl m-2" />}>
            {_renderChatCardInner(card, i, currentUser, handleSend, setSelectedWorkspaceFile)}
        </React.Suspense>
    );
};

const _renderChatCardInner = (
    card: any, 
    i: number, 
    currentUser: any, 
    handleSend: (text: string, v?: any, i?: any, skip?: boolean) => void,
    setSelectedWorkspaceFile: (card: any) => void
) => {`);
    fs.writeFileSync('components/chat/ChatCardsRenderer.tsx', code);
    console.log('Fixed renderChatCard');
} else {
    console.log('Regex did not match');
}
