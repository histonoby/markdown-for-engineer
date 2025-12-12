import { useState } from 'react';
import { PROJECT_COLORS, ProjectStatus } from '../types';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; description: string; status: ProjectStatus; color: string }) => void;
}

export function CreateProjectModal({ isOpen, onClose, onSubmit }: CreateProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('active');
  const [color, setColor] = useState(PROJECT_COLORS[0]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    onSubmit({ name: name.trim(), description: description.trim(), status, color });
    setName('');
    setDescription('');
    setStatus('active');
    setColor(PROJECT_COLORS[0]);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-dark-card border border-dark-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <svg className="w-6 h-6 text-cyber-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          新規プロジェクト
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              プロジェクト名 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: ECサイトリニューアル"
              className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-gray-500 focus:border-cyber-green focus:outline-none transition-colors"
              autoFocus
            />
          </div>
          
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              説明
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="プロジェクトの概要を入力..."
              rows={3}
              className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-gray-500 focus:border-cyber-green focus:outline-none transition-colors resize-none"
            />
          </div>
          
          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              ステータス
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white focus:border-cyber-green focus:outline-none transition-colors"
            >
              <option value="active">進行中</option>
              <option value="paused">保留</option>
              <option value="completed">完了</option>
            </select>
          </div>
          
          {/* Color Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              カラー
            </label>
            <div className="flex gap-2 flex-wrap">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-dark-card scale-110' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          
          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-gray-300 hover:bg-dark-hover transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 px-4 py-3 bg-cyber-green text-dark-bg font-semibold rounded-lg hover:bg-cyber-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              作成
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

