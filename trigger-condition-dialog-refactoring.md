# Trigger Condition Dialog Refactoring

## Overview
This document describes the refactoring of the trigger condition dialog components to reduce code duplication and improve maintainability.

## Changes Made

### 1. Created BaseTriggerConditionDialog Component
- **Location**: `/components/dialogs/BaseTriggerConditionDialog.tsx`
- **Purpose**: Provides a shared base component for all trigger condition dialogs
- **Features**:
  - Encapsulates the common logic for rendering `ConditionBuilderFullscreen`
  - Provides utility functions for condition expression generation and validation
  - Handles the `isFullscreen={true}` configuration consistently

### 2. Refactored TriggerConditionDialog
- **Location**: `/components/trigger-condition-master/TriggerConditionDialog.tsx`
- **Changes**:
  - Now uses `BaseTriggerConditionDialog` instead of directly using `ConditionBuilderFullscreen`
  - Removed Dialog wrapper components (was causing scrolling issues)
  - Uses shared utility functions from the base component

### 3. Refactored TriggerConditionEditDialog
- **Location**: `/components/dialogs/TriggerConditionEditDialog.tsx`
- **Changes**:
  - Now uses `BaseTriggerConditionDialog` instead of directly using `ConditionBuilderFullscreen`
  - Maintains the same functionality with less code duplication

## Benefits

1. **Consistency**: Both dialogs now use the same underlying implementation
2. **Maintainability**: Changes to dialog behavior only need to be made in one place
3. **Scrolling Fix**: Both dialogs now properly support scrolling for long condition lists
4. **Code Reduction**: Eliminated duplicate code between the two dialog implementations

## Usage

Both dialogs maintain their existing APIs and can be used as before:

```tsx
// From Trigger Condition Master
<TriggerConditionDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  onSave={handleSave}
  initialCondition={condition}
  mode="edit"
/>

// From Chart Edit Modal (ComboBox)
<TriggerConditionEditDialog />
```

## Architecture

```
BaseTriggerConditionDialog (shared base component)
├── TriggerConditionDialog (prop-based control)
└── TriggerConditionEditDialog (store-based control)
```

Both dialogs now render `ConditionBuilderFullscreen` with `isFullscreen={true}`, ensuring consistent behavior and proper scrolling support.