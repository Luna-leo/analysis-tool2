"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PredefinedCondition } from "@/data/predefinedConditions"
import { SearchCondition } from "@/types"
import { ConditionBuilder } from "@/components/search/ConditionBuilder"
import { formatConditionExpressionToJSX } from "@/lib/conditionUtils"
import { conditionToExpression } from "@/lib/conditionUtils"
import { ExpressionLegend } from "@/components/search/ExpressionLegend"

interface TriggerConditionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (condition: PredefinedCondition) => void
  initialCondition?: PredefinedCondition
  mode?: "create" | "edit" | "duplicate"
}

export function TriggerConditionDialog({
  open,
  onOpenChange,
  onSave,
  initialCondition,
  mode = "create"
}: TriggerConditionDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [conditions, setConditions] = useState<SearchCondition[]>([
    {
      id: "1",
      type: "condition",
      parameter: "",
      operator: "gt",
      value: ""
    }
  ])

  useEffect(() => {
    if (open) {
      if (initialCondition) {
        setName(mode === "duplicate" ? `${initialCondition.name} (Copy)` : initialCondition.name)
        setDescription(initialCondition.description || "")
        setConditions(JSON.parse(JSON.stringify(initialCondition.conditions))) // Deep clone
      } else {
        // Reset for new condition
        setName("")
        setDescription("")
        setConditions([
          {
            id: "1",
            type: "condition",
            parameter: "",
            operator: "gt",
            value: ""
          }
        ])
      }
    }
  }, [open, initialCondition, mode])

  const handleSave = () => {
    const expression = conditionToExpression(conditions[0])
    
    const condition: PredefinedCondition = {
      id: initialCondition?.id || `condition_${Date.now()}`,
      name,
      description,
      expression,
      conditions
    }

    onSave(condition)
    onOpenChange(false)
  }

  const isValid = name.trim() && conditions.length > 0 && validateConditions(conditions)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>
            {mode === "edit" ? "Edit Trigger Condition" : 
             mode === "duplicate" ? "Duplicate Trigger Condition" : 
             "Create New Trigger Condition"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="condition-name">Condition Name *</Label>
                <Input
                  id="condition-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., High Temperature Alert"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="condition-description">Description</Label>
                <Textarea
                  id="condition-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe when this condition should trigger..."
                  className="mt-1 min-h-[80px] resize-y"
                />
              </div>
            </CardContent>
          </Card>

          {/* Build Condition and Expression Preview side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Condition Builder Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Build Condition</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ConditionBuilder
                  conditions={conditions}
                  onConditionsChange={setConditions}
                />
              </CardContent>
            </Card>

            {/* Expression Preview Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Expression Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 bg-muted/20 min-h-[200px]">
                  <div className="font-mono text-sm break-words">
                    {formatConditionExpressionToJSX(conditions)}
                  </div>
                  <ExpressionLegend />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t bg-background">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isValid}>
            {mode === "edit" ? "Update Condition" : "Create Condition"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Helper function to validate conditions
function validateConditions(conditions: SearchCondition[]): boolean {
  for (const condition of conditions) {
    if (condition.type === 'condition') {
      if (!condition.parameter || !condition.operator || !condition.value) {
        return false
      }
    } else if (condition.type === 'group') {
      if (!condition.conditions || condition.conditions.length === 0) {
        return false
      }
      if (!validateConditions(condition.conditions)) {
        return false
      }
    }
  }
  return true
}