const fs = require('fs');
const path = require('path');

const mappingPath = path.resolve(__dirname, '..', 'src', 'comprehensive_store_mapping.json');

function loadMapping() {
  try {
    const raw = fs.readFileSync(mappingPath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load mapping file:', e.message);
    process.exit(2);
  }
}

const data = loadMapping();

const northStores = data.filter(s => {
  const region = (s.Region || s.region || '').toString().trim().toLowerCase();
  return region === 'north';
});

console.log('Total stores in mapping:', data.length);
console.log('North stores count:', northStores.length);

// Simulate runtime override: hrbpId = H3728 for all North
const hrbp = 'H3728';
const amIds = new Set();
for (const s of northStores) {
  // derive amId from mapping fields
  const am = s.AM || s['Area Manager ID'] || s.amId || null;
  if (am) amIds.add(am);
}

console.log('Unique AM IDs referenced by North stores:', Array.from(amIds).sort());

// Which of these AM IDs exist in constants (attempt to read constants.ts)
const constantsPath = path.resolve(__dirname, '..', 'constants.ts');
let constantsText = '';
try { constantsText = fs.readFileSync(constantsPath, 'utf8'); } catch(e) {}

const missing = [];
for (const id of Array.from(amIds)) {
  if (constantsText && constantsText.includes(`'${id}'`)) continue;
  missing.push(id);
}

console.log('AM IDs missing from constants.ts:', missing);

// For debugging, list some sample stores
console.log('\nSample North stores (first 10):');
for (let i=0;i<Math.min(10,northStores.length);i++){
  const s = northStores[i];
  console.log(i+1, s['Store ID']||s.storeId, '-', s['Store Name']||s.locationName, 'AM=', s.AM || s['Area Manager ID'] || s.amId);
}

process.exit(0);
