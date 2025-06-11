/**
 * Utility functions for chart axis positioning
 */

/**
 * Calculate the Y position for the X-axis based on the Y-axis domain
 * @param yDomain - The [min, max] domain of the Y-axis
 * @param yScale - The D3 scale function for the Y-axis
 * @param height - The height of the chart area
 * @returns The Y position for the X-axis
 */
export function calculateXAxisPosition(
  yDomain: [number, number],
  yScale: (value: number) => number,
  height: number
): number {
  const [yMin, yMax] = yDomain
  
  // If domain includes 0, place X-axis at y=0
  if (yMin <= 0 && yMax >= 0) {
    return yScale(0)
  }
  
  // Otherwise, place at bottom
  return height
}

/**
 * Determine if the X-axis should show at zero position
 * @param yDomain - The [min, max] domain of the Y-axis
 * @returns true if X-axis should be at y=0
 */
export function shouldXAxisBeAtZero(yDomain: [number, number]): boolean {
  const [yMin, yMax] = yDomain
  return yMin <= 0 && yMax >= 0
}