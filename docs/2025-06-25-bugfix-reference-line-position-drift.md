# Reference Line Position Drift During Pan/Zoom Fix

## Meta Information
- **Created**: 2025-06-25
- **Updated**: 2025-06-25
- **Category**: Bug Fix
- **Related Commits**: hotfix/reference-line-position-drift branch
- **Affected Components**: 
  - `/components/charts/ChartPreviewGraph.tsx`
  - `/components/charts/ChartPreview/ReferenceLines/index.tsx`
  - `/components/charts/ChartPreview/ReferenceLines/VerticalReferenceLine.tsx`
  - `/components/charts/ChartPreview/ReferenceLines/HorizontalReferenceLine.tsx`

## Overview
Fixed a critical issue where reference lines would drift from their specified data values when panning or zooming charts. The issue was particularly noticeable during rapid zoom/pan movements and when changing grid layouts.

## Details
### Background/Problem
Reference lines were experiencing position drift in two scenarios:
1. **During Pan/Zoom**: Lines would shift away from their data values, especially with rapid mouse movements
2. **During Layout Changes**: Switching between grid layouts (e.g., 2x2 → 3x3) caused lines to appear at incorrect positions

The issue affected both vertical and horizontal reference lines, with horizontal lines being particularly problematic.

### Implementation
The fix addressed multiple root causes:

#### 1. Scale Synchronization Issue
- **Problem**: Chart rendering and ReferenceLines component were using different scale references
- **Solution**: Added `renderScalesRef` to track the exact scales used for chart rendering
- **Code**: ChartPreviewGraph.tsx lines 273-277, 1347-1351, 1782-1791

#### 2. Race Conditions During Rapid Movements
- **Problem**: Rapid zoom/pan events triggered scale updates faster than React could re-render
- **Solution**: Added throttling (16ms/60fps) to `handleZoomTransform`
- **Code**: ChartPreviewGraph.tsx lines 397-429

#### 3. Missing Scale Validation
- **Problem**: Reference lines attempted to use invalid or stale scales
- **Solution**: Added scale validation before position calculations
- **Code**: 
  - VerticalReferenceLine.tsx lines 52-64
  - HorizontalReferenceLine.tsx lines 49-61

#### 4. Incorrect Coordinate Handling
- **Problem**: Drag events used `event.x/event.y` instead of proper SVG coordinates
- **Solution**: Updated to use `d3.pointer()` for accurate coordinate transformation
- **Code**: HorizontalReferenceLine.tsx lines 118-120, 147-149

#### 5. Incomplete Scale Reset on Layout Changes
- **Problem**: Layout changes didn't properly reset all scale references
- **Solution**: Added `renderScalesRef` to all scale reset operations
- **Code**: ChartPreviewGraph.tsx lines 661, 706, 347

### Technical Details
```typescript
// Key addition: Separate ref for scales used in rendering
const renderScalesRef = useRef<{
  xScale: d3.ScaleTime<number, number> | d3.ScaleLinear<number, number> | null,
  yScale: d3.ScaleLinear<number, number> | null
}>({ xScale: null, yScale: null })

// Store scales during render
renderScalesRef.current = {
  xScale: scalesToUse.current.xScale,
  yScale: scalesToUse.current.yScale
}

// Pass render scales to ReferenceLines
<ReferenceLines
  scalesRef={renderScalesRef}
  // ... other props
/>
```

## Usage
No API changes. The fix is transparent to users - reference lines now maintain their positions correctly during all interactions.

## Impact
- Fixes reference line stability during pan/zoom operations
- Ensures correct positioning during layout changes
- Improves overall chart interaction reliability
- No breaking changes to existing functionality

## Testing
### Test Scenarios Verified:
1. **Rapid Zoom Test**: Fast mouse wheel scrolling maintains line positions
2. **Rapid Pan Test**: Quick dragging doesn't cause drift
3. **Layout Change Test**: Switching between 2x2, 3x3, and 4x4 layouts preserves positions
4. **Combined Test**: Alternating zoom/pan/layout changes work correctly

### How to Verify:
1. Create a chart with reference lines at specific values
2. Perform rapid zoom in/out with mouse wheel
3. Pan quickly across the chart
4. Change grid layout while zoomed
5. Verify lines stay at their data values throughout

## Future Improvements
- Consider implementing a more robust scale management system
- Add visual indicators when scales are updating
- Implement scale caching for better performance
- Add unit tests for scale synchronization logic