import React, { useState } from 'react';
import { Project, Kanban, DataAsset } from '../types/timeline';
import { Card, Button, Form, Input, Tabs, TabPane, Modal, Dialog } from 'element-ui';

interface ProjectManagerProps {
  projects: Project[];
  currentProject: Project | null;
  onCreateProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onSelectProject: (project: Project) => void;
  onUpdateProject: (projectId: string, updates: Partial<Project>) => void;
  onDeleteProject: (projectId: string) => void;
}

const ProjectManager: React.FC<ProjectManagerProps> = ({
  projects,
  currentProject,
  onCreateProject,
  onSelectProject,
  onUpdateProject,
  onDeleteProject
}) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newProjectForm, setNewProjectForm] = useState({
    name: '',
    description: '',
    kanbans: [],
    dataAssets: [],
    settings: {
      defaultTimelineColor: '#409eff',
      defaultChartType: 'line' as const,
      autoSave: true,
      theme: 'light' as const
    }
  });

  const handleCreateProject = () => {
    if (!newProjectForm.name.trim()) {
      alert('Please enter a project name');
      return;
    }

    onCreateProject(newProjectForm);
    setNewProjectForm({
      name: '',
      description: '',
      kanbans: [],
      dataAssets: [],
      settings: {
        defaultTimelineColor: '#409eff',
        defaultChartType: 'line',
        autoSave: true,
        theme: 'light'
      }
    });
    setShowCreateDialog(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Project Manager</h2>
        <Button type="primary" onClick={() => setShowCreateDialog(true)}>
          New Project
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {projects.map((project) => (
          <Card
            key={project.id}
            style={{
              cursor: 'pointer',
              border: currentProject?.id === project.id ? '2px solid #409eff' : '1px solid #ddd',
              backgroundColor: currentProject?.id === project.id ? '#f0f9ff' : 'white'
            }}
            onClick={() => onSelectProject(project)}
          >
            <h3>{project.name}</h3>
            {project.description && <p style={{ color: '#666', fontSize: '14px' }}>{project.description}</p>}
            
            <div style={{ marginTop: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#999' }}>
                <span>Kanbans: {project.kanbans.length}</span>
                <span>Data Assets: {project.dataAssets.length}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
                Created: {new Date(project.createdAt).toLocaleDateString()}
              </div>
            </div>

            <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
              <Button
                size="small"
                type="danger"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Are you sure you want to delete project "${project.name}"?`)) {
                    onDeleteProject(project.id);
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
        title="Create New Project"
        visible={showCreateDialog}
        onCancel={() => setShowCreateDialog(false)}
        onConfirm={handleCreateProject}
        width="500px"
      >
        <Form labelWidth="120px">
          <Form.Item label="Project Name" required>
            <Input
              value={newProjectForm.name}
              onChange={(value) => setNewProjectForm({ ...newProjectForm, name: value })}
              placeholder="Enter project name"
            />
          </Form.Item>
          <Form.Item label="Description">
            <Input
              type="textarea"
              value={newProjectForm.description}
              onChange={(value) => setNewProjectForm({ ...newProjectForm, description: value })}
              placeholder="Enter project description"
              rows={3}
            />
          </Form.Item>
        </Form>
      </Dialog>
    </div>
  );
};

export default ProjectManager;
