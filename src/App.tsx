import React, { useMemo, useState, useEffect } from 'react';
import { DataAsset, Kanban, Project, Timeline, TimelineEvent } from './types/timeline';
import { TimelineStorage } from './utils/timelineStorage';
import TimelineEditor from './components/TimelineEditor';
import TimelineView from './components/TimelineView';
import ProjectManager from './components/ProjectManager';
import KanbanManager from './components/KanbanManager';
import DataAssetManager from './components/DataAssetManager';
import MultiTimelineView from './components/MultiTimelineView';
import { Container, Header, Main, Button, Message } from './components/ui';

const App: React.FC = () => {
  const initialProject = useMemo(() => {
    const timeline = TimelineStorage.createEmptyTimeline('Main Timeline');
    const kanban = TimelineStorage.createEmptyKanban('Main Kanban');
    kanban.timelines = [timeline];
    const project = TimelineStorage.createEmptyProject('New Project');
    project.kanbans = [kanban];
    return project;
  }, []);

  const [projects, setProjects] = useState<Project[]>([initialProject]);
  const [currentProjectId, setCurrentProjectId] = useState<string>(initialProject.id);
  const [currentKanbanId, setCurrentKanbanId] = useState<string>(initialProject.kanbans[0].id);
  const [currentTimelineId, setCurrentTimelineId] = useState<string>(initialProject.kanbans[0].timelines[0].id);
  const [activeView, setActiveView] = useState<'projects' | 'kanbans' | 'assets' | 'editor' | 'view' | 'multi'>('editor');
  const [currentFilePath, setCurrentFilePath] = useState<string>('');

  const currentProject = projects.find(project => project.id === currentProjectId) || null;
  const currentKanban = currentProject?.kanbans.find(kanban => kanban.id === currentKanbanId) || null;
  const timeline = currentKanban?.timelines.find(item => item.id === currentTimelineId)
    || currentKanban?.timelines[0]
    || TimelineStorage.createEmptyTimeline();

  const updateCurrentProject = (updater: (project: Project) => Project) => {
    setProjects(prevProjects => prevProjects.map(project => (
      project.id === currentProjectId ? updater(project) : project
    )));
  };

  const updateCurrentKanban = (updater: (kanban: Kanban) => Kanban) => {
    updateCurrentProject(project => ({
      ...project,
      kanbans: project.kanbans.map(kanban => (
        kanban.id === currentKanbanId ? updater(kanban) : kanban
      )),
      updatedAt: Date.now()
    }));
  };

  const updateTimeline = (timelineId: string, updater: (timeline: Timeline) => Timeline) => {
    updateCurrentKanban(kanban => ({
      ...kanban,
      timelines: kanban.timelines.map(item => (
        item.id === timelineId ? updater(item) : item
      )),
      updatedAt: Date.now()
    }));
  };

  useEffect(() => {
    if (!window.require) return;

    const { ipcRenderer } = window.require('electron');
    
    ipcRenderer.on('new-timeline', () => {
      handleNewTimeline();
    });

    ipcRenderer.on('open-timeline', (_event: unknown, data: unknown) => {
      const loaded = TimelineStorage.loadTimeline(data);
      const kanban = TimelineStorage.createEmptyKanban('Imported Kanban');
      kanban.timelines = [loaded];
      const project = TimelineStorage.createEmptyProject(loaded.name);
      project.kanbans = [kanban];
      setProjects([project]);
      setCurrentProjectId(project.id);
      setCurrentKanbanId(kanban.id);
      setCurrentTimelineId(loaded.id);
      setActiveView('view');
      Message.success('Timeline loaded successfully');
    });

    ipcRenderer.on('save-timeline', (_event: unknown, filePath: string) => {
      handleSaveTimeline(filePath);
    });

    return () => {
      ipcRenderer.removeAllListeners();
    };
  }, [projects, currentProjectId, currentKanbanId, currentTimelineId]);

  const handleNewTimeline = () => {
    const newTimeline = TimelineStorage.createEmptyTimeline(`Timeline ${(currentKanban?.timelines.length || 0) + 1}`);
    updateCurrentKanban(kanban => ({
      ...kanban,
      timelines: [...kanban.timelines, newTimeline],
      updatedAt: Date.now()
    }));
    setCurrentTimelineId(newTimeline.id);
    setActiveView('editor');
  };

  const handleSaveTimeline = async (filePath?: string) => {
    const pathToSave = filePath || currentFilePath;
    if (!pathToSave) {
      Message.error('Please use File > Save As to save a new timeline');
      return;
    }

    const result = currentProject
      ? await TimelineStorage.saveProject(pathToSave, currentProject)
      : await TimelineStorage.saveTimeline(pathToSave, timeline);
    if (result.success) {
      setCurrentFilePath(pathToSave);
      Message.success('Timeline saved successfully');
    } else {
      Message.error(`Failed to save timeline: ${result.error}`);
    }
  };

  const handleAddEvent = (event: Omit<TimelineEvent, 'id'>) => {
    const newEvent: TimelineEvent = {
      ...event,
      id: TimelineStorage.generateEventId()
    };
    
    updateTimeline(timeline.id, item => ({
      ...item,
      events: [...item.events, newEvent],
      updatedAt: Date.now()
    }));
  };

  const handleUpdateEvent = (eventId: string, updates: Partial<TimelineEvent>) => {
    updateTimeline(timeline.id, item => ({
      ...item,
      events: item.events.map(event => event.id === eventId ? { ...event, ...updates } : event),
      updatedAt: Date.now()
    }));
  };

  const handleDeleteEvent = (eventId: string) => {
    updateTimeline(timeline.id, item => ({
      ...item,
      events: item.events.filter(event => event.id !== eventId),
      updatedAt: Date.now()
    }));
  };

  const handleCreateProject = (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    const project = TimelineStorage.loadProject({ ...projectData, id: TimelineStorage.generateProjectId() });
    if (project.kanbans.length === 0) {
      const kanban = TimelineStorage.createEmptyKanban('Main Kanban');
      kanban.timelines = [TimelineStorage.createEmptyTimeline('Main Timeline')];
      project.kanbans = [kanban];
    }
    setProjects(prevProjects => [...prevProjects, project]);
    setCurrentProjectId(project.id);
    setCurrentKanbanId(project.kanbans[0].id);
    setCurrentTimelineId(project.kanbans[0].timelines[0]?.id || '');
  };

  const handleCreateKanban = (kanbanData: Omit<Kanban, 'id' | 'createdAt' | 'updatedAt'>) => {
    const kanban = TimelineStorage.loadKanban({ ...kanbanData, id: TimelineStorage.generateKanbanId() });
    kanban.timelines = kanban.timelines.length ? kanban.timelines : [TimelineStorage.createEmptyTimeline('Main Timeline')];
    updateCurrentProject(project => ({ ...project, kanbans: [...project.kanbans, kanban], updatedAt: Date.now() }));
    setCurrentKanbanId(kanban.id);
    setCurrentTimelineId(kanban.timelines[0].id);
  };

  const handleCreateDataAsset = (assetData: Omit<DataAsset, 'id' | 'createdAt' | 'updatedAt'>) => {
    const asset = TimelineStorage.loadDataAsset({ ...assetData, id: TimelineStorage.generateDataAssetId() });
    updateCurrentProject(project => ({ ...project, dataAssets: [...project.dataAssets, asset], updatedAt: Date.now() }));
  };

  const handleUpdateNestedEvent = (timelineId: string, eventId: string, updates: Partial<TimelineEvent>) => {
    updateTimeline(timelineId, item => ({
      ...item,
      events: item.events.map(event => event.id === eventId ? { ...event, ...updates } : event),
      updatedAt: Date.now()
    }));
  };

  const handleDeleteNestedEvent = (timelineId: string, eventId: string) => {
    updateTimeline(timelineId, item => ({
      ...item,
      events: item.events.filter(event => event.id !== eventId),
      updatedAt: Date.now()
    }));
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects(prevProjects => {
      const remaining = prevProjects.filter(project => project.id !== projectId);
      if (remaining.length === 0) {
        const fallbackTimeline = TimelineStorage.createEmptyTimeline('Main Timeline');
        const fallbackKanban = TimelineStorage.createEmptyKanban('Main Kanban');
        fallbackKanban.timelines = [fallbackTimeline];
        const fallbackProject = TimelineStorage.createEmptyProject('New Project');
        fallbackProject.kanbans = [fallbackKanban];
        setCurrentProjectId(fallbackProject.id);
        setCurrentKanbanId(fallbackKanban.id);
        setCurrentTimelineId(fallbackTimeline.id);
        return [fallbackProject];
      }

      if (projectId === currentProjectId) {
        const nextProject = remaining[0];
        const nextKanban = nextProject.kanbans[0];
        setCurrentProjectId(nextProject.id);
        setCurrentKanbanId(nextKanban?.id || '');
        setCurrentTimelineId(nextKanban?.timelines[0]?.id || '');
      }

      return remaining;
    });
  };

  return (
    <Container style={{ height: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ color: 'white', margin: 0 }}>Timeline Editor</h1>
        <div>
          <Button 
            type="primary" 
            onClick={handleNewTimeline}
          >
            New Timeline
          </Button>
          <Button 
            type="text" 
            style={{ color: 'white' }}
            onClick={() => setActiveView('projects')}
          >
            Projects
          </Button>
          <Button 
            type="text" 
            style={{ color: 'white' }}
            onClick={() => setActiveView('kanbans')}
          >
            Kanbans
          </Button>
          <Button 
            type="text" 
            style={{ color: 'white' }}
            onClick={() => setActiveView('assets')}
          >
            Data
          </Button>
          <Button 
            type="text" 
            style={{ color: 'white' }}
            onClick={() => setActiveView('editor')}
          >
            Editor
          </Button>
          <Button 
            type="text" 
            style={{ color: 'white' }}
            onClick={() => setActiveView('view')}
          >
            View
          </Button>
          <Button 
            type="text" 
            style={{ color: 'white' }}
            onClick={() => setActiveView('multi')}
          >
            Multi
          </Button>
        </div>
      </Header>
      
      <Main style={{ padding: '24px' }}>
        {activeView === 'projects' && (
          <ProjectManager
            projects={projects}
            currentProject={currentProject}
            onCreateProject={handleCreateProject}
            onSelectProject={(project) => {
              const kanban = project.kanbans[0];
              setCurrentProjectId(project.id);
              setCurrentKanbanId(kanban?.id || '');
              setCurrentTimelineId(kanban?.timelines[0]?.id || '');
            }}
            onUpdateProject={(projectId, updates) => setProjects(prevProjects => prevProjects.map(project => (
              project.id === projectId ? { ...project, ...updates, updatedAt: Date.now() } : project
            )))}
            onDeleteProject={handleDeleteProject}
          />
        )}

        {activeView === 'kanbans' && currentProject && (
          <KanbanManager
            kanbans={currentProject.kanbans}
            currentKanban={currentKanban}
            timelines={currentKanban?.timelines || []}
            onCreateKanban={handleCreateKanban}
            onSelectKanban={(kanban) => {
              setCurrentKanbanId(kanban.id);
              setCurrentTimelineId(kanban.timelines[0]?.id || '');
            }}
            onUpdateKanban={(kanbanId, updates) => updateCurrentProject(project => ({
              ...project,
              kanbans: project.kanbans.map(kanban => kanban.id === kanbanId ? { ...kanban, ...updates, updatedAt: Date.now() } : kanban),
              updatedAt: Date.now()
            }))}
            onDeleteKanban={(kanbanId) => updateCurrentProject(project => ({
              ...project,
              kanbans: project.kanbans.filter(kanban => kanban.id !== kanbanId),
              updatedAt: Date.now()
            }))}
          />
        )}

        {activeView === 'assets' && currentProject && (
          <DataAssetManager
            dataAssets={currentProject.dataAssets}
            onCreateDataAsset={handleCreateDataAsset}
            onUpdateDataAsset={(assetId, updates) => updateCurrentProject(project => ({
              ...project,
              dataAssets: project.dataAssets.map(asset => asset.id === assetId ? { ...asset, ...updates, updatedAt: Date.now() } : asset),
              updatedAt: Date.now()
            }))}
            onDeleteDataAsset={(assetId) => updateCurrentProject(project => ({
              ...project,
              dataAssets: project.dataAssets.filter(asset => asset.id !== assetId),
              updatedAt: Date.now()
            }))}
          />
        )}

        {activeView === 'editor' && (
          <TimelineEditor
            timeline={timeline}
            onAddEvent={handleAddEvent}
            onUpdateEvent={handleUpdateEvent}
            onDeleteEvent={handleDeleteEvent}
            onTimelineUpdate={(updates) => updateTimeline(timeline.id, item => ({ ...item, ...updates, updatedAt: Date.now() }))}
          />
        )}

        {activeView === 'view' && (
          <TimelineView
            timeline={timeline}
            onEditEvent={handleUpdateEvent}
            onDeleteEvent={handleDeleteEvent}
          />
        )}

        {activeView === 'multi' && currentProject && currentKanban && (
          <MultiTimelineView
            kanban={currentKanban}
            timelines={currentKanban.timelines}
            dataAssets={currentProject.dataAssets}
            layout={currentKanban.layout}
            onUpdateTimeline={(timelineId, updates) => updateTimeline(timelineId, item => ({ ...item, ...updates, updatedAt: Date.now() }))}
            onDeleteTimeline={(timelineId) => updateCurrentKanban(kanban => ({
              ...kanban,
              timelines: kanban.timelines.filter(item => item.id !== timelineId),
              updatedAt: Date.now()
            }))}
            onUpdateEvent={handleUpdateNestedEvent}
            onDeleteEvent={handleDeleteNestedEvent}
          />
        )}
      </Main>
    </Container>
  );
};

export default App;
