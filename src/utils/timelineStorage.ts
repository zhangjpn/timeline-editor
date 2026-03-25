import { Timeline, Project, Kanban, DataAsset, TimelineEvent, DataPoint } from '../types/timeline';

declare global {
  interface Window {
    require: any;
  }
}

const { ipcRenderer } = window.require('electron');

export class TimelineStorage {
  // Project management
  static async saveProject(filePath: string, project: Project): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await ipcRenderer.invoke('save-file', filePath, project);
      return result;
    } catch (error: any) {
      return { success: false, error: error?.message || 'Unknown error' };
    }
  }

  static loadProject(data: any): Project {
    return {
      id: data.id || this.generateId(),
      name: data.name || 'Untitled Project',
      description: data.description || '',
      kanbans: (data.kanbans || []).map((kanban: any) => this.loadKanban(kanban)),
      dataAssets: (data.dataAssets || []).map((asset: any) => this.loadDataAsset(asset)),
      createdAt: data.createdAt || Date.now(),
      updatedAt: data.updatedAt || Date.now(),
      settings: data.settings || {
        defaultTimelineColor: '#409eff',
        defaultChartType: 'line',
        autoSave: true,
        theme: 'light'
      }
    };
  }

  static createEmptyProject(name: string = 'New Project'): Project {
    const now = Date.now();
    return {
      id: this.generateId(),
      name,
      description: '',
      kanbans: [],
      dataAssets: [],
      createdAt: now,
      updatedAt: now,
      settings: {
        defaultTimelineColor: '#409eff',
        defaultChartType: 'line',
        autoSave: true,
        theme: 'light'
      }
    };
  }

  // Kanban management
  static loadKanban(data: any): Kanban {
    return {
      id: data.id || this.generateId(),
      name: data.name || 'Untitled Kanban',
      description: data.description || '',
      timelines: (data.timelines || []).map((timeline: any) => this.loadTimeline(timeline)),
      createdAt: data.createdAt || Date.now(),
      updatedAt: data.updatedAt || Date.now(),
      layout: data.layout || {
        type: 'horizontal',
        timelineHeight: 100,
        spacing: 20
      }
    };
  }

  static createEmptyKanban(name: string = 'New Kanban'): Kanban {
    const now = Date.now();
    return {
      id: this.generateId(),
      name,
      description: '',
      timelines: [],
      createdAt: now,
      updatedAt: now,
      layout: {
        type: 'horizontal',
        timelineHeight: 100,
        spacing: 20
      }
    };
  }

  // Timeline management
  static loadTimeline(data: any): Timeline {
    // Handle legacy format conversion
    if (data.events && data.events.length > 0) {
      const hasOldFormat = data.events.some((event: any) => event.timestamp && !event.startTime);
      
      if (hasOldFormat) {
        const convertedEvents = data.events.map((event: any) => ({
          ...event,
          startTime: event.timestamp,
          timestamp: undefined
        }));
        data.events = convertedEvents;
      }
    }

    return {
      id: data.id || this.generateId(),
      name: data.name || 'Untitled Timeline',
      description: data.description || '',
      events: (data.events || []).map((event: any) => this.loadTimelineEvent(event)),
      createdAt: data.createdAt || Date.now(),
      updatedAt: data.updatedAt || Date.now(),
      color: data.color || '#409eff',
      isVisible: data.isVisible !== false
    };
  }

  static createEmptyTimeline(name: string = 'New Timeline'): Timeline {
    const now = Date.now();
    return {
      id: this.generateId(),
      name,
      description: '',
      events: [],
      createdAt: now,
      updatedAt: now,
      color: '#409eff',
      isVisible: true
    };
  }

  // Event management
  static loadTimelineEvent(data: any): TimelineEvent {
    return {
      id: data.id || this.generateEventId(),
      title: data.title || 'Untitled Event',
      description: data.description,
      startTime: data.startTime || data.timestamp || Date.now(), // Backward compatibility
      endTime: data.endTime,
      color: data.color || '#409eff',
      icon: data.icon,
      imageData: data.imageData,
      dataAssetId: data.dataAssetId
    };
  }

  // Data Asset management
  static loadDataAsset(data: any): DataAsset {
    return {
      id: data.id || this.generateId(),
      name: data.name || 'Untitled Data Asset',
      description: data.description,
      type: data.type || 'chart',
      data: (data.data || []).map((point: any) => this.loadDataPoint(point)),
      chartConfig: data.chartConfig || {
        chartType: 'line',
        color: '#409eff',
        smoothing: false,
        showGrid: true,
        showLegend: true,
        yAxisLabel: '',
        xAxisLabel: ''
      },
      createdAt: data.createdAt || Date.now(),
      updatedAt: data.updatedAt || Date.now()
    };
  }

  static createEmptyDataAsset(name: string = 'New Data Asset'): DataAsset {
    const now = Date.now();
    return {
      id: this.generateId(),
      name,
      description: '',
      type: 'chart',
      data: [],
      chartConfig: {
        chartType: 'line',
        color: '#409eff',
        smoothing: false,
        showGrid: true,
        showLegend: true,
        yAxisLabel: '',
        xAxisLabel: ''
      },
      createdAt: now,
      updatedAt: now
    };
  }

  static loadDataPoint(data: any): DataPoint {
    return {
      timestamp: data.timestamp || Date.now(),
      value: data.value || 0,
      label: data.label,
      metadata: data.metadata
    };
  }

  // Utility methods
  static generateId(): string {
    return `timeline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static generateProjectId(): string {
    return `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static generateKanbanId(): string {
    return `kanban_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static generateDataAssetId(): string {
    return `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Data validation
  static validateProject(project: Project): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!project.name || project.name.trim() === '') {
      errors.push('Project name is required');
    }

    if (!Array.isArray(project.kanbans)) {
      errors.push('Project kanbans must be an array');
    } else {
      project.kanbans.forEach((kanban, index) => {
        const kanbanValidation = this.validateKanban(kanban);
        if (!kanbanValidation.isValid) {
          errors.push(`Kanban ${index + 1}: ${kanbanValidation.errors.join(', ')}`);
        }
      });
    }

    if (!Array.isArray(project.dataAssets)) {
      errors.push('Project data assets must be an array');
    } else {
      project.dataAssets.forEach((asset, index) => {
        const assetValidation = this.validateDataAsset(asset);
        if (!assetValidation.isValid) {
          errors.push(`Data Asset ${index + 1}: ${assetValidation.errors.join(', ')}`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateKanban(kanban: Kanban): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!kanban.name || kanban.name.trim() === '') {
      errors.push('Kanban name is required');
    }

    if (!Array.isArray(kanban.timelines)) {
      errors.push('Kanban timelines must be an array');
    } else {
      kanban.timelines.forEach((timeline, index) => {
        const timelineValidation = this.validateTimeline(timeline);
        if (!timelineValidation.isValid) {
          errors.push(`Timeline ${index + 1}: ${timelineValidation.errors.join(', ')}`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateTimeline(timeline: Timeline): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!timeline.name || timeline.name.trim() === '') {
      errors.push('Timeline name is required');
    }

    if (!Array.isArray(timeline.events)) {
      errors.push('Timeline events must be an array');
    } else {
      timeline.events.forEach((event, index) => {
        const eventValidation = this.validateTimelineEvent(event);
        if (!eventValidation.isValid) {
          errors.push(`Event ${index + 1}: ${eventValidation.errors.join(', ')}`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateTimelineEvent(event: TimelineEvent): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!event.title || event.title.trim() === '') {
      errors.push('Event title is required');
    }

    if (!event.startTime || typeof event.startTime !== 'number') {
      errors.push('Event start time is required and must be a number');
    }

    if (event.endTime && typeof event.endTime !== 'number') {
      errors.push('Event end time must be a number');
    }

    if (event.endTime && event.startTime && event.endTime < event.startTime) {
      errors.push('Event end time must be after start time');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateDataAsset(asset: DataAsset): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!asset.name || asset.name.trim() === '') {
      errors.push('Data asset name is required');
    }

    if (!Array.isArray(asset.data)) {
      errors.push('Data asset data must be an array');
    } else {
      asset.data.forEach((point, index) => {
        if (!point.timestamp || typeof point.timestamp !== 'number') {
          errors.push(`Data point ${index + 1}: timestamp is required and must be a number`);
        }
        if (typeof point.value !== 'number') {
          errors.push(`Data point ${index + 1}: value must be a number`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
