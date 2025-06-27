# Reference Line Labels Z-Index Management

## Meta Information
- **Created**: 2025-06-27
- **Updated**: 2025-06-27
- **Category**: Feature
- **Related Commits**: [pending]
- **Affected Components**: 
  - `/components/charts/ChartPreview/ReferenceLines/index.tsx`
  - `/components/charts/ChartPreview/ReferenceLines/VerticalReferenceLine.tsx`
  - `/components/charts/ChartPreview/ReferenceLines/HorizontalReferenceLine.tsx`

## Overview
Implemented a robust z-index management system to ensure reference line labels always appear above plot data, regardless of when or how the chart is rendered or updated.

## Details
### Background/Problem
Reference line labels were sometimes appearing behind plot data elements. The existing `raise()` call in `requestAnimationFrame` wasn't sufficient because:
- Chart data might be rendered after the reference lines
- React component lifecycle could cause timing conflicts
- New SVG elements added later would appear on top of labels

### Implementation
1. **Separate Top-Level Labels Layer**
   - Created `.reference-labels-top-layer` as a separate SVG group
   - This layer is independent from the reference lines layer
   - Labels are rendered in this dedicated top layer

2. **Layer Structure**
   ```
   SVG
   ├── defs (clip paths, etc.)
   ├── axes groups
   ├── main chart group (plot data)
   ├── reference-lines-layer
   │   └── reference-lines-clip-group (lines only)
   └── reference-labels-top-layer (NEW - always on top)
       └── reference-labels-group (all labels)
   ```

3. **MutationObserver for Automatic Z-Index Management**
   - Monitors the SVG for new child elements
   - Automatically moves labels layer to the end when new elements are added
   - Uses `requestAnimationFrame` for performance

4. **Enhanced Raise Strategy**
   - Initial raise in `requestAnimationFrame` after rendering
   - Additional `appendChild` to ensure it's the last child
   - MutationObserver catches any elements added later

5. **Removed Individual Label Raises**
   - Removed `labelGroupElement.raise()` calls from individual reference lines
   - Z-index is now managed entirely at the layer level

### Technical Details
The MutationObserver watches only direct children of the SVG (not subtree) for performance. When new elements are detected, it checks if they were added after the labels layer and re-raises the labels if needed.

## Usage
No API changes - this is an internal improvement that ensures consistent visual hierarchy.

## Impact
- Labels always appear above plot data
- Consistent behavior across all chart types and interactions
- No performance impact (observer only watches direct SVG children)
- Works with dynamic chart updates and animations

## Testing
1. Add reference lines with labels to a chart
2. Verify labels appear above all plot elements (scatter points, lines, etc.)
3. Pan/zoom the chart - labels should remain on top
4. Update chart data - labels should stay on top
5. Add/remove plot series - labels should maintain top position

## Known Issues (Fixed)
- **Labels disappearing during zoom/pan**: Initially, the labels layer was being removed during chart re-renders because ChartPreviewGraph.tsx only preserved the lines layer. Fixed by adding `.reference-labels-top-layer` to the preservation list.

## Future Improvements
- Consider using CSS z-index if D3.js adds better support
- Explore shadow DOM for true isolation of label rendering