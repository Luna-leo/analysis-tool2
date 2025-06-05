import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EventInfo, SearchResult } from "@/types"
import { Search } from "lucide-react"
import { useSearchConditions } from '@/hooks/useSearchConditions'
import { useSearchPeriod } from '@/hooks/useSearchPeriod'
import { SearchPeriodSection } from './SearchPeriodSection'
import { SearchConditionsSection } from './SearchConditionsSection'
import { SearchResultsSection } from './SearchResultsSection'
import { SaveConditionDialog } from './SaveConditionDialog'

interface TriggerSignalDialogProps {
  isOpen: boolean
  onClose: () => void
  onAddToDataSource: (results: EventInfo[]) => void
  availableEvents: EventInfo[]
}


export const TriggerSignalDialog: React.FC<TriggerSignalDialogProps> = ({
  isOpen,
  onClose,
  onAddToDataSource,
  availableEvents
}) => {
  const [labelName, setLabelName] = useState('')
  
  // Use custom hooks for state management
  const searchConditions = useSearchConditions()
  const searchPeriod = useSearchPeriod(availableEvents)
  
  // Set default label name to condition name
  React.useEffect(() => {
    const conditionName = searchConditions.getCurrentExpression()
    if (conditionName) {
      setLabelName(conditionName)
    }
  }, [searchConditions.searchConditions, searchConditions.conditionMode, searchConditions.selectedPredefinedCondition])

  // Mock search function
  const performSearch = async () => {
    searchPeriod.setIsSearching(true)
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Generate mock search results based on current condition type
    const currentExpression = searchConditions.getCurrentExpression()
    const mockResults: SearchResult[] = []
    
    if (searchPeriod.searchPeriodType === 'manual') {
      // Generate results for each manual period
      searchPeriod.manualPeriods.forEach((period, idx) => {
        if (period.plant && period.machineNo && period.start && period.end) {
          // Generate 2-3 results per period
          const resultsCount = 2 + Math.floor(Math.random() * 2)
          for (let i = 0; i < resultsCount; i++) {
            mockResults.push({
              id: `${idx}_${i}`,
              timestamp: `2024-01-15T${10 + idx}:${15 + i * 20}:${15 + i * 5}`,
              plant: period.plant,
              machineNo: period.machineNo,
              parameters: { 
                temperature: 80 + Math.random() * 20, 
                pressure: 10 + Math.random() * 5, 
                flow: 40 + Math.random() * 20, 
                speed: 50 + Math.random() * 20 
              },
              matchedConditions: [currentExpression]
            })
          }
        }
      })
    } else {
      // Generate results for event-based periods
      const selectedEvents = searchPeriod.filteredEvents.filter(e => searchPeriod.selectedEventIds.has(e.id))
      selectedEvents.forEach((event, idx) => {
        mockResults.push({
          id: `event_${idx}`,
          timestamp: event.start,
          plant: event.plant,
          machineNo: event.machineNo,
          parameters: { 
            temperature: 80 + Math.random() * 20, 
            pressure: 10 + Math.random() * 5, 
            flow: 40 + Math.random() * 20, 
            speed: 50 + Math.random() * 20 
          },
          matchedConditions: [currentExpression]
        })
      })
    }
    
    searchPeriod.setSearchResults(mockResults)
    searchPeriod.setIsSearching(false)
  }

  const handleAddSelectedResults = () => {
    const selectedResults = searchPeriod.searchResults.filter(result => 
      searchPeriod.selectedResultIds.has(result.id)
    )
    
    // Convert search results to EventInfo format
    const selectedEvents = availableEvents.filter(e => searchPeriod.selectedEventIds.has(e.id))
    const eventsToAdd: EventInfo[] = selectedResults.map(result => ({
      id: `trigger_${result.id}_${Date.now()}`,
      plant: result.plant || 'Signal Detection',
      machineNo: result.machineNo || 'AUTO',
      label: labelName || 'Signal Detection',
      labelDescription: '',
      event: 'Trigger Event',
      eventDetail: `Auto-detected at ${result.timestamp}`,
      start: result.timestamp,
      end: result.timestamp // Same timestamp for trigger events
    }))
    
    onAddToDataSource(eventsToAdd)
    
    // Reset dialog state
    searchPeriod.resetSearchResults()
    onClose()
  }


  const isSearchValid = () => {
    const hasValidPeriod = searchPeriod.hasValidPeriod()
    const hasValidConditions = searchConditions.hasValidConditions()
    
    return hasValidPeriod && hasValidConditions
  }




  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[95vw] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Signal Search</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="setup" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="setup">Search Setup</TabsTrigger>
              <TabsTrigger value="results" disabled={searchPeriod.searchResults.length === 0}>
                Results ({searchPeriod.searchResults.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="setup" className="flex-1 overflow-y-auto space-y-4">
              {/* Search Period Selection */}
              <SearchPeriodSection
                searchPeriodType={searchPeriod.searchPeriodType}
                onSearchPeriodTypeChange={searchPeriod.setSearchPeriodType}
                selectedEventIds={searchPeriod.selectedEventIds}
                onSelectedEventIdsChange={searchPeriod.setSelectedEventIds}
                eventSearchQuery={searchPeriod.eventSearchQuery}
                onEventSearchQueryChange={searchPeriod.setEventSearchQuery}
                manualPeriods={searchPeriod.manualPeriods}
                onAddManualPeriod={searchPeriod.addManualPeriod}
                onRemoveManualPeriod={searchPeriod.removeManualPeriod}
                onUpdateManualPeriod={searchPeriod.updateManualPeriod}
                filteredEvents={searchPeriod.filteredEvents}
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
              />
              
              {/* Search Button */}
              <div className="flex justify-center">
                <Button
                  onClick={performSearch}
                  disabled={!isSearchValid() || searchPeriod.isSearching}
                  className="px-8"
                >
                  <Search className="h-4 w-4 mr-2" />
                  {searchPeriod.isSearching ? 'Searching...' : 'Execute Search'}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="results" className="flex-1 overflow-y-auto">
              <SearchResultsSection
                searchResults={searchPeriod.searchResults}
                selectedResultIds={searchPeriod.selectedResultIds}
                onSelectedResultIdsChange={searchPeriod.setSelectedResultIds}
                onAddSelectedResults={handleAddSelectedResults}
                labelName={labelName}
                onLabelNameChange={setLabelName}
              />
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
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