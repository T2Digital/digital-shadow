const fs = require('fs');
let lines = fs.readFileSync('services/chatToolHandler.ts', 'utf8').split('\n');

const tail = `                  }
              }
          }
    return uiCards;
};`;

lines.splice(1032, 10, tail);
fs.writeFileSync('services/chatToolHandler.ts', lines.join('\n'));
