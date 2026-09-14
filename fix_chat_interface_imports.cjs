const fs = require('fs');

let lines = fs.readFileSync('components/ChatInterface.tsx', 'utf8').split('\n');

const lazyImports = [
  'CapabilitiesGuide',
  'VoiceBiometricsManager',
  'NativeSettings',
  'WorkspaceFileViewer',
  'VoiceShareDialog',
  'SensoryHUD',
  'MemoryVault',
  'LiveAPIMode',
  'PersonalKeysManager',
  'PredictiveAnalyticsBoard',
  'AutonomousManager',
  'LiveTradingBoard',
  'LocalDeepDive',
  'ShadowMeshSync'
];

let newLines = [];

for (let i = 0; i < lines.length; i++) {
   const line = lines[i];
   let matched = false;
   if (line.startsWith('import ') && !line.includes('lucide-react')) {
       for (const comp of lazyImports) {
           if (line.includes(` ${comp} {`) || line.includes(` ${comp} `) || line.includes(`{ ${comp} }`) || line.includes(` ${comp} from`)) {
               // Extract path
               const match = line.match(/from\s+['"]([^'"]+)['"]/);
               if (match) {
                   const path = match[1];
                   if (line.includes('{')) {
                       newLines.push(`const ${comp} = React.lazy(() => import('${path}').then(m => ({ default: m.${comp} })));`);
                   } else {
                       newLines.push(`const ${comp} = React.lazy(() => import('${path}'));`);
                   }
                   matched = true;
                   break;
               }
           }
       }
   }
   if (!matched) {
       newLines.push(line);
   }
}

fs.writeFileSync('components/ChatInterface.tsx', newLines.join('\n'));
console.log('Fixed lazy imports in ChatInterface');
