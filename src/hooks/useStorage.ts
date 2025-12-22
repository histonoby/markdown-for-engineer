import { useState, useEffect, useCallback } from 'react';
import { AppData, Project, LogEntry, ProjectStatus } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { User } from '@supabase/supabase-js';
import { ProjectRow, LogRow } from '../types/database';

const STORAGE_KEY = 'devlog-manager-data';

// Default data for initial state
const getDefaultData = (): AppData => ({
  projects: [],
  logs: [],
});

// Load data from localStorage
const loadLocalData = (): AppData => {
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
const saveLocalData = (data: AppData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save data:', error);
  }
};

interface UseStorageOptions {
  user: User | null;
  useCloud: boolean;
}

export function useStorage({ user, useCloud }: UseStorageOptions) {
  const [data, setData] = useState<AppData>(getDefaultData);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const isCloudMode = useCloud && isSupabaseConfigured() && user && supabase;

  // Supabaseからデータを読み込む
  const loadCloudData = useCallback(async () => {
    if (!user || !supabase) return getDefaultData();

    try {
      const [projectsRes, logsRes] = await Promise.all([
        supabase.from('projects').select('*').eq('user_id', user.id),
        supabase.from('logs').select('*').eq('user_id', user.id),
      ]);

      if (projectsRes.error) throw projectsRes.error;
      if (logsRes.error) throw logsRes.error;

      const projectsData = (projectsRes.data || []) as ProjectRow[];
      const logsData = (logsRes.data || []) as LogRow[];

      const projects: Project[] = projectsData.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description || '',
        status: p.status as ProjectStatus,
        color: p.color,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      }));

      const logs: LogEntry[] = logsData.map((l) => ({
        id: l.id,
        projectId: l.project_id,
        title: l.title,
        content: l.content || '',
        tags: l.tags || [],
        createdAt: l.created_at,
        updatedAt: l.updated_at,
      }));

      return { projects, logs };
    } catch (error) {
      console.error('Failed to load cloud data:', error);
      setSyncError('クラウドデータの読み込みに失敗しました');
      return getDefaultData();
    }
  }, [user]);

  // データを読み込む
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setSyncError(null);

      if (isCloudMode) {
        const cloudData = await loadCloudData();
        setData(cloudData);
      } else {
        const localData = loadLocalData();
        setData(localData);
      }

      setIsLoading(false);
    };

    loadData();
  }, [isCloudMode, loadCloudData]);

  // ローカルモードの場合、データ変更時に保存
  useEffect(() => {
    if (!isLoading && !isCloudMode) {
      saveLocalData(data);
    }
  }, [data, isLoading, isCloudMode]);

  // Project operations
  const createProject = useCallback(async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> => {
    const now = new Date().toISOString();
    const newProject: Project = {
      ...project,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };

    if (isCloudMode && user) {
      setIsSyncing(true);
      try {
        const { error } = await supabase.from('projects').insert({
          id: newProject.id,
          user_id: user.id,
          name: newProject.name,
          description: newProject.description,
          status: newProject.status,
          color: newProject.color,
          created_at: newProject.createdAt,
          updated_at: newProject.updatedAt,
        } as ProjectRow);

        if (error) throw error;
      } catch (error) {
        console.error('Failed to create project:', error);
        setSyncError('プロジェクトの作成に失敗しました');
      } finally {
        setIsSyncing(false);
      }
    }

    setData(prev => ({
      ...prev,
      projects: [...prev.projects, newProject],
    }));

    return newProject;
  }, [isCloudMode, user]);

  const updateProject = useCallback(async (id: string, updates: Partial<Omit<Project, 'id' | 'createdAt'>>): Promise<void> => {
    const now = new Date().toISOString();

    if (isCloudMode && user) {
      setIsSyncing(true);
      try {
        const updateData: Partial<ProjectRow> = { updated_at: now };
        
        if (updates.name !== undefined) updateData.name = updates.name;
        if (updates.description !== undefined) updateData.description = updates.description;
        if (updates.status !== undefined) updateData.status = updates.status;
        if (updates.color !== undefined) updateData.color = updates.color;

        const { error } = await supabase
          .from('projects')
          .update(updateData)
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;
      } catch (error) {
        console.error('Failed to update project:', error);
        setSyncError('プロジェクトの更新に失敗しました');
      } finally {
        setIsSyncing(false);
      }
    }

    setData(prev => ({
      ...prev,
      projects: prev.projects.map(p =>
        p.id === id
          ? { ...p, ...updates, updatedAt: now }
          : p
      ),
    }));
  }, [isCloudMode, user]);

  const deleteProject = useCallback(async (id: string): Promise<void> => {
    if (isCloudMode && user) {
      setIsSyncing(true);
      try {
        const { error } = await supabase
          .from('projects')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;
      } catch (error) {
        console.error('Failed to delete project:', error);
        setSyncError('プロジェクトの削除に失敗しました');
      } finally {
        setIsSyncing(false);
      }
    }

    setData(prev => ({
      ...prev,
      projects: prev.projects.filter(p => p.id !== id),
      logs: prev.logs.filter(l => l.projectId !== id),
    }));
  }, [isCloudMode, user]);

  const getProject = useCallback((id: string): Project | undefined => {
    return data.projects.find(p => p.id === id);
  }, [data.projects]);

  // Log operations
  const createLog = useCallback(async (log: Omit<LogEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<LogEntry> => {
    const now = new Date().toISOString();
    const newLog: LogEntry = {
      ...log,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };

    if (isCloudMode && user) {
      setIsSyncing(true);
      try {
        const { error } = await supabase.from('logs').insert({
          id: newLog.id,
          user_id: user.id,
          project_id: newLog.projectId,
          title: newLog.title,
          content: newLog.content,
          tags: newLog.tags,
          created_at: newLog.createdAt,
          updated_at: newLog.updatedAt,
        } as LogRow);

        if (error) throw error;

        // Update project's updated_at
        await supabase
          .from('projects')
          .update({ updated_at: now } as Partial<ProjectRow>)
          .eq('id', log.projectId)
          .eq('user_id', user.id);
      } catch (error) {
        console.error('Failed to create log:', error);
        setSyncError('ログの作成に失敗しました');
      } finally {
        setIsSyncing(false);
      }
    }

    setData(prev => ({
      ...prev,
      logs: [...prev.logs, newLog],
      projects: prev.projects.map(p =>
        p.id === log.projectId
          ? { ...p, updatedAt: now }
          : p
      ),
    }));

    return newLog;
  }, [isCloudMode, user]);

  const updateLog = useCallback(async (id: string, updates: Partial<Omit<LogEntry, 'id' | 'createdAt'>>): Promise<void> => {
    const now = new Date().toISOString();
    const log = data.logs.find(l => l.id === id);

    if (isCloudMode && user && log) {
      setIsSyncing(true);
      try {
        const updateData: Partial<LogRow> = { updated_at: now };
        
        if (updates.title !== undefined) updateData.title = updates.title;
        if (updates.content !== undefined) updateData.content = updates.content;
        if (updates.tags !== undefined) updateData.tags = updates.tags;
        if (updates.projectId !== undefined) updateData.project_id = updates.projectId;

        const { error } = await supabase
          .from('logs')
          .update(updateData)
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;

        // Update project's updated_at
        const projectId = updates.projectId || log.projectId;
        await supabase
          .from('projects')
          .update({ updated_at: now } as Partial<ProjectRow>)
          .eq('id', projectId)
          .eq('user_id', user.id);
      } catch (error) {
        console.error('Failed to update log:', error);
        setSyncError('ログの更新に失敗しました');
      } finally {
        setIsSyncing(false);
      }
    }

    setData(prev => {
      const existingLog = prev.logs.find(l => l.id === id);
      if (!existingLog) return prev;

      const projectId = updates.projectId || existingLog.projectId;
      return {
        ...prev,
        logs: prev.logs.map(l =>
          l.id === id
            ? { ...l, ...updates, updatedAt: now }
            : l
        ),
        projects: prev.projects.map(p =>
          p.id === projectId
            ? { ...p, updatedAt: now }
            : p
        ),
      };
    });
  }, [isCloudMode, user, data.logs]);

  const deleteLog = useCallback(async (id: string): Promise<void> => {
    if (isCloudMode && user) {
      setIsSyncing(true);
      try {
        const { error } = await supabase
          .from('logs')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;
      } catch (error) {
        console.error('Failed to delete log:', error);
        setSyncError('ログの削除に失敗しました');
      } finally {
        setIsSyncing(false);
      }
    }

    setData(prev => ({
      ...prev,
      logs: prev.logs.filter(l => l.id !== id),
    }));
  }, [isCloudMode, user]);

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

  // Sync local data to cloud
  const syncToCloud = useCallback(async (): Promise<void> => {
    if (!user || !isSupabaseConfigured()) return;

    setIsSyncing(true);
    setSyncError(null);

    try {
      // Upload all local projects
      for (const project of data.projects) {
        const { error } = await supabase.from('projects').upsert({
          id: project.id,
          user_id: user.id,
          name: project.name,
          description: project.description,
          status: project.status,
          color: project.color,
          created_at: project.createdAt,
          updated_at: project.updatedAt,
        } as ProjectRow);

        if (error) throw error;
      }

      // Upload all local logs
      for (const log of data.logs) {
        const { error } = await supabase.from('logs').upsert({
          id: log.id,
          user_id: user.id,
          project_id: log.projectId,
          title: log.title,
          content: log.content,
          tags: log.tags,
          created_at: log.createdAt,
          updated_at: log.updatedAt,
        } as LogRow);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Failed to sync to cloud:', error);
      setSyncError('クラウド同期に失敗しました');
    } finally {
      setIsSyncing(false);
    }
  }, [user, data]);

  return {
    projects: data.projects,
    logs: data.logs,
    isLoading,
    isSyncing,
    syncError,
    isCloudMode: !!isCloudMode,
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
    // Sync
    syncToCloud,
  };
}
