"use client"

import React, { useState, useEffect } from "react"
import { PredefinedCondition } from "@/data/predefinedConditions"
import { formatConditionExpression } from "@/lib/conditionUtils"
import { ConditionBuilderFullscreen } from "@/components/dialogs/ConditionBuilderFullscreen"
import { validateConditionForm, getDialogTitle } from "@/utils/conditionValidation"
import { useSearchConditions } from "@/hooks/useSearchConditions"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

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
  const {
    conditionMode,
    setConditionMode,
    selectedPredefinedCondition,
    setSelectedPredefinedCondition,
    searchConditions,
    setSearchConditions,
    savedConditions,
    loadedFromPredefined,
    loadPredefinedCondition,
    resetToFresh,
    loadSavedCondition,
    deleteSavedCondition,
    getCurrentExpressionJSX
  } = useSearchConditions()

  useEffect(() => {
    if (open) {
      if (initialCondition) {
        setName(mode === "duplicate" ? `${initialCondition.name} (Copy)` : initialCondition.name)
        setDescription(initialCondition.description || "")
        setSearchConditions(JSON.parse(JSON.stringify(initialCondition.conditions))) // Deep clone
        setConditionMode('manual') // Set to manual mode when editing existing conditions
      } else {
        // Reset for new condition
        setName("")
        setDescription("")
        resetToFresh()
        setConditionMode('manual') // Set to manual mode for new conditions
      }
    }
  }, [open, initialCondition, mode])

  const handleSave = () => {
    const expression = formatConditionExpression(searchConditions)
    
    const condition: PredefinedCondition = {
      id: mode === "duplicate" ? `condition_${Date.now()}` : (initialCondition?.id || `condition_${Date.now()}`),
      name,
      description,
      expression,
      conditions: searchConditions
    }

    onSave(condition)
    onOpenChange(false)
  }

  const isValid = validateConditionForm(name, searchConditions)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[90vh] p-0 gap-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>{getDialogTitle(mode)}</DialogTitle>
        </DialogHeader>
        <div className="h-full flex flex-col">
          <ConditionBuilderFullscreen
            conditionMode={conditionMode}
            onConditionModeChange={setConditionMode}
            selectedPredefinedCondition={selectedPredefinedCondition}
            onSelectedPredefinedConditionChange={setSelectedPredefinedCondition}
            loadedFromPredefined={loadedFromPredefined}
            searchConditions={searchConditions}
            onSearchConditionsChange={setSearchConditions}
            savedConditions={savedConditions}
            getCurrentExpressionJSX={getCurrentExpressionJSX}
            onLoadPredefinedCondition={loadPredefinedCondition}
            onResetToFresh={resetToFresh}
            onShowSaveDialog={() => {}}
            onLoadSavedCondition={loadSavedCondition}
            onDeleteSavedCondition={deleteSavedCondition}
            onSave={handleSave}
            onClose={() => onOpenChange(false)}
            canSave={isValid}
            title={getDialogTitle(mode)}
            isFullscreen={false}
            onToggleFullscreen={() => {}}
            conditionName={name}
            conditionDescription={description}
            onConditionNameChange={setName}
            onConditionDescriptionChange={setDescription}
            saveButtonText={mode === "edit" ? "Update Condition" : "Create Condition"}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}