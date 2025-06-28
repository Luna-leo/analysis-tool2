# CSV Import Fix Summary

## Problem
The "Maximum call stack size exceeded" error was caused by an infinite recursion in the CSV import flow:

1. `ImportCSVDialog` calls its `onImport` prop (which is `handleCSVImport` from `DataSourceTab`)
2. `handleCSVImport` in `DataSourceTab` was calling `csvImport.handleImport()` 
3. This created a circular dependency where the import was being triggered multiple times

## Solution
Modified `handleCSVImport` in `DataSourceTab.tsx` to:
- Remove the use of `useCSVImport` hook
- Directly use the `createCSVImportService` to handle the import
- Process the CSV data and add it to the period pool without triggering another import cycle

## Changes Made
1. Removed the `useCSVImport` hook and related code from `DataSourceTab.tsx`
2. Rewrote `handleCSVImport` to use `createCSVImportService` directly
3. Removed unused imports

## Testing
To test the fix:
1. Open the application
2. Navigate to a chart edit modal
3. Go to the Data Source tab
4. Click on "Import CSV"
5. Select CSV files and fill in the required fields
6. Click Import
7. The import should complete without errors