import React from 'react'
import { Button } from "@/components/ui/button"
import { EventInfo, SearchCondition } from "@/types"
import { Settings2 } from "lucide-react"
import { useSearchConditions } from '@/hooks/useSearchConditions'
import { SearchConditionsSection } from '../search/SearchConditionsSection'
import { SaveConditionDialog } from '../search/SaveConditionDialog'
import { BaseConditionDialog } from './BaseConditionDialog'
import { SelectedItemsInfo } from '../condition-dialogs/SelectedItemsInfo'

interface TriggerSignalDialogProps {
  isOpen: boolean
  onClose: () => void
  onApplyConditions: (conditions: SearchCondition[]) => void
  selectedDataSourceItems?: EventInfo[]
}

export const TriggerSignalDialog: React.FC<TriggerSignalDialogProps> = ({
  isOpen,
  onClose,
  onApplyConditions,
  selectedDataSourceItems = []
}) => {
  // Use custom hooks for state management
  const searchConditions = useSearchConditions()

  const handleApply = () => {
    if (searchConditions.hasValidConditions()) {
      onApplyConditions(searchConditions.searchConditions)
      onClose()
    }
  }

  const handleCancel = () => {
    onClose()
  }

  return (
    <>
    <BaseConditionDialog
      open={isOpen}
      onOpenChange={onClose}
      title="Configure Filter Conditions"
      size="full"
      footer={
        <>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleApply}
            disabled={!searchConditions.hasValidConditions()}
          >
            <Settings2 className="h-4 w-4 mr-2" />
            Apply Conditions
          </Button>
        </>
      }
    >
      <div className="flex-1 overflow-hidden flex flex-col gap-4">
        {/* Show selected periods info */}
        <SelectedItemsInfo
          itemCount={selectedDataSourceItems.length}
          message="Configure the search conditions below, then click Apply to filter the selected periods."
        />
        
        {/* Search Conditions */}
        <SearchConditionsSection
          conditionMode={searchConditions.conditionMode}
          onConditionModeChange={(mode) => {
            searchConditions.setConditionMode(mode)
            if (mode === 'predefined') {
              searchConditions.setLoadedFromPredefined(null)
              searchConditions.setSelectedPredefinedCondition('')
            }
          }}
          selectedPredefinedCondition={searchConditions.selectedPredefinedCondition}
          onSelectedPredefinedConditionChange={searchConditions.setSelectedPredefinedCondition}
          loadedFromPredefined={searchConditions.loadedFromPredefined}
          searchConditions={searchConditions.searchConditions}
          onSearchConditionsChange={searchConditions.setSearchConditions}
          savedConditions={searchConditions.savedConditions}
          getCurrentExpressionJSX={searchConditions.getCurrentExpressionJSX}
          onLoadPredefinedCondition={searchConditions.loadPredefinedCondition}
          onResetToFresh={searchConditions.resetToFresh}
          onShowSaveDialog={() => searchConditions.setShowSaveDialog(true)}
          onLoadSavedCondition={searchConditions.loadSavedCondition}
          onDeleteSavedCondition={searchConditions.deleteSavedCondition}
          defaultOpen={true}
        />
      </div>
    </BaseConditionDialog>

    {/* Save Condition Dialog */}
    <SaveConditionDialog
      isOpen={searchConditions.showSaveDialog}
      onClose={() => searchConditions.setShowSaveDialog(false)}
      conditionName={searchConditions.saveConditionName}
      onConditionNameChange={searchConditions.setSaveConditionName}
      onSave={searchConditions.saveCurrentCondition}
      getCurrentExpressionJSX={searchConditions.getCurrentExpressionJSX}
    />
    </>
  )
}