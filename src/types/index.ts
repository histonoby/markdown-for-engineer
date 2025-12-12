export type ProjectStatus = 'active' | 'paused' | 'completed';

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface LogEntry {
  id: string;
  projectId: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AppData {
  projects: Project[];
  logs: LogEntry[];
}

export type View = 'dashboard' | 'project' | 'editor';

export interface AppState {
  currentView: View;
  selectedProjectId: string | null;
  selectedLogId: string | null;
}

// Color presets for projects
export const PROJECT_COLORS = [
  '#00ff9f', // Cyber Green
  '#00d4ff', // Cyber Cyan
  '#b967ff', // Cyber Purple
  '#ff6b6b', // Coral Red
  '#ffd93d', // Golden Yellow
  '#6bcb77', // Fresh Green
  '#4d96ff', // Sky Blue
  '#ff8fab', // Rose Pink
];

// Status display config
export const STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string; bgColor: string }> = {
  active: { label: '進行中', color: '#00ff9f', bgColor: 'rgba(0, 255, 159, 0.15)' },
  paused: { label: '保留', color: '#ffd93d', bgColor: 'rgba(255, 217, 61, 0.15)' },
  completed: { label: '完了', color: '#00d4ff', bgColor: 'rgba(0, 212, 255, 0.15)' },
};

