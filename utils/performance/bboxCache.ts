// Cache for getBBox results to avoid expensive recalculations
interface BBoxCacheEntry {
  text: string
  fontSize: string
  fontWeight: string
  fontFamily: string
  bbox: DOMRect
}

const bboxCache = new WeakMap<SVGTextElement, BBoxCacheEntry>()

// Helper function to get font properties from an element
function getFontProperties(element: SVGTextElement): { fontSize: string, fontWeight: string, fontFamily: string } {
  const computedStyle = window.getComputedStyle(element)
  return {
    fontSize: computedStyle.fontSize || element.style.fontSize || '12px',
    fontWeight: computedStyle.fontWeight || element.style.fontWeight || 'normal',
    fontFamily: computedStyle.fontFamily || element.style.fontFamily || 'sans-serif'
  }
}

export function getCachedBBox(element: SVGTextElement): DOMRect {
  const text = element.textContent || ''
  const fontProps = getFontProperties(element)
  const cached = bboxCache.get(element)
  
  // Return cached result if text and font properties haven't changed
  if (cached && 
      cached.text === text && 
      cached.fontSize === fontProps.fontSize &&
      cached.fontWeight === fontProps.fontWeight &&
      cached.fontFamily === fontProps.fontFamily) {
    return cached.bbox
  }
  
  // Calculate and cache new bbox
  const bbox = element.getBBox()
  bboxCache.set(element, { 
    text, 
    fontSize: fontProps.fontSize,
    fontWeight: fontProps.fontWeight,
    fontFamily: fontProps.fontFamily,
    bbox 
  })
  
  return bbox
}

// Clear cache for an element (useful when element is removed)
export function clearBBoxCache(element: SVGTextElement) {
  bboxCache.delete(element)
}

// Get only dimensions (width/height) from bbox, useful when position is managed separately
export function getCachedBBoxDimensions(element: SVGTextElement): { width: number; height: number } {
  const bbox = getCachedBBox(element)
  return {
    width: bbox.width,
    height: bbox.height
  }
}