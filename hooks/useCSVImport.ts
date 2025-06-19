import { useState, useCallback, useEffect } from 'react'
import { CSVDataSourceType } from '@/types'
import { useToast } from '@/hooks/use-toast'
import { useCSVValidation } from './useCSVValidation'
import { filterFilesByPattern } from '@/utils/csv/parseUtils'
import { CSV_DEFAULTS, CSV_VALIDATION_MESSAGES, CSV_UI_TEXT } from '@/constants/csvImport'
import { useInputHistoryStore } from '@/stores/useInputHistoryStore'
import { useCSVDataStore } from '@/stores/useCSVDataStore'
import { parseCSVContent } from '@/utils/csvUtils'

export function useCSVImport(onImportComplete?: () => void) {
  const [dataSourceType, setDataSourceType] = useState<CSVDataSourceType>(CSV_DEFAULTS.dataSourceType)
  const [plant, setPlant] = useState("")
  const [machineNo, setMachineNo] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [allFiles, setAllFiles] = useState<File[]>([])
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
  const { saveCSVData } = useCSVDataStore()

  // Filter files based on pattern
  const applyFileFilter = useCallback((filesToFilter: File[]): File[] => {
    const fileNames = filesToFilter.map(f => f.name)
    const filteredNames = filterFilesByPattern(fileNames, fileNamePattern, patternType)
    return filesToFilter.filter(f => filteredNames.includes(f.name))
  }, [fileNamePattern, patternType])

  // Apply pattern filter whenever pattern or files change
  useEffect(() => {
    const filtered = applyFileFilter(allFiles)
    setFiles(filtered)
    setFilePaths(filtered.map(f => f.name))
  }, [allFiles, applyFileFilter])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (selectedFiles) {
      const csvFiles = Array.from(selectedFiles)
        .filter(file => file.name.endsWith('.csv') || file.name.endsWith('.CSV'))
      setAllFiles(csvFiles)
      setAllFilePaths(csvFiles.map(f => f.name))
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
      const totalFiles = files.length
      let successCount = 0
      
      for (let i = 0; i < totalFiles; i++) {
        const file = files[i]
        setImportStatus(`Processing file ${i + 1} of ${totalFiles}: ${file.name}`)
        setImportProgress(((i + 1) / totalFiles) * 100)
        
        try {
          // Read file content
          const content = await readFileContent(file)
          
          // Parse CSV content
          const parsedData = parseCSVContent(content, {
            plant,
            machineNo,
            sourceType: dataSourceType,
            fileName: file.name
          })
          
          if (parsedData && parsedData.data.length > 0) {
            // Generate periodId
            const periodId = `${plant}_${machineNo}_${dataSourceType}_${file.name.replace('.csv', '')}_${Date.now()}`
            
            // Save to CSV data store
            await saveCSVData(periodId, parsedData.data, {
              parameterInfo: parsedData.parameterInfo,
              fileName: file.name,
              format: parsedData.format
            })
            
            successCount++
          }
        } catch (fileError) {
          console.error(`Failed to process file ${file.name}:`, fileError)
          toast({
            title: "File Processing Error",
            description: `Failed to process ${file.name}: ${fileError instanceof Error ? fileError.message : 'Unknown error'}`,
            variant: "destructive",
          })
        }
      }
      
      if (successCount > 0) {
        toast({
          title: "Import Successful",
          description: `Successfully imported ${successCount} of ${totalFiles} CSV files`,
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
        setAllFiles([])
        setAllFilePaths([])
        setFileNamePattern("")
      } else {
        throw new Error("No files were successfully imported")
      }
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

  // Helper function to read file content
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result
        if (typeof content === 'string') {
          resolve(content)
        } else {
          reject(new Error('Failed to read file content'))
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
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