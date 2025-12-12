import { useState, useEffect, useCallback } from 'react';
import { AppData, Project, LogEntry } from '../types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'devlog-manager-data';

// Default data for initial state
const getDefaultData = (): AppData => ({
  projects: [],
  logs: [],
});

// Load data from localStorage
const loadData = (): AppData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load data:', error);
  }
  return getDefaultData();
};

// Save data to localStorage
const saveData = (data: AppData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save data:', error);
  }
};

export function useStorage() {
  const [data, setData] = useState<AppData>(getDefaultData);
  const [isLoading, setIsLoading] = useState(true);

  // Load data on mount
  useEffect(() => {
    const loaded = loadData();
    setData(loaded);
    setIsLoading(false);
  }, []);

  // Save data whenever it changes
  useEffect(() => {
    if (!isLoading) {
      saveData(data);
    }
  }, [data, isLoading]);

  // Project operations
  const createProject = useCallback((project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Project => {
    const now = new Date().toISOString();
    const newProject: Project = {
      ...project,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    setData(prev => ({
      ...prev,
      projects: [...prev.projects, newProject],
    }));
    return newProject;
  }, []);

  const updateProject = useCallback((id: string, updates: Partial<Omit<Project, 'id' | 'createdAt'>>): void => {
    setData(prev => ({
      ...prev,
      projects: prev.projects.map(p =>
        p.id === id
          ? { ...p, ...updates, updatedAt: new Date().toISOString() }
          : p
      ),
    }));
  }, []);

  const deleteProject = useCallback((id: string): void => {
    setData(prev => ({
      ...prev,
      projects: prev.projects.filter(p => p.id !== id),
      logs: prev.logs.filter(l => l.projectId !== id),
    }));
  }, []);

  const getProject = useCallback((id: string): Project | undefined => {
    return data.projects.find(p => p.id === id);
  }, [data.projects]);

  // Log operations
  const createLog = useCallback((log: Omit<LogEntry, 'id' | 'createdAt' | 'updatedAt'>): LogEntry => {
    const now = new Date().toISOString();
    const newLog: LogEntry = {
      ...log,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    setData(prev => ({
      ...prev,
      logs: [...prev.logs, newLog],
    }));
    // Update project's updatedAt
    updateProject(log.projectId, {});
    return newLog;
  }, [updateProject]);

  const updateLog = useCallback((id: string, updates: Partial<Omit<LogEntry, 'id' | 'createdAt'>>): void => {
    setData(prev => {
      const log = prev.logs.find(l => l.id === id);
      if (log) {
        // Also update project's updatedAt
        const projectId = updates.projectId || log.projectId;
        return {
          ...prev,
          logs: prev.logs.map(l =>
            l.id === id
              ? { ...l, ...updates, updatedAt: new Date().toISOString() }
              : l
          ),
          projects: prev.projects.map(p =>
            p.id === projectId
              ? { ...p, updatedAt: new Date().toISOString() }
              : p
          ),
        };
      }
      return prev;
    });
  }, []);

  const deleteLog = useCallback((id: string): void => {
    setData(prev => ({
      ...prev,
      logs: prev.logs.filter(l => l.id !== id),
    }));
  }, []);

  const getLog = useCallback((id: string): LogEntry | undefined => {
    return data.logs.find(l => l.id === id);
  }, [data.logs]);

  const getProjectLogs = useCallback((projectId: string): LogEntry[] => {
    return data.logs
      .filter(l => l.projectId === projectId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [data.logs]);

  const getRecentLogs = useCallback((limit: number = 10): LogEntry[] => {
    return [...data.logs]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit);
  }, [data.logs]);

  const getLogCountByProject = useCallback((projectId: string): number => {
    return data.logs.filter(l => l.projectId === projectId).length;
  }, [data.logs]);

  return {
    projects: data.projects,
    logs: data.logs,
    isLoading,
    // Project operations
    createProject,
    updateProject,
    deleteProject,
    getProject,
    // Log operations
    createLog,
    updateLog,
    deleteLog,
    getLog,
    getProjectLogs,
    getRecentLogs,
    getLogCountByProject,
  };
}

