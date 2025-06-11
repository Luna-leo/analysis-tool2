# Input History Feature Implementation

## Overview
Implemented input history functionality for Plant and Machine No fields in CSV Import and Manual Entry dialogs. This feature remembers previously entered values and provides them as suggestions for easier subsequent data entry.

## Implementation Details

### 1. Created Input History Store
- **File**: `/stores/useInputHistoryStore.ts`
- Manages Plant and Machine No input history
- Persists data to localStorage using zustand persist middleware
- Tracks usage count and last used timestamp
- Limits history to 20 most frequently used items
- Sorts suggestions by usage frequency

### 2. Created Reusable Input Combobox Component
- **File**: `/components/ui/input-combobox.tsx`
- Combines Input field with dropdown suggestions
- Allows both selection from suggestions and custom value entry
- Filters suggestions based on typed text
- Provides clear UI with dropdown arrow indicator

### 3. Updated PlantMachineFields Component
- **File**: `/components/charts/EditModal/parameters/PlantMachineFields.tsx`
- Replaced Input components with InputCombobox
- Integrated with useInputHistoryStore
- Added onSave prop for controlled history saving

### 4. Updated Import/Entry Dialogs
- **ImportCSVDialog**: `/components/dialogs/ImportCSVDialog.tsx`
  - Uses PlantMachineFields component
  - Saves to history on successful import
- **ManualEntryDialog**: `/components/dialogs/ManualEntryDialog.tsx`
  - Uses PlantMachineFields component
  - Saves to history only for new entries (not edits)
- **DataSourceInfoSection**: `/components/csv-import/DataSourceInfoSection.tsx`
  - Uses PlantMachineFields component
- **useCSVImport hook**: `/hooks/useCSVImport.ts`
  - Saves to history on successful import

## Features
1. **Auto-suggestions**: Previous Plant and Machine No entries appear as dropdown suggestions
2. **Frequency-based sorting**: Most used values appear first
3. **Search filtering**: Suggestions filter as you type
4. **Persistence**: History survives page reloads via localStorage
5. **Custom values**: Users can still enter new values not in history
6. **Smart saving**: History only updated on successful operations

## Usage
1. When entering Plant or Machine No, previously used values appear as suggestions
2. Click the dropdown arrow or start typing to see suggestions
3. Select from dropdown or continue typing a new value
4. Values are automatically saved to history on successful import/entry
5. History is shared across all dialogs using these fields

## Testing Checklist
- [ ] Enter new Plant/Machine values in Import CSV dialog
- [ ] Verify values appear as suggestions on next use
- [ ] Test suggestion filtering by typing partial matches
- [ ] Verify history persists after page reload
- [ ] Test in Manual Entry dialog
- [ ] Verify edit mode doesn't save to history
- [ ] Check frequency-based sorting (most used first)
- [ ] Test with 20+ unique values (limit enforcement)