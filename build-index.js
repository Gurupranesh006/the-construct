import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const contentDir = path.join(__dirname, '../portswigger-labs');
const publicContentDir = path.join(__dirname, 'public', 'content');
const outputJson = path.join(__dirname, 'src', 'writeupsIndex.json');

function copyDirRecursiveSync(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();
    if (isDirectory) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        fs.readdirSync(src).forEach(childItemName => {
            if (childItemName === '.git') return;
            copyDirRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

// Copy content to public folder
console.log('Copying files to public directory...');
copyDirRecursiveSync(contentDir, publicContentDir);

const categories = [];

function scanDir(dir, relativePath = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    entries.forEach(entry => {
        if (entry.name === '.git') return;
        
        const fullPath = path.join(dir, entry.name);
        const relPath = path.join(relativePath, entry.name);
        
        if (entry.isDirectory()) {
            let category = categories.find(c => c.name === entry.name);
            if (!category && relativePath === '') {
                category = { name: entry.name, path: relPath, files: [] };
                categories.push(category);
            }
            scanDir(fullPath, relPath);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
            const categoryName = relativePath.split(path.sep)[0] || 'general';
            let category = categories.find(c => c.name === categoryName);
            
            if (!category) {
                category = { name: categoryName, path: categoryName, files: [] };
                categories.push(category);
            }
            
            const title = entry.name.replace('.md', '');
            category.files.push({
                title: title,
                path: `/content/${relPath.replace(/\\/g, '/')}`,
                fileName: entry.name
            });
        }
    });
}

console.log('Scanning directories for markdown files...');
scanDir(contentDir);

categories.forEach(cat => {
    cat.files.sort((a, b) => a.title.localeCompare(b.title));
});
categories.sort((a, b) => a.name.localeCompare(b.name));

fs.writeFileSync(outputJson, JSON.stringify(categories, null, 2));
console.log('Done! Generated src/writeupsIndex.json');
