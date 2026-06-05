import fs from 'fs';
import path from 'path';

const content = fs.readFileSync('d:/Manya/Angular/Carrer/Organization/frontend/src/pages/AIGovernancePages.tsx', 'utf8');

// Parse tags
let i = 0;
let stack = [];
let re = /<(\/)?([A-Za-z0-9_.-]+)([^>]*?)>/g;
let match;
while ((match = re.exec(content)) !== null) {
  let [full, isClose, name, attrs] = match;
  let line = content.substring(0, match.index).split('\n').length;
  
  if (isClose) {
    let idx = stack.map(x => x.name).lastIndexOf(name);
    if (idx !== -1) {
      stack.splice(idx, 1);
    } else {
      console.log(`Orphan closing tag </${name}> at line ${line}`);
    }
  } else {
    let isSelfClosing = attrs.trim().endsWith('/') || ['input', 'img', 'br', 'hr', 'link', 'meta'].includes(name.toLowerCase());
    if (!isSelfClosing) {
      stack.push({ name, line });
    }
  }
}

console.log('Unclosed tags at end of file:', stack);
