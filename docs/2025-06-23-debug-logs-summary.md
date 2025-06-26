# Debug Logs Added for Plot Style Investigation

## Summary
This document listed all debug console.log statements that were added during the investigation of plot style real-time update issues. 

**UPDATE (2025-06-23)**: All debug logs have been removed as part of the refactoring. The feature is now stable and production-ready.

## Debug Logs Location

### 1. `/components/charts/ChartPreviewGraph.tsx`
- **Line 194-201**: Logs mergedChart updates with plotStyles details
  ```javascript
  console.log('[ChartPreviewGraph] mergedChart updated:', {
    editingChartPlotStyles: editingChart.plotStyles,
    mergedChartPlotStyles: merged.plotStyles,
    plotStylesMode: merged.plotStyles?.mode || merged.legendMode || 'datasource',
    chartId: editingChart.id,
    plotStyles: merged.plotStyles,
    legendMode: merged.legendMode
  })
  ```

### 2. `/components/charts/ChartLegend.tsx`
- **Line 112-121**: Logs when ChartLegend renders with plotStyles
  ```javascript
  console.log('[ChartLegend] Rendering with editingChart:', {
    chartId: editingChart.id,
    mode,
    plotStyles: editingChart.plotStyles,
    hasPlotStyles: !!editingChart.plotStyles,
    plotStylesByMode: mode === 'datasource' ? editingChart.plotStyles?.byDataSource : 
                     mode === 'parameter' ? editingChart.plotStyles?.byParameter : 
                     editingChart.plotStyles?.byBoth
  })
  ```

### 3. `/components/charts/EditModal/appearance/PlotStyleSettings/PlotStyleTable.tsx`
- **Line 32-40**: React effect logging plotStyles changes
  ```javascript
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[PlotStyleTable] editingChart.plotStyles changed:', {
        chartId: editingChart.id,
        plotStyles: editingChart.plotStyles,
        mode: editingChart.plotStyles?.mode || editingChart.legendMode || 'datasource'
      })
    }
  }, [editingChart.plotStyles])
  ```

### 4. `/components/charts/EditModal/appearance/PlotStyleSettings/hooks/usePlotStyleUpdate.ts`
- **Line 159-172**: Enhanced updateLegend logging
  ```javascript
  console.log('[usePlotStyleUpdate] Updating legend text:', { 
    mode, 
    dataSourceId, 
    paramIndex, 
    legendText, 
    currentPlotStyles: editingChart.plotStyles,
    newPlotStyles: plotStyles,
    willUpdate: mode === 'datasource' ? plotStyles.byDataSource[dataSourceId] :
                mode === 'parameter' ? plotStyles.byParameter[paramIndex] :
                plotStyles.byBoth[`${dataSourceId}-${paramIndex}`]
  })
  console.log('[usePlotStyleUpdate] Calling setEditingChart with:', newChart)
  ```

### 5. `/stores/useUIStore.ts`
- **Line 71-77**: Logs when setEditingChart is called
  ```javascript
  if (process.env.NODE_ENV === 'development' && chart) {
    console.log('[UIStore] setEditingChart called with:', {
      chartId: chart.id,
      hasPlotStyles: !!chart.plotStyles,
      plotStylesMode: chart.plotStyles?.mode || chart.legendMode || 'datasource'
    })
  }
  ```

## Note
All debug logs are wrapped with `process.env.NODE_ENV === 'development'` checks, so they won't appear in production builds. They can be safely left in the code or removed once the feature is stable.