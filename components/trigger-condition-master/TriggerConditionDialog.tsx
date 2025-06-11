"use client"

import React, { useState, useEffect } from "react"
import { PredefinedCondition } from "@/data/predefinedConditions"
import { BaseTriggerConditionDialog, generateConditionExpression, isConditionFormValid } from "@/components/dialogs/BaseTriggerConditionDialog"
import { getDialogTitle } from "@/utils/conditionValidation"
import { useSearchConditions } from "@/hooks/useSearchConditions"

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
    const expression = generateConditionExpression(searchConditions)
    
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

  const isValid = isConditionFormValid(name, searchConditions)

  return (
    <BaseTriggerConditionDialog
      open={open}
      onClose={() => onOpenChange(false)}
      conditionName={name}
      conditionDescription={description}
      onConditionNameChange={setName}
      onConditionDescriptionChange={setDescription}
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
      title={getDialogTitle(mode)}
      saveButtonText={mode === "edit" ? "Update Condition" : "Create Condition"}
      canSave={isValid}
      onSave={handleSave}
    />
  )
}