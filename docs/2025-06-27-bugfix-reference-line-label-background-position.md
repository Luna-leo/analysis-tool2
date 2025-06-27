# Reference Line Label Background Position Bug Fix

## Meta Information
- **Created**: 2025-06-27
- **Updated**: 2025-06-27
- **Category**: Bug Fix
- **Related Commits**: [pending]
- **Affected Components**: 
  - `/components/charts/ChartPreview/ReferenceLines/VerticalReferenceLine.tsx`
  - `/components/charts/ChartPreview/ReferenceLines/HorizontalReferenceLine.tsx`
  - `/utils/performance/bboxCache.ts`

## Overview
Fixed a bug where reference line label backgrounds (frames) did not move correctly during pan/zoom operations while the label text moved properly.

## Details
### Background/Problem
When panning or zooming a chart with reference lines, the label text would move correctly with the chart, but the background rectangle stayed in a fixed position. This created a visual disconnect between the label and its background.

### Root Cause
The issue was caused by using cached `getBBox()` x/y coordinates for positioning the background:
- `getBBox()` returns coordinates that include the element's current position
- The bbox cache only invalidated when text content changed, not when position changed
- During pan/zoom, the cached bbox had outdated x/y coordinates
- The label text was positioned using fresh coordinates while the background used stale cached coordinates

### Implementation
1. **Added `getCachedBBoxDimensions()` helper**
   - Returns only width/height from cached bbox
   - Avoids using potentially stale x/y coordinates

2. **Updated background positioning logic**
   - Calculate background position relative to label's x/y attributes
   - Only use bbox for width/height sizing
   - Consistent positioning in both initial render and drag operations

3. **Fixed all positioning scenarios**
   - Initial rendering
   - Line drag operations (maintaining label offset)
   - Label drag operations
   - Pan/zoom operations

### Technical Details
The fix changes from:
```typescript
// Old: Using bbox x/y which includes stale position
labelBackground
  .attr("x", textBBox.x - padding)
  .attr("y", textBBox.y - padding)
```

To:
```typescript
// New: Using label position directly
labelBackground
  .attr("x", labelX - padding)
  .attr("y", labelY - dimensions.height + padding)
```

The height adjustment (`labelY - dimensions.height`) is needed because text y-coordinate represents the baseline, not the top of the text.

## Usage
No API changes - this is an internal bug fix that improves visual consistency.

## Impact
- Label backgrounds now correctly follow their labels during all operations
- Consistent visual appearance during pan/zoom
- No performance impact (still using cached dimensions)

## Testing
1. Add reference lines with labels to a chart
2. Pan the chart - verify labels and backgrounds move together
3. Zoom the chart - verify labels and backgrounds scale together
4. Drag reference lines - verify label offsets are maintained
5. Drag labels - verify backgrounds follow correctly

## Future Improvements
- Consider caching position-independent metrics only
- Investigate using CSS transforms for better performance