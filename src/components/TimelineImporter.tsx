import React, { useState } from 'react';
import { Timeline } from '../types/timeline';
import { TimelineImporter, ImportResult, ImportOptions } from '../utils/timelineImporter';
import './TimelineImporter.css';

interface TimelineImporterProps {
  onImportSuccess: (timeline: Timeline) => void;
  onImportError?: (error: string) => void;
}

const TimelineImporterComponent: React.FC<TimelineImporterProps> = ({
  onImportSuccess,
  onImportError
}) => {
  const [importFormat, setImportFormat] = useState<'json' | 'csv'>('json');
  const [timelineName, setTimelineName] = useState('Imported Timeline');
  const [timelineDescription, setTimelineDescription] = useState('');
  const [timelineColor, setTimelineColor] = useState('#409EFF');
  const [textInput, setTextInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showTemplate, setShowTemplate] = useState(false);

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setTextInput(content);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!textInput.trim()) {
      onImportError?.('Please provide data to import');
      return;
    }

    setIsLoading(true);

    const options: ImportOptions = {
      timelineName,
      timelineDescription,
      timelineColor
    };

    let result: ImportResult;

    if (importFormat === 'json') {
      result = TimelineImporter.importFromJSON(textInput, options);
    } else {
      result = TimelineImporter.importFromCSV(textInput, options);
    }

    setImportResult(result);
    setIsLoading(false);

    if (result.success && result.timeline) {
      onImportSuccess(result.timeline);
      // Clear the form
      setTextInput('');
      setImportResult(null);
    } else {
      onImportError?.(result.error || 'Import failed');
    }
  };

  const handleCopyTemplate = () => {
    const template =
      importFormat === 'json'
        ? TimelineImporter.getJSONTemplate()
        : TimelineImporter.getCSVTemplate();
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(template).then(() => {
        alert('Template copied to clipboard!');
      });
    }
  };

  const handleApplyTemplate = () => {
    const template =
      importFormat === 'json'
        ? TimelineImporter.getJSONTemplate()
        : TimelineImporter.getCSVTemplate();
    setTextInput(template);
  };

  return (
    <div className="timeline-importer-container">
      <div className="importer-card">
        <h2>Import Timeline Data</h2>

        {/* Format Selection */}
        <div className="form-section">
          <label>Format</label>
          <div className="format-buttons">
            <button
              className={`format-btn ${importFormat === 'json' ? 'active' : ''}`}
              onClick={() => setImportFormat('json')}
            >
              JSON
            </button>
            <button
              className={`format-btn ${importFormat === 'csv' ? 'active' : ''}`}
              onClick={() => setImportFormat('csv')}
            >
              CSV
            </button>
          </div>
        </div>

        {/* Timeline Metadata */}
        <div className="form-section">
          <label htmlFor="timelineName">Timeline Name</label>
          <input
            id="timelineName"
            type="text"
            value={timelineName}
            onChange={(e) => setTimelineName(e.target.value)}
            placeholder="Enter timeline name"
            className="form-input"
          />
        </div>

        <div className="form-section">
          <label htmlFor="timelineDesc">Timeline Description</label>
          <textarea
            id="timelineDesc"
            value={timelineDescription}
            onChange={(e) => setTimelineDescription(e.target.value)}
            placeholder="Enter timeline description (optional)"
            className="form-textarea"
            rows={3}
          />
        </div>

        <div className="form-section">
          <label htmlFor="timelineColor">Timeline Color</label>
          <div className="color-input-wrapper">
            <input
              id="timelineColor"
              type="color"
              value={timelineColor}
              onChange={(e) => setTimelineColor(e.target.value)}
              className="color-input"
            />
            <span className="color-value">{timelineColor}</span>
          </div>
        </div>

        {/* Data Input */}
        <div className="form-section">
          <div className="input-header">
            <label htmlFor="dataInput">Import Data</label>
            <div className="input-actions">
              <button
                className="text-btn"
                onClick={() => setShowTemplate(!showTemplate)}
              >
                {showTemplate ? 'Hide' : 'Show'} Template
              </button>
              <button
                className="text-btn"
                onClick={handleApplyTemplate}
              >
                Apply Template
              </button>
            </div>
          </div>

          {showTemplate && (
            <div className="template-preview">
              <pre>
                {importFormat === 'json'
                  ? TimelineImporter.getJSONTemplate()
                  : TimelineImporter.getCSVTemplate()}
              </pre>
              <button
                className="secondary-btn"
                onClick={handleCopyTemplate}
              >
                Copy Template
              </button>
            </div>
          )}

          <textarea
            id="dataInput"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder={`Paste your ${importFormat.toUpperCase()} data here...`}
            className="form-textarea large"
            rows={10}
          />

          <div className="file-input-wrapper">
            <label htmlFor="fileInput" className="file-label">
              Or select a file:
            </label>
            <input
              id="fileInput"
              type="file"
              accept={importFormat === 'json' ? '.json' : '.csv'}
              onChange={handleFileInput}
              className="file-input"
            />
          </div>
        </div>

        {/* Import Result */}
        {importResult && (
          <div className={`import-result ${importResult.success ? 'success' : 'error'}`}>
            <div className="result-header">
              <span className={`result-icon ${importResult.success ? 'success' : 'error'}`}>
                {importResult.success ? '✓' : '✗'}
              </span>
              <span className="result-title">
                {importResult.success ? 'Import Successful' : 'Import Failed'}
              </span>
            </div>

            {importResult.error && (
              <div className="result-error">
                <strong>Error:</strong> {importResult.error}
              </div>
            )}

            {importResult.warnings.length > 0 && (
              <div className="result-warnings">
                <strong>Warnings ({importResult.warnings.length}):</strong>
                <ul>
                  {importResult.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {importResult.success && (
              <div className="result-info">
                <strong>Events Imported:</strong> {importResult.eventsCount}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="action-buttons">
          <button
            className="primary-btn"
            onClick={handleImport}
            disabled={isLoading || !textInput.trim()}
          >
            {isLoading ? 'Importing...' : 'Import'}
          </button>
          <button
            className="secondary-btn"
            onClick={() => {
              setTextInput('');
              setImportResult(null);
            }}
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimelineImporterComponent;
