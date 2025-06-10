import { useState, useCallback, useEffect } from 'react'
import { CSVDataSourceType } from '@/types'
import { useToast } from '@/hooks/use-toast'

// Convert wildcard pattern to regex
const wildcardToRegex = (pattern: string): RegExp => {
  const escapedPattern = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape special regex chars except * and ?
    .replace(/\*/g, '.*') // * matches any characters
    .replace(/\?/g, '.') // ? matches single character
  return new RegExp(`^${escapedPattern}$`, 'i')
}

export function useCSVImport(onImportComplete?: () => void) {
  const [dataSourceType, setDataSourceType] = useState<CSVDataSourceType>("SSAC")
  const [plant, setPlant] = useState("")
  const [machineNo, setMachineNo] = useState("")
  const [filePaths, setFilePaths] = useState<string[]>([])
  const [allFilePaths, setAllFilePaths] = useState<string[]>([])
  const [fileNamePattern, setFileNamePattern] = useState("")
  const [patternType, setPatternType] = useState<"wildcard" | "regex">("wildcard")
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importStatus, setImportStatus] = useState("")
  
  const { toast } = useToast()

  // Filter files based on pattern
  const filterFilesByPattern = useCallback((pathsToFilter: string[]): string[] => {
    if (!fileNamePattern) return pathsToFilter

    try {
      const regex = patternType === 'regex' 
        ? new RegExp(fileNamePattern, 'i')
        : wildcardToRegex(fileNamePattern)

      return pathsToFilter.filter(path => {
        const fileName = path.split('/').pop() || path.split('\\').pop() || ''
        return regex.test(fileName)
      })
    } catch (error) {
      // Invalid regex pattern
      return pathsToFilter
    }
  }, [fileNamePattern, patternType])

  // Apply pattern filter whenever pattern or files change
  useEffect(() => {
    const filtered = filterFilesByPattern(allFilePaths)
    setFilePaths(filtered)
  }, [allFilePaths, fileNamePattern, patternType, filterFilesByPattern])

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
    if (!plant || !machineNo || filePaths.length === 0) {
      toast({
        title: "Input Error",
        description: "Please fill in all required fields",
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