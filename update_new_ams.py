import json

# Read current mapping
with open('public/comprehensive_store_mapping.json', 'r', encoding='utf-8') as f:
    stores = json.load(f)

# Store ID to AM mapping for the three managers
store_am_updates = {
    # Ajitabh Kumar (h1105)
    'S174': 'h1105',
    'S040': 'h1105',
    'S129': 'h1105',
    'S113': 'h1105',
    'S037': 'h1105',
    'S200': 'h1105',
    'S027': 'h1105',
    'S153': 'h1105',
    
    # Hemant Kumar (h777)
    'S036': 'h777',
    'S041': 'h777',
    'S049': 'h777',
    'S120': 'h777',
    'S126': 'h777',
    'S141': 'h777',
    'S173': 'h777',
    'S188': 'h777',
    'S182': 'h777',
    
    # Bikesh Kumar (h2585)
    'S056': 'h2585',
    'S101': 'h2585',
    'S112': 'h2585',
    'S166': 'h2585',
    'S167': 'h2585',
    'S192': 'h2585',
    'S195': 'h2585',
    'S202': 'h2585'
}

# Update stores
updated_count = 0
for store in stores:
    store_id = store.get('Store ID')
    if store_id in store_am_updates:
        old_am = store.get('AM')
        new_am = store_am_updates[store_id]
        if old_am != new_am:
            store['AM'] = new_am
            updated_count += 1
            store_name = store.get('Store Name', '')
            print(f'Updated {store_id} ({store_name}): {old_am} -> {new_am}')

# Save
with open('public/comprehensive_store_mapping.json', 'w', encoding='utf-8') as f:
    json.dump(stores, f, indent=2, ensure_ascii=False)

with open('src/comprehensive_store_mapping.json', 'w', encoding='utf-8') as f:
    json.dump(stores, f, indent=2, ensure_ascii=False)

print(f'\n✅ Updated {updated_count} stores')
print('✅ Files updated: public/ and src/ comprehensive_store_mapping.json')
