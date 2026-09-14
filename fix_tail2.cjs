const fs = require('fs');
let lines = fs.readFileSync('services/chatToolHandler.ts', 'utf8').split('\n');
const tail = `                      } catch (e: any) {
                          uiCards.push({ cardType: 'task_success', title: \`خطأ في أداة \${activePlugin.name}\`, description: e.toString() });
                          const errText = \`[DYNAMIC_PLUGIN_ERROR / \${activePlugin.name}]\\n\${e.toString()}\\n\\n[INSTRUCTION]: لقد حدث خطأ أثناء تنفيذ هذا البلوجن. أخبر المستخدم بالخطأ.\`;
                          setTimeout(() => handleSend(errText, undefined, undefined, true), 100);
                      }
                  }
              }
    } // End of for loop
    return uiCards;
};`;

lines.splice(1027, 20, tail);
fs.writeFileSync('services/chatToolHandler.ts', lines.join('\n'));
