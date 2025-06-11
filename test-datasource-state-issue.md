# DataSource State Clearing Issue Analysis

## Problem
When switching from DataSource tab to Parameters tab in ChartEditModal, the selectedDataSourceItems state is cleared. However, it works correctly when setting DataSource after visiting Parameters tab.

## Analysis

### State Flow
1. `ChartEditModal` maintains `selectedDataSourceItems` state
2. This state is passed to both `DataSourceTab` and `ParametersTab` through `TabContent`
3. There's a `useEffect` in `ChartEditModal` that syncs `selectedDataSourceItems` with `editingChart.selectedDataSources`

### Key Code
```typescript
// ChartEditModal.tsx
React.useEffect(() => {
  if (editingChart?.selectedDataSources) {
    setSelectedDataSourceItems(editingChart.selectedDataSources)
  } else {
    setSelectedDataSourceItems([])
  }
}, [editingChart])
```

## Potential Issues

1. **State Synchronization Issue**: The `editingChart` object might be getting updated when switching tabs, triggering the useEffect and resetting the state.

2. **Missing State Persistence**: When switching tabs, the local `selectedDataSourceItems` state is not being saved back to `editingChart.selectedDataSources`.

3. **Save Only on Modal Save**: The current implementation only saves `selectedDataSourceItems` to the chart when the Save button is clicked, not when switching tabs.

## Solution

We need to update the `editingChart.selectedDataSources` whenever `selectedDataSourceItems` changes, not just on save. This ensures the state persists when switching tabs.

### Option 1: Update editingChart on every change
Add a useEffect that syncs selectedDataSourceItems back to editingChart:

```typescript
React.useEffect(() => {
  if (editingChart && selectedDataSourceItems.length > 0) {
    setEditingChart({
      ...editingChart,
      selectedDataSources: selectedDataSourceItems
    })
  }
}, [selectedDataSourceItems])
```

### Option 2: Remove the dependency on editingChart for initialization
Only initialize once when modal opens:

```typescript
React.useEffect(() => {
  if (editModalOpen && editingChart?.selectedDataSources) {
    setSelectedDataSourceItems(editingChart.selectedDataSources)
  }
}, [editModalOpen])
```

### Option 3: Persist state on tab change
Update the editingChart when tab changes:

```typescript
const handleTabChange = (newTab: TabType) => {
  // Save current state before switching
  if (editingChart) {
    setEditingChart({
      ...editingChart,
      selectedDataSources: selectedDataSourceItems
    })
  }
  setActiveTab(newTab)
}
```

## Recommended Solution
Option 3 seems most appropriate as it:
- Maintains state consistency
- Only updates when user actively switches tabs
- Doesn't cause unnecessary re-renders
- Preserves the current save/cancel behavior