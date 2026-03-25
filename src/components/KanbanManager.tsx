import React, { useState } from 'react';
import { Kanban, Timeline, KanbanLayout } from '../types/timeline';
import { Card, Button, Form, Input, Select, Dialog, Slider } from 'element-ui';

interface KanbanManagerProps {
  kanbans: Kanban[];
  currentKanban: Kanban | null;
  timelines: Timeline[];
  onCreateKanban: (kanban: Omit<Kanban, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onSelectKanban: (kanban: Kanban) => void;
  onUpdateKanban: (kanbanId: string, updates: Partial<Kanban>) => void;
  onDeleteKanban: (kanbanId: string) => void;
}

const KanbanManager: React.FC<KanbanManagerProps> = ({
  kanbans,
  currentKanban,
  timelines,
  onCreateKanban,
  onSelectKanban,
  onUpdateKanban,
  onDeleteKanban
}) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newKanbanForm, setNewKanbanForm] = useState({
    name: '',
    description: '',
    timelines: [] as Timeline[],
    layout: {
      type: 'horizontal' as KanbanLayout['type'],
      timelineHeight: 100,
      spacing: 20
    }
  });

  const handleCreateKanban = () => {
    if (!newKanbanForm.name.trim()) {
      alert('Please enter a kanban name');
      return;
    }

    onCreateKanban(newKanbanForm);
    setNewKanbanForm({
      name: '',
      description: '',
      timelines: [],
      layout: {
        type: 'horizontal',
        timelineHeight: 100,
        spacing: 20
      }
    });
    setShowCreateDialog(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Kanban Manager</h2>
        <Button type="primary" onClick={() => setShowCreateDialog(true)}>
          New Kanban
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
        {kanbans.map((kanban) => (
          <Card
            key={kanban.id}
            style={{
              cursor: 'pointer',
              border: currentKanban?.id === kanban.id ? '2px solid #409eff' : '1px solid #ddd',
              backgroundColor: currentKanban?.id === kanban.id ? '#f0f9ff' : 'white'
            }}
            onClick={() => onSelectKanban(kanban)}
          >
            <h3>{kanban.name}</h3>
            {kanban.description && <p style={{ color: '#666', fontSize: '14px' }}>{kanban.description}</p>}
            
            <div style={{ marginTop: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#999' }}>
                <span>Timelines: {kanban.timelines.length}</span>
                <span>Layout: {kanban.layout.type}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
                Created: {new Date(kanban.createdAt).toLocaleDateString()}
              </div>
            </div>

            <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
              <Button
                size="small"
                type="danger"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Are you sure you want to delete kanban "${kanban.name}"?`)) {
                    onDeleteKanban(kanban.id);
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog
        title="Create New Kanban"
        visible={showCreateDialog}
        onCancel={() => setShowCreateDialog(false)}
        onConfirm={handleCreateKanban}
        width="600px"
      >
        <Form labelWidth="120px">
          <Form.Item label="Kanban Name" required>
            <Input
              value={newKanbanForm.name}
              onChange={(value) => setNewKanbanForm({ ...newKanbanForm, name: value })}
              placeholder="Enter kanban name"
            />
          </Form.Item>
          <Form.Item label="Description">
            <Input
              type="textarea"
              value={newKanbanForm.description}
              onChange={(value) => setNewKanbanForm({ ...newKanbanForm, description: value })}
              placeholder="Enter kanban description"
              rows={3}
            />
          </Form.Item>
          <Form.Item label="Layout Type">
            <Select
              value={newKanbanForm.layout.type}
              onChange={(value) => setNewKanbanForm({
                ...newKanbanForm,
                layout: { ...newKanbanForm.layout, type: value as KanbanLayout['type'] }
              })}
            >
              <Select.Option label="Horizontal" value="horizontal" />
              <Select.Option label="Vertical" value="vertical" />
              <Select.Option label="Grid" value="grid" />
            </Select>
          </Form.Item>
          <Form.Item label="Timeline Height">
            <Slider
              value={newKanbanForm.layout.timelineHeight}
              min={50}
              max={200}
              onChange={(value) => setNewKanbanForm({
                ...newKanbanForm,
                layout: { ...newKanbanForm.layout, timelineHeight: value }
              })}
              showInput
            />
          </Form.Item>
          <Form.Item label="Spacing">
            <Slider
              value={newKanbanForm.layout.spacing}
              min={5}
              max={50}
              onChange={(value) => setNewKanbanForm({
                ...newKanbanForm,
                layout: { ...newKanbanForm.layout, spacing: value }
              })}
              showInput
            />
          </Form.Item>
        </Form>
      </Dialog>
    </div>
  );
};

export default KanbanManager;
