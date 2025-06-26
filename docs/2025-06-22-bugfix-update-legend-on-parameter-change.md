# Update Plot Style Legend When Y Parameter Changes

## Meta Information
- **Created**: 2025-06-22
- **Updated**: 2025-06-22
- **Category**: Bug Fix
- **Related Commits**: a9581a3
- **Affected Components**: 
  - `/components/charts/EditModal/parameters/ParameterRow/RegularParameterRow.tsx`
  - `/components/charts/EditModal/parameters/useYParameterHandlers.ts`

## Overview
Fixed an issue where changing a Y parameter in the Parameters tab did not update the corresponding legend text in the Style Settings when using 'parameter' legend mode.

## Details
### Background/Problem
When users changed Y parameters (regular parameters, formulas, or interlocks) in the Parameters tab, the legend text in Style Settings remained unchanged. This created an inconsistency where the legend would show outdated parameter names, confusing users about which data was being displayed.

### Implementation
Added logic to automatically update the plot style legend text whenever a Y parameter is changed:
1. In `RegularParameterRow`: When a regular parameter is selected, the corresponding legend text in `plotStyles.byParameter[index]` is updated
2. In `useYParameterHandlers`: Similar updates for formula and interlock selections
3. The updates only occur when the plot style mode is 'parameter', ensuring other modes are unaffected

### Technical Details
- The plot style legend is stored separately from the parameter name in `editingChart.plotStyles`
- Updates are made to the specific index in `plotStyles.byParameter` to maintain the correct mapping
- The fix preserves existing plot style properties (colors, line styles, etc.) while only updating the legend text

## Usage
No user action required. When in 'parameter' legend mode:
1. Select or change a Y parameter in the Parameters tab
2. The legend text in Style Settings will automatically update to match the new parameter name
3. The change is immediately reflected in the chart preview

## Impact
- Improves consistency between parameter selection and legend display
- Eliminates confusion about which parameter is being displayed
- Ensures the legend always reflects the current parameter selection

## Testing
1. Open Chart Edit Modal and go to Parameters tab
2. Add Y parameters and switch to Appearance tab
3. Set Style Settings mode to "By Parameter"
4. Return to Parameters tab and change a parameter
5. Go back to Appearance tab and verify the legend text has updated

## Future Improvements
- Consider similar updates for 'both' mode (Data Source x Parameter)
- Add unit information to the legend text when appropriate
- Ensure template system respects these dynamic updates