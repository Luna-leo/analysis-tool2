# CSV Parameter Extraction from Data Sources

## Meta Information
- **Created**: 2025-01-26
- **Updated**: 2025-01-26
- **Category**: Feature
- **Related Commits**: TBD
- **Affected Components**: 
  - `/utils/dataSourceCSVUtils.ts` (new)
  - `/components/charts/EditModal/parameters/ParameterRow/RegularParameterRow.tsx`
  - `/hooks/useParameterSelection.ts`
  - `/utils/dataSourceParameterUtils.ts`

## Overview
Implemented extraction of parameters from actual CSV data sources instead of using simulated/hardcoded parameters when data sources are selected.

## Details
### Background/Problem
- The application was using TODO comments and simulated parameters when data sources were selected
- Parameters from actual CSV files were not being shown in the parameter selection dropdown
- This limited users' ability to select parameters that exist in their imported CSV data

### Implementation
1. Created new utility file `dataSourceCSVUtils.ts` with functions to:
   - Find CSV datasets matching EventInfo (by plant/machineNo)
   - Extract parameters from CSV datasets
   - Get unique parameters from multiple data sources

2. Updated `RegularParameterRow` component:
   - Added `useCSVDataStore` hook to access CSV data
   - Replaced simulated parameters with actual CSV extraction
   - Uses `getParametersFromDataSources` to get real parameters

3. Updated `useParameterSelection` hook:
   - Added CSV data store integration
   - Removed TODO comment and implemented actual parameter extraction

4. Enhanced `dataSourceParameterUtils.ts`:
   - Added `extractParametersFromCSVDataSet` function for CSVDataSet type

### Technical Details
- The implementation maintains backward compatibility with master parameters
- Parameters are deduplicated by name+unit combination
- Data source parameters are marked with `isFromDataSource: true`
- The UI shows "DS" badge for data source parameters and checkmark for master parameters that exist in data sources

## Usage
1. Import CSV files through the CSV Import feature
2. Select data sources in the chart editor
3. When selecting Y-axis parameters, you'll see:
   - Master parameters (from parameter master)
   - Data source parameters (from imported CSV files) with "DS" badge
   - Master parameters that match data source parameters with checkmark

## Impact
- Parameter selection now shows actual parameters from imported CSV files
- Users can select any parameter that exists in their data
- The parameter list is dynamically updated based on selected data sources
- No changes to CSV parsing or storage logic

## Testing
1. Import CSV files with various parameters
2. Create/edit a chart and select data sources
3. Open parameter selection dropdown
4. Verify that parameters from CSV files appear with "DS" badge
5. Verify that master parameters matching CSV parameters show checkmark
6. Test parameter selection and chart rendering

## Future Improvements
- Add time range filtering for CSV datasets (currently matches all data for same plant/machine)
- Add caching for extracted parameters to improve performance with large datasets
- Consider adding parameter metadata (min/max values, data type) from CSV analysis