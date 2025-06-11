# Unit Conversion Creation from Parameter Row

## Overview
Implemented the ability to create new unit conversion formulas directly from the parameter row's unit selection combobox, improving the workflow when a needed conversion doesn't exist.

## Changes Made

### 1. ParameterRow Component Updates (`components/charts/EditModal/parameters/ParameterRow/index.tsx`)

#### Added Imports:
- `CommandSeparator` for visual separation in the dropdown
- `Plus` icon for the create option
- `UnitConverterFormulaDialog` component

#### State Management:
- Added `lastFormulaCount` state to track when new formulas are added
- Integrated `openDialog` from `useUnitConverterFormulaStore`

#### New Features:
1. **Create New Conversion Option**
   - Added a separator and "Create new conversion..." option at the bottom of unit combobox
   - Only shows when there's a default unit available
   - Uses Plus icon for visual clarity

2. **Auto-Selection Logic**
   - Added `useEffect` that monitors when new unit converter formulas are created
   - Automatically detects if the new formula is relevant to the current parameter's unit
   - Selects the appropriate target unit after creation
   - Closes the unit combobox automatically

3. **Improved Accessibility**
   - Removed the restriction that disabled the unit combobox when only one unit was available
   - Now always enabled when a parameter is selected, allowing access to create new conversions

### 2. User Experience Improvements

1. **Seamless Workflow**
   - Users can create conversions without leaving the chart editing context
   - No need to navigate to the Unit Converter Formula master page
   - Automatic selection reduces manual steps

2. **Contextual Creation**
   - The dialog opens with context about what unit needs conversion
   - After saving, the new unit is immediately available and selected

3. **Visual Feedback**
   - Clear separation between existing units and the create option
   - Consistent iconography with other create actions in the system

## Benefits

1. **Reduced Friction**: Users can create conversions exactly when they need them
2. **Improved Efficiency**: Automatic selection eliminates manual searching for the new unit
3. **Better Discoverability**: Users can easily see that creating new conversions is possible
4. **Maintains Context**: Users stay in their chart editing workflow

## Technical Implementation

The implementation leverages:
- React hooks for state management and effects
- Zustand store integration for dialog control
- Automatic detection of relevant formulas based on unit matching
- Clean separation of concerns with the dialog component handling the creation logic