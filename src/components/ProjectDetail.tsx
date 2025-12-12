import { useState } from 'react';
import { Project, LogEntry, STATUS_CONFIG } from '../types';
import { LogList } from './LogList';

interface ProjectDetailProps {
  project: Project;
  logs: LogEntry[];
  selectedLogId: string | null;
  onBack: () => void;
  onSelectLog: (logId: string | null) => void;
  onCreateLog: () => void;
  onDeleteLog: (logId: string) => void;
  onDeleteProject: () => void;
  onUpdateProject: (updates: Partial<Project>) => void;
}

export function ProjectDetail({
  project,
  logs,
  selectedLogId,
  onBack,
  onSelectLog,
  onCreateLog,
  onDeleteLog,
  onDeleteProject,
  onUpdateProject,
}: ProjectDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(project.name);
  const [editDescription, setEditDescription] = useState(project.description);
  const [searchQuery, setSearchQuery] = useState('');

  const statusConfig = STATUS_CONFIG[project.status];

  // Filter logs by search
  const filteredLogs = searchQuery
    ? logs.filter(
        log =>
          log.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : logs;

  const handleSaveEdit = () => {
    onUpdateProject({
      name: editName.trim() || project.name,
      description: editDescription.trim(),
    });
    setIsEditing(false);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-dark-border">
        <div className="p-4">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              ダッシュボード
            </button>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (isEditing) {
                    handleSaveEdit();
                  } else {
                    setIsEditing(true);
                  }
                }}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-dark-hover transition-colors"
                title={isEditing ? '保存' : '編集'}
              >
                {isEditing ? (
                  <svg className="w-5 h-5 text-cyber-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                )}
              </button>
              
              <button
                onClick={() => {
                  if (confirm('このプロジェクトを削除しますか？すべてのログも削除されます。')) {
                    onDeleteProject();
                  }
                }}
                className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="削除"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Project Info */}
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold flex-shrink-0"
              style={{ backgroundColor: project.color + '20', color: project.color }}
            >
              {project.name.charAt(0).toUpperCase()}
            </div>
            
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="text-xl font-bold text-white bg-transparent border-b border-dark-border focus:border-cyber-green outline-none w-full mb-2"
                  autoFocus
                />
              ) : (
                <h1 className="text-xl font-bold text-white truncate mb-1">
                  {project.name}
                </h1>
              )}
              
              {isEditing ? (
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="説明を追加..."
                  className="text-sm text-gray-400 bg-transparent border border-dark-border rounded-lg p-2 focus:border-cyber-green outline-none w-full resize-none"
                  rows={2}
                />
              ) : (
                <p className="text-sm text-gray-400 line-clamp-2">
                  {project.description || 'No description'}
                </p>
              )}
            </div>
            
            {/* Status badge */}
            <span
              className="px-3 py-1 rounded-full text-sm font-medium flex-shrink-0"
              style={{
                backgroundColor: statusConfig.bgColor,
                color: statusConfig.color,
              }}
            >
              {statusConfig.label}
            </span>
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="font-mono">{logs.length}</span> ログ
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>作成: {new Date(project.createdAt).toLocaleDateString('ja-JP')}</span>
            </div>
          </div>
        </div>
        
        {/* Search and Actions */}
        <div className="px-4 pb-4 flex items-center gap-3">
          <div className="flex-1 relative">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ログを検索..."
              className="w-full pl-10 pr-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm text-white placeholder-gray-500 focus:border-cyber-green outline-none transition-colors"
            />
          </div>
          
          <button
            onClick={onCreateLog}
            className="flex items-center gap-2 px-4 py-2 bg-cyber-green text-dark-bg font-medium rounded-lg hover:bg-cyber-green/90 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            新規ログ
          </button>
        </div>
      </div>
      
      {/* Log List */}
      <div className="flex-1 overflow-hidden bg-dark-bg">
        <LogList
          logs={filteredLogs}
          selectedLogId={selectedLogId}
          onSelectLog={onSelectLog}
          onDeleteLog={onDeleteLog}
        />
      </div>
    </div>
  );
}

