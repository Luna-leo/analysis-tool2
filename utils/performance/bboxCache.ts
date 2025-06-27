// Cache for getBBox results to avoid expensive recalculations
const bboxCache = new WeakMap<SVGTextElement, { text: string, bbox: DOMRect }>()

export function getCachedBBox(element: SVGTextElement): DOMRect {
  const text = element.textContent || ''
  const cached = bboxCache.get(element)
  
  // Return cached result if text hasn't changed
  if (cached && cached.text === text) {
    return cached.bbox
  }
  
  // Calculate and cache new bbox
  const bbox = element.getBBox()
  bboxCache.set(element, { text, bbox })
  
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