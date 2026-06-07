import { Timeline, TimelineEvent } from '../types/timeline';
import { TimelineStorage } from './timelineStorage';

export interface ImportOptions {
  timelineName?: string;
  timelineDescription?: string;
  timelineColor?: string;
  dateFormat?: string; // 'timestamp' | 'iso' | 'unix' | 'custom'
  customDateFormat?: string; // for moment-like formats
}

export interface ImportResult {
  success: boolean;
  timeline?: Timeline;
  error?: string;
  warnings: string[];
  eventsCount: number;
}

/**
 * Timeline data importer
 * Supports CSV and JSON formats for importing timeline events
 */
export class TimelineImporter {
  /**
   * Import timeline data from JSON format
   * Expected JSON structure: Array of events or object with events array
   */
  static importFromJSON(jsonData: string, options: ImportOptions = {}): ImportResult {
    const warnings: string[] = [];
    
    try {
      let data = JSON.parse(jsonData);
      
      // If data is an object with an events property, use that
      if (data && typeof data === 'object' && Array.isArray(data.events)) {
        data = data.events;
      }
      
      // Ensure data is an array
      if (!Array.isArray(data)) {
        return {
          success: false,
          error: 'JSON data must be an array of events or an object with an events array',
          warnings: [],
          eventsCount: 0
        };
      }
      
      const timeline = TimelineStorage.createEmptyTimeline(
        options.timelineName || 'Imported Timeline'
      );
      
      if (options.timelineDescription) {
        timeline.description = options.timelineDescription;
      }
      
      if (options.timelineColor) {
        timeline.color = options.timelineColor;
      }
      
      const events: TimelineEvent[] = [];
      
      data.forEach((item: any, index: number) => {
        const validation = this.validateEventData(item, index);
        if (!validation.isValid) {
          warnings.push(...validation.errors);
          return;
        }
        
        const event = this.parseEventData(item);
        if (event) {
          events.push(event);
        }
      });
      
      if (events.length === 0) {
        return {
          success: false,
          error: 'No valid events found in the imported data',
          warnings,
          eventsCount: 0
        };
      }
      
      timeline.events = events;
      
      return {
        success: true,
        timeline,
        warnings,
        eventsCount: events.length
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to parse JSON: ${error?.message || 'Unknown error'}`,
        warnings: [],
        eventsCount: 0
      };
    }
  }
  
  /**
   * Import timeline data from CSV format
   * Expected CSV format: title,description,startTime,endTime,color,icon
   * startTime and endTime should be timestamps or ISO date strings
   */
  static importFromCSV(csvData: string, options: ImportOptions = {}): ImportResult {
    const warnings: string[] = [];
    
    try {
      const lines = csvData.trim().split('\n');
      
      if (lines.length < 2) {
        return {
          success: false,
          error: 'CSV file must contain at least a header row and one data row',
          warnings: [],
          eventsCount: 0
        };
      }
      
      const headers = this.parseCSVLine(lines[0]);
      
      // Validate headers
      const requiredHeaders = ['title', 'startTime'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h.toLowerCase()));
      
      if (missingHeaders.length > 0) {
        return {
          success: false,
          error: `CSV must contain required columns: ${missingHeaders.join(', ')}. Found: ${headers.join(', ')}`,
          warnings: [],
          eventsCount: 0
        };
      }
      
      const timeline = TimelineStorage.createEmptyTimeline(
        options.timelineName || 'Imported Timeline'
      );
      
      if (options.timelineDescription) {
        timeline.description = options.timelineDescription;
      }
      
      if (options.timelineColor) {
        timeline.color = options.timelineColor;
      }
      
      const events: TimelineEvent[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue; // Skip empty lines
        
        const values = this.parseCSVLine(line);
        const eventData: any = {};
        
        headers.forEach((header, index) => {
          eventData[header] = values[index] || '';
        });
        
        const validation = this.validateEventData(eventData, i - 1);
        if (!validation.isValid) {
          warnings.push(...validation.errors);
          continue;
        }
        
        const event = this.parseEventData(eventData);
        if (event) {
          events.push(event);
        }
      }
      
      if (events.length === 0) {
        return {
          success: false,
          error: 'No valid events found in the imported CSV data',
          warnings,
          eventsCount: 0
        };
      }
      
      timeline.events = events;
      
      return {
        success: true,
        timeline,
        warnings,
        eventsCount: events.length
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to parse CSV: ${error?.message || 'Unknown error'}`,
        warnings: [],
        eventsCount: 0
      };
    }
  }
  
  /**
   * Auto-detect file format and import
   */
  static importFromFile(fileContent: string, fileName: string, options: ImportOptions = {}): ImportResult {
    const ext = fileName.split('.').pop()?.toLowerCase();
    
    if (ext === 'json') {
      return this.importFromJSON(fileContent, options);
    } else if (ext === 'csv') {
      return this.importFromCSV(fileContent, options);
    } else {
      return {
        success: false,
        error: `Unsupported file format: ${ext}. Supported formats: json, csv`,
        warnings: [],
        eventsCount: 0
      };
    }
  }
  
  /**
   * Parse a CSV line handling quoted values
   */
  private static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }
  
  /**
   * Validate event data
   */
  private static validateEventData(data: any, rowIndex: number): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const prefix = `Row ${rowIndex + 1}:`;
    
    if (!data.title || (typeof data.title === 'string' && data.title.trim() === '')) {
      errors.push(`${prefix} title is required`);
    }
    
    if (data.startTime === undefined || data.startTime === '') {
      errors.push(`${prefix} startTime is required`);
    } else if (!this.isValidTimestamp(data.startTime)) {
      errors.push(`${prefix} startTime is not a valid timestamp or date format`);
    }
    
    if (data.endTime !== undefined && data.endTime !== '' && !this.isValidTimestamp(data.endTime)) {
      errors.push(`${prefix} endTime is not a valid timestamp or date format`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Parse event data from JSON or CSV
   */
  private static parseEventData(data: any): TimelineEvent | null {
    try {
      const startTime = this.parseTimestamp(data.startTime);
      if (startTime === null) return null;
      
      const endTime = data.endTime && data.endTime !== '' ? this.parseTimestamp(data.endTime) : undefined;
      
      const event: TimelineEvent = {
        id: TimelineStorage.generateEventId(),
        title: String(data.title || 'Untitled Event'),
        description: data.description ? String(data.description) : undefined,
        startTime,
        endTime,
        color: data.color ? String(data.color) : undefined,
        icon: data.icon ? String(data.icon) : undefined,
        imageData: data.imageData ? String(data.imageData) : undefined,
        dataAssetId: data.dataAssetId ? String(data.dataAssetId) : undefined
      };
      
      return event;
    } catch {
      return null;
    }
  }
  
  /**
   * Parse timestamp from various formats
   * Supports: unix timestamp, ISO date string, numeric timestamp
   */
  private static parseTimestamp(value: any): number | null {
    if (typeof value === 'number') {
      // Assume it's a unix timestamp (in milliseconds if > 10 billion, else in seconds)
      return value > 10000000000 ? value : value * 1000;
    }
    
    if (typeof value === 'string') {
      value = value.trim();
      
      // Try parsing as unix timestamp
      const numValue = Number(value);
      if (!isNaN(numValue)) {
        return numValue > 10000000000 ? numValue : numValue * 1000;
      }
      
      // Try parsing as ISO date string
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.getTime();
      }
    }
    
    return null;
  }
  
  /**
   * Check if a value is a valid timestamp
   */
  private static isValidTimestamp(value: any): boolean {
    if (typeof value === 'number') {
      return value > 0;
    }
    
    if (typeof value === 'string') {
      return this.parseTimestamp(value) !== null;
    }
    
    return false;
  }
  
  /**
   * Generate example CSV format
   */
  static getCSVTemplate(): string {
    return `title,description,startTime,endTime,color,icon
New Year 2020,Year starts,2020-01-01T00:00:00Z,,#FF0000,
Summer 2020,Summer season,2020-06-21T00:00:00Z,2020-09-22T23:59:59Z,#FFA500,
Project Launch,Product launch,2020-08-15T10:30:00Z,,#00FF00,rocket
Event Name,Description,1608902400000,,#409EFF,star`;
  }
  
  /**
   * Generate example JSON format
   */
  static getJSONTemplate(): string {
    return JSON.stringify({
      events: [
        {
          title: "New Year 2020",
          description: "Year starts",
          startTime: "2020-01-01T00:00:00Z",
          color: "#FF0000",
          icon: "calendar"
        },
        {
          title: "Summer 2020",
          description: "Summer season",
          startTime: "2020-06-21T00:00:00Z",
          endTime: "2020-09-22T23:59:59Z",
          color: "#FFA500"
        },
        {
          title: "Project Launch",
          description: "Product launch",
          startTime: "2020-08-15T10:30:00Z",
          color: "#00FF00",
          icon: "rocket"
        }
      ]
    }, null, 2);
  }
}
