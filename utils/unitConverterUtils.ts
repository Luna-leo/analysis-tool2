import { UnitConverterFormula, UnitConverterValidationResult, ConversionTestResult } from '@/types/unit-converter';

// 変換式の検証
export const validateFormula = (formula: string, parameters: string[]): { isValid: boolean; error?: string } => {
  try {
    // パラメータのチェック
    if (parameters.length === 0) {
      return { isValid: false, error: 'パラメータが定義されていません' };
    }

    // 危険な文字列のチェック
    const dangerousPatterns = [
      /import/i,
      /require/i,
      /eval/i,
      /function/i,
      /=>/i,
      /class/i,
      /while/i,
      /for/i,
      /do/i,
      /if/i,
      /else/i,
      /switch/i,
      /case/i,
      /return(?!\s*\()/i, // return文（式の中のreturnは除く）
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(formula)) {
        return { isValid: false, error: '使用できない構文が含まれています' };
      }
    }

    // 数式として評価可能かチェック
    const args = parameters.join(', ');
    const func = new Function(args, `return ${formula}`);
    
    // テスト実行
    const testValues = parameters.map(() => 1);
    const result = func(...testValues);
    
    if (typeof result !== 'number' || isNaN(result)) {
      return { isValid: false, error: '数式の結果が数値ではありません' };
    }

    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: error instanceof Error ? error.message : '無効な数式です' };
  }
};

// 変換の実行
export const executeConversion = (
  formula: string, 
  parameters: string[], 
  values: Record<string, number>
): number | null => {
  try {
    const args = parameters.join(', ');
    const func = new Function(args, `return ${formula}`);
    const paramValues = parameters.map(param => values[param] || 0);
    const result = func(...paramValues);
    
    return typeof result === 'number' && !isNaN(result) ? result : null;
  } catch {
    return null;
  }
};

// 変換式の完全な検証
export const validateUnitConverterFormula = (
  formula: UnitConverterFormula,
  existingFormulas: UnitConverterFormula[],
  excludeId?: string
): UnitConverterValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const aliasConflicts: any[] = [];

  // 基本情報の検証
  if (!formula.name.trim()) {
    errors.push('変換式名を入力してください');
  }

  if (!formula.fromUnit.primarySymbol.trim()) {
    errors.push('変換元の単位記号を入力してください');
  }

  if (!formula.fromUnit.name.trim()) {
    errors.push('変換元の単位名を入力してください');
  }

  if (!formula.toUnit.primarySymbol.trim()) {
    errors.push('変換先の単位記号を入力してください');
  }

  if (!formula.toUnit.name.trim()) {
    errors.push('変換先の単位名を入力してください');
  }

  if (!formula.formula.trim()) {
    errors.push('変換式を入力してください');
  }

  // 変換式の検証
  if (formula.formula) {
    const formulaValidation = validateFormula(formula.formula, formula.parameters);
    if (!formulaValidation.isValid) {
      errors.push(`変換式エラー: ${formulaValidation.error}`);
    }
  }

  // 逆変換式の検証（双方向の場合）
  if (formula.isBidirectional && formula.reverseFormula) {
    const reverseValidation = validateFormula(formula.reverseFormula, formula.parameters);
    if (!reverseValidation.isValid) {
      errors.push(`逆変換式エラー: ${reverseValidation.error}`);
    }
  } else if (formula.isBidirectional && !formula.reverseFormula) {
    errors.push('双方向変換が有効な場合は逆変換式を入力してください');
  }

  // エイリアスの重複チェック
  const allAliases = new Set<string>();
  
  // 自身のエイリアスの重複チェック
  const checkDuplicates = (aliases: string[], unitName: string) => {
    aliases.forEach(alias => {
      const lower = alias.toLowerCase();
      if (allAliases.has(lower)) {
        warnings.push(`${unitName}のエイリアス「${alias}」が重複しています`);
      }
      allAliases.add(lower);
    });
  };

  checkDuplicates(
    [formula.fromUnit.primarySymbol, ...formula.fromUnit.aliases],
    '変換元単位'
  );
  checkDuplicates(
    [formula.toUnit.primarySymbol, ...formula.toUnit.aliases],
    '変換先単位'
  );

  // 他の変換式とのエイリアス競合チェック
  existingFormulas.forEach(existing => {
    if (existing.id === excludeId) return;

    const checkConflicts = (unit: 'from' | 'to', aliases: string[]) => {
      aliases.forEach(alias => {
        const existingAliases = [
          ...existing.fromUnit.aliases.map(a => a.toLowerCase()),
          existing.fromUnit.primarySymbol.toLowerCase(),
          ...existing.toUnit.aliases.map(a => a.toLowerCase()),
          existing.toUnit.primarySymbol.toLowerCase()
        ];

        if (existingAliases.includes(alias.toLowerCase())) {
          aliasConflicts.push({
            alias,
            conflictingFormulaId: existing.id,
            conflictingFormulaName: existing.name,
            unit
          });
        }
      });
    };

    checkConflicts('from', [formula.fromUnit.primarySymbol, ...formula.fromUnit.aliases]);
    checkConflicts('to', [formula.toUnit.primarySymbol, ...formula.toUnit.aliases]);
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    aliasConflicts
  };
};

// 変換テストの実行
export const testConversion = (
  formula: UnitConverterFormula,
  testValue: number
): ConversionTestResult => {
  try {
    const result = executeConversion(
      formula.formula,
      formula.parameters,
      { [formula.parameters[0]]: testValue }
    );

    if (result === null) {
      return {
        input: testValue,
        output: 0,
        formattedInput: `${testValue}${formula.fromUnit.primarySymbol}`,
        formattedOutput: 'エラー',
        error: '変換に失敗しました'
      };
    }

    const formattedInput = formula.fromUnit.displayFormat
      ? formula.fromUnit.displayFormat.replace('{value}', testValue.toString())
      : `${testValue}${formula.fromUnit.primarySymbol}`;

    const formattedOutput = formula.toUnit.displayFormat
      ? formula.toUnit.displayFormat.replace('{value}', result.toFixed(2))
      : `${result.toFixed(2)}${formula.toUnit.primarySymbol}`;

    return {
      input: testValue,
      output: result,
      formattedInput,
      formattedOutput
    };
  } catch (error) {
    return {
      input: testValue,
      output: 0,
      formattedInput: `${testValue}${formula.fromUnit.primarySymbol}`,
      formattedOutput: 'エラー',
      error: error instanceof Error ? error.message : '変換エラー'
    };
  }
};

// 単位のフォーマット
export const formatUnitValue = (
  value: number,
  unit: { primarySymbol: string; displayFormat?: string }
): string => {
  if (unit.displayFormat) {
    return unit.displayFormat.replace('{value}', value.toString());
  }
  return `${value}${unit.primarySymbol}`;
};

// よく使われる単位のサジェスト
export const COMMON_UNIT_SUGGESTIONS: Record<string, { symbol: string; name: string; aliases: string[] }[]> = {
  temperature: [
    { symbol: '°C', name: 'Celsius', aliases: ['℃', 'degC', 'C', 'celsius', '摂氏'] },
    { symbol: '°F', name: 'Fahrenheit', aliases: ['℉', 'degF', 'F', 'fahrenheit', '華氏'] },
    { symbol: 'K', name: 'Kelvin', aliases: ['kelvin', 'ケルビン'] },
  ],
  pressure: [
    { symbol: 'Pa', name: 'Pascal', aliases: ['pa', 'pascal', 'パスカル'] },
    { symbol: 'bar', name: 'Bar', aliases: ['バール'] },
    { symbol: 'psi', name: 'PSI', aliases: ['lbf/in²'] },
    { symbol: 'atm', name: 'Atmosphere', aliases: ['atmosphere', '気圧'] },
  ],
  length: [
    { symbol: 'm', name: 'Meter', aliases: ['meter', 'メートル'] },
    { symbol: 'ft', name: 'Feet', aliases: ['feet', 'フィート'] },
    { symbol: 'in', name: 'Inch', aliases: ['inch', 'インチ'] },
    { symbol: 'cm', name: 'Centimeter', aliases: ['centimeter', 'センチメートル'] },
  ],
  weight: [
    { symbol: 'kg', name: 'Kilogram', aliases: ['kilogram', 'キログラム'] },
    { symbol: 'lb', name: 'Pound', aliases: ['lbs', 'pound', 'ポンド'] },
    { symbol: 'g', name: 'Gram', aliases: ['gram', 'グラム'] },
    { symbol: 't', name: 'Ton', aliases: ['ton', 'トン'] },
  ],
  volume: [
    { symbol: 'L', name: 'Liter', aliases: ['l', 'liter', 'リットル'] },
    { symbol: 'gal', name: 'Gallon', aliases: ['gallon', 'ガロン'] },
    { symbol: 'm³', name: 'Cubic Meter', aliases: ['m3', '立方メートル'] },
    { symbol: 'mL', name: 'Milliliter', aliases: ['ml', 'milliliter', 'ミリリットル'] },
  ],
  speed: [
    { symbol: 'm/s', name: 'Meter per Second', aliases: ['メートル毎秒'] },
    { symbol: 'km/h', name: 'Kilometer per Hour', aliases: ['kph', 'キロメートル毎時'] },
    { symbol: 'mph', name: 'Miles per Hour', aliases: ['マイル毎時'] },
    { symbol: 'knot', name: 'Knot', aliases: ['kt', 'ノット'] },
  ]
};