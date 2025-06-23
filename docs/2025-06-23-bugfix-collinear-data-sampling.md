# Fix for Collinear Data Sampling Issue

## Meta Information
- **Created**: 2025-06-23
- **Updated**: 2025-06-23
- **Category**: Bug Fix
- **Related Commits**: [pending]
- **Affected Components**: 
  - `/utils/sampling/collinearity.ts` (new file)
  - `/utils/sampling/adaptive.ts`
  - `/utils/sampling/index.ts`
  - `/hooks/useOptimizedChart.ts`

## Overview
Fixed an issue where selecting the same parameter for both X and Y axes in High Performance mode resulted in only displaying the start and end points instead of properly sampled intermediate points.

## Details
### Background/Problem
When users selected the same parameter for both X and Y axes:
- All data points formed a perfect diagonal line (x = y)
- The LTTB (Largest Triangle Three Buckets) sampling algorithm failed
- Only the first and last points were displayed, missing all intermediate points

The root cause was that LTTB calculates triangular areas to determine point importance. For collinear data (points on a straight line), all triangular areas are zero, causing the algorithm to fail at selecting intermediate points.

### Implementation
1. **Collinearity Detection**: Added a new utility module `/utils/sampling/collinearity.ts` that:
   - Detects if data points are collinear (form a straight line)
   - Includes special handling for X=Y cases
   - Uses geometric calculations with configurable tolerance

2. **Fallback Strategy**: Modified the sampling algorithms to:
   - Check for collinearity before applying LTTB
   - Check for collinearity before applying Douglas-Peucker (for scatter plots)
   - Use stratified nth-point sampling for collinear data
   - Preserve original behavior for non-collinear data

3. **Updated Sampling Logic**:
   - `adaptive.ts`: Added collinearity check before LTTB usage
   - `index.ts`: Added fallback for both LTTB and Douglas-Peucker methods
   - `useOptimizedChart.ts`: Fixed 'auto' method to properly use adaptive sampling

4. **Debug Logging**: Added comprehensive debug logging to trace:
   - Sampling method selection
   - Data point counts and series information
   - Collinearity detection results
   - Actual sampling operations

### Technical Details
The collinearity detection works by:
- Sampling up to 100 points from the dataset
- Finding three distinct points and calculating the triangular area
- If area is near zero, checking additional points to confirm collinearity
- Using cross-product method to verify points lie on the same line

## Usage
No user-facing changes required. The fix automatically applies when:
- High Performance mode is active (500 sampling points)
- The same parameter is selected for both X and Y axes
- Any other scenario resulting in collinear data

## Impact
- Improves data visualization accuracy for diagonal/collinear data
- No performance impact for non-collinear data
- Maintains backward compatibility with existing sampling behavior

## Testing
Verified the fix by:
1. Creating test data where X = Y (1000 points)
2. Confirming that 501 evenly distributed points are displayed (including extremes)
3. Verifying non-collinear data still uses LTTB algorithm
4. Testing edge cases (2 points, empty data)
5. Added debug logging to trace actual execution in the application
6. Fixed 'auto' method to properly delegate to adaptive sampling with collinearity detection

### Debug Output
The implementation includes development-mode logging that shows:
- When sampling is triggered and with what parameters
- Which sampling method is selected
- Whether collinearity is detected
- How many points are in each data series

## Future Improvements
- Consider adding user notification when collinearity is detected
- Potentially expose sampling method selection in UI for advanced users
- Add performance metrics for different sampling methods