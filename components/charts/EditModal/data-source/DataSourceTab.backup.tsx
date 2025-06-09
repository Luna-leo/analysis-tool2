"use client"

import React, { useState } from "react"
import { ManualEntryDialog } from "../../../dialogs/ManualEntryDialog"
import { TriggerSignalDialog } from "../../../dialogs/TriggerSignalDialog"
import { EventSelectionDialog } from "../../../dialogs/EventSelectionDialog"
import { useManualEntry } from "@/hooks/useManualEntry"
import { EventInfo, SearchCondition, SearchResult } from "@/types"
import {
  TimeOffsetSettings,
  SelectedDataSourceTable,
  PeriodPool,
  SearchResults
} from "./components"

interface DataSourceTabProps {
  selectedDataSourceItems: EventInfo[]
  setSelectedDataSourceItems: React.Dispatch<React.SetStateAction<EventInfo[]>>
}

export function DataSourceTab({
  selectedDataSourceItems,
  setSelectedDataSourceItems,
}: DataSourceTabProps) {
  const [events, setEvents] = useState<EventInfo[]>([
    {
      id: "1",
      plant: "Plant A",
      machineNo: "M001",
      label: "Maintenance",
      labelDescription: "Regular check",
      event: "Scheduled Stop",
      eventDetail: "Monthly maintenance",
      start: "2024-01-15T10:00:00",
      end: "2024-01-15T12:00:00",
    },
    {
      id: "2",
      plant: "Plant A",
      machineNo: "M002",
      label: "Production",
      labelDescription: "Normal run",
      event: "Normal Operation",
      eventDetail: "Batch processing",
      start: "2024-01-15T08:00:00",
      end: "2024-01-15T16:00:00",
    },
    {
      id: "3",
      plant: "Plant B",
      machineNo: "M003",
      label: "Alert",
      labelDescription: "Warning state",
      event: "Temperature Warning",
      eventDetail: "Above threshold",
      start: "2024-01-15T14:30:00",
      end: "2024-01-15T14:45:00",
    },
  ])

  // Period pool state
  const [periodPool, setPeriodPool] = useState<EventInfo[]>([])
  const [selectedPoolIds, setSelectedPoolIds] = useState<Set<string>>(new Set())
  
  // Search results state
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [selectedResultIds, setSelectedResultIds] = useState<Set<string>>(new Set())
  const [resultLabels, setResultLabels] = useState<Map<string, string>>(new Map())
  const [isSearching, setIsSearching] = useState(false)
  const [appliedConditions, setAppliedConditions] = useState<SearchCondition[]>([])
  
  const manualEntry = useManualEntry()
  const [eventSelectionOpen, setEventSelectionOpen] = useState(false)
  const [triggerSignalDialogOpen, setTriggerSignalDialogOpen] = useState(false)

  const [startOffset, setStartOffset] = useState(0)
  const [startOffsetUnit, setStartOffsetUnit] = useState<'min' | 'sec'>('min')
  const [endOffset, setEndOffset] = useState(0)
  const [endOffsetUnit, setEndOffsetUnit] = useState<'min' | 'sec'>('min')
  const [offsetSectionOpen, setOffsetSectionOpen] = useState(false)
  
  // Collapsible states
  const [periodPoolOpen, setPeriodPoolOpen] = useState(true)
  const [searchResultsOpen, setSearchResultsOpen] = useState(true)

  const handleSaveManualEntry = (data: any, editingItemId: string | null) => {
    const processedData = { ...data }
    if (data.legend) {
      const legendMatch = data.legend.match(/^(.+?)\s*\((.+)\)$/)
      if (legendMatch) {
        processedData.label = legendMatch[1].trim()
        processedData.labelDescription = legendMatch[2].trim()
      } else {
        processedData.label = data.legend
        processedData.labelDescription = ""
      }
    }

    if (editingItemId) {
      // Check if editing item from pool or from selected data sources
      const isInPool = periodPool.some(item => item.id === editingItemId)
      const isInDataSource = selectedDataSourceItems.some(item => item.id === editingItemId)
      
      if (isInPool) {
        setPeriodPool(
          periodPool.map((item) =>
            item.id === editingItemId ? processedData : item
          )
        )
      } else if (isInDataSource) {
        setSelectedDataSourceItems(
          selectedDataSourceItems.map((item) =>
            item.id === editingItemId ? processedData : item
          )
        )
      }
    } else {
      const newEntry: EventInfo = {
        ...processedData,
        id: `manual_${Date.now()}`,
      }
      setPeriodPool([...periodPool, newEntry])
    }
    manualEntry.close()
  }

  const handleAddEventsToPool = (eventsToAdd: EventInfo[]) => {
    const newPool = [...periodPool]
    eventsToAdd.forEach((event) => {
      // Avoid duplicates
      if (!newPool.find((p) => p.id === event.id)) {
        newPool.push(event)
      }
    })
    setPeriodPool(newPool)
  }

  const handleAddToDataSource = () => {
    const selectedPeriods = periodPool.filter(p => selectedPoolIds.has(p.id))
    const newItems = [...selectedDataSourceItems]
    
    selectedPeriods.forEach((period) => {
      if (!newItems.find((item) => item.id === period.id)) {
        newItems.push(period)
      }
    })
    
    setSelectedDataSourceItems(newItems)
    // Remove added items from pool
    setPeriodPool(periodPool.filter(p => !selectedPoolIds.has(p.id)))
    setSelectedPoolIds(new Set())
  }

  const handleApplyConditions = async (conditions: SearchCondition[]) => {
    setAppliedConditions(conditions)
    setIsSearching(true)
    
    // Get periods to search
    const periodsToSearch = selectedPoolIds.size > 0 
      ? periodPool.filter(p => selectedPoolIds.has(p.id))
      : periodPool
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Generate mock search results based on selected periods
    const mockResults: SearchResult[] = []
    
    periodsToSearch.forEach((period) => {
      // Generate 2-3 results per period
      const resultsCount = 2 + Math.floor(Math.random() * 2)
      for (let i = 0; i < resultsCount; i++) {
        const startTime = new Date(period.start)
        const endTime = new Date(period.end)
        const timeDiff = endTime.getTime() - startTime.getTime()
        const randomTime = new Date(startTime.getTime() + Math.random() * timeDiff)
        
        mockResults.push({
          id: `${period.id}_result_${i}`,
          timestamp: randomTime.toISOString(),
          plant: period.plant,
          machineNo: period.machineNo,
          parameters: { 
            temperature: 80 + Math.random() * 20, 
            pressure: 10 + Math.random() * 5, 
            flow: 40 + Math.random() * 20, 
            speed: 50 + Math.random() * 20 
          },
          matchedConditions: conditions.map(c => `${c.parameter} ${c.operator} ${c.value}`)
        })
      }
    })
    
    setSearchResults(mockResults)
    setIsSearching(false)
  }
  
  const handleAddSearchResults = () => {
    const selectedResults = searchResults.filter(r => selectedResultIds.has(r.id))
    const eventsToAdd: EventInfo[] = selectedResults.map(result => {
      const resultLabel = resultLabels.get(result.id) || 'Signal Detection'
      const duration = 10 // Default 10 minutes
      const startTime = new Date(result.timestamp)
      const endTime = new Date(startTime.getTime() + duration * 60 * 1000)
      
      return {
        id: `trigger_${result.id}_${Date.now()}`,
        plant: result.plant || 'Unknown',
        machineNo: result.machineNo || 'Unknown',
        label: resultLabel,
        labelDescription: 'Detected by filter conditions',
        event: 'Trigger Event',
        eventDetail: `Auto-detected at ${result.timestamp}`,
        start: result.timestamp,
        end: endTime.toISOString()
      }
    })
    
    setSelectedDataSourceItems([...selectedDataSourceItems, ...eventsToAdd])
    // Remove only the added results from search results
    const remainingResults = searchResults.filter(r => !selectedResultIds.has(r.id))
    setSearchResults(remainingResults)
    // Clear labels only for selected results
    const remainingLabels = new Map(resultLabels)
    selectedResultIds.forEach(id => remainingLabels.delete(id))
    setResultLabels(remainingLabels)
    // Clear selection
    setSelectedResultIds(new Set())
  }

  const handleTogglePeriod = (periodId: string) => {
    const newSelectedIds = new Set(selectedPoolIds)
    if (newSelectedIds.has(periodId)) {
      newSelectedIds.delete(periodId)
    } else {
      newSelectedIds.add(periodId)
    }
    setSelectedPoolIds(newSelectedIds)
  }

  const handleSelectAll = () => {
    if (selectedPoolIds.size === periodPool.length) {
      setSelectedPoolIds(new Set())
    } else {
      setSelectedPoolIds(new Set(periodPool.map(p => p.id)))
    }
  }

  const handleRemoveFromPool = (periodId: string) => {
    setPeriodPool(periodPool.filter(p => p.id !== periodId))
    selectedPoolIds.delete(periodId)
    setSelectedPoolIds(new Set(selectedPoolIds))
  }

  const handleEditPeriod = (period: EventInfo) => {
    manualEntry.openForEdit(period)
  }

  const handleFilterByConditions = () => {
    setTriggerSignalDialogOpen(true)
  }

  const handleToggleResult = (resultId: string) => {
    const newSelected = new Set(selectedResultIds)
    if (newSelected.has(resultId)) {
      newSelected.delete(resultId)
    } else {
      newSelected.add(resultId)
    }
    setSelectedResultIds(newSelected)
  }

  const handleSelectAllResults = () => {
    if (selectedResultIds.size === searchResults.length) {
      setSelectedResultIds(new Set())
    } else {
      setSelectedResultIds(new Set(searchResults.map(r => r.id)))
    }
  }

  const handleLabelChange = (resultId: string, label: string) => {
    const newLabels = new Map(resultLabels)
    newLabels.set(resultId, label)
    setResultLabels(newLabels)
  }

  const handleClearResults = () => {
    setSearchResults([])
    setSelectedResultIds(new Set())
    setResultLabels(new Map())
  }

  return (
    <>
      <div className="space-y-4">
        {/* Period Pool */}
        <PeriodPool
          periodPool={periodPool}
          selectedPoolIds={selectedPoolIds}
          periodPoolOpen={periodPoolOpen}
          setPeriodPoolOpen={setPeriodPoolOpen}
          onManualEntry={manualEntry.openForNew}
          onEventSelection={() => setEventSelectionOpen(true)}
          onTogglePeriod={handleTogglePeriod}
          onSelectAll={handleSelectAll}
          onRemoveFromPool={handleRemoveFromPool}
          onEditPeriod={handleEditPeriod}
          onAddToDataSource={handleAddToDataSource}
          onFilterByConditions={handleFilterByConditions}
        />
        
        {/* Search Results */}
        <SearchResults
          searchResults={searchResults}
          selectedResultIds={selectedResultIds}
          resultLabels={resultLabels}
          searchResultsOpen={searchResultsOpen}
          setSearchResultsOpen={setSearchResultsOpen}
          onToggleResult={handleToggleResult}
          onSelectAllResults={handleSelectAllResults}
          onLabelChange={handleLabelChange}
          onAddSearchResults={handleAddSearchResults}
          onClearResults={handleClearResults}
        />

        {/* Selected Data Sources */}
        <div className="border rounded-lg p-3 bg-muted/30">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium">Selected Data Sources</h4>
          </div>

          {selectedDataSourceItems.length > 0 ? (
            <div className="space-y-3">
              <SelectedDataSourceTable
                selectedDataSourceItems={selectedDataSourceItems}
                onEditItem={(item) => {
                  manualEntry.openForEdit(item)
                }}
                onRemoveItem={(itemId) => {
                  setSelectedDataSourceItems(
                    selectedDataSourceItems.filter((i) => i.id !== itemId)
                  )
                }}
              />

              <TimeOffsetSettings
                startOffset={startOffset}
                setStartOffset={setStartOffset}
                startOffsetUnit={startOffsetUnit}
                setStartOffsetUnit={setStartOffsetUnit}
                endOffset={endOffset}
                setEndOffset={setEndOffset}
                endOffsetUnit={endOffsetUnit}
                setEndOffsetUnit={setEndOffsetUnit}
                offsetSectionOpen={offsetSectionOpen}
                setOffsetSectionOpen={setOffsetSectionOpen}
              />
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              No data source items selected. Add periods to the pool and then add them here.
            </p>
          )}
        </div>
      </div>

      <ManualEntryDialog
        isOpen={manualEntry.isOpen}
        editingItemId={manualEntry.editingItemId}
        data={manualEntry.data}
        onClose={manualEntry.close}
        onUpdateData={manualEntry.updateData}
        onSave={handleSaveManualEntry}
        isValid={manualEntry.isValid()}
      />

      <EventSelectionDialog
        isOpen={eventSelectionOpen}
        onClose={() => setEventSelectionOpen(false)}
        events={events}
        onAddEvents={handleAddEventsToPool}
      />

      <TriggerSignalDialog
        isOpen={triggerSignalDialogOpen}
        onClose={() => setTriggerSignalDialogOpen(false)}
        onApplyConditions={handleApplyConditions}
        selectedDataSourceItems={selectedPoolIds.size > 0 
          ? periodPool.filter(p => selectedPoolIds.has(p.id))
          : periodPool}
      />
    </>
  )
}