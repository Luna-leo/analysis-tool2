import React from "react"
import { Plus, Minus, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SearchCondition } from "@/types"
import { operatorLabels, generateConditionId } from "@/lib/conditionUtils"

interface ConditionBuilderProps {
  conditions: SearchCondition[]
  onChange: (conditions: SearchCondition[]) => void
  level?: number
}

export const ConditionBuilder: React.FC<ConditionBuilderProps> = ({ 
  conditions, 
  onChange, 
  level = 0 
}) => {
  const addCondition = (index?: number) => {
    const newCondition: SearchCondition = {
      id: generateConditionId(),
      type: 'condition',
      parameter: '',
      operator: 'gt',
      value: ''
    }
    
    if (typeof index === 'number') {
      const newConditions = [...conditions]
      newConditions.splice(index + 1, 0, newCondition)
      onChange(newConditions)
    } else {
      onChange([...conditions, newCondition])
    }
  }

  const addGroup = (index?: number) => {
    const newGroup: SearchCondition = {
      id: generateConditionId(),
      type: 'group',
      conditions: [
        { id: generateConditionId(), type: 'condition', parameter: '', operator: 'gt', value: '' }
      ]
    }
    
    if (typeof index === 'number') {
      const newConditions = [...conditions]
      newConditions.splice(index + 1, 0, newGroup)
      onChange(newConditions)
    } else {
      onChange([...conditions, newGroup])
    }
  }

  const updateCondition = (id: string, updates: Partial<SearchCondition>) => {
    const updateRecursive = (items: SearchCondition[]): SearchCondition[] => {
      return items.map(item => {
        if (item.id === id) {
          return { ...item, ...updates }
        } else if (item.type === 'group' && item.conditions) {
          return { ...item, conditions: updateRecursive(item.conditions) }
        }
        return item
      })
    }
    onChange(updateRecursive(conditions))
  }

  const removeCondition = (id: string) => {
    const removeRecursive = (items: SearchCondition[]): SearchCondition[] => {
      return items.filter(item => {
        if (item.id === id) return false
        if (item.type === 'group' && item.conditions) {
          item.conditions = removeRecursive(item.conditions)
        }
        return true
      })
    }
    onChange(removeRecursive(conditions))
  }

  const updateGroupConditions = (groupId: string, newConditions: SearchCondition[]) => {
    updateCondition(groupId, { conditions: newConditions })
  }

  return (
    <div className={`space-y-2 ${level > 0 ? 'ml-4 pl-4 border-l-2 border-muted' : ''}`}>
      {conditions.map((condition, index) => (
        <div key={condition.id}>
          {/* Logical operator for non-first items */}
          {index > 0 && (
            <div className="flex items-center mb-2">
              <select
                value={condition.logicalOperator || 'AND'}
                onChange={(e) => updateCondition(condition.id, { 
                  logicalOperator: e.target.value as 'AND' | 'OR' 
                })}
                className="w-16 h-6 px-1 border rounded text-xs mr-2"
              >
                <option value="AND">AND</option>
                <option value="OR">OR</option>
              </select>
            </div>
          )}

          {condition.type === 'condition' ? (
            // Simple condition
            <div className="flex items-center gap-2 p-2 border rounded-lg bg-background">
              <Input
                placeholder="Parameter"
                value={condition.parameter || ''}
                onChange={(e) => updateCondition(condition.id, { parameter: e.target.value })}
                className="flex-1 h-8 text-sm"
              />
              
              <select
                value={condition.operator || 'gt'}
                onChange={(e) => updateCondition(condition.id, { 
                  operator: e.target.value as SearchCondition['operator'] 
                })}
                className="w-16 h-8 px-2 border rounded text-sm"
              >
                {Object.entries(operatorLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              
              <Input
                placeholder="Value"
                value={condition.value || ''}
                onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                className="w-24 h-8 text-sm"
              />

              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addCondition(index)}
                  className="h-8 w-8 p-0"
                  title="Add condition"
                >
                  <Plus className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addGroup(index)}
                  className="h-8 w-8 p-0"
                  title="Add group"
                >
                  <ChevronDown className="h-3 w-3" />
                </Button>
                {conditions.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeCondition(condition.id)}
                    className="h-8 w-8 p-0"
                    title="Remove"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          ) : (
            // Group condition
            <div className="border rounded-lg p-3 bg-muted/30">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium">Group</span>
                <span className="text-xs text-muted-foreground">(Nested conditions)</span>
                
                <div className="flex gap-1 ml-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addGroup(index)}
                    className="h-7 w-7 p-0"
                    title="Add group"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeCondition(condition.id)}
                    className="h-7 w-7 p-0"
                    title="Remove group"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <ConditionBuilder
                conditions={condition.conditions || []}
                onChange={(newConditions) => updateGroupConditions(condition.id, newConditions)}
                level={level + 1}
              />
            </div>
          )}
        </div>
      ))}
      
      {level === 0 && (
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => addCondition()}
            className="h-8"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Condition
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => addGroup()}
            className="h-8"
          >
            <ChevronDown className="h-3 w-3 mr-1" />
            Add Group
          </Button>
        </div>
      )}
    </div>
  )
}