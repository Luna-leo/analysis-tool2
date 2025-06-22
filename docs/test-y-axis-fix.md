# Y-Axis Label Overlap Fix Testing Guide

## What was Fixed

1. **Dynamic Y-axis Label Positioning**: The Y-axis label now dynamically positions itself based on the actual width of Y-axis tick labels, preventing overlap.

2. **Implementation Details**:
   - Modified `AxisManager.addAxisLabels()` to accept Y-axis group reference
   - Added tick width measurement using `getBBox()` 
   - Calculate dynamic offset: `maxTickWidth + tickPadding + labelPadding`
   - Smaller padding values for compact layouts (3x3, 4x4)

3. **Margin Adjustments**:
   - Increased left margins for small layouts:
     - 3x3: 12% → 14% (40px → 45px)
     - 4x4: 10% → 12% (35px → 40px)
   - Increased minimum left margin: 35px → 40px for small layouts

## Testing Steps

1. **Test with 3x3 Layout**:
   - Switch to 3x3 grid layout
   - Add charts with Y-axis values of varying widths:
     - Small numbers (0-10)
     - Large numbers (10000-100000)
     - Decimal numbers (0.0001-0.9999)
   - Verify Y-axis labels don't overlap with tick marks

2. **Test with 4x4 Layout**:
   - Switch to 4x4 grid layout
   - Repeat the same tests
   - Verify adequate spacing

3. **Test with Different Data Ranges**:
   - Charts with negative values
   - Charts with very large values (millions)
   - Charts with scientific notation

4. **Test Zoom Functionality**:
   - Zoom in/out on charts
   - Verify label positioning updates correctly

5. **Compare with Larger Layouts**:
   - Test 2x2 and 1x1 layouts
   - Ensure they still work correctly

## Expected Results

- Y-axis labels should have adequate spacing from tick labels
- No overlap between Y-axis label and tick marks
- Dynamic spacing based on actual tick label width
- Proper behavior during zoom/pan operations