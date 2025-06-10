# Search Conditions Manual Setup Scrolling Fix

## Problem
When selecting "Manual Setup" in Search Conditions and adding multiple condition expressions, the content would overflow and become inaccessible without scrolling capability.

## Solution
Implemented proper scrolling for the manual condition builder area by:

### 1. Updated ManualConditionBuilder.tsx
- Changed container to use flex layout with `h-full`
- Made the info section (when customizing from predefined) fixed with `flex-shrink-0`
- Added scrollable wrapper around ConditionBuilder with `overflow-y-auto`

### 2. Updated SearchConditionsSection.tsx
- Added `overflow-hidden` to grid container and condition setup column
- Ensures proper height constraints are applied

### 3. Updated ExpressionPreview.tsx
- Added `max-h-[300px] overflow-y-auto` to expression display area
- Prevents very long expressions from breaking the layout

### 4. Updated SavedConditionsList.tsx
- Added `max-h-[200px] overflow-y-auto` to saved conditions list
- Prevents long lists from overflowing

## Key Changes Summary

```tsx
// ManualConditionBuilder.tsx
<div className="flex flex-col h-full">
  {loadedFromPredefined && (
    <div className={`${infoClasses.container} flex-shrink-0 mb-4`}>
      {/* Info section */}
    </div>
  )}
  <div className="flex-1 overflow-y-auto pr-2">
    <ConditionBuilder />
  </div>
</div>

// SearchConditionsSection.tsx
<div className="grid grid-cols-2 gap-6 flex-1 min-h-0 overflow-hidden">
  <div className="flex flex-col min-h-0 overflow-hidden">
    {/* Condition builder area */}
  </div>
  <div className="flex flex-col min-h-0 overflow-hidden">
    {/* Expression preview area */}
  </div>
</div>
```

## Testing
1. Open the Search Conditions section
2. Select "Manual Setup"
3. Add multiple conditions and groups
4. Verify that scrollbars appear when content exceeds available space
5. All conditions should be accessible via scrolling
6. The layout should remain stable without content pushing other elements