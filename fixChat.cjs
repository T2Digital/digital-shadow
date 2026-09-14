const fs = require('fs');
let code = fs.readFileSync('components/ChatInterface.tsx', 'utf8');

code = code.replace(/await shadowDB\.updateFSItem\(project\.id,/g, 'await shadowDB.updateFSItem(Number(project.id),');
code = code.replace(/await shadowDB\.updateFSItem\(file\.id,/g, 'await shadowDB.updateFSItem(Number(file.id),');

fs.writeFileSync('components/ChatInterface.tsx', code);
