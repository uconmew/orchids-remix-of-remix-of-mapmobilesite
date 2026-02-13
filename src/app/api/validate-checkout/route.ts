import { NextRequest, NextResponse } from 'next/server';
import { VEHICLE_DATA, detectVehicleType } from '@/lib/vehicle-type-detector';

const VALID_US_STATES = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'];

function findClosestMatch(input: string, options: string[]): { match: string | null; suggestion: string | null } {
  const normalizedInput = input.toLowerCase().trim();
  const exactMatch = options.find(opt => opt.toLowerCase() === normalizedInput);
  if (exactMatch) return { match: exactMatch, suggestion: null };
  
  const partialMatch = options.find(opt => opt.toLowerCase().includes(normalizedInput) || normalizedInput.includes(opt.toLowerCase()));
  if (partialMatch) return { match: partialMatch, suggestion: null };
  
  let closestMatch: string | null = null;
  let minDistance = Infinity;
  
  for (const option of options) {
    const distance = levenshteinDistance(normalizedInput, option.toLowerCase());
    if (distance < minDistance && distance <= 3) {
      minDistance = distance;
      closestMatch = option;
    }
  }
  
  return { match: null, suggestion: closestMatch };
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] = b.charAt(i - 1) === a.charAt(j - 1)
        ? matrix[i - 1][j - 1]
        : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  return matrix[b.length][a.length];
}

interface ValidationErrors {
  email?: string;
  fullName?: string;
  phone?: string;
  vehicle?: string;
  address?: string;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationErrors;
  suggestions: {
    vehicleMake?: string;
    vehicleModel?: string;
    vehicleType?: string;
    addressCorrection?: string;
    autoDetectedType?: string;
  };
  autoDetectedType?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, fullName, phone, vehicle, address } = body;
    
    const errors: ValidationErrors = {};
    const suggestions: ValidationResult['suggestions'] = {};
    
    if (email) {
      const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      if (!emailRegex.test(email)) {
        errors.email = `"${email}" is not a valid email address. Please use format: name@domain.com`;
      }
      const domainPart = email.split('@')[1];
      if (domainPart && !domainPart.includes('.')) {
        errors.email = `Email domain "${domainPart}" is invalid. Did you mean "${domainPart}.com"?`;
      }
    }
    
    if (fullName) {
      const names = fullName.trim().split(/\s+/);
      if (names.length < 2) {
        errors.fullName = `Please enter your full legal name (first and last name required). You entered: "${fullName}"`;
      } else {
        for (const name of names) {
          if (name.length < 2) {
            errors.fullName = `Each name must be at least 2 characters. "${name}" is too short.`;
            break;
          }
          if (!/^[a-zA-Z'-]+$/.test(name)) {
            errors.fullName = `Name "${name}" contains invalid characters. Only letters, hyphens, and apostrophes are allowed.`;
            break;
          }
        }
      }
    }
    
    if (phone) {
      const digitsOnly = phone.replace(/\D/g, '');
      if (digitsOnly.length !== 10) {
        errors.phone = `Phone number must be exactly 10 digits. You entered ${digitsOnly.length} digits: "${phone}"`;
      } else if (digitsOnly.startsWith('0') || digitsOnly.startsWith('1')) {
        errors.phone = `Invalid area code. US phone numbers cannot start with 0 or 1. You entered: "${phone}"`;
      }
    }
    
    if (vehicle && vehicle.make && vehicle.model) {
      const makes = Object.keys(VEHICLE_DATA);
      const makeResult = findClosestMatch(vehicle.make, makes);
      
      if (!makeResult.match) {
        if (makeResult.suggestion) {
          errors.vehicle = `"${vehicle.make}" is not a recognized vehicle make. Did you mean "${makeResult.suggestion}"?`;
          suggestions.vehicleMake = makeResult.suggestion;
        } else {
          errors.vehicle = `"${vehicle.make}" is not a recognized vehicle make.`;
        }
      } else {
        const brandModels = VEHICLE_DATA[makeResult.match]?.models || [];
        const modelResult = findClosestMatch(vehicle.model, brandModels);
        
        if (!modelResult.match) {
          const wrongBrandModel = Object.entries(VEHICLE_DATA).find(([, data]) => 
            data.models.some(m => m.toLowerCase() === vehicle.model.toLowerCase())
          );
          
          if (wrongBrandModel) {
            const [correctMake] = wrongBrandModel;
            const correctModel = wrongBrandModel[1].models.find(m => m.toLowerCase() === vehicle.model.toLowerCase());
            errors.vehicle = `"${vehicle.model}" is not a ${makeResult.match} model. The ${correctModel} is made by ${correctMake}. Did you mean ${correctMake} ${correctModel}?`;
            suggestions.vehicleMake = correctMake;
            suggestions.vehicleModel = correctModel;
          } else if (modelResult.suggestion) {
            errors.vehicle = `"${vehicle.model}" is not a valid ${makeResult.match} model. Did you mean "${modelResult.suggestion}"?`;
            suggestions.vehicleModel = modelResult.suggestion;
          }
        }
        
        const detectedType = detectVehicleType(makeResult.match, vehicle.model);
        suggestions.autoDetectedType = detectedType;
      }
      
      if (vehicle.year) {
        const year = parseInt(vehicle.year);
        const currentYear = new Date().getFullYear();
        if (isNaN(year) || year < 1950 || year > currentYear + 2) {
          errors.vehicle = (errors.vehicle || '') + ` Year "${vehicle.year}" is invalid. Please enter a year between 1950 and ${currentYear + 1}.`;
        }
      }
    }
    
    if (address) {
      if (address.state) {
        const stateUpper = address.state.toUpperCase().trim();
        if (!VALID_US_STATES.includes(stateUpper)) {
          const stateMatch = findClosestMatch(stateUpper, VALID_US_STATES);
          if (stateMatch.suggestion) {
            errors.address = `"${address.state}" is not a valid US state code. Did you mean "${stateMatch.suggestion}"?`;
            suggestions.addressCorrection = stateMatch.suggestion;
          } else {
            errors.address = `"${address.state}" is not a valid US state code. Please use a 2-letter state abbreviation (e.g., CO, CA, TX).`;
          }
        }
      }
      
      if (address.zip_code) {
        const zipRegex = /^\d{5}(-\d{4})?$/;
        if (!zipRegex.test(address.zip_code)) {
          errors.address = (errors.address || '') + ` Zip code "${address.zip_code}" is invalid. Please use format: 12345 or 12345-6789.`;
        }
      }
      
      if (address.street) {
        if (address.street.length < 5) {
          errors.address = (errors.address || '') + ` Street address "${address.street}" seems too short. Please enter a complete address.`;
        }
        if (!/\d/.test(address.street)) {
          errors.address = (errors.address || '') + ` Street address should include a street number.`;
        }
      }
      
      if (address.city && address.city.length < 2) {
        errors.address = (errors.address || '') + ` City name "${address.city}" is too short.`;
      }
    }
    
    const valid = Object.keys(errors).length === 0;
    
    return NextResponse.json({
      valid,
      errors,
      suggestions,
      autoDetectedType: suggestions.autoDetectedType
    });
    
  } catch (err) {
    console.error('Validation error:', err);
    return NextResponse.json({ valid: false, errors: { general: 'Validation failed' }, suggestions: {} }, { status: 500 });
  }
}
