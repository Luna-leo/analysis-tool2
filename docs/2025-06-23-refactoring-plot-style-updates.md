# Plot Style Update Refactoring

## Meta Information
- **Created**: 2025-06-23
- **Updated**: 2025-06-23
- **Category**: Refactoring
- **Related Commits**: [To be added after commit]
- **Affected Components**: 
  - `/components/charts/EditModal/appearance/PlotStyleSettings/hooks/usePlotStyleUpdate.ts`
  - Multiple files with debug logging removed

## Overview
Refactored the plot style update logic to reduce code duplication and removed debug logging that was added during investigation.

## Details
### Background/Problem
After fixing the real-time update issues, the code had:
1. Duplicated logic for updating different plot style properties
2. Excessive debug logging throughout multiple components
3. Repetitive code patterns in update functions

### Implementation
1. **Created helper functions in usePlotStyleUpdate**:
   - `getStyleKey`: Centralizes the logic for determining the correct key based on mode
   - `updatePlotStyleProperty`: Generic function to update any plot style property
   - Refactored all update functions (marker, line, legend, visibility) to use the helper

2. **Removed debug logging**:
   - Cleaned up console.log statements from all components
   - Kept the code production-ready
   - Debug logs were documented separately for future reference

3. **Simplified code**:
   - Reduced update functions from ~30 lines to ~3 lines each
   - Maintained same functionality with better maintainability
   - Improved code readability

### Technical Details
The refactoring uses a generic helper function that:
- Determines the correct storage key based on mode (datasource/parameter/both)
- Updates the appropriate plotStyles object
- Calls setEditingChart with the updated chart

This eliminates the need for repetitive if/else blocks in each update function.

## Impact
- No functional changes - all features work exactly as before
- Improved code maintainability
- Reduced code size
- Better separation of concerns

## Testing
All existing functionality should work as before:
1. Legend text updates in real-time
2. Visibility toggles work instantly
3. Color and style changes reflect immediately
4. All plot style modes function correctly

## Future Improvements
- Consider creating a custom hook for plot style management
- Add unit tests for the helper functions
- Consider using a state management library like Immer for complex nested updates