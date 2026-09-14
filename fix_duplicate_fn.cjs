const fs = require('fs');
let code = fs.readFileSync('services/speechService.ts', 'utf8');

// I inserted it at the top, I will remove the SECOND definition which is inside a dump file.
let parts = code.split('export function resumeAudioContext() {');
if (parts.length > 2) {
    // Keep the first (which is parts[0] + 'export function...' + parts[1])
    let rest = parts.slice(2).join('export function resumeAudioContext() {');
    // We need to cut out the function body.
    let endIndex = rest.indexOf('catch (e) { return null; }\n}');
    if (endIndex !== -1) {
        rest = rest.substring(endIndex + 'catch (e) { return null; }\n}'.length);
    }
    
    fs.writeFileSync('services/speechService.ts', parts[0] + 'export function resumeAudioContext() {' + parts[1] + rest);
    console.log('Fixed duplicate resumeAudioContext');
}
