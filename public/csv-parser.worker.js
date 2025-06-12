// CSV Parser Web Worker
// This worker handles CSV parsing in a separate thread to avoid blocking the UI

// Message handler
self.onmessage = async function(e) {
  const { type, data } = e.data;
  
  switch (type) {
    case 'parse':
      await parseCSV(data);
      break;
    case 'parseMultiple':
      await parseMultipleCSV(data);
      break;
    default:
      self.postMessage({ 
        type: 'error', 
        error: `Unknown message type: ${type}` 
      });
  }
};

// Parse a single CSV file
async function parseCSV({ file, options = {} }) {
  try {
    const text = await file.text();
    const result = parseCSVText(text, options);
    
    self.postMessage({
      type: 'parseComplete',
      data: {
        fileName: file.name,
        headers: result.headers,
        rows: result.rows,
        metadata: {
          fileName: file.name,
          rowCount: result.rows.length,
          columnCount: result.headers.length,
          fileSize: file.size,
          ...result.metadata
        }
      }
    });
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error.message,
      fileName: file.name
    });
  }
}

// Parse multiple CSV files
async function parseMultipleCSV({ files, options = {} }) {
  const results = [];
  let completed = 0;
  
  for (const file of files) {
    try {
      const text = await file.text();
      const result = parseCSVText(text, options);
      
      results.push({
        fileName: file.name,
        headers: result.headers,
        rows: result.rows,
        metadata: {
          fileName: file.name,
          rowCount: result.rows.length,
          columnCount: result.headers.length,
          fileSize: file.size,
          ...result.metadata
        }
      });
      
      completed++;
      
      // Send progress update
      self.postMessage({
        type: 'progress',
        progress: (completed / files.length) * 100,
        completed,
        total: files.length
      });
    } catch (error) {
      self.postMessage({
        type: 'error',
        error: error.message,
        fileName: file.name
      });
    }
  }
  
  self.postMessage({
    type: 'parseMultipleComplete',
    data: results
  });
}

// CSV text parser
function parseCSVText(text, options = {}) {
  const {
    delimiter = ',',
    skipEmptyLines = true,
    skipRows = 0,
    encoding = 'utf-8'
  } = options;
  
  // Split text into lines
  let lines = text.split(/\r?\n/);
  
  // Skip specified rows
  if (skipRows > 0) {
    lines = lines.slice(skipRows);
  }
  
  // Filter empty lines if requested
  if (skipEmptyLines) {
    lines = lines.filter(line => line.trim().length > 0);
  }
  
  if (lines.length === 0) {
    return { headers: [], rows: [], metadata: {} };
  }
  
  // Parse headers
  const headers = parseCSVLine(lines[0], delimiter);
  
  // Parse data rows
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i], delimiter);
    if (values.length === headers.length) {
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      rows.push(row);
    }
  }
  
  // Detect data types and date formats
  const metadata = analyzeData(headers, rows);
  
  return { headers, rows, metadata };
}

// Parse a single CSV line handling quoted fields
function parseCSVLine(line, delimiter) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      // End of field
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add last field
  result.push(current.trim());
  
  return result;
}

// Analyze data to detect types and formats
function analyzeData(headers, rows) {
  const metadata = {
    columns: {},
    dateColumns: [],
    numericColumns: [],
    format: 'standard'
  };
  
  // Sample first 100 rows for analysis
  const sampleRows = rows.slice(0, Math.min(100, rows.length));
  
  headers.forEach(header => {
    const values = sampleRows.map(row => row[header]).filter(v => v !== null && v !== '');
    
    if (values.length === 0) {
      metadata.columns[header] = { type: 'empty' };
      return;
    }
    
    // Check if column contains dates
    const dateFormats = detectDateFormat(values);
    if (dateFormats.length > 0) {
      metadata.columns[header] = {
        type: 'date',
        formats: dateFormats
      };
      metadata.dateColumns.push(header);
    }
    // Check if column contains numbers
    else if (isNumericColumn(values)) {
      metadata.columns[header] = { type: 'numeric' };
      metadata.numericColumns.push(header);
    }
    // Otherwise it's text
    else {
      metadata.columns[header] = { type: 'text' };
    }
  });
  
  // Detect specific CSV formats
  if (headers.includes('Datetime') && headers.length > 1) {
    metadata.format = 'SSAC';
  } else if (headers.includes('timestamp') && headers.includes('tag_name')) {
    metadata.format = 'CASS';
  } else if (headers.includes('time') && headers.includes('signal_id')) {
    metadata.format = 'CHINAMI';
  }
  
  return metadata;
}

// Detect date format from sample values
function detectDateFormat(values) {
  const formats = [];
  const datePatterns = [
    { pattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, format: 'ISO' },
    { pattern: /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/, format: 'YYYY-MM-DD HH:mm:ss' },
    { pattern: /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/, format: 'MM/DD/YYYY HH:mm' },
    { pattern: /^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}/, format: 'YYYY/MM/DD HH:mm' }
  ];
  
  for (const { pattern, format } of datePatterns) {
    if (values.some(v => pattern.test(v))) {
      formats.push(format);
    }
  }
  
  return formats;
}

// Check if column contains numeric values
function isNumericColumn(values) {
  return values.every(v => {
    const num = parseFloat(v);
    return !isNaN(num) && isFinite(num);
  });
}