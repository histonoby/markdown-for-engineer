import { useState, useEffect, useCallback, useRef } from 'react';
import { LogEntry, Project } from '../types';
import { WysiwygEditor } from './WysiwygEditor';

interface LogEditorProps {
  log: LogEntry | null;
  project: Project;
  projects: Project[];
  logs: LogEntry[];
  onSave: (data: { title: string; content: string; tags: string[] }) => void;
  onClose: () => void;
  isNew: boolean;
  onNavigateToProject: (projectId: string) => void;
  onNavigateToLog: (projectId: string, logId: string) => void;
}

export function LogEditor({ 
  log, 
  project, 
  projects,
  logs,
  onSave, 
  onClose, 
  isNew: _isNew,
  onNavigateToProject,
  onNavigateToLog,
}: LogEditorProps) {
  const [title, setTitle] = useState(log?.title || '');
  const [content, setContent] = useState(log?.content || '');
  const [tags, setTags] = useState<string[]>(log?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadRef = useRef(true);

  // Reset state when log changes (navigation to different log)
  useEffect(() => {
    setTitle(log?.title || '');
    setContent(log?.content || '');
    setTags(log?.tags || []);
    setTagInput('');
    setLastSaved(log ? new Date(log.updatedAt) : null);
    initialLoadRef.current = true;
  }, [log?.id]);

  // Auto-save function
  const performSave = useCallback(() => {
    if (title.trim() || content.trim()) {
      setIsSaving(true);
      onSave({ title: title.trim() || '無題のログ', content, tags });
      setLastSaved(new Date());
      setTimeout(() => setIsSaving(false), 500);
    }
  }, [title, content, tags, onSave]);

  // Auto-save with debounce (1.5 seconds after last change)
  useEffect(() => {
    // Skip auto-save on initial load
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Set new timer for auto-save
    autoSaveTimerRef.current = setTimeout(() => {
      performSave();
    }, 1500);

    // Cleanup
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [title, content, tags, performSave]);

  // Manual save with Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        performSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [performSave]);

  const handleAddTag = () => {
    const newTag = tagInput.trim();
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleClose = () => {
    // Save before closing if there are changes
    if (title.trim() || content.trim()) {
      performSave();
    }
    onClose();
  };

  const formatLastSaved = () => {
    if (!lastSaved) return '';
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastSaved.getTime()) / 1000);
    if (diff < 5) return '今保存しました';
    if (diff < 60) return `${diff}秒前に保存`;
    if (diff < 3600) return `${Math.floor(diff / 60)}分前に保存`;
    return lastSaved.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-full flex flex-col bg-dark-bg">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-dark-border p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-dark-hover transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: project.color }}
              />
              <span className="text-sm text-gray-400">{project.name}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Auto-save status */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              {isSaving ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                  <span>保存中...</span>
                </>
              ) : lastSaved ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-cyber-green" />
                  <span>{formatLastSaved()}</span>
                </>
              ) : null}
            </div>
            
            {/* Manual save button */}
            <button
              onClick={performSave}
              className="flex items-center gap-2 px-3 py-1.5 bg-dark-card border border-dark-border text-gray-300 text-sm rounded-lg hover:bg-dark-hover transition-colors"
              title="Ctrl+S"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              保存
            </button>
          </div>
        </div>
        
        {/* Title input */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="ログタイトル"
          className="w-full text-xl font-bold text-white bg-transparent border-none outline-none placeholder-gray-500 mb-3"
        />
        
        {/* Tags */}
        <div className="flex items-center gap-2 flex-wrap">
          {tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 px-2 py-1 bg-dark-card rounded-lg text-sm text-gray-300"
            >
              <span className="text-cyber-purple">#</span>
              {tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="ml-1 text-gray-500 hover:text-white"
              >
                ×
              </button>
            </span>
          ))}
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                handleAddTag();
              }
            }}
            placeholder="タグを追加..."
            className="text-sm bg-transparent border-none outline-none text-white placeholder-gray-500 min-w-[100px]"
          />
        </div>
      </div>
      
      {/* WYSIWYG Editor (Split View) */}
      <div className="flex-1 overflow-hidden">
        <WysiwygEditor
          content={content}
          onChange={setContent}
          projects={projects}
          logs={logs}
          currentProjectId={project.id}
          onNavigateToProject={onNavigateToProject}
          onNavigateToLog={onNavigateToLog}
          placeholder="Markdownで開発ログを記録しましょう...

# 今日の作業
- 実装した機能
- 解決した問題

## メモ
- 画像はCtrl+Vで貼り付け
- [[プロジェクト名]] で内部リンク"
        />
      </div>
    </div>
  );
}
