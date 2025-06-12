import { useRef, useCallback, useEffect } from 'react'

interface WorkerMessage {
  action: string
  data?: any
  params?: any
  error?: string
}

export function useDataWorker() {
  const workerRef = useRef<Worker | null>(null)
  const promiseResolversRef = useRef<Map<string, { resolve: Function, reject: Function }>>(new Map())
  
  useEffect(() => {
    // Initialize worker
    if (typeof window !== 'undefined' && window.Worker) {
      workerRef.current = new Worker('/dataProcessor.worker.js')
      
      workerRef.current.onmessage = (e: MessageEvent<WorkerMessage>) => {
        const { action, data, error } = e.data
        const resolver = promiseResolversRef.current.get(action)
        
        if (resolver) {
          if (error) {
            resolver.reject(new Error(error))
          } else {
            resolver.resolve(data)
          }
          promiseResolversRef.current.delete(action)
        }
      }
      
      workerRef.current.onerror = (error) => {
        console.error('Worker error:', error)
        // Reject all pending promises
        promiseResolversRef.current.forEach(({ reject }) => {
          reject(error)
        })
        promiseResolversRef.current.clear()
      }
    }
    
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
        workerRef.current = null
      }
    }
  }, [])
  
  const postMessage = useCallback((message: WorkerMessage): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'))
        return
      }
      
      const responseAction = message.action === 'sample' ? 'sampled' 
        : message.action === 'transform' ? 'transformed'
        : message.action === 'aggregate' ? 'aggregated'
        : message.action
      
      promiseResolversRef.current.set(responseAction, { resolve, reject })
      workerRef.current.postMessage(message)
    })
  }, [])
  
  const sampleData = useCallback(async (points: any[], targetPoints: number) => {
    if (!workerRef.current || points.length <= targetPoints) {
      return points
    }
    
    return postMessage({
      action: 'sample',
      params: { points, targetPoints }
    })
  }, [postMessage])
  
  const transformData = useCallback(async (
    csvData: any[],
    parameters: string[],
    editingChart: any,
    dataSourceId: string,
    dataSourceLabel: string
  ) => {
    if (!workerRef.current) {
      // Fallback to main thread processing
      return null
    }
    
    return postMessage({
      action: 'transform',
      params: {
        csvData,
        parameters,
        editingChart,
        dataSourceId,
        dataSourceLabel
      }
    })
  }, [postMessage])
  
  const aggregateData = useCallback(async (
    points: any[],
    parameters: string[],
    interval: number
  ) => {
    if (!workerRef.current) {
      return points
    }
    
    return postMessage({
      action: 'aggregate',
      params: { points, parameters, interval }
    })
  }, [postMessage])
  
  return {
    isSupported: typeof window !== 'undefined' && !!window.Worker,
    sampleData,
    transformData,
    aggregateData
  }
}