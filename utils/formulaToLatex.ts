/**
 * Convert formula expressions to LaTeX format
 */

interface ParseNode {
  type: 'number' | 'variable' | 'operator' | 'function' | 'group'
  value: string
  children?: ParseNode[]
}

/**
 * Convert a formula expression to LaTeX notation
 */
export function convertToLatex(expression: string): string {
  try {
    // Pre-process: handle common patterns
    let latex = expression
    
    // Replace common functions with LaTeX equivalents
    latex = latex.replace(/sqrt\s*\(/g, '\\sqrt{')
    latex = latex.replace(/log\s*\(/g, '\\log(')
    latex = latex.replace(/ln\s*\(/g, '\\ln(')
    latex = latex.replace(/sin\s*\(/g, '\\sin(')
    latex = latex.replace(/cos\s*\(/g, '\\cos(')
    latex = latex.replace(/tan\s*\(/g, '\\tan(')
    latex = latex.replace(/exp\s*\(/g, '\\exp(')
    latex = latex.replace(/abs\s*\(/g, '|')
    
    // Handle fractions (simple case: A/B)
    latex = latex.replace(/([A-Za-z0-9_]+)\s*\/\s*([A-Za-z0-9_]+)/g, '\\frac{$1}{$2}')
    
    // Handle more complex fractions with parentheses
    latex = latex.replace(/\(([^)]+)\)\s*\/\s*\(([^)]+)\)/g, '\\frac{$1}{$2}')
    latex = latex.replace(/\(([^)]+)\)\s*\/\s*([A-Za-z0-9_]+)/g, '\\frac{$1}{$2}')
    latex = latex.replace(/([A-Za-z0-9_]+)\s*\/\s*\(([^)]+)\)/g, '\\frac{$1}{$2}')
    
    // Handle exponents
    latex = latex.replace(/([A-Za-z0-9_]+)\s*\^\s*([A-Za-z0-9_]+)/g, '$1^{$2}')
    latex = latex.replace(/([A-Za-z0-9_]+)\s*\^\s*\(([^)]+)\)/g, '$1^{$2}')
    
    // Replace operators with LaTeX equivalents
    latex = latex.replace(/\*/g, ' \\cdot ')
    latex = latex.replace(/>=/g, ' \\geq ')
    latex = latex.replace(/<=/g, ' \\leq ')
    latex = latex.replace(/!=/g, ' \\neq ')
    latex = latex.replace(/==/g, ' = ')
    latex = latex.replace(/([^<>])=([^=])/g, '$1 = $2')
    
    // Handle Greek letters in variable names
    latex = latex.replace(/\bDELTA_/g, '\\Delta ')
    latex = latex.replace(/\bTHETA_/g, '\\theta ')
    latex = latex.replace(/\bPI\b/g, '\\pi')
    latex = latex.replace(/\bALPHA_/g, '\\alpha ')
    latex = latex.replace(/\bBETA_/g, '\\beta ')
    latex = latex.replace(/\bGAMMA_/g, '\\gamma ')
    
    // Handle subscripts in variable names (e.g., TEMP_IN -> TEMP_{IN})
    latex = latex.replace(/([A-Z]+)_([A-Z0-9]+)/g, (match, base, subscript) => {
      // Skip if it's a Greek letter pattern we already handled
      if (base === 'DELTA' || base === 'THETA' || base === 'ALPHA' || base === 'BETA' || base === 'GAMMA') {
        return match
      }
      return `${base}_{${subscript}}`
    })
    
    // Close sqrt braces
    let braceCount = 0
    let result = ''
    let inSqrt = false
    
    for (let i = 0; i < latex.length; i++) {
      const char = latex[i]
      
      if (latex.substring(i).startsWith('\\sqrt{')) {
        inSqrt = true
        braceCount = 0
        result += '\\sqrt{'
        i += 5 // Skip past \sqrt{
      } else if (inSqrt) {
        if (char === '{') {
          braceCount++
          result += char
        } else if (char === '}') {
          if (braceCount === 0) {
            inSqrt = false
          } else {
            braceCount--
          }
          result += char
        } else if (char === ')' && braceCount === 0) {
          result += '}'
          inSqrt = false
        } else {
          result += char
        }
      } else {
        result += char
      }
    }
    
    // Handle abs function closing
    result = result.replace(/\|([^|)]+)\)/g, '|$1|')
    
    // Clean up extra spaces
    result = result.replace(/\s+/g, ' ').trim()
    
    return result
  } catch (error) {
    // If conversion fails, return the original expression
    console.error('LaTeX conversion error:', error)
    return expression
  }
}

/**
 * Check if LaTeX rendering is appropriate for the expression
 */
export function shouldUseLatex(expression: string): boolean {
  // Use LaTeX for expressions containing:
  // - Fractions (/)
  // - Exponents (^)
  // - Square roots (sqrt)
  // - Mathematical functions (sin, cos, log, etc.)
  // - Greek letters
  const latexPatterns = [
    /\//,           // Division (will be converted to fraction)
    /\^/,           // Exponent
    /sqrt/i,        // Square root
    /\b(sin|cos|tan|log|ln|exp)\b/i,  // Math functions
    /\b(DELTA|THETA|ALPHA|BETA|GAMMA|PI)\b/i,  // Greek letters
  ]
  
  return latexPatterns.some(pattern => pattern.test(expression))
}