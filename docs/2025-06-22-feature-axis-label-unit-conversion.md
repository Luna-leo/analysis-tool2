# Axis Label Unit Conversion Support

## Meta Information
- **Created**: 2025-06-22
- **Updated**: 2025-06-22
- **Category**: Feature
- **Related Commits**: [pending]
- **Affected Components**: 
  - `/components/charts/EditModal/parameters/YAxisGroup.tsx`
  - `/components/charts/EditModal/parameters/UnitSelector.tsx`

## Overview
Implemented automatic unit conversion support for Y-axis labels when auto-update is enabled. When a user selects a unit conversion for a parameter, the axis label now automatically updates to show the converted unit.

## Details
### Background/Problem
The user requested: "Autoの場合、単位変換を指定された場合はLabelに表示する単位も変換後の単位にUPDateする" (When auto-update is enabled, if a unit conversion is specified, the label should update to show the converted unit).

### Implementation
1. Modified `getAutoLabelForAxis` function in YAxisGroup.tsx to use the converted unit (`firstParam.unit`) if specified, otherwise fall back to the original parsed unit
2. Added a `useEffect` hook that watches for unit changes and automatically updates the label when auto-update is enabled
3. The implementation ensures that:
   - When a unit conversion is selected, the label shows the converted unit
   - When the conversion is removed, the label reverts to the original unit
   - This only happens when auto-update is enabled

### Technical Details
```typescript
// In getAutoLabelForAxis function
const displayUnit = firstParam.unit || parsed.unit
return displayUnit ? `${parsed.name} [${displayUnit}]` : parsed.name

// useEffect to watch for unit changes
useEffect(() => {
  if (editingChart.autoUpdateYLabels ?? true) {
    const autoLabel = getAutoLabelForAxis()
    if (autoLabel) {
      updateAxisLabel(axisNo, autoLabel)
    }
  }
}, [
  // Watch for changes in parameters' units
  editingChart.yAxisParams?.filter((_, idx) => paramIndexes.includes(idx))
    .map(p => p.unit)
    .join(',')
])
```

## Usage
1. Enable auto-update for Y-axis labels (default is enabled)
2. Select a parameter with a unit (e.g., Temperature [°C])
3. Click on the unit selector and choose a conversion (e.g., °C → °F)
4. The Y-axis label automatically updates to show "Temperature [°F]"
5. If auto-update is disabled, the label remains unchanged

## Impact
- Y-axis labels now dynamically reflect unit conversions
- Better user experience as labels stay synchronized with displayed units
- No impact on existing functionality when auto-update is disabled

## Testing
1. Create a chart with Y-axis parameters that have units
2. Verify auto-update is enabled (checkbox is checked)
3. Select a unit conversion for a parameter
4. Confirm the Y-axis label updates to show the converted unit
5. Remove the conversion and verify the label reverts to the original unit
6. Disable auto-update and verify unit changes don't affect the label

## Future Improvements
- Consider adding similar functionality for X-axis if unit conversion is ever supported there
- Add visual indicators when a label is showing a converted unit