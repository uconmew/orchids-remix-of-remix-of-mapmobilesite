const crypto = require('crypto');

const cities = [
  { name: 'Denver', lng: -104.9903, lat: 39.7392, weight: 18 },
  { name: 'Aurora', lng: -104.8319, lat: 39.7294, weight: 14 },
  { name: 'Lakewood', lng: -105.0814, lat: 39.7047, weight: 10 },
  { name: 'Arvada', lng: -105.0875, lat: 39.8028, weight: 8 },
  { name: 'Westminster', lng: -105.0372, lat: 39.8367, weight: 7 },
  { name: 'Thornton', lng: -104.9719, lat: 39.868, weight: 6 },
  { name: 'Centennial', lng: -104.8769, lat: 39.5807, weight: 8 },
  { name: 'Boulder', lng: -105.2705, lat: 40.015, weight: 9 },
  { name: 'Littleton', lng: -105.0166, lat: 39.6133, weight: 5 },
  { name: 'Broomfield', lng: -105.0897, lat: 39.9205, weight: 4 },
  { name: 'Northglenn', lng: -104.9872, lat: 39.8858, weight: 3 },
  { name: 'Commerce City', lng: -104.9333, lat: 39.8083, weight: 4 },
  { name: 'Englewood', lng: -104.9878, lat: 39.6478, weight: 5 },
  { name: 'Brighton', lng: -104.8208, lat: 39.9853, weight: 3 },
  { name: 'Castle Rock', lng: -104.8561, lat: 39.3722, weight: 6 },
  { name: 'Parker', lng: -104.7611, lat: 39.5186, weight: 7 },
  { name: 'Highlands Ranch', lng: -104.9694, lat: 39.5539, weight: 6 },
  { name: 'Longmont', lng: -105.1019, lat: 40.1672, weight: 4 },
  { name: 'Lafayette', lng: -105.0897, lat: 39.9936, weight: 3 },
  { name: 'Louisville', lng: -105.1319, lat: 39.9778, weight: 2 },
  { name: 'Erie', lng: -105.05, lat: 40.0503, weight: 2 },
  { name: 'Superior', lng: -105.1686, lat: 39.9528, weight: 1 },
  { name: 'Golden', lng: -105.2211, lat: 39.7555, weight: 3 },
];

const weightedCities = [];
cities.forEach(c => { for (let i = 0; i < c.weight; i++) weightedCities.push(c); });

const vehicles = [
  { year: '2024', make: 'Tesla', model: 'Model 3' },
  { year: '2023', make: 'Tesla', model: 'Model Y' },
  { year: '2024', make: 'Tesla', model: 'Model S' },
  { year: '2022', make: 'Honda', model: 'Civic' },
  { year: '2023', make: 'Honda', model: 'Accord' },
  { year: '2021', make: 'Toyota', model: 'Camry' },
  { year: '2024', make: 'Toyota', model: 'Corolla' },
  { year: '2023', make: 'Toyota', model: 'RAV4' },
  { year: '2022', make: 'Toyota', model: 'Tacoma' },
  { year: '2020', make: 'Toyota', model: '4Runner' },
  { year: '2023', make: 'Hyundai', model: 'Tucson' },
  { year: '2024', make: 'Hyundai', model: 'Elantra' },
  { year: '2022', make: 'Kia', model: 'Telluride' },
  { year: '2023', make: 'Kia', model: 'Sportage' },
  { year: '2021', make: 'Subaru', model: 'Outback' },
  { year: '2023', make: 'Subaru', model: 'Crosstrek' },
  { year: '2022', make: 'Subaru', model: 'WRX' },
  { year: '2019', make: 'Subaru', model: 'Forester' },
  { year: '2024', make: 'BMW', model: 'X5' },
  { year: '2023', make: 'BMW', model: '3 Series' },
  { year: '2022', make: 'Mercedes-Benz', model: 'GLE' },
  { year: '2023', make: 'Mercedes-Benz', model: 'C-Class' },
  { year: '2024', make: 'Audi', model: 'Q5' },
  { year: '2021', make: 'Audi', model: 'A4' },
  { year: '2023', make: 'Lexus', model: 'RX 350' },
  { year: '2022', make: 'Volkswagen', model: 'GTI' },
  { year: '2020', make: 'Mazda', model: 'CX-5' },
  { year: '2023', make: 'Mazda', model: 'Miata' },
  { year: '2024', make: 'Ford', model: 'F-150' },
  { year: '2023', make: 'Ford', model: 'F-250' },
  { year: '2022', make: 'Ford', model: 'Ranger' },
  { year: '2021', make: 'Ford', model: 'Bronco' },
  { year: '2023', make: 'Ford', model: 'Mustang' },
  { year: '2024', make: 'Chevrolet', model: 'Silverado 1500' },
  { year: '2023', make: 'Chevrolet', model: 'Colorado' },
  { year: '2022', make: 'Chevrolet', model: 'Tahoe' },
  { year: '2021', make: 'Chevrolet', model: 'Suburban' },
  { year: '2024', make: 'Ram', model: '1500' },
  { year: '2023', make: 'Ram', model: '2500' },
  { year: '2022', make: 'Ram', model: '3500' },
  { year: '2024', make: 'GMC', model: 'Sierra 1500' },
  { year: '2023', make: 'GMC', model: 'Yukon' },
  { year: '2022', make: 'Jeep', model: 'Wrangler' },
  { year: '2024', make: 'Jeep', model: 'Grand Cherokee' },
  { year: '2021', make: 'Jeep', model: 'Gladiator' },
  { year: '2023', make: 'Toyota', model: 'Tundra' },
  { year: '2022', make: 'Nissan', model: 'Titan' },
  { year: '2024', make: 'Rivian', model: 'R1T' },
  { year: '2023', make: 'Ford', model: 'Explorer' },
  { year: '2024', make: 'Ford', model: 'Expedition' },
  { year: '2022', make: 'Chevrolet', model: 'Traverse' },
  { year: '2023', make: 'Dodge', model: 'Durango' },
  { year: '2024', make: 'Cadillac', model: 'Escalade' },
  { year: '2022', make: 'Lincoln', model: 'Navigator' },
  { year: '2023', make: 'Porsche', model: 'Cayenne' },
  { year: '2021', make: 'Land Rover', model: 'Defender' },
  { year: '2023', make: 'Yamaha', model: 'AR210' },
  { year: '2022', make: 'MasterCraft', model: 'X24' },
  { year: '2024', make: 'Malibu', model: 'Wakesetter' },
  { year: '2021', make: 'Sea-Doo', model: 'GTX 300' },
  { year: '2023', make: 'Cobalt', model: 'R8' },
  { year: '2022', make: 'Boston Whaler', model: '280 Outrage' },
];

const installTypes = [
  { name: 'Full Audio System', minTime: 120, maxTime: 360 },
  { name: 'Subwoofer Installation', minTime: 45, maxTime: 120 },
  { name: 'Speaker Upgrade', minTime: 60, maxTime: 180 },
  { name: 'Amplifier Installation', minTime: 60, maxTime: 150 },
  { name: 'Head Unit Replacement', minTime: 30, maxTime: 90 },
  { name: 'Backup Camera Integration', minTime: 45, maxTime: 120 },
  { name: 'Dash Cam Installation', minTime: 30, maxTime: 75 },
  { name: 'Remote Start System', minTime: 90, maxTime: 240 },
  { name: 'DroneMobile GPS', minTime: 60, maxTime: 150 },
  { name: 'Radar Detector Hardwire', minTime: 30, maxTime: 60 },
  { name: 'LED Lighting Package', minTime: 45, maxTime: 120 },
  { name: 'Window Tint', minTime: 60, maxTime: 150 },
  { name: 'Paint Protection Film', minTime: 120, maxTime: 300 },
  { name: 'Ceramic Coating', minTime: 180, maxTime: 480 },
  { name: 'Security System Install', minTime: 90, maxTime: 210 },
  { name: 'Marine Audio System', minTime: 120, maxTime: 300 },
  { name: 'Truck Bed Audio', minTime: 90, maxTime: 180 },
  { name: 'Sound Deadening', minTime: 120, maxTime: 240 },
  { name: 'CarPlay/Android Auto Retrofit', minTime: 60, maxTime: 150 },
  { name: 'Coilover Suspension Install', minTime: 150, maxTime: 300 },
];

const techNotes = [
  'Precision integration with factory harnesses. All connections soldered and heat-shrunk.',
  'Calibrated for optimal acoustic performance. Customer very satisfied with output.',
  'Weather-sealed connections for long-term reliability. Tested in simulated conditions.',
  'Hidden wiring architecture for a clean OEM look. No visible modifications.',
  'Seamless interface with existing vehicle controls. Steering wheel controls retained.',
  'Phase-aligned audio staging for superior imaging. Time alignment dialed in.',
  'High-current power distribution system verified. Fuse ratings confirmed.',
  'Digital signal processing tuned to vehicle acoustics. 31-band EQ applied.',
  'Stealth mounting solution for minimalist aesthetic. Customer approved placement.',
  'Full system test completed. All channels verified at rated output.',
  'Custom fabrication required for proper fitment. Built MDF adapter rings.',
  'Integrated with factory amplifier. Signal summing adapter installed.',
  'Clean install with zero rattles. All panels secured with foam tape.',
  'Remote start tested through 3 full cycles. Range verified at 1000ft.',
  'GPS module positioned for optimal satellite acquisition. Signal strength excellent.',
  'Wiring routed through factory grommets. No drilling required.',
  'Existing system removed and properly disposed. New system bench-tested prior.',
  'Color-matched trim pieces reinstalled. Interior restored to factory condition.',
  'Customer walked through all features and operation. Demo completed.',
  'Voltage drop test passed on all power connections. Ground points verified.',
];

const streetNames = ['Main St', 'Broadway', 'Colfax Ave', 'Speer Blvd', 'Colorado Blvd',
  'Federal Blvd', 'Wadsworth Blvd', 'Sheridan Blvd', 'Kipling St', 'Alameda Ave',
  'Evans Ave', 'Hampden Ave', 'Belleview Ave', 'Arapahoe Rd', 'Smoky Hill Rd',
  'Parker Rd', 'Quincy Ave', 'Orchard Rd', 'Dry Creek Rd', 'County Line Rd',
  'Lincoln Ave', 'University Blvd', 'Monaco Pkwy', 'Havana St', 'Chambers Rd',
  'Peoria St', 'Tower Rd', 'Gun Club Rd', 'Buckley Rd', 'Mississippi Ave'];

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// 1 mile = 0.0145 deg lat, ~0.0187 deg lng at 39.7N
function jitter1Mile(lng, lat) {
  const r = 0.0145 * Math.sqrt(Math.random());
  const theta = Math.random() * 2 * Math.PI;
  return [lng + r * Math.cos(theta) * 1.29, lat + r * Math.sin(theta)];
}

const startDate = new Date('2025-01-02T00:00:00Z');
const endDate = new Date('2026-02-13T00:00:00Z');
const totalDays = Math.floor((endDate - startDate) / 86400000);

const dates = [];
for (let i = 0; i < 292; i++) {
  const t = Math.random();
  const skewed = Math.pow(t, 0.75);
  const dayOffset = Math.floor(skewed * totalDays);
  const d = new Date(startDate.getTime() + dayOffset * 86400000);
  d.setUTCHours(rand(15, 23));
  d.setUTCMinutes(rand(0, 59));
  dates.push(d);
}
dates.sort((a, b) => a - b);

let sql = "-- Seed 292 realistic completed installations\n";
sql += "-- Dates: Jan 2 2025 - Feb 13 2026, scattered across all service cities\n\n";
sql += "DELETE FROM bookings WHERE status = 'completed';\n\n";

for (let i = 0; i < 292; i++) {
  const id = crypto.randomUUID();
  const city = pick(weightedCities);
  const [lng, lat] = jitter1Mile(city.lng, city.lat);
  const vehicle = pick(vehicles);
  const install = pick(installTypes);
  const elapsed = rand(install.minTime, install.maxTime);
  const note = pick(techNotes);
  const streetNum = rand(100, 9999);
  const street = pick(streetNames);
  const address = streetNum + ' ' + street + ', ' + city.name + ', CO';

  const bookingDate = dates[i].toISOString().split('T')[0] + 'T00:00:00';
  const startHour = rand(8, 16);
  const startMin = rand(0, 59);
  const startTime = new Date(dates[i]);
  startTime.setUTCHours(startHour + 7);
  startTime.setUTCMinutes(startMin);

  const endTime = new Date(startTime.getTime() + elapsed * 60000);
  const createdAt = new Date(dates[i].getTime() - rand(1, 14) * 86400000);

  const escapedAddress = address.replace(/'/g, "''");
  const escapedNote = note.replace(/'/g, "''");

  sql += "INSERT INTO bookings (id, status, payment_status, service_address, longitude, latitude, vehicle_year, vehicle_make, vehicle_model, install_type, booking_date, start_time, elapsed_time, technician_notes, created_at, updated_at) VALUES ('" + id + "', 'completed', 'paid', '" + escapedAddress + "', " + lng.toFixed(12) + ", " + lat.toFixed(12) + ", '" + vehicle.year + "', '" + vehicle.make + "', '" + vehicle.model + "', '" + install.name + "', '" + bookingDate + "', '" + startTime.toISOString() + "', " + elapsed + ", '" + escapedNote + "', '" + createdAt.toISOString() + "', '" + endTime.toISOString() + "');\n";
}

sql += "\n-- 3 active in-progress jobs\n";
for (let i = 0; i < 3; i++) {
  const id = crypto.randomUUID();
  const city = pick(weightedCities);
  const [lng, lat] = jitter1Mile(city.lng, city.lat);
  const vehicle = pick(vehicles);
  const install = pick(installTypes);
  const streetNum = rand(100, 9999);
  const street = pick(streetNames);
  const address = streetNum + ' ' + street + ', ' + city.name + ', CO';
  const now = new Date();
  const startTime = new Date(now.getTime() - rand(30, 180) * 60000);
  const createdAt = new Date(now.getTime() - rand(1, 5) * 86400000);

  sql += "INSERT INTO bookings (id, status, payment_status, service_address, longitude, latitude, vehicle_year, vehicle_make, vehicle_model, install_type, booking_date, start_time, technician_notes, created_at, updated_at) VALUES ('" + id + "', 'in_progress', 'paid', '" + address.replace(/'/g, "''") + "', " + lng.toFixed(12) + ", " + lat.toFixed(12) + ", '" + vehicle.year + "', '" + vehicle.make + "', '" + vehicle.model + "', '" + install.name + "', '" + now.toISOString().split('T')[0] + "T00:00:00', '" + startTime.toISOString() + "', 'Installation in progress.', '" + createdAt.toISOString() + "', '" + now.toISOString() + "');\n";
}

process.stdout.write(sql);
