"use client"

import React, { useState } from "react"
import { ManualEntryDialog } from "../../../dialogs/ManualEntryDialog"
import { TriggerSignalDialog } from "../../../dialogs/TriggerSignalDialog"
import { EventSelectionDialog } from "../../../dialogs/EventSelectionDialog"
import { ImportCSVDialog } from "../../../dialogs/ImportCSVDialog"
import { TriggerConditionEditDialog } from "../../../dialogs/TriggerConditionEditDialog"
import { useManualEntry } from "@/hooks/useManualEntry"
import { useDataSourceManagement } from "@/hooks/useDataSourceManagement"
import { useTimeOffset } from "@/hooks/useTimeOffset"
import { EventInfo, SearchResult, CSVImportData } from "@/types"
import { processManualEntryData, createEventFromSearchResult } from "@/utils/dataSourceUtils"
import { parseCSVFiles, validateCSVStructure, mapCSVDataToStandardFormat } from "@/utils/csvUtils"
import { useToast } from "@/hooks/use-toast"
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
  const [importCSVOpen, setImportCSVOpen] = useState(false)
  const [periodPoolOpen, setPeriodPoolOpen] = useState(true)
  const [searchResultsOpen, setSearchResultsOpen] = useState(true)
  
  // Keep track of original search results for items added to data source
  const [originalSearchResults, setOriginalSearchResults] = useState<Map<string, SearchResult>>(new Map())
  
  const { toast } = useToast()

  const handleSaveManualEntry = (data: any, editingItemId: string | null) => {
    const processedData = processManualEntryData(data)

    if (editingItemId) {
      const isInPool = dataSource.periodPool.some(item => item.id === editingItemId)
      const isInDataSource = selectedDataSourceItems.some(item => item.id === editingItemId)
      
      if (isInPool) {
        dataSource.setPeriodPool(
          dataSource.periodPool.map((item) =>
            item.id === editingItemId ? (processedData as unknown as EventInfo) : item
          )
        )
      } else if (isInDataSource) {
        setSelectedDataSourceItems(
          selectedDataSourceItems.map((item) =>
            item.id === editingItemId ? (processedData as unknown as EventInfo) : item
          )
        )
      }
    } else {
      const newEntry: EventInfo = {
        ...(processedData as unknown as EventInfo),
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
    const newOriginalResults = new Map(originalSearchResults)
    
    const eventsToAdd: EventInfo[] = selectedResults.map(result => {
      const resultLabel = dataSource.resultLabels.get(result.id) || 'Signal Detection'
      const eventInfo = createEventFromSearchResult(result, resultLabel, bulkDuration || undefined)
      
      // Store the original search result for later restoration
      newOriginalResults.set(eventInfo.id, result)
      
      return eventInfo
    })
    
    setOriginalSearchResults(newOriginalResults)
    setSelectedDataSourceItems([...selectedDataSourceItems, ...eventsToAdd])
    const remainingResults = dataSource.searchResults.filter(r => !dataSource.selectedResultIds.has(r.id))
    dataSource.setSearchResults(remainingResults)
    const remainingLabels = new Map(dataSource.resultLabels)
    dataSource.selectedResultIds.forEach(id => remainingLabels.delete(id))
    dataSource.setResultLabels(remainingLabels)
    dataSource.setSelectedResultIds(new Set())
    setBulkDuration(null)
  }

  const handleBulkDurationChange = (_resultIds: Set<string>, duration: number, unit: 's' | 'm' | 'h') => {
    setBulkDuration({ value: duration, unit })
  }


  const handleEditPeriod = (period: EventInfo) => {
    manualEntry.openForEdit(period)
  }

  const handleFilterByConditions = () => {
    setTriggerSignalDialogOpen(true)
  }

  const handleReturnItem = (item: EventInfo) => {
    // Check if we have the original search result stored
    const originalSearchResult = originalSearchResults.get(item.id)
    
    if (originalSearchResult) {
      // This item was from search results - restore the original search result
      dataSource.setSearchResults([...dataSource.searchResults, originalSearchResult])
      
      // Restore the label if it exists
      if (item.label && item.label !== 'Signal Detection') {
        dataSource.handleLabelChange(originalSearchResult.id, item.label)
      }
      
      // Remove from our tracking map
      const newOriginalResults = new Map(originalSearchResults)
      newOriginalResults.delete(item.id)
      setOriginalSearchResults(newOriginalResults)
    } else {
      // Return to period pool (for items originally from period pool)
      dataSource.setPeriodPool([...dataSource.periodPool, item])
    }
    
    // Remove from selected data sources
    setSelectedDataSourceItems(selectedDataSourceItems.filter(i => i.id !== item.id))
  }

  const handleCSVImport = async (data: CSVImportData) => {
    try {
      // Parse CSV files
      const parseResult = await parseCSVFiles(data.files)
      
      if (!parseResult.success || !parseResult.data) {
        throw new Error(parseResult.error || "CSV解析に失敗しました")
      }

      // Validate and process each file
      let totalRowsImported = 0
      const importedEvents: EventInfo[] = []
      
      for (const parsedFile of parseResult.data) {
        // Validate CSV structure
        const validation = validateCSVStructure(parsedFile.headers, data.dataSourceType)
        if (!validation.valid) {
          throw new Error(`ファイル ${parsedFile.metadata.fileName} の必須カラムが不足しています: ${validation.missingColumns?.join(', ')}`)
        }

        // Map data to standard format
        const standardData = mapCSVDataToStandardFormat(
          parsedFile,
          data.dataSourceType,
          data.plant,
          data.machineNo
        )

        // Convert to EventInfo format for each row
        standardData.forEach((row, index) => {
          const eventInfo: EventInfo = {
            id: `csv_${data.dataSourceType}_${Date.now()}_${index}`,
            plant: data.plant,
            machineNo: data.machineNo,
            label: `${data.dataSourceType} Import`,
            labelDescription: `Imported from ${parsedFile.metadata.fileName}`,
            event: `Row ${row.rowNumber}`,
            eventDetail: JSON.stringify(row),
            start: String(row.timestamp || row.datetime || row.time || new Date().toISOString()),
            end: String(row.timestamp || row.datetime || row.time || new Date().toISOString())
          }
          importedEvents.push(eventInfo)
        })
        
        totalRowsImported += standardData.length
      }

      // Add imported events to period pool
      dataSource.setPeriodPool([...dataSource.periodPool, ...importedEvents])
      
      // Automatically select the newly imported events
      const newSelectedIds = new Set([...dataSource.selectedPoolIds])
      importedEvents.forEach(event => newSelectedIds.add(event.id))
      dataSource.setSelectedPoolIds(newSelectedIds)

      toast({
        title: "インポート完了",
        description: `${data.files.length}個のファイルから${totalRowsImported}件のデータをインポートしました`,
      })
    } catch (error) {
      toast({
        title: "インポートエラー",
        description: error instanceof Error ? error.message : "CSVインポート中にエラーが発生しました",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <div className="space-y-4">
        {/* Period Pool */}
        <PeriodPool
          periodPool={dataSource.periodPool}
          displayedPeriodPool={dataSource.displayedPeriodPool}
          selectedPoolIds={dataSource.selectedPoolIds}
          periodPoolOpen={periodPoolOpen}
          setPeriodPoolOpen={setPeriodPoolOpen}
          onTogglePeriod={dataSource.handleTogglePeriod}
          onSelectAll={dataSource.handleSelectAll}
          onRemoveFromPool={dataSource.handleRemoveFromPool}
          onEditPeriod={handleEditPeriod}
          onAddToDataSource={handleAddToDataSource}
          onManualEntry={manualEntry.openForNew}
          onFromEvents={() => setEventSelectionOpen(true)}
          onImportCSV={() => setImportCSVOpen(true)}
          activeFilterId={dataSource.activeFilterId}
          onFilterChange={dataSource.handleApplyFilter}
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
          activeFilterName={dataSource.getActiveFilterName()}
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
                onReturnItem={handleReturnItem}
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

      <ImportCSVDialog
        open={importCSVOpen}
        onOpenChange={setImportCSVOpen}
        onImport={handleCSVImport}
      />

      <TriggerConditionEditDialog />
    </>
  )
}