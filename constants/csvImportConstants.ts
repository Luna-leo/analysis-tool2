/**
 * Constants for CSV Import functionality
 */

export const CSV_IMPORT_CONFIG = {
  // File processing
  BATCH_SIZE: 1000,
  MAX_WARNINGS: 100,
  
  // File validation
  SUPPORTED_EXTENSIONS: ['.csv', '.CSV'] as const,
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  
  // UI
  UI_UPDATE_DELAY: 100, // ms
  
  // Merge detection patterns
  MERGE_PATTERNS: {
    HORIZONTAL_SPLIT: /\s*[-－]\s*横\d+\s*$/,
    NUMBERED_SPLIT: /\s*[-－]\s*\d+\s*$/,
    COPY_PATTERN: /\s*[-－]\s*コピー.*$/,
  },
  
  // Standard fields that should not be treated as data columns
  STANDARD_FIELDS: ['plant', 'machineNo', 'sourceType', 'rowNumber', 'timestamp'] as const,
} as const

export const CSV_ERROR_MESSAGES = {
  PARSE_FAILED: 'CSV解析に失敗しました',
  NO_DATE_RANGE: 'CSVファイルから日付範囲を抽出できませんでした',
  MISSING_COLUMNS: (fileName: string, columns: string[]) => 
    `ファイル ${fileName} の必須カラムが不足しています: ${columns.join(', ')}`,
  IMPORT_FAILED: 'CSVインポートに失敗しました',
  NO_DATA: 'インポートするデータがありません',
} as const

export const CSV_SUCCESS_MESSAGES = {
  IMPORT_COMPLETE: (fileCount: number, warningCount: number) => {
    const warningMessage = warningCount > 0 ? ` (${warningCount} warning(s) encountered)` : ''
    return `Successfully imported ${fileCount} files${warningMessage} and added to period pool`
  },
} as const