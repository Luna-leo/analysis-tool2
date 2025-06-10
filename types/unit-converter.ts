export interface UnitDefinition {
  primarySymbol: string;      // 主要な単位記号（例：°C）
  name: string;               // 正式名称（例：Celsius）
  aliases: string[];          // エイリアス（例：['℃', 'degC', 'C', 'celsius', '摂氏']）
  displayFormat?: string;     // 表示フォーマット（例：'{value}°C'）
}

export interface UnitConverterFormula {
  id: string;
  name: string;
  description: string;
  category: UnitCategory;
  fromUnit: UnitDefinition;
  toUnit: UnitDefinition;
  formula: string;              // 変換式（例：'x * 9/5 + 32'）
  parameters: string[];         // 使用する変数名（例：['x']）
  isBidirectional: boolean;     // 双方向変換可能か
  reverseFormula?: string;      // 逆変換式（双方向の場合）
  isFavorite?: boolean;
  usageCount?: number;
  createdAt: number;
  updatedAt: number;
}

export type UnitCategory = 
  | 'temperature'    // 温度
  | 'pressure'       // 圧力
  | 'length'         // 長さ
  | 'weight'         // 重量
  | 'volume'         // 体積
  | 'speed'          // 速度
  | 'area'           // 面積
  | 'energy'         // エネルギー
  | 'power'          // 電力
  | 'time'           // 時間
  | 'frequency'      // 周波数
  | 'other';         // その他

export const UNIT_CATEGORIES: Record<UnitCategory, string> = {
  temperature: '温度',
  pressure: '圧力',
  length: '長さ',
  weight: '重量',
  volume: '体積',
  speed: '速度',
  area: '面積',
  energy: 'エネルギー',
  power: '電力',
  time: '時間',
  frequency: '周波数',
  other: 'その他'
};

// 単位変換式のデフォルト値
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

// エイリアスの競合チェック結果
export interface AliasConflict {
  alias: string;
  conflictingFormulaId: string;
  conflictingFormulaName: string;
  unit: 'from' | 'to';
}

// 検証結果
export interface UnitConverterValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  aliasConflicts: AliasConflict[];
}

// 変換テスト結果
export interface ConversionTestResult {
  input: number;
  output: number;
  formattedInput: string;
  formattedOutput: string;
  error?: string;
}