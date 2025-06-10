import React from "react"
import { Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SavedCondition } from "@/types"
import { SIZING, SPACING, BORDERS } from "@/lib/styleConstants"
import { colorCodeExpressionString } from "@/lib/conditionUtils"

interface SavedConditionsListProps {
  savedConditions: SavedCondition[]
  onLoadSavedCondition: (condition: SavedCondition) => void
  onDeleteSavedCondition: (id: string) => void
}

export const SavedConditionsList: React.FC<SavedConditionsListProps> = ({
  savedConditions,
  onLoadSavedCondition,
  onDeleteSavedCondition,
}) => {
  if (savedConditions.length === 0) {
    return null
  }

  return (
    <div className="mt-4">
      <h5 className="text-xs font-medium text-muted-foreground mb-2">Saved Conditions</h5>
      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
        {savedConditions.map((saved) => (
          <div key={saved.id} className={`flex items-center gap-2 p-2 ${BORDERS.default} text-xs`}>
            <div className="flex-1">
              <div className="font-medium">{saved.name}</div>
              <div className="text-muted-foreground font-mono text-[10px] truncate">
                {colorCodeExpressionString(saved.expression)}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className={`${SIZING.buttonSm} ${SPACING.buttonPadding} text-xs`}
              onClick={() => onLoadSavedCondition(saved)}
            >
              Load
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`${SIZING.buttonSm} w-6 p-0`}
              onClick={() => onDeleteSavedCondition(saved.id)}
            >
              <Minus className={SIZING.iconSm} />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}