/**
 * Utility functions for displaying formulas in a more mathematical way
 */

export interface FormulaToken {
  type: 'operator' | 'number' | 'variable' | 'function' | 'parenthesis' | 'unknown'
  value: string
  className: string
}

/**
 * Tokenize formula expression for syntax highlighting
 */
export function tokenizeFormula(expression: string): FormulaToken[] {
  const tokens: FormulaToken[] = []
  
  // Regular expressions for different token types
  const patterns = [
    { regex: /^(\+|-|\*|\/|\^|>=|<=|>|<|==|!=|=)/, type: 'operator' as const, className: 'text-blue-600 font-semibold mx-0.5' },
    { regex: /^(\d+\.?\d*|\.\d+)/, type: 'number' as const, className: 'text-green-600 font-medium' },
    { regex: /^(sqrt|sin|cos|tan|log|ln|abs|exp|max|min|avg|sum)\b/i, type: 'function' as const, className: 'text-orange-600 font-medium' },
    { regex: /^([A-Z_][A-Z0-9_]*)/i, type: 'variable' as const, className: 'text-purple-600' },
    { regex: /^(\(|\))/, type: 'parenthesis' as const, className: 'text-gray-700 font-bold' },
    { regex: /^\s+/, type: 'unknown' as const, className: '' }, // whitespace
  ]
  
  let remaining = expression
  
  while (remaining.length > 0) {
    let matched = false
    
    for (const { regex, type, className } of patterns) {
      const match = remaining.match(regex)
      if (match) {
        tokens.push({
          type,
          value: match[0],
          className
        })
        remaining = remaining.slice(match[0].length)
        matched = true
        break
      }
    }
    
    if (!matched) {
      // Unknown character
      tokens.push({
        type: 'unknown',
        value: remaining[0],
        className: 'text-gray-500'
      })
      remaining = remaining.slice(1)
    }
  }
  
  return tokens
}

/**
 * Convert programming operators to mathematical symbols
 */
export function convertToMathSymbols(expression: string): string {
  return expression
    .replace(/\*/g, ' × ')
    .replace(/\//g, ' ÷ ')
    .replace(/>=/g, ' ≥ ')
    .replace(/<=/g, ' ≤ ')
    .replace(/!=/g, ' ≠ ')
    .replace(/==/g, ' = ')
}

/**
 * Format formula with proper spacing
 */
export function formatFormula(expression: string): string {
  // Add spaces around operators
  return expression
    .replace(/([+\-*/^=<>!]+)/g, ' $1 ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Get a preview-friendly version of the formula
 */
export function getFormulaPreview(expression: string, maxLength: number = 50): {
  preview: string
  isTruncated: boolean
} {
  const formatted = formatFormula(expression)
  const isTruncated = formatted.length > maxLength
  const preview = isTruncated 
    ? formatted.substring(0, maxLength - 3) + '...'
    : formatted
    
  return { preview, isTruncated }
}