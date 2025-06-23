# Plot Style Visibility Fix

## Meta Information
- **Created**: 2025-06-23
- **Updated**: 2025-06-23
- **Category**: Bug Fix
- **Related Commits**: (to be added after commit)
- **Affected Components**: 
  - `/components/charts/ChartPreviewGraph.tsx`
  - `/utils/plotStylesComparison.ts` (new file)

## Overview
Fixed an issue where the Visible button in Plot Styles was not working properly. The visibility toggle was taking a long time to reflect in the legend and wasn't affecting the actual plot lines/markers at all.

## Details
### Background/Problem
The Plot Style Settings in the Chart Edit Modal has a Visible button (eye icon) for each plot style. When clicked:
1. The legend took a very long time to update (several seconds)
2. The plot lines and markers were not affected at all - they remained visible

The root cause was that `plotStyles` was not included in the render effect dependencies in `ChartPreviewGraph.tsx`. The chart was reading plotStyles directly from `mergedChart` but not watching for changes.

### Implementation
1. **Added plotStyles to render dependencies**: 
   - Added `plotStyles` to the `chartRenderProps` memoization
   - Added `chartRenderProps.plotStyles` to the useEffect dependency array
   - This ensures the chart re-renders when visibility (or any plotStyles property) changes

2. **Optimized plotStyles comparison**:
   - Created `arePlotStylesEqual` utility function for efficient comparison
   - Replaced expensive `JSON.stringify` comparisons with targeted property checks
   - The new comparison focuses on properties that actually affect rendering

3. **Updated debug logging**:
   - Added plotStyles tracking to development logging
   - Now logs "plotStyles" when visibility changes trigger a re-render

### Technical Details
The ScatterPlot component already had the logic to filter out invisible plot styles (lines 210-215 and 319 in ScatterPlot.ts), but the chart wasn't re-rendering when visibility changed.

The fix ensures proper reactivity by:
- Including plotStyles in the render effect dependencies
- Using efficient comparison to avoid unnecessary re-renders
- Maintaining the existing filtering logic in ScatterPlot

## Usage
No changes to usage. The Visible button now works as expected:
- Click the eye icon to hide a plot style
- Click the eye-off icon to show a plot style
- Both legend and plot update immediately

## Impact
- **Performance**: Slightly improved due to more efficient plotStyles comparison
- **User Experience**: Significant improvement - visibility changes are now instant
- **Other Components**: No impact on other components

## Testing
1. Open the Analysis page
2. Load data and create a chart
3. Open Chart Edit Modal → Appearance → Plot Style Settings
4. Click the Visible button for any plot style
5. Verify:
   - Legend updates immediately
   - Plot lines/markers hide/show immediately
   - Console shows "Render triggered by changes in: plotStyles" in development mode

## Future Improvements
- Consider implementing partial re-rendering to only update affected series instead of full chart re-render
- Add animation/transition effects when hiding/showing plot styles
- Consider adding "Show All" / "Hide All" buttons for bulk visibility changes