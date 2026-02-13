export type VehicleType = 'automobile' | 'motorcycle' | 'marine' | 'recreational';

export const VEHICLE_DATA: Record<string, { models: string[], types: string[] }> = {
  'Toyota': { models: ['Camry', 'Corolla', 'RAV4', 'Highlander', 'Tacoma', 'Tundra', '4Runner', 'Prius', 'Sienna', 'Avalon', 'GR86', 'Supra', 'Venza', 'C-HR', 'Land Cruiser', 'Sequoia'], types: ['Sedan', 'SUV', 'Truck', 'Coupe'] },
  'Honda': { models: ['Civic', 'Accord', 'CR-V', 'Pilot', 'HR-V', 'Odyssey', 'Ridgeline', 'Passport', 'Insight', 'Fit', 'Element', 'S2000', 'Prelude'], types: ['Sedan', 'SUV', 'Truck', 'Coupe'] },
  'Ford': { models: ['F-150', 'F-250', 'F-350', 'Mustang', 'Explorer', 'Escape', 'Edge', 'Bronco', 'Ranger', 'Expedition', 'Maverick', 'Focus', 'Fusion', 'Taurus', 'Transit'], types: ['Sedan', 'SUV', 'Truck', 'Coupe'] },
  'Chevrolet': { models: ['Silverado', 'Malibu', 'Equinox', 'Tahoe', 'Suburban', 'Traverse', 'Colorado', 'Camaro', 'Corvette', 'Blazer', 'Trailblazer', 'Impala', 'Cruze', 'Spark'], types: ['Sedan', 'SUV', 'Truck', 'Coupe'] },
  'Dodge': { models: ['Ram', 'Charger', 'Challenger', 'Durango', 'Journey', 'Grand Caravan', 'Dart', 'Hornet'], types: ['Sedan', 'SUV', 'Truck', 'Coupe'] },
  'Ram': { models: ['1500', '2500', '3500', 'ProMaster'], types: ['Truck'] },
  'Jeep': { models: ['Wrangler', 'Grand Cherokee', 'Cherokee', 'Compass', 'Renegade', 'Gladiator', 'Wagoneer', 'Grand Wagoneer'], types: ['SUV', 'Truck'] },
  'GMC': { models: ['Sierra', 'Yukon', 'Acadia', 'Terrain', 'Canyon', 'Hummer EV'], types: ['SUV', 'Truck'] },
  'BMW': { models: ['3 Series', '5 Series', '7 Series', 'X1', 'X3', 'X5', 'X7', 'M3', 'M4', 'M5', 'Z4', 'i4', 'iX'], types: ['Sedan', 'SUV', 'Coupe'] },
  'Mercedes-Benz': { models: ['C-Class', 'E-Class', 'S-Class', 'GLA', 'GLC', 'GLE', 'GLS', 'AMG GT', 'A-Class', 'CLA', 'G-Class'], types: ['Sedan', 'SUV', 'Coupe'] },
  'Audi': { models: ['A3', 'A4', 'A6', 'A8', 'Q3', 'Q5', 'Q7', 'Q8', 'TT', 'R8', 'e-tron'], types: ['Sedan', 'SUV', 'Coupe'] },
  'Lexus': { models: ['IS', 'ES', 'GS', 'LS', 'NX', 'RX', 'GX', 'LX', 'RC', 'LC', 'UX'], types: ['Sedan', 'SUV', 'Coupe'] },
  'Nissan': { models: ['Altima', 'Sentra', 'Maxima', 'Rogue', 'Pathfinder', 'Murano', 'Armada', 'Frontier', 'Titan', '370Z', 'GT-R', 'Leaf', 'Kicks', 'Versa'], types: ['Sedan', 'SUV', 'Truck', 'Coupe'] },
  'Hyundai': { models: ['Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'Palisade', 'Kona', 'Venue', 'Ioniq', 'Veloster', 'Genesis Coupe'], types: ['Sedan', 'SUV', 'Coupe'] },
  'Kia': { models: ['Forte', 'K5', 'Stinger', 'Sportage', 'Sorento', 'Telluride', 'Seltos', 'Soul', 'Carnival', 'EV6'], types: ['Sedan', 'SUV', 'Coupe'] },
  'Subaru': { models: ['Impreza', 'Legacy', 'Outback', 'Forester', 'Crosstrek', 'Ascent', 'WRX', 'BRZ', 'Solterra'], types: ['Sedan', 'SUV', 'Coupe'] },
  'Mazda': { models: ['Mazda3', 'Mazda6', 'CX-30', 'CX-5', 'CX-9', 'CX-50', 'MX-5 Miata', 'MX-30'], types: ['Sedan', 'SUV', 'Coupe'] },
  'Volkswagen': { models: ['Jetta', 'Passat', 'Golf', 'GTI', 'Tiguan', 'Atlas', 'ID.4', 'Arteon', 'Taos'], types: ['Sedan', 'SUV', 'Coupe'] },
  'Tesla': { models: ['Model S', 'Model 3', 'Model X', 'Model Y', 'Cybertruck'], types: ['Sedan', 'SUV', 'Truck'] },
  'Volvo': { models: ['S60', 'S90', 'V60', 'V90', 'XC40', 'XC60', 'XC90', 'C40'], types: ['Sedan', 'SUV'] },
  'Porsche': { models: ['911', 'Cayenne', 'Macan', 'Panamera', 'Taycan', 'Boxster', 'Cayman'], types: ['Sedan', 'SUV', 'Coupe'] },
  'Acura': { models: ['ILX', 'TLX', 'RDX', 'MDX', 'Integra', 'NSX'], types: ['Sedan', 'SUV', 'Coupe'] },
  'Infiniti': { models: ['Q50', 'Q60', 'QX50', 'QX55', 'QX60', 'QX80'], types: ['Sedan', 'SUV', 'Coupe'] },
  'Cadillac': { models: ['CT4', 'CT5', 'XT4', 'XT5', 'XT6', 'Escalade', 'Lyriq'], types: ['Sedan', 'SUV'] },
  'Lincoln': { models: ['Corsair', 'Nautilus', 'Aviator', 'Navigator'], types: ['SUV'] },
  'Buick': { models: ['Encore', 'Envision', 'Enclave'], types: ['SUV'] },
  'Chrysler': { models: ['300', 'Pacifica', 'Voyager'], types: ['Sedan', 'SUV'] },
  'Land Rover': { models: ['Range Rover', 'Range Rover Sport', 'Defender', 'Discovery', 'Evoque', 'Velar'], types: ['SUV'] },
  'Jaguar': { models: ['XE', 'XF', 'F-Pace', 'E-Pace', 'I-Pace', 'F-Type'], types: ['Sedan', 'SUV', 'Coupe'] },
  'Genesis': { models: ['G70', 'G80', 'G90', 'GV70', 'GV80', 'GV60'], types: ['Sedan', 'SUV'] },
  'Mini': { models: ['Cooper', 'Countryman', 'Clubman', 'Convertible'], types: ['Coupe', 'SUV'] },
  'Mitsubishi': { models: ['Outlander', 'Eclipse Cross', 'Mirage', 'Outlander Sport'], types: ['Sedan', 'SUV'] },
  'Alfa Romeo': { models: ['Giulia', 'Stelvio', 'Tonale'], types: ['Sedan', 'SUV'] },
  'Maserati': { models: ['Ghibli', 'Quattroporte', 'Levante', 'MC20', 'Grecale'], types: ['Sedan', 'SUV', 'Coupe'] },
  'Harley-Davidson': { models: ['Street Glide', 'Road King', 'Sportster', 'Iron 883', 'Fat Boy', 'Road Glide', 'Softail', 'Electra Glide', 'Pan America', 'LiveWire'], types: ['Motorcycle'] },
  'Honda Motorcycle': { models: ['Gold Wing', 'Africa Twin', 'CBR1000RR', 'CBR600RR', 'CB500X', 'Rebel 500', 'Rebel 1100', 'CRF450R', 'Grom', 'PCX'], types: ['Motorcycle'] },
  'Yamaha': { models: ['YZF-R1', 'YZF-R6', 'MT-07', 'MT-09', 'Tenere 700', 'VMAX', 'Bolt', 'FZ-07', 'Tracer 900'], types: ['Motorcycle'] },
  'Kawasaki': { models: ['Ninja ZX-10R', 'Ninja 650', 'Z900', 'Z650', 'Versys 650', 'Vulcan S', 'Ninja 400', 'KLR 650'], types: ['Motorcycle'] },
  'Suzuki': { models: ['GSX-R1000', 'GSX-R750', 'Hayabusa', 'V-Strom 650', 'V-Strom 1050', 'Boulevard M109R', 'DR650'], types: ['Motorcycle'] },
  'Ducati': { models: ['Panigale V4', 'Monster', 'Multistrada', 'Scrambler', 'Streetfighter', 'Hypermotard', 'Diavel'], types: ['Motorcycle'] },
  'BMW Motorrad': { models: ['R 1250 GS', 'S 1000 RR', 'R nineT', 'K 1600', 'F 850 GS', 'G 310 R', 'R 1250 RT'], types: ['Motorcycle'] },
  'Triumph': { models: ['Bonneville', 'Street Triple', 'Tiger 900', 'Speed Triple', 'Thruxton', 'Trident 660', 'Rocket 3'], types: ['Motorcycle'] },
  'Indian': { models: ['Chief', 'Scout', 'Chieftain', 'Springfield', 'Challenger', 'FTR 1200'], types: ['Motorcycle'] },
  'KTM': { models: ['1290 Super Duke', '890 Duke', '390 Duke', '1290 Super Adventure', '890 Adventure'], types: ['Motorcycle'] },
  'Sea-Doo': { models: ['Spark', 'GTI', 'GTX', 'RXP-X', 'Fish Pro', 'Wake Pro', 'Switch'], types: ['Marine'] },
  'Yamaha Marine': { models: ['WaveRunner VX', 'FX Cruiser', 'GP1800R', 'EX Deluxe', 'SuperJet'], types: ['Marine'] },
  'Kawasaki Marine': { models: ['Ultra 310', 'STX 160', 'SX-R', 'Ultra LX'], types: ['Marine'] },
  'Boston Whaler': { models: ['Montauk', 'Outrage', 'Dauntless', 'Conquest', 'Vantage'], types: ['Marine'] },
  'Grady-White': { models: ['Freedom', 'Fisherman', 'Canyon', 'Express', 'Seafarer'], types: ['Marine'] },
  'Bayliner': { models: ['Element', 'VR5', 'VR6', 'Trophy', 'Bowrider'], types: ['Marine'] },
  'Sea Ray': { models: ['Sundancer', 'SLX', 'SPX', 'SDX', 'Sundeck'], types: ['Marine'] },
  'Tracker': { models: ['Pro Team', 'Classic XL', 'Targa', 'Pro Guide'], types: ['Marine'] },
  'Malibu': { models: ['Wakesetter', 'Response', 'M220'], types: ['Marine'] },
  'MasterCraft': { models: ['X22', 'X24', 'NXT22', 'ProStar'], types: ['Marine'] },
  'Ranger Boats': { models: ['Z520L', 'Z519', 'RT198P', 'VS1882'], types: ['Marine'] },
  'Lund': { models: ['Fury', 'Pro-V', 'Crossover', 'Impact', 'Rebel'], types: ['Marine'] },
  'Polaris': { models: ['Slingshot', 'RZR', 'Ranger', 'General', 'Sportsman'], types: ['Motorcycle', 'Marine'] },
  'Can-Am': { models: ['Spyder', 'Ryker', 'Maverick', 'Defender', 'Outlander'], types: ['Motorcycle'] },
};

export function detectVehicleType(model: string, make?: string): string {
  const normalizedModel = model.toLowerCase().trim();
  const normalizedMake = make?.toLowerCase().trim() || "";

  const motorcycleKeywords = ['ninja', 'sportster', 'goldwing', 'street glide', 'road king', 'cbr', 'yzf', 'gsx', 'hayabusa', 'motorcycle', 'bike'];
  const marineKeywords = ['waverunner', 'jet ski', 'pwc', 'boat', 'whaler', 'wakesetter', 'yacht', 'marine', 'vessel'];
  const recreationalKeywords = ['atv', 'utv', 'rv', 'motorhome', 'trailer', 'camper', 'rzr', 'maverick'];

  if (motorcycleKeywords.some(k => normalizedModel.includes(k)) || normalizedMake.includes('harley') || normalizedMake.includes('bmw motorrad')) return 'Motorcycle';
  if (marineKeywords.some(k => normalizedModel.includes(k)) || normalizedMake.includes('sea-doo') || normalizedMake.includes('boston whaler')) return 'Marine';
  if (recreationalKeywords.some(k => normalizedModel.includes(k))) return 'SUV'; // Map to SUV or something similar if not specific

  if (make && VEHICLE_DATA[make]) {
    const brandData = VEHICLE_DATA[make];
    if (brandData.types.length === 1) return brandData.types[0];
  }

  if (normalizedModel.includes('f-150') || normalizedModel.includes('silverado') || normalizedModel.includes('ram') || normalizedModel.includes('truck') || normalizedModel.includes('pickup')) return 'Truck';
  if (normalizedModel.includes('explorer') || normalizedModel.includes('tahoe') || normalizedModel.includes('suv') || normalizedModel.includes('crossover')) return 'SUV';
  if (normalizedModel.includes('mustang') || normalizedModel.includes('camaro') || normalizedModel.includes('coupe')) return 'Coupe';

  return 'Sedan';
}

export function getInternalVehicleType(uiType: string): VehicleType {
  const t = uiType.toLowerCase();
  if (t === 'motorcycle') return 'motorcycle';
  if (t === 'marine' || t === 'marine/boat') return 'marine';
  if (t === 'suv' || t === 'truck' || t === 'sedan' || t === 'coupe') return 'automobile';
  return 'automobile';
}
