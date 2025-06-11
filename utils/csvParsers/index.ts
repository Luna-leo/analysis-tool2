export { parseSSACFormat, isSSACFormat } from './ssacParser'
export { parseStandardFormat } from './standardParser'

/**
 * Remove BOM (Byte Order Mark) from text if present
 */
export function removeBOM(text: string): string {
  return text.charAt(0) === '\uFEFF' ? text.slice(1) : text
}