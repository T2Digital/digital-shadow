const fs = require('fs');
let code = fs.readFileSync('components/ChatInterface.tsx', 'utf8');

const regexes = [
  /<CapabilitiesGuide/g,
  /<VoiceBiometricsManager/g,
  /<NativeSettings/g,
  /<WorkspaceFileViewer/g,
  /<VoiceShareDialog/g,
  /<SensoryHUD/g,
  /<MemoryVault/g,
  /<LiveAPIMode/g,
  /<PersonalKeysManager/g,
  /<PredictiveAnalyticsBoard/g,
  /<AutonomousManager/g,
  /<LiveTradingBoard/g,
  /<LocalDeepDive/g,
  /<ShadowMeshSync/g
];

let replacedCode = code;

for (const regex of regexes) {
    replacedCode = replacedCode.replace(regex, (match) => {
        return `<React.Suspense fallback={<div className="animate-pulse bg-gray-900 rounded-xl m-2 opacity-50" />}><${match.substring(1)}`;
    });
}

const parts = replacedCode.split('/>');
// Let's not try to blind-replace. Instead we should wrap the whole modal rendering area in Suspense.
