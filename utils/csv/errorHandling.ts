export interface CSVParseError {
  type: 'validation' | 'parsing' | 'encoding' | 'format' | 'data'
  message: string
  fileName?: string
  line?: number
  column?: string
  value?: string | number
  details?: any
}

export interface CSVImportErrorReport {
  totalErrors: number
  errors: CSVParseError[]
  warnings: CSVParseError[]
  summary: {
    byType: Record<string, number>
    byFile: Record<string, number>
  }
}

export class CSVErrorCollector {
  private errors: CSVParseError[] = []
  private warnings: CSVParseError[] = []
  private currentFile?: string
  
  setCurrentFile(fileName: string) {
    this.currentFile = fileName
  }
  
  addError(error: Omit<CSVParseError, 'fileName'> & { fileName?: string }) {
    this.errors.push({
      ...error,
      fileName: error.fileName || this.currentFile
    })
  }
  
  addWarning(warning: Omit<CSVParseError, 'fileName'> & { fileName?: string }) {
    this.warnings.push({
      ...warning,
      fileName: warning.fileName || this.currentFile
    })
  }
  
  addValidationError(message: string, details?: { line?: number; column?: string; value?: any }) {
    this.addError({
      type: 'validation',
      message,
      ...details
    })
  }
  
  addParsingError(message: string, line?: number, details?: any) {
    this.addError({
      type: 'parsing',
      message,
      line,
      details
    })
  }
  
  addEncodingError(message: string, details?: any) {
    this.addError({
      type: 'encoding',
      message,
      details
    })
  }
  
  addFormatError(message: string, line?: number, column?: string) {
    this.addError({
      type: 'format',
      message,
      line,
      column
    })
  }
  
  addDataError(message: string, line?: number, column?: string, value?: any) {
    this.addError({
      type: 'data',
      message,
      line,
      column,
      value
    })
  }
  
  hasErrors(): boolean {
    return this.errors.length > 0
  }
  
  hasWarnings(): boolean {
    return this.warnings.length > 0
  }
  
  getReport(): CSVImportErrorReport {
    const byType: Record<string, number> = {}
    const byFile: Record<string, number> = {}
    
    // Count errors by type
    this.errors.forEach(error => {
      byType[error.type] = (byType[error.type] || 0) + 1
      if (error.fileName) {
        byFile[error.fileName] = (byFile[error.fileName] || 0) + 1
      }
    })
    
    return {
      totalErrors: this.errors.length,
      errors: this.errors,
      warnings: this.warnings,
      summary: {
        byType,
        byFile
      }
    }
  }
  
  getFormattedMessage(): string {
    if (this.errors.length === 0) {
      return 'No errors found'
    }
    
    const messages: string[] = [`Found ${this.errors.length} error(s):`]
    
    // Group errors by file
    const errorsByFile = new Map<string, CSVParseError[]>()
    this.errors.forEach(error => {
      const fileName = error.fileName || 'Unknown file'
      if (!errorsByFile.has(fileName)) {
        errorsByFile.set(fileName, [])
      }
      errorsByFile.get(fileName)!.push(error)
    })
    
    // Format errors by file
    errorsByFile.forEach((errors, fileName) => {
      messages.push(`\n${fileName}:`)
      errors.forEach((error, index) => {
        let errorMsg = `  ${index + 1}. ${error.message}`
        if (error.line !== undefined) {
          errorMsg += ` (Line ${error.line}`
          if (error.column) {
            errorMsg += `, Column ${error.column}`
          }
          errorMsg += ')'
        }
        messages.push(errorMsg)
      })
    })
    
    return messages.join('\n')
  }
  
  reset() {
    this.errors = []
    this.warnings = []
    this.currentFile = undefined
  }
}

// Helper functions for common validation
export function validateDateFormat(value: string, expectedFormat?: string): boolean {
  // Common date formats
  const formats = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
    /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
    /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/, // YYYY-MM-DD HH:MM:SS
    /^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}$/, // YYYY/MM/DD HH:MM:SS
  ]
  
  return formats.some(format => format.test(value))
}

export function validateNumericValue(value: string | number): boolean {
  if (typeof value === 'number') return !isNaN(value)
  if (typeof value !== 'string') return false
  
  const trimmed = value.trim()
  if (trimmed === '') return false
  
  // Check for valid number format (including scientific notation)
  return !isNaN(Number(trimmed))
}

export function createErrorSummary(errors: CSVParseError[]): string {
  if (errors.length === 0) return 'No errors'
  
  const summary = errors.slice(0, 3).map(error => {
    let msg = error.message
    if (error.fileName) {
      msg = `${error.fileName}: ${msg}`
    }
    return msg
  })
  
  if (errors.length > 3) {
    summary.push(`... and ${errors.length - 3} more error(s)`)
  }
  
  return summary.join('; ')
}