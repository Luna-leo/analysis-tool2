import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Minus, ChevronDown } from 'lucide-react';
import { SearchCondition } from '@/types';
import { cn } from '@/lib/utils';
import { generateConditionId, operatorLabels } from '@/lib/conditionUtils';

interface ImprovedManualConditionBuilderProps {
  conditions: SearchCondition[];
  onConditionsChange: (conditions: SearchCondition[]) => void;
}

interface ConditionGroupProps {
  group: SearchCondition;
  index: number;
  isNested: boolean;
  onUpdate: (index: number, updates: Partial<SearchCondition>) => void;
  onRemove: (index: number) => void;
  renderCondition: (condition: SearchCondition, index: number, isNested: boolean, isGroupChild: boolean) => React.ReactNode;
}


function ConditionGroup({ group, index, isNested, onUpdate, onRemove, renderCondition }: ConditionGroupProps) {
  const handleUpdateGroupConditions = (groupConditions: SearchCondition[]) => {
    onUpdate(index, { ...group, conditions: groupConditions });
  };

  return (
    <div key={group.id} className="border rounded-lg p-3 bg-muted/30">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-medium">Group</span>
        <span className="text-xs text-muted-foreground">(Nested conditions)</span>
        
        <div className="flex gap-1 ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRemove(index)}
            className="h-7 w-7 p-0"
            title="Remove group"
          >
            <Minus className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      <ImprovedManualConditionBuilder
        conditions={group.conditions || []}
        onConditionsChange={handleUpdateGroupConditions}
      />
    </div>
  );
}

export function ImprovedManualConditionBuilder({
  conditions,
  onConditionsChange
}: ImprovedManualConditionBuilderProps) {
  const addCondition = (index?: number) => {
    const newCondition: SearchCondition = {
      id: generateConditionId(),
      type: 'condition',
      parameter: '',
      operator: 'gt',
      value: ''
    };
    
    if (typeof index === 'number') {
      const newConditions = [...conditions];
      newConditions.splice(index + 1, 0, newCondition);
      onConditionsChange(newConditions);
    } else {
      onConditionsChange([...conditions, newCondition]);
    }
  };

  const addGroup = (index?: number) => {
    const newGroup: SearchCondition = {
      id: generateConditionId(),
      type: 'group',
      conditions: [{
        id: generateConditionId(),
        type: 'condition',
        parameter: '',
        operator: 'gt',
        value: ''
      }]
    };
    
    if (typeof index === 'number') {
      const newConditions = [...conditions];
      newConditions.splice(index + 1, 0, newGroup);
      onConditionsChange(newConditions);
    } else {
      onConditionsChange([...conditions, newGroup]);
    }
  };

  const updateCondition = (index: number, updates: Partial<SearchCondition>) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], ...updates };
    onConditionsChange(newConditions);
  };

  const removeCondition = (index: number) => {
    const newConditions = conditions.filter((_, i) => i !== index);
    // Reset logical operator for first condition
    if (newConditions.length > 0) {
      newConditions[0] = { ...newConditions[0], logicalOperator: undefined };
    }
    onConditionsChange(newConditions);
  };

  const renderCondition = (condition: SearchCondition, index: number, isNested = false, isGroupChild = false) => {
    return (
      <div key={condition.id}>
        {/* Logical operator for non-first items - applies to both conditions and groups */}
        {index > 0 && (
          <div className="flex items-center mb-2">
            <select
              value={condition.logicalOperator || 'AND'}
              onChange={(e) => updateCondition(index, { 
                logicalOperator: e.target.value as 'AND' | 'OR' 
              })}
              className="w-16 h-6 px-1 border rounded text-xs mr-2"
            >
              <option value="AND">AND</option>
              <option value="OR">OR</option>
            </select>
          </div>
        )}

        {/* Render group or condition */}
        {condition.type === 'group' ? (
          <ConditionGroup
            key={condition.id}
            group={condition}
            index={index}
            isNested={isNested}
            onUpdate={updateCondition}
            onRemove={removeCondition}
            renderCondition={renderCondition}
          />
        ) : (
          /* Simple condition */
          <div className="flex items-center gap-2 p-2 border rounded-lg bg-background">
          <Input
            placeholder="Parameter"
            value={condition.parameter || ''}
            onChange={(e) => updateCondition(index, { parameter: e.target.value })}
            className="flex-1 h-8 text-sm"
          />
          
          <select
            value={condition.operator || 'gt'}
            onChange={(e) => updateCondition(index, { 
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
            onChange={(e) => updateCondition(index, { value: e.target.value })}
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
                onClick={() => removeCondition(index)}
                className="h-8 w-8 p-0"
                title="Remove"
              >
                <Minus className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        )}
      </div>
    );
  };


  return (
    <div className="space-y-4">
      {/* Conditions List */}
      <div className="space-y-2">
        {conditions.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">No conditions defined yet</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => addCondition()} size="sm" className="gap-1">
                <Plus className="h-3 w-3" />
                Add Condition
              </Button>
              <Button onClick={() => addGroup()} variant="outline" size="sm" className="gap-1">
                <ChevronDown className="h-3 w-3" />
                Add Group
              </Button>
            </div>
          </Card>
        ) : (
          <>
            {conditions.map((condition, index) => renderCondition(condition, index))}
            
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
          </>
        )}
      </div>
    </div>
  );
}