const fs = require('fs');
let c = fs.readFileSync('services/dbService.ts', 'utf8');
c = c.replace(/if \(filtered.length === 0 && db && navigator.onLine\)/g, 'if (filtered.length === 0 && db)');
fs.writeFileSync('services/dbService.ts', c);
console.log("Replaced successfully!");
