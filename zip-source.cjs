const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');

const zip = new AdmZip();

function addFolder(dirPath, zipPath) {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
        // Exclude heavy/unnecessary folders and AI Studio history
        if (['node_modules', 'dist', '.git', 'public', 'zip-source.cjs', 'migrated_prompt_history'].includes(file)) continue;
        
        const fullPath = path.join(dirPath, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            addFolder(fullPath, path.join(zipPath, file));
        } else {
            zip.addLocalFile(fullPath, zipPath);
        }
    }
}

try {
    console.log('Zipping project files...');
    addFolder('.', '');
    
    if (!fs.existsSync('./public')) {
        fs.mkdirSync('./public');
    }
    
    zip.writeZip('./public/source-code.zip');
    console.log('Zip created successfully at public/source-code.zip');
} catch (err) {
    console.error('Error creating zip:', err);
}
