import { useState, useCallback, useEffect } from 'react';
import { View, ProjectStatus } from './types';
import { useStorage } from './hooks/useStorage';
import { useAuth } from './hooks/useAuth';
import { Dashboard } from './components/Dashboard';
import { ProjectDetail } from './components/ProjectDetail';
import { LogEditor } from './components/LogEditor';
import { AuthScreen } from './components/AuthScreen';

function App() {
  const {
    user,
    isLoading: isAuthLoading,
    isConfigured,
    isAuthenticated,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
  } = useAuth();

  // ローカルモードかクラウドモードかを管理
  const [useCloud, setUseCloud] = useState<boolean | null>(null);
  const [showAuthScreen, setShowAuthScreen] = useState(true);

  // 初回ロード時に認証状態を確認
  useEffect(() => {
    if (!isAuthLoading) {
      if (isAuthenticated) {
        setUseCloud(true);
        setShowAuthScreen(false);
      } else {
        // ローカルに保存されたモード設定を確認
        const savedMode = localStorage.getItem('devlog-use-cloud');
        if (savedMode === 'false') {
          setUseCloud(false);
          setShowAuthScreen(false);
        }
      }
    }
  }, [isAuthLoading, isAuthenticated]);

  const {
    projects,
    logs,
    isLoading: isDataLoading,
    isSyncing,
    syncError,
    isCloudMode,
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
    syncToCloud,
  } = useStorage({ user, useCloud: useCloud ?? false });

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
  const handleCreateProject = useCallback(async (data: {
    name: string;
    description: string;
    status: ProjectStatus;
    color: string;
  }) => {
    const project = await createProject(data);
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

  const handleSaveLog = useCallback(async (data: {
    title: string;
    content: string;
    tags: string[];
  }) => {
    if (!selectedProjectId) return;

    if (isCreatingNewLog) {
      const newLog = await createLog({
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

  // Auth handlers
  const handleSkipAuth = useCallback(() => {
    setUseCloud(false);
    setShowAuthScreen(false);
    localStorage.setItem('devlog-use-cloud', 'false');
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut();
    setUseCloud(null);
    setShowAuthScreen(true);
    localStorage.removeItem('devlog-use-cloud');
  }, [signOut]);

  const handleSwitchToCloud = useCallback(() => {
    setShowAuthScreen(true);
  }, []);

  // Get current project and logs
  const currentProject = selectedProjectId ? getProject(selectedProjectId) : undefined;
  const currentProjectLogs = selectedProjectId ? getProjectLogs(selectedProjectId) : [];
  const currentLog = selectedLogId ? getLog(selectedLogId) : null;

  // Auth loading state
  if (isAuthLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-dark-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyber-green border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth screen
  if (showAuthScreen && !isAuthenticated) {
    return (
      <AuthScreen
        onSignIn={signIn}
        onSignUp={signUp}
        onSignInWithGoogle={signInWithGoogle}
        onSkipAuth={handleSkipAuth}
        isConfigured={isConfigured}
      />
    );
  }

  // Data loading state
  if (isDataLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-dark-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyber-green border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400">データを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-dark-bg overflow-hidden">
      {/* Sync Error Banner */}
      {syncError && (
        <div className="flex-shrink-0 bg-red-500/10 border-b border-red-500/20 px-4 py-2 flex items-center justify-between">
          <span className="text-red-400 text-sm">{syncError}</span>
          <button
            onClick={() => syncToCloud()}
            className="text-red-400 hover:text-red-300 text-sm underline"
            type="button"
          >
            再試行
          </button>
        </div>
      )}

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
          {isSyncing && (
            <span className="flex items-center gap-1 text-cyber-cyan">
              <div className="w-2 h-2 border border-cyber-cyan border-t-transparent rounded-full animate-spin" />
              同期中...
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span>{projects.length} プロジェクト</span>
          <span>{logs.length} ログ</span>
          <span className={isCloudMode ? 'text-cyber-cyan' : 'text-gray-500'}>
            {isCloudMode ? '☁️ クラウド' : '💾 ローカル'}
          </span>
          {isCloudMode ? (
            <button
              onClick={handleSignOut}
              className="text-gray-400 hover:text-white transition-colors"
              type="button"
            >
              ログアウト
            </button>
          ) : isConfigured ? (
            <button
              onClick={handleSwitchToCloud}
              className="text-cyber-cyan hover:text-white transition-colors"
              type="button"
            >
              クラウドに切替
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default App;
