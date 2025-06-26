import React from "react"
import { ConditionMode } from "@/types"
import { predefinedConditions } from "@/data/predefinedConditions"
import { ExpressionLegend } from "./ExpressionLegend"

interface ExpressionPreviewProps {
  conditionMode: ConditionMode
  loadedFromPredefined: string | null
  selectedPredefinedCondition: string
  getCurrentExpressionJSX: () => React.ReactNode
}

export const ExpressionPreview: React.FC<ExpressionPreviewProps> = ({
  conditionMode,
  loadedFromPredefined,
  selectedPredefinedCondition,
  getCurrentExpressionJSX,
}) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-muted-foreground">
          Current Expression
          {conditionMode === "manual" && loadedFromPredefined && (
            <span className="ml-2 text-xs text-blue-600">(Modified from preset)</span>
          )}
        </h4>
      </div>
      <div className="border rounded-lg p-4 bg-muted/20 min-h-[100px] max-h-[300px] overflow-y-auto">
        <div className="font-mono text-sm break-words">
          {getCurrentExpressionJSX()}
        </div>
        
        {/* Show predefined condition info if selected */}
        {conditionMode === "predefined" && selectedPredefinedCondition && (
          <div className="mt-3 pt-3 border-t border-muted">
            <div className="text-xs text-muted-foreground">
              <div className="font-medium mb-1">
                {predefinedConditions.find(c => c.id === selectedPredefinedCondition)?.name}
              </div>
              <div>
                {predefinedConditions.find(c => c.id === selectedPredefinedCondition)?.description}
              </div>
            </div>
          </div>
        )}
        
        <ExpressionLegend />
      </div>
    </div>
  )
}