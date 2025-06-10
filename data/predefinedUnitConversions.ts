import { UnitConverterFormula } from '@/types/unit-converter';

export const PREDEFINED_UNIT_CONVERSIONS: Omit<UnitConverterFormula, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // Temperature conversions
  {
    name: '摂氏から華氏',
    description: '摂氏温度を華氏温度に変換します',
    category: 'temperature',
    fromUnit: {
      primarySymbol: '°C',
      name: '摂氏',
      aliases: ['℃', 'C', 'celsius', 'セルシウス'],
      displayFormat: '{value}°C'
    },
    toUnit: {
      primarySymbol: '°F',
      name: '華氏',
      aliases: ['℉', 'F', 'fahrenheit', 'ファーレンハイト'],
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
    name: '摂氏からケルビン',
    description: '摂氏温度をケルビン温度に変換します',
    category: 'temperature',
    fromUnit: {
      primarySymbol: '°C',
      name: '摂氏',
      aliases: ['℃', 'C', 'celsius', 'セルシウス'],
      displayFormat: '{value}°C'
    },
    toUnit: {
      primarySymbol: 'K',
      name: 'ケルビン',
      aliases: ['kelvin', 'ケルビン'],
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
    name: '華氏からケルビン',
    description: '華氏温度をケルビン温度に変換します',
    category: 'temperature',
    fromUnit: {
      primarySymbol: '°F',
      name: '華氏',
      aliases: ['℉', 'F', 'fahrenheit', 'ファーレンハイト'],
      displayFormat: '{value}°F'
    },
    toUnit: {
      primarySymbol: 'K',
      name: 'ケルビン',
      aliases: ['kelvin', 'ケルビン'],
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
    name: 'メートルからフィート',
    description: 'メートルをフィートに変換します',
    category: 'length',
    fromUnit: {
      primarySymbol: 'm',
      name: 'メートル',
      aliases: ['meter', 'metre', 'メートル'],
      displayFormat: '{value}m'
    },
    toUnit: {
      primarySymbol: 'ft',
      name: 'フィート',
      aliases: ['feet', 'foot', 'フィート'],
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
    name: 'インチからセンチメートル',
    description: 'インチをセンチメートルに変換します',
    category: 'length',
    fromUnit: {
      primarySymbol: 'in',
      name: 'インチ',
      aliases: ['inch', 'inches', '"', 'インチ'],
      displayFormat: '{value}in'
    },
    toUnit: {
      primarySymbol: 'cm',
      name: 'センチメートル',
      aliases: ['centimeter', 'センチ'],
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
    name: 'キロメートルからマイル',
    description: 'キロメートルをマイルに変換します',
    category: 'length',
    fromUnit: {
      primarySymbol: 'km',
      name: 'キロメートル',
      aliases: ['kilometer', 'キロ'],
      displayFormat: '{value}km'
    },
    toUnit: {
      primarySymbol: 'mi',
      name: 'マイル',
      aliases: ['mile', 'miles', 'マイル'],
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
    name: 'ミリメートルからインチ',
    description: 'ミリメートルをインチに変換します',
    category: 'length',
    fromUnit: {
      primarySymbol: 'mm',
      name: 'ミリメートル',
      aliases: ['millimeter', 'ミリ'],
      displayFormat: '{value}mm'
    },
    toUnit: {
      primarySymbol: 'in',
      name: 'インチ',
      aliases: ['inch', 'inches', '"', 'インチ'],
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
    name: 'キログラムからポンド',
    description: 'キログラムをポンドに変換します',
    category: 'weight',
    fromUnit: {
      primarySymbol: 'kg',
      name: 'キログラム',
      aliases: ['kilogram', 'キロ'],
      displayFormat: '{value}kg'
    },
    toUnit: {
      primarySymbol: 'lb',
      name: 'ポンド',
      aliases: ['lbs', 'pound', 'pounds', 'ポンド'],
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
    name: 'グラムからオンス',
    description: 'グラムをオンスに変換します',
    category: 'weight',
    fromUnit: {
      primarySymbol: 'g',
      name: 'グラム',
      aliases: ['gram', 'グラム'],
      displayFormat: '{value}g'
    },
    toUnit: {
      primarySymbol: 'oz',
      name: 'オンス',
      aliases: ['ounce', 'ounces', 'オンス'],
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
    name: 'トンからキログラム',
    description: 'トンをキログラムに変換します',
    category: 'weight',
    fromUnit: {
      primarySymbol: 't',
      name: 'トン',
      aliases: ['ton', 'tonne', 'トン'],
      displayFormat: '{value}t'
    },
    toUnit: {
      primarySymbol: 'kg',
      name: 'キログラム',
      aliases: ['kilogram', 'キロ'],
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
    name: 'パスカルからバール',
    description: 'パスカルをバールに変換します',
    category: 'pressure',
    fromUnit: {
      primarySymbol: 'Pa',
      name: 'パスカル',
      aliases: ['pascal', 'パスカル'],
      displayFormat: '{value}Pa'
    },
    toUnit: {
      primarySymbol: 'bar',
      name: 'バール',
      aliases: ['バール'],
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
    name: 'PSIからバール',
    description: 'PSI（ポンド毎平方インチ）をバールに変換します',
    category: 'pressure',
    fromUnit: {
      primarySymbol: 'psi',
      name: 'PSI',
      aliases: ['PSI', 'pound per square inch'],
      displayFormat: '{value}psi'
    },
    toUnit: {
      primarySymbol: 'bar',
      name: 'バール',
      aliases: ['バール'],
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
    name: 'キロパスカルからPSI',
    description: 'キロパスカルをPSIに変換します',
    category: 'pressure',
    fromUnit: {
      primarySymbol: 'kPa',
      name: 'キロパスカル',
      aliases: ['kilopascal', 'キロパスカル'],
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
    name: '気圧からパスカル',
    description: '気圧（atm）をパスカルに変換します',
    category: 'pressure',
    fromUnit: {
      primarySymbol: 'atm',
      name: '気圧',
      aliases: ['atmosphere', '気圧'],
      displayFormat: '{value}atm'
    },
    toUnit: {
      primarySymbol: 'Pa',
      name: 'パスカル',
      aliases: ['pascal', 'パスカル'],
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
    name: 'リットルからガロン（米国）',
    description: 'リットルを米国ガロンに変換します',
    category: 'volume',
    fromUnit: {
      primarySymbol: 'L',
      name: 'リットル',
      aliases: ['l', 'liter', 'litre', 'リットル'],
      displayFormat: '{value}L'
    },
    toUnit: {
      primarySymbol: 'gal',
      name: 'ガロン（米国）',
      aliases: ['gallon', 'US gallon', 'ガロン'],
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
    name: 'ミリリットルからオンス（液量）',
    description: 'ミリリットルを液量オンスに変換します',
    category: 'volume',
    fromUnit: {
      primarySymbol: 'mL',
      name: 'ミリリットル',
      aliases: ['ml', 'milliliter', 'millilitre', 'ミリリットル'],
      displayFormat: '{value}mL'
    },
    toUnit: {
      primarySymbol: 'fl oz',
      name: 'オンス（液量）',
      aliases: ['fluid ounce', 'fl. oz.', '液量オンス'],
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
    name: '立方メートルから立方フィート',
    description: '立方メートルを立方フィートに変換します',
    category: 'volume',
    fromUnit: {
      primarySymbol: 'm³',
      name: '立方メートル',
      aliases: ['m3', 'cubic meter', '立方メートル'],
      displayFormat: '{value}m³'
    },
    toUnit: {
      primarySymbol: 'ft³',
      name: '立方フィート',
      aliases: ['ft3', 'cubic feet', '立方フィート'],
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
    name: '時速キロからマイル毎時',
    description: '時速キロメートルをマイル毎時に変換します',
    category: 'speed',
    fromUnit: {
      primarySymbol: 'km/h',
      name: '時速キロメートル',
      aliases: ['kph', 'キロメートル毎時'],
      displayFormat: '{value}km/h'
    },
    toUnit: {
      primarySymbol: 'mph',
      name: 'マイル毎時',
      aliases: ['miles per hour', 'マイル毎時'],
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
    name: 'メートル毎秒から時速キロ',
    description: 'メートル毎秒を時速キロメートルに変換します',
    category: 'speed',
    fromUnit: {
      primarySymbol: 'm/s',
      name: 'メートル毎秒',
      aliases: ['meters per second', 'メートル毎秒'],
      displayFormat: '{value}m/s'
    },
    toUnit: {
      primarySymbol: 'km/h',
      name: '時速キロメートル',
      aliases: ['kph', 'キロメートル毎時'],
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
    name: 'ノットから時速キロ',
    description: 'ノット（海里毎時）を時速キロメートルに変換します',
    category: 'speed',
    fromUnit: {
      primarySymbol: 'kn',
      name: 'ノット',
      aliases: ['knot', 'knots', 'ノット'],
      displayFormat: '{value}kn'
    },
    toUnit: {
      primarySymbol: 'km/h',
      name: '時速キロメートル',
      aliases: ['kph', 'キロメートル毎時'],
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
    name: '平方メートルから平方フィート',
    description: '平方メートルを平方フィートに変換します',
    category: 'area',
    fromUnit: {
      primarySymbol: 'm²',
      name: '平方メートル',
      aliases: ['m2', 'square meter', '平方メートル'],
      displayFormat: '{value}m²'
    },
    toUnit: {
      primarySymbol: 'ft²',
      name: '平方フィート',
      aliases: ['ft2', 'square feet', '平方フィート'],
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
    name: 'ヘクタールからエーカー',
    description: 'ヘクタールをエーカーに変換します',
    category: 'area',
    fromUnit: {
      primarySymbol: 'ha',
      name: 'ヘクタール',
      aliases: ['hectare', 'ヘクタール'],
      displayFormat: '{value}ha'
    },
    toUnit: {
      primarySymbol: 'ac',
      name: 'エーカー',
      aliases: ['acre', 'acres', 'エーカー'],
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
    name: '平方キロから平方マイル',
    description: '平方キロメートルを平方マイルに変換します',
    category: 'area',
    fromUnit: {
      primarySymbol: 'km²',
      name: '平方キロメートル',
      aliases: ['km2', 'square kilometer', '平方キロ'],
      displayFormat: '{value}km²'
    },
    toUnit: {
      primarySymbol: 'mi²',
      name: '平方マイル',
      aliases: ['mi2', 'square mile', '平方マイル'],
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
    name: 'ジュールからカロリー',
    description: 'ジュールをカロリーに変換します',
    category: 'energy',
    fromUnit: {
      primarySymbol: 'J',
      name: 'ジュール',
      aliases: ['joule', 'ジュール'],
      displayFormat: '{value}J'
    },
    toUnit: {
      primarySymbol: 'cal',
      name: 'カロリー',
      aliases: ['calorie', 'カロリー'],
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
    name: 'キロワット時からキロジュール',
    description: 'キロワット時をキロジュールに変換します',
    category: 'energy',
    fromUnit: {
      primarySymbol: 'kWh',
      name: 'キロワット時',
      aliases: ['kilowatt hour', 'キロワット時'],
      displayFormat: '{value}kWh'
    },
    toUnit: {
      primarySymbol: 'kJ',
      name: 'キロジュール',
      aliases: ['kilojoule', 'キロジュール'],
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
    name: 'BTUからジュール',
    description: 'BTU（英国熱量単位）をジュールに変換します',
    category: 'energy',
    fromUnit: {
      primarySymbol: 'BTU',
      name: 'BTU',
      aliases: ['British thermal unit', '英国熱量単位'],
      displayFormat: '{value}BTU'
    },
    toUnit: {
      primarySymbol: 'J',
      name: 'ジュール',
      aliases: ['joule', 'ジュール'],
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
    name: 'ワットから馬力',
    description: 'ワットを馬力に変換します',
    category: 'power',
    fromUnit: {
      primarySymbol: 'W',
      name: 'ワット',
      aliases: ['watt', 'ワット'],
      displayFormat: '{value}W'
    },
    toUnit: {
      primarySymbol: 'hp',
      name: '馬力',
      aliases: ['horsepower', '馬力'],
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
    name: 'キロワットから馬力',
    description: 'キロワットを馬力に変換します',
    category: 'power',
    fromUnit: {
      primarySymbol: 'kW',
      name: 'キロワット',
      aliases: ['kilowatt', 'キロワット'],
      displayFormat: '{value}kW'
    },
    toUnit: {
      primarySymbol: 'hp',
      name: '馬力',
      aliases: ['horsepower', '馬力'],
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
    name: '時間から分',
    description: '時間を分に変換します',
    category: 'time',
    fromUnit: {
      primarySymbol: 'h',
      name: '時間',
      aliases: ['hour', 'hours', '時間'],
      displayFormat: '{value}h'
    },
    toUnit: {
      primarySymbol: 'min',
      name: '分',
      aliases: ['minute', 'minutes', '分'],
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
    name: '日から時間',
    description: '日を時間に変換します',
    category: 'time',
    fromUnit: {
      primarySymbol: 'd',
      name: '日',
      aliases: ['day', 'days', '日'],
      displayFormat: '{value}d'
    },
    toUnit: {
      primarySymbol: 'h',
      name: '時間',
      aliases: ['hour', 'hours', '時間'],
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
    name: '週から日',
    description: '週を日に変換します',
    category: 'time',
    fromUnit: {
      primarySymbol: 'week',
      name: '週',
      aliases: ['w', 'weeks', '週'],
      displayFormat: '{value}週'
    },
    toUnit: {
      primarySymbol: 'd',
      name: '日',
      aliases: ['day', 'days', '日'],
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
    name: 'ヘルツからキロヘルツ',
    description: 'ヘルツをキロヘルツに変換します',
    category: 'frequency',
    fromUnit: {
      primarySymbol: 'Hz',
      name: 'ヘルツ',
      aliases: ['hertz', 'ヘルツ'],
      displayFormat: '{value}Hz'
    },
    toUnit: {
      primarySymbol: 'kHz',
      name: 'キロヘルツ',
      aliases: ['kilohertz', 'キロヘルツ'],
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
    name: 'メガヘルツからギガヘルツ',
    description: 'メガヘルツをギガヘルツに変換します',
    category: 'frequency',
    fromUnit: {
      primarySymbol: 'MHz',
      name: 'メガヘルツ',
      aliases: ['megahertz', 'メガヘルツ'],
      displayFormat: '{value}MHz'
    },
    toUnit: {
      primarySymbol: 'GHz',
      name: 'ギガヘルツ',
      aliases: ['gigahertz', 'ギガヘルツ'],
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
    name: 'RPMからヘルツ',
    description: '毎分回転数をヘルツに変換します',
    category: 'frequency',
    fromUnit: {
      primarySymbol: 'rpm',
      name: '毎分回転数',
      aliases: ['RPM', 'revolutions per minute', '回転毎分'],
      displayFormat: '{value}rpm'
    },
    toUnit: {
      primarySymbol: 'Hz',
      name: 'ヘルツ',
      aliases: ['hertz', 'ヘルツ'],
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