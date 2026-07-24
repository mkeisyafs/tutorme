import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BlockRenderer } from '../components/BlockRenderer';
import { MarkdownRenderer } from '../components/blocks';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  History,
  LoaderCircle,
  Lock,
  Check,
  MessageCircle,
  Pencil,
  Send,
  Sparkles,
  Trash2,
  X,
  Plus,
} from 'lucide-react';
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

const Lesson = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { courseId: routeCourseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();

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

  const quizGenerationSteps = useMemo(() => [
    'Reviewing this lesson',
    'Writing thoughtful questions',
    'Preparing answer guidance',
    'Getting your quiz ready',
  ], []);

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
      apiRequest<LessonGenerationStatus>('/generation/lesson/' + encodeURIComponent(lessonId!) + '/status'),
      apiRequest<QuizGenerationStatus>('/generation/lesson/' + encodeURIComponent(lessonId!) + '/quiz-status'),
    ]);
    setGenerationStatus(nextLessonStatus);
    setQuizStatus(nextQuizStatus);
    if (nextLessonStatus.state === 'ready') {
      const nextLesson = await apiRequest<LessonRecord>('/lessons/' + encodeURIComponent(lessonId!));
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
        apiRequest<LessonRecord>('/lessons/' + encodeURIComponent(lessonId!)),
        apiRequest<LessonGenerationStatus>('/generation/lesson/' + encodeURIComponent(lessonId!) + '/status'),
        apiRequest<QuizGenerationStatus>('/generation/lesson/' + encodeURIComponent(lessonId!) + '/quiz-status'),
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

  // Load chat threads from local storage or server
  useEffect(() => {
    if (!lessonId) return;
    const storageKey = `tutorme_ai_threads_${lessonId}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed: ChatThread[] = JSON.parse(stored);
        setThreads(parsed);
        if (parsed.length > 0 && !activeThreadId) {
          setActiveThreadId(parsed[0].id);
          setMessages(parsed[0].messages);
        }
      } catch {}
    }
  }, [lessonId, activeThreadId]);

  // Save chat threads to local storage
  const saveThreads = (updatedThreads: ChatThread[]) => {
    const targetLessonId = lessonId;
    if (!targetLessonId) return;
    setThreads(updatedThreads);
    localStorage.setItem(`tutorme_ai_threads_${targetLessonId}`, JSON.stringify(updatedThreads));
  };

  const handleCreateNewThread = () => {
    const newThread: ChatThread = {
      id: 'thread-' + Date.now(),
      title: `Chat ${threads.length + 1}`,
      createdAt: Date.now(),
      messages: [makeMessage('assistant', "Hello! I'm your AI learning assistant. Ask me anything about this lesson.")],
    };
    const updated = [newThread, ...threads];
    saveThreads(updated);
    setActiveThreadId(newThread.id);
    setMessages(newThread.messages);
  };

  const handleSwitchThread = (threadId: string) => {
    const thread = threads.find((t) => t.id === threadId);
    if (thread) {
      setActiveThreadId(thread.id);
      setMessages(thread.messages);
    }
  };

  const handleStartRename = (threadId: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingThreadId(threadId);
    setEditingTitle(currentTitle);
  };

  const handleSaveRename = (threadId: string, e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if (!editingTitle.trim()) return;
    const updated = threads.map((t) => (t.id === threadId ? { ...t, title: editingTitle.trim() } : t));
    saveThreads(updated);
    setEditingThreadId(null);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingThreadId(null);
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

  const handleTutorMessage = async (e: FormEvent) => {
    e.preventDefault();
    const question = chatInput.trim();
    if (!question || isChatting || !lessonId) return;

    setChatInput('');
    setChatError('');
    const userMsg = makeMessage('user', question);
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsChatting(true);

    // Update active thread
    if (activeThreadId) {
      const updatedThreads = threads.map((t) => (t.id === activeThreadId ? { ...t, messages: updatedMessages } : t));
      saveThreads(updatedThreads);
    }

    try {
      const response = await apiRequest<TutorResponse>(
        `/generation/lesson/${encodeURIComponent(lessonId!)}/chat`,
        {
          method: 'POST',
          body: {
            question,
            history: updatedMessages.slice(0, -1).map((m) => ({ role: m.role, content: m.content })),
          },
        }
      );
      const assistantMsg = makeMessage('assistant', response.reply || 'No reply generated.');
      const finalMessages = [...updatedMessages, assistantMsg];
      setMessages(finalMessages);
      if (activeThreadId) {
        const updatedThreads = threads.map((t) => (t.id === activeThreadId ? { ...t, messages: finalMessages } : t));
        saveThreads(updatedThreads);
      }
    } catch (err) {
      setChatError(getApiErrorMessage(err, 'Failed to get a response from your tutor.'));
    } finally {
      setIsChatting(false);
    }
  };

  const handleToggleComplete = async () => {
    if (!lessonId || isCompleting) return;
    setIsCompleting(true);
    try {
      const nextState = !isCompleted;
      await apiRequest(`/lesson-progress/${encodeURIComponent(lessonId!)}`, {
        method: 'PATCH',
        body: { status: nextState ? 'COMPLETED' : 'IN_PROGRESS' },
      });
      setIsCompleted(nextState);
      const nextCompleted = new Set(completedLessonIds);
      if (nextState) nextCompleted.add(lessonId);
      else nextCompleted.delete(lessonId);
      setCompletedLessonIds(nextCompleted);
      await refreshProgress();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update lesson completion.'));
    } finally {
      setIsCompleting(false);
    }
  };

  const handleGenerateLesson = async () => {
    if (!lessonId || isGenerating) return;
    setIsGenerating(true);
    setError('');
    try {
      await apiRequest(`/generation/lesson/${encodeURIComponent(lessonId!)}/generate`, { method: 'POST' });
      await refreshStatuses();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to generate lesson content.'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartQuiz = async () => {
    if (!lessonId) return;
    setIsQuizGenerationModalOpen(true);
    setQuizGenerationStep(0);
    try {
      const res = await apiRequest<QuizGenerationStatus>(`/generation/lesson/${encodeURIComponent(lessonId!)}/quiz-generate`, { method: 'POST' });
      setQuizStatus(res);
      if (res.quizId) {
        setIsQuizGenerationModalOpen(false);
        navigate(`/quizzes/${encodeURIComponent(res.quizId)}`);
      }
    } catch (err) {
      setQuizStatus({ state: 'failed', isGenerated: false, isGenerating: false, reason: getApiErrorMessage(err, 'Failed to generate quiz.') });
    }
  };

  const handleGoToQuiz = () => {
    if (quizStatus.quizId) {
      navigate(`/quizzes/${encodeURIComponent(quizStatus.quizId)}`);
    } else {
      void handleStartQuiz();
    }
  };

  const handlePrevLesson = () => {
    if (prevLesson && courseId) {
      navigate(`/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(prevLesson.id)}`);
    }
  };

  const handleNextLesson = () => {
    if (nextLesson && courseId && isNextLessonAccessible) {
      navigate(`/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(nextLesson.id)}`);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen grid place-items-center bg-gray-50 p-6 font-['Nunito',sans-serif] dark:bg-gray-900">
        <section className="rounded-3xl border-4 border-purple-300 bg-white p-10 text-center shadow-[8px_8px_0_#c084fc] dark:border-purple-800 dark:bg-gray-800">
          <LoaderCircle className="mx-auto h-12 w-12 animate-spin text-purple-500" />
          <h1 className="mt-4 font-['Kalam',cursive] text-3xl font-bold text-gray-900 dark:text-white">{t('lessonPage.loadingLesson')}</h1>
        </section>
      </main>
    );
  }

  const youtubeId = getYouTubeId(lesson?.videoUrl || null);
  const lessonContent = lesson?.content || '';

  return (
    <div className="h-screen w-full flex bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-['Nunito',sans-serif] overflow-hidden transition-colors duration-300 relative">
      <CourseSidebar
        courseId={courseId}
        courseModules={courseModules}
        completedLessonIds={completedLessonIds}
        orderedLessons={orderedLessons}
        progressPercent={progressPercent}
        allDone={allDone}
        activeLessonId={lessonId}
      />

      <main className="flex-1 flex flex-col h-full overflow-y-auto relative p-4 sm:p-8 md:p-12 pt-16 sm:pt-8 md:pt-12">
        <div className="max-w-4xl w-full mx-auto flex flex-col flex-1">

          {/* Lesson Header */}
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                {lesson?.module?.title || 'Lesson Module'}
              </span>
              <h1 className="text-2xl sm:text-4xl font-bold font-['Kalam',cursive] text-gray-900 dark:text-gray-100 mt-1 leading-tight">
                {lesson?.title || 'Untitled Lesson'}
              </h1>
            </div>

            <button
              onClick={handleToggleComplete}
              disabled={isCompleting}
              className={`px-4 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base transition-all border-2 flex items-center gap-2 font-['Kalam',cursive] shrink-0 ${
                isCompleted
                  ? 'bg-green-100 text-green-800 border-green-400 shadow-[3px_3px_0px_0px_rgba(74,222,128,1)] dark:bg-green-950/40 dark:text-green-300 dark:border-green-700'
                  : 'bg-white text-gray-700 border-gray-300 shadow-[3px_3px_0px_0px_rgba(156,163,175,1)] hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700'
              }`}
            >
              <CheckCircle2 className={`w-5 h-5 ${isCompleted ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`} />
              {isCompleted ? t('lessonPage.completedBadge') : t('lessonPage.markCompleted')}
            </button>
          </div>

          {/* YouTube Video Player (if present) */}
          {youtubeId && (
            <div className="mb-8 rounded-3xl border-4 border-purple-400 dark:border-purple-700 overflow-hidden shadow-[6px_6px_0px_0px_#c084fc] dark:shadow-[6px_6px_0px_0px_rgba(126,34,206,0.6)] bg-black aspect-video">
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${youtubeId}`}
                title="Lesson Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          {/* Lesson Content Area */}
          {!isLessonReady ? (
            <div className="rounded-3xl border-4 border-dashed border-purple-300 bg-purple-50 p-8 sm:p-12 text-center dark:border-purple-800 dark:bg-gray-800 my-auto">
              <Sparkles className="mx-auto h-12 w-12 text-purple-500 animate-pulse mb-4" />
              <h2 className="font-['Kalam',cursive] text-2xl sm:text-3xl font-bold text-purple-950 dark:text-purple-100 mb-2">
                This lesson content is not generated yet
              </h2>
              <p className="text-sm sm:text-base font-semibold text-purple-800 dark:text-purple-300 mb-6 max-w-md mx-auto">
                Click below to let TutorMe generate rich, interactive learning blocks and exercises for this topic.
              </p>
              <button
                onClick={handleGenerateLesson}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-purple-700 bg-purple-500 px-6 py-3 font-['Kalam',cursive] text-lg font-bold text-white shadow-[3px_3px_0px_0px_#7e22ce] transition-all hover:bg-purple-600 active:translate-y-0.5 active:shadow-none"
              >
                {isGenerating ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5 fill-current" />}
                {isGenerating ? t('lessonPage.generatingLesson') : 'Generate Lesson Content'}
              </button>
            </div>
          ) : (
            <div className="prose dark:prose-invert max-w-none">
              <BlockRenderer content={lessonContent} />
            </div>
          )}

          {/* Error banner */}
          {error && (
            <p role="alert" className="mt-4 sm:mt-5 rounded-xl border-2 border-red-300 bg-red-50 p-3 sm:p-4 font-bold text-xs sm:text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">
              {error}
            </p>
          )}

          {/* Quiz Section */}
          <div className="mt-6 sm:mt-8 bg-purple-50 dark:bg-purple-950/30 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-3 sm:border-4 border-purple-300 dark:border-purple-800 shadow-[4px_4px_0_#c084fc] sm:shadow-[6px_6px_0_#c084fc] dark:shadow-[4px_4px_0_rgba(88,28,135,0.6)] sm:dark:shadow-[6px_6px_0_rgba(88,28,135,0.6)] relative">
            <div className="absolute -top-2.5 right-4 sm:right-6 w-8 sm:w-10 h-4 sm:h-5 bg-yellow-400/80 dark:bg-yellow-500/40 transform rotate-12 backdrop-blur-sm shadow-sm pointer-events-none border-2 border-yellow-500 dark:border-yellow-600 rounded-sm"></div>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 font-['Kalam',cursive] text-xl sm:text-2xl font-bold text-purple-950 dark:text-purple-100">
                  <ClipboardCheck className="h-5 w-5 sm:h-6 sm:w-6" /> {t('lessonPage.lessonQuizTitle')}
                </h2>
                <p className="mt-1 font-semibold text-xs sm:text-base text-purple-800 dark:text-purple-200">
                  {quizStatus.reason || (isQuizReady ? t('lessonPage.quizReadyDesc') : t('lessonPage.quizStatusWait'))}
                </p>
              </div>
              {isQuizReady ? (
                <button
                  onClick={handleGoToQuiz}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border-2 border-purple-700 bg-purple-500 px-4 py-2.5 sm:px-5 sm:py-3 font-['Kalam',cursive] text-base sm:text-lg font-bold text-white shadow-[2px_2px_0_#7e22ce] shrink-0"
                >
                  {t('lessonPage.takeQuizBtn')}
                </button>
              ) : quizStatus.isGenerating ? (
                <span className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border-2 border-purple-300 bg-purple-100 px-4 py-2.5 sm:py-3 font-bold text-xs sm:text-base text-purple-800 dark:border-purple-700 dark:bg-purple-900/40 dark:text-purple-200 shrink-0">
                  <LoaderCircle className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" /> {t('lessonPage.generatingQuizBtn')}
                </span>
              ) : (
                <span className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border-2 border-purple-200 bg-white px-4 py-2.5 sm:py-3 font-bold text-xs sm:text-base text-purple-700 dark:border-purple-700 dark:bg-gray-900 dark:text-purple-200 shrink-0">
                  {t('lessonPage.waitingForLesson')}
                </span>
              )}
            </div>
          </div>

          {/* Prev / Next Navigation */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center mt-8 sm:mt-12 pb-24 sm:pb-12 gap-3 sm:gap-4">
            {/* Previous */}
            {prevLesson ? (
              <button
                onClick={handlePrevLesson}
                className="w-full sm:w-auto px-5 py-3 sm:px-6 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 shadow-[3px_3px_0px_0px_rgba(156,163,175,1)] sm:shadow-[4px_4px_0px_0px_rgba(156,163,175,1)] dark:shadow-[2px_2px_0px_0px_rgba(75,85,99,1)] hover:translate-y-0.5 hover:shadow-sm transition-all flex items-center justify-center gap-2 sm:gap-3 font-['Kalam',cursive] text-base sm:text-lg"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                {t('lessonPage.prevLessonBtn')}
              </button>
            ) : <div />}

            {/* Next / Final Exam */}
            {nextLesson ? (
              <div className="flex flex-col items-stretch sm:items-end gap-1.5 w-full sm:w-auto">
                {!isNextLessonAccessible && (
                  <p className="text-[11px] sm:text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center justify-center sm:justify-end gap-1 text-center sm:text-right">
                    <Lock className="w-3 h-3 shrink-0" /> {t('lessonPage.unlockNextNotice')}
                  </p>
                )}
                <button
                  onClick={handleNextLesson}
                  disabled={!isNextLessonAccessible}
                  className={`w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 rounded-xl sm:rounded-2xl font-bold border-2 transition-all flex items-center justify-center gap-2 sm:gap-3 font-['Kalam',cursive] text-lg sm:text-xl ${
                    isNextLessonAccessible
                      ? 'text-blue-900 dark:text-blue-100 bg-blue-100 dark:bg-blue-900 border-blue-400 dark:border-blue-700 shadow-[3px_3px_0px_0px_rgba(96,165,250,1)] sm:shadow-[4px_4px_0px_0px_rgba(96,165,250,1)] dark:shadow-[2px_2px_0px_0px_rgba(30,58,138,0.8)] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(96,165,250,1)]'
                      : 'text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 opacity-60 cursor-not-allowed'
                  }`}
                >
                  {t('lessonPage.nextLessonBtn')}
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            ) : (allDone || isCompleted) && courseId ? (
              <button
                onClick={() => navigate('/courses/' + encodeURIComponent(courseId) + '/final-exam')}
                className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-blue-900 dark:text-blue-100 bg-blue-100 dark:bg-blue-900 border-2 border-blue-400 dark:border-blue-700 shadow-[3px_3px_0px_0px_rgba(96,165,250,1)] sm:shadow-[4px_4px_0px_0px_rgba(96,165,250,1)] dark:shadow-[2px_2px_0px_0px_rgba(30,58,138,0.8)] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(96,165,250,1)] transition-all flex items-center justify-center gap-2 sm:gap-3 font-['Kalam',cursive] text-lg sm:text-xl"
              >
                <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                {t('lessonPage.finalExamBtn')}
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            ) : null}
          </div>

        </div>
      </main>

      {/* Floating AI button */}
      <button
        onClick={() => setIsAIAssistantOpen(true)}
        className={`fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-30 bg-purple-500 hover:bg-purple-600 text-white p-3 sm:p-4 rounded-full shadow-[3px_3px_0px_0px_rgba(126,34,206,1)] sm:shadow-[4px_4px_0px_0px_rgba(126,34,206,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(126,34,206,1)] active:translate-y-1 active:shadow-none transition-all duration-300 transform flex items-center justify-center ${
          !isAIAssistantOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'
        }`}
      >
        <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 fill-purple-200 text-purple-200" />
      </button>

      {isQuizGenerationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/20 p-2.5 sm:p-4 backdrop-blur-md dark:bg-gray-900/40" role="dialog" aria-modal="true" aria-labelledby="quiz-generation-title">
          <div className="relative w-full max-w-xl scale-100 sm:scale-105 transition-all duration-300">
            <div className="pointer-events-none absolute left-1/2 top-0 z-20 h-6 sm:h-8 w-20 sm:w-24 -translate-x-1/2 -translate-y-3 sm:-translate-y-4 -rotate-2 rounded-sm border border-purple-200/50 bg-purple-400/40 backdrop-blur-md dark:border-purple-700/50 dark:bg-purple-500/40" />
            <div className="relative overflow-hidden rounded-2xl border-3 sm:border-4 border-purple-400 bg-purple-50/90 shadow-[4px_4px_0px_0px_rgba(168,85,247,1)] sm:shadow-[8px_8px_0px_0px_rgba(168,85,247,1)] backdrop-blur-xl dark:border-purple-700 dark:bg-gray-800/90 dark:shadow-[4px_4px_0px_0px_rgba(107,33,168,0.8)] sm:dark:shadow-[8px_8px_0px_0px_rgba(107,33,168,0.8)]">
              {quizStatus.state === 'failed' ? (
                <div className="p-5 sm:p-8 md:p-10 text-center">
                  <CircleAlert className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-red-500" />
                  <h2 id="quiz-generation-title" className="mt-3 font-['Kalam',cursive] text-2xl sm:text-3xl font-bold text-purple-950 dark:text-purple-100">Quiz needs another try</h2>
                  <p className="mt-2 font-semibold text-xs sm:text-base text-purple-800 dark:text-purple-200">{quizStatus.reason || 'We could not finish creating this quiz.'}</p>
                  <div className="mt-6 flex flex-col-reverse justify-center gap-2.5 sm:gap-3 sm:flex-row">
                    <button onClick={() => setIsQuizGenerationModalOpen(false)} className="rounded-xl border-2 border-purple-300 bg-white px-4 py-2.5 sm:px-5 sm:py-3 font-bold text-xs sm:text-base text-purple-800 dark:border-purple-700 dark:bg-gray-900 dark:text-purple-100">Close</button>
                    <button onClick={() => void handleStartQuiz()} className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-purple-700 bg-purple-500 px-4 py-2.5 sm:px-5 sm:py-3 font-['Kalam',cursive] text-base sm:text-lg font-bold text-white shadow-[2px_2px_0_#7e22ce] transition-all active:translate-y-0.5 active:shadow-none"><Sparkles className="h-4 w-4 sm:h-5 sm:w-5 fill-current" /> Start quiz</button>
                  </div>
                </div>
              ) : (
                <div className="relative p-5 sm:p-8 md:p-10">
                  <h2 id="quiz-generation-title" className="text-center font-['Kalam',cursive] text-2xl sm:text-3xl font-bold text-purple-950 dark:text-purple-100">Creating your lesson quiz</h2>
                  <p className="mt-1.5 text-center font-semibold text-xs sm:text-base text-purple-800 dark:text-purple-200">A few moments while TutorMe prepares your questions.</p>
                  <div className="mt-6 sm:mt-9 space-y-3 sm:space-y-5 font-['Nunito',sans-serif] text-sm sm:text-lg font-bold text-purple-950 dark:text-purple-100">
                    {quizGenerationSteps.map((step, index) => {
                      const isComplete = index < quizGenerationStep;
                      const isCurrent = index === quizGenerationStep;
                      return (
                        <div key={step} className={`flex items-center gap-3 sm:gap-4 transition-all duration-500 ${isCurrent ? 'translate-x-1 sm:translate-x-2 scale-105 text-purple-600 dark:text-purple-300' : isComplete ? 'opacity-80' : 'opacity-40'}`}>
                          {isComplete ? <CheckCircle2 className="h-5 w-5 sm:h-7 sm:w-7 flex-none text-green-500" /> : isCurrent ? <LoaderCircle className="h-5 w-5 sm:h-7 sm:w-7 flex-none animate-spin text-purple-500" /> : <span className="h-5 w-5 sm:h-6 sm:w-6 flex-none rounded-md border-2 border-purple-300 dark:border-purple-700" />}
                          <span>{step}</span>
                        </div>
                      );
                    })}
                  </div>
                  <Sparkles className="pointer-events-none absolute -bottom-8 -right-8 h-32 w-32 sm:h-40 sm:w-40 animate-pulse fill-purple-500 text-purple-500 opacity-20 hidden sm:block" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Right Sidebar — AI Assistant ── */}
      <div
        onClick={() => setIsAIAssistantOpen(false)}
        className={`fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-sm lg:hidden transition-opacity duration-300 ease-in-out ${
          isAIAssistantOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />
      <aside
        style={{ width: isAIAssistantOpen ? `${rightSidebarWidth}px` : undefined }}
        className={`fixed inset-y-0 right-0 z-50 h-full max-w-[92vw] sm:max-w-[90vw] bg-purple-50/95 dark:bg-gray-800/95 shadow-2xl transition-all duration-300 ease-in-out lg:relative lg:z-40 lg:shadow-[-4px_0_24px_rgba(0,0,0,0.02)] lg:bg-purple-50/50 lg:dark:bg-gray-800/40 backdrop-blur-xl border-dashed border-gray-300 dark:border-gray-700 flex-shrink-0 flex flex-col ${
          isAIAssistantOpen
            ? 'translate-x-0 opacity-100 pointer-events-auto border-l-2 lg:w-[340px]'
            : 'translate-x-full opacity-0 pointer-events-none lg:translate-x-0 lg:w-0 lg:max-w-0 lg:overflow-hidden lg:border-l-0'
        }`}
      >
        <div
          onMouseDown={() => setIsDraggingRight(true)}
          className={`absolute top-0 -left-2 bottom-0 w-4 cursor-col-resize hover:bg-purple-500/20 active:bg-purple-500/40 z-50 transition-colors hidden lg:block ${isDraggingRight ? 'bg-purple-500/40' : ''}`}
        />
        <div className="flex flex-col h-full p-4 sm:p-6 min-w-[280px] sm:min-w-[320px]">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h2 className="text-2xl sm:text-3xl font-['Kalam',cursive] font-bold text-purple-600 dark:text-purple-400 flex items-center gap-2 sm:gap-3 tracking-wide transform -rotate-1">
                <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 fill-purple-500 text-purple-500 shrink-0" />
                AI Assistant
              </h2>
              <div className="flex items-center gap-1.5 sm:gap-2">
                {courseId && (
                  <>
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
                      className={`text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 bg-white/50 dark:bg-gray-800/50 rounded-full p-1.5 sm:p-2 border border-gray-200 dark:border-gray-700 shadow-sm transition-all hover:scale-105 ${isHistoryOpen ? 'bg-purple-100 dark:bg-purple-900 border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400' : ''}`}
                    >
                      <History className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => setIsAIAssistantOpen(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-white/50 dark:bg-gray-800/50 rounded-full p-1"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
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

            <form onSubmit={handleTutorMessage} className="mt-3 sm:mt-4 relative">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={!isLessonReady || isChatting}
                placeholder={isLessonReady ? 'Ask me anything…' : 'Generate lesson first…'}
                className="w-full pl-3.5 sm:pl-5 pr-11 sm:pr-14 py-2.5 sm:py-3.5 border-3 sm:border-4 border-purple-200 dark:border-purple-800/50 rounded-full bg-white/90 dark:bg-gray-900/90 focus:outline-none focus:border-purple-400 dark:focus:border-purple-500 focus:ring-4 focus:ring-purple-200 dark:focus:ring-purple-900/50 font-bold text-gray-700 dark:text-gray-200 text-xs sm:text-base placeholder-gray-400 transition-all shadow-inner disabled:opacity-60 disabled:cursor-not-allowed"
              />
              <div className="absolute right-1.5 sm:right-2 top-1/2 transform -translate-y-1/2 flex">
                <button
                  type="submit"
                  disabled={!chatInput.trim() || !isLessonReady || isChatting}
                  className="bg-purple-500 hover:bg-purple-600 text-white p-2 sm:p-2.5 rounded-full shadow-[0_3px_0px_0px_rgba(126,34,206,1)] sm:shadow-[0_4px_0px_0px_rgba(126,34,206,1)] active:translate-y-1 active:shadow-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </form>
          </div>
      </aside>

    </div>
  );
};

export default Lesson;
