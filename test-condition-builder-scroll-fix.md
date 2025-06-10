# Condition Builder Scrolling Fix - Updated

## Problem
The Condition Builder panel in Manual Setup mode was not scrollable when conditions exceeded the available height.

## Root Cause
The issue was caused by multiple `overflow-hidden` classes in the component hierarchy and missing height constraints for proper flex layout behavior.

## Solution

### 1. Removed excessive overflow-hidden
- Removed `overflow-hidden` from CollapsibleContent
- Kept only necessary overflow constraints

### 2. Used absolute positioning for ManualConditionBuilder
- Wrapped ManualConditionBuilder in `absolute inset-0` container
- This ensures it takes the full height of its relative parent
- The ManualConditionBuilder itself has `h-full` and internal scrolling

### 3. Added min-h-0 to flex containers
- Added `min-h-0` to allow flex items to shrink below their content size
- This is crucial for proper scrolling in flex layouts

## Key Changes

```tsx
// SearchConditionsSection.tsx
// Before:
<div className="flex-1 min-h-0 overflow-hidden">
  <ManualConditionBuilder ... />
</div>

// After:
<div className="flex-1 min-h-0 relative">
  <div className="absolute inset-0">
    <ManualConditionBuilder ... />
  </div>
</div>

// ManualConditionBuilder.tsx
<div className="flex-1 overflow-y-auto pr-2 min-h-0">
  <div className="pb-4">
    <ConditionBuilder ... />
  </div>
</div>
```

## Testing Steps
1. Open Search Conditions section
2. Select "Manual Setup"
3. Add multiple conditions and groups (10+ conditions)
4. Verify scrollbar appears in the Condition Builder area
5. All conditions should be accessible via scrolling
6. The expression preview on the right should update as you add conditions