/**
 * Helper function to format date for datetime-local input
 */
export const formatDateTimeLocal = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
}

/**
 * Adjusts a date by a given amount and unit
 */
export const adjustDate = (
  dateString: string, 
  amount: number, 
  unit: 'd' | 'h' | 'm' | 's'
): string => {
  if (!dateString) return dateString
  
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString
  
  switch(unit) {
    case 'd':
      date.setDate(date.getDate() + amount)
      break
    case 'h':
      date.setHours(date.getHours() + amount)
      break
    case 'm':
      date.setMinutes(date.getMinutes() + amount)
      break
    case 's':
      date.setSeconds(date.getSeconds() + amount)
      break
  }
  
  return formatDateTimeLocal(date)
}

/**
 * Formats a datetime string for display
 * Returns an object with formatted date and time parts
 */
export const formatDateTimeForDisplay = (dateTimeString: string): { date: string; time: string } => {
  if (!dateTimeString) return { date: '', time: '' }
  
  const date = new Date(dateTimeString)
  if (isNaN(date.getTime())) {
    // Fallback to simple split if date is invalid
    const [datePart, timePart] = dateTimeString.split('T')
    return { date: datePart || '', time: timePart || '' }
  }
  
  // Format date as YYYY-MM-DD
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  
  // Format time as HH:MM:SS
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  
  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}:${seconds}`
  }
}