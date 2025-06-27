# Reference Lines Performance Optimization

## Meta Information
- **Created**: 2025-06-27
- **Updated**: 2025-06-27
- **Category**: Performance
- **Related Commits**: [pending]
- **Affected Components**: 
  - `/components/charts/ChartPreview/ReferenceLines/index.tsx`
  - `/components/charts/ChartPreview/ReferenceLines/VerticalReferenceLine.tsx`
  - `/components/charts/ChartPreview/ReferenceLines/HorizontalReferenceLine.tsx`
  - `/utils/performance/bboxCache.ts`

## Overview
Implemented performance optimizations for reference lines rendering to reduce CPU usage and improve responsiveness during drag operations.

## Details
### Background/Problem
After the reference line refactoring, there were opportunities to optimize performance:
- JSON.stringify used for scale fingerprinting was expensive
- Multiple getBBox() calls for label sizing were costly
- DOM operations weren't batched efficiently
- Throttling wasn't applied to drag position updates
- Initial React.memo optimization broke D3.js function calls

### Implementation
1. **Optimized Scale Fingerprinting**
   - Replaced JSON.stringify with primitive value concatenation
   - Reduced fingerprint computation cost

2. **Cached getBBox Calculations**
   - Created `bboxCache.ts` utility with WeakMap-based caching
   - Cache invalidates when text content changes
   - Applied to all label background sizing operations

3. **Added Performance Monitoring**
   - Created `measurePerformance` helper for development mode
   - Tracks rendering time using Performance API

4. **Batched DOM Operations**
   - Used requestAnimationFrame for raise() operations
   - Removed redundant raise() calls

5. **Fixed React.memo Export Error**
   - Initially tried to use React.memo on D3.js manipulation functions
   - Reverted to regular function exports since these aren't React components
   - Removed useMemo hooks in favor of direct JavaScript execution

6. **Fixed Label Background Position Bug**
   - Changed from using cached bbox x/y to label position for backgrounds
   - Added getCachedBBoxDimensions() for position-independent sizing
   - Ensures backgrounds follow labels during pan/zoom operations

7. **Existing Optimizations Preserved**
   - Throttled drag position updates (60fps)
   - Memoized drag behaviors (in useReferenceLineDrag hook)
   - Ref-based state for drag positions

### Technical Details
The getBBox cache uses a WeakMap to automatically handle memory cleanup when elements are removed. The cache key is the SVG text element, and the value includes both the text content and the cached bbox result.

## Usage
No API changes - all optimizations are internal improvements.

## Impact
- Reduced CPU usage during reference line rendering
- Smoother drag operations, especially with multiple reference lines
- Lower memory allocation from repeated function creation
- Better performance on lower-end devices

## Testing
1. Add multiple reference lines to a chart
2. Drag lines and labels rapidly
3. Zoom/pan the chart with reference lines visible
4. Monitor Performance tab in DevTools

## Future Improvements
- Consider implementing virtual rendering for large numbers of reference lines
- Add performance budgets and automated testing
- Explore using CSS transforms instead of attribute updates for drag operations