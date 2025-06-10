# CSV Import Feature Test Instructions

## Summary
The CSV Import feature has been implemented with two access points:
1. **As a Dialog**: From ChartEditModal's DataSource tab (for quick import during chart editing)
2. **As a Full Page Tab**: From the Sidebar's Database section (for bulk import operations)

## Changes Made

### 1. Fixed React Hook Error
- Replaced all instances of `useAnalysisStore` with individual store hooks (`useFileStore`, `useUIStore`, `useLayoutStore`, `useViewStore`)
- This fixes the "Expected static flag was missing" React error

### 2. Components Updated
- `Sidebar.tsx`: Uses individual stores, opens CSV Import as a tab
- `ChartGrid.tsx`: Renders CSVImportPage for csv-import type nodes
- `ChartEditModal.tsx`: Uses `useUIStore`
- `ChartCard.tsx`: Uses `useUIStore`
- `FileExplorer.tsx`: Uses `useFileStore`
- `FileTreeNode.tsx`: Uses `useFileStore`
- `LayoutSettings.tsx`: Uses `useLayoutStore`
- `TabBar.tsx`: Uses `useFileStore`
- `AnalysisTool.tsx`: Uses `useFileStore`

### 3. New Components
- `CSVImportPage`: Full-page CSV import interface with preview and validation
- `ImportCSVDialog`: Dialog version for quick imports
- `csvUtils.ts`: CSV parsing and validation utilities

### 4. Type Updates
- Added `CSVDataSourceType`: "SSAC" | "SCA" | "INOMOT"
- Extended `FileNode` type to include "csv-import" type
- Added `isSystemNode` flag for non-removable nodes

## Testing Steps

1. **Test CSV Import as Tab**:
   - Click on the Database icon in the sidebar
   - Click "CSV Import" button
   - A new tab should open with the CSV Import page
   - Test file selection, validation, and preview features

2. **Test CSV Import as Dialog**:
   - Open any chart for editing
   - Go to the Data Source tab
   - Click "Import CSV" button
   - The Import CSV dialog should open
   - Test importing CSV files

3. **Verify No React Errors**:
   - Check the browser console for any React errors
   - The "Expected static flag was missing" error should be resolved

## Features
- Data source type selection (SSAC, SCA, INOMOT)
- Plant and Machine No configuration
- File selection via button or drag & drop
- Folder selection support
- CSV validation with column checking
- Preview of imported data
- Bulk import status tracking