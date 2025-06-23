# Parameter Legend Unit Consistency Test Guide

## Test Overview
Verify that parameter legends consistently display without units, both on initial display and after updates.

## Test Steps

### 1. Initial Parameter Selection
1. Open a chart in edit mode
2. Go to Parameters tab
3. Select a parameter with a unit (e.g., "Bearing Vibration 4|mm/s")
4. Go to Appearance > Plot Styles tab
5. Set mode to "By Parameter"

**Expected Result:**
- Legend should show "Bearing Vibration 4" (without "|mm/s")

### 2. Change Parameter
1. Go back to Parameters tab
2. Change the parameter to a different one with units
3. Return to Plot Styles tab

**Expected Result:**
- Legend should update to show the new parameter name without units

### 3. Manual Legend Edit
1. In Plot Styles, manually edit the legend text
2. Save the changes

**Expected Result:**
- Custom legend text should be preserved

### 4. Mode Switching
1. Switch between "By Data Source", "By Parameter", and "By Data Source x Parameter" modes
2. Check legends in each mode

**Expected Result:**
- In all modes, parameter names should appear without units

### 5. Chart Preview Verification
1. Check the Chart Preview on the right side

**Expected Result:**
- Legend in the chart should match the Plot Styles settings (no units)

## Console Check
Monitor browser console for any errors or warnings during testing.