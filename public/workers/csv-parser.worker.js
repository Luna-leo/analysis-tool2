// CSV Parser Web Worker
// This worker handles CSV parsing in a separate thread to avoid blocking the UI

// Import utility functions (these need to be bundled or included)
const STREAMING_THRESHOLD = 5 * 1024 * 1024 // 5MB

// Simple CSV line parser
function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"'
        i++
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  // Add the last field
  result.push(current.trim())
  return result
}

// Remove BOM if present
function removeBOM(text) {
  return text.charAt(0) === '\uFEFF' ? text.slice(1) : text
}

// Check if CASS format
function isCASSFormat(lines) {
  if (lines.length < 4) return false
  
  const firstLine = parseCSVLine(lines[0])
  const secondLine = parseCSVLine(lines[1])
  const thirdLine = parseCSVLine(lines[2])
  const fourthLine = parseCSVLine(lines[3])
  
  return (
    firstLine.length > 1 && 
    firstLine[0] === '' &&
    secondLine[0] === '' &&
    thirdLine[0] === '' &&
    firstLine.slice(1).every(id => id && !isNaN(Number(id))) &&
    secondLine.length > 1 &&
    thirdLine.length > 1 &&
    fourthLine.length > 0 && fourthLine[0] !== ''
  )
}

// Parse standard format
function parseStandardFormat(lines, fileName) {
  if (lines.length === 0) {
    return {
      headers: [],
      rows: [],
      metadata: { fileName, format: 'standard' }
    }
  }
  
  let headers = []
  let units = []
  let dataStartRow = 1
  
  const firstLine = parseCSVLine(lines[0])
  
  // Check for multi-row header format
  const firstCellEmpty = !firstLine[0] || firstLine[0].trim() === ''
  const secondCellIsNumber = firstLine.length > 1 && !isNaN(Number(firstLine[1]))
  
  if (firstCellEmpty && secondCellIsNumber && lines.length >= 3) {
    const headerLine = parseCSVLine(lines[1])
    const unitLine = parseCSVLine(lines[2])
    
    if (!headerLine[0] || headerLine[0].trim() === '') {
      headerLine[0] = 'timestamp'
    }
    
    headers = headerLine
    units = unitLine
    dataStartRow = 3
  } else {
    headers = firstLine
  }
  
  const rows = []
  
  // Parse data rows
  for (let i = dataStartRow; i < lines.length; i++) {
    const rowArray = parseCSVLine(lines[i])
    if (rowArray.length === 0) continue
    
    const rowObj = {}
    headers.forEach((header, index) => {
      const value = rowArray[index] || null
      const numValue = Number(value)
      rowObj[header] = !isNaN(numValue) && value !== '' ? numValue : value
    })
    rows.push(rowObj)
  }

  return {
    headers,
    rows,
    metadata: {
      fileName,
      format: 'standard',
      parameterInfo: units.length > 0 ? {
        ids: headers,
        parameters: headers,
        units: units
      } : undefined
    }
  }
}

// Parse CASS format
function parseCASSFormat(lines, fileName) {
  const idRow = parseCSVLine(lines[0])
  const paramRow = parseCSVLine(lines[1])
  const unitRow = parseCSVLine(lines[2])
  
  const headers = ['Datetime']
  for (let i = 1; i < paramRow.length; i++) {
    if (paramRow[i]) {
      headers.push(paramRow[i].trim())
    }
  }
  
  const rows = []
  for (let i = 3; i < lines.length; i++) {
    const rowArray = parseCSVLine(lines[i])
    if (rowArray.length === 0 || !rowArray[0]) continue
    
    const rowObj = {}
    rowObj['Datetime'] = rowArray[0]
    
    for (let j = 1; j < rowArray.length && j < headers.length; j++) {
      const value = rowArray[j] || null
      const numValue = Number(value)
      rowObj[headers[j]] = !isNaN(numValue) && value !== '' ? numValue : value
    }
    rows.push(rowObj)
  }
  
  return {
    headers,
    rows,
    metadata: {
      fileName,
      format: 'CASS',
      parameterInfo: {
        ids: idRow.slice(1).map(id => id.trim()),
        parameters: paramRow.slice(1).map(param => param.trim()),
        units: unitRow.slice(1).map(unit => unit.trim())
      }
    }
  }
}

// Main parse function
function parseCSV(text, fileName) {
  const cleanText = removeBOM(text)
  const lines = cleanText.trim().split('\n')
  
  if (lines.length === 0) {
    return {
      headers: [],
      rows: [],
      metadata: { fileName }
    }
  }
  
  // Check format
  if (isCASSFormat(lines)) {
    return parseCASSFormat(lines, fileName)
  } else {
    return parseStandardFormat(lines, fileName)
  }
}

// Streaming parse with progress
function parseCSVWithProgress(text, fileName, onProgress) {
  const cleanText = removeBOM(text)
  const lines = cleanText.trim().split('\n')
  const totalLines = lines.length
  
  if (totalLines === 0) {
    return {
      headers: [],
      rows: [],
      metadata: { fileName }
    }
  }
  
  // Determine format and parse headers
  let result
  if (isCASSFormat(lines)) {
    result = {
      headers: [],
      rows: [],
      metadata: {
        fileName,
        format: 'CASS',
        parameterInfo: {
          ids: parseCSVLine(lines[0]).slice(1).map(id => id.trim()),
          parameters: parseCSVLine(lines[1]).slice(1).map(param => param.trim()),
          units: parseCSVLine(lines[2]).slice(1).map(unit => unit.trim())
        }
      }
    }
    
    result.headers = ['Datetime', ...result.metadata.parameterInfo.parameters]
    
    // Parse data starting from line 4
    for (let i = 3; i < totalLines; i++) {
      const rowArray = parseCSVLine(lines[i])
      if (rowArray.length === 0 || !rowArray[0]) continue
      
      const rowObj = {}
      rowObj['Datetime'] = rowArray[0]
      
      for (let j = 1; j < rowArray.length && j < result.headers.length; j++) {
        const value = rowArray[j] || null
        const numValue = Number(value)
        rowObj[result.headers[j]] = !isNaN(numValue) && value !== '' ? numValue : value
      }
      result.rows.push(rowObj)
      
      // Report progress
      if (i % 100 === 0) {
        const progress = (i / totalLines) * 100
        onProgress(progress)
      }
    }
  } else {
    result = parseStandardFormat(lines, fileName)
    
    // Re-parse with progress reporting if needed
    if (totalLines > 1000) {
      const headers = result.headers
      const dataStartRow = result.metadata.parameterInfo ? 3 : 1
      result.rows = []
      
      for (let i = dataStartRow; i < totalLines; i++) {
        const rowArray = parseCSVLine(lines[i])
        if (rowArray.length === 0) continue
        
        const rowObj = {}
        headers.forEach((header, index) => {
          const value = rowArray[index] || null
          const numValue = Number(value)
          rowObj[header] = !isNaN(numValue) && value !== '' ? numValue : value
        })
        result.rows.push(rowObj)
        
        // Report progress
        if (i % 100 === 0) {
          const progress = (i / totalLines) * 100
          onProgress(progress)
        }
      }
    }
  }
  
  onProgress(100)
  return result
}

// Handle messages from main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data
  
  switch (type) {
    case 'parse':
      try {
        const { content, fileName, useStreaming } = data
        
        if (useStreaming || content.length > STREAMING_THRESHOLD) {
          // Use streaming parse with progress
          const result = parseCSVWithProgress(content, fileName, (progress) => {
            self.postMessage({
              type: 'progress',
              progress
            })
          })
          
          self.postMessage({
            type: 'complete',
            result
          })
        } else {
          // Regular parse
          const result = parseCSV(content, fileName)
          self.postMessage({
            type: 'complete',
            result
          })
        }
      } catch (error) {
        self.postMessage({
          type: 'error',
          error: error.message || 'Failed to parse CSV'
        })
      }
      break
      
    default:
      self.postMessage({
        type: 'error',
        error: 'Unknown message type'
      })
  }
})