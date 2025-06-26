import { InterlockThreshold } from "@/types"

export function getUniqueXValues(thresholds: InterlockThreshold[]): number[] {
  const xValues = new Set<number>()
  thresholds.forEach(threshold => {
    threshold.points.forEach(point => xValues.add(point.x))
  })
  return Array.from(xValues).sort((a, b) => a - b)
}

export function createValueMap(
  thresholds: InterlockThreshold[], 
  sortedXValues: number[]
): Map<number, Map<string, number>> {
  const valueMap = new Map<number, Map<string, number>>()
  sortedXValues.forEach(x => {
    valueMap.set(x, new Map())
  })

  thresholds.forEach(threshold => {
    threshold.points.forEach(point => {
      const xMap = valueMap.get(point.x)
      if (xMap) {
        xMap.set(threshold.id, point.y)
      }
    })
  })

  return valueMap
}

export function generateNewThreshold(
  thresholds: InterlockThreshold[], 
  sortedXValues: number[]
): InterlockThreshold {
  const newThresholdId = `threshold_${Date.now()}`
  const defaultColors = ["#FFA500", "#FF0000", "#0000FF", "#00FF00", "#800080"]
  const usedColors = thresholds.map(t => t.color)
  const newColor = defaultColors.find(color => !usedColors.includes(color)) 
    || "#" + Math.floor(Math.random()*16777215).toString(16)
  
  return {
    id: newThresholdId,
    name: `Threshold ${thresholds.length + 1}`,
    color: newColor,
    points: sortedXValues.map(x => ({ x, y: 0 }))
  }
}

export function updateThresholdPoint(
  threshold: InterlockThreshold,
  x: number,
  value: string
): InterlockThreshold {
  // If value is empty, remove the point
  if (value === '') {
    const newPoints = threshold.points.filter(point => point.x !== x)
    return { ...threshold, points: newPoints }
  }
  
  const numValue = parseFloat(value)
  if (isNaN(numValue)) return threshold
  
  const existingPointIndex = threshold.points.findIndex(p => p.x === x)
  
  if (existingPointIndex >= 0) {
    // Update existing point
    const newPoints = [...threshold.points]
    newPoints[existingPointIndex] = { x, y: numValue }
    return { ...threshold, points: newPoints }
  } else {
    // Add new point
    const newPoints = [...threshold.points, { x, y: numValue }]
    newPoints.sort((a, b) => a.x - b.x)
    return { ...threshold, points: newPoints }
  }
}