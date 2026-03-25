import React, { useState } from 'react';
import { Timeline, TimelineEvent } from '../types/timeline';
import { Form, Input, Button, Card, Row, Col, DatePicker, ColorPicker, Upload, Icon } from 'element-ui';

interface TimelineEditorProps {
  timeline: Timeline;
  onAddEvent: (event: Omit<TimelineEvent, 'id'>) => void;
  onUpdateEvent: (eventId: string, updates: Partial<TimelineEvent>) => void;
  onDeleteEvent: (eventId: string) => void;
  onTimelineUpdate: (updates: Partial<Timeline>) => void;
}

const TimelineEditor: React.FC<TimelineEditorProps> = ({
  timeline,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  onTimelineUpdate
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    timestamp: Date.now(),
    color: '#409eff',
    icon: '',
    imageData: ''
  });

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      alert('Please enter an event title');
      return;
    }

    onAddEvent(formData);
    setFormData({
      title: '',
      description: '',
      timestamp: Date.now(),
      color: '#409eff',
      icon: '',
      imageData: ''
    });
  };

  const handleImageUpload = (file: any) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setFormData({
        ...formData,
        imageData: e.target?.result as string
      });
    };
    reader.readAsDataURL(file);
    return false; // Prevent default upload behavior
  };

  return (
    <div>
      <Card className="timeline-info" style={{ marginBottom: '20px' }}>
        <h3>Timeline Information</h3>
        <Form labelWidth="120px">
          <Form.Item label="Name">
            <Input
              value={timeline.name}
              onChange={(value) => onTimelineUpdate({ name: value })}
              placeholder="Enter timeline name"
            />
          </Form.Item>
          <Form.Item label="Description">
            <Input
              type="textarea"
              value={timeline.description}
              onChange={(value) => onTimelineUpdate({ description: value })}
              placeholder="Enter timeline description"
              rows={3}
            />
          </Form.Item>
        </Form>
      </Card>

      <Card className="event-form">
        <h3>Add New Event</h3>
        <Form labelWidth="120px">
          <Row gutter={20}>
            <Col span={12}>
              <Form.Item label="Title" required>
                <Input
                  value={formData.title}
                  onChange={(value) => setFormData({ ...formData, title: value })}
                  placeholder="Event title"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Date & Time">
                <DatePicker
                  type="datetime"
                  value={new Date(formData.timestamp)}
                  onChange={(date) => setFormData({ ...formData, timestamp: date?.getTime() || Date.now() })}
                  placeholder="Select date and time"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Description">
            <Input
              type="textarea"
              value={formData.description}
              onChange={(value) => setFormData({ ...formData, description: value })}
              placeholder="Event description"
              rows={3}
            />
          </Form.Item>

          <Row gutter={20}>
            <Col span={8}>
              <Form.Item label="Color">
                <ColorPicker
                  value={formData.color}
                  onChange={(color) => setFormData({ ...formData, color: color || '#409eff' })}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Icon">
                <Input
                  value={formData.icon}
                  onChange={(value) => setFormData({ ...formData, icon: value })}
                  placeholder="Icon name (optional)"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Image">
                <Upload
                  beforeUpload={handleImageUpload}
                  showFileList={false}
                  accept="image/*"
                >
                  <Button size="small" type="primary">
                    <Icon name="upload" /> Upload Image
                  </Button>
                </Upload>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Button type="primary" onClick={handleSubmit}>
              Add Event
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card style={{ marginTop: '20px' }}>
        <h3>Events ({timeline.events.length})</h3>
        {timeline.events.length === 0 ? (
          <p>No events yet. Add your first event above!</p>
        ) : (
          <div>
            {timeline.events.map((event) => (
              <Card
                key={event.id}
                style={{
                  marginBottom: '10px',
                  borderLeft: `4px solid ${event.color || '#409eff'}`
                }}
              >
                <Row>
                  <Col span={18}>
                    <h4>{event.title}</h4>
                    <p style={{ margin: '5px 0', color: '#666' }}>
                      {new Date(event.timestamp).toLocaleString()}
                    </p>
                    {event.description && (
                      <p style={{ margin: '5px 0' }}>{event.description}</p>
                    )}
                  </Col>
                  <Col span={6} style={{ textAlign: 'right' }}>
                    <Button
                      size="small"
                      type="danger"
                      onClick={() => onDeleteEvent(event.id)}
                    >
                      Delete
                    </Button>
                  </Col>
                </Row>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default TimelineEditor;
