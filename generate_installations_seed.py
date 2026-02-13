import uuid
import random
from datetime import datetime, timedelta

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
    ("Tesla", "Model 3"), ("Tesla", "Model Y"), ("Ford", "F-150"), ("Ford", "Explorer"),
    ("Toyota", "RAV4"), ("Toyota", "Camry"), ("Honda", "Civic"), ("Honda", "CR-V"),
    ("Chevrolet", "Silverado"), ("Chevrolet", "Equinox"), ("Jeep", "Wrangler"), ("Jeep", "Grand Cherokee"),
    ("BMW", "X5"), ("Audi", "Q5"), ("Mercedes-Benz", "GLE"), ("Subaru", "Outback"), ("Subaru", "Forester"),
    ("Porsche", "911"), ("Rivian", "R1S"), ("Lucid", "Air")
]

install_types = [
    "Remote Start", "Dash Cam", "Audio System", "Security System", "Navigation",
    "Blind Spot Monitor", "Backup Camera", "Radar Detector", "LED Lighting", "Window Tint"
]

start_date = datetime(2025, 12, 13)
end_date = datetime(2026, 1, 24)

def random_date(start, end):
    delta = end - start
    int_delta = (delta.days * 24 * 60 * 60) + delta.seconds
    random_second = random.randrange(int_delta)
    dt = start + timedelta(seconds=random_second)
    # Force within service hours 8 AM - 6 PM
    hour = random.randint(8, 17)
    minute = random.randint(0, 59)
    return dt.replace(hour=hour, minute=minute)

def add_jitter(coords, radius_miles):
    # 0.015 degrees ~ 1 mile
    jitter_lat = (random.random() - 0.5) * (radius_miles / 69.0) * 2
    jitter_lng = (random.random() - 0.5) * (radius_miles / 53.0) * 2
    return coords[0] + jitter_lng, coords[1] + jitter_lat

sql_statements = []

for _ in range(212):
    city = random.choice(cities)
    make, model = random.choice(vehicles)
    year = str(random.randint(2018, 2025))
    install = random.choice(install_types)
    dt = random_date(start_date, end_date)
    lng, lat = add_jitter((city["longitude"], city["latitude"]), city["radius"])
    
    booking_id = str(uuid.uuid4())
    address = f"{random.randint(100, 9999)} {random.choice(['Main', 'Oak', 'Pine', 'Maple', 'Cedar', 'Elm'])} St, {city['name']}, CO"
    
    sql = f"""INSERT INTO bookings (id, status, payment_status, service_address, longitude, latitude, booking_date, created_at, vehicle_year, vehicle_make, vehicle_model, install_type, elapsed_time, technician_notes) 
    VALUES ('{booking_id}', 'completed', 'paid', '{address}', {lng}, {lat}, '{dt.isoformat()}', '{dt.isoformat()}', '{year}', '{make}', '{model}', '{install}', {random.randint(45, 180)}, 'Professional installation complete. System tested and verified.');"""
    sql_statements.append(sql)

print("\n".join(sql_statements))
