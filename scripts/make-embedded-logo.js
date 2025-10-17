const fs = require('fs');
const path = require('path');
const inPath = path.join(__dirname, '..', 'assets', 'logo.png');
const outPath = path.join(__dirname, '..', 'src', 'assets', 'embeddedLogo.ts');

if (!fs.existsSync(inPath)) {
  console.error('logo.png not found at', inPath);
  process.exit(1);
}
const buf = fs.readFileSync(inPath);
const b64 = buf.toString('base64');
const ext = 'PNG';
const content = `export const EMBEDDED_LOGO = 'data:image/${ext.toLowerCase()};base64,${b64}';\n`;
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, content);
console.log('Wrote', outPath);
