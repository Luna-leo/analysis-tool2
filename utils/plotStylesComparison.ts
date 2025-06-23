/**
 * Efficient comparison for plotStyles objects
 * Compares only the properties that affect rendering
 */
export function arePlotStylesEqual(
  prev: any | undefined,
  next: any | undefined
): boolean {
  // If both are undefined or null, they're equal
  if (!prev && !next) return true
  
  // If one is undefined/null and the other isn't, they're not equal
  if (!prev || !next) return false
  
  // If references are the same, they're equal
  if (prev === next) return true
  
  // Compare mode
  if (prev.mode !== next.mode) return false
  
  // Compare the relevant style object based on mode
  const mode = prev.mode || 'datasource'
  
  if (mode === 'datasource') {
    return compareStyleObjects(prev.byDataSource, next.byDataSource)
  } else if (mode === 'parameter') {
    return compareStyleObjects(prev.byParameter, next.byParameter)
  } else {
    return compareStyleObjects(prev.byBoth, next.byBoth)
  }
}

function compareStyleObjects(prev: any, next: any): boolean {
  if (!prev && !next) return true
  if (!prev || !next) return false
  
  const prevKeys = Object.keys(prev)
  const nextKeys = Object.keys(next)
  
  // Different number of keys means not equal
  if (prevKeys.length !== nextKeys.length) return false
  
  // Check each style entry
  for (const key of prevKeys) {
    if (!nextKeys.includes(key)) return false
    
    const prevStyle = prev[key]
    const nextStyle = next[key]
    
    // Compare visibility (most important for this fix)
    if (prevStyle?.visible !== nextStyle?.visible) return false
    
    // Compare legend text
    if (prevStyle?.legendText !== nextStyle?.legendText) return false
    
    // Compare marker settings
    if (!compareMarkerSettings(prevStyle?.marker, nextStyle?.marker)) return false
    
    // Compare line settings
    if (!compareLineSettings(prevStyle?.line, nextStyle?.line)) return false
  }
  
  return true
}

function compareMarkerSettings(prev: any, next: any): boolean {
  if (!prev && !next) return true
  if (!prev || !next) return false
  
  return prev.type === next.type &&
    prev.size === next.size &&
    prev.borderColor === next.borderColor &&
    prev.fillColor === next.fillColor
}

function compareLineSettings(prev: any, next: any): boolean {
  if (!prev && !next) return true
  if (!prev || !next) return false
  
  return prev.style === next.style &&
    prev.width === next.width &&
    prev.color === next.color
}