"use client"

import React, { useState } from "react"
import { ManualEntryDialog } from "../../../dialogs/ManualEntryDialog"
import { TriggerSignalDialog } from "../../../dialogs/TriggerSignalDialog"
import { EventSelectionDialog } from "../../../dialogs/EventSelectionDialog"
import { useManualEntry } from "@/hooks/useManualEntry"
import { useDataSourceManagement } from "@/hooks/useDataSourceManagement"
import { useTimeOffset } from "@/hooks/useTimeOffset"
import { EventInfo } from "@/types"
import { Button } from "@/components/ui/button"
import { Plus, Calendar, FileText } from "lucide-react"
import { processManualEntryData, createEventFromSearchResult } from "@/utils/dataSourceUtils"
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
  const dataSource = useDataSourceManagement()
  const timeOffset = useTimeOffset()
  const manualEntry = useManualEntry()
  
  const [eventSelectionOpen, setEventSelectionOpen] = useState(false)
  const [triggerSignalDialogOpen, setTriggerSignalDialogOpen] = useState(false)
  const [periodPoolOpen, setPeriodPoolOpen] = useState(true)
  const [searchResultsOpen, setSearchResultsOpen] = useState(true)

  const handleSaveManualEntry = (data: any, editingItemId: string | null) => {
    const processedData = processManualEntryData(data)

    if (editingItemId) {
      const isInPool = dataSource.periodPool.some(item => item.id === editingItemId)
      const isInDataSource = selectedDataSourceItems.some(item => item.id === editingItemId)
      
      if (isInPool) {
        dataSource.setPeriodPool(
          dataSource.periodPool.map((item) =>
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
      dataSource.setPeriodPool([...dataSource.periodPool, newEntry])
      // Automatically select the newly added period
      dataSource.setSelectedPoolIds(new Set([...dataSource.selectedPoolIds, newEntry.id]))
    }
    manualEntry.close()
  }


  const handleAddToDataSource = () => {
    const selectedPeriods = dataSource.periodPool.filter(p => dataSource.selectedPoolIds.has(p.id))
    const newItems = [...selectedDataSourceItems]
    
    selectedPeriods.forEach((period) => {
      if (!newItems.find((item) => item.id === period.id)) {
        newItems.push(period)
      }
    })
    
    setSelectedDataSourceItems(newItems)
    dataSource.setPeriodPool(dataSource.periodPool.filter(p => !dataSource.selectedPoolIds.has(p.id)))
    dataSource.setSelectedPoolIds(new Set())
  }

  
  const [bulkDuration, setBulkDuration] = useState<{ value: number; unit: 's' | 'm' | 'h' } | null>(null)

  const handleAddSearchResults = () => {
    const selectedResults = dataSource.searchResults.filter(r => dataSource.selectedResultIds.has(r.id))
    const eventsToAdd: EventInfo[] = selectedResults.map(result => {
      const resultLabel = dataSource.resultLabels.get(result.id) || 'Signal Detection'
      return createEventFromSearchResult(result, resultLabel, bulkDuration || undefined)
    })
    
    setSelectedDataSourceItems([...selectedDataSourceItems, ...eventsToAdd])
    const remainingResults = dataSource.searchResults.filter(r => !dataSource.selectedResultIds.has(r.id))
    dataSource.setSearchResults(remainingResults)
    const remainingLabels = new Map(dataSource.resultLabels)
    dataSource.selectedResultIds.forEach(id => remainingLabels.delete(id))
    dataSource.setResultLabels(remainingLabels)
    dataSource.setSelectedResultIds(new Set())
    setBulkDuration(null)
  }

  const handleBulkDurationChange = (resultIds: Set<string>, duration: number, unit: 's' | 'm' | 'h') => {
    setBulkDuration({ value: duration, unit })
  }


  const handleEditPeriod = (period: EventInfo) => {
    manualEntry.openForEdit(period)
  }

  const handleFilterByConditions = () => {
    setTriggerSignalDialogOpen(true)
  }

  return (
    <>
      <div className="space-y-4">
        {/* Data Source Actions */}
        <div className="border rounded-lg p-3 bg-muted/30">
          <h4 className="text-sm font-medium mb-3">Add Data Sources</h4>
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={manualEntry.openForNew}
              >
                <Plus className="h-4 w-4 mr-2" />
                Manual Entry
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEventSelectionOpen(true)}
              >
                <Calendar className="h-4 w-4 mr-2" />
                From Events
              </Button>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                // TODO: Implement CSV import functionality
                console.log("CSV import clicked")
              }}
            >
              <FileText className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
          </div>
        </div>

        {/* Period Pool */}
        <PeriodPool
          periodPool={dataSource.periodPool}
          selectedPoolIds={dataSource.selectedPoolIds}
          periodPoolOpen={periodPoolOpen}
          setPeriodPoolOpen={setPeriodPoolOpen}
          onTogglePeriod={dataSource.handleTogglePeriod}
          onSelectAll={dataSource.handleSelectAll}
          onRemoveFromPool={dataSource.handleRemoveFromPool}
          onEditPeriod={handleEditPeriod}
          onAddToDataSource={handleAddToDataSource}
          onFilterByConditions={handleFilterByConditions}
        />
        
        {/* Search Results */}
        <SearchResults
          searchResults={dataSource.searchResults}
          selectedResultIds={dataSource.selectedResultIds}
          resultLabels={dataSource.resultLabels}
          searchResultsOpen={searchResultsOpen}
          setSearchResultsOpen={setSearchResultsOpen}
          onToggleResult={dataSource.handleToggleResult}
          onSelectAllResults={dataSource.handleSelectAllResults}
          onLabelChange={dataSource.handleLabelChange}
          onBulkLabelChange={dataSource.handleBulkLabelChange}
          onAddSearchResults={handleAddSearchResults}
          onClearResults={dataSource.handleClearResults}
          onBulkDurationChange={handleBulkDurationChange}
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
                startOffset={timeOffset.startOffset}
                setStartOffset={timeOffset.setStartOffset}
                startOffsetUnit={timeOffset.startOffsetUnit}
                setStartOffsetUnit={timeOffset.setStartOffsetUnit}
                endOffset={timeOffset.endOffset}
                setEndOffset={timeOffset.setEndOffset}
                endOffsetUnit={timeOffset.endOffsetUnit}
                setEndOffsetUnit={timeOffset.setEndOffsetUnit}
                offsetSectionOpen={timeOffset.offsetSectionOpen}
                setOffsetSectionOpen={timeOffset.setOffsetSectionOpen}
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
        events={dataSource.events}
        onAddEvents={dataSource.handleAddEventsToPool}
      />

      <TriggerSignalDialog
        isOpen={triggerSignalDialogOpen}
        onClose={() => setTriggerSignalDialogOpen(false)}
        onApplyConditions={dataSource.handleApplyConditions}
        selectedDataSourceItems={dataSource.selectedPoolIds.size > 0 
          ? dataSource.periodPool.filter(p => dataSource.selectedPoolIds.has(p.id))
          : dataSource.periodPool}
      />
    </>
  )
}