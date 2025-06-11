# Reference Line Position Analysis

## Problem Summary
Reference line positions differ between Chart Preview (in the edit modal) and Chart Card (in the grid view), despite both using the same `ChartPreviewGraph` component.

## Analysis

### 1. Scale Calculation Context

Both Chart Preview and Chart Card use the same `ChartPreviewGraph` component, which means they should theoretically calculate scales the same way. However, there are several factors that could cause differences:

#### a) Container Dimensions
- **Chart Preview (Edit Modal)**: Has a fixed container size within the modal grid layout (7fr for content, 5fr for preview)
- **Chart Card (Grid View)**: Has dynamic sizing based on grid layout settings (columns, rows, compact mode)

The dimensions affect scale calculations:
```javascript
// In ChartPreviewGraph
const margin = { top: 20, right: 40, bottom: 60, left: 60 }
const width = dimensions.width - margin.left - margin.right
const height = dimensions.height - margin.top - margin.bottom
```

#### b) Data Ranges for Scale Domains

For Y-axis scales with data:
```javascript
const yExtent = d3.extent(data, d => d.y) as [number, number]
const yPadding = (yExtent[1] - yExtent[0]) * 0.05
const yScale = d3.scaleLinear()
  .domain([yExtent[0] - yPadding, yExtent[1] + yPadding])
  .range([height, 0])
```

For empty charts (no data):
```javascript
// Fixed domain for empty charts
const yDomain: [number, number] = [0, 100]
const yScale = d3.scaleLinear()
  .domain(yDomain)
  .nice()
  .range([height, 0])
```

### 2. Key Differences Found

1. **Empty vs. Data-filled Charts**:
   - Empty charts use a fixed domain of [0, 100]
   - Charts with data use the actual data extent with 5% padding
   - This means the same reference line value (e.g., y=50) will appear at different positions depending on whether the chart has data

2. **Container Height Differences**:
   - Chart Preview: Uses the full available height in the modal
   - Chart Card: Has constrained height based on `chartMinHeight` (60px compact, 80px normal)
   - Different heights mean different pixel ranges for the scales

3. **Timing of Scale Calculation**:
   - Scales are recalculated whenever data changes or dimensions change
   - Reference lines use the stored scales in `scalesRef`
   - If scales are updated after reference lines are drawn, positions may be inconsistent

### 3. Reference Line Positioning

Reference lines calculate their positions using the scales:
```javascript
// In HorizontalReferenceLine
const yValue = typeof line.value === 'number' ? line.value : parseFloat(line.value)
yPos = yScale(yValue)
```

The position depends entirely on:
1. The scale's domain (data range)
2. The scale's range (pixel height)

### 4. Potential Issues

1. **Scale Synchronization**: If the Chart Card and Chart Preview have different data or load data at different times, their scales will differ

2. **Dimension Timing**: If dimensions are calculated differently or at different times, the pixel ranges will differ

3. **Data Availability**: If one context has data and the other doesn't, they'll use completely different scale domains

## Root Cause Analysis

After adding debug logging, the issue is clear:

1. **Empty Charts vs Data-Filled Charts**:
   - Empty charts (no data) use a fixed Y domain of [0, 100]
   - Charts with data use the actual data extent with 5% padding
   - This causes reference lines to appear at different positions

2. **Data Loading Timing**:
   - Chart Cards may not have data immediately when rendered
   - Chart Preview in modal may load data at a different time
   - This results in different scale domains

## Solution

The fix is to ensure consistent scale domains regardless of data availability. Here are the implementation steps:

### Option 1: Always Use Data-Based Scales (Recommended)
- Wait for data before rendering reference lines
- Use consistent padding for scale domains
- Cache scale domains to prevent shifts during data updates

### Option 2: Fixed Scale Domains for Reference Lines
- Define minimum scale ranges that include all reference line values
- Extend scales to accommodate both data and reference lines
- This ensures reference lines always appear at the same relative position

### Option 3: Normalized Reference Line Positions
- Store reference line positions as percentages rather than absolute values
- Calculate actual positions based on current scale domain
- This makes reference lines adaptive to data ranges

## Implementation Fix

The most straightforward fix is to ensure both contexts use the same scale calculation logic:

### Implemented Solution

Created a utility function `calculateConsistentYDomain` that:
1. Takes into account both data extent and reference line values
2. Ensures the scale domain always includes all reference lines
3. Applies consistent padding
4. Uses a sensible default domain when no data is available

This function is now used in both:
- `ScatterPlot.ts` - When rendering charts with data
- `EmptyChart.ts` - When rendering charts without data

The result is that reference lines will always appear at the same position relative to their values, regardless of:
- Whether the chart has data or not
- The size of the container
- Whether it's displayed in the modal or grid

### Key Changes Made

1. **Created `utils/chart/scaleUtils.ts`**:
   - `calculateConsistentYDomain()` - Ensures Y scales always include reference line values
   - `calculateXDomain()` - Consistent X scale calculation

2. **Updated `ScatterPlot.ts`**:
   - Uses `calculateConsistentYDomain()` instead of manual calculation
   - Ensures reference lines are considered when determining scale

3. **Updated `EmptyChart.ts`**:
   - Uses `calculateConsistentYDomain()` with default domain
   - Reference lines will extend the default [0, 100] domain if needed

### Benefits

1. **Consistency**: Reference lines appear at the same position in all contexts
2. **Flexibility**: Scales adapt to include both data and reference lines
3. **Maintainability**: Single source of truth for scale calculation logic
4. **User Experience**: No jarring position changes when switching between views