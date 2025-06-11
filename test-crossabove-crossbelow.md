# Test: Cross Above/Cross Below Operators

## Test Example

Let's create a new trigger condition to test the cross above/cross below functionality:

### Example Condition
```typescript
{
  id: 'temp_cross_threshold',
  name: 'Temperature Crosses Threshold',
  description: 'Detects when temperature crosses above 75°C or pressure crosses below 10 bar',
  expression: 'temperature crosses above 75 OR pressure crosses below 10',
  conditions: [
    { 
      id: 'cond_cross_group', 
      type: 'group',
      conditions: [
        { 
          id: 'cond_temp_cross', 
          type: 'condition', 
          parameter: 'temperature', 
          operator: 'crossAbove', 
          value: '75' 
        },
        { 
          id: 'cond_pressure_cross', 
          type: 'condition', 
          parameter: 'pressure', 
          operator: 'crossBelow', 
          value: '10', 
          logicalOperator: 'OR' 
        }
      ]
    }
  ]
}
```

## Implementation Status

### ✅ Completed
1. Added `crossAbove` and `crossBelow` to `OperatorType` in `/types/index.ts`
2. Added operator labels in `conditionUtils.tsx`:
   - `crossAbove: 'crosses above'`
   - `crossBelow: 'crosses below'`
3. Updated expression formatting logic to handle new operators
4. Updated color coding logic for expression strings

### 🔄 UI Components Updated
The new operators will automatically appear in:
- ImprovedManualConditionBuilder dropdown
- TriggerConditionSelector
- Condition expression displays

### 📝 Usage Notes
- `crossAbove`: Triggers when a parameter transitions from below to above the specified value
- `crossBelow`: Triggers when a parameter transitions from above to below the specified value
- These operators are useful for detecting state changes rather than static conditions