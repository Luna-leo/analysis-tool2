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
  _yDomain: [number, number],
  _yScale: (value: number) => number,
  height: number
): number {
  // Always place X-axis at the bottom of the chart
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