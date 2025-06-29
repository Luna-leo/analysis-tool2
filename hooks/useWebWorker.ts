import React, { useRef, useCallback, useEffect } from 'react'
import { WorkerRequest, WorkerResponse } from '@/workers/chartDataProcessor.worker'

interface UseWebWorkerOptions {
  onProgress?: (progress: number) => void
  onError?: (error: string) => void
  fallbackToMainThread?: boolean
}

interface PendingRequest {
  resolve: (data: any) => void
  reject: (error: Error) => void
  onProgress?: (progress: number) => void
}

/**
 * Hook for managing Web Worker communication
 */
export function useWebWorker(options: UseWebWorkerOptions = {}) {
  const workerRef = useRef<Worker | null>(null)
  const pendingRequests = useRef<Map<string, PendingRequest>>(new Map())
  const requestIdCounter = useRef(0)
  const [workerInitError, setWorkerInitError] = React.useState<string | null>(null)
  const { fallbackToMainThread = true } = options

  // Initialize worker
  useEffect(() => {
    if (typeof window === 'undefined') return // Skip in SSR

    try {
      // Create worker from public directory for Next.js compatibility
      const workerUrl = '/chartDataProcessor.worker.js'
      console.log('Creating Web Worker from public URL:', workerUrl)
      
      workerRef.current = new Worker(workerUrl)

      // Handle worker messages
      workerRef.current.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const { id, type, data, error, progress } = event.data
        const pending = pendingRequests.current.get(id)

        if (!pending) return

        switch (type) {
          case 'success':
            pending.resolve(data)
            pendingRequests.current.delete(id)
            break

          case 'error':
            pending.reject(new Error(error || 'Unknown worker error'))
            pendingRequests.current.delete(id)
            if (options.onError) {
              options.onError(error || 'Unknown worker error')
            }
            break

          case 'progress':
            if (pending.onProgress) {
              pending.onProgress(progress || 0)
            }
            if (options.onProgress) {
              options.onProgress(progress || 0)
            }
            break
        }
      }

      // Handle worker errors
      workerRef.current.onerror = (event: ErrorEvent) => {
        const errorMessage = event.message || 'Worker initialization error'
        const errorDetails = {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
        console.error('Worker error:', errorMessage, errorDetails)
        setWorkerInitError(errorMessage)
        if (options.onError) {
          options.onError(errorMessage)
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create worker'
      console.error('Failed to create worker:', errorMessage, error)
      setWorkerInitError(errorMessage)
      if (options.onError) {
        options.onError(errorMessage)
      }
    }

    // Cleanup
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
        workerRef.current = null
      }
      pendingRequests.current.clear()
    }
  }, [options.onError, options.onProgress])

  /**
   * Send a request to the worker
   */
  const sendRequest = useCallback(
    <T = any>(
      type: WorkerRequest['type'],
      data: any,
      options?: any,
      onProgress?: (progress: number) => void
    ): Promise<T> => {
      return new Promise((resolve, reject) => {
        if (!workerRef.current) {
          reject(new Error('Worker not initialized'))
          return
        }

        const id = `request-${requestIdCounter.current++}`
        
        pendingRequests.current.set(id, {
          resolve,
          reject,
          onProgress
        })

        const request: WorkerRequest = {
          id,
          type,
          data,
          options
        }

        workerRef.current.postMessage(request)
      })
    },
    []
  )

  /**
   * Sample data using the worker
   */
  const sampleData = useCallback(
    (
      data: any[],
      method: string,
      targetPoints: number,
      chartType: 'line' | 'scatter' = 'line',
      isTimeSeries: boolean = false,
      onProgress?: (progress: number) => void
    ) => {
      return sendRequest(
        'sample',
        data,
        { method, targetPoints, chartType, isTimeSeries },
        onProgress
      )
    },
    [sendRequest]
  )

  /**
   * Transform coordinates using the worker
   */
  const transformCoordinates = useCallback(
    (
      points: any[],
      xAxisType: string,
      xParameter: string | undefined,
      yParams: any[],
      onProgress?: (progress: number) => void
    ) => {
      return sendRequest(
        'transform',
        { points, xAxisType, xParameter, yParams },
        { chunkSize: 1000 },
        onProgress
      )
    },
    [sendRequest]
  )

  /**
   * Process full data pipeline using the worker
   */
  const processData = useCallback(
    (
      rawData: any[],
      config: {
        xAxisType: string
        xParameter?: string
        yParams: any[]
        dataSourceInfo: any[]
      },
      samplingOptions: {
        enableSampling: boolean
        samplingMethod: string
        targetPoints: number
        chartType: 'line' | 'scatter'
      },
      onProgress?: (progress: number) => void
    ) => {
      return sendRequest(
        'process',
        { rawData, ...config },
        samplingOptions,
        onProgress
      )
    },
    [sendRequest]
  )

  /**
   * Check if worker is available
   */
  const isWorkerAvailable = useCallback(() => {
    return workerRef.current !== null && typeof Worker !== 'undefined' && !workerInitError
  }, [workerInitError])

  return {
    sampleData,
    transformCoordinates,
    processData,
    isWorkerAvailable,
    sendRequest,
    workerError: workerInitError,
    fallbackEnabled: fallbackToMainThread
  }
}