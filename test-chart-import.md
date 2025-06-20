# Test Instructions for Chart Import Fix

## Problem
When creating a new page with charts using the "Create new page" option in the import configuration dialog, the charts were not displayed immediately. They only appeared after reloading the page.

## Root Cause
The ChartGrid component was using the `file` prop passed from the parent, which wasn't updated with the new charts immediately. This was because the file object in the component tree wasn't refreshed when charts were added to the store.

## Solution
1. Modified ChartGrid, VirtualizedChartGrid, and ProgressiveChartGrid to get the current file from `openTabs` in the store instead of relying on the prop
2. Updated `handleCreateNewPage` to use `createNewFileWithConfig` from the store, which properly handles chart assignment
3. Adjusted the tab reset effect to not interfere with newly created files that already have charts

## Test Steps
1. Start the application
2. Import some CSV data (if not already done)
3. Create a chart configuration:
   - Open any existing file or create a new one
   - Add some charts to it
   - Use the Config menu > Export Configuration to save the configuration
4. Test the fix:
   - Click Config menu > Import Configuration
   - Choose "Create new page" option
   - Enter a name for the new page
   - Click Import
5. **Expected Result**: The new page should open immediately with all charts visible
6. **Previous Behavior**: Charts would not appear until after a page reload

## Files Modified
- `/components/charts/ChartGrid.tsx` - Get current file from openTabs
- `/components/charts/VirtualizedChartGrid.tsx` - Get current file from openTabs
- `/components/charts/ProgressiveChartGrid.tsx` - Get current file from openTabs
- `/components/analysis/AnalysisTool.tsx` - Use createNewFileWithConfig from store

## Key Changes
1. Added `openTabs` to the destructured values from `useFileStore()`
2. Added `const currentFile = openTabs.find(tab => tab.id === file.id) || file`
3. Replaced all references to `file.charts`, `file.selectedDataSources`, and `file.dataSourceStyles` with `currentFile.*`
4. Updated the tab reset effect to check if the file already has charts before resetting dimensions
5. Changed `handleCreateNewPage` to use the store's `createNewFileWithConfig` method