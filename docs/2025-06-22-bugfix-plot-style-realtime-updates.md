# Plot Style Real-time Updates Fix

## Meta Information
- **Created**: 2025-06-22
- **Updated**: 2025-06-22
- **Category**: Bug Fix
- **Related Commits**: TBD
- **Affected Components**: 
  - `/components/charts/ChartPreviewGraph.tsx`

## Overview
Fixed an issue where changes to plot styles (legend text, colors, and visibility) in Style Settings were not reflected in real-time in the Chart Preview.

## Details
### Background/Problem
When users made changes in the Style Settings tab:
- Changing legend text did not update the chart legend immediately
- Changing marker/line colors did not update the plot colors immediately
- Toggling visibility checkboxes did not show/hide plots immediately

Users had to close and reopen the edit modal or switch tabs to see the changes, leading to a poor user experience.

### Implementation
1. Added `plotStyles` comparison to the React.memo comparison function in ChartPreviewGraph:
   - Added `legendMode` comparison to detect legend mode changes
   - Added `plotStyles` deep comparison using JSON.stringify to detect any style changes

2. Fixed `mergedChart` useMemo to include plotStyles:
   - Added `plotStyles: editingChart.plotStyles` to ensure the latest plot styles are always passed through
   - Added `legendMode: editingChart.legendMode` for consistency
   - This ensures that renderScatterPlot receives the updated plotStyles instead of stale values

3. Removed React.memo from ChartPreview component:
   - ChartPreview was using React.memo which could block updates
   - Removed memoization to ensure proper prop propagation
   - Added debug logging to trace update flow

4. Added debug logging to trace the update flow:
   - Added logs in usePlotStyleUpdate when legend or visibility changes
   - Added logs in ChartPreview to show incoming plotStyles
   - Added logs in ChartPreviewGraph memo comparison to debug prop changes

### Technical Details
- ChartPreviewGraph uses React.memo with a custom comparison function `chartPreviewGraphPropsAreEqual`
- The comparison function was missing checks for `plotStyles` which contains all style-related data
- Plot styles are stored in `editingChart.plotStyles` with different structures based on mode:
  - `byDataSource`: Styles indexed by data source ID
  - `byParameter`: Styles indexed by parameter index
  - `byBoth`: Styles indexed by combination key

## Usage
No user action required. The fix enables automatic real-time updates:
1. Open Chart Edit Modal and navigate to Appearance tab
2. In Style Settings, any changes will now update immediately:
   - Edit legend text → Updates in chart preview instantly
   - Change colors → Plot colors update instantly
   - Toggle visibility → Plots show/hide instantly

## Impact
- Significantly improves user experience when customizing chart appearance
- Eliminates confusion about whether changes have been applied
- Reduces the need to close/reopen dialogs or switch tabs

## Testing
1. Open a chart in Edit Modal
2. Go to Appearance tab → Style Settings
3. Test each real-time update:
   - Change legend text and verify it updates immediately
   - Change marker/line colors and verify plots update immediately
   - Toggle visibility checkboxes and verify plots show/hide immediately
4. Test in all three modes: "By Data Source", "By Parameter", and "By Data Source x Parameter"

## Future Improvements
- Consider optimizing the comparison if performance becomes an issue with many plot styles
- Add debouncing for color picker changes to reduce re-renders during color selection
- Consider breaking down plotStyles comparison to be more granular