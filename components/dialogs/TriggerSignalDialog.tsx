import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { EventInfo, SearchCondition } from "@/types"
import { Settings2 } from "lucide-react"
import { useSearchConditions } from '@/hooks/useSearchConditions'
import { SearchConditionsSection } from '../search/SearchConditionsSection'
import { SaveConditionDialog } from '../search/SaveConditionDialog'

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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Configure Filter Conditions</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Show selected periods info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm font-medium text-blue-800 mb-2">
              Conditions will be applied to {selectedDataSourceItems.length} period{selectedDataSourceItems.length !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-blue-700">
              Configure the search conditions below, then click Apply to filter the selected periods.
            </p>
          </div>
          
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
        
        <DialogFooter className="pt-4 border-t">
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
        </DialogFooter>
      </DialogContent>
    </Dialog>

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