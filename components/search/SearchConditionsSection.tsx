import React, { useState } from "react"
import { ChevronDown } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { SearchCondition, SavedCondition, ConditionMode } from "@/types"
import { predefinedConditions } from "@/data/predefinedConditions"
import { ManualConditionBuilder } from "./ManualConditionBuilder"
import { ImprovedManualConditionBuilder } from "./ImprovedManualConditionBuilder"
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
  useImprovedLayout?: boolean
  hideExpressionPreview?: boolean
  headerText?: string
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
  defaultOpen = true,
  useImprovedLayout = false,
  hideExpressionPreview = false,
  headerText = "Search Conditions"
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  
  // Update isOpen when defaultOpen prop changes
  React.useEffect(() => {
    setIsOpen(defaultOpen)
  }, [defaultOpen])
  
  // Generate summary for collapsed state
  const getSummary = () => {
    const conditionCount = searchConditions.length
    if (loadedFromPredefined) {
      const original = predefinedConditions.find(c => c.id === loadedFromPredefined)
      return `Modified from "${original?.name}" (${conditionCount} conditions)`
    }
    return `${conditionCount} condition(s) defined`
  }
  
  return (
    <div className="h-full flex flex-col">
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="h-full flex flex-col">
        <CollapsibleTrigger asChild>
          <div className="flex-shrink-0 pb-2">
            <Button variant="ghost" className="w-full justify-start p-0 hover:bg-transparent">
              <ChevronDown className={`h-4 w-4 mr-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              <div className="flex flex-col items-start">
                <h3 className="text-lg font-semibold">{headerText}</h3>
                {!isOpen && (
                  <p className="text-xs text-muted-foreground mt-1">{getSummary()}</p>
                )}
              </div>
            </Button>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className={`${isOpen ? 'flex-1 flex flex-col' : ''}`}>
          <div className={`${isOpen ? 'flex-1 flex flex-col' : ''} overflow-hidden`}>
            {/* Always use manual mode - no need for radio buttons */}
            <div className="flex-1 min-h-0 relative">
                  {useImprovedLayout ? (
                    <ScrollArea className="h-full">
                      <div className="pt-0 px-4 pb-4">
                        <ImprovedManualConditionBuilder
                          conditions={searchConditions}
                          onConditionsChange={onSearchConditionsChange}
                        />
                      </div>
                    </ScrollArea>
                  ) : (
                    <ManualConditionBuilder
                      searchConditions={searchConditions}
                      onSearchConditionsChange={onSearchConditionsChange}
                      loadedFromPredefined={loadedFromPredefined}
                      onResetToFresh={onResetToFresh}
                    />
                  )}
            </div>
            
            {!hideExpressionPreview && (
              <div className="mt-4">
                <ExpressionPreview
                  conditionMode={conditionMode}
                  loadedFromPredefined={loadedFromPredefined}
                  selectedPredefinedCondition={selectedPredefinedCondition}
                  getCurrentExpressionJSX={getCurrentExpressionJSX}
                />
              </div>
            )}
            
            <div className="mt-4">
              <SavedConditionsList
                savedConditions={savedConditions}
                onLoadSavedCondition={onLoadSavedCondition}
                onDeleteSavedCondition={onDeleteSavedCondition}
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}