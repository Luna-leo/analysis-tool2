"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { FileSelectionArea } from './FileSelectionArea'
import { PatternFilterSection } from './PatternFilterSection'
import { DataSourceInfoSection } from './DataSourceInfoSection'
import { FileListDisplay } from './FileListDisplay'
import { ImportProgress } from './ImportProgress'
import { useCSVImport } from '@/hooks/useCSVImport'

interface CSVImportContentProps {
  mode?: 'page' | 'dialog'
  onImportComplete?: () => void
}

export const CSVImportContentRefactored = React.memo(function CSVImportContentRefactored({ 
  mode = 'page', 
  onImportComplete 
}: CSVImportContentProps) {
  const {
    dataSourceType,
    plant,
    machineNo,
    filePaths,
    allFilePaths,
    fileNamePattern,
    patternType,
    isImporting,
    importProgress,
    importStatus,
    setDataSourceType,
    setPlant,
    setMachineNo,
    setFileNamePattern,
    setPatternType,
    handleFileSelect,
    handleImport
  } = useCSVImport(onImportComplete)

  const isValid = plant && machineNo && filePaths.length > 0

  return (
    <div className={mode === 'page' ? 'h-full overflow-y-auto' : ''}>
      <div className={`${mode === 'page' ? 'p-6' : 'p-4'} space-y-6 max-w-4xl mx-auto`}>
        {mode === 'page' && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold">CSV Import</h1>
            <p className="text-muted-foreground mt-1">
              Import CSV files to add data to the analysis system
            </p>
          </div>
        )}

        {/* File Selection */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">1. Select Files</h2>
          <FileSelectionArea onFileSelect={handleFileSelect} />
        </div>

        {/* Pattern Filter */}
        {allFilePaths.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">2. Filter Files (Optional)</h2>
            <PatternFilterSection
              fileNamePattern={fileNamePattern}
              setFileNamePattern={setFileNamePattern}
              patternType={patternType}
              setPatternType={setPatternType}
              filteredCount={filePaths.length}
              totalCount={allFilePaths.length}
            />
          </div>
        )}

        {/* Data Source Information */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">
            {allFilePaths.length > 0 ? '3' : '2'}. Data Source Information
          </h2>
          <DataSourceInfoSection
            dataSourceType={dataSourceType}
            setDataSourceType={setDataSourceType}
            plant={plant}
            setPlant={setPlant}
            machineNo={machineNo}
            setMachineNo={setMachineNo}
          />
        </div>

        {/* File List */}
        {filePaths.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">
              {allFilePaths.length > 0 ? '4' : '3'}. Review Files
            </h2>
            <FileListDisplay filePaths={filePaths} />
          </div>
        )}

        {/* Import Button */}
        <div className="flex justify-end gap-2 pt-4">
          {mode === 'dialog' && (
            <Button variant="outline" onClick={() => onImportComplete?.()}>
              Cancel
            </Button>
          )}
          <Button 
            onClick={handleImport} 
            disabled={!isValid || isImporting}
            className="min-w-[120px]"
          >
            {isImporting ? 'Importing...' : `Import ${filePaths.length} Files`}
          </Button>
        </div>
      </div>

      {/* Import Progress */}
      <ImportProgress
        isImporting={isImporting}
        progress={importProgress}
        status={importStatus}
      />
    </div>
  )
})