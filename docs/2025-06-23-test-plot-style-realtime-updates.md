# Plot Style Real-time Update Test Guide

## Test Overview
This guide helps verify that Style Settings changes reflect in real-time in the Chart Preview after implementing fixes for undefined plotStyles.

## Prerequisites
1. Start the development server: `npm run dev`
2. Open browser console to monitor for errors
3. Have some CSV data imported with multiple data sources

## Test Cases

### Test 1: New Chart Creation with plotStyles
**Steps:**
1. Open a file with data sources
2. Click the + button to create a new chart
3. In browser console, check for any "undefined plotStyles" errors
4. Open browser DevTools and inspect the chart component props

**Expected Result:**
- No console errors about undefined plotStyles
- Chart should have plotStyles initialized with:
  ```javascript
  plotStyles: {
    mode: 'datasource',
    byDataSource: {},
    byParameter: {},
    byBoth: {}
  }
  ```

### Test 2: Chart Duplication Preserves plotStyles
**Steps:**
1. Create a chart and configure some plot styles (colors, legend text)
2. Duplicate the chart using the duplicate button
3. Open the duplicated chart in edit modal

**Expected Result:**
- Duplicated chart should have the same plot style settings
- No console errors about undefined plotStyles

### Test 3: Real-time Legend Text Updates
**Steps:**
1. Open a chart in edit modal
2. Navigate to "Plot Styles" section
3. Change the mode to "By Parameter" or "By Data Source"
4. Modify the Legend text for any item
5. Observe the Chart Preview on the right

**Expected Result:**
- Legend text should update immediately in the preview
- No need to close/reopen modal or save

### Test 4: Real-time Color Changes
**Steps:**
1. In the Plot Styles section, click on a color picker
2. Select a different color
3. Observe the Chart Preview

**Expected Result:**
- Plot line/marker colors should update immediately
- Legend colors should also update in real-time

### Test 5: Real-time Visibility Toggle
**Steps:**
1. In the Plot Styles section, toggle the visibility checkbox for any item
2. Observe the Chart Preview

**Expected Result:**
- Plot lines/markers should hide/show immediately
- Legend should update to reflect visible items only

### Test 6: Y Parameter Change Updates Legend
**Steps:**
1. Change to "By Parameter" mode in Plot Styles
2. Change a Y parameter in the Parameters section
3. Check if the legend text updates automatically

**Expected Result:**
- Legend text should update to match the new parameter name

### Test 7: Persistence After Modal Close
**Steps:**
1. Make several plot style changes (colors, legend, visibility)
2. Save and close the edit modal
3. Reopen the same chart

**Expected Result:**
- All plot style settings should be preserved
- Chart preview should show the saved styles

## Console Monitoring
Throughout testing, monitor the browser console for:
- No errors containing "plotStyles undefined"
- No errors about "Cannot read property 'byDataSource' of undefined"
- No React hook warnings

## Debug Logging
If issues persist, you can add temporary debug logging to verify plotStyles flow:

```javascript
// In ChartPreview.tsx
console.log('[ChartPreview] editingChart.plotStyles:', editingChart?.plotStyles)

// In ChartPreviewGraph.tsx
console.log('[ChartPreviewGraph] Received plotStyles:', plotStyles)
```

## Troubleshooting
If real-time updates still don't work:
1. Check if ChartPreviewGraph is re-rendering when plotStyles change
2. Verify plotStyles is included in memo comparison
3. Check if setEditingChart is being called with updated plotStyles
4. Ensure no stale closures are capturing old plotStyles values

### Using the PlotStyleDebugger Component
A debug component is available at `/components/debug/PlotStyleDebugger.tsx`. To use it:

1. Import it in ChartEditModal.tsx:
   ```typescript
   import { PlotStyleDebugger } from '@/components/debug/PlotStyleDebugger'
   ```

2. Add it inside the modal content:
   ```typescript
   {editingChart && (
     <PlotStyleDebugger 
       plotStyles={editingChart.plotStyles} 
       chartId={editingChart.id} 
     />
   )}
   ```

This will display a floating debug panel showing:
- Update count (increments when plotStyles change)
- Last update timestamp
- Current plotStyles mode and structure
- Full JSON of plotStyles object