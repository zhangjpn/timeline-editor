import React, { useState, useRef, useEffect } from 'react';
import { Timeline, TimelineEvent, TimelineViewOptions } from '../types/timeline';
import { Button, Card, Slider, Switch, Dialog, Form, Input, DatePicker, ColorPicker } from 'element-ui';

interface TimelineViewProps {
  timeline: Timeline;
  onEditEvent: (eventId: string, updates: Partial<TimelineEvent>) => void;
  onDeleteEvent: (eventId: string) => void;
}

const TimelineView: React.FC<TimelineViewProps> = ({
  timeline,
  onEditEvent,
  onDeleteEvent
}) => {
  const [viewOptions, setViewOptions] = useState<TimelineViewOptions>({
    zoom: 1,
    startTime: Math.min(...timeline.events.map(e => e.timestamp), Date.now()),
    endTime: Math.max(...timeline.events.map(e => e.timestamp), Date.now() + 86400000),
    showGrid: true,
    showImages: true
  });

  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [editForm, setEditForm] = useState<Partial<TimelineEvent>>({});
  const canvasRef = useRef<HTMLDivElement>(null);

  const timeRange = viewOptions.endTime - viewOptions.startTime;
  const pixelsPerMs = (1000 * viewOptions.zoom) / timeRange; // 1000px base width

  const getEventPosition = (timestamp: number): number => {
    return ((timestamp - viewOptions.startTime) * pixelsPerMs);
  };

  const handleEventClick = (event: TimelineEvent) => {
    setSelectedEvent(event);
    setEditForm({
      title: event.title,
      description: event.description,
      timestamp: event.timestamp,
      color: event.color || '#409eff',
      icon: event.icon
    });
    setEditDialogVisible(true);
  };

  const handleSaveEdit = () => {
    if (selectedEvent && editForm.title) {
      onEditEvent(selectedEvent.id, editForm);
      setEditDialogVisible(false);
      setSelectedEvent(null);
    }
  };

  const handleZoomChange = (value: number) => {
    setViewOptions({ ...viewOptions, zoom: value });
  };

  const handleTimeRangeChange = (start: number, end: number) => {
    setViewOptions({ ...viewOptions, startTime: start, endTime: end });
  };

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  useEffect(() => {
    if (timeline.events.length > 0) {
      const timestamps = timeline.events.map(e => e.timestamp);
      const minTime = Math.min(...timestamps);
      const maxTime = Math.max(...timestamps);
      const padding = (maxTime - minTime) * 0.1; // 10% padding
      
      setViewOptions(prev => ({
        ...prev,
        startTime: minTime - padding,
        endTime: maxTime + padding
      }));
    }
  }, [timeline.events]);

  return (
    <div>
      <Card style={{ marginBottom: '20px' }}>
        <h3>{timeline.name}</h3>
        {timeline.description && <p>{timeline.description}</p>}
        <p>Events: {timeline.events.length} | Created: {formatTime(timeline.createdAt)} | Updated: {formatTime(timeline.updatedAt)}</p>
      </Card>

      <Card style={{ marginBottom: '20px' }}>
        <h4>View Controls</h4>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ minWidth: '200px' }}>
            <label>Zoom: {viewOptions.zoom.toFixed(1)}x</label>
            <Slider
              value={viewOptions.zoom}
              min={0.1}
              max={5}
              step={0.1}
              onChange={handleZoomChange}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <Switch
              value={viewOptions.showGrid}
              onChange={(value) => setViewOptions({ ...viewOptions, showGrid: value })}
            />
            <span style={{ marginLeft: '8px' }}>Show Grid</span>
          </div>
          <div>
            <Switch
              value={viewOptions.showImages}
              onChange={(value) => setViewOptions({ ...viewOptions, showImages: value })}
            />
            <span style={{ marginLeft: '8px' }}>Show Images</span>
          </div>
        </div>
      </Card>

      <Card>
        <h4>Timeline View</h4>
        <div
          ref={canvasRef}
          className="timeline-canvas"
          style={{
            height: '400px',
            overflowX: 'auto',
            overflowY: 'hidden',
            position: 'relative',
            background: viewOptions.showGrid 
              ? 'repeating-linear-gradient(90deg, #f0f0f0, #f0f0f0 1px, transparent 1px, transparent 50px)'
              : '#f5f5f5'
          }}
        >
          {timeline.events.length === 0 ? (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              color: '#999'
            }}>
              No events to display. Switch to Editor mode to add events.
            </div>
          ) : (
            <div style={{ position: 'relative', height: '100%', minWidth: `${timeRange * pixelsPerMs}px` }}>
              {timeline.events.map((event, index) => {
                const position = getEventPosition(event.timestamp);
                const topPosition = 50 + (index % 3) * 80; // Stagger events vertically
                
                return (
                  <div
                    key={event.id}
                    className="timeline-event"
                    style={{
                      position: 'absolute',
                      left: `${position}px`,
                      top: `${topPosition}px`,
                      backgroundColor: event.color || '#409eff',
                      cursor: 'pointer',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      minWidth: '120px',
                      maxWidth: '200px',
                      wordWrap: 'break-word',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                    onClick={() => handleEventClick(event)}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{event.title}</div>
                    <div style={{ fontSize: '12px', opacity: 0.8 }}>
                      {new Date(event.timestamp).toLocaleDateString()}
                    </div>
                    {viewOptions.showImages && event.imageData && (
                      <img
                        src={event.imageData}
                        alt={event.title}
                        style={{ 
                          width: '100%', 
                          maxHeight: '60px', 
                          objectFit: 'cover', 
                          marginTop: '4px',
                          borderRadius: '2px'
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      <Dialog
        title="Edit Event"
        visible={editDialogVisible}
        onCancel={() => setEditDialogVisible(false)}
        onConfirm={handleSaveEdit}
        width="500px"
      >
        <Form labelWidth="100px">
          <Form.Item label="Title" required>
            <Input
              value={editForm.title}
              onChange={(value) => setEditForm({ ...editForm, title: value })}
              placeholder="Event title"
            />
          </Form.Item>
          <Form.Item label="Date & Time">
            <DatePicker
              type="datetime"
              value={editForm.timestamp ? new Date(editForm.timestamp) : new Date()}
              onChange={(date) => setEditForm({ ...editForm, timestamp: date?.getTime() || Date.now() })}
              placeholder="Select date and time"
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item label="Description">
            <Input
              type="textarea"
              value={editForm.description}
              onChange={(value) => setEditForm({ ...editForm, description: value })}
              placeholder="Event description"
              rows={3}
            />
          </Form.Item>
          <Form.Item label="Color">
            <ColorPicker
              value={editForm.color}
              onChange={(color) => setEditForm({ ...editForm, color: color || '#409eff' })}
            />
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'right', marginTop: '20px' }}>
          <Button onClick={() => setEditDialogVisible(false)}>Cancel</Button>
          <Button 
            type="danger" 
            onClick={() => {
              if (selectedEvent) {
                onDeleteEvent(selectedEvent.id);
                setEditDialogVisible(false);
                setSelectedEvent(null);
              }
            }}
            style={{ marginLeft: '10px' }}
          >
            Delete
          </Button>
          <Button 
            type="primary" 
            onClick={handleSaveEdit}
            style={{ marginLeft: '10px' }}
          >
            Save
          </Button>
        </div>
      </Dialog>
    </div>
  );
};

export default TimelineView;
