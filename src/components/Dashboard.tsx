import { useState } from 'react';
import { Project, ProjectStatus, LogEntry } from '../types';
import { ProjectCard } from './ProjectCard';
import { CreateProjectModal } from './CreateProjectModal';

interface DashboardProps {
  projects: Project[];
  logs: LogEntry[];
  onSelectProject: (projectId: string) => void;
  onCreateProject: (data: { name: string; description: string; status: ProjectStatus; color: string }) => void;
  onUpdateProjectStatus: (projectId: string, status: ProjectStatus) => void;
  getLogCount: (projectId: string) => number;
}

export function Dashboard({
  projects,
  logs,
  onSelectProject,
  onCreateProject,
  onUpdateProjectStatus,
  getLogCount,
}: DashboardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<ProjectStatus | 'all'>('all');

  // Sort projects by last updated
  const sortedProjects = [...projects].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  // Filter projects
  const filteredProjects = filter === 'all'
    ? sortedProjects
    : sortedProjects.filter(p => p.status === filter);

  // Get recent activity
  const recentLogs = [...logs]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const getProjectName = (projectId: string) => {
    return projects.find(p => p.id === projectId)?.name || 'Unknown';
  };

  const getProjectColor = (projectId: string) => {
    return projects.find(p => p.id === projectId)?.color || '#666';
  };

  return (
    <div className="h-full overflow-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">
            <span className="text-cyber-green font-mono">&gt;</span> DevLog Manager
          </h1>
          <p className="text-gray-400">
            {projects.length} プロジェクト / {logs.length} ログエントリ
          </p>
        </div>
        
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-3 bg-cyber-green text-dark-bg font-semibold rounded-lg hover:bg-cyber-green/90 transition-all hover:scale-105"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          新規プロジェクト
        </button>
      </div>

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Projects Grid */}
        <div className="flex-1">
          {/* Filter Tabs */}
          <div className="flex items-center gap-2 mb-6">
            {(['all', 'active', 'paused', 'completed'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === status
                    ? 'bg-dark-border text-white'
                    : 'text-gray-400 hover:text-white hover:bg-dark-hover'
                }`}
              >
                {status === 'all' ? 'すべて' :
                 status === 'active' ? '進行中' :
                 status === 'paused' ? '保留' : '完了'}
                {status !== 'all' && (
                  <span className="ml-2 text-xs opacity-60">
                    {projects.filter(p => p.status === status).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Projects Grid */}
          {filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredProjects.map((project, index) => (
                <div key={project.id} style={{ animationDelay: `${index * 50}ms` }}>
                  <ProjectCard
                    project={project}
                    logCount={getLogCount(project.id)}
                    onClick={() => onSelectProject(project.id)}
                    onStatusChange={(status) => onUpdateProjectStatus(project.id, status)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-dark-border flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-300 mb-2">
                {filter === 'all' ? 'プロジェクトがありません' : '該当するプロジェクトがありません'}
              </h3>
              <p className="text-gray-500 mb-6">
                {filter === 'all' ? '新規プロジェクトを作成して開発ログを記録しましょう' : 'フィルターを変更してください'}
              </p>
              {filter === 'all' && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-5 py-2 border border-cyber-green text-cyber-green rounded-lg hover:bg-cyber-green/10 transition-colors"
                >
                  プロジェクトを作成
                </button>
              )}
            </div>
          )}
        </div>

        {/* Recent Activity Sidebar */}
        <div className="w-80 flex-shrink-0">
          <div className="bg-dark-card border border-dark-border rounded-xl p-5 sticky top-0">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-cyber-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              最近の活動
            </h2>
            
            {recentLogs.length > 0 ? (
              <div className="space-y-3">
                {recentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 bg-dark-bg rounded-lg border border-dark-border hover:border-dark-hover cursor-pointer transition-colors"
                    onClick={() => {
                      const project = projects.find(p => p.id === log.projectId);
                      if (project) onSelectProject(project.id);
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: getProjectColor(log.projectId) }}
                      />
                      <span className="text-xs text-gray-500 truncate">
                        {getProjectName(log.projectId)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 truncate">{log.title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(log.updatedAt).toLocaleDateString('ja-JP', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-8">
                まだログがありません
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={onCreateProject}
      />
    </div>
  );
}

