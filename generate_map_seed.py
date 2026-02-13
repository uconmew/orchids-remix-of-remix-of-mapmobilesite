
import random

cities = [
    ("Denver", -104.9903, 39.7392),
    ("Aurora", -104.8319, 39.7294),
    ("Lakewood", -105.0814, 39.7047),
    ("Arvada", -105.0875, 39.8028),
    ("Westminster", -105.0372, 39.8367),
    ("Thornton", -104.9719, 39.868),
    ("Centennial", -104.8769, 39.5807),
    ("Boulder", -105.2705, 40.015),
    ("Littleton", -105.0166, 39.6133),
    ("Broomfield", -105.0897, 39.9205),
    ("Northglenn", -104.9872, 39.8858),
    ("Commerce City", -104.9333, 39.8083),
    ("Englewood", -104.9878, 39.6478),
    ("Brighton", -104.8208, 39.9853),
    ("Castle Rock", -104.8561, 39.3722),
    ("Parker", -104.7611, 39.5186),
    ("Highlands Ranch", -104.9694, 39.5539),
    ("Longmont", -105.1019, 40.1672),
    ("Lafayette", -105.0897, 39.9936),
    ("Louisville", -105.1319, 39.9778),
    ("Erie", -105.05, 40.0503),
    ("Superior", -105.1686, 39.9528),
    ("Golden", -105.2211, 39.7555),
]

def get_random_coords(lng, lat):
    # 1 mile is approx 0.0145 lat, 0.019 lng
    offset_lat = (random.random() - 0.5) * 0.029 # up to 1 mile
    offset_lng = (random.random() - 0.5) * 0.038 # up to 1 mile
    return lng + offset_lng, lat + offset_lat

# Update 510 completed bookings
# Since I can't easily loop over results in SQL tool without complex PL/pgSQL,
# I'll generate a CTE or multiple update statements.
# Actually, I'll update all 510 in batches.

sql = []

# Get the IDs of the 510 completed bookings first
# I'll use a subquery to assign them to cities round-robin

# But wait, I'll just generate a single script that updates them.
# I'll use a temporary table or a VALUES list.

sql.append("WITH booking_ids AS (SELECT id, row_number() OVER (ORDER BY created_at) as rn FROM bookings WHERE status = 'completed'),")
sql.append("city_data AS (SELECT * FROM (VALUES ")
values = []
for i, city in enumerate(cities):
    values.append(f"('{city[0]}', {city[1]}, {city[2]}, {i+1})")
sql.append(", ".join(values))
sql.append(") AS t(name, lng, lat, idx))")
sql.append("UPDATE bookings b SET ")
sql.append("service_address = cd.name || ', CO',")
sql.append("longitude = cd.lng + (random() - 0.5) * 0.038,")
sql.append("latitude = cd.lat + (random() - 0.5) * 0.029")
sql.append("FROM booking_ids bi, city_data cd ")
sql.append("WHERE b.id = bi.id AND cd.idx = ((bi.rn - 1) % 23) + 1;")

# Fetch all vehicle IDs from the database to ensure diversity
# For now, I'll use the list of IDs I found earlier in a list
vehicle_ids = [
    'adb406f2-147e-4697-a190-4562693a885f', 'f42ba258-cc9b-445c-8898-45401f0f9489',
    'aa95ca38-c280-4c21-8570-06c3fe68d9c8', 'c3e3be07-fc25-483c-a4ec-78e2749a9110',
    '077d0614-6922-4358-8e2c-12c881e6df7e', '1cfa9aab-6eb3-4199-b772-1c3a8a0ca83a',
    'f06a598d-efb7-44f3-a76b-acf270b2fd22', '83b78092-2cc3-4955-ba0e-05e5da361011',
    'b0fbee73-07f5-497d-9455-e9b823853e99', '664ea1e1-b29e-49ee-aea3-faa668844bba',
    '13d41b58-53fe-4382-b72d-b9b55546cf17', '34ea4f1b-d2c9-42c1-bbd3-8659b4268219',
    'd854afb4-405f-46ad-ba27-f25c974f123c', '3010cd79-70d3-4fbc-8ced-4b69afe6cada',
    'cdead8cd-5c4d-4d6b-a3ce-3ce6daa03d01', '48d88da2-4566-4f82-977d-abb344023252',
    'e17bc73d-2344-4e93-8f63-c62ee998e941', '1aaa88a2-9413-403a-a67f-3f748801dc8c',
    '88e210b5-edbb-4051-9a2a-624aeb6ee0f3', '1a623682-7a58-49a4-94ef-b1d84dc35393',
    'a6c70f10-48f6-4bbc-9193-224a44e6c190', 'd8cb9fd8-7f6f-41cd-8d23-58d7608e56ad',
    '0d3fc2f0-a26c-4f71-a05d-331fc072bb72', 'e0403ca2-eb2d-4104-911d-582ee183ac89',
    'e7cd4fd9-3032-4dc6-89e6-df4f7dbdc7b1', '4dbd0178-e22c-4bfa-b9cf-5b91fc6b1371'
]

# Insert 13 booked entries
service_id = '6b9cff05-317c-4b18-ab98-44e35fc077e4'
address_id = 'fea3b54f-1d47-4405-98aa-0abc926da7a7'

for i in range(13):
    city = random.choice(cities)
    lng, lat = get_random_coords(city[1], city[2])
    v_id = random.choice(vehicle_ids)
    sql.append(f"INSERT INTO bookings (id, vehicle_id, service_id, address_id, status, payment_status, payment_method, service_address, longitude, latitude, created_at, booking_date) VALUES (gen_random_uuid(), '{v_id}', '{service_id}', '{address_id}', 'confirmed', 'paid', 'now', '{city[0]}, CO', {lng}, {lat}, NOW(), NOW() + interval '{i} days');")

with open('seed_map_data.sql', 'w') as f:
    f.write("\n".join(sql))
