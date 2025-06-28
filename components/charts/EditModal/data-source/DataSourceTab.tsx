"use client"

import React, { useState, useCallback } from "react"
import { ManualEntryDialog } from "../../../dialogs/ManualEntryDialog"
import { TriggerSignalDialog } from "../../../dialogs/TriggerSignalDialog"
import { EventSelectionDialog } from "../../../dialogs/EventSelectionDialog"
import { ImportCSVDialog } from "../../../dialogs/ImportCSVDialog"
import { TriggerConditionEditDialog } from "../../../dialogs/TriggerConditionEditDialog"
import { AddDataWizardDialog } from "../../../dialogs/AddDataWizardDialog"
import { useManualEntry } from "@/hooks/useManualEntry"
import { useDataSourceManagement } from "@/hooks/useDataSourceManagement"
import { useTimeOffset } from "@/hooks/useTimeOffset"
import { EventInfo, SearchResult, CSVImportData, CSVDataSourceType } from "@/types"
import { processManualEntryData, createEventFromSearchResult } from "@/utils/dataSourceUtils"
import { ManualEntryInput, ManualEntryOutput } from "@/types/data-source"
import { CSVMetadata } from "@/stores/useCSVDataStore"
import { useToast } from "@/hooks/use-toast"
import { useCollectedPeriodStore } from "@/stores/useCollectedPeriodStore"
import { useCSVDataStore } from "@/stores/useCSVDataStore"
import { useEventMasterStore } from "@/stores/useEventMasterStore"
import { parseCSVFiles, validateCSVStructure, mapCSVDataToStandardFormat } from "@/utils/csvUtils"
import { mergeCSVDataUniversal, getMergedFileName } from "@/utils/csv/mergeUtils"
import { extractDateRangeFromCSV } from "@/utils/csvDateRangeUtils"
import { StandardizedCSVData } from "@/types/csv-data"
import { Checkbox } from "@/components/ui/checkbox"
import { createLogger } from "@/utils/logger"
import {
  TimeOffsetSettings,
  SelectedDataSourceTable,
  PeriodPool,
  SearchResults
} from "./components"

const logger = createLogger('DataSourceTab')

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
  const [addDataWizardOpen, setAddDataWizardOpen] = useState(false)
  const [periodPoolOpen, setPeriodPoolOpen] = useState(true)
  const [searchResultsOpen, setSearchResultsOpen] = useState(true)
  
  // Keep track of original search results for items added to data source
  const [originalSearchResults, setOriginalSearchResults] = useState<Map<string, SearchResult>>(new Map())
  
  const { toast } = useToast()
  const { addPeriod, periods: collectedPeriods } = useCollectedPeriodStore()
  const { saveCSVData } = useCSVDataStore()
  const { addEvent } = useEventMasterStore()
  

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

  // Helper functions for CSV import
  const prepareCSVFiles = (files: File[]) => {
    return Array.from(files).filter(file => 
      file.name.endsWith('.csv') || file.name.endsWith('.CSV')
    )
  }

  const parseAndValidateCSVFiles = async (
    csvFiles: File[], 
    dataSourceType: CSVDataSourceType, 
    plant: string, 
    machineNo: string
  ) => {
    const parseResult = await parseCSVFiles(csvFiles)
    
    if (!parseResult.success || !parseResult.data) {
      throw new Error(parseResult.error || "CSV解析に失敗しました")
    }

    const dataArrays: StandardizedCSVData[][] = []
    const parameterInfos: Array<{ parameters: string[]; units: string[] } | undefined> = []
    let combinedMetadata: CSVMetadata | null = null

    for (const parsedFile of parseResult.data) {
      // Validate CSV structure
      const validation = validateCSVStructure(parsedFile.headers, dataSourceType, parsedFile.metadata)
      if (!validation.valid) {
        const fileName = parsedFile.metadata?.fileName || 'unknown'
        throw new Error(`ファイル ${fileName} の必須カラムが不足しています: ${validation.missingColumns?.join(', ')}`)
      }

      // Convert to standardized format
      const standardizedData = mapCSVDataToStandardFormat(
        parsedFile,
        dataSourceType,
        plant,
        machineNo
      )

      dataArrays.push(standardizedData)
      parameterInfos.push(parsedFile.metadata?.parameterInfo)

      // Store metadata from first file
      if (!combinedMetadata && parsedFile.metadata) {
        combinedMetadata = parsedFile.metadata
      }
    }

    return { dataArrays, parameterInfos, combinedMetadata }
  }

  const mergeCSVDataIfNeeded = (
    fileNames: string[], 
    dataArrays: StandardizedCSVData[][], 
    parameterInfos: Array<{ parameters: string[]; units: string[] } | undefined>,
    combinedMetadata: CSVMetadata | null
  ) => {
    let allStandardizedData: StandardizedCSVData[] = []
    const warnings: string[] = []

    // Always merge multiple files
    if (dataArrays.length > 1) {
      logger.debug('Merging data from multiple files...')
      const mergeResult = mergeCSVDataUniversal(dataArrays, parameterInfos)
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
    } else {
      // Single file, no merge needed
      allStandardizedData = dataArrays.flat()
      
      // Ensure parameter info is set
      if (parameterInfos[0]) {
        combinedMetadata = {
          ...combinedMetadata,
          parameterInfo: parameterInfos[0]
        }
      }
    }

    return { allStandardizedData, combinedMetadata, warnings }
  }

  const extractOverallDateRange = (
    parseData: any[], 
    dataSourceType: CSVDataSourceType
  ) => {
    let overallMinDate: Date | null = null
    let overallMaxDate: Date | null = null
    let dateColumnName: string | null = null

    for (const parsedFile of parseData) {
      const dateRange = extractDateRangeFromCSV(parsedFile, dataSourceType)
      
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
    }

    if (!overallMinDate || !overallMaxDate) {
      throw new Error("CSVファイルから日付範囲を抽出できませんでした")
    }

    return { overallMinDate, overallMaxDate, dateColumnName }
  }

  const createPeriodFromCSVData = (
    data: CSVImportData,
    csvFiles: File[],
    overallMinDate: Date,
    overallMaxDate: Date,
    dateColumnName: string | null,
    combinedMetadata: CSVMetadata | null
  ) => {
    const fileNames = csvFiles.map(f => f.name)
    const fileName = combinedMetadata?.fileName || fileNames[0] || 'unknown'
    const periodId = `${data.plant}_${data.machineNo}_${data.dataSourceType}_${fileName.replace('.csv', '')}_${Date.now()}`

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

    const periodEvent: EventInfo = {
      id: periodId,
      plant: data.plant,
      machineNo: data.machineNo,
      label: data.label,
      labelDescription: data.labelDescription,
      event: data.event,
      eventDetail: data.eventDetail,
      start: collectedPeriod.startDate,
      end: collectedPeriod.endDate
    }

    return { periodId, collectedPeriod, periodEvent }
  }

  const handleCSVImport = useCallback(async (data: CSVImportData) => {
    console.log('[DataSourceTab] handleCSVImport called!')
    
    try {
      console.log('[DataSourceTab] About to log debug info')
      logger.debug('handleCSVImport started', {
        plant: data.plant,
        machineNo: data.machineNo,
        dataSourceType: data.dataSourceType,
        filesCount: data.files.length,
        fileNames: Array.from(data.files).map(f => f.name)
      })
      console.log('[DataSourceTab] Debug info logged successfully')
    } catch (logError) {
      console.error('[DataSourceTab] Error in logger.debug:', logError)
    }
    
    try {
      console.log('[DataSourceTab] Starting CSV import process...')
      
      // Step 1: Prepare CSV files
      console.log('[DataSourceTab] Step 1: Preparing CSV files')
      const csvFiles = prepareCSVFiles(data.files)
      console.log('[DataSourceTab] CSV files prepared:', csvFiles.length)
      logger.debug('CSV files filtered', {
        csvFilesCount: csvFiles.length,
        csvFileNames: csvFiles.map(f => f.name)
      })

      // Step 2: Parse and validate CSV files
      console.log('[DataSourceTab] Step 2: Parsing and validating CSV files')
      logger.debug('About to parse CSV files...')
      const { dataArrays, parameterInfos, combinedMetadata } = await parseAndValidateCSVFiles(
        csvFiles,
        data.dataSourceType,
        data.plant,
        data.machineNo
      )
      logger.debug('CSV files parsed successfully', {
        filesCount: dataArrays.length
      })

      // Step 3: Extract overall date range
      const parseResult = await parseCSVFiles(csvFiles) // Need this for date extraction
      const { overallMinDate, overallMaxDate, dateColumnName } = extractOverallDateRange(
        parseResult.data || [],
        data.dataSourceType
      )

      // Step 4: Merge data if needed
      const fileNames = csvFiles.map(f => f.name)
      const { allStandardizedData, combinedMetadata: updatedMetadata, warnings } = mergeCSVDataIfNeeded(
        fileNames,
        dataArrays,
        parameterInfos,
        combinedMetadata
      )

      logger.debug('Import processing complete', {
        dataLength: allStandardizedData.length,
        dateRange: { minDate: overallMinDate, maxDate: overallMaxDate },
        warnings: warnings.length
      })

      // Step 5: Create period objects
      const { periodId, collectedPeriod, periodEvent } = createPeriodFromCSVData(
        data,
        csvFiles,
        overallMinDate,
        overallMaxDate,
        dateColumnName,
        updatedMetadata
      )

      // Step 6: Save to CSV data store
      logger.debug('Saving to CSV data store', {
        periodId,
        dataLength: allStandardizedData.length,
        metadata: updatedMetadata
      })
      
      await saveCSVData(periodId, allStandardizedData, updatedMetadata || { fileName: fileNames[0] || 'unknown' })
      logger.debug('CSV data saved successfully')

      // Step 7: Add to CollectedPeriod store
      logger.debug('Adding to CollectedPeriod store', collectedPeriod)
      logger.debug('Current collectedPeriods count before add:', collectedPeriods.length)
      addPeriod(collectedPeriod)
      logger.debug('Added to CollectedPeriod store')
      
      // Verify the addition
      setTimeout(() => {
        logger.debug('Verification: CollectedPeriodStore state after add', {
          totalPeriodsInStore: collectedPeriods.length,
          periodIds: collectedPeriods.map(p => p.id),
          addedPeriodId: collectedPeriod.id,
          wasAdded: collectedPeriods.some(p => p.id === collectedPeriod.id)
        })
      }, 100)

      // Step 8: Add to period pool and auto-select
      logger.debug('Adding periodEvent to pool', {
        periodId: periodEvent.id,
        plant: periodEvent.plant,
        machineNo: periodEvent.machineNo,
        label: periodEvent.label,
        currentPoolLength: dataSource.periodPool.length
      })
      
      // Use functional update to ensure we have the latest state
      logger.debug('About to call setPeriodPool')
      try {
        dataSource.setPeriodPool((currentPool) => {
          logger.debug('Inside setPeriodPool - current pool length:', currentPool.length)
          const newPool = [...currentPool, periodEvent]
          logger.debug('New pool will have length:', newPool.length)
          return newPool
        })
        logger.debug('setPeriodPool completed')
      } catch (setPeriodPoolError) {
        logger.error('Error in setPeriodPool:', setPeriodPoolError)
        throw setPeriodPoolError
      }
      
      // Step 9: Add to EventMaster store for From Events functionality
      logger.debug('Adding event to EventMaster store', {
        eventId: periodEvent.id,
        label: periodEvent.label,
        event: periodEvent.event
      })
      
      try {
        const eventMasterData = {
          id: periodEvent.id,
          plant: periodEvent.plant,
          machineNo: periodEvent.machineNo,
          label: periodEvent.label,
          labelDescription: periodEvent.labelDescription || '',
          event: periodEvent.event,
          eventDetail: periodEvent.eventDetail || '',
          start: periodEvent.start,
          end: periodEvent.end
        }
        
        addEvent(eventMasterData)
        logger.debug('Event successfully added to EventMaster store')
      } catch (addEventError) {
        logger.error('Error adding event to EventMaster store:', addEventError)
        // Don't throw - this is not critical for CSV import success
      }
      
      logger.debug('About to call setSelectedPoolIds')
      try {
        dataSource.setSelectedPoolIds((currentIds) => {
          logger.debug('Inside setSelectedPoolIds - current size:', currentIds.size)
          logger.debug('Adding period ID:', periodEvent.id)
          const newIds = new Set([...currentIds, periodEvent.id])
          logger.debug('New selected IDs size:', newIds.size)
          return newIds
        })
        logger.debug('setSelectedPoolIds completed')
      } catch (setSelectedPoolIdsError) {
        logger.error('Error in setSelectedPoolIds:', setSelectedPoolIdsError)
        throw setSelectedPoolIdsError
      }
      
      // Add a small delay to ensure state updates are processed
      setTimeout(() => {
        logger.debug('State after updates:', {
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
      console.error('[DataSourceTab] CSV Import Error occurred:', error);
      console.error('[DataSourceTab] Error details:', {
        type: typeof error,
        constructor: error?.constructor?.name,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      
      // Enhanced error logging - use console.log to avoid Next.js error interception
      logger.error('CSV Import Error occurred');
      logger.error('Error type:', typeof error);
      logger.error('Error constructor:', error?.constructor?.name);
      logger.error('Error message:', error instanceof Error ? error.message : String(error));
      logger.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      // Try to safely stringify the error
      try {
        logger.error('Error stringified:', JSON.stringify(error, null, 2));
      } catch (stringifyError) {
        logger.error('Could not stringify error:', stringifyError);
      }
      
      
      toast({
        title: "CSV Import Failed",
        description: error instanceof Error ? error.message : "An error occurred during import",
        variant: "destructive",
      })
      
      // Log current state for debugging
      logger.debug('Current state after error:', {
        periodPoolLength: dataSource.periodPool.length,
        selectedPoolIdsSize: dataSource.selectedPoolIds.size,
        periodPoolIds: dataSource.periodPool.map(p => p.id)
      })
    }
  }, [addPeriod, saveCSVData, toast]) // Remove dataSource to avoid circular dependencies


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
          onAddData={() => setAddDataWizardOpen(true)}
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

      <AddDataWizardDialog
        isOpen={addDataWizardOpen}
        onClose={() => setAddDataWizardOpen(false)}
        onManualEntry={() => {
          setAddDataWizardOpen(false)
          manualEntry.openForNew()
        }}
        onFromEvents={() => {
          setAddDataWizardOpen(false)
          setEventSelectionOpen(true)
        }}
        onImportCSV={() => {
          setAddDataWizardOpen(false)
          setImportCSVOpen(true)
        }}
      />

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
      
      {/* Debug: Log handleCSVImport reference */}
      {React.useEffect(() => {
        logger.debug('DataSourceTab: handleCSVImport reference', {
          hasHandleCSVImport: !!handleCSVImport,
          type: typeof handleCSVImport,
          isFunction: typeof handleCSVImport === 'function'
        })
      }, [handleCSVImport])}

      <TriggerConditionEditDialog />
    </>
  )
}