import { useRef, useCallback, useEffect } from 'react'

export interface CSVWorkerOptions {
  delimiter?: string
  skipEmptyLines?: boolean
  skipRows?: number
  encoding?: string
}

export interface CSVParseResult {
  fileName: string
  headers: string[]
  rows: Record<string, any>[]
  metadata: {
    fileName: string
    rowCount: number
    columnCount: number
    fileSize: number
    columns?: Record<string, { type: string; formats?: string[] }>
    dateColumns?: string[]
    numericColumns?: string[]
    format?: string
  }
}

interface UseCSVWorkerReturn {
  parseCSV: (file: File, options?: CSVWorkerOptions) => Promise<CSVParseResult>
  parseMultipleCSV: (files: File[], options?: CSVWorkerOptions) => Promise<CSVParseResult[]>
  isProcessing: boolean
  progress: number
  error: Error | null
}

export function useCSVWorker(): UseCSVWorkerReturn {
  const workerRef = useRef<Worker | null>(null)
  const isProcessingRef = useRef(false)
  const progressRef = useRef(0)
  const errorRef = useRef<Error | null>(null)
  const pendingCallbacksRef = useRef<Map<string, { resolve: Function; reject: Function }>>(new Map())

  // Initialize worker
  useEffect(() => {
    if (typeof window !== 'undefined' && !workerRef.current) {
      workerRef.current = new Worker('/csv-parser.worker.js')
      
      // Set up message handler
      workerRef.current.onmessage = (e) => {
        const { type, data, error, progress } = e.data
        
        switch (type) {
          case 'parseComplete': {
            const callback = pendingCallbacksRef.current.get('parse')
            if (callback) {
              callback.resolve(data)
              pendingCallbacksRef.current.delete('parse')
              isProcessingRef.current = false
            }
            break
          }
          
          case 'parseMultipleComplete': {
            const callback = pendingCallbacksRef.current.get('parseMultiple')
            if (callback) {
              callback.resolve(data)
              pendingCallbacksRef.current.delete('parseMultiple')
              isProcessingRef.current = false
            }
            break
          }
          
          case 'progress': {
            progressRef.current = progress
            break
          }
          
          case 'error': {
            const errorObj = new Error(error)
            errorRef.current = errorObj
            
            // Reject any pending callbacks
            pendingCallbacksRef.current.forEach(callback => {
              callback.reject(errorObj)
            })
            pendingCallbacksRef.current.clear()
            isProcessingRef.current = false
            break
          }
        }
      }
      
      // Error handler
      workerRef.current.onerror = (error) => {
        console.error('Worker error:', error)
        errorRef.current = new Error('Worker error occurred')
        isProcessingRef.current = false
      }
    }
    
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
        workerRef.current = null
      }
    }
  }, [])

  const parseCSV = useCallback((file: File, options?: CSVWorkerOptions): Promise<CSVParseResult> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'))
        return
      }
      
      if (isProcessingRef.current) {
        reject(new Error('Worker is already processing'))
        return
      }
      
      isProcessingRef.current = true
      progressRef.current = 0
      errorRef.current = null
      
      // Store callback
      pendingCallbacksRef.current.set('parse', { resolve, reject })
      
      // Send message to worker
      workerRef.current.postMessage({
        type: 'parse',
        data: { file, options }
      })
    })
  }, [])

  const parseMultipleCSV = useCallback((files: File[], options?: CSVWorkerOptions): Promise<CSVParseResult[]> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'))
        return
      }
      
      if (isProcessingRef.current) {
        reject(new Error('Worker is already processing'))
        return
      }
      
      isProcessingRef.current = true
      progressRef.current = 0
      errorRef.current = null
      
      // Store callback
      pendingCallbacksRef.current.set('parseMultiple', { resolve, reject })
      
      // Send message to worker
      workerRef.current.postMessage({
        type: 'parseMultiple',
        data: { files, options }
      })
    })
  }, [])

  return {
    parseCSV,
    parseMultipleCSV,
    isProcessing: isProcessingRef.current,
    progress: progressRef.current,
    error: errorRef.current
  }
}