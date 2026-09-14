const fs = require('fs');
let code = fs.readFileSync('components/ChatInterface.tsx', 'utf8');

code = code.replace(/setPage\(prev => prev \+ 1\)/g, "setPage(page + 1)");
code = code.replace(/setPage\(p => p \+ 1\)/g, "setPage(page + 1)");

fs.writeFileSync('components/ChatInterface.tsx', code);
console.log('Fixed setPage regex');
