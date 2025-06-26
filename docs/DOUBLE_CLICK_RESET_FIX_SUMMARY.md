# Double-Click Reset Fix Summary

## Problem
Double-click reset functionality was not working in ChartPreview component, particularly when used within ChartEditModal.

## Root Causes Identified

1. **Missing zoom props in ChartEditModal**: The ChartEditModal was not passing zoom-related props to ChartPreview, relying on defaults.

2. **Timing issue with double-click handler**: The double-click handler was being set up in a separate useEffect, which could cause timing issues with the zoom behavior initialization.

3. **Event handling conflict**: The zoom behavior filter was preventing double-click events, but the separate handler setup might not have been properly attached.

## Changes Made

### 1. ChartEditModal.tsx (line 393-401)
Added explicit zoom props to ChartPreview:
```tsx
<ChartPreview
  editingChart={editingChart}
  selectedDataSourceItems={selectedDataSourceItems}
  setEditingChart={setEditingChart}
  dataSourceStyles={dataSourceStyles}
  enableZoom={true}
  enablePan={true}
  zoomMode="auto"
/>
```

### 2. useChartZoom.ts (line 452-485)
Moved double-click handler setup into the main zoom initialization effect:
- Handler is now set up immediately after zoom behavior is applied
- Uses proper event parameter syntax for D3 v6+
- Includes debug logging
- Directly resets zoom state and saves to localStorage

### 3. useChartZoom.ts (line 777)
Removed the separate useEffect that was setting up double-click handler to avoid timing conflicts.

### 4. Added Debug Logging
- Log when double-click events are filtered
- Log when double-click handler is set up
- Log when double-click reset is triggered

## Testing

Created test page at `/test-double-click` to verify:
1. Double-click reset works in direct ChartPreview usage
2. Double-click reset works when ChartPreview is inside ChartEditModal
3. All zoom features (wheel zoom, pan, shift+drag selection) continue to work

## How It Works Now

1. When the SVG element is created and zoom behavior is initialized, the double-click handler is immediately attached.
2. The zoom behavior filter prevents D3's default double-click zoom, allowing our custom handler to work.
3. When double-clicked, the handler:
   - Prevents event propagation
   - Resets zoom state to identity (k=1, x=0, y=0)
   - Applies the transform with animation
   - Saves the reset state to localStorage

## Verification Steps

1. Navigate to `/test-double-click`
2. Zoom in using mouse wheel or shift+drag
3. Double-click to reset - should animate back to original view
4. Click "Open Chart in Modal" and repeat the test
5. Check browser console for debug logs confirming handler attachment and triggering