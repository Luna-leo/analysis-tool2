# Legend Text Not Updating in ChartPreview

## Meta Information
- **Created**: 2025-06-23
- **Updated**: 2025-06-23
- **Category**: Bug Fix
- **Related Commits**: [pending]
- **Affected Components**: 
  - `/components/charts/ChartLegend.tsx`
  - `/components/charts/ChartPreviewGraph.tsx`
  - `/components/charts/EditModal/appearance/PlotStyleSettings/PlotStyleTableRow.tsx`
  - `/components/charts/EditModal/appearance/PlotStyleSettings/LegendInput.tsx`

## Overview
Fixed an issue where changes to legend text in Plot Style Settings were not immediately reflecting in the ChartPreview component.

## Details
### Background/Problem
When users edited the legend text in the Plot Style Settings table, the changes were being saved to the editingChart state but were not visually updating in the ChartPreview's legend. This created confusion as users couldn't see their changes taking effect.

### Implementation
1. **Added custom comparison function to ChartLegend**: Implemented `chartLegendPropsAreEqual` to ensure the component re-renders when plotStyles change, with proper deep comparison of the plotStyles object based on the current mode.

2. **Fixed input value binding**: Updated PlotStyleTableRow to use `plotStyle.legendText || row.legendText` instead of just `row.legendText` to ensure the input always shows the current value from plotStyles.

3. **Added debug logging**: Added comprehensive debug logging in development mode to trace the data flow:
   - LegendInput: Logs when input value changes
   - ChartLegend: Logs the label resolution process (custom vs default)
   - ChartPreviewGraph: Logs when mergedChart updates with plotStyles
   - usePlotStyleUpdate: Already had logging for legend updates

### Technical Details
The issue was caused by:
1. The ChartLegend component's memo comparison wasn't properly detecting plotStyles changes
2. The input field was showing the initial row.legendText instead of the current plotStyle.legendText

The fix ensures:
- ChartLegend re-renders when plotStyles change by using a custom comparison function
- The input field always shows the current value from plotStyles
- Proper data flow from PlotStyleSettings → editingChart → ChartPreviewGraph → ChartLegend

## Usage
No changes to usage - legend text updates now work as expected:
1. Open Chart Edit Modal
2. Go to Appearance tab
3. Edit legend text in the Style Settings table
4. Changes immediately reflect in the preview

## Impact
- ChartLegend now properly re-renders when plotStyles change
- Legend text input fields show the correct current value
- Better debugging capabilities in development mode

## Testing
1. Open a chart in edit mode
2. Navigate to Appearance tab
3. Change legend text for any item
4. Verify the legend in the preview updates immediately
5. Test with different modes (By Data Source, By Parameter, By Both)
6. Save and verify changes persist

## Future Improvements
- Consider optimizing the comparison function to avoid JSON.stringify for better performance
- Add unit tests for the legend update flow
- Consider using a more granular state update mechanism to avoid full component re-renders