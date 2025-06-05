import React from "react"
import { Edit2 } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { predefinedConditions } from "@/data/predefinedConditions"
import { colorCodeExpressionString } from "@/lib/conditionUtils"

interface PredefinedConditionSelectorProps {
  selectedPredefinedCondition: string
  onSelectedPredefinedConditionChange: (id: string) => void
  onLoadPredefinedCondition: (id: string) => void
}

export const PredefinedConditionSelector: React.FC<PredefinedConditionSelectorProps> = ({
  selectedPredefinedCondition,
  onSelectedPredefinedConditionChange,
  onLoadPredefinedCondition,
}) => {
  return (
    <div className="space-y-3">
      {predefinedConditions.map((condition) => (
        <div
          key={condition.id}
          className={`border rounded-lg p-3 transition-colors ${
            selectedPredefinedCondition === condition.id 
              ? "border-primary bg-primary/5" 
              : "border-muted hover:border-primary/50"
          }`}
        >
          <div className="flex items-start justify-between">
            <div 
              className="flex-1 cursor-pointer"
              onClick={() => onSelectedPredefinedConditionChange(condition.id)}
            >
              <h5 className="font-medium text-sm">{condition.name}</h5>
              <p className="text-xs text-muted-foreground mt-1">{condition.description}</p>
              <div className="font-mono text-xs mt-2 p-2 bg-muted/30 rounded">
                {colorCodeExpressionString(condition.expression)}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <RadioGroup value={selectedPredefinedCondition}>
                <RadioGroupItem 
                  value={condition.id} 
                  className="h-4 w-4"
                  onClick={() => onSelectedPredefinedConditionChange(condition.id)}
                />
              </RadioGroup>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  onLoadPredefinedCondition(condition.id)
                }}
                title="Customize this condition"
              >
                <Edit2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}