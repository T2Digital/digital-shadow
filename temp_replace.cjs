const fs = require('fs');
let content = fs.readFileSync('components/ArchitectureMap.tsx', 'utf8');
content = content.replace(/bg-black\/80/g, 'bg-transparent backdrop-blur-none');
fs.writeFileSync('components/ArchitectureMap.tsx', content);
