import { useState, useCallback, useEffect } from 'react'
import { CSVDataSourceType } from '@/types'
import { useToast } from '@/hooks/use-toast'
import { useCSVValidation } from './useCSVValidation'
import { filterFilesByPattern } from '@/utils/csv/parseUtils'
import { CSV_DEFAULTS, CSV_VALIDATION_MESSAGES, CSV_UI_TEXT } from '@/constants/csvImport'
import { useInputHistoryStore } from '@/stores/useInputHistoryStore'

export function useCSVImport(onImportComplete?: () => void) {
  const [dataSourceType, setDataSourceType] = useState<CSVDataSourceType>(CSV_DEFAULTS.dataSourceType)
  const [plant, setPlant] = useState("")
  const [machineNo, setMachineNo] = useState("")
  const [filePaths, setFilePaths] = useState<string[]>([])
  const [allFilePaths, setAllFilePaths] = useState<string[]>([])
  const [fileNamePattern, setFileNamePattern] = useState("")
  const [patternType, setPatternType] = useState<"wildcard" | "regex">(CSV_DEFAULTS.patternType)
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importStatus, setImportStatus] = useState("")
  
  const { toast } = useToast()
  const { validate } = useCSVValidation()
  const { addPlantHistory, addMachineHistory } = useInputHistoryStore()

  // Filter files based on pattern
  const applyFileFilter = useCallback((pathsToFilter: string[]): string[] => {
    return filterFilesByPattern(pathsToFilter, fileNamePattern, patternType)
  }, [fileNamePattern, patternType])

  // Apply pattern filter whenever pattern or files change
  useEffect(() => {
    const filtered = applyFileFilter(allFilePaths)
    setFilePaths(filtered)
  }, [allFilePaths, applyFileFilter])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (selectedFiles) {
      const paths = Array.from(selectedFiles)
        .filter(file => file.name.endsWith('.csv') || file.name.endsWith('.CSV'))
        .map(file => file.name) // Note: Browser security prevents getting full paths
      setAllFilePaths(paths)
    }
  }, [])

  const handleImport = async () => {
    const validation = validate({ plant, machineNo, files: filePaths })
    
    if (!validation.isValid) {
      toast({
        title: "Validation Error",
        description: validation.errors.join(', '),
        variant: "destructive",
      })
      return
    }

    setIsImporting(true)
    setImportProgress(0)
    try {
      // Simulate import progress
      const totalFiles = filePaths.length
      for (let i = 0; i < totalFiles; i++) {
        setImportStatus(`Processing file ${i + 1} of ${totalFiles}: ${filePaths[i]}`)
        setImportProgress(((i + 1) / totalFiles) * 100)
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
      toast({
        title: "Import Successful",
        description: `Successfully imported ${totalFiles} CSV files`,
      })
      
      // Save to history on successful import
      addPlantHistory(plant)
      addMachineHistory(machineNo)
      
      if (onImportComplete) {
        onImportComplete()
      }
      
      // Reset form
      setPlant("")
      setMachineNo("")
      setAllFilePaths([])
      setFileNamePattern("")
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "An error occurred during import",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
      setImportProgress(0)
      setImportStatus("")
    }
  }

  return {
    // State
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
    
    // Setters
    setDataSourceType,
    setPlant,
    setMachineNo,
    setFileNamePattern,
    setPatternType,
    
    // Handlers
    handleFileSelect,
    handleImport
  }
}