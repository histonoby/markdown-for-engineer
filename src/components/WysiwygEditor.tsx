import { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Project, LogEntry } from '../types';

interface WysiwygEditorProps {
  content: string;
  onChange: (content: string) => void;
  projects: Project[];
  logs: LogEntry[];
  currentProjectId: string;
  onNavigateToProject: (projectId: string) => void;
  onNavigateToLog: (projectId: string, logId: string) => void;
  placeholder?: string;
}

interface LinkSuggestion {
  type: 'project' | 'log';
  display: string;
  value: string;
  projectId: string;
  logId?: string;
  color?: string;
}

export function WysiwygEditor({ 
  content, 
  onChange, 
  projects,
  logs,
  onNavigateToProject,
  onNavigateToLog,
  placeholder 
}: WysiwygEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [imageCounter, setImageCounter] = useState(0);
  const [showLinkSuggestions, setShowLinkSuggestions] = useState(false);
  const [linkQuery, setLinkQuery] = useState('');
  const [suggestionPosition, setSuggestionPosition] = useState({ top: 0, left: 0 });
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);

  // Generate link suggestions
  const linkSuggestions = useMemo((): LinkSuggestion[] => {
    const query = linkQuery.toLowerCase();
    const suggestions: LinkSuggestion[] = [];
    
    projects.forEach(project => {
      if (project.name.toLowerCase().includes(query)) {
        suggestions.push({
          type: 'project',
          display: project.name,
          value: `[[${project.name}]]`,
          projectId: project.id,
          color: project.color,
        });
      }
      
      const projectLogs = logs.filter(l => l.projectId === project.id);
      projectLogs.forEach(log => {
        const fullPath = `${project.name}/${log.title}`;
        if (fullPath.toLowerCase().includes(query) || log.title.toLowerCase().includes(query)) {
          suggestions.push({
            type: 'log',
            display: fullPath,
            value: `[[${fullPath}]]`,
            projectId: project.id,
            logId: log.id,
            color: project.color,
          });
        }
      });
    });
    
    return suggestions.slice(0, 10);
  }, [projects, logs, linkQuery]);

  // Reset suggestion index when suggestions change
  useEffect(() => {
    setSelectedSuggestionIndex(0);
  }, [linkSuggestions]);

  // Resolve link to project/log
  const resolveLink = useCallback((linkText: string): { type: 'project' | 'log' | 'invalid'; projectId?: string; logId?: string } => {
    if (linkText.includes('/')) {
      const [projectName, logTitle] = linkText.split('/');
      const project = projects.find(p => p.name === projectName);
      if (project) {
        const log = logs.find(l => l.projectId === project.id && l.title === logTitle);
        if (log) {
          return { type: 'log', projectId: project.id, logId: log.id };
        }
      }
    } else {
      const project = projects.find(p => p.name === linkText);
      if (project) {
        return { type: 'project', projectId: project.id };
      }
    }
    return { type: 'invalid' };
  }, [projects, logs]);

  // Check for [[ trigger for suggestions
  const checkLinkTrigger = useCallback(() => {
    if (!textareaRef.current) return;
    
    const cursorPos = textareaRef.current.selectionStart;
    const textBefore = content.substring(0, cursorPos);
    
    const lastOpenBracket = textBefore.lastIndexOf('[[');
    const lastCloseBracket = textBefore.lastIndexOf(']]');
    
    if (lastOpenBracket > lastCloseBracket) {
      const query = textBefore.substring(lastOpenBracket + 2);
      setLinkQuery(query);
      setShowLinkSuggestions(true);
      
      const textarea = textareaRef.current;
      const lines = textBefore.split('\n');
      const lineNumber = lines.length - 1;
      const lineHeight = 24;
      const charWidth = 9.6;
      
      setSuggestionPosition({
        top: Math.min((lineNumber + 1) * lineHeight + 10 - textarea.scrollTop, textarea.clientHeight - 200),
        left: Math.min(lines[lineNumber].length * charWidth, textarea.clientWidth - 280),
      });
    } else {
      setShowLinkSuggestions(false);
    }
  }, [content]);

  // Handle paste for images
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        
        const file = item.getAsFile();
        if (!file) continue;

        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target?.result as string;
          if (!base64) return;
          
          const imageId = `img_${Date.now()}_${imageCounter}`;
          setImageCounter(prev => prev + 1);
          
          const imageMarkdown = `\n{{IMG:${imageId}:${base64}}}\n`;
          
          if (textareaRef.current) {
            const start = textareaRef.current.selectionStart;
            const end = textareaRef.current.selectionEnd;
            const newContent = 
              content.substring(0, start) + 
              imageMarkdown + 
              content.substring(end);
            onChange(newContent);
            
            setTimeout(() => {
              if (textareaRef.current) {
                const newPos = start + imageMarkdown.length;
                textareaRef.current.focus();
                textareaRef.current.setSelectionRange(newPos, newPos);
              }
            }, 10);
          }
        };
        reader.readAsDataURL(file);
        return;
      }
    }
  }, [content, onChange, imageCounter]);

  // Process content for preview
  const processContent = useCallback((text: string): { markdown: string; images: Map<string, string> } => {
    const images = new Map<string, string>();
    const imgRegex = /\{\{IMG:([^:]+):([^}]+)\}\}/g;
    
    let match;
    while ((match = imgRegex.exec(text)) !== null) {
      const [, id, base64] = match;
      images.set(id, base64);
    }
    
    const markdown = text.replace(imgRegex, (_, id) => `![image](${id})`);
    
    return { markdown, images };
  }, []);

  // Process internal links in markdown
  const processInternalLinks = useCallback((text: string): string => {
    return text.replace(/\[\[([^\]]+)\]\]/g, (_, linkText) => {
      return `{{LINK:${linkText}}}`;
    });
  }, []);

  // Insert suggestion
  const insertSuggestion = useCallback((suggestion: LinkSuggestion) => {
    if (!textareaRef.current) return;
    
    const cursorPos = textareaRef.current.selectionStart;
    const textBefore = content.substring(0, cursorPos);
    const textAfter = content.substring(cursorPos);
    
    const lastOpenBracket = textBefore.lastIndexOf('[[');
    const newContent = textBefore.substring(0, lastOpenBracket) + suggestion.value + textAfter;
    
    onChange(newContent);
    setShowLinkSuggestions(false);
    
    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = lastOpenBracket + suggestion.value.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  }, [content, onChange]);

  // Insert markdown syntax
  const insertMarkdown = useCallback((prefix: string, suffix: string = '') => {
    if (!textareaRef.current) return;
    
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selectedText = content.substring(start, end);
    const newContent = 
      content.substring(0, start) + 
      prefix + selectedText + suffix + 
      content.substring(end);
    
    onChange(newContent);
    
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        if (selectedText) {
          const newPos = start + prefix.length + selectedText.length + suffix.length;
          textareaRef.current.setSelectionRange(newPos, newPos);
        } else {
          const newPos = start + prefix.length;
          textareaRef.current.setSelectionRange(newPos, newPos);
        }
      }
    }, 0);
  }, [content, onChange]);

  // Handle keydown
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showLinkSuggestions && linkSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < linkSuggestions.length - 1 ? prev + 1 : prev
        );
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : prev);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertSuggestion(linkSuggestions[selectedSuggestionIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowLinkSuggestions(false);
        return;
      }
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      insertMarkdown('  ');
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      insertMarkdown('**', '**');
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault();
      insertMarkdown('*', '*');
    }
  }, [showLinkSuggestions, linkSuggestions, selectedSuggestionIndex, insertSuggestion, insertMarkdown]);

  // Handle input change
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newDisplayContent = e.target.value;
    
    if (newDisplayContent.includes('{{IMG:')) {
      let newContent = newDisplayContent;
      const displayMatches = [...newDisplayContent.matchAll(/\{\{IMG:([^:]+):📷\}\}/g)];
      const originalMatches = [...content.matchAll(/\{\{IMG:([^:]+):([^}]+)\}\}/g)];
      
      const originalMap = new Map(originalMatches.map(m => [m[1], m[2]]));
      
      displayMatches.forEach(match => {
        const id = match[1];
        const originalBase64 = originalMap.get(id);
        if (originalBase64) {
          newContent = newContent.replace(
            `{{IMG:${id}:📷}}`,
            `{{IMG:${id}:${originalBase64}}}`
          );
        }
      });
      
      onChange(newContent);
    } else {
      onChange(newDisplayContent);
    }
  }, [content, onChange]);

  // Process content for preview
  const { markdown: processedMarkdown, images } = processContent(content);
  const previewMarkdown = processInternalLinks(processedMarkdown);

  // Custom image component
  const ImageComponent = useCallback(({ src, alt }: { src?: string; alt?: string }) => {
    const base64 = src ? images.get(src) : null;
    const actualSrc = base64 || src;
    
    if (!actualSrc) {
      return <span className="text-gray-500">[画像を読み込めません]</span>;
    }
    
    return (
      <img
        src={actualSrc}
        alt={alt || 'image'}
        className="max-w-full rounded-lg my-4 border border-dark-border"
        style={{ maxHeight: '300px', objectFit: 'contain' }}
      />
    );
  }, [images]);

  // Format display content
  const displayContent = content.replace(
    /\{\{IMG:([^:]+):([^}]+)\}\}/g, 
    '{{IMG:$1:📷}}'
  );

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex-shrink-0 border-b border-dark-border px-4 py-2 flex items-center gap-1 bg-dark-bg">
        <button
          type="button"
          onClick={() => insertMarkdown('**', '**')}
          className="p-2 rounded text-gray-400 hover:text-white hover:bg-dark-hover"
          title="太字 (Ctrl+B)"
        >
          <span className="font-bold text-sm">B</span>
        </button>
        <button
          type="button"
          onClick={() => insertMarkdown('*', '*')}
          className="p-2 rounded text-gray-400 hover:text-white hover:bg-dark-hover"
          title="斜体 (Ctrl+I)"
        >
          <span className="italic text-sm">I</span>
        </button>
        <button
          type="button"
          onClick={() => insertMarkdown('~~', '~~')}
          className="p-2 rounded text-gray-400 hover:text-white hover:bg-dark-hover"
          title="取り消し線"
        >
          <span className="line-through text-sm">S</span>
        </button>
        <div className="w-px h-5 bg-dark-border mx-1" />
        <button
          type="button"
          onClick={() => insertMarkdown('# ')}
          className="p-2 rounded text-gray-400 hover:text-white hover:bg-dark-hover"
          title="見出し1"
        >
          <span className="text-sm font-mono">H1</span>
        </button>
        <button
          type="button"
          onClick={() => insertMarkdown('## ')}
          className="p-2 rounded text-gray-400 hover:text-white hover:bg-dark-hover"
          title="見出し2"
        >
          <span className="text-sm font-mono">H2</span>
        </button>
        <button
          type="button"
          onClick={() => insertMarkdown('### ')}
          className="p-2 rounded text-gray-400 hover:text-white hover:bg-dark-hover"
          title="見出し3"
        >
          <span className="text-sm font-mono">H3</span>
        </button>
        <div className="w-px h-5 bg-dark-border mx-1" />
        <button
          type="button"
          onClick={() => insertMarkdown('- ')}
          className="p-2 rounded text-gray-400 hover:text-white hover:bg-dark-hover"
          title="箇条書き"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => insertMarkdown('> ')}
          className="p-2 rounded text-gray-400 hover:text-white hover:bg-dark-hover"
          title="引用"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
        <div className="w-px h-5 bg-dark-border mx-1" />
        <button
          type="button"
          onClick={() => insertMarkdown('`', '`')}
          className="p-2 rounded text-gray-400 hover:text-white hover:bg-dark-hover"
          title="インラインコード"
        >
          <span className="text-sm font-mono">{`<>`}</span>
        </button>
        <button
          type="button"
          onClick={() => insertMarkdown('```\n', '\n```')}
          className="p-2 rounded text-gray-400 hover:text-white hover:bg-dark-hover"
          title="コードブロック"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => insertMarkdown('[[')}
          className="p-2 rounded text-gray-400 hover:text-white hover:bg-dark-hover"
          title="内部リンク [[]]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </button>
        
        <div className="ml-auto text-xs text-gray-500 flex items-center gap-3">
          <span>Ctrl+V 画像</span>
          <span>[[ リンク</span>
        </div>
      </div>
      
      {/* Split Editor and Preview */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor (Left) */}
        <div className="w-1/2 flex flex-col border-r border-dark-border relative">
          <div className="px-4 py-2 bg-dark-card border-b border-dark-border text-xs text-gray-500 font-medium">
            編集
          </div>
          <textarea
            ref={textareaRef}
            value={displayContent}
            onChange={handleChange}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            onKeyUp={checkLinkTrigger}
            onClick={checkLinkTrigger}
            placeholder={placeholder}
            className="flex-1 w-full p-4 bg-dark-bg text-gray-200 font-mono text-sm leading-relaxed resize-none outline-none"
            spellCheck={false}
          />
          
          {/* Link Suggestions Dropdown */}
          {showLinkSuggestions && linkSuggestions.length > 0 && (
            <div 
              className="absolute z-50 bg-dark-card border border-dark-border rounded-lg shadow-xl overflow-hidden"
              style={{ 
                top: suggestionPosition.top + 48,
                left: Math.max(16, suggestionPosition.left),
                minWidth: '250px',
                maxWidth: '350px',
              }}
            >
              <div className="px-3 py-2 bg-dark-border text-xs text-gray-400 border-b border-dark-border">
                ↑↓ 選択 • Enter/Tab 挿入 • Esc 閉じる
              </div>
              <div className="max-h-64 overflow-y-auto">
                {linkSuggestions.map((suggestion, index) => (
                  <div
                    key={`${suggestion.type}-${suggestion.projectId}-${suggestion.logId || ''}`}
                    className={`px-3 py-2 cursor-pointer flex items-center gap-2 ${
                      index === selectedSuggestionIndex 
                        ? 'bg-cyber-green/20 text-white' 
                        : 'hover:bg-dark-hover text-gray-300'
                    }`}
                    onClick={() => insertSuggestion(suggestion)}
                  >
                    <div 
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: suggestion.color }}
                    />
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      suggestion.type === 'project' 
                        ? 'bg-cyber-purple/20 text-cyber-purple' 
                        : 'bg-cyber-cyan/20 text-cyber-cyan'
                    }`}>
                      {suggestion.type === 'project' ? 'P' : 'L'}
                    </span>
                    <span className="truncate">{suggestion.display}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Preview (Right) */}
        <div className="w-1/2 flex flex-col bg-dark-card">
          <div className="px-4 py-2 bg-dark-card border-b border-dark-border text-xs text-gray-500 font-medium">
            プレビュー
          </div>
          <div className="flex-1 overflow-auto p-4">
            {content ? (
              <div className="markdown-body prose prose-invert max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      const isInline = !match;
                      
                      return isInline ? (
                        <code className="px-1.5 py-0.5 bg-dark-bg rounded text-cyber-cyan font-mono text-sm" {...props}>
                          {children}
                        </code>
                      ) : (
                        <SyntaxHighlighter
                          style={vscDarkPlus}
                          language={match[1]}
                          PreTag="div"
                          customStyle={{
                            margin: '1em 0',
                            borderRadius: '8px',
                            fontSize: '0.9em',
                          }}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      );
                    },
                    p: ({ children }) => {
                      if (typeof children === 'string' || (Array.isArray(children) && children.some(c => typeof c === 'string' && c.includes('{{LINK:')))) {
                        const processChildren = (child: React.ReactNode): React.ReactNode => {
                          if (typeof child === 'string') {
                            const parts = child.split(/(\{\{LINK:[^}]+\}\})/g);
                            return parts.map((part, i) => {
                              const linkMatch = part.match(/\{\{LINK:([^}]+)\}\}/);
                              if (linkMatch) {
                                const linkText = linkMatch[1];
                                const resolved = resolveLink(linkText);
                                const isValid = resolved.type !== 'invalid';
                                
                                return (
                                  <button
                                    key={i}
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      if (resolved.type === 'project' && resolved.projectId) {
                                        onNavigateToProject(resolved.projectId);
                                      } else if (resolved.type === 'log' && resolved.projectId && resolved.logId) {
                                        onNavigateToLog(resolved.projectId, resolved.logId);
                                      }
                                    }}
                                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-sm ${
                                      isValid 
                                        ? 'bg-cyber-purple/20 text-cyber-purple hover:bg-cyber-purple/30 cursor-pointer' 
                                        : 'bg-red-500/20 text-red-400 cursor-not-allowed'
                                    }`}
                                    disabled={!isValid}
                                    title={isValid ? `${resolved.type === 'project' ? 'プロジェクト' : 'ログ'}へ移動` : 'リンク先が見つかりません'}
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                    </svg>
                                    {linkText}
                                  </button>
                                );
                              }
                              return part;
                            });
                          }
                          return child;
                        };
                        
                        return (
                          <p className="text-gray-300 mb-4 leading-relaxed">
                            {Array.isArray(children) 
                              ? children.map((child, i) => <span key={i}>{processChildren(child)}</span>)
                              : processChildren(children)
                            }
                          </p>
                        );
                      }
                      return <p className="text-gray-300 mb-4 leading-relaxed">{children}</p>;
                    },
                    h1: ({ children }) => (
                      <h1 className="text-2xl font-bold text-white mt-6 mb-3 pb-2 border-b border-dark-border first:mt-0">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-xl font-bold text-white mt-5 mb-2 first:mt-0">{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-lg font-semibold text-white mt-4 mb-2 first:mt-0">{children}</h3>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside mb-4 space-y-1 text-gray-300">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-inside mb-4 space-y-1 text-gray-300">{children}</ol>
                    ),
                    li: ({ children }) => <li className="text-gray-300">{children}</li>,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-cyber-green pl-4 my-4 text-gray-400 italic">
                        {children}
                      </blockquote>
                    ),
                    a: ({ href, children }) => (
                      <a
                        href={href}
                        className="text-cyber-cyan hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {children}
                      </a>
                    ),
                    img: ImageComponent,
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-4">
                        <table className="min-w-full border border-dark-border rounded-lg overflow-hidden">
                          {children}
                        </table>
                      </div>
                    ),
                    thead: ({ children }) => (
                      <thead className="bg-dark-border">{children}</thead>
                    ),
                    th: ({ children }) => (
                      <th className="px-4 py-2 text-left text-sm font-semibold text-white border-b border-dark-border">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="px-4 py-2 text-sm text-gray-300 border-b border-dark-border">
                        {children}
                      </td>
                    ),
                    hr: () => <hr className="my-6 border-dark-border" />,
                  }}
                >
                  {previewMarkdown}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="text-gray-500 whitespace-pre-line">{placeholder}</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Status bar */}
      <div className="flex-shrink-0 border-t border-dark-border px-4 py-1 flex items-center justify-between text-xs text-gray-500 bg-dark-bg">
        <div className="flex items-center gap-4">
          <span>{content.length} 文字</span>
          <span>{content.split('\n').length} 行</span>
        </div>
        <div>
          リアルタイムプレビュー • 自動保存
        </div>
      </div>
    </div>
  );
}
