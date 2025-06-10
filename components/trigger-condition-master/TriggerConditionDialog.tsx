"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { PredefinedCondition } from "@/data/predefinedConditions"
import { SearchCondition } from "@/types"
import { formatConditionExpression } from "@/lib/conditionUtils"
import { BaseConditionDialog } from "@/components/dialogs/BaseConditionDialog"
import { ConditionNameFields } from "@/components/condition-dialogs/ConditionNameFields"
import { ConditionEditorCard } from "@/components/condition-editor/ConditionEditorCard"
import { validateConditionForm, getDialogTitle } from "@/utils/conditionValidation"

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
    const expression = formatConditionExpression(conditions)
    
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

  const isValid = validateConditionForm(name, conditions)

  return (
    <BaseConditionDialog
      open={open}
      onOpenChange={onOpenChange}
      title={getDialogTitle(mode)}
      size="full"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isValid}>
            {mode === "edit" ? "Update Condition" : "Create Condition"}
          </Button>
        </>
      }
    >
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* Basic Information */}
        <ConditionNameFields
          name={name}
          description={description}
          onNameChange={setName}
          onDescriptionChange={setDescription}
        />

        {/* Build Condition and Expression Preview side by side */}
        <ConditionEditorCard
          conditions={conditions}
          onConditionsChange={setConditions}
          showExpressionPreview={true}
          twoColumnLayout={true}
        />
      </div>
    </BaseConditionDialog>
  )
}