# X-axis Positioning Fix

## Overview
Fixed the X-axis positioning in Chart Preview components to properly place the X-axis at y=0 when the Y-axis domain includes negative values. Previously, the X-axis was always positioned at the bottom of the chart area.

## Changes Made

### 1. LineChart.ts
- **File**: `/components/charts/ChartPreview/LineChart.ts`
- Added logic to calculate X-axis position based on Y-axis domain
- X-axis is placed at y=0 if the domain includes 0, otherwise at bottom

### 2. ScatterPlot.ts
- **File**: `/components/charts/ChartPreview/ScatterPlot.ts`
- Applied same X-axis positioning logic as LineChart

### 3. EmptyChart.ts
- **File**: `/components/charts/ChartPreview/EmptyChart.ts`
- Fixed X-axis positioning for all three axis types (datetime, time, numeric)

## Implementation Details
```typescript
// Calculate X-axis position: at y=0 if domain includes it, otherwise at bottom
const xAxisY = yDomain[0] <= 0 && yDomain[1] >= 0 ? yScale(0) : height

g.append("g")
  .attr("transform", `translate(0,${xAxisY})`)
  .call(d3.axisBottom(xScale))
```

## Testing Scenarios
1. **Positive Y-axis domain** (e.g., 0 to 100): X-axis at bottom
2. **Negative Y-axis domain** (e.g., -100 to -10): X-axis at bottom
3. **Mixed Y-axis domain** (e.g., -50 to 50): X-axis at y=0
4. **Auto-scaled domains**: Properly positions based on data extent

## Future Enhancement
- Add X-axis Y position configuration option in Appearance tab
- Allow users to manually set X-axis position (top/bottom/zero)
- Consider grid line styling when X-axis is in the middle of chart