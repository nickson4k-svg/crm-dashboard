const fs = require('fs');

let css = fs.readFileSync('style.css', 'utf8');

// Define replacements
const replacements = [
  // Background elements
  { from: /#121821/g, to: 'var(--el-bg-1)' },
  { from: /#0F141C/g, to: 'var(--el-bg-2)' },
  { from: /rgba\(48,54,61,\.95\)/g, to: 'var(--el-border)' },
  { from: /rgba\(48,54,61,\.85\)/g, to: 'var(--el-border)' },
  { from: /rgba\(48,54,61,\.55\)/g, to: 'var(--el-border-light)' },
  { from: /rgba\(48,54,61,\.45\)/g, to: 'var(--el-border-light)' },
  { from: /rgba\(48,54,61,\.9\)/g, to: 'var(--el-border)' },
  
  // Secondary Buttons
  { from: /#311e1e/g, to: 'var(--btn-sec-bg)' },
  { from: /rgba\(50, 123, 201, 0\.55\)/g, to: 'var(--btn-sec-hover-border)' },
  { from: /#3d0808/g, to: 'var(--btn-sec-hover)' },
  
  // Text colors
  { from: /rgba\(230,237,243,\.92\)/g, to: 'var(--text)' },
  { from: /rgba\(230,237,243,\.95\)/g, to: 'var(--text)' },
  { from: /rgba\(230,237,243,\.98\)/g, to: 'var(--text)' },
  { from: /rgba\(230,237,243,\.85\)/g, to: 'var(--text)' },
  { from: /rgba\(230,237,243,\.62\)/g, to: 'var(--muted)' },
  { from: /rgba\(230,237,243,\.65\)/g, to: 'var(--muted)' },
  { from: /rgba\(230,237,243,\.55\)/g, to: 'var(--muted)' },
  { from: /rgba\(230,237,243,\.44\)/g, to: 'var(--muted2)' },
  
  // Accents
  { from: /rgba\(0,123,255,\.95\)/g, to: 'var(--accent)' },
  { from: /rgba\(0,123,255,\.75\)/g, to: 'var(--accent)' },
  { from: /rgba\(0,123,255,\.55\)/g, to: 'var(--accent-hover)' },
  { from: /rgba\(0,123,255,\.35\)/g, to: 'var(--accent2)' },
  { from: /rgba\(0,123,255,\.25\)/g, to: 'var(--accent2)' },
  { from: /rgba\(0,123,255,\.10\)/g, to: 'var(--accent2)' },
  { from: /#0D1117/g, to: 'var(--bg)' },
  { from: /#161B22/g, to: 'var(--panel)' }
];

replacements.forEach(r => {
  css = css.replace(r.from, r.to);
});

// Write it back
fs.writeFileSync('style.css', css, 'utf8');
console.log('Replaced hardcoded colors!');
