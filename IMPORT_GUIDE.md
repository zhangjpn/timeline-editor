# Timeline Data Import Guide

## Overview

The Timeline Editor now supports importing timeline data from CSV and JSON formats. This guide explains how to use the import functionality and provides format specifications.

## Features

- **Multiple Format Support**: Import from JSON or CSV files
- **Flexible Date Formats**: Supports Unix timestamps, ISO date strings, and numeric timestamps
- **Metadata Configuration**: Set timeline name, description, and color during import
- **Error Handling**: Comprehensive validation with detailed error and warning messages
- **Template Support**: Built-in templates to help you format your data correctly

## Getting Started

### Using the Importer UI

1. Open the Timeline Editor application
2. Navigate to the Import section
3. Select your desired format (JSON or CSV)
4. Configure timeline metadata:
   - Timeline Name
   - Timeline Description (optional)
   - Timeline Color (optional)
5. Paste your data or select a file
6. Click "Import" to create the timeline

### Accessing in Your Code

```typescript
import TimelineImporterComponent from './components/TimelineImporter';

// In your component
<TimelineImporterComponent
  onImportSuccess={(timeline) => {
    console.log('Timeline imported:', timeline);
  }}
  onImportError={(error) => {
    console.error('Import failed:', error);
  }}
/>
```

## Format Specifications

### JSON Format

The JSON format should be an array of event objects or an object with an `events` property.

#### Basic Structure

```json
{
  "events": [
    {
      "title": "Event Title",
      "description": "Event description",
      "startTime": "2020-01-01T00:00:00Z",
      "endTime": "2020-01-02T00:00:00Z",
      "color": "#FF0000",
      "icon": "calendar"
    }
  ]
}
```

#### Alternative Structure (Array)

```json
[
  {
    "title": "Event Title",
    "description": "Event description",
    "startTime": 1577836800000,
    "color": "#FF0000"
  }
]
```

#### Field Specifications

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Event title |
| `description` | string | No | Event description |
| `startTime` | string or number | Yes | Start timestamp (ISO string or Unix timestamp) |
| `endTime` | string or number | No | End timestamp for range events |
| `color` | string | No | Hex color code (e.g., "#FF0000") |
| `icon` | string | No | Icon identifier |
| `imageData` | string | No | Base64 encoded image data |
| `dataAssetId` | string | No | Reference to a data asset |

#### Date Format Support

The importer intelligently detects and converts various date formats:

- **ISO 8601**: `"2020-01-01T00:00:00Z"` ✓
- **Unix Timestamp (ms)**: `1577836800000` ✓
- **Unix Timestamp (s)**: `1577836800` (converted to ms) ✓
- **JavaScript Date**: `"Wed Jan 01 2020 00:00:00 GMT+0000"` ✓

### CSV Format

The CSV format uses comma-separated values with a header row.

#### Basic Structure

```csv
title,description,startTime,endTime,color,icon
New Year 2020,Year starts,2020-01-01T00:00:00Z,,#FF0000,calendar
Summer 2020,Summer season,2020-06-21T00:00:00Z,2020-09-22T23:59:59Z,#FFA500,
Project Launch,Product launch,2020-08-15T10:30:00Z,,#00FF00,rocket
```

#### Column Specifications

| Column | Required | Description |
|--------|----------|-------------|
| `title` | Yes | Event title |
| `description` | No | Event description |
| `startTime` | Yes | Start timestamp |
| `endTime` | No | End timestamp for range events |
| `color` | No | Hex color code |
| `icon` | No | Icon identifier |

#### Handling Special Characters

- **Commas in values**: Wrap the value in double quotes
  ```csv
  "Event with, comma","Description, with, commas",2020-01-01T00:00:00Z
  ```

- **Quotes in values**: Use double quotes escaped as `""`
  ```csv
  "Event ""Special"" Name",Description,2020-01-01T00:00:00Z
  ```

- **Empty values**: Leave blank or leave the field empty
  ```csv
  Event Title,,2020-01-01T00:00:00Z,,#FF0000
  ```

## API Reference

### TimelineImporter Class

#### `importFromJSON(jsonData: string, options?: ImportOptions): ImportResult`

Import timeline data from JSON format.

**Parameters:**
- `jsonData`: JSON string containing event data
- `options`: Import options (timeline name, description, color)

**Returns:** ImportResult object with success status and timeline data

**Example:**
```typescript
import { TimelineImporter } from './utils/timelineImporter';

const result = TimelineImporter.importFromJSON(jsonString, {
  timelineName: 'My Timeline',
  timelineDescription: 'Imported from JSON',
  timelineColor: '#409EFF'
});

if (result.success) {
  console.log(`Imported ${result.eventsCount} events`);
  // Use result.timeline
} else {
  console.error(result.error);
}
```

#### `importFromCSV(csvData: string, options?: ImportOptions): ImportResult`

Import timeline data from CSV format.

**Parameters:**
- `csvData`: CSV string containing event data
- `options`: Import options

**Returns:** ImportResult object

**Example:**
```typescript
const result = TimelineImporter.importFromCSV(csvString, {
  timelineName: 'CSV Timeline'
});
```

#### `importFromFile(fileContent: string, fileName: string, options?: ImportOptions): ImportResult`

Auto-detect format and import from file content.

**Parameters:**
- `fileContent`: File content as string
- `fileName`: File name (extension used for format detection)
- `options`: Import options

**Returns:** ImportResult object

#### `getCSVTemplate(): string`

Get a sample CSV template.

```typescript
const csvTemplate = TimelineImporter.getCSVTemplate();
console.log(csvTemplate);
```

#### `getJSONTemplate(): string`

Get a sample JSON template.

```typescript
const jsonTemplate = TimelineImporter.getJSONTemplate();
console.log(jsonTemplate);
```

### ImportResult Interface

```typescript
interface ImportResult {
  success: boolean;           // Whether import succeeded
  timeline?: Timeline;        // The imported timeline (if successful)
  error?: string;            // Error message (if failed)
  warnings: string[];        // Array of warning messages
  eventsCount: number;       // Number of successfully imported events
}
```

### ImportOptions Interface

```typescript
interface ImportOptions {
  timelineName?: string;     // Name for the imported timeline
  timelineDescription?: string; // Description for the timeline
  timelineColor?: string;    // Hex color code for the timeline
  dateFormat?: string;       // Date format specification
  customDateFormat?: string; // Custom date format pattern
}
```

## Error Handling

The importer provides detailed error messages for common issues:

### JSON Import Errors

- `"JSON data must be an array of events or an object with an events array"`
  - Solution: Ensure JSON is either an array or has an `events` property

- `"Row 1: title is required"`
  - Solution: Add a `title` field to your events

- `"Row 2: startTime is not a valid timestamp or date format"`
  - Solution: Use a valid timestamp or ISO date string

### CSV Import Errors

- `"CSV file must contain at least a header row and one data row"`
  - Solution: Add data rows to your CSV

- `"CSV must contain required columns: title, startTime"`
  - Solution: Ensure your CSV has `title` and `startTime` columns

- `"No valid events found in the imported CSV data"`
  - Solution: Check that all rows have required fields

## Examples

### Example 1: Simple JSON Import

```json
{
  "events": [
    {
      "title": "Project Start",
      "startTime": "2024-01-01T00:00:00Z",
      "color": "#0050B3"
    },
    {
      "title": "Project End",
      "startTime": "2024-12-31T23:59:59Z",
      "color": "#0050B3"
    }
  ]
}
```

### Example 2: CSV with Ranges

```csv
title,description,startTime,endTime,color
Q1 2024,First Quarter,2024-01-01T00:00:00Z,2024-03-31T23:59:59Z,#1890FF
Q2 2024,Second Quarter,2024-04-01T00:00:00Z,2024-06-30T23:59:59Z,#52C41A
Q3 2024,Third Quarter,2024-07-01T00:00:00Z,2024-09-30T23:59:59Z,#FAAD14
Q4 2024,Fourth Quarter,2024-10-01T00:00:00Z,2024-12-31T23:59:59Z,#F5222D
```

### Example 3: Historical Events

```json
{
  "events": [
    {
      "title": "Moon Landing",
      "description": "Apollo 11 reaches the moon",
      "startTime": 1969-07-20T20:17:00Z",
      "color": "#722ED1"
    },
    {
      "title": "Fall of Berlin Wall",
      "startTime": "1989-11-09T00:00:00Z",
      "color": "#EB2F96"
    }
  ]
}
```

## Best Practices

1. **Validation**: Always validate your data before importing
2. **Date Consistency**: Use consistent date formats throughout your data
3. **Colors**: Use valid hex color codes (#RRGGBB format)
4. **Descriptions**: Keep descriptions concise but informative
5. **Backups**: Keep a backup of your data before making bulk imports
6. **Testing**: Test with a small dataset first before importing large datasets

## Troubleshooting

### Import Fails with No Error Message
- Check that your data format matches the specification
- Ensure all required fields are present
- Verify JSON/CSV syntax is valid

### Events Not Appearing
- Check the timeline view zoom level
- Verify startTime values are within the visible date range
- Ensure events were imported (check warning messages)

### Date Not Recognized
- Supported formats: ISO 8601, Unix timestamps (ms or s)
- Convert custom date formats to one of these formats
- Check for timezone issues in date parsing

### Special Characters Corrupted
- For CSV: wrap values with special characters in quotes
- For JSON: use proper escaping for special characters
- Ensure file encoding is UTF-8

## Integration Example

Here's a complete example of integrating the importer into your timeline editor:

```typescript
import React, { useState } from 'react';
import TimelineImporterComponent from './components/TimelineImporter';
import { Timeline } from './types/timeline';

export const MyApp: React.FC = () => {
  const [timeline, setTimeline] = useState<Timeline | null>(null);

  const handleImportSuccess = (importedTimeline: Timeline) => {
    setTimeline(importedTimeline);
    console.log(`Successfully imported timeline with ${importedTimeline.events.length} events`);
  };

  const handleImportError = (error: string) => {
    console.error('Import error:', error);
  };

  return (
    <div>
      <TimelineImporterComponent
        onImportSuccess={handleImportSuccess}
        onImportError={handleImportError}
      />
      {timeline && <div>Timeline: {timeline.name}</div>}
    </div>
  );
};
```

## Support

For issues, feature requests, or questions about the import functionality, please open an issue in the GitHub repository.
