# Reference Line Labels Disappearing During Zoom/Pan Bug Fix

## Meta Information
- **Created**: 2025-06-27
- **Updated**: 2025-06-27
- **Category**: Bug Fix
- **Related Commits**: [pending]
- **Affected Components**: 
  - `/components/charts/ChartPreviewGraph.tsx`

## Overview
Fixed a bug where reference line labels would disappear and reappear during zoom/pan operations.

## Details
### Background/Problem
After implementing the separate top-level labels layer for z-index management, labels would disappear whenever the chart was zoomed or panned. The labels would briefly appear and then vanish.

### Root Cause
In `ChartPreviewGraph.tsx`, during chart re-rendering (which occurs on zoom/pan), the code clears all SVG elements except:
- `defs` elements (for clipPaths)
- `.reference-lines-layer`

The new `.reference-labels-top-layer` was not in the exception list, causing it to be removed during every re-render.

### Implementation
Added `.reference-labels-top-layer` to the list of preserved elements during chart re-rendering:

```javascript
// Before: Only preserving lines layer
if (tagName === 'defs' || elem.classed('reference-lines-layer')) {
  return; // Keep these elements
}

// After: Preserving both lines and labels layers
if (tagName === 'defs' || 
    elem.classed('reference-lines-layer') || 
    elem.classed('reference-labels-top-layer')) {
  return; // Keep these elements
}
```

### Technical Details
The chart re-rendering process preserves certain elements to maintain state across zoom/pan operations. By adding the labels layer to this preservation list, we ensure labels remain visible and properly positioned throughout all chart interactions.

## Usage
No API changes - this is an internal bug fix.

## Impact
- Reference line labels now remain visible during all zoom/pan operations
- Consistent user experience without flickering labels
- Maintains the z-index benefits of the separate labels layer

## Testing
1. Add reference lines with labels to a chart
2. Zoom in and out multiple times
3. Pan the chart in various directions
4. Verify labels remain continuously visible
5. Verify labels still appear above plot data

## Future Improvements
- Consider consolidating the preservation logic into a more maintainable structure
- Add unit tests for SVG element preservation during re-renders