# Y-Axis Unit Validation Implementation

## Overview
Implemented a validation system that detects when different units are set for parameters on the same Y-axis and provides warnings and conversion suggestions.

## Changes Made

### 1. Unit Validation Utility (`utils/unitValidation.ts`)
- Created `validateAxisUnits()` function that:
  - Checks if all parameters on the same axis have the same unit
  - Detects unit mismatches
  - Determines if units can be converted to a common unit
  - Suggests the most appropriate unit for conversion

### 2. YAxisGroup Component Updates
- Added unit validation check using the new utility
- Shows a yellow warning alert when unit mismatch is detected
- Displays the different units found on the axis
- If units can be converted, shows a "Convert All" button
- The button converts all parameters to the suggested unit

## Features
1. **Automatic Detection**: Validates units whenever parameters are added or modified
2. **Clear Warnings**: Shows a prominent yellow alert with an icon
3. **Conversion Suggestions**: Intelligently suggests the most common unit or a base unit
4. **One-Click Conversion**: Users can convert all parameters with a single button click
5. **Respects Parameter Types**: Works with regular parameters, formulas, and interlocks

## How It Works
1. When rendering each Y-axis group, the system validates all parameter units
2. If different units are detected:
   - A warning alert appears at the top of the axis group
   - Lists all different units found
   - Checks if unit conversion formulas exist between the units
3. If units can be converted:
   - Suggests the most appropriate unit (most common or base unit)
   - Shows a button to convert all parameters
4. When conversion is applied:
   - Updates all parameters on that axis to use the suggested unit
   - The ParameterRow component handles finding the appropriate conversion formula

## User Experience
- Clear visual indication of potential issues
- Non-intrusive warnings that don't block workflow
- Easy one-click fix when conversion is possible
- Helps maintain consistency in chart displays