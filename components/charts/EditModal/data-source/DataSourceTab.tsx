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
import { useToast } from "@/hooks/use-toast"
import { useCollectedPeriodStore } from "@/stores/useCollectedPeriodStore"
import { useCSVDataStore } from "@/stores/useCSVDataStore"
import { parseCSVFiles, validateCSVStructure, mapCSVDataToStandardFormat } from "@/utils/csvUtils"
import { mergeCSVDataByTimestamp, shouldMergeFiles, getMergedFileName } from "@/utils/csv/mergeUtils"
import { extractDateRangeFromCSV } from "@/utils/csvDateRangeUtils"
import { StandardizedCSVData } from "@/types/csv-data"
import { Checkbox } from "@/components/ui/checkbox"
import {
  TimeOffsetSettings,
  SelectedDataSourceTable,
  PeriodPool,
  SearchResults
} from "./components"

interface DataSourceTabProps {
  selectedDataSourceItems: EventInfo[]
  setSelectedDataSourceItems: React.Dispatch<React.SetStateAction<EventInfo[]>>
  file?: any
  onOpenStyleDrawer?: (dataSource: EventInfo, index?: number) => void
  useDataSourceStyle?: boolean
  setUseDataSourceStyle?: React.Dispatch<React.SetStateAction<boolean>>
}

export function DataSourceTab({
  selectedDataSourceItems,
  setSelectedDataSourceItems,
  file,
  onOpenStyleDrawer,
  useDataSourceStyle,
  setUseDataSourceStyle,
}: DataSourceTabProps) {
  const dataSource = useDataSourceManagement()
  const timeOffset = useTimeOffset()
  const manualEntry = useManualEntry()
  
  // Debug: Monitor periodPool changes
  React.useEffect(() => {
    console.log('[DEBUG] DataSourceTab: periodPool changed', {
      periodPoolLength: dataSource.periodPool.length,
      displayedPeriodPoolLength: dataSource.displayedPeriodPool.length,
      activeFilterId: dataSource.activeFilterId,
      periodIds: dataSource.periodPool.map(p => p.id)
    })
  }, [dataSource.periodPool, dataSource.displayedPeriodPool, dataSource.activeFilterId])
  
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
        id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
    
    // Debug logging
    console.log('[DataSourceTab] handleAddToDataSource:', {
      fileId: file?.fileId,
      chartId: file?.id,
      chartTitle: file?.title,
      selectedPeriodsCount: selectedPeriods.length,
      newItemsCount: newItems.length,
      hasSetSelectedDataSourceItems: !!setSelectedDataSourceItems
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
    console.log('[DEBUG] handleCSVImport started', {
      plant: data.plant,
      machineNo: data.machineNo,
      dataSourceType: data.dataSourceType,
      filesCount: data.files.length,
      fileNames: Array.from(data.files).map(f => f.name)
    })
    
    try {
      // Convert File[] to the internal files array format
      const csvFiles = Array.from(data.files).filter(file => 
        file.name.endsWith('.csv') || file.name.endsWith('.CSV')
      )
      
      console.log('[DEBUG] CSV files filtered', {
        csvFilesCount: csvFiles.length,
        csvFileNames: csvFiles.map(f => f.name)
      })
      
      
      // Parse CSV files directly
      console.log('[DEBUG] About to parse CSV files...')
      let parseResult
      try {
        parseResult = await parseCSVFiles(csvFiles)
        console.log('[DEBUG] parseCSVFiles completed, success:', parseResult.success)
      } catch (parseError) {
        console.log('[DEBUG] Error in parseCSVFiles:', parseError)
        throw parseError
      }
      
      if (!parseResult.success || !parseResult.data) {
        console.log('[DEBUG] Parse failed - success:', parseResult.success, 'has data:', !!parseResult.data)
        throw new Error(parseResult.error || "CSV解析に失敗しました")
      }
      
      console.log('[DEBUG] CSV files parsed successfully', {
        filesCount: parseResult.data.length
      })
      
      // Check if files should be merged
      const fileNames = csvFiles.map(f => f.name)
      const shouldMerge = shouldMergeFiles(fileNames)
      
      let allStandardizedData: StandardizedCSVData[] = []
      let overallMinDate: Date | null = null
      let overallMaxDate: Date | null = null
      let dateColumnName: string | null = null
      let combinedMetadata: CSVMetadata | null = null
      const warnings: string[] = []
      
      // Arrays for merge processing
      const dataArrays: StandardizedCSVData[][] = []
      const parameterInfos: Array<{ parameters: string[]; units: string[] } | undefined> = []
      
      // Process each parsed file
      for (let i = 0; i < parseResult.data.length; i++) {
        const parsedFile = parseResult.data[i]
        
        // Validate CSV structure
        const validation = validateCSVStructure(parsedFile.headers, data.dataSourceType, parsedFile.metadata)
        if (!validation.valid) {
          const fileName = parsedFile.metadata?.fileName || 'unknown'
          throw new Error(`ファイル ${fileName} の必須カラムが不足しています: ${validation.missingColumns?.join(', ')}`)
        }
        
        // Convert to standardized format
        const standardizedData = mapCSVDataToStandardFormat(
          parsedFile,
          data.dataSourceType,
          data.plant,
          data.machineNo
        )
        
        // If merging, collect data for merge processing
        if (shouldMerge && parseResult.data.length > 1) {
          dataArrays.push(standardizedData)
          parameterInfos.push(parsedFile.metadata?.parameterInfo)
        } else {
          allStandardizedData.push(...standardizedData)
        }
        
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
      
      // Perform merge if needed
      if (shouldMerge && dataArrays.length > 1) {
        console.log('[DEBUG] Merging data from multiple files...')
        console.log('[DEBUG] Data arrays info:', {
          arrayCount: dataArrays.length,
          arraySizes: dataArrays.map(arr => arr.length),
          totalRows: dataArrays.reduce((sum, arr) => sum + arr.length, 0),
          firstArraySample: dataArrays[0].length > 0 ? {
            keys: Object.keys(dataArrays[0][0]),
            keyCount: Object.keys(dataArrays[0][0]).length
          } : null
        })
        
        let mergeResult
        try {
          mergeResult = mergeCSVDataByTimestamp(dataArrays, parameterInfos)
          console.log('[DEBUG] Merge completed successfully')
        } catch (mergeError) {
          console.log('[DEBUG] Error during merge:', mergeError)
          throw mergeError
        }
        allStandardizedData = mergeResult.mergedData
        
        // Update combined metadata with merged parameter info
        combinedMetadata = {
          ...combinedMetadata,
          parameterInfo: mergeResult.parameterInfo,
          fileName: getMergedFileName(fileNames)
        }
        
        // Collect merge warnings
        if (mergeResult.warnings && mergeResult.warnings.length > 0) {
          warnings.push(...mergeResult.warnings)
        }
      }
      
      if (!overallMinDate || !overallMaxDate) {
        throw new Error("CSVファイルから日付範囲を抽出できませんでした")
      }
      
      console.log('[DEBUG] Import processing complete', {
        dataLength: allStandardizedData.length,
        dateRange: { minDate: overallMinDate, maxDate: overallMaxDate },
        warnings: warnings.length
      })
      
      // Generate periodId
      const fileName = combinedMetadata?.fileName || fileNames[0] || 'unknown'
      const periodId = `${data.plant}_${data.machineNo}_${data.dataSourceType}_${fileName.replace('.csv', '')}_${Date.now()}`
      
      // Save to CSV data store
      console.log('[DEBUG] Saving to CSV data store', {
        periodId,
        dataLength: allStandardizedData.length,
        metadata: combinedMetadata
      })
      
      try {
        await saveCSVData(periodId, allStandardizedData, combinedMetadata || { fileName })
        console.log('[DEBUG] CSV data saved successfully')
      } catch (saveError) {
        console.log('[DEBUG] Error saving CSV data:', saveError)
        throw saveError
      }
      
      // Create a CollectedPeriod entry
      const collectedPeriod = {
        id: periodId,
        plant: data.plant,
        machineNo: data.machineNo,
        dataSourceType: data.dataSourceType,
        startDate: overallMinDate.toISOString(),
        endDate: overallMaxDate.toISOString(),
        fileCount: csvFiles.length,
        importedAt: new Date().toISOString(),
        metadata: {
          dateColumnName: dateColumnName || undefined
        }
      }
      
      // Add to CollectedPeriod store
      console.log('[DEBUG] Adding to CollectedPeriod store', collectedPeriod)
      try {
        addPeriod(collectedPeriod)
        console.log('[DEBUG] Added to CollectedPeriod store')
      } catch (addPeriodError) {
        console.log('[DEBUG] Error adding to CollectedPeriod store:', addPeriodError)
        throw addPeriodError
      }
      
      // Create an EventInfo entry for the period pool
      console.log('[DEBUG] Creating periodEvent with dates:', {
        overallMinDate,
        overallMaxDate,
        startDate: collectedPeriod.startDate,
        endDate: collectedPeriod.endDate
      })
      
      const periodEvent: EventInfo = {
        id: periodId,
        plant: data.plant,
        machineNo: data.machineNo,
        label: `${data.dataSourceType} Period`,
        labelDescription: `${csvFiles.length} files imported`,
        event: `${overallMinDate.toLocaleDateString()} - ${overallMaxDate.toLocaleDateString()}`,
        eventDetail: JSON.stringify(collectedPeriod),
        start: collectedPeriod.startDate,
        end: collectedPeriod.endDate
      }
      
      // Add to period pool and auto-select
      console.log('[DEBUG] Adding periodEvent to pool', {
        periodId: periodEvent.id,
        plant: periodEvent.plant,
        machineNo: periodEvent.machineNo,
        label: periodEvent.label,
        currentPoolLength: dataSource.periodPool.length
      })
      
      // Use functional update to ensure we have the latest state
      console.log('[DEBUG] About to call setPeriodPool')
      try {
        dataSource.setPeriodPool((currentPool) => {
          console.log('[DEBUG] Inside setPeriodPool - current pool length:', currentPool.length)
          const newPool = [...currentPool, periodEvent]
          console.log('[DEBUG] New pool will have length:', newPool.length)
          return newPool
        })
        console.log('[DEBUG] setPeriodPool completed')
      } catch (setPeriodPoolError) {
        console.log('[DEBUG] Error in setPeriodPool:', setPeriodPoolError)
        throw setPeriodPoolError
      }
      
      console.log('[DEBUG] About to call setSelectedPoolIds')
      try {
        dataSource.setSelectedPoolIds((currentIds) => {
          console.log('[DEBUG] Inside setSelectedPoolIds - current size:', currentIds.size)
          console.log('[DEBUG] Adding period ID:', periodEvent.id)
          const newIds = new Set([...currentIds, periodEvent.id])
          console.log('[DEBUG] New selected IDs size:', newIds.size)
          return newIds
        })
        console.log('[DEBUG] setSelectedPoolIds completed')
      } catch (setSelectedPoolIdsError) {
        console.log('[DEBUG] Error in setSelectedPoolIds:', setSelectedPoolIdsError)
        throw setSelectedPoolIdsError
      }
      
      // Add a small delay to ensure state updates are processed
      setTimeout(() => {
        console.log('[DEBUG] State after updates:', {
          periodPoolLength: dataSource.periodPool.length,
          selectedPoolIdsSize: dataSource.selectedPoolIds.size,
          lastAddedId: periodEvent.id,
          isInPool: dataSource.periodPool.some(p => p.id === periodEvent.id),
          isSelected: dataSource.selectedPoolIds.has(periodEvent.id)
        })
      }, 100)
      
      // Close the dialog
      setImportCSVOpen(false)
      
      // Show success message with warnings if any
      const warningMessage = warnings.length > 0 
        ? ` (${warnings.length} warning(s) encountered)`
        : ""
      
      toast({
        title: "CSV Import Complete",
        description: `Successfully imported ${csvFiles.length} files${warningMessage} and added to period pool`,
      })
      
    } catch (error) {
      // Enhanced error logging - use console.log to avoid Next.js error interception
      console.log('[DEBUG] CSV Import Error occurred');
      console.log('[DEBUG] Error type:', typeof error);
      console.log('[DEBUG] Error constructor:', error?.constructor?.name);
      console.log('[DEBUG] Error message:', error instanceof Error ? error.message : String(error));
      console.log('[DEBUG] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      // Try to safely stringify the error
      try {
        console.log('[DEBUG] Error stringified:', JSON.stringify(error, null, 2));
      } catch (stringifyError) {
        console.log('[DEBUG] Could not stringify error:', stringifyError);
      }
      
      
      toast({
        title: "CSV Import Failed",
        description: error instanceof Error ? error.message : "An error occurred during import",
        variant: "destructive",
      })
      
      // Log current state for debugging
      console.log('[DEBUG] Current state after error:', {
        periodPoolLength: dataSource.periodPool.length,
        selectedPoolIdsSize: dataSource.selectedPoolIds.size,
        periodPoolIds: dataSource.periodPool.map(p => p.id)
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
            {setUseDataSourceStyle && selectedDataSourceItems.length > 0 && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="use-data-source-style"
                  checked={useDataSourceStyle}
                  onCheckedChange={(checked) => setUseDataSourceStyle(checked as boolean)}
                />
                <label
                  htmlFor="use-data-source-style"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Style by Data Source
                </label>
              </div>
            )}
          </div>

          {selectedDataSourceItems.length > 0 ? (
            <div className="space-y-3">
              <SelectedDataSourceTable
                selectedDataSourceItems={selectedDataSourceItems}
                onEditItem={(item) => {
                  manualEntry.openForEdit(item)
                }}
                onReturnItem={handleReturnItem}
                onOpenStyleDrawer={onOpenStyleDrawer}
                file={file}
                useDataSourceStyle={useDataSourceStyle}
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