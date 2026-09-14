const fs = require('fs');
let code = fs.readFileSync('components/ChatInterface.tsx', 'utf8');

code = code.replace("| 'thinking' | 'speaking'>('idle');\n", "");

fs.writeFileSync('components/ChatInterface.tsx', code);
console.log('Fixed syntax error');
