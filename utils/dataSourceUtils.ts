import { EventInfo, SearchResult } from "@/types"
import { ManualEntryInput, ManualEntryOutput } from "@/types/data-source"
import { formatDateToISO } from "@/utils/dateUtils"

export function processManualEntryData(data: ManualEntryInput): ManualEntryOutput {
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
  } else {
    // Ensure label and labelDescription are always defined
    processedData.label = processedData.label || ""
    processedData.labelDescription = processedData.labelDescription || ""
  }
  return processedData as ManualEntryOutput
}

export function createEventFromSearchResult(
  result: SearchResult, 
  label: string,
  duration?: { value: number; unit: 's' | 'm' | 'h' }
): EventInfo {
  const startTime = new Date(result.timestamp)
  
  // Calculate end time based on duration
  let endTime: Date
  if (duration) {
    const milliseconds = duration.unit === 's' ? duration.value * 1000 :
                        duration.unit === 'm' ? duration.value * 60 * 1000 :
                        duration.value * 60 * 60 * 1000
    endTime = new Date(startTime.getTime() + milliseconds)
  } else {
    // Default 10 minutes
    endTime = new Date(startTime.getTime() + 10 * 60 * 1000)
  }
  
  return {
    id: `trigger_${result.id}_${Date.now()}`,
    plant: result.plant || 'Unknown',
    machineNo: result.machineNo || 'Unknown',
    label: label || 'Signal Detection',
    labelDescription: 'Detected by filter conditions',
    event: 'Trigger Event',
    eventDetail: `Auto-detected at ${result.timestamp}`,
    start: result.timestamp,
    end: formatDateToISO(endTime)
  }
}