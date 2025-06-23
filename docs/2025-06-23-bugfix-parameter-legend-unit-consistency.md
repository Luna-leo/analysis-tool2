# Parameter Legend Unit Consistency Fix

## Meta Information
- **Created**: 2025-06-23
- **Updated**: 2025-06-23
- **Category**: Bug Fix
- **Related Commits**: [To be added after commit]
- **Affected Components**: 
  - `/components/charts/EditModal/appearance/PlotStyleSettings/hooks/usePlotStyleUpdate.ts`
  - `/components/charts/ChartLegend.tsx`
  - `/components/charts/EditModal/appearance/PlotStyleSettings/hooks/usePlotStyleRows.ts`

## Overview
Fixed inconsistency where parameter legends displayed with units on initial load but without units after updates. Now all parameter legends consistently display without units.

## Details
### Background/Problem
- Parameters are stored in format "name|unit" (e.g., "Bearing Vibration 4|mm/s")
- Initial legend display showed full parameter string including units
- Updates used parsed parameter name without units
- This created inconsistent user experience

### Implementation
1. **Updated `usePlotStyleUpdate.ts`**:
   - Used `cleanParameterName()` to strip units when initializing default styles
   - Applied to both "By Parameter" and "By Data Source x Parameter" modes

2. **Updated `ChartLegend.tsx`**:
   - Used `cleanParameterName()` for default labels in all modes
   - Ensures display consistency with stored values

3. **Updated `usePlotStyleRows.ts`**:
   - Used `cleanParameterName()` for legend text in Plot Style table
   - Maintains consistency in the settings UI

### Technical Details
The `cleanParameterName()` utility function from `parameterUtils.ts` extracts the parameter name before the pipe character, effectively removing the unit portion.

## Usage
No user action required. Parameter legends will now consistently display without units across all views and updates.

## Impact
- Improved UI consistency
- Better user experience with predictable legend display
- No functional changes to data or calculations

## Testing
1. Select parameters with units in chart configuration
2. Check legend display in Plot Styles settings
3. Update parameters and verify legends remain consistent
4. Switch between different plot style modes

## Future Improvements
- Consider adding a user preference for showing/hiding units in legends
- Implement tooltip to show full parameter info including units