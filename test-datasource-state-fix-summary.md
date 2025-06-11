# DataSource State Issue - Fix Summary

## Problem
The DataSource settings were being cleared when switching from the DataSource tab to the Parameters tab in the ChartEditModal. This happened because the `selectedDataSourceItems` state was only persisted to `editingChart` when the Save button was clicked, not when switching tabs.

## Root Cause
The `useEffect` hook that initializes `selectedDataSourceItems` from `editingChart.selectedDataSources` was triggered whenever `editingChart` changed. When switching tabs, if the `editingChart` object was updated for any reason (like other components modifying it), it would re-initialize the state, potentially clearing unsaved changes.

## Solution Implemented
Added a `handleTabChange` function that:
1. Saves the current `selectedDataSourceItems` to `editingChart.selectedDataSources` before switching tabs
2. This ensures state persistence across tab switches without waiting for the Save button

## Changes Made

### 1. Added `handleTabChange` function in ChartEditModal.tsx:
```typescript
const handleTabChange = (newTab: TabType) => {
  // Save current state before switching tabs
  if (editingChart) {
    setEditingChart({
      ...editingChart,
      selectedDataSources: selectedDataSourceItems
    })
  }
  setActiveTab(newTab)
}
```

### 2. Updated TabNavigation to use the new handler:
```typescript
<TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />
```

### 3. Added tab reset on modal open:
```typescript
// Reset to datasource tab when modal opens
React.useEffect(() => {
  if (editModalOpen) {
    setActiveTab("datasource")
  }
}, [editModalOpen])
```

## Benefits
1. **State Persistence**: DataSource selections are now preserved when switching between tabs
2. **Consistent Behavior**: The state behaves the same regardless of the order in which tabs are visited
3. **No Data Loss**: Users won't lose their selections when navigating between tabs
4. **Clean Reset**: Modal always opens on the DataSource tab for a consistent starting point

## Testing
To verify the fix:
1. Open a chart edit modal
2. Add some data sources in the DataSource tab
3. Switch to Parameters tab - the data sources should remain
4. Switch back to DataSource tab - the selections should still be there
5. Cancel the modal and reopen - it should reset to the original state
6. Make changes and save - the changes should persist correctly