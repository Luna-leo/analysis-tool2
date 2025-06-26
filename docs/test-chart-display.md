# Chart Display Consistency Test

## Summary of Changes

Fixed the display differences between ChartGrid and ChartPreview by ensuring that ChartPreview in the edit modal receives the same `chartSettings` that ChartGrid uses.

### Key Changes:

1. **ChartEditModal.tsx**:
   - Added `chartSettingsMap` from `useLayoutStore`
   - Defined `targetFileId` to identify the current file
   - Passed `chartSettings={chartSettingsMap[targetFileId]}` to ChartPreview

2. **ChartPreview.tsx**:
   - Added `chartSettings` prop to the interface
   - Passed `chartSettings` to ChartPreviewGraph

### How it Works:

- ChartGrid passes `chartSettings` (including margins, axis visibility, etc.) to ChartCard
- ChartCard passes these settings to ChartPreviewGraph
- Now ChartPreview in the edit modal also passes the same settings
- ChartPreviewGraph merges these settings with the chart's own settings

### Test Steps:

1. Open a file with charts in the grid view
2. Note the chart display (margins, axes, grid lines)
3. Click edit on a chart to open the modal
4. The preview in the modal should now match the grid display exactly

### What Was Fixed:

- **Margins**: Both views now use the same margin calculations
- **Axis Settings**: Show/hide axes, grid lines are consistent
- **Label Offsets**: X and Y label positions match
- **Overall Layout**: Charts appear identical in both contexts