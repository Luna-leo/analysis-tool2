import { SearchCondition } from '@/types'
import { isBooleanOperator } from '@/lib/conditionUtils'

/**
 * Validates if all conditions in the array have required fields filled
 */
export function validateConditions(conditions: SearchCondition[]): boolean {
  for (const condition of conditions) {
    if (condition.type === 'condition') {
      // Check if all required fields are filled
      if (!condition.parameter || !condition.operator) {
        return false
      }
      // For boolean operators, value is not required
      if (!isBooleanOperator(condition.operator) && !condition.value) {
        return false
      }
    } else if (condition.type === 'group') {
      // Check if group has conditions and they are valid
      if (!condition.conditions || condition.conditions.length === 0) {
        return false
      }
      // Recursively validate nested conditions
      if (!validateConditions(condition.conditions)) {
        return false
      }
    }
  }
  return true
}

/**
 * Validates condition form including name and conditions
 */
export function validateConditionForm(name: string, conditions: SearchCondition[]): boolean {
  return name.trim().length > 0 && conditions.length > 0 && validateConditions(conditions)
}

/**
 * Gets the dialog title based on the mode
 */
export function getDialogTitle(mode: "create" | "edit" | "duplicate"): string {
  switch (mode) {
    case "edit":
      return "Edit Trigger Condition"
    case "duplicate":
      return "Duplicate Trigger Condition"
    case "create":
    default:
      return "Create New Trigger Condition"
  }
}