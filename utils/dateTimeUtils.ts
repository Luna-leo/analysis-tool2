export function formatDateTimeForInput(dateString: string): string {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString
    
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
  } catch {
    return dateString
  }
}

export function formatDateTimeForDisplay(dateString: string): string {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString
    
    return date.toLocaleString()
  } catch {
    return dateString
  }
}

export function calculateOverallTimeRange(dataSourceItems: Array<{ start: string; end: string }>) {
  if (!dataSourceItems || dataSourceItems.length === 0) {
    return null
  }

  let earliestStart: Date | null = null
  let latestEnd: Date | null = null

  dataSourceItems.forEach(dataSource => {
    const startTime = new Date(dataSource.start)
    const endTime = new Date(dataSource.end)

    if (!isNaN(startTime.getTime())) {
      if (!earliestStart || startTime < earliestStart) {
        earliestStart = startTime
      }
    }

    if (!isNaN(endTime.getTime())) {
      if (!latestEnd || endTime > latestEnd) {
        latestEnd = endTime
      }
    }
  })

  if (!earliestStart || !latestEnd) {
    return null
  }

  return { earliestStart, latestEnd }
}