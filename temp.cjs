const fs = require('fs');
let c = fs.readFileSync('components/ArchitectureMap.tsx', 'utf8');
c = c.replace(/bg-transparent backdrop-blur-none/g, 'bg-black/80');
fs.writeFileSync('components/ArchitectureMap.tsx', c);
