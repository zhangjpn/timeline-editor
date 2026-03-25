import React, { useState, useEffect } from 'react';
import { Timeline, TimelineEvent } from './types/timeline';
import { TimelineStorage } from './utils/timelineStorage';
import TimelineEditor from './components/TimelineEditor';
import TimelineView from './components/TimelineView';
import { Layout, Menu, Button, message } from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';

const { Header, Content, Sider } = Layout;

const App: React.FC = () => {
  const [timeline, setTimeline] = useState<Timeline>(TimelineStorage.createEmptyTimeline());
  const [activeView, setActiveView] = useState<'editor' | 'view'>('editor');
  const [currentFilePath, setCurrentFilePath] = useState<string>('');

  useEffect(() => {
    // Listen for Electron menu events
    const { ipcRenderer } = window.require('electron');
    
    ipcRenderer.on('new-timeline', () => {
      handleNewTimeline();
    });

    ipcRenderer.on('open-timeline', (event, data) => {
      const loadedTimeline = TimelineStorage.loadTimeline(data);
      setTimeline(loadedTimeline);
      setActiveView('view');
      message.success('Timeline loaded successfully');
    });

    ipcRenderer.on('save-timeline', (event, filePath) => {
      handleSaveTimeline(filePath);
    });

    return () => {
      ipcRenderer.removeAllListeners();
    };
  }, [timeline]);

  const handleNewTimeline = () => {
    setTimeline(TimelineStorage.createEmptyTimeline());
    setCurrentFilePath('');
    setActiveView('editor');
  };

  const handleSaveTimeline = async (filePath?: string) => {
    const pathToSave = filePath || currentFilePath;
    if (!pathToSave) {
      message.error('Please use File > Save As to save a new timeline');
      return;
    }

    const result = await TimelineStorage.saveTimeline(pathToSave, timeline);
    if (result.success) {
      setCurrentFilePath(pathToSave);
      message.success('Timeline saved successfully');
    } else {
      message.error(`Failed to save timeline: ${result.error}`);
    }
  };

  const handleAddEvent = (event: Omit<TimelineEvent, 'id'>) => {
    const newEvent: TimelineEvent = {
      ...event,
      id: TimelineStorage.generateEventId()
    };
    
    const updatedTimeline = {
      ...timeline,
      events: [...timeline.events, newEvent],
      updatedAt: Date.now()
    };
    
    setTimeline(updatedTimeline);
  };

  const handleUpdateEvent = (eventId: string, updates: Partial<TimelineEvent>) => {
    const updatedEvents = timeline.events.map(event =>
      event.id === eventId ? { ...event, ...updates } : event
    );
    
    const updatedTimeline = {
      ...timeline,
      events: updatedEvents,
      updatedAt: Date.now()
    };
    
    setTimeline(updatedTimeline);
  };

  const handleDeleteEvent = (eventId: string) => {
    const updatedEvents = timeline.events.filter(event => event.id !== eventId);
    
    const updatedTimeline = {
      ...timeline,
      events: updatedEvents,
      updatedAt: Date.now()
    };
    
    setTimeline(updatedTimeline);
  };

  return (
    <Layout style={{ height: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ color: 'white', margin: 0 }}>Timeline Editor</h1>
        <div>
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
        </div>
      </Header>
      
      <Content style={{ padding: '24px' }}>
        {activeView === 'editor' ? (
          <TimelineEditor
            timeline={timeline}
            onAddEvent={handleAddEvent}
            onUpdateEvent={handleUpdateEvent}
            onDeleteEvent={handleDeleteEvent}
            onTimelineUpdate={(updates) => setTimeline({ ...timeline, ...updates, updatedAt: Date.now() })}
          />
        ) : (
          <TimelineView
            timeline={timeline}
            onEditEvent={handleUpdateEvent}
            onDeleteEvent={handleDeleteEvent}
          />
        )}
      </Content>
    </Layout>
  );
};

export default App;
