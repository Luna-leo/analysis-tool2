export interface UnitDefinition {
  primarySymbol: string;      // Primary unit symbol (e.g., °C)
  name: string;               // Official name (e.g., Celsius)
  aliases: string[];          // Aliases (e.g., ['℃', 'degC', 'C', 'celsius'])
  displayFormat?: string;     // Display format (e.g., '{value}°C')
}

export interface UnitConverterFormula {
  id: string;
  name: string;
  description: string;
  category: UnitCategory;
  fromUnit: UnitDefinition;
  toUnit: UnitDefinition;
  formula: string;              // Conversion formula (e.g., 'x * 9/5 + 32')
  parameters: string[];         // Variable names used (e.g., ['x'])
  isBidirectional: boolean;     // Whether bidirectional conversion is possible
  reverseFormula?: string;      // Reverse conversion formula (for bidirectional)
  isFavorite?: boolean;
  usageCount?: number;
  createdAt: number;
  updatedAt: number;
}

export type UnitCategory = 
  | 'temperature'    // Temperature
  | 'pressure'       // Pressure
  | 'length'         // Length
  | 'weight'         // Weight
  | 'volume'         // Volume
  | 'speed'          // Speed
  | 'area'           // Area
  | 'energy'         // Energy
  | 'power'          // Power
  | 'time'           // Time
  | 'frequency'      // Frequency
  | 'other';         // Other

export const UNIT_CATEGORIES: Record<UnitCategory, string> = {
  temperature: 'Temperature',
  pressure: 'Pressure',
  length: 'Length',
  weight: 'Weight',
  volume: 'Volume',
  speed: 'Speed',
  area: 'Area',
  energy: 'Energy',
  power: 'Power',
  time: 'Time',
  frequency: 'Frequency',
  other: 'Other'
};

// Default values for unit conversion formula
export const DEFAULT_UNIT_CONVERTER_FORMULA: Partial<UnitConverterFormula> = {
  name: '',
  description: '',
  category: 'other',
  fromUnit: {
    primarySymbol: '',
    name: '',
    aliases: [],
    displayFormat: '{value}'
  },
  toUnit: {
    primarySymbol: '',
    name: '',
    aliases: [],
    displayFormat: '{value}'
  },
  formula: '',
  parameters: ['x'],
  isBidirectional: false,
  isFavorite: false,
  usageCount: 0
};

// Alias conflict check results
export interface AliasConflict {
  alias: string;
  conflictingFormulaId: string;
  conflictingFormulaName: string;
  unit: 'from' | 'to';
}

// Validation results
export interface UnitConverterValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  aliasConflicts: AliasConflict[];
}

// Conversion test results
export interface ConversionTestResult {
  input: number;
  output: number;
  formattedInput: string;
  formattedOutput: string;
  error?: string;
}