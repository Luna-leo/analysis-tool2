import { UnitConverterFormula } from '@/types/unit-converter';

export const PREDEFINED_UNIT_CONVERSIONS: Omit<UnitConverterFormula, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // Temperature conversions
  {
    name: 'Celsius to Fahrenheit',
    description: 'Convert Celsius temperature to Fahrenheit temperature',
    category: 'temperature',
    fromUnit: {
      primarySymbol: '°C',
      name: 'Celsius',
      aliases: ['℃', 'C', 'celsius'],
      displayFormat: '{value}°C'
    },
    toUnit: {
      primarySymbol: '°F',
      name: 'Fahrenheit',
      aliases: ['℉', 'F', 'fahrenheit'],
      displayFormat: '{value}°F'
    },
    formula: 'x * 9/5 + 32',
    reverseFormula: '(x - 32) * 5/9',
    isBidirectional: true,
    parameters: [],
    usageCount: 0,
    isFavorite: true
  },
  {
    name: 'Celsius to Kelvin',
    description: 'Convert Celsius temperature to Kelvin temperature',
    category: 'temperature',
    fromUnit: {
      primarySymbol: '°C',
      name: 'Celsius',
      aliases: ['℃', 'C', 'celsius'],
      displayFormat: '{value}°C'
    },
    toUnit: {
      primarySymbol: 'K',
      name: 'Kelvin',
      aliases: ['kelvin'],
      displayFormat: '{value}K'
    },
    formula: 'x + 273.15',
    reverseFormula: 'x - 273.15',
    isBidirectional: true,
    parameters: [],
    usageCount: 0,
    isFavorite: true
  },
  {
    name: 'Fahrenheit to Kelvin',
    description: 'Convert Fahrenheit temperature to Kelvin temperature',
    category: 'temperature',
    fromUnit: {
      primarySymbol: '°F',
      name: 'Fahrenheit',
      aliases: ['℉', 'F', 'fahrenheit'],
      displayFormat: '{value}°F'
    },
    toUnit: {
      primarySymbol: 'K',
      name: 'Kelvin',
      aliases: ['kelvin'],
      displayFormat: '{value}K'
    },
    formula: '(x - 32) * 5/9 + 273.15',
    reverseFormula: '(x - 273.15) * 9/5 + 32',
    isBidirectional: true,
    parameters: [],
    usageCount: 0,
    isFavorite: false
  },

  // Length conversions
  {
    name: 'Meters to Feet',
    description: 'Convert meters to feet',
    category: 'length',
    fromUnit: {
      primarySymbol: 'm',
      name: 'Meter',
      aliases: ['meter', 'metre'],
      displayFormat: '{value}m'
    },
    toUnit: {
      primarySymbol: 'ft',
      name: 'Feet',
      aliases: ['feet', 'foot'],
      displayFormat: '{value}ft'
    },
    formula: 'x * 3.28084',
    reverseFormula: 'x / 3.28084',
    isBidirectional: true,
    parameters: [],
    usageCount: 0,
    isFavorite: true
  },
  {
    name: 'Inches to Centimeters',
    description: 'Convert inches to centimeters',
    category: 'length',
    fromUnit: {
      primarySymbol: 'in',
      name: 'Inch',
      aliases: ['inch', 'inches', '"'],
      displayFormat: '{value}in'
    },
    toUnit: {
      primarySymbol: 'cm',
      name: 'Centimeter',
      aliases: ['centimeter'],
      displayFormat: '{value}cm'
    },
    formula: 'x * 2.54',
    reverseFormula: 'x / 2.54',
    isBidirectional: true,
    parameters: [],
    usageCount: 0,
    isFavorite: true
  },
  {
    name: 'Kilometers to Miles',
    description: 'Convert kilometers to miles',
    category: 'length',
    fromUnit: {
      primarySymbol: 'km',
      name: 'Kilometer',
      aliases: ['kilometer'],
      displayFormat: '{value}km'
    },
    toUnit: {
      primarySymbol: 'mi',
      name: 'Mile',
      aliases: ['mile', 'miles'],
      displayFormat: '{value}mi'
    },
    formula: 'x * 0.621371',
    reverseFormula: 'x / 0.621371',
    isBidirectional: true,
    parameters: [],
    usageCount: 0,
    isFavorite: false
  },
  {
    name: 'Millimeters to Inches',
    description: 'Convert millimeters to inches',
    category: 'length',
    fromUnit: {
      primarySymbol: 'mm',
      name: 'Millimeter',
      aliases: ['millimeter'],
      displayFormat: '{value}mm'
    },
    toUnit: {
      primarySymbol: 'in',
      name: 'Inch',
      aliases: ['inch', 'inches', '"'],
      displayFormat: '{value}in'
    },
    formula: 'x / 25.4',
    reverseFormula: 'x * 25.4',
    isBidirectional: true,
    parameters: [],
    usageCount: 0,
    isFavorite: false
  },

  // Weight conversions
  {
    name: 'Kilograms to Pounds',
    description: 'Convert kilograms to pounds',
    category: 'weight',
    fromUnit: {
      primarySymbol: 'kg',
      name: 'Kilogram',
      aliases: ['kilogram'],
      displayFormat: '{value}kg'
    },
    toUnit: {
      primarySymbol: 'lb',
      name: 'Pound',
      aliases: ['lbs', 'pound', 'pounds'],
      displayFormat: '{value}lb'
    },
    formula: 'x * 2.20462',
    reverseFormula: 'x / 2.20462',
    isBidirectional: true,
    parameters: [],
    usageCount: 0,
    isFavorite: true
  },
  {
    name: 'Grams to Ounces',
    description: 'Convert grams to ounces',
    category: 'weight',
    fromUnit: {
      primarySymbol: 'g',
      name: 'Gram',
      aliases: ['gram'],
      displayFormat: '{value}g'
    },
    toUnit: {
      primarySymbol: 'oz',
      name: 'Ounce',
      aliases: ['ounce', 'ounces'],
      displayFormat: '{value}oz'
    },
    formula: 'x * 0.035274',
    reverseFormula: 'x / 0.035274',
    isBidirectional: true,
    parameters: [],
    usageCount: 0,
    isFavorite: false
  },
  {
    name: 'Tons to Kilograms',
    description: 'Convert tons to kilograms',
    category: 'weight',
    fromUnit: {
      primarySymbol: 't',
      name: 'Ton',
      aliases: ['ton', 'tonne'],
      displayFormat: '{value}t'
    },
    toUnit: {
      primarySymbol: 'kg',
      name: 'Kilogram',
      aliases: ['kilogram'],
      displayFormat: '{value}kg'
    },
    formula: 'x * 1000',
    reverseFormula: 'x / 1000',
    isBidirectional: true,
    parameters: [],
    usageCount: 0,
    isFavorite: false
  },

  // Pressure conversions
  {
    name: 'Pascals to Bar',
    description: 'Convert pascals to bar',
    category: 'pressure',
    fromUnit: {
      primarySymbol: 'Pa',
      name: 'Pascal',
      aliases: ['pascal'],
      displayFormat: '{value}Pa'
    },
    toUnit: {
      primarySymbol: 'bar',
      name: 'Bar',
      aliases: [],
      displayFormat: '{value}bar'
    },
    formula: 'x / 100000',
    reverseFormula: 'x * 100000',
    isBidirectional: true,
    parameters: [],
    usageCount: 0,
    isFavorite: true
  },
  {
    name: 'PSI to Bar',
    description: 'Convert PSI (pounds per square inch) to bar',
    category: 'pressure',
    fromUnit: {
      primarySymbol: 'psi',
      name: 'PSI',
      aliases: ['PSI', 'pound per square inch'],
      displayFormat: '{value}psi'
    },
    toUnit: {
      primarySymbol: 'bar',
      name: 'Bar',
      aliases: [],
      displayFormat: '{value}bar'
    },
    formula: 'x * 0.0689476',
    reverseFormula: 'x / 0.0689476',
    isBidirectional: true,
    parameters: [],
    usageCount: 0,
    isFavorite: false
  },
  {
    name: 'Kilopascals to PSI',
    description: 'Convert kilopascals to PSI',
    category: 'pressure',
    fromUnit: {
      primarySymbol: 'kPa',
      name: 'Kilopascal',
      aliases: ['kilopascal'],
      displayFormat: '{value}kPa'
    },
    toUnit: {
      primarySymbol: 'psi',
      name: 'PSI',
      aliases: ['PSI', 'pound per square inch'],
      displayFormat: '{value}psi'
    },
    formula: 'x * 0.145038',
    reverseFormula: 'x / 0.145038',
    isBidirectional: true,
    parameters: [],
    usageCount: 0,
    isFavorite: false
  },
  {
    name: 'Atmospheres to Pascals',
    description: 'Convert atmospheres (atm) to pascals',
    category: 'pressure',
    fromUnit: {
      primarySymbol: 'atm',
      name: 'Atmosphere',
      aliases: ['atmosphere'],
      displayFormat: '{value}atm'
    },
    toUnit: {
      primarySymbol: 'Pa',
      name: 'Pascal',
      aliases: ['pascal'],
      displayFormat: '{value}Pa'
    },
    formula: 'x * 101325',
    reverseFormula: 'x / 101325',
    isBidirectional: true,
    parameters: [],
    usageCount: 0,
    isFavorite: false
  },

  // Volume conversions
  {
    name: 'Liters to Gallons (US)',
    description: 'Convert liters to US gallons',
    category: 'volume',
    fromUnit: {
      primarySymbol: 'L',
      name: 'Liter',
      aliases: ['l', 'liter', 'litre'],
      displayFormat: '{value}L'
    },
    toUnit: {
      primarySymbol: 'gal',
      name: 'Gallon (US)',
      aliases: ['gallon', 'US gallon'],
      displayFormat: '{value}gal'
    },
    formula: 'x * 0.264172',
    reverseFormula: 'x / 0.264172',
    isBidirectional: true,
    parameters: [],
    usageCount: 0,
    isFavorite: true
  },
  {
    name: 'Milliliters to Fluid Ounces',
    description: 'Convert milliliters to fluid ounces',
    category: 'volume',
    fromUnit: {
      primarySymbol: 'mL',
      name: 'Milliliter',
      aliases: ['ml', 'milliliter', 'millilitre'],
      displayFormat: '{value}mL'
    },
    toUnit: {
      primarySymbol: 'fl oz',
      name: 'Fluid Ounce',
      aliases: ['fluid ounce', 'fl. oz.'],
      displayFormat: '{value}fl oz'
    },
    formula: 'x * 0.033814',
    reverseFormula: 'x / 0.033814',
    isBidirectional: true,
    parameters: [],
    usageCount: 0,
    isFavorite: false
  },
  {
    name: 'Cubic Meters to Cubic Feet',
    description: 'Convert cubic meters to cubic feet',
    category: 'volume',
    fromUnit: {
      primarySymbol: 'm³',
      name: 'Cubic Meter',
      aliases: ['m3', 'cubic meter'],
      displayFormat: '{value}m³'
    },
    toUnit: {
      primarySymbol: 'ft³',
      name: 'Cubic Feet',
      aliases: ['ft3', 'cubic feet'],
      displayFormat: '{value}ft³'
    },
    formula: 'x * 35.3147',
    reverseFormula: 'x / 35.3147',
    isBidirectional: true,
    parameters: [],
    usageCount: 0,
    isFavorite: false
  },

  // Speed conversions
  {
    name: 'Kilometers per Hour to Miles per Hour',
    description: 'Convert kilometers per hour to miles per hour',
    category: 'speed',
    fromUnit: {
      primarySymbol: 'km/h',
      name: 'Kilometers per Hour',
      aliases: ['kph'],
      displayFormat: '{value}km/h'
    },
    toUnit: {
      primarySymbol: 'mph',
      name: 'Miles per Hour',
      aliases: ['miles per hour'],
      displayFormat: '{value}mph'
    },
    formula: 'x * 0.621371',
    reverseFormula: 'x / 0.621371',
    isBidirectional: true,
    parameters: [],
    usageCount: 0,
    isFavorite: true
  },
  {
    name: 'Meters per Second to Kilometers per Hour',
    description: 'Convert meters per second to kilometers per hour',
    category: 'speed',
    fromUnit: {
      primarySymbol: 'm/s',
      name: 'Meters per Second',
      aliases: ['meters per second'],
      displayFormat: '{value}m/s'
    },
    toUnit: {
      primarySymbol: 'km/h',
      name: 'Kilometers per Hour',
      aliases: ['kph'],
      displayFormat: '{value}km/h'
    },
    formula: 'x * 3.6',
    reverseFormula: 'x / 3.6',
    isBidirectional: true,
    parameters: [],
    usageCount: 0,
    isFavorite: false
  },
  {
    name: 'Knots to Kilometers per Hour',
    description: 'Convert knots (nautical miles per hour) to kilometers per hour',
    category: 'speed',
    fromUnit: {
      primarySymbol: 'kn',
      name: 'Knot',
      aliases: ['knot', 'knots'],
      displayFormat: '{value}kn'
    },
    toUnit: {
      primarySymbol: 'km/h',
      name: 'Kilometers per Hour',
      aliases: ['kph'],
      displayFormat: '{value}km/h'
    },
    formula: 'x * 1.852',
    reverseFormula: 'x / 1.852',
    isBidirectional: true,
    parameters: [],
    usageCount: 0,
    isFavorite: false
  },

  // Area conversions
  {
    name: 'Square Meters to Square Feet',
    description: 'Convert square meters to square feet',
    category: 'area',
    fromUnit: {
      primarySymbol: 'm²',
      name: 'Square Meter',
      aliases: ['m2', 'square meter'],
      displayFormat: '{value}m²'
    },
    toUnit: {
      primarySymbol: 'ft²',
      name: 'Square Feet',
      aliases: ['ft2', 'square feet'],
      displayFormat: '{value}ft²'
    },
    formula: 'x * 10.7639',
    reverseFormula: 'x / 10.7639',
    isBidirectional: true,
    parameters: [],
    usageCount: 0,
    isFavorite: true
  },
  {
    name: 'Hectares to Acres',
    description: 'Convert hectares to acres',
    category: 'area',
    fromUnit: {
      primarySymbol: 'ha',
      name: 'Hectare',
      aliases: ['hectare'],
      displayFormat: '{value}ha'
    },
    toUnit: {
      primarySymbol: 'ac',
      name: 'Acre',
      aliases: ['acre', 'acres'],
      displayFormat: '{value}ac'
    },
    formula: 'x * 2.47105',
    reverseFormula: 'x / 2.47105',
    isBidirectional: true,
    parameters: [],
    usageCount: 0,
    isFavorite: false
  },
  {
    name: 'Square Kilometers to Square Miles',
    description: 'Convert square kilometers to square miles',
    category: 'area',
    fromUnit: {
      primarySymbol: 'km²',
      name: 'Square Kilometer',
      aliases: ['km2', 'square kilometer'],
      displayFormat: '{value}km²'
    },
    toUnit: {
      primarySymbol: 'mi²',
      name: 'Square Mile',
      aliases: ['mi2', 'square mile'],
      displayFormat: '{value}mi²'
    },
    formula: 'x * 0.386102',
    reverseFormula: 'x / 0.386102',
    isBidirectional: true,
    parameters: [],
    usageCount: 0,
    isFavorite: false
  },

  // Energy conversions
  {
    name: 'Joules to Calories',
    description: 'Convert joules to calories',
    category: 'energy',
    fromUnit: {
      primarySymbol: 'J',
      name: 'Joule',
      aliases: ['joule'],
      displayFormat: '{value}J'
    },
    toUnit: {
      primarySymbol: 'cal',
      name: 'Calorie',
      aliases: ['calorie'],
      displayFormat: '{value}cal'
    },
    formula: 'x * 0.239006',
    reverseFormula: 'x / 0.239006',
    isBidirectional: true,
    parameters: [],
    usageCount: 0,
    isFavorite: true
  },
  {
    name: 'Kilowatt Hours to Kilojoules',
    description: 'Convert kilowatt hours to kilojoules',
    category: 'energy',
    fromUnit: {
      primarySymbol: 'kWh',
      name: 'Kilowatt Hour',
      aliases: ['kilowatt hour'],
      displayFormat: '{value}kWh'
    },
    toUnit: {
      primarySymbol: 'kJ',
      name: 'Kilojoule',
      aliases: ['kilojoule'],
      displayFormat: '{value}kJ'
    },
    formula: 'x * 3600',
    reverseFormula: 'x / 3600',
    isBidirectional: true,
    parameters: [],
    usageCount: 0,
    isFavorite: false
  },
  {
    name: 'BTU to Joules',
    description: 'Convert BTU (British thermal unit) to joules',
    category: 'energy',
    fromUnit: {
      primarySymbol: 'BTU',
      name: 'BTU',
      aliases: ['British thermal unit'],
      displayFormat: '{value}BTU'
    },
    toUnit: {
      primarySymbol: 'J',
      name: 'Joule',
      aliases: ['joule'],
      displayFormat: '{value}J'
    },
    formula: 'x * 1055.06',
    reverseFormula: 'x / 1055.06',
    isBidirectional: true,
    parameters: [],
    usageCount: 0,
    isFavorite: false
  },

  // Power conversions
  {
    name: 'Watts to Horsepower',
    description: 'Convert watts to horsepower',
    category: 'power',
    fromUnit: {
      primarySymbol: 'W',
      name: 'Watt',
      aliases: ['watt'],
      displayFormat: '{value}W'
    },
    toUnit: {
      primarySymbol: 'hp',
      name: 'Horsepower',
      aliases: ['horsepower'],
      displayFormat: '{value}hp'
    },
    formula: 'x * 0.00134102',
    reverseFormula: 'x / 0.00134102',
    isBidirectional: true,
    parameters: [],
    usageCount: 0,
    isFavorite: true
  },
  {
    name: 'Kilowatts to Horsepower',
    description: 'Convert kilowatts to horsepower',
    category: 'power',
    fromUnit: {
      primarySymbol: 'kW',
      name: 'Kilowatt',
      aliases: ['kilowatt'],
      displayFormat: '{value}kW'
    },
    toUnit: {
      primarySymbol: 'hp',
      name: 'Horsepower',
      aliases: ['horsepower'],
      displayFormat: '{value}hp'
    },
    formula: 'x * 1.34102',
    reverseFormula: 'x / 1.34102',
    isBidirectional: true,
    parameters: [],
    usageCount: 0,
    isFavorite: false
  },

  // Time conversions
  {
    name: 'Hours to Minutes',
    description: 'Convert hours to minutes',
    category: 'time',
    fromUnit: {
      primarySymbol: 'h',
      name: 'Hour',
      aliases: ['hour', 'hours'],
      displayFormat: '{value}h'
    },
    toUnit: {
      primarySymbol: 'min',
      name: 'Minute',
      aliases: ['minute', 'minutes'],
      displayFormat: '{value}min'
    },
    formula: 'x * 60',
    reverseFormula: 'x / 60',
    isBidirectional: true,
    parameters: [],
    usageCount: 0,
    isFavorite: false
  },
  {
    name: 'Days to Hours',
    description: 'Convert days to hours',
    category: 'time',
    fromUnit: {
      primarySymbol: 'd',
      name: 'Day',
      aliases: ['day', 'days'],
      displayFormat: '{value}d'
    },
    toUnit: {
      primarySymbol: 'h',
      name: 'Hour',
      aliases: ['hour', 'hours'],
      displayFormat: '{value}h'
    },
    formula: 'x * 24',
    reverseFormula: 'x / 24',
    isBidirectional: true,
    parameters: [],
    usageCount: 0,
    isFavorite: false
  },
  {
    name: 'Weeks to Days',
    description: 'Convert weeks to days',
    category: 'time',
    fromUnit: {
      primarySymbol: 'week',
      name: 'Week',
      aliases: ['w', 'weeks'],
      displayFormat: '{value}weeks'
    },
    toUnit: {
      primarySymbol: 'd',
      name: 'Day',
      aliases: ['day', 'days'],
      displayFormat: '{value}d'
    },
    formula: 'x * 7',
    reverseFormula: 'x / 7',
    isBidirectional: true,
    parameters: [],
    usageCount: 0,
    isFavorite: false
  },

  // Frequency conversions
  {
    name: 'Hertz to Kilohertz',
    description: 'Convert hertz to kilohertz',
    category: 'frequency',
    fromUnit: {
      primarySymbol: 'Hz',
      name: 'Hertz',
      aliases: ['hertz'],
      displayFormat: '{value}Hz'
    },
    toUnit: {
      primarySymbol: 'kHz',
      name: 'Kilohertz',
      aliases: ['kilohertz'],
      displayFormat: '{value}kHz'
    },
    formula: 'x / 1000',
    reverseFormula: 'x * 1000',
    isBidirectional: true,
    parameters: [],
    usageCount: 0,
    isFavorite: true
  },
  {
    name: 'Megahertz to Gigahertz',
    description: 'Convert megahertz to gigahertz',
    category: 'frequency',
    fromUnit: {
      primarySymbol: 'MHz',
      name: 'Megahertz',
      aliases: ['megahertz'],
      displayFormat: '{value}MHz'
    },
    toUnit: {
      primarySymbol: 'GHz',
      name: 'Gigahertz',
      aliases: ['gigahertz'],
      displayFormat: '{value}GHz'
    },
    formula: 'x / 1000',
    reverseFormula: 'x * 1000',
    isBidirectional: true,
    parameters: [],
    usageCount: 0,
    isFavorite: false
  },
  {
    name: 'RPM to Hertz',
    description: 'Convert revolutions per minute to hertz',
    category: 'frequency',
    fromUnit: {
      primarySymbol: 'rpm',
      name: 'Revolutions per Minute',
      aliases: ['RPM', 'revolutions per minute'],
      displayFormat: '{value}rpm'
    },
    toUnit: {
      primarySymbol: 'Hz',
      name: 'Hertz',
      aliases: ['hertz'],
      displayFormat: '{value}Hz'
    },
    formula: 'x / 60',
    reverseFormula: 'x * 60',
    isBidirectional: true,
    parameters: [],
    usageCount: 0,
    isFavorite: false
  }
];