import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const contentDir = path.join(__dirname, '../portswigger-labs');
const outputJson = path.join(__dirname, 'src', 'writeupsData.json');

const categories = [];

function parseMarkdownToSections(markdownContent) {
    // Remove TOC
    const withoutToc = markdownContent.replace(/<!-- omit in toc -->[\s\S]*?## Table of Contents[\s\S]*?(?=## )/, '');
    
    // Split by H2
    const sections = withoutToc.split(/^## /m).filter(Boolean);
    const parsedSections = [];
    
    sections.forEach(section => {
        const lines = section.trim().split('\n');
        const rawTitle = lines[0].trim();
        // If it was the main `# title`, skip or handle differently. Usually it's H1 so it wasn't matched.
        // Actually the first part before any `## ` might contain `# Title`, we should ignore it.
        
        if (rawTitle.startsWith('#') || !rawTitle) return; // Skip if it's the main H1 or empty
        
        const title = rawTitle;
        const content = '## ' + section.trim(); // Add back the H2
        
        parsedSections.push({
            id: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
            title: title,
            content: content
        });
    });
    
    return parsedSections;
}

function scanDir(dir, relativePath = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    entries.forEach(entry => {
        if (entry.name === '.git') return;
        
        const fullPath = path.join(dir, entry.name);
        const relPath = path.join(relativePath, entry.name);
        
        if (entry.isDirectory()) {
            let category = categories.find(c => c.name === entry.name);
            if (!category && relativePath === '') {
                category = { name: entry.name, path: relPath, topics: [] };
                categories.push(category);
            }
            scanDir(fullPath, relPath);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
            const categoryName = relativePath.split(path.sep)[0] || 'general';
            let category = categories.find(c => c.name === categoryName);
            
            if (!category) {
                category = { name: categoryName, path: categoryName, topics: [] };
                categories.push(category);
            }
            
            const markdownContent = fs.readFileSync(fullPath, 'utf8');
            
            // For README.md, try to parse sections
            if (entry.name === 'README.md') {
                const sections = parseMarkdownToSections(markdownContent);
                if (sections.length > 0) {
                    category.topics.push(...sections);
                } else {
                    // If no sections found, just add the whole file as a general topic
                    category.topics.push({
                        id: 'general',
                        title: 'Overview',
                        content: markdownContent
                    });
                }
            } else {
                // For other md files, add them as separate topics
                category.topics.push({
                    id: entry.name.replace('.md', '').toLowerCase(),
                    title: entry.name.replace('.md', ''),
                    content: markdownContent
                });
            }
        }
    });
}

console.log('Scanning directories and parsing markdown files...');
scanDir(contentDir);

// Clean up and sort
categories.forEach(cat => {
    // Remove duplicates based on ID
    const uniqueTopics = [];
    const ids = new Set();
    cat.topics.forEach(t => {
        if (!ids.has(t.id)) {
            ids.add(t.id);
            uniqueTopics.push(t);
        }
    });
    cat.topics = uniqueTopics;
});
categories.sort((a, b) => a.name.localeCompare(b.name));

// Remove empty categories and 'general'
const filteredCategories = categories.filter(c => c.topics.length > 0 && c.name !== 'general');

fs.writeFileSync(outputJson, JSON.stringify(filteredCategories, null, 2));
console.log('Done! Generated src/writeupsData.json');
