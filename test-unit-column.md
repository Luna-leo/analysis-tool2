# Unit Column Implementation and Validation Test

## Changes Made

1. **YAxisGroup.tsx**
   - Added "Unit" column header with width `w-20` between "Parameter" and the action button columns

2. **ParameterRow/index.tsx**
   - Added logic to extract unit information based on parameter type:
     - For "Parameter" type: Extracts unit from the parameter key using `parseParameterKey`
     - For "Formula" type: Looks up the formula in the store using `formulaId` to get the unit
     - For "Interlock" type: Uses `interlockDefinition.yUnit`
   - Added a new div with the unit display between the parameter selector and the remove button
   - Styled the unit display with appropriate classes for consistency

## Testing Steps

1. Open the Analysis Tool
2. Create or edit a chart
3. Go to the Parameters tab in the edit modal
4. Check Y Parameters Settings section
5. Verify that:
   - The table header shows "Type", "Parameter", "Unit", and the action button
   - When selecting a Parameter, the unit column displays the parameter's unit
   - When selecting a Formula, the unit column displays the formula's unit
   - When selecting an Interlock, the unit column displays the interlock's Y-axis unit
   - The layout is properly aligned and responsive

## Implementation Details

The unit extraction logic uses:
- `parseParameterKey` utility for regular parameters which are stored as "name|unit"
- `useFormulaMasterStore` to look up formula units by ID
- Direct access to `interlockDefinition.yUnit` for interlocks

The unit is displayed in a muted text style to maintain visual hierarchy.

## Unit Validation Features Added

1. **Unit Validation Utility** (`utils/unitValidation.ts`)
   - Created validation logic to detect unit mismatches on the same Y-axis
   - Checks if units can be converted using available unit converter formulas
   - Suggests the most appropriate unit for conversion

2. **YAxisGroup.tsx Updates**
   - Added unit validation check that runs whenever parameters change
   - Shows a yellow warning alert when different units are detected on the same axis
   - Displays list of mismatched units
   - If units can be converted, shows a "Convert All to [unit]" button
   - Button converts all parameters on the axis to the suggested unit

3. **ParameterRow Updates**
   - Added unit selection combobox that shows available unit conversions
   - Allows users to manually select different units for parameters
   - Automatically finds and stores the conversion formula ID

## Testing Unit Validation

1. Open the Analysis Tool and create/edit a chart
2. In the Parameters tab, add multiple parameters to the same Y-axis with different units:
   - Example: Add a parameter with unit "m" and another with unit "ft"
   - Or add a parameter with unit "°C" and another with unit "°F"
3. Verify that:
   - A yellow warning alert appears at the top of the Y-axis group
   - The alert shows "Unit mismatch detected" with the list of different units
   - If units can be converted, a "Convert All to [unit]" button appears
   - Clicking the button updates all parameters to use the suggested unit
4. Test the unit combobox:
   - Click on the unit column for any parameter
   - If unit conversions are available, a dropdown appears
   - Select a different unit to convert that specific parameter
   - At the bottom of the dropdown, there's a "Create new conversion..." option

## New Feature: Create Unit Conversion from Parameter Row

1. **In-place Unit Conversion Creation**
   - When selecting a parameter with a unit, the unit combobox is always enabled
   - Click on the unit combobox to see available conversions
   - At the bottom, there's a separator followed by "Create new conversion..." option
   - Clicking this opens the Unit Converter Formula dialog

2. **Automatic Selection After Creation**
   - After creating a new unit conversion formula, the system automatically:
     - Detects if the new formula is relevant to the current parameter's unit
     - Selects the newly created target unit for the parameter
     - Closes the unit selection combobox

3. **Testing Steps**
   - Select a parameter with a unit (e.g., "Temperature|°C")
   - Click on the unit combobox
   - Click "Create new conversion..."
   - In the dialog, create a conversion from °C to °F
   - Save the formula
   - The parameter's unit should automatically change to °F