import React, { useState, useRef, useEffect } from 'react';
import { Timeline, TimelineEvent, DataAsset, KanbanLayout } from '../types/timeline';
import { Button, Card, Slider, Switch, Dialog, Form, Input, DatePicker, ColorPicker, Select } from 'element-ui';

interface MultiTimelineViewProps {
  kanban: Kanban;
  timelines: Timeline[];
  dataAssets: DataAsset[];
  layout: KanbanLayout;
  onUpdateTimeline: (timelineId: string, updates: Partial<Timeline>) => void;
  onDeleteTimeline: (timelineId: string) => void;
  onUpdateEvent: (timelineId: string, eventId: string, updates: Partial<TimelineEvent>) => void;
  onDeleteEvent: (timelineId: string, eventId: string) => void;
}

const MultiTimelineView: React.FC<MultiTimelineViewProps> = ({
  kanban,
  timelines,
  dataAssets,
  layout,
  onUpdateTimeline,
  onDeleteTimeline,
  onUpdateEvent,
  onDeleteEvent
}) => {
  const [viewOptions, setViewOptions] = useState({
    zoom: 1,
    startTime: Math.min(...timelines.flatMap(t => t.events.map(e => e.startTime)), Date.now()),
    endTime: Math.max(...timelines.flatMap(t => t.events.map(e => e.endTime || e.startTime)), Date.now() + 86400000),
    showGrid: true,
    showImages: true,
    showDataAssets: true,
    selectedTimelineIds: timelines.filter(t => t.isVisible).map(t => t.id)
  });

  const [selectedEvent, setSelectedEvent] = useState<{ timelineId: string; event: TimelineEvent } | null>(null);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [editForm, setEditForm] = useState<Partial<TimelineEvent>>({});
  const canvasRef = useRef<HTMLDivElement>(null);

  const timeRange = viewOptions.endTime - viewOptions.startTime;
  const pixelsPerMs = (1000 * viewOptions.zoom) / timeRange;

  const getEventPosition = (timestamp: number): number => {
    return ((timestamp - viewOptions.startTime) * pixelsPerMs);
  };

  const getEventWidth = (startTime: number, endTime?: number): number => {
    if (!endTime) return 120; // Default width for point events
    return ((endTime - startTime) * pixelsPerMs);
  };

  const handleEventClick = (timelineId: string, event: TimelineEvent) => {
    setSelectedEvent({ timelineId, event });
    setEditForm({
      title: event.title,
      description: event.description,
      startTime: event.startTime,
      endTime: event.endTime,
      color: event.color || '#409eff',
      icon: event.icon,
      dataAssetId: event.dataAssetId
    });
    setEditDialogVisible(true);
  };

  const handleSaveEdit = () => {
    if (selectedEvent && editForm.title) {
      onUpdateEvent(selectedEvent.timelineId, selectedEvent.event.id, editForm);
      setEditDialogVisible(false);
      setSelectedEvent(null);
    }
  };

  const handleTimelineVisibilityToggle = (timelineId: string) => {
    const newSelectedIds = viewOptions.selectedTimelineIds.includes(timelineId)
      ? viewOptions.selectedTimelineIds.filter(id => id !== timelineId)
      : [...viewOptions.selectedTimelineIds, timelineId];
    
    setViewOptions({ ...viewOptions, selectedTimelineIds: newSelectedIds });
  };

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  const getDataAssetById = (id: string): DataAsset | undefined => {
    return dataAssets.find(asset => asset.id === id);
  };

  useEffect(() => {
    if (timelines.length > 0) {
      const allEvents = timelines.flatMap(t => t.events);
      if (allEvents.length > 0) {
        const timestamps = allEvents.map(e => e.startTime);
        const endTimestamps = allEvents.filter(e => e.endTime).map(e => e.endTime!);
        const minTime = Math.min(...timestamps);
        const maxTime = Math.max(...timestamps, ...endTimestamps);
        const padding = (maxTime - minTime) * 0.1;
        
        setViewOptions(prev => ({
          ...prev,
          startTime: minTime - padding,
          endTime: maxTime + padding
        }));
      }
    }
  }, [timelines]);

  const renderTimeline = (timeline: Timeline, index: number) => {
    if (!viewOptions.selectedTimelineIds.includes(timeline.id)) return null;

    const topPosition = layout.type === 'vertical' 
      ? index * (layout.timelineHeight || 100) + (index * (layout.spacing || 20))
      : 50;

    return (
      <div
        key={timeline.id}
        style={{
          position: 'absolute',
          top: `${topPosition}px`,
          left: '0',
          right: '0',
          height: `${layout.timelineHeight || 100}px`,
          borderBottom: `2px solid ${timeline.color || '#409eff'}`
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: '10px',
            top: '5px',
            fontSize: '12px',
            fontWeight: 'bold',
            color: timeline.color || '#409eff',
            background: 'white',
            padding: '2px 6px',
            borderRadius: '3px'
          }}
        >
          {timeline.name}
        </div>
        
        {timeline.events.map((event) => {
          const position = getEventPosition(event.startTime);
          const width = getEventWidth(event.startTime, event.endTime);
          
          return (
            <div
              key={event.id}
              className="timeline-event"
              style={{
                position: 'absolute',
                left: `${position}px`,
                top: '25px',
                width: `${width}px`,
                backgroundColor: event.color || timeline.color || '#409eff',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '4px',
                color: 'white',
                fontSize: '12px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
              }}
              onClick={() => handleEventClick(timeline.id, event)}
              title={`${event.title}\n${formatTime(event.startTime)}${event.endTime ? ` - ${formatTime(event.endTime)}` : ''}`}
            >
              <div style={{ fontWeight: 'bold' }}>{event.title}</div>
              {event.endTime && (
                <div style={{ fontSize: '10px', opacity: 0.8 }}>
                  {new Date(event.startTime).toLocaleDateString()} - {new Date(event.endTime).toLocaleDateString()}
                </div>
              )}
              
              {viewOptions.showImages && event.imageData && (
                <img
                  src={event.imageData}
                  alt={event.title}
                  style={{ 
                    width: '30px', 
                    height: '20px', 
                    objectFit: 'cover', 
                    marginTop: '2px',
                    borderRadius: '2px'
                  }}
                />
              )}
              
              {viewOptions.showDataAssets && event.dataAssetId && (
                <div style={{ fontSize: '10px', marginTop: '2px' }}>
                  📊 {getDataAssetById(event.dataAssetId)?.name}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div>
      <Card style={{ marginBottom: '20px' }}>
        <h3>{kanban.name} - Multi Timeline View</h3>
        {kanban.description && <p>{kanban.description}</p>}
        <p>Timelines: {timelines.length} | Layout: {layout.type}</p>
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
              onChange={(value) => setViewOptions({ ...viewOptions, zoom: value })}
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
          <div>
            <Switch
              value={viewOptions.showDataAssets}
              onChange={(value) => setViewOptions({ ...viewOptions, showDataAssets: value })}
            />
            <span style={{ marginLeft: '8px' }}>Show Data Assets</span>
          </div>
        </div>
        
        <div style={{ marginTop: '20px' }}>
          <h5>Timeline Visibility</h5>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {timelines.map((timeline) => (
              <div key={timeline.id} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Switch
                  value={viewOptions.selectedTimelineIds.includes(timeline.id)}
                  onChange={() => handleTimelineVisibilityToggle(timeline.id)}
                />
                <span style={{ 
                  fontSize: '12px',
                  color: timeline.color || '#409eff',
                  fontWeight: viewOptions.selectedTimelineIds.includes(timeline.id) ? 'bold' : 'normal'
                }}>
                  {timeline.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <h4>Timeline Canvas</h4>
        <div
          ref={canvasRef}
          style={{
            height: layout.type === 'vertical' 
              ? `${timelines.length * ((layout.timelineHeight || 100) + (layout.spacing || 20))}px`
              : '400px',
            overflowX: 'auto',
            overflowY: 'auto',
            position: 'relative',
            background: viewOptions.showGrid 
              ? 'repeating-linear-gradient(90deg, #f0f0f0, #f0f0f0 1px, transparent 1px, transparent 50px)'
              : '#f5f5f5',
            border: '1px solid #ddd'
          }}
        >
          {timelines.length === 0 ? (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              color: '#999'
            }}>
              No timelines to display. Add timelines to this kanban.
            </div>
          ) : (
            <div style={{ 
              position: 'relative', 
              height: '100%', 
              minWidth: `${timeRange * pixelsPerMs}px` 
            }}>
              {timelines.map((timeline, index) => renderTimeline(timeline, index))}
            </div>
          )}
        </div>
      </Card>

      <Dialog
        title="Edit Event"
        visible={editDialogVisible}
        onCancel={() => setEditDialogVisible(false)}
        onConfirm={handleSaveEdit}
        width="600px"
      >
        <Form labelWidth="120px">
          <Form.Item label="Title" required>
            <Input
              value={editForm.title}
              onChange={(value) => setEditForm({ ...editForm, title: value })}
              placeholder="Event title"
            />
          </Form.Item>
          <Form.Item label="Start Time">
            <DatePicker
              type="datetime"
              value={editForm.startTime ? new Date(editForm.startTime) : new Date()}
              onChange={(date) => setEditForm({ ...editForm, startTime: date?.getTime() || Date.now() })}
              placeholder="Select start time"
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item label="End Time">
            <DatePicker
              type="datetime"
              value={editForm.endTime ? new Date(editForm.endTime) : undefined}
              onChange={(date) => setEditForm({ ...editForm, endTime: date?.getTime() || undefined })}
              placeholder="Select end time (optional)"
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
          <Form.Item label="Data Asset">
            <Select
              value={editForm.dataAssetId}
              onChange={(value) => setEditForm({ ...editForm, dataAssetId: value })}
              placeholder="Select data asset (optional)"
              allowClear
            >
              {dataAssets.map((asset) => (
                <Select.Option key={asset.id} label={asset.name} value={asset.id}>
                  {asset.name} ({asset.type})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'right', marginTop: '20px' }}>
          <Button onClick={() => setEditDialogVisible(false)}>Cancel</Button>
          <Button 
            type="danger" 
            onClick={() => {
              if (selectedEvent) {
                onDeleteEvent(selectedEvent.timelineId, selectedEvent.event.id);
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

export default MultiTimelineView;
