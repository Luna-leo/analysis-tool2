import React, { useState } from "react"
import { ChevronDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { SearchCondition, SavedCondition, ConditionMode } from "@/types"
import { predefinedConditions } from "@/data/predefinedConditions"
import { PredefinedConditionSelector } from "./PredefinedConditionSelector"
import { ManualConditionBuilder } from "./ManualConditionBuilder"
import { ExpressionPreview } from "./ExpressionPreview"
import { SavedConditionsList } from "./SavedConditionsList"

interface SearchConditionsSectionProps {
  conditionMode: ConditionMode
  onConditionModeChange: (mode: ConditionMode) => void
  selectedPredefinedCondition: string
  onSelectedPredefinedConditionChange: (id: string) => void
  loadedFromPredefined: string | null
  searchConditions: SearchCondition[]
  onSearchConditionsChange: (conditions: SearchCondition[]) => void
  savedConditions: SavedCondition[]
  getCurrentExpressionJSX: () => React.ReactNode
  onLoadPredefinedCondition: (id: string) => void
  onResetToFresh: () => void
  onShowSaveDialog: () => void
  onLoadSavedCondition: (condition: SavedCondition) => void
  onDeleteSavedCondition: (id: string) => void
  defaultOpen?: boolean
}

export const SearchConditionsSection: React.FC<SearchConditionsSectionProps> = ({
  conditionMode,
  onConditionModeChange,
  selectedPredefinedCondition,
  onSelectedPredefinedConditionChange,
  loadedFromPredefined,
  searchConditions,
  onSearchConditionsChange,
  savedConditions,
  getCurrentExpressionJSX,
  onLoadPredefinedCondition,
  onResetToFresh,
  onShowSaveDialog,
  onLoadSavedCondition,
  onDeleteSavedCondition,
  defaultOpen = true
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  
  // Update isOpen when defaultOpen prop changes
  React.useEffect(() => {
    setIsOpen(defaultOpen)
  }, [defaultOpen])
  
  // Generate summary for collapsed state
  const getSummary = () => {
    if (conditionMode === 'predefined') {
      if (selectedPredefinedCondition) {
        const condition = predefinedConditions.find(c => c.id === selectedPredefinedCondition)
        return `Predefined: ${condition?.name || 'None selected'}`
      }
      return 'Predefined: None selected'
    } else {
      const conditionCount = searchConditions.length
      if (loadedFromPredefined) {
        const original = predefinedConditions.find(c => c.id === loadedFromPredefined)
        return `Custom: Modified from "${original?.name}" (${conditionCount} conditions)`
      }
      return `Manual: ${conditionCount} condition(s) built`
    }
  }
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={`${isOpen ? 'h-full' : 'h-auto'} flex flex-col`}>
      <Card className={`${isOpen ? 'h-full' : 'h-auto'} flex flex-col`}>
        <CollapsibleTrigger asChild>
          <CardHeader className={`flex-shrink-0 ${isOpen ? 'pb-6' : 'py-3'}`}>
            <Button variant="ghost" className="w-full justify-between p-0 hover:bg-transparent">
              <div className="flex flex-col items-start">
                <CardTitle className="text-lg">Search Conditions</CardTitle>
                {!isOpen && (
                  <p className="text-xs text-muted-foreground mt-1">{getSummary()}</p>
                )}
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent className={`${isOpen ? 'flex-1 flex flex-col' : ''}`}>
          <CardContent className={`${isOpen ? 'flex-1 flex flex-col' : ''} space-y-4 overflow-hidden`}>
        {/* Condition Mode Selection */}
        <RadioGroup
          value={conditionMode}
          onValueChange={(value) => {
            onConditionModeChange(value as ConditionMode)
          }}
          className="flex gap-6 flex-shrink-0"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="predefined" id="predefined" />
            <Label htmlFor="predefined">Use Predefined Conditions</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="manual" id="manual" />
            <Label htmlFor="manual">Manual Setup</Label>
          </div>
        </RadioGroup>

        <div className="grid grid-cols-2 gap-6 flex-1 min-h-0">
          {/* Condition Setup */}
          <div className="flex flex-col min-h-0">
            <h4 className="text-sm font-medium mb-3 text-muted-foreground flex-shrink-0">
              {conditionMode === 'predefined' ? 'Select Condition' : 'Condition Builder'}
            </h4>
            
            <div className="flex-1 min-h-0 relative">
              {conditionMode === 'predefined' ? (
                <PredefinedConditionSelector
                  selectedPredefinedCondition={selectedPredefinedCondition}
                  onSelectedPredefinedConditionChange={onSelectedPredefinedConditionChange}
                  onLoadPredefinedCondition={onLoadPredefinedCondition}
                />
              ) : (
                <div className="absolute inset-0">
                  <ManualConditionBuilder
                    searchConditions={searchConditions}
                    onSearchConditionsChange={onSearchConditionsChange}
                    loadedFromPredefined={loadedFromPredefined}
                    onResetToFresh={onResetToFresh}
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col min-h-0">
            <ExpressionPreview
              conditionMode={conditionMode}
              loadedFromPredefined={loadedFromPredefined}
              selectedPredefinedCondition={selectedPredefinedCondition}
              getCurrentExpressionJSX={getCurrentExpressionJSX}
            />
            
            <SavedConditionsList
              savedConditions={savedConditions}
              onLoadSavedCondition={onLoadSavedCondition}
              onDeleteSavedCondition={onDeleteSavedCondition}
            />
          </div>
        </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}