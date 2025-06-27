import { ParsedCSVData } from '@/types/csv-data'

export interface WorkerParseOptions {
  useStreaming?: boolean
  onProgress?: (progress: number) => void
}

/**
 * Parse CSV content using a Web Worker
 * This offloads the parsing to a separate thread to avoid blocking the UI
 */
export function parseCSVWithWorker(
  content: string,
  fileName: string,
  options: WorkerParseOptions = {}
): Promise<ParsedCSVData> {
  return new Promise((resolve, reject) => {
    // Check if Worker is available
    if (typeof Worker === 'undefined') {
      reject(new Error('Web Workers are not supported in this environment'))
      return
    }
    
    try {
      // Create worker
      const worker = new Worker('/workers/csv-parser.worker.js')
      
      // Set up timeout
      const timeout = setTimeout(() => {
        worker.terminate()
        reject(new Error('CSV parsing timed out'))
      }, 60000) // 60 second timeout
      
      // Handle messages from worker
      worker.onmessage = (event) => {
        const { type, result, progress, error } = event.data
        
        switch (type) {
          case 'progress':
            if (options.onProgress) {
              options.onProgress(progress)
            }
            break
            
          case 'complete':
            clearTimeout(timeout)
            worker.terminate()
            resolve(result)
            break
            
          case 'error':
            clearTimeout(timeout)
            worker.terminate()
            reject(new Error(error))
            break
        }
      }
      
      // Handle worker errors
      worker.onerror = (error) => {
        clearTimeout(timeout)
        worker.terminate()
        reject(new Error(`Worker error: ${error.message || 'Unknown error'}`))
      }
      
      // Send parse request to worker
      worker.postMessage({
        type: 'parse',
        data: {
          content,
          fileName,
          useStreaming: options.useStreaming
        }
      })
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Check if Web Workers are available
 */
export function isWorkerAvailable(): boolean {
  return typeof Worker !== 'undefined'
}

/**
 * Parse CSV file using Web Worker
 */
export async function parseCSVFileWithWorker(
  file: File,
  options: WorkerParseOptions = {}
): Promise<ParsedCSVData> {
  const content = await file.text()
  return parseCSVWithWorker(content, file.name, options)
}