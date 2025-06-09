import { EventInfo, SearchResult } from "@/types"

export function processManualEntryData(data: any): any {
  const processedData = { ...data }
  if (data.legend) {
    const legendMatch = data.legend.match(/^(.+?)\s*\((.+)\)$/)
    if (legendMatch) {
      processedData.label = legendMatch[1].trim()
      processedData.labelDescription = legendMatch[2].trim()
    } else {
      processedData.label = data.legend
      processedData.labelDescription = ""
    }
  }
  return processedData
}

export function createEventFromSearchResult(
  result: SearchResult, 
  label: string
): EventInfo {
  const duration = 10 // Default 10 minutes
  const startTime = new Date(result.timestamp)
  const endTime = new Date(startTime.getTime() + duration * 60 * 1000)
  
  return {
    id: `trigger_${result.id}_${Date.now()}`,
    plant: result.plant || 'Unknown',
    machineNo: result.machineNo || 'Unknown',
    label: label || 'Signal Detection',
    labelDescription: 'Detected by filter conditions',
    event: 'Trigger Event',
    eventDetail: `Auto-detected at ${result.timestamp}`,
    start: result.timestamp,
    end: endTime.toISOString()
  }
}