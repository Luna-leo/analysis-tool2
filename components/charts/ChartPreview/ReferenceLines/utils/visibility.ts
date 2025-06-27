import { REFERENCE_LINE_VISIBILITY_THRESHOLD } from "@/constants/referenceLine"

/**
 * Checks if a reference line is visible within the plot area
 * @param position - The position of the line (x for vertical, y for horizontal)
 * @param dimension - The dimension to check against (width for vertical, height for horizontal)
 * @returns boolean indicating if the line is visible
 */
export function isLineVisible(position: number, dimension: number): boolean {
  return position >= -REFERENCE_LINE_VISIBILITY_THRESHOLD && 
         position <= dimension + REFERENCE_LINE_VISIBILITY_THRESHOLD
}

/**
 * Validates if a scale is properly initialized and ready to use
 * @param scale - The D3 scale to validate
 * @returns boolean indicating if the scale is valid
 */
export function isScaleValid(scale: any): boolean {
  if (!scale || typeof scale !== 'function') {
    return false
  }
  
  try {
    const domain = scale.domain()
    const range = scale.range()
    return domain && range && domain.length === 2 && range.length === 2
  } catch (e) {
    return false
  }
}