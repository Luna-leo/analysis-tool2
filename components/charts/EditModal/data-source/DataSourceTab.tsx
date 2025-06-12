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
import { ManualEntryInput, ManualEntryOutput } from "@/types/data-source"
import { CSVMetadata } from "@/stores/useCSVDataStore"
import { parseCSVFiles, validateCSVStructure, mapCSVDataToStandardFormat } from "@/utils/csvUtils"
import { StandardizedCSVData } from "@/types/csv-data"
import { useToast } from "@/hooks/use-toast"
import { useCollectedPeriodStore } from "@/stores/useCollectedPeriodStore"
import { useCSVDataStore } from "@/stores/useCSVDataStore"
import { extractDateRangeFromCSV } from "@/utils/csvDateRangeUtils"
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
  const { addPeriod } = useCollectedPeriodStore()
  const { saveCSVData } = useCSVDataStore()

  const handleSaveManualEntry = (data: ManualEntryInput, editingItemId: string | null) => {
    const processedData = processManualEntryData(data)

    if (editingItemId) {
      const isInPool = dataSource.periodPool.some(item => item.id === editingItemId)
      const isInDataSource = selectedDataSourceItems.some(item => item.id === editingItemId)
      
      if (isInPool) {
        dataSource.setPeriodPool(
          dataSource.periodPool.map((item) =>
            item.id === editingItemId ? {
              ...item,
              ...processedData,
              id: editingItemId
            } : item
          )
        )
      } else if (isInDataSource) {
        setSelectedDataSourceItems(
          selectedDataSourceItems.map((item) =>
            item.id === editingItemId ? {
              ...item,
              ...processedData,
              id: editingItemId
            } : item
          )
        )
      }
    } else {
      const newEntry: EventInfo = {
        id: `manual_${Date.now()}`,
        plant: '',
        machineNo: '',
        event: '',
        start: '',
        end: '',
        ...processedData
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
        console.error('CSV Parse Error:', {
          files: data.files.map(f => ({ name: f.name, size: f.size })),
          error: parseResult.error
        })
        throw new Error(parseResult.error || "CSV解析に失敗しました")
      }

      // Process and standardize CSV data
      let allStandardizedData: StandardizedCSVData[] = []
      let overallMinDate: Date | null = null
      let overallMaxDate: Date | null = null
      let dateColumnName: string | null = null
      let combinedMetadata: CSVMetadata | null = null
      
      for (const parsedFile of parseResult.data) {
        // Validate CSV structure
        const validation = validateCSVStructure(parsedFile.headers, data.dataSourceType, parsedFile.metadata)
        if (!validation.valid) {
          console.error('CSV Validation Error:', {
            fileName: parsedFile.metadata?.fileName,
            headers: parsedFile.headers,
            dataSourceType: data.dataSourceType,
            metadata: parsedFile.metadata,
            missingColumns: validation.missingColumns
          })
          const fileName = parsedFile.metadata?.fileName || 'unknown'
          const headerInfo = `(検出されたヘッダー: ${parsedFile.headers.slice(0, 5).join(', ')}${parsedFile.headers.length > 5 ? '...' : ''})`
          throw new Error(`ファイル ${fileName} の必須カラムが不足しています: ${validation.missingColumns?.join(', ')} ${headerInfo}`)
        }

        // Convert to standardized format
        const standardizedData = mapCSVDataToStandardFormat(
          parsedFile,
          data.dataSourceType,
          data.plant,
          data.machineNo
        )
        allStandardizedData.push(...standardizedData)

        // Extract date range from this file
        const dateRange = extractDateRangeFromCSV(parsedFile, data.dataSourceType)
        
        if (dateRange.minDate && dateRange.maxDate) {
          if (!overallMinDate || dateRange.minDate < overallMinDate) {
            overallMinDate = dateRange.minDate
          }
          if (!overallMaxDate || dateRange.maxDate > overallMaxDate) {
            overallMaxDate = dateRange.maxDate
          }
          if (!dateColumnName && dateRange.dateColumnName) {
            dateColumnName = dateRange.dateColumnName
          }
        }

        // Store metadata from first file
        if (!combinedMetadata && parsedFile.metadata) {
          combinedMetadata = parsedFile.metadata
        }
      }

      if (!overallMinDate || !overallMaxDate) {
        throw new Error("CSVファイルから日付範囲を抽出できませんでした")
      }

      // Create a CollectedPeriod entry
      const collectedPeriod = {
        id: `collected_${Date.now()}`,
        plant: data.plant,
        machineNo: data.machineNo,
        dataSourceType: data.dataSourceType,
        startDate: overallMinDate.toISOString(),
        endDate: overallMaxDate.toISOString(),
        fileCount: data.files.length,
        importedAt: new Date().toISOString(),
        metadata: {
          dateColumnName: dateColumnName || undefined
        }
      }

      // Add to CollectedPeriod store
      addPeriod(collectedPeriod)

      // Save the actual CSV data
      saveCSVData(collectedPeriod.id, allStandardizedData, combinedMetadata || undefined)

      // Create an EventInfo entry for the period pool
      const periodEvent: EventInfo = {
        id: collectedPeriod.id,
        plant: data.plant,
        machineNo: data.machineNo,
        label: `${data.dataSourceType} Period`,
        labelDescription: `${data.files.length} files imported`,
        event: `${overallMinDate.toLocaleDateString()} - ${overallMaxDate.toLocaleDateString()}`,
        eventDetail: JSON.stringify(collectedPeriod),
        start: collectedPeriod.startDate,
        end: collectedPeriod.endDate
      }

      // Add to period pool
      dataSource.setPeriodPool([...dataSource.periodPool, periodEvent])
      
      // Automatically select the newly imported period
      dataSource.setSelectedPoolIds(new Set([...dataSource.selectedPoolIds, periodEvent.id]))

      toast({
        title: "インポート完了",
        description: `${data.files.length}個のファイルから期間データをインポートしました`,
      })
    } catch (error) {
      console.error('CSV Import Error:', error)
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
        {/* Collected Periods */}
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
        onSave={(data: any, editingItemId: string | null) => {
          const input: ManualEntryInput = {
            ...data,
            legend: data.legend
          }
          handleSaveManualEntry(input, editingItemId)
        }}
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