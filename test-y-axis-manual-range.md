# Y-Axis Manual Range Fix

## Problem
When users set a manual Y-axis range (by unchecking "Auto Range" and setting min/max values), the chart preview was not respecting these values. Instead, it was always calculating the Y-axis domain based on the data values with padding.

## Root Cause
The `calculateConsistentYDomain` function in `/utils/chart/scaleUtils.ts` was not checking for manual range settings. It only considered:
1. Data values from the chart
2. Reference line values
3. Applied automatic padding

## Solution
Updated the `calculateConsistentYDomain` function to:
1. First check if the first Y parameter has `range.auto === false`
2. If manual range is set, return the user-defined min/max values directly
3. Otherwise, fall back to the automatic calculation

## Code Changes
```typescript
// Added at the beginning of calculateConsistentYDomain function:
const firstYParam = chart.yAxisParams?.[0]
if (firstYParam?.range?.auto === false && 
    firstYParam.range.min !== undefined && 
    firstYParam.range.max !== undefined) {
  // Use the manual range from the first Y parameter
  return [firstYParam.range.min, firstYParam.range.max]
}
```

## Impact
- Scatter plots now respect manual Y-axis range settings
- Line charts continue to work as before (they already had manual range support)
- Empty charts also respect manual ranges through the same function
- Reference lines will appear correctly within the manual range

## Testing
To test the fix:
1. Create a chart with a Y parameter
2. Click on the range button (shows "Range: Auto")
3. Uncheck "Auto Range"
4. Set custom min/max values (e.g., Min: -50, Max: 200)
5. The chart preview should immediately update to show the specified range
6. The Y-axis should display exactly the range you set, without automatic padding