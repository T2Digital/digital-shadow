const fs = require('fs');
let code = fs.readFileSync('components/ChatInterface.tsx', 'utf8');

// Insert import
code = code.replace(
    "import { useAppStore } from '../services/store';",
    "import { useAppStore } from '../services/store';\nimport { useChatStore } from '../services/chatStore';"
);

// Replace useState
const replacements = [
    [/const \[page, setPage\] = useState\(1\);/, ''],
    [/const \[hasMoreMessages, setHasMoreMessages\] = useState\(true\);/, ''],
    [/const \[input, setInput\] = useState\(''\);/, ''],
    [/const \[isMuted, setIsMuted\] = useState\(false\);/, ''],
    [/const \[speechSupported, setSpeechSupported\] = useState\(true\);/, ''],
    [/const \[liveTranscript, setLiveTranscript\] = useState\(''\);/, ''],
    [/const \[showCapabilities, setShowCapabilities\] = useState\(false\);/, ''],
    [/const \[isProcessingImage, setIsProcessingImage\] = useState\(false\);/, ''],
    [/const \[audioLevel, setAudioLevel\] = useState\(0\);/, ''],
    [/const \[showBigFace, setShowBigFace\] = useState\(false\);/, ''],
    [/const \[isSentinelMode, setIsSentinelMode\] = useState\(false\);/, ''],
    [/const \[isSearchActive, setIsSearchActive\] = useState\(false\);/, ''],
    [/const \[searchQuery, setSearchQuery\] = useState\(''\);/, ''],
    [/const \[isOffline, setIsOffline\] = useState\(!navigator\.onLine\);/, ''],
    [/const \[thinkingStep, setThinkingStep\] = useState\(0\);/, ''],
    [/const \[isDreaming, setIsDreaming\] = useState\(false\);/, '']
];

for (const rep of replacements) {
    code = code.replace(rep[0], rep[1]);
}

// Add inside the component:
const destructured = `  const {
      input, setInput, appStatus, setAppStatus, isMuted, setIsMuted, isSentinelMode, setIsSentinelMode, isSearchActive, setIsSearchActive,
      page, setPage, hasMoreMessages, setHasMoreMessages, speechSupported, setSpeechSupported, liveTranscript, setLiveTranscript,
      showCapabilities, setShowCapabilities, isProcessingImage, setIsProcessingImage, audioLevel, setAudioLevel, showBigFace, setShowBigFace,
      searchQuery, setSearchQuery, isOffline, setIsOffline, thinkingStep, setThinkingStep, isDreaming, setIsDreaming
  } = useChatStore();
`;

code = code.replace(/const \[appStatus, setAppStatus\] = useState<'idle' \| 'listening' | 'thinking' | 'speaking'>\('idle'\);/, destructured);

fs.writeFileSync('components/ChatInterface.tsx', code);
console.log('Fixed states');
