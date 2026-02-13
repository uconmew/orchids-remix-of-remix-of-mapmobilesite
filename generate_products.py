import random

# Real products data
real_products = [
    # ALPINE
    {"brand": "Alpine", "category": "Headunits", "name": "iLX-W650", "price": 299.95, "desc": "7-Inch Mech-Less Receiver compatible with Apple CarPlay and Android Auto."},
    {"brand": "Alpine", "category": "Headunits", "name": "iLX-W670", "price": 319.99, "desc": "7-Inch Digital Multimedia Receiver with enhanced sound tuning and wired Apple CarPlay/Android Auto."},
    {"brand": "Alpine", "category": "Headunits", "name": "iLX-F509 Halo9", "price": 899.95, "desc": "9-Inch Floating Touchscreen High-Resolution Multimedia Receiver."},
    {"brand": "Alpine", "category": "Headunits", "name": "UTE-73BT", "price": 149.95, "desc": "Advanced Bluetooth Mech-Less Digital Media Receiver."},
    {"brand": "Alpine", "category": "Speakers", "name": "S2-S65", "price": 129.95, "desc": "S-Series 6-1/2\" Coaxial 2-Way Speakers."},
    {"brand": "Alpine", "category": "Speakers", "name": "R2-S65", "price": 249.95, "desc": "R-Series 6-1/2\" Coaxial 2-Way Speakers (High-Resolution Audio)."},
    {"brand": "Alpine", "category": "Subwoofer", "name": "S-W12D4", "price": 179.95, "desc": "S-Series 12\" Dual 4-Ohm Subwoofer."},
    {"brand": "Alpine", "category": "Amplifiers", "name": "X-A90M", "price": 499.95, "desc": "X-Series Mono Power Density Amplifier (900W RMS)."},
    {"brand": "Alpine", "category": "Amplifiers", "name": "S-A32F", "price": 219.95, "desc": "S-Series 4-Channel Amplifier (55W x 4)."},

    # VIPER (Directed)
    {"brand": "Viper", "category": "Remote Start", "name": "5706V", "price": 449.99, "desc": "LCD 2-Way Remote Start and Security System with 1-mile range."},
    {"brand": "Viper", "category": "Remote Start", "name": "5305V", "price": 299.99, "desc": "2-Way Remote Start and Security System with LCD display remote."},
    {"brand": "Viper", "category": "Remote Start", "name": "4105V", "price": 149.99, "desc": "1-Way Remote Start System with two 4-button remotes."},
    {"brand": "Viper", "category": "Alarms", "name": "3105V", "price": 149.99, "desc": "1-Way Security System with keyless entry and shock sensor."},
    {"brand": "Viper", "category": "Alarms", "name": "3100V", "price": 99.99, "desc": "Basic 1-Way Security System with 2 remotes."},

    # AVITAL (Directed)
    {"brand": "Avital", "category": "Remote Start", "name": "4105L", "price": 129.99, "desc": "Entry-level Remote Start with two 1-way remotes."},
    {"brand": "Avital", "category": "Alarms", "name": "3103LX", "price": 119.99, "desc": "Keyless Entry and Security System."},
    {"brand": "Avital", "category": "Remote Start", "name": "5305L", "price": 249.99, "desc": "2-Way Remote Start and Security System."},

    # COMPUSTAR
    {"brand": "Compustar", "category": "Remote Start", "name": "PRO T13", "price": 599.99, "desc": "Flagship 2-Way LCD Remote Start with 3-mile range and Proximity Unlock."},
    {"brand": "Compustar", "category": "Remote Start", "name": "PRO R5", "price": 399.99, "desc": "2-Way LED Remote Start with 2-mile range and Proximity Unlock."},
    {"brand": "Compustar", "category": "Remote Start", "name": "CS4900-S", "price": 249.99, "desc": "2-Way Remote Start System with up to 3000-ft range."},
    {"brand": "Compustar", "category": "Remote Start", "name": "CS920-S", "price": 179.99, "desc": "1-Way Remote Start System with two 4-button remotes."},
    {"brand": "Compustar", "category": "Alarms", "name": "CS697-A", "price": 199.99, "desc": "Entry-level Alarm and Security System with 2 remotes."},

    # ROCKFORD FOSGATE
    {"brand": "Rockford Fosgate", "category": "Speakers", "name": "Punch P165-SI", "price": 169.99, "desc": "6.5\" 2-Way Component Speaker System."},
    {"brand": "Rockford Fosgate", "category": "Subwoofer", "name": "Punch P300-12", "price": 299.99, "desc": "Punch 12\" 300-Watt Powered Subwoofer Enclosure."},
    {"brand": "Rockford Fosgate", "category": "Amplifiers", "name": "Prime R150X2", "price": 129.99, "desc": "2-Channel Amplifier (50W x 2 at 4-Ohm)."},
    {"brand": "Rockford Fosgate", "category": "Marine", "name": "M0-65B", "price": 119.99, "desc": "Marine 6.5\" Full Range Speakers - Black."},

    # SKAR AUDIO
    {"brand": "Skar Audio", "category": "Subwoofer", "name": "SDR-12 D2", "price": 89.99, "desc": "12\" 1200 Watt Max Power Dual 2-Ohm Subwoofer."},
    {"brand": "Skar Audio", "category": "Amplifiers", "name": "RP-1200.1D", "price": 174.99, "desc": "1200 Watt Monoblock Class D MOSFET Amplifier."},
    {"brand": "Skar Audio", "category": "Speakers", "name": "TX65", "price": 64.99, "desc": "6.5\" 200W Max 2-Way Coaxial Speakers."},

    # KENWOOD
    {"brand": "Kenwood", "category": "Headunits", "name": "DMX7709S", "price": 349.99, "desc": "6.75\" Digital Multimedia Receiver with Apple CarPlay and Android Auto."},
    {"brand": "Kenwood", "category": "Headunits", "name": "Excelon DMX907S", "price": 649.99, "desc": "Excelon 6.8\" Digital Multimedia Receiver with Wireless CarPlay/Android Auto."},
    {"brand": "Kenwood", "category": "Camera", "name": "CMOS-230", "price": 99.99, "desc": "Rearview Backup Camera with high-definition display."},

    # INTEGRATION (PAC/MAESTRO)
    {"brand": "PAC Audio", "category": "Integration", "name": "RP4.2-TY11", "price": 129.99, "desc": "Radio Replacement Interface with Steering Wheel Control for Toyota."},
    {"brand": "Maestro", "category": "Integration", "name": "ADS-MRR", "price": 149.99, "desc": "Universal Radio Replacement Interface and SWC Module."},
    {"brand": "Maestro", "category": "Integration", "name": "ADS-MRR2", "price": 199.99, "desc": "Advanced Universal Radio Replacement Interface with Bluetooth."},

    # ACCESSORIES
    {"brand": "Sound Damping", "category": "Accessories", "name": "Dynamat Xtreme Bulk Kit", "price": 189.99, "desc": "Sound damping material for doors and trunk (36 sq ft)."},
    {"brand": "Siren", "category": "Accessories", "name": "Directed 514N", "price": 19.99, "desc": "Revenger Soft Chirp 6-Tone High Power Siren."},
]

images = {
    "Headunits": "https://images.unsplash.com/photo-1558002038-1055907df827",
    "Alarms": "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2",
    "Remote Start": "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2",
    "Speakers": "https://images.unsplash.com/photo-1558002038-1055907df827",
    "Subwoofer": "https://images.unsplash.com/photo-1558002038-1055907df827",
    "Amplifiers": "https://images.unsplash.com/photo-1558002038-1055907df827",
    "Marine": "https://images.unsplash.com/photo-1567899832328-49c018219513",
    "Integration": "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2",
    "Accessories": "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2",
    "Camera": "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2",
}

def generate_products():
    sql_statements = []
    sql_statements.append("DELETE FROM products;")
    
    for prod in real_products:
        name = f"{prod['brand']} {prod['name']}"
        price = prod['price']
        cat = prod['category']
        brand = prod['brand']
        desc = prod['desc']
        
        img = images.get(cat, "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2")
        
        # Escaping single quotes for SQL
        name_esc = name.replace("'", "''")
        desc_esc = desc.replace("'", "''")
        
        stmt = f"INSERT INTO products (name, description, price, category, brand, image_url, stock_quantity, active) VALUES ('{name_esc}', '{desc_esc}', {price}, '{cat}', '{brand}', '{img}', 100, true);"
        sql_statements.append(stmt)
            
    return sql_statements

sql = generate_products()
with open("seed_products.sql", "w") as f:
    f.write("\n".join(sql))
