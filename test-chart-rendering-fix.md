# Chart Rendering Fix Test

## Problem
Charts were not rendering in ChartCard despite settings being saved. The issue was that selected data sources were not being persisted with the chart data.

## Root Causes Identified

1. **ChartCard.tsx** always passed `selectedDataSourceItems={[]}` to ChartPreviewGraph
2. **ChartPreviewGraph.tsx** only collects data when `selectedDataSourceItems.length > 0`
3. **ChartEditModal.tsx** maintained `selectedDataSourceItems` as local state but didn't save it
4. **ChartComponent type** didn't have a field to store selected data sources

## Solution Implemented

### 1. Added `selectedDataSources` field to ChartComponent type
```typescript
// In types/index.ts
export interface ChartComponent {
  // ... existing fields
  selectedDataSources?: EventInfo[]
}
```

### 2. Updated ChartEditModal to save selected data sources
```typescript
// In ChartEditModal.tsx
const handleSave = () => {
  // Update the chart with selected data sources
  const updatedChart = {
    ...editingChart,
    selectedDataSources: selectedDataSourceItems
  }
  // ... save logic
}
```

### 3. Added initialization of selectedDataSourceItems
```typescript
// In ChartEditModal.tsx
React.useEffect(() => {
  if (editingChart?.selectedDataSources) {
    setSelectedDataSourceItems(editingChart.selectedDataSources)
  } else {
    setSelectedDataSourceItems([])
  }
}, [editingChart])
```

### 4. Updated ChartCard to pass stored data sources
```typescript
// In ChartCard.tsx
<ChartPreviewGraph 
  editingChart={chart} 
  selectedDataSourceItems={chart.selectedDataSources || []} 
/>
```

## Testing Steps

1. Open a file in the analysis tool
2. Create or edit a chart
3. In the Data Source tab, add some data sources
4. Configure chart parameters
5. Save the chart
6. The chart should now render with data in the ChartCard
7. Close and reopen the file - the chart should still render with data

## Expected Behavior

- Charts now persist their selected data sources
- Charts render properly in ChartCard after being saved
- Selected data sources are restored when reopening the edit modal
- Charts continue to render after closing and reopening files