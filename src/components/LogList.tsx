import { LogEntry } from '../types';

interface LogListProps {
  logs: LogEntry[];
  selectedLogId: string | null;
  onSelectLog: (logId: string) => void;
  onDeleteLog: (logId: string) => void;
}

export function LogList({ logs, selectedLogId, onSelectLog, onDeleteLog }: LogListProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Group logs by date
  const groupedLogs = logs.reduce((groups, log) => {
    const date = formatDate(log.createdAt);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(log);
    return groups;
  }, {} as Record<string, LogEntry[]>);

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <div className="w-16 h-16 rounded-full bg-dark-border flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-gray-400 text-sm">ログがありません</p>
        <p className="text-gray-500 text-xs mt-1">新しいログを作成してください</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full">
      {Object.entries(groupedLogs).map(([date, dateLogs]) => (
        <div key={date} className="mb-4">
          {/* Date header */}
          <div className="sticky top-0 bg-dark-bg/95 backdrop-blur-sm px-4 py-2 border-b border-dark-border z-10">
            <span className="text-xs font-medium text-gray-500">{date}</span>
          </div>
          
          {/* Logs for this date */}
          <div className="space-y-1 p-2">
            {dateLogs.map((log) => (
              <div
                key={log.id}
                className={`
                  group relative p-3 rounded-lg cursor-pointer transition-all
                  ${selectedLogId === log.id
                    ? 'bg-dark-border border-l-2 border-l-cyber-green'
                    : 'hover:bg-dark-hover border-l-2 border-l-transparent'
                  }
                `}
                onClick={() => onSelectLog(log.id)}
              >
                {/* Title */}
                <h4 className={`
                  text-sm font-medium truncate mb-1
                  ${selectedLogId === log.id ? 'text-white' : 'text-gray-300'}
                `}>
                  {log.title || '無題のログ'}
                </h4>
                
                {/* Preview */}
                <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                  {log.content.replace(/[#*`]/g, '').slice(0, 100) || 'No content'}
                </p>
                
                {/* Footer */}
                <div className="flex items-center justify-between">
                  {/* Tags */}
                  <div className="flex gap-1 flex-wrap">
                    {log.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-1.5 py-0.5 bg-dark-bg rounded text-gray-400"
                      >
                        {tag}
                      </span>
                    ))}
                    {log.tags.length > 2 && (
                      <span className="text-[10px] text-gray-500">+{log.tags.length - 2}</span>
                    )}
                  </div>
                  
                  {/* Time */}
                  <span className="text-[10px] text-gray-500 font-mono">
                    {formatTime(log.createdAt)}
                  </span>
                </div>
                
                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('このログを削除しますか？')) {
                      onDeleteLog(log.id);
                    }
                  }}
                  className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

