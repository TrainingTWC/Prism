import json

# AM Name to ID mapping
am_mapping = {
    "Abhishek": "H3386",
    "Shubham": "H3914",
    "Umakanth": "H3270",
    "Karthik": "H3362",
    "Jagruti": "H2155",
    "Shailesh": "H2908",
    "Anil": "H2262",
    "Vruchika": "H1575",
    "Sanjay": "H2273",
    "VijayaLakshmi": "H2759",
    "Nandish": "H833",
    "Himanshu": "H955",
    "Ajay H": "H546",
    "Kiran": "H2601",
    "Atul": "H2396",
    "Amar": "h535",
    "Suresh": "H1355",
    "Vishu": "H1766",
    "Rutuja": "H2758"
}

# Store ID to AM name mapping from user's list
store_am_mapping = {
    "S216": "Abhishek",
    "S219": "Shubham",
    "S050": "Umakanth",
    "S021": "Karthik",
    "S114": "Umakanth",
    "S206": "Anil",
    "S115": "Jagruti",
    "S162": "Shailesh",
    "S197": "Atul",
    "S155": "Atul",
    "S190": "Umakanth",
    "S204": "Vruchika",
    "S161": "Sanjay",
    "S163": "Shailesh",
    "S123": "Karthik",
    "S189": "Ajay H",
    "S215": "Anil",
    "S210": "VijayaLakshmi",
    "S205": "VijayaLakshmi",
    "S108": "Anil",
    "S110": "Nandish",
    "S040": "Himanshu",
    "S065": "Ajay H",
    "S007": "Jagruti",
    "S128": "Shubham",
    "S102": "Atul",
    "S154": "Atul",
    "S144": "Karthik",
    "S158": "Kiran",
    "S086": "Anil",
    "S147": "Sanjay",
    "S070": "Nandish",
    "S061": "Vruchika",
    "S072": "Amar",
    "S141": "Himanshu",
    "S140": "Kiran",
    "S014": "Jagruti",
    "S211": "Anil",
    "S028": "Himanshu",
    "S185": "Nandish",
    "S069": "Suresh",
    "S094": "Kiran",
    "S022": "Umakanth",
    "S051": "Kiran",
    "S024": "Amar",
    "S156": "Suresh",
    "S167": "Vishu",
    "S082": "Anil",
    "S126": "Himanshu",
    "S008": "Kiran",
    "S001": "Suresh",
    "S133": "Umakanth",
    "S125": "Nandish",
    "S073": "Atul",
    "S006": "Umakanth",
    "S003": "Umakanth",
    "S017": "Suresh",
    "S184": "Ajay H",
    "S134": "Rutuja",
    "S057": "Abhishek",
    "S121": "Himanshu",
    "S020": "Jagruti",
    "S104": "Rutuja",
    "S116": "Vruchika",
    "S056": "Vishu",
    "S105": "Shailesh",
    "S036": "Himanshu",
    "S178": "Karthik",
    "S027": "Vishu",
    "S042": "Atul",
    "S039": "Atul",
    "S034": "Ajay H",
    "S002": "Ajay H",
    "S045": "Shailesh",
    "S127": "Sanjay",
    "S087": "Shailesh",
    "S089": "Sanjay",
    "S129": "Himanshu",
    "S067": "Kiran",
    "S095": "Umakanth",
    "S026": "Himanshu",
    "S011": "Jagruti",
    "S016": "Kiran",
    "S009": "Ajay H",
    "S143": "Karthik",
    "S044": "Abhishek",
    "S033": "Kiran",
    "S106": "Abhishek",
    "S060": "Rutuja",
    "S091": "Ajay H",
    "S031": "Jagruti",
    "S043": "Abhishek",
    "S177": "Abhishek",
    "S055": "Vishu",
    "S146": "Nandish",
    "S152": "Suresh",
    "S120": "Himanshu",
    "S047": "Shailesh",
    "S200": "Himanshu",
    "S107": "Abhishek",
    "S012": "Jagruti",
    "S132": "Vruchika",
    "S176": "Atul",
    "S068": "Suresh",
    "S074": "Shubham",
    "S075": "Shailesh",
    "S109": "Rutuja",
    "S165": "Vruchika",
    "S077": "Abhishek",
    "S019": "Ajay H",
    "S062": "Atul",
    "S088": "Vruchika",
    "S037": "Vishu",
    "S166": "Vishu",
    "S201": "Karthik",
    "S171": "Amar",
    "S048": "Shubham",
    "S157": "Karthik",
    "S103": "Sanjay",
    "S041": "Himanshu",
    "S080": "Rutuja",
    "S145": "Karthik",
    "S111": "Sanjay",
    "S118": "Sanjay",
    "S096": "Vruchika",
    "S005": "Ajay H",
    "S186": "Rutuja",
    "S142": "Amar",
    "S078": "Abhishek",
    "S122": "Atul",
    "S172": "Amar",
    "S182": "Himanshu",
    "S113": "Himanshu",
    "S097": "Shailesh",
    "S130": "Rutuja",
    "S053": "Ajay H",
    "S004": "Jagruti",
    "S153": "Vishu",
    "S063": "Suresh",
    "S173": "Himanshu",
    "S117": "Abhishek",
    "S049": "Vishu",
    "S188": "Himanshu",
    "S076": "Vruchika",
    "S149": "Umakanth",
    "S192": "Vishu",
    "S112": "Vishu",
    "S135": "Abhishek",
    "S032": "Ajay H",
    "S038": "Atul",
    "S159": "Kiran",
    "S193": "Jagruti",
    "S035": "Amar",
    "S085": "Anil",
    "S090": "Vruchika",
    "S170": "Sanjay",
    "S015": "Umakanth",
    "S066": "Anil",
    "S174": "Himanshu",
    "S084": "Anil",
    "S083": "Anil",
    "S202": "Vishu",
    "S168": "Sanjay",
    "S198": "Atul",
    "S058": "Shubham",
    "S081": "Anil",
    "S194": "Anil",
    "S137": "Sanjay",
    "S100": "Atul",
    "S169": "Anil",
    "S138": "Vruchika",
    "S150": "Atul",
    "S059": "Shubham",
    "S148": "Atul",
    "S195": "Vishu",
    "S101": "Vishu",
    "S025": "Atul",
    "S136": "Rutuja",
    "S191": "Nandish",
    "S131": "Suresh",
    "S018": "Umakanth",
    "S030": "Nandish",
    "S119": "Suresh",
    "S175": "Anil",
    "S139": "Umakanth",
    "S023": "Nandish",
    "S164": "Atul",
    "S099": "Atul",
    "S092": "Nandish"
}

# New stores to add
new_stores = {
    "S216": {
        "Store ID": "S216",
        "Store Name": "Kotia Nirman- Andheri West",
        "Region": "West",
        "Menu": "REGULAR",
        "Store Type": "Highstreet",
        "Concept": "Experience",
        "HRBP": "H3603",
        "Trainer": "H3603",
        "AM": "H3386",
        "E-Learning Specialist": "H541",
        "Training Head": "H3237",
        "HR Head": "H2081"
    },
    "S219": {
        "Store ID": "S219",
        "Store Name": "Pune Camp",
        "Region": "West",
        "Menu": "REGULAR",
        "Store Type": "Highstreet",
        "Concept": "Experience",
        "HRBP": "H3728",
        "Trainer": "H3728",
        "AM": "H3914",
        "E-Learning Specialist": "H541",
        "Training Head": "H3237",
        "HR Head": "H2081"
    }
}

# Read the comprehensive store mapping
with open('public/comprehensive_store_mapping.json', 'r', encoding='utf-8') as f:
    stores = json.load(f)

# Update AM field for all stores based on mapping
updated_count = 0
for store in stores:
    store_id = store.get("Store ID")
    if store_id in store_am_mapping:
        am_name = store_am_mapping[store_id]
        am_id = am_mapping.get(am_name)
        if am_id:
            old_am = store.get("AM")
            store["AM"] = am_id
            if old_am != am_id:
                updated_count += 1
                print(f"Updated {store_id} ({store['Store Name']}): {old_am} → {am_id} ({am_name})")

# Add new stores
for store_id, store_data in new_stores.items():
    if not any(s.get("Store ID") == store_id for s in stores):
        stores.append(store_data)
        print(f"Added new store: {store_id} ({store_data['Store Name']}) with AM {store_data['AM']}")
        updated_count += 1

# Sort stores by Store ID
stores.sort(key=lambda x: x.get("Store ID", ""))

# Write back to file
with open('public/comprehensive_store_mapping.json', 'w', encoding='utf-8') as f:
    json.dump(stores, f, indent=2, ensure_ascii=False)

# Also update src version
with open('src/comprehensive_store_mapping.json', 'w', encoding='utf-8') as f:
    json.dump(stores, f, indent=2, ensure_ascii=False)

print(f"\n✅ Total updates: {updated_count}")
print(f"✅ Total stores: {len(stores)}")
print("✅ Files updated: public/comprehensive_store_mapping.json and src/comprehensive_store_mapping.json")
