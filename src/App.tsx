import { useState, useCallback } from 'react';
import { View, ProjectStatus } from './types';
import { useStorage } from './hooks/useStorage';
import { Dashboard } from './components/Dashboard';
import { ProjectDetail } from './components/ProjectDetail';
import { LogEditor } from './components/LogEditor';

function App() {
  const {
    projects,
    logs,
    isLoading,
    createProject,
    updateProject,
    deleteProject,
    getProject,
    createLog,
    updateLog,
    deleteLog,
    getLog,
    getProjectLogs,
    getLogCountByProject,
  } = useStorage();

  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [isCreatingNewLog, setIsCreatingNewLog] = useState(false);

  // Navigation handlers
  const handleSelectProject = useCallback((projectId: string) => {
    setSelectedProjectId(projectId);
    setSelectedLogId(null);
    setCurrentView('project');
  }, []);

  const handleBackToDashboard = useCallback(() => {
    setSelectedProjectId(null);
    setSelectedLogId(null);
    setIsCreatingNewLog(false);
    setCurrentView('dashboard');
  }, []);

  const handleSelectLog = useCallback((logId: string | null) => {
    setSelectedLogId(logId);
    setIsCreatingNewLog(false);
    if (logId) {
      setCurrentView('editor');
    }
  }, []);

  const handleCreateLog = useCallback(() => {
    setSelectedLogId(null);
    setIsCreatingNewLog(true);
    setCurrentView('editor');
  }, []);

  const handleCloseEditor = useCallback(() => {
    setSelectedLogId(null);
    setIsCreatingNewLog(false);
    setCurrentView('project');
  }, []);

  // CRUD handlers
  const handleCreateProject = useCallback((data: {
    name: string;
    description: string;
    status: ProjectStatus;
    color: string;
  }) => {
    const project = createProject(data);
    handleSelectProject(project.id);
  }, [createProject, handleSelectProject]);

  const handleUpdateProjectStatus = useCallback((projectId: string, status: ProjectStatus) => {
    updateProject(projectId, { status });
  }, [updateProject]);

  const handleDeleteProject = useCallback(() => {
    if (selectedProjectId) {
      deleteProject(selectedProjectId);
      handleBackToDashboard();
    }
  }, [selectedProjectId, deleteProject, handleBackToDashboard]);

  const handleSaveLog = useCallback((data: {
    title: string;
    content: string;
    tags: string[];
  }) => {
    if (!selectedProjectId) return;

    if (isCreatingNewLog) {
      const newLog = createLog({
        projectId: selectedProjectId,
        ...data,
      });
      setSelectedLogId(newLog.id);
      setIsCreatingNewLog(false);
    } else if (selectedLogId) {
      updateLog(selectedLogId, data);
    }
  }, [selectedProjectId, selectedLogId, isCreatingNewLog, createLog, updateLog]);

  const handleDeleteLog = useCallback((logId: string) => {
    deleteLog(logId);
    if (selectedLogId === logId) {
      setSelectedLogId(null);
      setCurrentView('project');
    }
  }, [deleteLog, selectedLogId]);

  // Get current project and logs
  const currentProject = selectedProjectId ? getProject(selectedProjectId) : undefined;
  const currentProjectLogs = selectedProjectId ? getProjectLogs(selectedProjectId) : [];
  const currentLog = selectedLogId ? getLog(selectedLogId) : null;

  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-dark-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyber-green border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-dark-bg overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {currentView === 'dashboard' && (
          <div className="flex-1">
            <Dashboard
              projects={projects}
              logs={logs}
              onSelectProject={handleSelectProject}
              onCreateProject={handleCreateProject}
              onUpdateProjectStatus={handleUpdateProjectStatus}
              getLogCount={getLogCountByProject}
            />
          </div>
        )}

        {currentView === 'project' && currentProject && (
          <div className="flex-1">
            <ProjectDetail
              project={currentProject}
              logs={currentProjectLogs}
              selectedLogId={selectedLogId}
              onBack={handleBackToDashboard}
              onSelectLog={handleSelectLog}
              onCreateLog={handleCreateLog}
              onDeleteLog={handleDeleteLog}
              onDeleteProject={handleDeleteProject}
              onUpdateProject={(updates) => updateProject(currentProject.id, updates)}
            />
          </div>
        )}

        {currentView === 'editor' && currentProject && (
          <div className="flex-1">
            <LogEditor
              log={currentLog ?? null}
              project={currentProject}
              projects={projects}
              logs={logs}
              onSave={handleSaveLog}
              onClose={handleCloseEditor}
              isNew={isCreatingNewLog}
              onNavigateToProject={handleSelectProject}
              onNavigateToLog={(projectId, logId) => {
                setSelectedProjectId(projectId);
                setSelectedLogId(logId);
                setIsCreatingNewLog(false);
                setCurrentView('editor');
              }}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 border-t border-dark-border px-4 py-2 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-4">
          <span className="font-mono text-cyber-green">DevLog Manager</span>
          <span>v0.1.0</span>
        </div>
        <div className="flex items-center gap-4">
          <span>{projects.length} プロジェクト</span>
          <span>{logs.length} ログ</span>
        </div>
      </div>
    </div>
  );
}

export default App;

