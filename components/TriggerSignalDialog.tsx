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
  const [triggerLegend, setTriggerLegend] = useState('')
  
  // Use custom hooks for state management
  const searchConditions = useSearchConditions()
  const searchPeriod = useSearchPeriod(availableEvents)

  // Mock search function
  const performSearch = async () => {
    searchPeriod.setIsSearching(true)
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Generate mock search results based on current condition type
    const currentExpression = searchConditions.getCurrentExpression()
    const mockResults: SearchResult[] = [
      {
        id: '1',
        timestamp: '2024-01-15T10:30:15',
        parameters: { temperature: 85.2, pressure: 12.5, flow: 45.8, speed: 55 },
        matchedConditions: [currentExpression]
      },
      {
        id: '2',
        timestamp: '2024-01-15T11:15:30',
        parameters: { temperature: 92.1, pressure: 13.2, flow: 48.3, speed: 62 },
        matchedConditions: [currentExpression]
      },
      {
        id: '3',
        timestamp: '2024-01-15T14:22:45',
        parameters: { temperature: 88.7, pressure: 11.8, flow: 52.1, speed: 58 },
        matchedConditions: [currentExpression]
      }
    ]
    
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
      plant: searchPeriod.searchPeriodType === 'manual' ? searchPeriod.manualPeriod.plant : 'Signal Detection',
      machineNo: searchPeriod.searchPeriodType === 'manual' ? searchPeriod.manualPeriod.machineNo : 'AUTO',
      label: triggerLegend,
      labelDescription: `Conditions: ${result.matchedConditions.join(', ')} | Search period: ${searchPeriod.searchPeriodType === 'manual' ? 'Manual' : `${selectedEvents.length} events`}`,
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
    const hasValidLegend = triggerLegend.trim() !== ''
    
    return hasValidPeriod && hasValidConditions && hasValidLegend
  }




  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[95vw] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Trigger Signal Condition Search</DialogTitle>
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
                manualPeriod={searchPeriod.manualPeriod}
                onManualPeriodChange={searchPeriod.setManualPeriod}
                filteredEvents={searchPeriod.filteredEvents}
              />
              
              {/* Search Conditions */}
              <SearchConditionsSection
                triggerLegend={triggerLegend}
                onTriggerLegendChange={setTriggerLegend}
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