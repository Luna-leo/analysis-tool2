# Legend Auto-Update in "By Data Source x Parameter" Mode Fix

## Meta Information
- **Created**: 2025-06-23
- **Updated**: 2025-06-23
- **Category**: Bug Fix
- **Related Commits**: [pending]
- **Affected Components**: 
  - `/components/charts/EditModal/parameters/ParameterRow/RegularParameterRow.tsx`
  - `/components/charts/EditModal/parameters/useYParameterHandlers.ts`

## Overview
Fixed legend auto-update functionality in "By Data Source x Parameter" mode when parameters are changed. Previously, legends only auto-updated in "By Parameter" mode.

## Details
### Background/Problem
When using "By Data Source x Parameter" mode for plot styles, changing Y parameters (regular, formula, or interlock) did not automatically update the legend text. The auto-update functionality only worked in "By Parameter" mode.

Root causes identified:
1. Code was checking `editingChart.selectedDataSourceItems` which doesn't exist (should use prop)
2. Code only updated existing entries in `byBoth` but didn't create new ones
3. `useYParameterHandlers` didn't receive data source information

### Implementation
Added support for `mode === 'both'` in all parameter update handlers:

1. **RegularParameterRow.tsx**: 
   - Fixed to use `selectedDataSourceItems` prop instead of `editingChart.selectedDataSourceItems`
   - Added logic to create new entries in `plotStyles.byBoth` if they don't exist
   - Added import for `getDefaultColor`

2. **useYParameterHandlers.ts**: 
   - Updated interface to accept `selectedDataSourceItems?: EventInfo[]`
   - Added 'both' mode support with entry creation to:
     - `handleFormulaSave`
     - `handleFormulaSelect`
     - `handleInterlockSave`
     - `handleInterlockSelect`
   - Added import for `getDefaultColor`

3. **YParametersSettings.tsx**:
   - Updated to pass `selectedDataSourceItems` to `useYParameterHandlers`

### Technical Details
- When in 'both' mode, the code iterates through all selected data sources
- For each data source, it creates a key in format `"${dataSource.id}-${paramIndex}"`
- Creates new plot style entries with default marker/line settings if they don't exist
- Updates the legendText to `"${dataSource.label}-${parameterName}"`
- Uses consistent color assignment based on data source index
- Preserves all other plot style properties (marker, line, visibility)

## Usage
No user action required - legends will now auto-update in all modes when parameters change.

## Testing Guide
1. **Setup**:
   - Open a chart in Edit Modal
   - Add multiple data sources
   - Add multiple Y parameters
   - Go to Appearance tab → Plot Style Settings

2. **Test "By Data Source x Parameter" Mode**:
   - Select "By Data Source x Parameter" from dropdown
   - Note the initial legend texts (format: "DataSource-Parameter")
   
3. **Test Parameter Changes**:
   - Change a Y parameter to a different parameter
   - Verify legend updates to "DataSource-NewParameter" for all affected rows
   
4. **Test Formula Changes**:
   - Change parameter type to Formula
   - Select or create a formula
   - Verify legend updates to "DataSource-FormulaName"
   
5. **Test Interlock Changes**:
   - Change parameter type to Interlock
   - Select or create an interlock
   - Verify legend updates to "DataSource-InterlockName"

6. **Verify Other Modes Still Work**:
   - Switch to "By Parameter" mode
   - Change parameters and verify legends update
   - Switch to "By Data Source" mode
   - Verify legends remain as data source labels

## Impact
- Improves consistency across all legend modes
- No breaking changes - existing functionality preserved
- Performance impact minimal (only updates when parameters change)

## Future Improvements
- Consider adding option to disable auto-update for legends (similar to axis labels)
- Could optimize by batching updates when multiple parameters change simultaneously