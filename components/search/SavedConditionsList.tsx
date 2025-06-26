import React, { useCallback } from "react"
import { Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SavedCondition } from "@/types"
import { SIZING, SPACING, BORDERS } from "@/lib/styleConstants"
import { colorCodeExpressionString } from "@/lib/conditionUtils"

interface SavedConditionItemProps {
  condition: SavedCondition
  onLoad: (condition: SavedCondition) => void
  onDelete: (id: string) => void
}

const SavedConditionItem = React.memo(({ condition, onLoad, onDelete }: SavedConditionItemProps) => {
  const handleLoad = useCallback(() => onLoad(condition), [onLoad, condition])
  const handleDelete = useCallback(() => onDelete(condition.id), [onDelete, condition.id])

  return (
    <div className={`flex items-center gap-2 p-2 ${BORDERS.default} text-xs`}>
      <div className="flex-1">
        <div className="font-medium">{condition.name}</div>
        <div className="text-muted-foreground font-mono text-[10px] truncate">
          {colorCodeExpressionString(condition.expression)}
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        className={`${SIZING.buttonSm} ${SPACING.buttonPadding} text-xs`}
        onClick={handleLoad}
      >
        Load
      </Button>
      <Button
        variant="outline"
        size="sm"
        className={`${SIZING.buttonSm} w-6 p-0`}
        onClick={handleDelete}
      >
        <Minus className={SIZING.iconSm} />
      </Button>
    </div>
  )
})

SavedConditionItem.displayName = 'SavedConditionItem'

interface SavedConditionsListProps {
  savedConditions: SavedCondition[]
  onLoadSavedCondition: (condition: SavedCondition) => void
  onDeleteSavedCondition: (id: string) => void
}

export const SavedConditionsList = React.memo(({
  savedConditions,
  onLoadSavedCondition,
  onDeleteSavedCondition,
}: SavedConditionsListProps) => {
  if (savedConditions.length === 0) {
    return null
  }

  return (
    <div className="mt-4">
      <h5 className="text-xs font-medium text-muted-foreground mb-2">Saved Conditions</h5>
      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
        {savedConditions.map((saved) => (
          <SavedConditionItem
            key={saved.id}
            condition={saved}
            onLoad={onLoadSavedCondition}
            onDelete={onDeleteSavedCondition}
          />
        ))}
      </div>
    </div>
  )
})