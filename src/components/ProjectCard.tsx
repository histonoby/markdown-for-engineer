import { Project, STATUS_CONFIG } from '../types';

interface ProjectCardProps {
  project: Project;
  logCount: number;
  onClick: () => void;
  onStatusChange: (status: Project['status']) => void;
}

export function ProjectCard({ project, logCount, onClick, onStatusChange }: ProjectCardProps) {
  const statusConfig = STATUS_CONFIG[project.status];
  const lastUpdated = new Date(project.updatedAt);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));
  
  const getTimeAgo = () => {
    if (diffDays === 0) return '今日';
    if (diffDays === 1) return '昨日';
    if (diffDays < 7) return `${diffDays}日前`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}週間前`;
    return `${Math.floor(diffDays / 30)}ヶ月前`;
  };

  const isRecent = diffDays < 3;

  return (
    <div
      className={`
        relative bg-dark-card border border-dark-border rounded-xl p-5 cursor-pointer
        card-hover animate-fade-in overflow-hidden
        ${isRecent ? 'pulse-active' : ''}
      `}
      onClick={onClick}
    >
      {/* Color indicator bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
        style={{ backgroundColor: project.color }}
      />
      
      {/* Header */}
      <div className="flex items-start justify-between mt-2 mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: project.color }}
          />
          <h3 className="text-lg font-semibold text-white truncate max-w-[180px]">
            {project.name}
          </h3>
        </div>
        
        {/* Status dropdown */}
        <select
          value={project.status}
          onChange={(e) => {
            e.stopPropagation();
            onStatusChange(e.target.value as Project['status']);
          }}
          onClick={(e) => e.stopPropagation()}
          className="text-xs px-2 py-1 rounded-full border-none outline-none cursor-pointer"
          style={{
            backgroundColor: statusConfig.bgColor,
            color: statusConfig.color,
          }}
        >
          <option value="active">進行中</option>
          <option value="paused">保留</option>
          <option value="completed">完了</option>
        </select>
      </div>
      
      {/* Description */}
      <p className="text-sm text-gray-400 mb-4 line-clamp-2 min-h-[40px]">
        {project.description || 'プロジェクトの説明がありません'}
      </p>
      
      {/* Stats */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          {/* Log count */}
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-gray-400 font-mono">{logCount}</span>
          </div>
        </div>
        
        {/* Last updated */}
        <div className="flex items-center gap-1.5 text-gray-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className={isRecent ? 'text-cyber-green' : ''}>{getTimeAgo()}</span>
        </div>
      </div>
      
      {/* Activity indicator */}
      {isRecent && (
        <div className="absolute bottom-3 right-3">
          <div className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
        </div>
      )}
    </div>
  );
}

