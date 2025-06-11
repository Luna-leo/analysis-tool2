/**
 * Common CSV parsing utilities
 */

/**
 * Parse a CSV line handling quoted values properly
 * Supports escaped quotes ("") within quoted fields
 */
export function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"'
        i++
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  // Add the last field
  result.push(current.trim())
  return result
}

/**
 * Remove BOM (Byte Order Mark) from text if present
 */
export function removeBOM(text: string): string {
  return text.charAt(0) === '\uFEFF' ? text.slice(1) : text
}

/**
 * Validate CSV file
 */
export function isValidCSVFile(file: File): boolean {
  const fileName = file.name.toLowerCase()
  return fileName.endsWith('.csv')
}

/**
 * Validate CSV files array
 */
export function validateCSVFiles(files: File[]): File[] {
  return files.filter(isValidCSVFile)
}

/**
 * Convert wildcard pattern to regex
 */
export function wildcardToRegex(pattern: string): RegExp {
  const escapedPattern = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape special regex chars except * and ?
    .replace(/\*/g, '.*') // * matches any characters
    .replace(/\?/g, '.') // ? matches single character
  return new RegExp(`^${escapedPattern}$`, 'i')
}

/**
 * Filter file paths by pattern
 */
export function filterFilesByPattern(
  paths: string[], 
  pattern: string, 
  patternType: 'wildcard' | 'regex' = 'wildcard'
): string[] {
  if (!pattern) return paths

  try {
    const regex = patternType === 'regex' 
      ? new RegExp(pattern, 'i')
      : wildcardToRegex(pattern)

    return paths.filter(path => {
      const fileName = path.split('/').pop() || path.split('\\').pop() || ''
      return regex.test(fileName)
    })
  } catch (error) {
    // Invalid regex pattern - return all paths
    return paths
  }
}