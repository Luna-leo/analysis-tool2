import React from "react"
import { Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SearchCondition } from "@/types"
import { SPACING, getStatusClasses } from "@/lib/styleConstants"
import { predefinedConditions } from "@/data/predefinedConditions"
import { ConditionBuilder } from "./ConditionBuilder"

interface ManualConditionBuilderProps {
  searchConditions: SearchCondition[]
  onSearchConditionsChange: (conditions: SearchCondition[]) => void
  loadedFromPredefined: string | null
  onResetToFresh: () => void
}

export const ManualConditionBuilder: React.FC<ManualConditionBuilderProps> = ({
  searchConditions,
  onSearchConditionsChange,
  loadedFromPredefined,
  onResetToFresh,
}) => {
  const infoClasses = getStatusClasses("info")
  
  return (
    <div className="flex flex-col h-full">
      {/* Show source info if loaded from predefined */}
      {loadedFromPredefined && (
        <div className={`${infoClasses.container} flex-shrink-0 mb-4`}>
          <div className="flex items-center gap-2">
            <Edit2 className={infoClasses.icon} />
            <div className="flex-1">
              <h6 className={infoClasses.title}>
                Customizing: {predefinedConditions.find(c => c.id === loadedFromPredefined)?.name}
              </h6>
              <p className={`${infoClasses.text} mt-1`}>
                You can now modify the condition below. Changes will not affect the original preset.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className={infoClasses.button}
              onClick={onResetToFresh}
            >
              Start Fresh
            </Button>
          </div>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto pr-2 min-h-0">
        <div className="pb-4">
          <ConditionBuilder
            conditions={searchConditions}
            onChange={onSearchConditionsChange}
          />
        </div>
      </div>
    </div>
  )
}