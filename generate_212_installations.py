
import random
from datetime import datetime, timedelta
import uuid

cities = [
    {"name": "Denver", "longitude": -104.9903, "latitude": 39.7392, "radius": 15},
    {"name": "Boulder", "longitude": -105.2705, "latitude": 40.015, "radius": 10},
    {"name": "Aurora", "longitude": -104.8319, "latitude": 39.7294, "radius": 12},
    {"name": "Lakewood", "longitude": -105.0814, "latitude": 39.7047, "radius": 8},
    {"name": "Arvada", "longitude": -105.0875, "latitude": 39.8028, "radius": 8},
    {"name": "Westminster", "longitude": -105.0372, "latitude": 39.8367, "radius": 8},
    {"name": "Thornton", "longitude": -104.9719, "latitude": 39.868, "radius": 8},
    {"name": "Centennial", "longitude": -104.8769, "latitude": 39.5807, "radius": 10},
    {"name": "Castle Rock", "longitude": -104.8561, "latitude": 39.3722, "radius": 10},
    {"name": "Parker", "longitude": -104.7611, "latitude": 39.5186, "radius": 10}
]

vehicles = [
    ("Toyota", ["Camry", "RAV4", "Tacoma", "Tundra", "Corolla", "Highlander"]),
    ("Ford", ["F-150", "Explorer", "Mustang", "Escape", "Ranger", "Bronco"]),
    ("Tesla", ["Model 3", "Model Y", "Model S", "Model X"]),
    ("Honda", ["Civic", "CR-V", "Accord", "Pilot", "Odyssey"]),
    ("Chevrolet", ["Silverado", "Equinox", "Tahoe", "Malibu", "Colorado"]),
    ("Jeep", ["Wrangler", "Grand Cherokee", "Gladiator", "Cherokee"]),
    ("Subaru", ["Outback", "Forester", "Crosstrek", "Impreza"]),
    ("GMC", ["Sierra", "Yukon", "Terrain", "Canyon"]),
    ("Ram", ["1500", "2500", "3500"]),
    ("BMW", ["3 Series", "5 Series", "X3", "X5"]),
    ("Mercedes-Benz", ["C-Class", "E-Class", "GLC", "GLE"]),
    ("Audi", ["A4", "Q5", "Q7", "A6"]),
    ("Nissan", ["Altima", "Rogue", "Sentra", "Frontier"]),
    ("Hyundai", ["Elantra", "Tucson", "Santa Fe", "Palisade"]),
    ("Kia", ["Sportage", "Sorento", "Telluride", "K5"])
]

install_types = [
    "Remote Start", "Security System", "Audio Upgrade", "Dash Cam", 
    "Marine Audio", "Truck Accessories", "Navigation System", "Backup Camera",
    "Window Tinting", "Ceramic Coating", "Radar Detector"
]

start_date = datetime(2025, 12, 13)
end_date = datetime(2026, 1, 25)
delta = end_date - start_date

sql_statements = ["DELETE FROM bookings;"]

for _ in range(212):
    city = random.choice(cities)
    make, models = random.choice(vehicles)
    model = random.choice(models)
    year = str(random.randint(2015, 2026))
    
    # Realistic service types
    install_type = random.choice([
        "Compustar Remote Start", 
        "DroneMobile GPS", 
        "Alpine Audio Upgrade", 
        "JL Audio Subwoofer Install",
        "Thinkware Dash Cam", 
        "BlackVue Dash Cam",
        "Marine Head Unit",
        "Backup Camera Integration",
        "LED Accent Lighting",
        "Radar Detector Hardwire"
    ])
    
    # Random date between start and end
    random_days = random.randint(0, delta.days)
    booking_date = start_date + timedelta(days=random_days)
    
    # Random time between 8 AM and 5 PM
    start_hour = random.randint(8, 17)
    start_minute = random.randint(0, 59)
    start_time = booking_date.replace(hour=start_hour, minute=start_minute)
    
    # Elapsed time 45-240 mins
    elapsed = random.randint(45, 240)
    end_time = start_time + timedelta(minutes=elapsed)
    
    # Coordinates with jitter
    lat = city["latitude"] + (random.random() - 0.5) * 0.15 # More spread for realism
    lng = city["longitude"] + (random.random() - 0.5) * 0.15
    
    address = f"{random.randint(100, 9999)} {random.choice(['Main St', 'Oak Ave', 'Broadway', 'Lincoln St', 'Colorado Blvd', 'Speer Blvd', 'Colfax Ave', 'Wadsworth Blvd', 'Arapahoe Rd', 'Parker Rd'])}, {city['name']}, CO"
    
    created_at = start_time - timedelta(days=random.randint(1, 20))
    updated_at = end_time
    
    # Random statuses: mostly completed, some active if date is today
    status = 'completed'
    if booking_date.date() == end_date.date():
        if start_time < datetime.now() < end_time:
            status = 'in_progress'
        elif datetime.now() < start_time:
            status = 'pending'
    
    stmt = f"""INSERT INTO bookings (
        id, status, payment_status, service_address, longitude, latitude, 
        vehicle_year, vehicle_make, vehicle_model, install_type, 
        booking_date, start_time, elapsed_time, technician_notes, 
        created_at, updated_at
    ) VALUES (
        '{uuid.uuid4()}', '{status}', 'paid', '{address}', {lng}, {lat}, 
        '{year}', '{make}', '{model}', '{install_type}', 
        '{booking_date.isoformat()}', '{start_time.isoformat()}', {elapsed}, 'Professional mobile installation completed at customer location. Tested all functions and verified quality.', 
        '{created_at.isoformat()}', '{updated_at.isoformat()}'
    );"""
    sql_statements.append(stmt)

with open("seed_212_installations.sql", "w") as f:
    f.write("\n".join(sql_statements))
