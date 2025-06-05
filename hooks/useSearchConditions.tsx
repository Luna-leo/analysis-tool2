import React, { useState } from "react"
import { SearchCondition, SavedCondition, ConditionMode } from "@/types"
import { 
  formatConditionExpression, 
  formatConditionExpressionToJSX, 
  colorCodeExpressionString,
  validateConditions,
  generateConditionId 
} from "@/lib/conditionUtils"
import { predefinedConditions } from "@/data/predefinedConditions"

export const useSearchConditions = () => {
  const [conditionMode, setConditionMode] = useState<ConditionMode>('predefined')
  const [selectedPredefinedCondition, setSelectedPredefinedCondition] = useState<string>('')
  const [loadedFromPredefined, setLoadedFromPredefined] = useState<string | null>(null)
  const [searchConditions, setSearchConditions] = useState<SearchCondition[]>([
    { id: 'cond_1', type: 'condition', parameter: '', operator: 'gt', value: '' }
  ])
  const [savedConditions, setSavedConditions] = useState<SavedCondition[]>([])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveConditionName, setSaveConditionName] = useState('')

  const getCurrentConditions = (): SearchCondition[] => {
    if (conditionMode === 'predefined') {
      const predefined = predefinedConditions.find(c => c.id === selectedPredefinedCondition)
      return predefined ? predefined.conditions : []
    }
    return searchConditions
  }

  const getCurrentExpression = (): string => {
    if (conditionMode === 'predefined') {
      const predefined = predefinedConditions.find(c => c.id === selectedPredefinedCondition)
      return predefined ? predefined.expression : 'No condition selected'
    }
    return formatConditionExpression(searchConditions)
  }

  const getCurrentExpressionJSX = () => {
    if (conditionMode === 'predefined') {
      const predefined = predefinedConditions.find(c => c.id === selectedPredefinedCondition)
      if (!predefined) return <span className="text-muted-foreground">No condition selected</span>
      
      return colorCodeExpressionString(predefined.expression)
    }
    return formatConditionExpressionToJSX(searchConditions)
  }

  const loadPredefinedCondition = (conditionId: string) => {
    const predefined = predefinedConditions.find(c => c.id === conditionId)
    if (predefined) {
      const clonedConditions = JSON.parse(JSON.stringify(predefined.conditions))
      setSearchConditions(clonedConditions)
      setLoadedFromPredefined(conditionId)
      setConditionMode('manual')
    }
  }

  const saveCurrentCondition = () => {
    if (!saveConditionName.trim()) return
    
    const currentConditions = getCurrentConditions()
    const currentExpression = getCurrentExpression()
    
    const newSavedCondition: SavedCondition = {
      id: `saved_${Date.now()}`,
      name: saveConditionName.trim(),
      expression: currentExpression,
      conditions: JSON.parse(JSON.stringify(currentConditions)),
      createdAt: new Date().toISOString()
    }
    
    setSavedConditions([...savedConditions, newSavedCondition])
    setSaveConditionName('')
    setShowSaveDialog(false)
  }

  const loadSavedCondition = (savedCondition: SavedCondition) => {
    setSearchConditions(JSON.parse(JSON.stringify(savedCondition.conditions)))
    setConditionMode('manual')
    setLoadedFromPredefined(null)
    setSelectedPredefinedCondition('')
  }

  const deleteSavedCondition = (conditionId: string) => {
    setSavedConditions(savedConditions.filter(c => c.id !== conditionId))
  }

  const resetToFresh = () => {
    setLoadedFromPredefined(null)
    setSearchConditions([
      { id: generateConditionId(), type: 'condition', parameter: '', operator: 'gt', value: '' }
    ])
  }

  const hasValidConditions = () => {
    return conditionMode === 'predefined' 
      ? selectedPredefinedCondition !== ''
      : validateConditions(searchConditions)
  }

  return {
    conditionMode,
    setConditionMode,
    selectedPredefinedCondition,
    setSelectedPredefinedCondition,
    loadedFromPredefined,
    setLoadedFromPredefined,
    searchConditions,
    setSearchConditions,
    savedConditions,
    setSavedConditions,
    showSaveDialog,
    setShowSaveDialog,
    saveConditionName,
    setSaveConditionName,
    getCurrentConditions,
    getCurrentExpression,
    getCurrentExpressionJSX,
    loadPredefinedCondition,
    saveCurrentCondition,
    loadSavedCondition,
    deleteSavedCondition,
    resetToFresh,
    hasValidConditions
  }
}