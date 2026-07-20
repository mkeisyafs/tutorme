import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  LoaderCircle,
  MessageCircle,
  Play,
  RefreshCw,
  Send,
  Video,
} from 'lucide-react';
import { useAuth } from '../auth/useAuth';
import { apiRequest, getApiErrorMessage } from '../lib/api';

interface LessonRecord {
  id: string;
  title: string;
  content: string | null;
  videoUrl: string | null;
  module: {
    id: string;
    title: string;
    courseId: string;
  };
}

interface LessonGenerationStatus {
  state: 'ready' | 'generating' | 'not_started';
  isGenerated: boolean;
  isGenerating: boolean;
  contentLength: number;
}

interface QuizGenerationStatus {
  state: 'blocked' | 'not_started' | 'queued' | 'generating' | 'failed' | 'ready';
  isGenerated: boolean;
  isGenerating: boolean;
  quizId?: string;
  reason?: string;
}

interface ListResponse<T> {
  data: T[];
}

interface LessonProgress {
  status: 'LOCKED' | 'IN_PROGRESS' | 'COMPLETED';
}

interface TutorMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
}

interface TutorResponse {
  reply?: string;
}

function makeMessage(role: TutorMessage['role'], content: string): TutorMessage {
  return {
    id: role + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
    role,
    content,
  };
}

const initialQuizStatus: QuizGenerationStatus = {
  state: 'blocked',
  isGenerated: false,
  isGenerating: false,
  reason: 'Generate this lesson before its quiz can be created.',
};

const Lesson = () => {
  const navigate = useNavigate();
  const { courseId: routeCourseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const { user } = useAuth();
  const [lesson, setLesson] = useState<LessonRecord | null>(null);
  const [generationStatus, setGenerationStatus] = useState<LessonGenerationStatus | null>(null);
  const [quizStatus, setQuizStatus] = useState<QuizGenerationStatus>(initialQuizStatus);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState('');
  const [chatError, setChatError] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [messages, setMessages] = useState<TutorMessage[]>([]);

  const courseId = routeCourseId || lesson?.module.courseId || '';
  const isLessonReady = Boolean(lesson?.content) || generationStatus?.state === 'ready';
  const isQuizReady = quizStatus.state === 'ready' && Boolean(quizStatus.quizId);

  const loadProgress = useCallback(async () => {
    if (!lessonId || !user?.id) {
      setIsCompleted(false);
      return;
    }

    const response = await apiRequest<ListResponse<LessonProgress>>(
      '/lesson-progress?userId=' + encodeURIComponent(user.id) + '&lessonId=' + encodeURIComponent(lessonId) + '&take=1'
    );
    setIsCompleted(response.data.some((entry) => entry.status === 'COMPLETED'));
  }, [lessonId, user?.id]);

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
      await loadProgress();
      if (nextLesson.content) {
        setMessages([
          makeMessage(
            'assistant',
            'I am Assistant 2. Ask me anything about the lesson material you are reading.'
          ),
        ]);
      } else {
        setMessages([]);
      }
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'We could not load this lesson.'));
    } finally {
      setIsLoading(false);
    }
  }, [lessonId, loadProgress]);

  useEffect(() => {
    void loadLesson();
  }, [loadLesson]);

  useEffect(() => {
    if (!lessonId || (!isGenerating && !quizStatus.isGenerating && quizStatus.state !== 'queued')) {
      return;
    }

    const interval = window.setInterval(() => {
      void refreshStatuses().catch(() => undefined);
    }, 2500);

    return () => window.clearInterval(interval);
  }, [isGenerating, lessonId, quizStatus.isGenerating, quizStatus.state, refreshStatuses]);

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
      setMessages([
        makeMessage(
          'assistant',
          'Your lesson is ready. I can help explain the material, examples, and exercises on this page.'
        ),
      ]);
      await refreshStatuses();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'The lesson could not be generated. Please try again.'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCompleteLesson = async () => {
    if (!lessonId || !user?.id || isCompleting || !isLessonReady) return;

    setError('');
    setIsCompleting(true);
    try {
      await apiRequest('/lesson-progress', {
        method: 'POST',
        body: {
          userId: user.id,
          lessonId,
          status: 'COMPLETED',
        },
      });
      setIsCompleted(true);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'We could not save your lesson completion.'));
    } finally {
      setIsCompleting(false);
    }
  };

  const handleTutorMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = chatInput.trim();
    if (!lessonId || !content || !isLessonReady || isChatting) return;

    const userMessage = makeMessage('user', content);
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setChatInput('');
    setChatError('');
    setIsChatting(true);

    try {
      const response = await apiRequest<TutorResponse>(
        '/generation/lesson/' + encodeURIComponent(lessonId) + '/chat',
        {
          method: 'POST',
          body: {
            messages: nextMessages.map(({ role, content: messageContent }) => ({
              role,
              content: messageContent,
            })),
          },
        }
      );
      const reply = response.reply?.trim();
      if (!reply) {
        throw new Error('The lesson assistant did not return a response.');
      }
      setMessages((currentMessages) => [...currentMessages, makeMessage('assistant', reply)]);
    } catch (requestError) {
      setChatError(getApiErrorMessage(requestError, 'Assistant 2 could not answer that question.'));
    } finally {
      setIsChatting(false);
    }
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
    <main className="min-h-screen bg-gray-50 px-4 py-6 font-['Nunito',sans-serif] text-gray-800 dark:bg-gray-900 dark:text-gray-100 sm:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="min-w-0">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-4 py-2 font-['Kalam',cursive] text-lg font-bold text-gray-700 shadow-[2px_2px_0_#9ca3af] dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100">
              <ArrowLeft className="h-5 w-5" /> Back
            </button>
            {isLessonReady && (
              <button
                onClick={() => void handleCompleteLesson()}
                disabled={isCompleted || isCompleting}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-green-700 bg-green-500 px-4 py-2 font-['Kalam',cursive] text-lg font-bold text-white shadow-[2px_2px_0_#15803d] disabled:cursor-default disabled:opacity-70"
              >
                {isCompleting ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                {isCompleted ? 'Lesson completed' : 'Mark complete'}
              </button>
            )}
          </div>

          <article className="rounded-3xl border-4 border-blue-300 bg-white p-6 shadow-[8px_8px_0_#60a5fa] dark:border-blue-800 dark:bg-gray-800 sm:p-9">
            <p className="font-bold uppercase tracking-wider text-blue-600 dark:text-blue-300">{lesson?.module.title || 'Course lesson'}</p>
            <h1 className="mt-2 font-['Kalam',cursive] text-4xl font-bold text-blue-950 dark:text-blue-100">{lesson?.title || 'Lesson'}</h1>

            {!isLessonReady ? (
              <div className="mt-8 rounded-2xl border-2 border-pink-300 bg-pink-50 p-6 text-center dark:border-pink-800 dark:bg-pink-950/30">
                {isGenerating ? (
                  <>
                    <LoaderCircle className="mx-auto h-10 w-10 animate-spin text-pink-500" />
                    <h2 className="mt-3 font-['Kalam',cursive] text-2xl font-bold text-pink-900 dark:text-pink-100">Generating this lesson</h2>
                    <p className="mt-2 font-semibold text-pink-800 dark:text-pink-200">Researching materials and preparing one lesson only. Its quiz will start in the background afterward.</p>
                  </>
                ) : (
                  <>
                    <Play className="mx-auto h-10 w-10 fill-pink-500 text-pink-500" />
                    <h2 className="mt-3 font-['Kalam',cursive] text-2xl font-bold text-pink-900 dark:text-pink-100">Ready to generate this lesson?</h2>
                    <p className="mt-2 font-semibold text-pink-800 dark:text-pink-200">TutorMe will generate this lesson, not the remaining course.</p>
                    <button onClick={() => void handleGenerateLesson()} className="mt-5 inline-flex items-center gap-2 rounded-xl border-2 border-pink-700 bg-pink-500 px-5 py-3 font-['Kalam',cursive] text-lg font-bold text-white shadow-[2px_2px_0_#be185d]">
                      <Play className="h-5 w-5 fill-current" /> Generate lesson
                    </button>
                  </>
                )}
              </div>
            ) : (
              <>
                <div className="mt-7 whitespace-pre-wrap leading-8 text-gray-700 dark:text-gray-200">{lessonContent}</div>
                {lesson?.videoUrl && (
                  <a href={lesson.videoUrl} target="_blank" rel="noreferrer" className="mt-8 flex items-center gap-3 rounded-2xl border-2 border-red-300 bg-red-50 p-4 font-bold text-red-800 transition-colors hover:bg-red-100 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">
                    <Video className="h-6 w-6" />
                    Watch the optional supporting video
                  </a>
                )}
              </>
            )}
          </article>

          {error && <p role="alert" className="mt-5 rounded-xl border-2 border-red-300 bg-red-50 p-4 font-bold text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">{error}</p>}

          <section className="mt-6 rounded-3xl border-4 border-purple-300 bg-purple-50 p-6 shadow-[6px_6px_0_#c084fc] dark:border-purple-800 dark:bg-purple-950/30">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 font-['Kalam',cursive] text-2xl font-bold text-purple-950 dark:text-purple-100"><ClipboardCheck className="h-6 w-6" /> Lesson quiz</h2>
                <p className="mt-1 font-semibold text-purple-800 dark:text-purple-200">
                  {quizStatus.reason || (isQuizReady ? 'Your background-generated quiz is ready.' : 'Quiz status will appear after lesson generation.')}
                </p>
              </div>
              {isQuizReady ? (
                <button onClick={() => navigate('/courses/' + encodeURIComponent(courseId) + '/quizzes/' + encodeURIComponent(quizStatus.quizId || ''))} className="rounded-xl border-2 border-purple-700 bg-purple-500 px-5 py-3 font-['Kalam',cursive] text-lg font-bold text-white shadow-[2px_2px_0_#7e22ce]">
                  Take quiz
                </button>
              ) : quizStatus.isGenerating || quizStatus.state === 'queued' ? (
                <span className="inline-flex items-center gap-2 rounded-xl border-2 border-purple-300 bg-white px-4 py-3 font-bold text-purple-700 dark:border-purple-700 dark:bg-gray-900 dark:text-purple-200"><LoaderCircle className="h-5 w-5 animate-spin" /> Generating quiz…</span>
              ) : (
                <span className="rounded-xl border-2 border-purple-200 bg-white px-4 py-3 font-bold text-purple-700 dark:border-purple-700 dark:bg-gray-900 dark:text-purple-200">Waiting for lesson</span>
              )}
            </div>
          </section>
        </section>

        <aside className="flex min-h-[32rem] flex-col rounded-3xl border-4 border-yellow-300 bg-yellow-50 p-5 shadow-[6px_6px_0_#facc15] dark:border-yellow-800 dark:bg-gray-800">
          <h2 className="flex items-center gap-2 font-['Kalam',cursive] text-2xl font-bold text-yellow-900 dark:text-yellow-200"><Bot className="h-6 w-6" /> Assistant 2</h2>
          <p className="mt-1 text-sm font-bold text-yellow-800 dark:text-yellow-300">Ask about the current lesson only.</p>
          <div className="mt-5 flex flex-1 flex-col gap-3 overflow-y-auto" aria-live="polite">
            {!isLessonReady && <p className="rounded-xl bg-white/70 p-4 font-bold text-gray-600 dark:bg-gray-900/50 dark:text-gray-300">Generate the lesson before chatting about its material.</p>}
            {messages.map((message) => (
              <div key={message.id} className={message.role === 'assistant' ? 'mr-4 rounded-2xl border-2 border-yellow-200 bg-white p-3 font-semibold text-gray-700 dark:border-yellow-700 dark:bg-gray-900 dark:text-gray-200' : 'ml-4 rounded-2xl border-2 border-pink-300 bg-pink-100 p-3 font-semibold text-pink-900 dark:border-pink-700 dark:bg-pink-950/40 dark:text-pink-100'}>
                {message.content}
              </div>
            ))}
            {isChatting && <div className="mr-4 inline-flex items-center gap-2 rounded-2xl border-2 border-yellow-200 bg-white p-3 font-bold text-gray-600 dark:border-yellow-700 dark:bg-gray-900 dark:text-gray-300"><LoaderCircle className="h-5 w-5 animate-spin" /> Thinking…</div>}
          </div>
          {chatError && <p role="alert" className="mt-3 rounded-xl border-2 border-red-300 bg-red-50 p-3 font-bold text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">{chatError}</p>}
          <form onSubmit={handleTutorMessage} className="mt-4 flex gap-2">
            <input value={chatInput} onChange={(event) => setChatInput(event.target.value)} disabled={!isLessonReady || isChatting} placeholder="Ask about this lesson…" className="min-w-0 flex-1 rounded-xl border-2 border-yellow-300 bg-white px-3 py-3 font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-yellow-700 dark:bg-gray-900 dark:text-white" />
            <button type="submit" disabled={!chatInput.trim() || !isLessonReady || isChatting} className="rounded-xl border-2 border-yellow-700 bg-yellow-400 p-3 text-yellow-950 shadow-[2px_2px_0_#a16207] disabled:cursor-not-allowed disabled:opacity-60"><Send className="h-5 w-5" /></button>
          </form>
          {isCompleted && courseId && <button onClick={() => navigate('/courses/' + encodeURIComponent(courseId) + '/final-exam')} className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl border-2 border-red-700 bg-red-500 px-4 py-3 font-['Kalam',cursive] text-lg font-bold text-white shadow-[2px_2px_0_#b91c1c]"><MessageCircle className="h-5 w-5" /> Check final exam</button>}
        </aside>
      </div>
    </main>
  );
};

export default Lesson;
