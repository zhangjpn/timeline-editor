export interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  startTime: number;
  endTime?: number; // 支持时间段，如果为空则表示时间点
  color?: string;
  icon?: string;
  imageData?: string;
  dataAssetId?: string; // 关联的数据资产ID
}

export interface Timeline {
  id: string;
  name: string;
  description?: string;
  events: TimelineEvent[];
  createdAt: number;
  updatedAt: number;
  color?: string; // 时间线颜色
  isVisible: boolean; // 是否显示
}

export interface DataAsset {
  id: string;
  name: string;
  description?: string;
  type: 'chart' | 'economic' | 'stock' | 'custom'; // 数据类型
  data: DataPoint[];
  chartConfig: ChartConfig;
  createdAt: number;
  updatedAt: number;
}

export interface DataPoint {
  timestamp: number;
  value: number;
  label?: string;
  metadata?: Record<string, any>;
}

export interface ChartConfig {
  chartType: 'line' | 'bar' | 'area' | 'candlestick';
  color: string;
  smoothing?: boolean;
  showGrid?: boolean;
  showLegend?: boolean;
  yAxisLabel?: string;
  xAxisLabel?: string;
}

export interface Kanban {
  id: string;
  name: string;
  description?: string;
  timelines: Timeline[];
  createdAt: number;
  updatedAt: number;
  layout: KanbanLayout;
}

export interface KanbanLayout {
  type: 'horizontal' | 'vertical' | 'grid';
  timelineHeight?: number;
  spacing?: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  kanbans: Kanban[];
  dataAssets: DataAsset[];
  createdAt: number;
  updatedAt: number;
  settings: ProjectSettings;
}

export interface ProjectSettings {
  defaultTimelineColor: string;
  defaultChartType: ChartConfig['chartType'];
  autoSave: boolean;
  theme: 'light' | 'dark';
}

export interface TimelineViewOptions {
  zoom: number;
  startTime: number;
  endTime: number;
  showGrid: boolean;
  showImages: boolean;
  showDataAssets: boolean;
  selectedTimelineIds: string[];
}

export interface AppState {
  currentProject: Project | null;
  currentKanban: Kanban | null;
  selectedTimelineIds: string[];
  viewOptions: TimelineViewOptions;
}
