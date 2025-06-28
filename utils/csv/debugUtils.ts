/**
 * Debug utilities for CSV import process
 */

export interface DebugInfo {
  timestamp: string
  stage: string
  data: any
}

class CSVImportDebugger {
  private logs: DebugInfo[] = []
  private enabled = process.env.NODE_ENV === 'development'

  log(stage: string, data: any) {
    if (!this.enabled) return
    
    const info: DebugInfo = {
      timestamp: new Date().toISOString(),
      stage,
      data
    }
    
    this.logs.push(info)
    console.log(`[CSV Debug - ${stage}]`, data)
  }

  getLastError(): DebugInfo | null {
    const errorLogs = this.logs.filter(log => 
      log.stage.toLowerCase().includes('error') || 
      log.data?.error || 
      log.data?.success === false
    )
    return errorLogs[errorLogs.length - 1] || null
  }

  getLogs(): DebugInfo[] {
    return [...this.logs]
  }

  clear() {
    this.logs = []
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }
}

// Singleton instance
export const csvDebugger = new CSVImportDebugger()

// Helper function to safely stringify errors
export function stringifyError(error: any): string {
  if (error instanceof Error) {
    const errorObj: any = {
      name: error.name,
      message: error.message,
      stack: error.stack
    }
    
    // Add any additional properties from the error
    Object.keys(error).forEach(key => {
      if (key !== 'name' && key !== 'message' && key !== 'stack') {
        errorObj[key] = (error as any)[key]
      }
    })
    
    return JSON.stringify(errorObj, null, 2)
  }
  
  try {
    return JSON.stringify(error, null, 2)
  } catch {
    return String(error)
  }
}

// Helper to extract all error details
export function extractErrorDetails(error: any): {
  message: string
  details: string[]
  type: string
} {
  const details: string[] = []
  let message = 'Unknown error'
  let type = 'unknown'
  
  if (error instanceof Error) {
    message = error.message
    type = error.name
    if (error.stack) {
      details.push(`Stack: ${error.stack}`)
    }
  } else if (typeof error === 'string') {
    message = error
    type = 'string'
  } else if (error && typeof error === 'object') {
    type = error.constructor?.name || 'object'
    if ('message' in error) {
      message = String(error.message)
    }
    if ('error' in error) {
      message = String(error.error)
    }
    if ('errorDetails' in error && Array.isArray(error.errorDetails)) {
      details.push(...error.errorDetails)
    }
    // Add any other properties
    Object.entries(error).forEach(([key, value]) => {
      if (key !== 'message' && key !== 'error' && key !== 'errorDetails') {
        details.push(`${key}: ${JSON.stringify(value)}`)
      }
    })
  }
  
  return { message, details, type }
}