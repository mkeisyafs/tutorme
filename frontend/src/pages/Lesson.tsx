import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BlockRenderer, MarkdownRenderer } from '../components/BlockRenderer';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  History,
  LoaderCircle,
  Lock,
  MessageCircle,
  Minus,
  Pencil,
  Play,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  Video,
  X,
  Plus,
} from 'lucide-react';
import { useAuth } from '../auth/useAuth';
import { CourseSidebar } from '../components/CourseSidebar';
import { useCourseSidebar } from '../hooks/useCourseSidebar';
import { apiRequest, getApiErrorMessage } from '../lib/api';

import type {
  LessonGenerationStatus,
  LessonRecord,
  QuizGenerationStatus,
  TutorMessage,
  TutorResponse,
} from '../types/lesson';

interface ChatThread {
  id: string;
  title: string;
  createdAt: number;
  messages: TutorMessage[];
}

function makeMessage(role: TutorMessage['role'], content: string): TutorMessage {
  return {
    id: role + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
    role,
    content,
  };
}

function getYouTubeId(url: string | null): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

const initialQuizStatus: QuizGenerationStatus = {
  state: 'blocked',
  isGenerated: false,
  isGenerating: false,
  reason: 'Generate this lesson before its quiz can be created.',
};

const quizGenerationSteps = [
  'Reviewing this lesson',
  'Writing thoughtful questions',
  'Preparing answer guidance',
  'Getting your quiz ready',
];

const Lesson = () => {
  const navigate = useNavigate();
  const { courseId: routeCourseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const { user } = useAuth();

  const [lesson, setLesson] = useState<LessonRecord | null>(null);
  const [generationStatus, setGenerationStatus] = useState<LessonGenerationStatus | null>(null);
  const [quizStatus, setQuizStatus] = useState<QuizGenerationStatus>(initialQuizStatus);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isQuizGenerationModalOpen, setIsQuizGenerationModalOpen] = useState(false);
  const [quizGenerationStep, setQuizGenerationStep] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState('');
  const [chatError, setChatError] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const courseId = routeCourseId || lesson?.module?.courseId || '';
  const { courseModules, completedLessonIds, setCompletedLessonIds, orderedLessons, progressPercent, allDone, refreshProgress } = useCourseSidebar(courseId);

  useEffect(() => {
    if (lessonId) setIsCompleted(completedLessonIds.has(lessonId));
  }, [completedLessonIds, lessonId]);

  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [rightSidebarWidth, setRightSidebarWidth] = useState(340);
  const [isDraggingRight, setIsDraggingRight] = useState(false);

  const isLessonReady = Boolean(lesson?.content) || generationStatus?.state === 'ready';
  const isQuizReady = quizStatus.state === 'ready' && Boolean(quizStatus.quizId);

  const currentLessonIndex = useMemo(
    () => orderedLessons.findIndex((l) => l.id === lessonId),
    [orderedLessons, lessonId]
  );

  const prevLesson = currentLessonIndex > 0 ? orderedLessons[currentLessonIndex - 1] : null;
  const nextLesson =
    currentLessonIndex >= 0 && currentLessonIndex < orderedLessons.length - 1
      ? orderedLessons[currentLessonIndex + 1]
      : null;
  const isNextLessonAccessible = Boolean(nextLesson) && (isCompleted || Boolean(nextLesson?.isGenerated));

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRight) {
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth > 250 && newWidth < 800) setRightSidebarWidth(newWidth);
      }
    };
    const handleMouseUp = () => { setIsDraggingRight(false); };
    if (isDraggingRight) {
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
  }, [isDraggingRight]);

  const refreshStatuses = useCallback(async () => {
    if (!lessonId) return;
    const [nextLessonStatus, nextQuizStatus] = await Promise.all([
      apiRequest<LessonGenerationStatus>('/generation/lesson/' + encodeURIComponent(lessonId) + '/status'),
      apiRequest<QuizGenerationStatus>('/generation/lesson/' + encodeURIComponent(lessonId) + '/quiz-status'),
    ]);
    setGenerationStatus(nextLessonStatus);
    setQuizStatus(nextQuizStatus);
    if (nextLessonStatus.state === 'ready') {
      const nextLesson = await apiRequest<LessonRecord>('/lessons/' + encodeURIComponent(lessonId));
      setLesson(nextLesson);
    }
  }, [lessonId]);

  const loadLesson = useCallback(async () => {
    if (!lessonId) {
      setError('This lesson link is missing its lesson ID.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const [nextLesson, nextLessonStatus, nextQuizStatus] = await Promise.all([
        apiRequest<LessonRecord>('/lessons/' + encodeURIComponent(lessonId)),
        apiRequest<LessonGenerationStatus>('/generation/lesson/' + encodeURIComponent(lessonId) + '/status'),
        apiRequest<QuizGenerationStatus>('/generation/lesson/' + encodeURIComponent(lessonId) + '/quiz-status'),
      ]);
      setLesson(nextLesson);
      setGenerationStatus(nextLessonStatus);
      setQuizStatus(nextQuizStatus);
      await refreshProgress();
      if (nextLesson.content) {
        setMessages([makeMessage('assistant', "Hello! I'm your AI learning assistant. Ask me anything about this lesson.")]);
      } else {
        const storageKey = `tutorme_ai_chat_${lessonId}`;
        const stored = localStorage.getItem(storageKey);
        let initialMessages = [makeMessage('assistant', "Hello! I'm your AI learning assistant. Ask me anything about this lesson.")];
        if (stored) {
          try {
            initialMessages = JSON.parse(stored);
          } catch {}
        }
        setMessages(initialMessages);
        setThreads([]);
        setActiveThreadId(null);
      }
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'We could not load this lesson.'));
    } finally {
      setIsLoading(false);
    }
  }, [lessonId, refreshProgress]);

  useEffect(() => { void loadLesson(); }, [loadLesson]);

  // Course sidebar handles fetching course detail

  useEffect(() => {
    if (!lessonId || (!isGenerating && !quizStatus.isGenerating && quizStatus.state !== 'queued')) return;
    const interval = window.setInterval(() => { void refreshStatuses().catch(() => undefined); }, 2500);
    return () => window.clearInterval(interval);
  }, [isGenerating, lessonId, quizStatus.isGenerating, quizStatus.state, refreshStatuses]);

  useEffect(() => {
    if (!isQuizGenerationModalOpen || quizStatus.state === 'failed' || isQuizReady) return;
    const timer = window.setTimeout(() => {
      setQuizGenerationStep((step) => Math.min(step + 1, 3));
    }, 900);
    return () => window.clearTimeout(timer);
  }, [isQuizGenerationModalOpen, isQuizReady, quizGenerationStep, quizStatus.state]);

  useEffect(() => {
    if (!isQuizGenerationModalOpen || !isQuizReady || !courseId || !quizStatus.quizId) return;
    navigate('/courses/' + encodeURIComponent(courseId) + '/quizzes/' + encodeURIComponent(quizStatus.quizId));
  }, [courseId, isQuizGenerationModalOpen, isQuizReady, navigate, quizStatus.quizId]);

  const handleGenerateLesson = async () => {
    if (!lessonId || isGenerating) return;
    setError('');
    setIsGenerating(true);
    try {
      const generatedLesson = await apiRequest<LessonRecord>(
        '/generation/lesson/' + encodeURIComponent(lessonId) + '/generate',
        { method: 'POST' }
      );
      setLesson(generatedLesson);
      setMessages([makeMessage('assistant', 'Your lesson is ready! I can help explain the material, examples, and exercises on this page.')]);
      await refreshStatuses();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'The lesson could not be generated. Please try again.'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleLessonCompletion = async () => {
    if (!lessonId || !user?.id || isCompleting || (!isLessonReady && !isCompleted)) return;
    const nextIsCompleted = !isCompleted;
    setError('');
    setIsCompleting(true);
    try {
      await apiRequest('/lesson-progress', {
        method: 'POST',
        body: { userId: user.id, lessonId, status: nextIsCompleted ? 'COMPLETED' : 'IN_PROGRESS' },
      });
      setIsCompleted(nextIsCompleted);
      setCompletedLessonIds((previous) => {
        const next = new Set(previous);
        if (nextIsCompleted) {
          next.add(lessonId);
        } else {
          next.delete(lessonId);
        }
        return next;
      });
    } catch (requestError) {
      setError(getApiErrorMessage(
        requestError,
        nextIsCompleted ? 'We could not save your lesson completion.' : 'We could not mark this lesson as incomplete.'
      ));
    } finally {
      setIsCompleting(false);
    }
  };

  const handleGoToQuiz = () => {
    if (!courseId || !quizStatus.quizId) return;
    navigate('/courses/' + encodeURIComponent(courseId) + '/quizzes/' + encodeURIComponent(quizStatus.quizId));
  };

  const handleStartQuiz = async () => {
    if (!lessonId) return;
    setError('');
    setQuizGenerationStep(0);
    setIsQuizGenerationModalOpen(true);
    try {
      const nextQuizStatus = await apiRequest<QuizGenerationStatus>(
        '/generation/lesson/' + encodeURIComponent(lessonId) + '/quiz/generate',
        { method: 'POST' }
      );
      setQuizStatus(nextQuizStatus);
    } catch (requestError) {
      setIsQuizGenerationModalOpen(false);
      setError(getApiErrorMessage(requestError, 'The quiz could not be started. Please try again.'));
    }
  };

  const handleNextLesson = () => {
    if (!nextLesson || !isNextLessonAccessible) return;
    const cid = routeCourseId || lesson?.module?.courseId || '';
    navigate(`/courses/${encodeURIComponent(cid)}/lessons/${encodeURIComponent(nextLesson.id)}`);
  };

  const handlePrevLesson = () => {
    if (!prevLesson) return;
    const cid = routeCourseId || lesson?.module?.courseId || '';
    navigate(`/courses/${encodeURIComponent(cid)}/lessons/${encodeURIComponent(prevLesson.id)}`);
  };

  const updateThreadMessages = (activeCourseId: string, threadId: string, nextMessages: TutorMessage[]) => {
    setThreads((prevThreads) => {
      const nextThreads = prevThreads.map((thread) => {
        if (thread.id !== threadId) return thread;
        
        let title = thread.title;
        if (title === 'New Chat' || title === 'Chat Session 1') {
          const userMsg = nextMessages.find(m => m.role === 'user');
          if (userMsg) {
            title = userMsg.content.slice(0, 30) + (userMsg.content.length > 30 ? '...' : '');
          }
        }
        
        return { ...thread, messages: nextMessages, title };
      });
      localStorage.setItem(`tutorme_ai_chats_${activeCourseId}`, JSON.stringify(nextThreads));
      return nextThreads;
    });
  };

  const handleTutorMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = chatInput.trim();
    if (!lessonId || !content || !isLessonReady || isChatting) return;
    const userMessage = makeMessage('user', content);
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    
    const activeCourseId = routeCourseId || lesson?.module?.courseId || '';
    if (activeCourseId && activeThreadId) {
      updateThreadMessages(activeCourseId, activeThreadId, nextMessages);
    } else {
      const storageKey = `tutorme_ai_chat_${lessonId}`;
      localStorage.setItem(storageKey, JSON.stringify(nextMessages));
    }
    
    setChatInput('');
    setChatError('');
    setIsChatting(true);
    try {
      const response = await apiRequest<TutorResponse>(
        '/generation/lesson/' + encodeURIComponent(lessonId) + '/chat',
        { method: 'POST', body: { messages: nextMessages.map(({ role, content: c }) => ({ role, content: c })) } }
      );
      const reply = response.reply?.trim();
      if (!reply) throw new Error('The lesson assistant did not return a response.');
      const assistantMessage = makeMessage('assistant', reply);
      setMessages((cur) => {
        const updated = [...cur, assistantMessage];
        if (activeCourseId && activeThreadId) {
          updateThreadMessages(activeCourseId, activeThreadId, updated);
        } else {
          const storageKey = `tutorme_ai_chat_${lessonId}`;
          localStorage.setItem(storageKey, JSON.stringify(updated));
        }
        return updated;
      });
    } catch (requestError) {
      setChatError(getApiErrorMessage(requestError, 'The AI assistant could not answer that question.'));
    } finally {
      setIsChatting(false);
    }
  };

  const handleCreateNewThread = () => {
    const activeCourseId = routeCourseId || lesson?.module?.courseId || '';
    if (!activeCourseId) return;
    
    const newThread: ChatThread = {
      id: 'thread_' + Date.now(),
      title: 'New Chat',
      createdAt: Date.now(),
      messages: [makeMessage('assistant', "Hello! I'm your AI learning assistant. Ask me anything about this lesson.")]
    };
    
    const nextThreads = [...threads, newThread];
    setThreads(nextThreads);
    setActiveThreadId(newThread.id);
    setMessages(newThread.messages);
    localStorage.setItem(`tutorme_ai_chats_${activeCourseId}`, JSON.stringify(nextThreads));
    localStorage.setItem(`tutorme_active_chat_thread_${activeCourseId}`, newThread.id);
    setIsHistoryOpen(false);
  };

  const handleDeleteThread = (threadId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const activeCourseId = routeCourseId || lesson?.module?.courseId || '';
    if (!activeCourseId) return;
    
    const nextThreads = threads.filter(t => t.id !== threadId);
    setThreads(nextThreads);
    
    let nextActiveId = activeThreadId;
    if (activeThreadId === threadId) {
      if (nextThreads.length > 0) {
        nextActiveId = nextThreads[0].id;
        setMessages(nextThreads[0].messages);
      } else {
        const defaultThread: ChatThread = {
          id: 'thread_' + Date.now(),
          title: 'New Chat',
          createdAt: Date.now(),
          messages: [makeMessage('assistant', "Hello! I'm your AI learning assistant. Ask me anything about this lesson.")]
        };
        nextThreads.push(defaultThread);
        setThreads(nextThreads);
        nextActiveId = defaultThread.id;
        setMessages(defaultThread.messages);
      }
    }
    
    setActiveThreadId(nextActiveId);
    localStorage.setItem(`tutorme_ai_chats_${activeCourseId}`, JSON.stringify(nextThreads));
    if (nextActiveId) {
      localStorage.setItem(`tutorme_active_chat_thread_${activeCourseId}`, nextActiveId);
    } else {
      localStorage.removeItem(`tutorme_active_chat_thread_${activeCourseId}`);
    }
  };

  const handleSwitchThread = (threadId: string) => {
    const activeCourseId = routeCourseId || lesson?.module?.courseId || '';
    if (!activeCourseId) return;
    
    setActiveThreadId(threadId);
    localStorage.setItem(`tutorme_active_chat_thread_${activeCourseId}`, threadId);
    const target = threads.find(t => t.id === threadId);
    setMessages(target ? target.messages : []);
    setIsHistoryOpen(false);
  };

  const handleStartRename = (threadId: string, currentTitle: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setEditingThreadId(threadId);
    setEditingTitle(currentTitle);
  };

  const handleSaveRename = (threadId: string, event: React.MouseEvent | React.KeyboardEvent) => {
    event.stopPropagation();
    const activeCourseId = routeCourseId || lesson?.module?.courseId || '';
    if (!activeCourseId) return;

    const trimmed = editingTitle.trim();
    if (!trimmed) return;

    const nextThreads = threads.map((t) => {
      if (t.id === threadId) {
        return { ...t, title: trimmed };
      }
      return t;
    });

    setThreads(nextThreads);
    setEditingThreadId(null);
    localStorage.setItem(`tutorme_ai_chats_${activeCourseId}`, JSON.stringify(nextThreads));
  };

  const handleCancelRename = (event: React.MouseEvent) => {
    event.stopPropagation();
    setEditingThreadId(null);
    setEditingTitle('');
  };

  const lessonContent = useMemo(() => lesson?.content?.trim() || '', [lesson?.content]);

  if (isLoading) {
    return (
      <main className="min-h-screen grid place-items-center bg-gray-50 p-6 font-['Nunito',sans-serif] dark:bg-gray-900">
        <div className="rounded-3xl border-4 border-blue-300 bg-white p-10 text-center shadow-[8px_8px_0_#60a5fa] dark:border-blue-800 dark:bg-gray-800">
          <LoaderCircle className="mx-auto h-12 w-12 animate-spin text-blue-500" />
          <h1 className="mt-4 font-['Kalam',cursive] text-3xl font-bold text-gray-900 dark:text-white">Loading lesson</h1>
        </div>
      </main>
    );
  }

  if (error && !lesson) {
    return (
      <main className="min-h-screen grid place-items-center bg-gray-50 p-6 font-['Nunito',sans-serif] dark:bg-gray-900">
        <section className="max-w-lg rounded-3xl border-4 border-red-300 bg-white p-10 text-center shadow-[8px_8px_0_#f87171] dark:border-red-800 dark:bg-gray-800">
          <CircleAlert className="mx-auto h-12 w-12 text-red-500" />
          <h1 className="mt-4 font-['Kalam',cursive] text-3xl font-bold text-gray-900 dark:text-white">Lesson unavailable</h1>
          <p role="alert" className="mt-3 font-bold text-red-700 dark:text-red-300">{error}</p>
          <button onClick={() => void loadLesson()} className="mt-6 inline-flex items-center gap-2 rounded-xl border-2 border-blue-700 bg-blue-500 px-5 py-3 font-['Kalam',cursive] text-lg font-bold text-white shadow-[2px_2px_0_#1d4ed8]">
            <RefreshCw className="h-5 w-5" /> Try again
          </button>
        </section>
      </main>
    );
  }

  return (
    <div className="h-screen w-full flex bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-['Nunito',sans-serif] overflow-hidden transition-colors duration-300 relative">

      <CourseSidebar
        courseModules={courseModules as any}
        completedLessonIds={completedLessonIds}
        orderedLessons={orderedLessons as any}
        progressPercent={progressPercent}
        allDone={allDone}
        activeLessonId={lessonId}
        courseId={courseId}
      />

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto relative p-8 md:p-12">
        <div className="max-w-5xl w-full mx-auto flex flex-col flex-1">

          {/* Breadcrumb & Actions */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400">
              <span className="hover:text-blue-500 cursor-pointer" onClick={() => navigate(-1)}>
                {lesson?.module?.title || 'Course'}
              </span>
              <ChevronRight className="w-4 h-4" />
              <span className="text-gray-800 dark:text-gray-200">{lesson?.title || 'Lesson'}</span>
            </div>
            {(isLessonReady || isCompleted) && (
              <button
                onClick={() => void handleToggleLessonCompletion()}
                disabled={isCompleting}
                aria-pressed={isCompleted}
                className="px-5 py-2 rounded-xl font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 shadow-[2px_2px_0px_0px_rgba(156,163,175,1)] dark:shadow-[2px_2px_0px_0px_rgba(75,85,99,1)] transition-all active:translate-y-0.5 active:shadow-none flex items-center gap-2 disabled:opacity-60 disabled:cursor-default"
              >
                {isCompleting ? (
                  <LoaderCircle className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle2 className={`w-5 h-5 ${isCompleted ? 'text-green-500' : 'text-gray-400'}`} />
                )}
                {isCompleted ? 'Mark incomplete' : 'Mark complete'}
              </button>
            )}
          </div>

          {/* Video / Generate CTA */}
          {!isLessonReady ? (
            <div className="w-full aspect-video bg-gray-900 rounded-3xl border-4 border-gray-800 dark:border-gray-700 shadow-[8px_8px_0px_0px_rgba(31,41,55,1)] dark:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] mb-8 flex items-center justify-center relative overflow-hidden">
              <div className="flex flex-col items-center gap-4 z-20 px-6 text-center">
                {isGenerating ? (
                  <>
                    <LoaderCircle className="w-16 h-16 animate-spin text-pink-400" />
                    <h2 className="font-['Kalam',cursive] text-3xl font-bold text-white">Generating this lesson…</h2>
                    <p className="text-gray-300 font-semibold max-w-sm">Researching materials and preparing content. The quiz will start in the background afterward.</p>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-pink-500 rounded-full flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(190,24,93,1)]">
                      <Play className="w-10 h-10 text-white fill-white ml-2" />
                    </div>
                    <h2 className="font-['Kalam',cursive] text-3xl font-bold text-white">Ready to generate this lesson?</h2>
                    <p className="text-gray-300 font-semibold max-w-sm">TutorMe will generate this lesson's content, not the entire remaining course.</p>
                    <button
                      onClick={() => void handleGenerateLesson()}
                      className="mt-2 px-7 py-3 rounded-xl font-bold text-white bg-pink-500 hover:bg-pink-600 border-2 border-pink-700 shadow-[2px_2px_0_#be185d] flex items-center gap-2 font-['Kalam',cursive] text-lg"
                    >
                      <Play className="w-5 h-5 fill-current" /> Generate lesson
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : lesson?.videoUrl ? (() => {
            const ytId = getYouTubeId(lesson.videoUrl);
            const isDirectVideo = lesson.videoUrl.endsWith('.mp4') || lesson.videoUrl.endsWith('.webm') || lesson.videoUrl.endsWith('.ogg');

            if (ytId) {
              return (
                <div className="w-full aspect-video bg-gray-900 rounded-3xl border-4 border-gray-800 dark:border-gray-700 shadow-[8px_8px_0px_0px_rgba(31,41,55,1)] dark:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] mb-8 relative overflow-hidden">
                  <iframe
                    src={`https://www.youtube.com/embed/${ytId}?rel=0&showinfo=0`}
                    title={lesson.title || 'Supporting video'}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full border-none"
                  />
                </div>
              );
            }

            if (isDirectVideo) {
              return (
                <div className="w-full aspect-video bg-gray-900 rounded-3xl border-4 border-gray-800 dark:border-gray-700 shadow-[8px_8px_0px_0px_rgba(31,41,55,1)] dark:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] mb-8 relative overflow-hidden">
                  <video
                    src={lesson.videoUrl}
                    controls
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                </div>
              );
            }

            return (
              <a
                href={lesson.videoUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full aspect-video bg-gray-900 rounded-3xl border-4 border-gray-800 dark:border-gray-700 shadow-[8px_8px_0px_0px_rgba(31,41,55,1)] dark:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] mb-8 flex items-center justify-center relative overflow-hidden group cursor-pointer no-underline"
              >
                <div className="absolute inset-0 bg-blue-900/20 group-hover:bg-transparent transition-colors z-10"></div>
                <div className="w-20 h-20 bg-pink-500 rounded-full flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(190,24,93,1)] transform group-hover:scale-110 transition-transform z-20">
                  <Video className="w-10 h-10 text-white ml-1" />
                </div>
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center text-white z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="font-bold text-sm sm:text-base">{lesson.title} — Supporting video link</div>
                </div>
              </a>
            );
          })() : null}

          {/* Lesson Content */}
          {isLessonReady && (
            <div className="bg-white dark:bg-gray-800 p-8 md:p-12 rounded-3xl border-4 border-gray-300 dark:border-gray-700 shadow-[8px_8px_0px_0px_rgba(156,163,175,1)] dark:shadow-[8px_8px_0px_0px_rgba(55,65,81,0.8)] relative">
              <div className="absolute -top-4 -right-4 w-12 h-6 bg-yellow-400/80 dark:bg-yellow-500/40 transform rotate-12 backdrop-blur-sm shadow-sm pointer-events-none border-2 border-yellow-500 dark:border-yellow-600"></div>
              <h1 className="text-4xl font-['Kalam',cursive] font-bold text-gray-900 dark:text-gray-100 mb-6">{lesson?.title}</h1>
              <BlockRenderer content={lessonContent} />
            </div>
          )}

          {/* Error banner */}
          {error && (
            <p role="alert" className="mt-5 rounded-xl border-2 border-red-300 bg-red-50 p-4 font-bold text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">
              {error}
            </p>
          )}

          {/* Quiz Section */}
          <div className="mt-8 bg-purple-50 dark:bg-purple-950/30 p-6 rounded-3xl border-4 border-purple-300 dark:border-purple-800 shadow-[6px_6px_0_#c084fc] dark:shadow-[6px_6px_0_rgba(88,28,135,0.6)] relative">
            <div className="absolute -top-3 -right-3 w-10 h-5 bg-yellow-400/80 dark:bg-yellow-500/40 transform rotate-12 backdrop-blur-sm shadow-sm pointer-events-none border-2 border-yellow-500 dark:border-yellow-600"></div>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 font-['Kalam',cursive] text-2xl font-bold text-purple-950 dark:text-purple-100">
                  <ClipboardCheck className="h-6 w-6" /> Lesson Quiz
                </h2>
                <p className="mt-1 font-semibold text-purple-800 dark:text-purple-200">
                  {quizStatus.reason || (isQuizReady ? 'Your quiz is ready. You can take it without marking this lesson complete.' : 'Quiz status will appear after lesson generation.')}
                </p>
              </div>
              {isQuizReady ? (
                <button
                  onClick={handleGoToQuiz}
                  className="px-5 py-3 rounded-xl font-['Kalam',cursive] text-lg font-bold text-white bg-purple-500 hover:bg-purple-600 border-2 border-purple-700 shadow-[2px_2px_0_#7e22ce] transition-all active:translate-y-0.5 active:shadow-none"
                >
                  Take quiz
                </button>
              ) : quizStatus.state === 'failed' ? (
                <button
                  onClick={() => void handleStartQuiz()}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-['Kalam',cursive] text-lg font-bold text-white bg-purple-500 hover:bg-purple-600 border-2 border-purple-700 shadow-[2px_2px_0_#7e22ce] transition-all active:translate-y-0.5 active:shadow-none"
                >
                  <Sparkles className="h-5 w-5 fill-current" /> Start quiz
                </button>
              ) : quizStatus.isGenerating || quizStatus.state === 'queued' ? (
                <span className="inline-flex items-center gap-2 rounded-xl border-2 border-purple-300 bg-white px-4 py-3 font-bold text-purple-700 dark:border-purple-700 dark:bg-gray-900 dark:text-purple-200">
                  <LoaderCircle className="h-5 w-5 animate-spin" /> Generating quiz…
                </span>
              ) : (
                <span className="rounded-xl border-2 border-purple-200 bg-white px-4 py-3 font-bold text-purple-700 dark:border-purple-700 dark:bg-gray-900 dark:text-purple-200">
                  Waiting for lesson
                </span>
              )}
            </div>
          </div>

          {/* Prev / Next Navigation */}
          <div className="flex justify-between items-center mt-12 pb-12 gap-4">
            {/* Previous */}
            {prevLesson ? (
              <button
                onClick={handlePrevLesson}
                className="px-6 py-4 rounded-2xl font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 shadow-[4px_4px_0px_0px_rgba(156,163,175,1)] dark:shadow-[2px_2px_0px_0px_rgba(75,85,99,1)] hover:translate-y-0.5 hover:shadow-sm transition-all flex items-center gap-3 font-['Kalam',cursive] text-lg"
              >
                <ChevronLeft className="w-5 h-5" />
                Prev Lesson
              </button>
            ) : <div />}

            {/* Next / Final Exam */}
            {nextLesson ? (
              <div className="flex flex-col items-end gap-1">
                {!isNextLessonAccessible && (
                  <p className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Mark this lesson complete or generate the next lesson to unlock
                  </p>
                )}
                <button
                  onClick={handleNextLesson}
                  disabled={!isNextLessonAccessible}
                  className={`px-8 py-4 rounded-2xl font-bold border-2 transition-all flex items-center gap-3 font-['Kalam',cursive] text-xl ${
                    isNextLessonAccessible
                      ? 'text-blue-900 dark:text-blue-100 bg-blue-100 dark:bg-blue-900 border-blue-400 dark:border-blue-700 shadow-[4px_4px_0px_0px_rgba(96,165,250,1)] dark:shadow-[2px_2px_0px_0px_rgba(30,58,138,0.8)] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(96,165,250,1)]'
                      : 'text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 opacity-60 cursor-not-allowed'
                  }`}
                >
                  Next Lesson
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            ) : (allDone || isCompleted) && courseId ? (
              <button
                onClick={() => navigate('/courses/' + encodeURIComponent(courseId) + '/final-exam')}
                className="px-8 py-4 rounded-2xl font-bold text-blue-900 dark:text-blue-100 bg-blue-100 dark:bg-blue-900 border-2 border-blue-400 dark:border-blue-700 shadow-[4px_4px_0px_0px_rgba(96,165,250,1)] dark:shadow-[2px_2px_0px_0px_rgba(30,58,138,0.8)] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(96,165,250,1)] transition-all flex items-center gap-3 font-['Kalam',cursive] text-xl"
              >
                <MessageCircle className="w-6 h-6" />
                Final Exam
                <ChevronRight className="w-6 h-6" />
              </button>
            ) : null}
          </div>

        </div>
      </main>

      {/* Floating AI button */}
      {!isAIAssistantOpen && (
        <button
          onClick={() => setIsAIAssistantOpen(true)}
          className="absolute bottom-8 right-8 z-30 bg-purple-500 hover:bg-purple-600 text-white p-4 rounded-full shadow-[4px_4px_0px_0px_rgba(126,34,206,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(126,34,206,1)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center"
        >
          <Sparkles className="w-8 h-8 fill-purple-200 text-purple-200" />
        </button>
      )}

      {isQuizGenerationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/20 p-4 backdrop-blur-md dark:bg-gray-900/40" role="dialog" aria-modal="true" aria-labelledby="quiz-generation-title">
          <div className="relative w-full max-w-xl scale-105 transition-all duration-300">
            <div className="pointer-events-none absolute left-1/2 top-0 z-20 h-8 w-24 -translate-x-1/2 -translate-y-4 -rotate-2 rounded-sm border border-purple-200/50 bg-purple-400/40 backdrop-blur-md dark:border-purple-700/50 dark:bg-purple-500/40" />
            <div className="relative overflow-hidden rounded-2xl border-4 border-purple-400 bg-purple-50/90 shadow-[8px_8px_0px_0px_rgba(168,85,247,1)] backdrop-blur-xl dark:border-purple-700 dark:bg-gray-800/90 dark:shadow-[8px_8px_0px_0px_rgba(107,33,168,0.8)]">
              {quizStatus.state === 'failed' ? (
                <div className="p-8 text-center md:p-10">
                  <CircleAlert className="mx-auto h-12 w-12 text-red-500" />
                  <h2 id="quiz-generation-title" className="mt-4 font-['Kalam',cursive] text-3xl font-bold text-purple-950 dark:text-purple-100">Quiz needs another try</h2>
                  <p className="mt-3 font-semibold text-purple-800 dark:text-purple-200">{quizStatus.reason || 'We could not finish creating this quiz.'}</p>
                  <div className="mt-7 flex flex-col-reverse justify-center gap-3 sm:flex-row">
                    <button onClick={() => setIsQuizGenerationModalOpen(false)} className="rounded-xl border-2 border-purple-300 bg-white px-5 py-3 font-bold text-purple-800 dark:border-purple-700 dark:bg-gray-900 dark:text-purple-100">Close</button>
                    <button onClick={() => void handleStartQuiz()} className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-purple-700 bg-purple-500 px-5 py-3 font-['Kalam',cursive] text-lg font-bold text-white shadow-[2px_2px_0_#7e22ce] transition-all active:translate-y-0.5 active:shadow-none"><Sparkles className="h-5 w-5 fill-current" /> Start quiz</button>
                  </div>
                </div>
              ) : (
                <div className="relative p-8 md:p-10">
                  <h2 id="quiz-generation-title" className="text-center font-['Kalam',cursive] text-3xl font-bold text-purple-950 dark:text-purple-100">Creating your lesson quiz</h2>
                  <p className="mt-2 text-center font-semibold text-purple-800 dark:text-purple-200">A few moments while TutorMe prepares your questions.</p>
                  <div className="mt-9 space-y-5 font-['Nunito',sans-serif] text-lg font-bold text-purple-950 dark:text-purple-100">
                    {quizGenerationSteps.map((step, index) => {
                      const isComplete = index < quizGenerationStep;
                      const isCurrent = index === quizGenerationStep;
                      return (
                        <div key={step} className={`flex items-center gap-4 transition-all duration-500 ${isCurrent ? 'translate-x-2 scale-105 text-purple-600 dark:text-purple-300' : isComplete ? 'opacity-80' : 'opacity-40'}`}>
                          {isComplete ? <CheckCircle2 className="h-7 w-7 flex-none text-green-500" /> : isCurrent ? <LoaderCircle className="h-7 w-7 flex-none animate-spin text-purple-500" /> : <span className="h-6 w-6 flex-none rounded-md border-2 border-purple-300 dark:border-purple-700" />}
                          <span>{step}</span>
                        </div>
                      );
                    })}
                  </div>
                  <Sparkles className="pointer-events-none absolute -bottom-8 -right-8 h-40 w-40 animate-pulse fill-purple-500 text-purple-500 opacity-20" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Right Sidebar — AI Assistant ── */}
      {isAIAssistantOpen && (
        <aside
          style={{ width: `${rightSidebarWidth}px` }}
          className="relative bg-purple-50/50 dark:bg-gray-800/40 backdrop-blur-xl border-l-2 border-dashed border-gray-300 dark:border-gray-700 shadow-[-4px_0_24px_rgba(0,0,0,0.02)] z-40 flex-shrink-0 transition-all duration-300"
        >
          <div
            onMouseDown={() => setIsDraggingRight(true)}
            className={`absolute top-0 -left-2 bottom-0 w-4 cursor-col-resize hover:bg-purple-500/20 active:bg-purple-500/40 z-50 transition-colors ${isDraggingRight ? 'bg-purple-500/40' : ''}`}
          />
          <div className="flex flex-col h-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-['Kalam',cursive] font-bold text-purple-600 dark:text-purple-400 flex items-center gap-3 tracking-wide transform -rotate-1">
                <Sparkles className="w-8 h-8 fill-purple-500 text-purple-500" />
                AI Assistant
              </h2>
              <div className="flex items-center gap-2">
                {courseId && (
                  <>
                    <button
                      onClick={handleCreateNewThread}
                      title="New Chat"
                      className="text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 bg-white/50 dark:bg-gray-800/50 rounded-full p-2 border border-gray-200 dark:border-gray-700 shadow-sm transition-all hover:scale-105"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                      title="Chat History"
                      className={`text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 bg-white/50 dark:bg-gray-800/50 rounded-full p-2 border border-gray-200 dark:border-gray-700 shadow-sm transition-all hover:scale-105 ${isHistoryOpen ? 'bg-purple-100 dark:bg-purple-900 border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400' : ''}`}
                    >
                      <History className="w-4 h-4" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => setIsAIAssistantOpen(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-white/50 dark:bg-gray-800/50 rounded-full p-1"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {isHistoryOpen && (
              <div className="absolute top-[80px] left-6 right-6 bg-white/95 dark:bg-gray-900/95 border-4 border-purple-300 dark:border-purple-800 rounded-3xl p-4 shadow-[8px_8px_0_#c084fc] z-50 max-h-[300px] overflow-y-auto custom-scrollbar flex flex-col gap-2 transition-all">
                <div className="flex justify-between items-center mb-2 pb-2 border-b-2 border-dashed border-gray-200 dark:border-gray-700">
                  <span className="font-['Kalam',cursive] font-bold text-lg text-purple-950 dark:text-purple-100">Chat History</span>
                  <button
                    onClick={() => setIsHistoryOpen(false)}
                    className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    Close
                  </button>
                </div>
                {threads.length === 0 ? (
                  <p className="text-sm font-semibold text-gray-400 dark:text-gray-500 py-4 text-center">No chat history yet.</p>
                ) : (
                  threads.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => {
                        if (editingThreadId !== t.id) {
                          handleSwitchThread(t.id);
                        }
                      }}
                      className={`group flex items-center justify-between p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                        t.id === activeThreadId
                          ? 'bg-purple-100 dark:bg-purple-900/40 border-purple-400 dark:border-purple-700 text-purple-900 dark:text-purple-100'
                          : 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-800 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {editingThreadId === t.id ? (
                        <div className="flex items-center gap-2 w-full" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveRename(t.id, e);
                              } else if (e.key === 'Escape') {
                                handleCancelRename(e as any);
                              }
                            }}
                            className="flex-1 bg-white dark:bg-gray-800 border-2 border-purple-400 rounded-xl px-2 py-1 text-sm font-bold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
                            autoFocus
                          />
                          <button
                            onClick={(e) => handleSaveRename(t.id, e)}
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
                            <span className="text-sm font-bold truncate">{t.title}</span>
                            <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500">
                              {new Date(t.createdAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => handleStartRename(t.id, t.title, e)}
                              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-purple-600 dark:text-gray-500 dark:hover:text-purple-400 hover:bg-white dark:hover:bg-gray-700 transition-all"
                              title="Rename Chat"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteThread(t.id, e)}
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

            <div className="flex-1 overflow-y-auto flex flex-col gap-4 pb-4 pr-1 custom-scrollbar" aria-live="polite">
              {!isLessonReady ? (
                <div className="bg-white dark:bg-gray-800 border-4 border-gray-200 dark:border-gray-700 p-4 rounded-3xl rounded-tl-none shadow-[4px_4px_0px_0px_rgba(229,231,235,1)] dark:shadow-[4px_4px_0px_0px_rgba(55,65,81,0.8)] mr-4 text-md font-bold text-gray-700 dark:text-gray-300">
                  Generate the lesson first, then I can help explain the material!
                </div>
              ) : (
                <>
                  {messages.map((message) =>
                    message.role === 'assistant' ? (
                      <div key={message.id} className="bg-white dark:bg-gray-800 border-4 border-gray-200 dark:border-gray-700 p-4 rounded-3xl rounded-tl-none shadow-[4px_4px_0px_0px_rgba(229,231,235,1)] dark:shadow-[4px_4px_0px_0px_rgba(55,65,81,0.8)] mr-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        <MarkdownRenderer content={message.content} />
                      </div>
                    ) : (
                      <div key={message.id} className="bg-pink-100 dark:bg-pink-900/40 border-4 border-pink-300 dark:border-pink-700 p-4 rounded-3xl rounded-tr-none shadow-[4px_4px_0px_0px_rgba(244,114,182,1)] dark:shadow-[4px_4px_0px_0px_rgba(190,24,93,0.8)] ml-4 text-sm font-semibold text-pink-900 dark:text-pink-100 self-end transform rotate-1">
                        <MarkdownRenderer content={message.content} />
                      </div>
                    )
                  )}
                  {isChatting && (
                    <div className="bg-white dark:bg-gray-800 border-4 border-gray-200 dark:border-gray-700 p-4 rounded-3xl rounded-tl-none shadow-[4px_4px_0px_0px_rgba(229,231,235,1)] mr-4 inline-flex items-center gap-2 font-bold text-gray-600 dark:text-gray-300">
                      <LoaderCircle className="h-5 w-5 animate-spin" /> Thinking…
                    </div>
                  )}
                </>
              )}
            </div>

            {chatError && (
              <p role="alert" className="mt-2 rounded-xl border-2 border-red-300 bg-red-50 p-3 font-bold text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200 text-sm">
                {chatError}
              </p>
            )}

            <form onSubmit={handleTutorMessage} className="mt-4 relative">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={!isLessonReady || isChatting}
                placeholder={isLessonReady ? 'Ask me anything…' : 'Generate lesson first…'}
                className="w-full pl-5 pr-14 py-4 border-4 border-purple-200 dark:border-purple-800/50 rounded-full bg-white/90 dark:bg-gray-900/90 focus:outline-none focus:border-purple-400 dark:focus:border-purple-500 focus:ring-4 focus:ring-purple-200 dark:focus:ring-purple-900/50 font-bold text-gray-700 dark:text-gray-200 placeholder-gray-400 transition-all shadow-inner text-lg disabled:opacity-60 disabled:cursor-not-allowed"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex">
                <button
                  type="submit"
                  disabled={!chatInput.trim() || !isLessonReady || isChatting}
                  className="bg-purple-500 hover:bg-purple-600 text-white p-3 rounded-full shadow-[0_4px_0px_0px_rgba(126,34,206,1)] active:translate-y-1 active:shadow-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        </aside>
      )}

    </div>
  );
};

export default Lesson;
