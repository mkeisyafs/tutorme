import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useBlocker, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CircleAlert,
  ClipboardCheck,
  LoaderCircle,
  RefreshCw,
  Send,
} from 'lucide-react';
import { ApiError, apiRequest, getApiErrorMessage } from '../lib/api';
import { QuizSubmissionAnalysisModal } from '../components/QuizSubmissionAnalysisModal';
import { INVALID_QUIZ_ATTEMPT_MESSAGE, emptyQuizFormState, resolveLoadedQuizAttempt } from './quizAttemptRouting';
import { CourseSidebar } from '../components/CourseSidebar';
import { useCourseSidebar } from '../hooks/useCourseSidebar';
import type { ActiveQuizAttempt, QuizAnswer, SubmissionResult } from '../types/assessment';

function assertNever(_value: never): never {
  throw new Error('Unhandled loaded quiz action: ' + typeof _value);
}

const Quiz = () => {
  const navigate = useNavigate();
  const { quizId } = useParams<{ quizId: string }>();
  const [attempt, setAttempt] = useState<ActiveQuizAttempt | null>(null);
  const [answers, setAnswers] = useState<Record<string, QuizAnswer>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  const startedAt = useRef<number>(0);
  const blocker = useBlocker(({ nextLocation }) => (
    isSubmitting && !nextLocation.pathname.startsWith('/submissions/')
  ));

  const courseId = attempt?.quiz.courseId || '';
  const { courseModules, completedLessonIds, orderedLessons, progressPercent, allDone } = useCourseSidebar(courseId);

  const loadAttempt = useCallback(async () => {
    const emptyState = emptyQuizFormState();
    setAttempt(emptyState.attempt);
    setAnswers(emptyState.answers);
    setIsBlocked(emptyState.isBlocked);

    if (!quizId) {
      setError('This quiz link is missing its quiz ID.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const nextAttempt = await apiRequest<unknown>(
        '/generation/quiz/' + encodeURIComponent(quizId) + '/attempt'
      );
      const action = resolveLoadedQuizAttempt(nextAttempt);
      switch (action.kind) {
        case 'invalid_payload':
          setError(INVALID_QUIZ_ATTEMPT_MESSAGE);
          setIsBlocked(true);
          return;
        case 'redirect':
          navigate(action.route, { replace: true });
          return;
        case 'render':
          setAttempt(action.attempt);
          break;
        default:
          assertNever(action);
      }
      startedAt.current = Date.now();
    } catch (requestError) {
      const message = getApiErrorMessage(requestError, 'We could not load this quiz.');
      setError(message);
      const status = requestError instanceof ApiError ? requestError.status : 0;
      setIsBlocked(status === 401 || status === 403 || status === 409);
    } finally {
      setIsLoading(false);
    }
  }, [navigate, quizId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAttempt();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadAttempt]);

  useEffect(() => {
    if (blocker.state === 'blocked') blocker.reset();
  }, [blocker]);

  const setAnswer = (questionId: string, answer: string | number) => {
    setAnswers((currentAnswers) => ({ ...currentAnswers, [questionId]: answer }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!quizId || !attempt || isSubmitting) return;

    const unanswered = attempt.questions.some((question) => {
      const answer = answers[question.id];
      return answer === undefined || answer === null || answer === '';
    });
    if (unanswered) {
      setError('Answer every question before you submit.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      const result = await apiRequest<SubmissionResult>(
        '/generation/quiz/' + encodeURIComponent(quizId) + '/submit',
        {
          method: 'POST',
          body: {
            answers,
            timeSpentSec: Math.floor((Date.now() - startedAt.current) / 1000),
          },
        }
      );
      setIsSubmitting(false);
      navigate('/submissions/' + encodeURIComponent(result.submissionId), {
        state: { result },
      });
    } catch {
      setIsSubmitting(false);
      setError('We could not finish grading your submission. Your answers are still here. Please check your connection and try again.');
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen grid place-items-center bg-gray-50 p-6 font-['Nunito',sans-serif] dark:bg-gray-900">
        <section className="rounded-3xl border-4 border-purple-300 bg-white p-10 text-center shadow-[8px_8px_0_#c084fc] dark:border-purple-800 dark:bg-gray-800">
          <LoaderCircle className="mx-auto h-12 w-12 animate-spin text-purple-500" />
          <h1 className="mt-4 font-['Kalam',cursive] text-3xl font-bold text-gray-900 dark:text-white">Loading your quiz</h1>
        </section>
      </main>
    );
  }

  if (error && (!attempt || isBlocked)) {
    return (
      <main className="min-h-screen grid place-items-center bg-gray-50 p-6 font-['Nunito',sans-serif] dark:bg-gray-900">
        <section className="max-w-lg rounded-3xl border-4 border-red-300 bg-white p-10 text-center shadow-[8px_8px_0_#f87171] dark:border-red-800 dark:bg-gray-800">
          <CircleAlert className="mx-auto h-12 w-12 text-red-500" />
          <h1 className="mt-4 font-['Kalam',cursive] text-3xl font-bold text-gray-900 dark:text-white">{isBlocked ? 'Quiz not ready' : 'Quiz unavailable'}</h1>
          <p role="alert" className="mt-3 font-bold text-red-700 dark:text-red-300">{error}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {!isBlocked && <button onClick={() => void loadAttempt()} className="inline-flex items-center gap-2 rounded-xl border-2 border-purple-700 bg-purple-500 px-5 py-3 font-['Kalam',cursive] text-lg font-bold text-white shadow-[2px_2px_0_#7e22ce]"><RefreshCw className="h-5 w-5" /> Try again</button>}
            <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 rounded-xl border-2 border-gray-300 bg-gray-100 px-5 py-3 font-['Kalam',cursive] text-lg font-bold text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"><ArrowLeft className="h-5 w-5" /> Go back</button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <div className="h-screen w-full flex bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-['Nunito',sans-serif] overflow-hidden transition-colors duration-300 relative">
      <CourseSidebar
        courseId={courseId}
        courseModules={courseModules}
        completedLessonIds={completedLessonIds}
        orderedLessons={orderedLessons}
        progressPercent={progressPercent}
        allDone={allDone}
      />
      <main className="flex-1 flex flex-col h-full overflow-y-auto relative p-8 md:p-12">
        <div className="max-w-5xl w-full mx-auto flex flex-col flex-1">
          <button onClick={() => navigate(-1)} disabled={isSubmitting} className="mb-6 self-start inline-flex items-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-4 py-2 font-['Kalam',cursive] text-lg font-bold text-gray-700 shadow-[2px_2px_0_#9ca3af] disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"><ArrowLeft className="h-5 w-5" /> Back</button>
        <header className="rounded-3xl border-4 border-purple-300 bg-purple-100 p-7 shadow-[8px_8px_0_#a855f7] dark:border-purple-800 dark:bg-purple-950/35">
          <p className="font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">{attempt?.quiz.type === 'FINAL_EXAM' ? 'Final exam' : 'Lesson quiz'}</p>
          <h1 className="mt-2 flex items-center gap-3 font-['Kalam',cursive] text-4xl font-bold text-purple-950 dark:text-purple-100"><ClipboardCheck className="h-9 w-9" /> {attempt?.quiz.title}</h1>
          <p className="mt-3 font-semibold text-purple-800 dark:text-purple-200">Your answers are graded on the server after submission. Correct answers stay hidden until the result flow.</p>
        </header>

        <form onSubmit={handleSubmit} className="mt-7 space-y-6">
          {attempt?.questions.map((question, index) => (
            <article key={question.id} className="rounded-3xl border-4 border-gray-300 bg-white p-6 shadow-[6px_6px_0_#d1d5db] dark:border-gray-700 dark:bg-gray-800">
              <p className="font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Question {index + 1}</p>
              <h2 className="mt-2 text-xl font-bold leading-relaxed text-gray-900 dark:text-white">{question.prompt}</h2>
              {question.type === 'MULTIPLE_CHOICE' ? (
                <div className="mt-5 space-y-3">
                  {question.options.map((option, optionIndex) => {
                    const isSelected = answers[question.id] === optionIndex;
                    return (
                      <label key={question.id + '-' + optionIndex} className={'flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-4 font-bold transition-colors ' + (isSelected ? 'border-purple-500 bg-purple-100 text-purple-950 dark:border-purple-400 dark:bg-purple-950/45 dark:text-purple-100' : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-purple-300 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-200')}>
                        <input type="radio" name={question.id} checked={isSelected} onChange={() => setAnswer(question.id, optionIndex)} disabled={isSubmitting} className="h-4 w-4 accent-purple-600" />
                        <span>{option}</span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-5">
                  <textarea value={String(answers[question.id] ?? '')} onChange={(event) => setAnswer(question.id, event.target.value)} disabled={isSubmitting} rows={6} placeholder="Write your answer…" className="w-full rounded-2xl border-2 border-gray-300 bg-gray-50 p-4 font-semibold text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 disabled:cursor-wait disabled:opacity-70 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:focus:border-purple-400" />
                  {question.requiresImage && <p className="mt-3 rounded-xl border-2 border-orange-300 bg-orange-50 p-3 font-bold text-orange-800 dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-200">This question requests an image, but a secure upload contract is not configured yet. Save the written answer and ask an instructor before submitting an image.</p>}
                </div>
              )}
            </article>
          ))}

          {error && <p role="alert" className="rounded-xl border-2 border-red-300 bg-red-50 p-4 font-bold text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">{error}</p>}
          <button disabled={isSubmitting || !attempt} type="submit" className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-purple-800 bg-purple-600 py-4 font-['Kalam',cursive] text-2xl font-bold text-white shadow-[0_6px_0_#6b21a8] disabled:cursor-wait disabled:opacity-70">
            {isSubmitting ? <LoaderCircle className="h-6 w-6 animate-spin" /> : <Send className="h-6 w-6" />}
            {isSubmitting ? 'Submitting answers…' : 'Submit for server grading'}
          </button>
        </form>
      </div>
      </main>
      <QuizSubmissionAnalysisModal isOpen={isSubmitting} attempt={attempt} />
    </div>
  );
};

export default Quiz;
