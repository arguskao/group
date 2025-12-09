import { STORAGE_KEY } from './constants.js';

/**
 * CSVManager class for handling CSV data operations
 */
export class CSVManager {
  constructor(storageKey = STORAGE_KEY) {
    this.storageKey = storageKey;
  }

  /**
   * Escape special characters in CSV field
   * @param {string} field - The field to escape
   * @returns {string} - Escaped field
   */
  escapeField(field) {
    const fieldStr = String(field);
    
    // If field contains comma, quote, or newline, wrap in quotes
    if (fieldStr.includes(',') || fieldStr.includes('"') || fieldStr.includes('\n')) {
      // Replace quotes with double quotes
      return `"${fieldStr.replace(/"/g, '""')}"`;
    }
    
    return fieldStr;
  }

  /**
   * Convert responses array to CSV string
   * @param {Array<{name: string, phone: string, region: string, occupation: string, timestamp: string}>} responses
   * @returns {string} - CSV formatted string
   */
  toCSV(responses) {
    const header = '姓名,電話,地區,工作性質,提交時間';
    const rows = responses.map(response => {
      return [
        this.escapeField(response.name),
        this.escapeField(response.phone),
        this.escapeField(response.region),
        this.escapeField(response.occupation),
        this.escapeField(response.timestamp)
      ].join(',');
    });
    
    return [header, ...rows].join('\n');
  }

  /**
   * Parse CSV string to responses array
   * @param {string} csvString - CSV formatted string
   * @returns {Array<{name: string, phone: string, region: string, occupation: string, timestamp: string}>}
   */
  fromCSV(csvString) {
    if (!csvString || csvString.trim() === '') {
      return [];
    }
    
    const lines = csvString.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length <= 1) {
      return [];
    }
    
    // Skip header row
    const dataLines = lines.slice(1);
    
    return dataLines.map(line => {
      const fields = this.parseCSVLine(line);
      return {
        name: fields[0] || '',
        phone: fields[1] || '',
        region: fields[2] || '',
        occupation: fields[3] || '',
        timestamp: fields[4] || ''
      };
    });
  }

  /**
   * Parse a single CSV line handling quoted fields
   * @param {string} line - CSV line
   * @returns {Array<string>} - Array of field values
   */
  parseCSVLine(line) {
    const fields = [];
    let currentField = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Double quote - add single quote to field
          currentField += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator
        fields.push(currentField);
        currentField = '';
      } else {
        currentField += char;
      }
    }
    
    // Add last field
    fields.push(currentField);
    
    return fields;
  }

  /**
   * Append a response to localStorage
   * @param {{name: string, phone: string, region: string, occupation: string, timestamp: string}} response
   */
  append(response) {
    const responses = this.readAll();
    responses.push(response);
    const csvString = this.toCSV(responses);
    localStorage.setItem(this.storageKey, csvString);
  }

  /**
   * Read all responses from localStorage
   * @returns {Array<{name: string, phone: string, region: string, occupation: string, timestamp: string}>}
   */
  readAll() {
    const csvString = localStorage.getItem(this.storageKey);
    
    if (!csvString) {
      return [];
    }
    
    return this.fromCSV(csvString);
  }

  /**
   * Download CSV file
   * @param {string} filename - Optional filename (defaults to timestamped name)
   */
  download(filename) {
    const responses = this.readAll();
    const csvString = this.toCSV(responses);
    
    // Generate filename with timestamp if not provided
    if (!filename) {
      const now = new Date();
      const timestamp = now.toISOString()
        .replace(/[-:]/g, '')
        .replace('T', '_')
        .split('.')[0];
      filename = `survey_responses_${timestamp}.csv`;
    }
    
    // Create blob with UTF-8 BOM for Excel compatibility
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvString], { type: 'text/csv;charset=utf-8;' });
    
    // Create download link
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }
}
