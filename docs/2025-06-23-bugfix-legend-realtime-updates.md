# Legend Real-time Update Fix

## Meta Information
- **Created**: 2025-06-23
- **Updated**: 2025-06-23
- **Category**: Bug Fix
- **Related Commits**: [To be added after commit]
- **Affected Components**: 
  - `/stores/useUIStore.ts`
  - `/components/charts/ChartPreviewGraph.tsx`
  - `/components/charts/ChartLegend.tsx`
  - `/components/charts/EditModal/appearance/PlotStyleSettings/hooks/usePlotStyleUpdate.ts`

## Overview
Fixed an issue where legend text changes in Plot Style Settings were not reflecting in real-time in the Chart Preview. The root cause was that React wasn't detecting plotStyles changes due to object reference issues in the Zustand store.

## Details
### Background/Problem
- Users reported that changing legend text in Plot Style Settings didn't update the Chart Preview
- Visibility toggles had significant delays
- Plot colors weren't updating in real-time
- The issue had two root causes:
  1. React not detecting state changes because the same object reference was being reused
  2. ChartPreviewGraph memo comparison logic was flawed

### Implementation
1. **Modified UIStore setEditingChart methods**:
   - Added spread operator `{ ...chart }` to create new object references
   - This ensures React detects the state change and triggers re-renders
   - Applied to: `setEditingChart`, `setEditingChartWithIndex`, `navigateToNextChart`, `navigateToPreviousChart`

2. **Fixed ChartPreviewGraph memo comparison**:
   - The comparison function was checking reference equality but not returning false when references differed
   - Now correctly returns false immediately when editingChart reference changes
   - This ensures the component re-renders when UIStore creates new objects

3. **Added debug logging**:
   - Added console logs to track plotStyles flow through components
   - Helps diagnose future issues with real-time updates

### Technical Details
The issue was that when updating nested properties like `plotStyles.byDataSource[id].legendText`, the chart object reference remained the same. React's reconciliation algorithm doesn't detect deep property changes unless the object reference changes.

By using the spread operator, we create a new object reference while preserving all properties, forcing React to recognize the state change.

## Usage
No changes required for users. Legend text, colors, and visibility toggles now update immediately in the Chart Preview when changed in Plot Style Settings.

## Impact
- Improves user experience with immediate visual feedback
- No performance impact as spread operation is shallow
- Maintains backward compatibility

## Testing
1. Open a chart in edit mode
2. Go to Appearance > Plot Styles tab
3. Change legend text - should update immediately in preview
4. Toggle visibility - should hide/show plots immediately
5. Change colors - should update plot colors immediately

## Future Improvements
- Consider implementing immer for immutable state updates if more complex nested updates are needed
- Add automated tests for real-time UI updates