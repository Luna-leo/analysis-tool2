"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SearchCondition } from "@/types"
import { ConditionBuilder } from "@/components/search/ConditionBuilder"
import { formatConditionExpressionToJSX } from "@/lib/conditionUtils"
import { ExpressionLegend } from "@/components/search/ExpressionLegend"
import { cn } from "@/lib/utils"

interface ConditionEditorCardProps {
  conditions: SearchCondition[]
  onConditionsChange: (conditions: SearchCondition[]) => void
  showExpressionPreview?: boolean
  twoColumnLayout?: boolean
  className?: string
}

export const ConditionEditorCard = React.memo(({
  conditions,
  onConditionsChange,
  showExpressionPreview = true,
  twoColumnLayout = false,
  className
}: ConditionEditorCardProps) => {
  const content = (
    <>
      <div className={twoColumnLayout ? "" : "space-y-4"}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Build Condition</CardTitle>
          </CardHeader>
          <CardContent>
            <ConditionBuilder
              conditions={conditions}
              onChange={onConditionsChange}
            />
          </CardContent>
        </Card>
      </div>

      {showExpressionPreview && (
        <div className={twoColumnLayout ? "" : "mt-4"}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Expression Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-muted/20 min-h-[200px] max-h-[400px] overflow-y-auto">
                <div className="font-mono text-sm break-words">
                  {formatConditionExpressionToJSX(conditions)}
                </div>
                <ExpressionLegend />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )

  if (twoColumnLayout) {
    return (
      <div className={cn("grid grid-cols-1 lg:grid-cols-2 gap-6", className)}>
        {content}
      </div>
    )
  }

  return <div className={className}>{content}</div>
})