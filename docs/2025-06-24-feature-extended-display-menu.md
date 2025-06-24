# Extended Display Menu Implementation

## Meta Information
- **Created**: 2025-06-24
- **Updated**: 2025-06-24
- **Category**: Feature
- **Related Commits**: [to be added after commit]
- **Affected Components**: 
  - `/components/layout/LayoutSettings.tsx`
  - `/types/chart-types.ts`
  - `/components/charts/ChartCard.tsx`
  - `/components/charts/ChartPreviewGraph.tsx`
  - `/components/charts/ChartPreview/ScatterPlot.ts`
  - `/utils/chart/axisManager.ts`
  - `/stores/useLayoutStore.ts`

## Overview
Extended the Display menu in the Layout button on the Chart Grid page to provide more granular control over chart appearance. Added controls for axes visibility, labels, data markers, lines, and tooltips.

## Details
### Background/Problem
The existing Display menu only had two options:
- Legend toggle
- Chart title toggle

Users needed more control over chart display elements to customize visualization according to their needs.

### Implementation
1. **Added new display options to ChartSettings interface**:
   - `showXLabel`: Control X-axis label visibility
   - `showYLabel`: Control Y-axis label visibility
   - `showMarkers`: Control data marker visibility
   - `showLines`: Control line connection visibility
   - `showTooltip`: Control tooltip enable/disable

2. **Extended LayoutSettings component**:
   - Added new "Labels & Data" section after existing Display section
   - Created checkbox controls for all new display options
   - Each control updates the chartSettingsMap via updateChartSettings

3. **Updated chart rendering components**:
   - Modified ChartPreviewGraph to merge new settings from Layout menu
   - Updated axisManager to respect showXAxis and showYAxis settings
   - Modified ScatterPlot to respect showTooltip setting

4. **Added properties to ChartComponent interface**:
   - `showXAxis`: Controls X-axis visibility
   - `showYAxis`: Controls Y-axis visibility
   - `showTooltip`: Controls tooltip functionality

### Technical Details
- Display settings are stored in the layout store's chartSettingsMap
- Settings are grid-wide (apply to all charts in the grid)
- Settings persist across sessions via localStorage
- Backward compatible with existing charts (all new options default to true)

## Usage
1. Click the Layout button on the Chart Grid page
2. The Display section now shows:
   - Legend
   - Chart title
   - Grid lines
   - X-axis
   - Y-axis
3. A new "Labels & Data" section shows:
   - X-axis label
   - Y-axis label
   - Data markers
   - Line connections
   - Tooltips
4. Toggle any option to show/hide that element across all charts in the grid

## Impact
- All charts in the grid respect these display settings
- Settings are applied immediately without page reload
- No impact on existing functionality or saved charts
- Performance is not affected as rendering logic already existed

## Testing
1. Navigate to Chart Grid page
2. Click Layout button
3. Toggle each display option and verify:
   - Grid lines appear/disappear
   - Axes show/hide properly
   - Labels show/hide independently from axes
   - Markers and lines toggle correctly
   - Tooltips enable/disable on hover
4. Verify settings persist after page refresh
5. Test with different grid layouts (1x1, 2x2, 3x3, 4x4)

## Future Improvements
- Add animation toggle for chart transitions
- Add axis tick label visibility control (separate from axis)
- Add data label visibility for showing values on markers
- Consider per-chart display settings (not just grid-wide)
- Add reset to defaults button