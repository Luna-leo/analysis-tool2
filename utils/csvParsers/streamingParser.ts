import { ParsedCSVData } from '@/types/csv-data'
import { parseCSVLine, removeBOM } from '../csv/parseUtils'
import { CSVErrorCollector } from '../csv/errorHandling'

export interface StreamingParseOptions {
  onProgress?: (progress: number) => void
  onChunk?: (rows: any[], startIndex: number) => void
  chunkSize?: number
  errorCollector?: CSVErrorCollector
}

/**
 * Parse CSV content in a streaming manner
 * This allows handling large files without loading everything into memory at once
 */
export async function parseCSVStreaming(
  content: string,
  fileName: string,
  options: StreamingParseOptions = {}
): Promise<ParsedCSVData> {
  const { onProgress, onChunk, chunkSize = 1000, errorCollector } = options
  
  // Remove BOM if present
  const cleanContent = removeBOM(content)
  const lines = cleanContent.split('\n')
  const totalLines = lines.length
  
  if (totalLines === 0) {
    return {
      headers: [],
      rows: [],
      metadata: { fileName, format: 'streaming' }
    }
  }
  
  // Parse headers
  const headers = parseCSVLine(lines[0])
  
  // Process data in chunks
  const rows: Record<string, string | number | null>[] = []
  let currentChunk: Record<string, string | number | null>[] = []
  
  for (let i = 1; i < totalLines; i++) {
    const line = lines[i].trim()
    if (!line) continue // Skip empty lines
    
    try {
      const rowArray = parseCSVLine(line)
      
      // Check if row has the expected number of columns
      if (rowArray.length !== headers.length) {
        errorCollector?.addValidationError(
          `Row has ${rowArray.length} columns, expected ${headers.length}`,
          { line: i + 1 }
        )
      }
      
      const rowObj: Record<string, string | number | null> = {}
      
      headers.forEach((header, index) => {
        const value = rowArray[index] || null
        const numValue = Number(value)
        rowObj[header] = !isNaN(numValue) && value !== '' ? numValue : value
      })
      
      currentChunk.push(rowObj)
      rows.push(rowObj)
    } catch (error) {
      errorCollector?.addParsingError(
        `Failed to parse line: ${error instanceof Error ? error.message : 'Unknown error'}`,
        i + 1
      )
    }
    
    // Process chunk if it reaches the specified size
    if (currentChunk.length >= chunkSize) {
      if (onChunk) {
        await new Promise(resolve => {
          // Use setTimeout to allow UI updates
          setTimeout(() => {
            onChunk(currentChunk, i - currentChunk.length + 1)
            resolve(undefined)
          }, 0)
        })
      }
      currentChunk = []
    }
    
    // Report progress
    if (onProgress && i % 100 === 0) {
      const progress = (i / totalLines) * 100
      onProgress(progress)
    }
  }
  
  // Process remaining chunk
  if (currentChunk.length > 0 && onChunk) {
    onChunk(currentChunk, totalLines - currentChunk.length)
  }
  
  // Final progress
  if (onProgress) {
    onProgress(100)
  }
  
  return {
    headers,
    rows,
    metadata: {
      fileName,
      format: 'streaming'
    }
  }
}

/**
 * Parse CSV file using FileReader streaming API
 * This is more memory efficient for very large files
 */
export async function parseCSVFileStreaming(
  file: File,
  options: StreamingParseOptions & {
    encoding?: string
  } = {}
): Promise<ParsedCSVData> {
  const { encoding = 'utf-8', errorCollector, ...parseOptions } = options
  
  errorCollector?.setCurrentFile(file.name)
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string
        const result = await parseCSVStreaming(content, file.name, { ...parseOptions, errorCollector })
        resolve(result)
      } catch (error) {
        errorCollector?.addParsingError(
          `Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
        reject(error)
      }
    }
    
    reader.onerror = () => {
      const errorMsg = 'Failed to read file'
      errorCollector?.addEncodingError(errorMsg)
      reject(new Error(errorMsg))
    }
    
    reader.readAsText(file, encoding)
  })
}

/**
 * Parse CSV using Web Streams API for true streaming
 * This is the most memory efficient approach
 */
export async function parseCSVWebStream(
  file: File,
  options: StreamingParseOptions & {
    encoding?: string
  } = {}
): Promise<ParsedCSVData> {
  if (!file.stream) {
    // Fallback to FileReader if streams are not supported
    return parseCSVFileStreaming(file, options)
  }
  
  const { encoding = 'utf-8', onProgress, onChunk, chunkSize = 1000, errorCollector } = options
  
  errorCollector?.setCurrentFile(file.name)
  
  const stream = file.stream()
  const reader = stream.getReader()
  const decoder = new TextDecoder(encoding)
  
  let headers: string[] = []
  const rows: Record<string, string | number | null>[] = []
  let currentChunk: Record<string, string | number | null>[] = []
  let buffer = ''
  let lineNumber = 0
  let totalBytes = 0
  const fileSize = file.size
  
  try {
    while (true) {
      const { done, value } = await reader.read()
      
      if (done) break
      
      totalBytes += value.length
      const text = decoder.decode(value, { stream: true })
      buffer += text
      
      // Process complete lines
      const lines = buffer.split('\n')
      buffer = lines.pop() || '' // Keep incomplete line in buffer
      
      for (const line of lines) {
        if (!line.trim()) continue
        
        if (lineNumber === 0) {
          // Parse headers
          headers = parseCSVLine(removeBOM(line))
        } else {
          // Parse data row
          try {
            const rowArray = parseCSVLine(line)
            
            // Check column count
            if (rowArray.length !== headers.length) {
              errorCollector?.addValidationError(
                `Row has ${rowArray.length} columns, expected ${headers.length}`,
                { line: lineNumber + 1 }
              )
            }
            
            const rowObj: Record<string, string | number | null> = {}
            
            headers.forEach((header, index) => {
              const value = rowArray[index] || null
              const numValue = Number(value)
              rowObj[header] = !isNaN(numValue) && value !== '' ? numValue : value
            })
            
            currentChunk.push(rowObj)
            rows.push(rowObj)
          } catch (error) {
            errorCollector?.addParsingError(
              `Failed to parse line: ${error instanceof Error ? error.message : 'Unknown error'}`,
              lineNumber + 1
            )
          }
          
          // Process chunk
          if (currentChunk.length >= chunkSize && onChunk) {
            await new Promise(resolve => {
              setTimeout(() => {
                onChunk(currentChunk, rows.length - currentChunk.length)
                resolve(undefined)
              }, 0)
            })
            currentChunk = []
          }
        }
        
        lineNumber++
      }
      
      // Report progress based on bytes read
      if (onProgress) {
        const progress = (totalBytes / fileSize) * 100
        onProgress(Math.min(progress, 99))
      }
    }
    
    // Process remaining buffer
    if (buffer.trim()) {
      const rowArray = parseCSVLine(buffer)
      const rowObj: Record<string, string | number | null> = {}
      
      headers.forEach((header, index) => {
        const value = rowArray[index] || null
        const numValue = Number(value)
        rowObj[header] = !isNaN(numValue) && value !== '' ? numValue : value
      })
      
      currentChunk.push(rowObj)
      rows.push(rowObj)
    }
    
    // Process final chunk
    if (currentChunk.length > 0 && onChunk) {
      onChunk(currentChunk, rows.length - currentChunk.length)
    }
    
    // Final progress
    if (onProgress) {
      onProgress(100)
    }
    
    return {
      headers,
      rows,
      metadata: {
        fileName: file.name,
        format: 'webstream'
      }
    }
  } finally {
    reader.releaseLock()
  }
}