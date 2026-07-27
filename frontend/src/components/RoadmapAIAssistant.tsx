import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, History, LoaderCircle, Plus, Send, Sparkles, Trash2, X, Pencil } from 'lucide-react';
import { apiRequest, getApiErrorMessage } from '../lib/api';
import { MarkdownRenderer } from './blocks';
import type { DraftOutline, EditorChatResponse, EditorMessage } from '../types/roadmap';

interface ChatThread {
  id: string;
  title: string;
  createdAt: number;
  messages: EditorMessage[];
}

interface RoadmapAIAssistantProps {
  draftId: string;
  draft: DraftOutline;
  onUpdateDraft: (updatedDraft: DraftOutline) => void;
  isOpen: boolean;
  onClose: () => void;
  width: number;
  setWidth: (width: number) => void;
}

const makeMessage = (role: 'assistant' | 'user', content: string): EditorMessage => ({
  id: `${role}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
  role,
  content,
});

export const RoadmapAIAssistant = ({
  draftId,
  draft: _draft,
  onUpdateDraft,
  isOpen,
  onClose,
  width,
  setWidth,
}: RoadmapAIAssistantProps) => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<EditorMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [chatError, setChatError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Thread History state
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getInitialMessage = useCallback(
    () => makeMessage('assistant', t('roadmap.aiAssistantWelcome')),
    [t]
  );

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatting]);

  // Load chat threads from local storage
  useEffect(() => {
    if (!draftId) return;
    const storageKey = `tutorme_roadmap_threads_${draftId}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed: ChatThread[] = JSON.parse(stored);
        setThreads(parsed);
        if (parsed.length > 0) {
          setActiveThreadId(parsed[0].id);
          setMessages(parsed[0].messages);
          return;
        }
      } catch {
        // Fallback to initial message
      }
    }
    const defaultMsg = getInitialMessage();
    setMessages([defaultMsg]);
  }, [draftId, getInitialMessage]);

  const saveThreads = (updatedThreads: ChatThread[]) => {
    if (!draftId) return;
    setThreads(updatedThreads);
    localStorage.setItem(`tutorme_roadmap_threads_${draftId}`, JSON.stringify(updatedThreads));
  };

  const handleCreateNewThread = () => {
    const defaultMsg = getInitialMessage();
    const newThread: ChatThread = {
      id: `thread-${Date.now()}`,
      title: `Chat ${threads.length + 1}`,
      createdAt: Date.now(),
      messages: [defaultMsg],
    };
    const updated = [newThread, ...threads];
    saveThreads(updated);
    setActiveThreadId(newThread.id);
    setMessages(newThread.messages);
    setIsHistoryOpen(false);
  };

  const handleSwitchThread = (threadId: string) => {
    const thread = threads.find((t) => t.id === threadId);
    if (thread) {
      setActiveThreadId(thread.id);
      setMessages(thread.messages);
      setIsHistoryOpen(false);
    }
  };

  const handleDeleteThread = (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = threads.filter((t) => t.id !== threadId);
    saveThreads(updated);
    if (activeThreadId === threadId) {
      if (updated.length > 0) {
        setActiveThreadId(updated[0].id);
        setMessages(updated[0].messages);
      } else {
        handleCreateNewThread();
      }
    }
  };

  const handleStartRename = (threadId: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingThreadId(threadId);
    setEditingTitle(currentTitle);
  };

  const handleSaveRename = (threadId: string, e: React.FormEvent | React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!editingTitle.trim()) return;
    const updated = threads.map((t) => (t.id === threadId ? { ...t, title: editingTitle.trim() } : t));
    saveThreads(updated);
    setEditingThreadId(null);
    setEditingTitle('');
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingThreadId(null);
    setEditingTitle('');
  };

  // Resize handler for desktop sidebar
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth > 280 && newWidth < 700) setWidth(newWidth);
      }
    };
    const handleMouseUp = () => setIsDragging(false);
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.userSelect = '';
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, setWidth]);

  const handleSendMessage = async (promptText?: string) => {
    const question = (promptText || chatInput).trim();
    if (!question || isChatting || !draftId) return;

    setChatInput('');
    setChatError('');
    const userMsg = makeMessage('user', question);
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsChatting(true);

    if (activeThreadId) {
      const updatedThreads = threads.map((t) =>
        t.id === activeThreadId ? { ...t, messages: updatedMessages } : t
      );
      saveThreads(updatedThreads);
    }

    try {
      const response = await apiRequest<EditorChatResponse>(
        `/generation/outline/${encodeURIComponent(draftId)}/chat`,
        {
          method: 'POST',
          body: {
            messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          },
        }
      );

      const assistantMsg = makeMessage('assistant', response.reply || 'Course outline updated!');
      const finalMessages = [...updatedMessages, assistantMsg];
      setMessages(finalMessages);

      if (activeThreadId) {
        const updatedThreads = threads.map((t) =>
          t.id === activeThreadId ? { ...t, messages: finalMessages } : t
        );
        saveThreads(updatedThreads);
      }

      if (response.draft && response.draft.modules) {
        onUpdateDraft(response.draft);
      }
    } catch (err) {
      setChatError(getApiErrorMessage(err, t('roadmap.aiAssistantError')));
    } finally {
      setIsChatting(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void handleSendMessage();
  };

  const suggestions = [
    t('roadmap.suggestionAddProject'),
    t('roadmap.suggestionSimplify'),
    t('roadmap.suggestionAddIntro'),
  ];

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-sm lg:hidden transition-opacity duration-300 ease-in-out ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Right Sidebar */}
      <aside
        style={{ width: isOpen ? `${width}px` : undefined }}
        className={`fixed inset-y-0 right-0 z-50 h-full max-w-[92vw] sm:max-w-[90vw] bg-purple-50/95 dark:bg-gray-800/95 shadow-2xl transition-all duration-300 ease-in-out lg:relative lg:z-30 lg:shadow-[-4px_0_24px_rgba(0,0,0,0.02)] lg:bg-purple-50/50 lg:dark:bg-gray-800/40 backdrop-blur-xl border-dashed border-gray-300 dark:border-gray-700 flex-shrink-0 flex flex-col ${
          isOpen
            ? 'translate-x-0 opacity-100 pointer-events-auto border-l-2 lg:w-[340px]'
            : 'translate-x-full opacity-0 pointer-events-none lg:translate-x-0 lg:w-0 lg:max-w-0 lg:overflow-hidden lg:border-l-0'
        }`}
      >
        {/* Resize handle */}
        <div
          onMouseDown={() => setIsDragging(true)}
          className={`absolute top-0 -left-2 bottom-0 w-4 cursor-col-resize hover:bg-purple-500/20 active:bg-purple-500/40 z-50 transition-colors hidden lg:block ${
            isDragging ? 'bg-purple-500/40' : ''
          }`}
        />

        <div className="flex flex-col h-full p-4 sm:p-6 min-w-[280px] sm:min-w-[320px] relative">
          {/* Header */}
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h2 className="text-2xl sm:text-3xl font-['Kalam',cursive] font-bold text-purple-600 dark:text-purple-400 flex items-center gap-2 sm:gap-3 tracking-wide transform -rotate-1">
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 fill-purple-500 text-purple-500 shrink-0" />
              {t('roadmap.aiAssistantTitle')}
            </h2>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={handleCreateNewThread}
                title="New Chat"
                className="text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 bg-white/50 dark:bg-gray-800/50 rounded-full p-1.5 sm:p-2 border border-gray-200 dark:border-gray-700 shadow-sm transition-all hover:scale-105"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              <button
                onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                title="Chat History"
                className={`text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 bg-white/50 dark:bg-gray-800/50 rounded-full p-1.5 sm:p-2 border border-gray-200 dark:border-gray-700 shadow-sm transition-all hover:scale-105 ${
                  isHistoryOpen ? 'bg-purple-100 dark:bg-purple-900 border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400' : ''
                }`}
              >
                <History className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-white/50 dark:bg-gray-800/50 rounded-full p-1"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>

          {/* History Overlay */}
          {isHistoryOpen && (
            <div className="absolute top-[80px] left-6 right-6 bg-white/95 dark:bg-gray-900/95 border-4 border-purple-300 dark:border-purple-800 rounded-3xl p-4 shadow-[8px_8px_0_#c084fc] z-50 max-h-[300px] overflow-y-auto custom-scrollbar flex flex-col gap-2 transition-all">
              <div className="flex justify-between items-center mb-2 pb-2 border-b-2 border-dashed border-gray-200 dark:border-gray-700">
                <span className="font-['Kalam',cursive] font-bold text-lg text-purple-950 dark:text-purple-100">
                  Chat History
                </span>
                <button
                  onClick={() => setIsHistoryOpen(false)}
                  className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
                >
                  Close
                </button>
              </div>
              {threads.length === 0 ? (
                <p className="text-sm font-semibold text-gray-400 dark:text-gray-500 py-4 text-center">
                  No chat history yet.
                </p>
              ) : (
                threads.map((thread) => (
                  <div
                    key={thread.id}
                    onClick={() => {
                      if (editingThreadId !== thread.id) {
                        handleSwitchThread(thread.id);
                      }
                    }}
                    className={`group flex items-center justify-between p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                      thread.id === activeThreadId
                        ? 'bg-purple-100 dark:bg-purple-900/40 border-purple-400 dark:border-purple-700 text-purple-900 dark:text-purple-100'
                        : 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {editingThreadId === thread.id ? (
                      <div className="flex items-center gap-2 w-full" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(thread.id, e);
                            else if (e.key === 'Escape') handleCancelRename(e as any);
                          }}
                          className="flex-1 bg-white dark:bg-gray-800 border-2 border-purple-400 rounded-xl px-2 py-1 text-sm font-bold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
                          autoFocus
                        />
                        <button
                          onClick={(e) => handleSaveRename(thread.id, e)}
                          className="p-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                          title="Save"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancelRename}
                          className="p-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-lg transition-colors"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-col gap-0.5 overflow-hidden flex-1 pr-2">
                          <span className="text-sm font-bold truncate">{thread.title}</span>
                          <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500">
                            {new Date(thread.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => handleStartRename(thread.id, thread.title, e)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-purple-600 dark:text-gray-500 dark:hover:text-purple-400 hover:bg-white dark:hover:bg-gray-700 transition-all"
                            title="Rename Chat"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteThread(thread.id, e)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 hover:bg-white dark:hover:bg-gray-700 transition-all"
                            title="Delete Chat"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-4 pb-4 pr-1 custom-scrollbar" aria-live="polite">
            {messages.map((message) =>
              message.role === 'assistant' ? (
                <div
                  key={message.id}
                  className="bg-white dark:bg-gray-800 border-4 border-purple-200 dark:border-purple-800/60 p-4 rounded-3xl rounded-tl-none shadow-[4px_4px_0px_0px_rgba(233,213,255,1)] dark:shadow-[4px_4px_0px_0px_rgba(88,28,135,0.6)] mr-4 text-sm font-semibold text-gray-800 dark:text-gray-200"
                >
                  <MarkdownRenderer content={message.content} />
                </div>
              ) : (
                <div
                  key={message.id}
                  className="bg-purple-100 dark:bg-purple-900/50 border-4 border-purple-300 dark:border-purple-700 p-4 rounded-3xl rounded-tr-none shadow-[4px_4px_0px_0px_rgba(192,132,252,1)] dark:shadow-[4px_4px_0px_0px_rgba(126,34,206,0.8)] ml-4 text-sm font-semibold text-purple-950 dark:text-purple-100 self-end transform rotate-1"
                >
                  <MarkdownRenderer content={message.content} />
                </div>
              )
            )}
            {isChatting && (
              <div className="bg-white dark:bg-gray-800 border-4 border-purple-200 dark:border-purple-800 p-4 rounded-3xl rounded-tl-none shadow-[4px_4px_0px_0px_rgba(233,213,255,1)] mr-4 inline-flex items-center gap-2 font-bold text-purple-700 dark:text-purple-300">
                <LoaderCircle className="h-5 w-5 animate-spin text-purple-500" />
                {t('roadmap.aiAssistantUpdating')}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions */}
          {messages.length <= 2 && !isChatting && (
            <div className="mb-3 flex flex-wrap gap-1.5 sm:gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => void handleSendMessage(suggestion)}
                  className="text-xs font-bold rounded-xl border-2 border-purple-300 bg-white/80 dark:bg-gray-800/80 dark:border-purple-700 px-3 py-1.5 text-purple-800 dark:text-purple-200 hover:bg-purple-100 dark:hover:bg-purple-950/50 shadow-sm transition-all text-left"
                >
                  ✨ {suggestion}
                </button>
              ))}
            </div>
          )}

          {chatError && (
            <p role="alert" className="mb-2 rounded-xl border-2 border-red-300 bg-red-50 p-3 font-bold text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200 text-xs sm:text-sm">
              {chatError}
            </p>
          )}

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="mt-1 relative">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={isChatting}
              placeholder={t('roadmap.aiAssistantPlaceholder')}
              className="w-full pl-3.5 sm:pl-5 pr-11 sm:pr-14 py-2.5 sm:py-3.5 border-3 sm:border-4 border-purple-200 dark:border-purple-800/50 rounded-full bg-white/90 dark:bg-gray-900/90 focus:outline-none focus:border-purple-400 dark:focus:border-purple-500 focus:ring-4 focus:ring-purple-200 dark:focus:ring-purple-900/50 font-bold text-gray-700 dark:text-gray-200 text-xs sm:text-base placeholder-gray-400 transition-all shadow-inner disabled:opacity-60 disabled:cursor-not-allowed"
            />
            <div className="absolute right-1.5 sm:right-2 top-1/2 transform -translate-y-1/2 flex">
              <button
                type="submit"
                disabled={!chatInput.trim() || isChatting}
                className="bg-purple-500 hover:bg-purple-600 text-white p-2 sm:p-2.5 rounded-full shadow-[0_3px_0px_0px_rgba(126,34,206,1)] sm:shadow-[0_4px_0px_0px_rgba(126,34,206,1)] active:translate-y-1 active:shadow-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </form>
        </div>
      </aside>
    </>
  );
};
