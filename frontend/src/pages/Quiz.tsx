import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useBlocker, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CircleAlert,
  ClipboardCheck,
  ImagePlus,
  LoaderCircle,
  RefreshCw,
  Send,
  X,
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

/** Convert a File to a base64 data URL string. */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
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
  // Map of questionId → uploaded File
  const [imageFiles, setImageFiles] = useState<Record<string, File>>({});
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
    setImageFiles({});

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

  const handleImageChange = (questionId: string, file: File | null) => {
    setImageFiles((prev) => {
      if (!file) {
        const next = { ...prev };
        delete next[questionId];
        return next;
      }
      return { ...prev, [questionId]: file };
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!quizId || !attempt || isSubmitting) return;

    const unanswered = attempt.questions.some((question) => {
      // Image-only essay questions don't need a text answer
      if (question.type === 'ESSAY' && question.requiresImage) return false;
      const answer = answers[question.id];
      return answer === undefined || answer === null || answer === '';
    });
    if (unanswered) {
      setError('Answer every question before you submit.');
      return;
    }

    // Validate image requirement for image-only essay questions
    const imageMissing = attempt.questions.some(
      (question) => question.type === 'ESSAY' && question.requiresImage && !imageFiles[question.id]
    );
    if (imageMissing) {
      setError('Please attach an image for the essay question before submitting.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      // Convert the first required image to base64 (one image per quiz submission)
      let imageBase64: string | null = null;
      const imageQuestion = attempt.questions.find(
        (q) => q.type === 'ESSAY' && q.requiresImage && imageFiles[q.id]
      );
      if (imageQuestion && imageFiles[imageQuestion.id]) {
        imageBase64 = await fileToBase64(imageFiles[imageQuestion.id]);
      }

      const result = await apiRequest<SubmissionResult>(
        '/generation/quiz/' + encodeURIComponent(quizId) + '/submit',
        {
          method: 'POST',
          body: {
            answers,
            timeSpentSec: Math.floor((Date.now() - startedAt.current) / 1000),
            imageBase64,
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
      <main className="flex-1 flex flex-col h-full overflow-y-auto relative p-3 sm:p-8 md:p-12 pt-14 sm:pt-8 md:pt-12">
        <div className="max-w-5xl w-full mx-auto flex flex-col flex-1">
          <button onClick={() => navigate(-1)} disabled={isSubmitting} className="mb-4 sm:mb-6 self-start inline-flex items-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-3.5 py-1.5 sm:px-4 sm:py-2 font-['Kalam',cursive] text-base sm:text-lg font-bold text-gray-700 shadow-[2px_2px_0_#9ca3af] disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"><ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" /> Back</button>
        <header className="rounded-2xl sm:rounded-3xl border-3 sm:border-4 border-purple-300 bg-purple-100 p-4 sm:p-7 shadow-[4px_4px_0_#a855f7] sm:shadow-[8px_8px_0_#a855f7] dark:border-purple-800 dark:bg-purple-950/35">
          <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">{attempt?.quiz.type === 'FINAL_EXAM' ? 'Final exam' : 'Lesson quiz'}</p>
          <h1 className="mt-1.5 sm:mt-2 flex items-center gap-2 sm:gap-3 font-['Kalam',cursive] text-2xl sm:text-4xl font-bold text-purple-950 dark:text-purple-100 leading-tight"><ClipboardCheck className="h-6 w-6 sm:h-9 sm:w-9 shrink-0 text-purple-600 dark:text-purple-400" /> {attempt?.quiz.title}</h1>
          <p className="mt-2 sm:mt-3 text-xs sm:text-base font-semibold text-purple-800 dark:text-purple-200">Your answers are graded on the server after submission. Correct answers stay hidden until the result flow.</p>
        </header>

        <form onSubmit={handleSubmit} className="mt-5 sm:mt-7 space-y-4 sm:space-y-6">
          {attempt?.questions.map((question, index) => (
            <article key={question.id} className="rounded-2xl sm:rounded-3xl border-3 sm:border-4 border-gray-300 bg-white p-4 sm:p-6 shadow-[4px_4px_0_#d1d5db] sm:shadow-[6px_6px_0_#d1d5db] dark:border-gray-700 dark:bg-gray-800">
              <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Question {index + 1}</p>
              <h2 className="mt-1.5 sm:mt-2 text-base sm:text-xl font-bold leading-relaxed text-gray-900 dark:text-white">{question.prompt}</h2>
              {question.type === 'MULTIPLE_CHOICE' ? (
                <div className="mt-3 sm:mt-5 space-y-2.5 sm:space-y-3">
                  {question.options.map((option, optionIndex) => {
                    const isSelected = answers[question.id] === optionIndex;
                    return (
                      <label key={question.id + '-' + optionIndex} className={'flex cursor-pointer items-center gap-2.5 sm:gap-3 rounded-xl sm:rounded-2xl border-2 p-3 sm:p-4 text-xs sm:text-base font-bold transition-colors ' + (isSelected ? 'border-purple-500 bg-purple-100 text-purple-950 dark:border-purple-400 dark:bg-purple-950/45 dark:text-purple-100' : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-purple-300 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-200')}>
                        <input type="radio" name={question.id} checked={isSelected} onChange={() => setAnswer(question.id, optionIndex)} disabled={isSubmitting} className="h-4 w-4 shrink-0 accent-purple-600" />
                        <span>{option}</span>
                      </label>
                    );
                  })}
                </div>
              ) : question.requiresImage ? (
                /* Image-only essay — no textarea, just the upload zone */
                <div className="mt-3 sm:mt-5">
                  <div className="rounded-xl border-2 border-dashed border-orange-300 bg-orange-50 p-4 dark:border-orange-700 dark:bg-orange-950/20">
                    <p className="mb-3 flex items-center gap-2 text-xs sm:text-sm font-bold text-orange-800 dark:text-orange-200">
                      <ImagePlus className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-orange-500" />
                      Upload an image as your answer
                    </p>

                    {imageFiles[question.id] ? (
                      <div className="space-y-3">
                        <img
                          src={URL.createObjectURL(imageFiles[question.id])}
                          alt="Your answer"
                          className="w-full max-h-64 rounded-xl object-contain border-2 border-orange-200 bg-white dark:border-orange-700 dark:bg-gray-800"
                        />
                        <div className="flex items-center justify-between gap-3 rounded-lg border-2 border-orange-200 bg-white px-3 py-2 dark:border-orange-700 dark:bg-gray-800">
                          <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">
                            {imageFiles[question.id].name}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleImageChange(question.id, null)}
                            disabled={isSubmitting}
                            className="shrink-0 rounded-lg p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                            aria-label="Remove image"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label
                        className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-orange-200 bg-white px-4 py-8 text-center transition-colors hover:border-orange-400 hover:bg-orange-50 dark:border-orange-700 dark:bg-gray-800 dark:hover:border-orange-500 ${isSubmitting ? 'pointer-events-none opacity-60' : ''}`}
                      >
                        <ImagePlus className="h-8 w-8 text-orange-400" />
                        <span className="text-sm sm:text-base font-bold text-orange-700 dark:text-orange-300">Click to upload your image</span>
                        <span className="text-xs text-orange-500 dark:text-orange-400">JPG, PNG, WEBP accepted</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="sr-only"
                          disabled={isSubmitting}
                          onChange={(e) => {
                            const file = e.target.files?.[0] ?? null;
                            handleImageChange(question.id, file);
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              ) : (
                /* Regular essay — text answer only */
                <div className="mt-3 sm:mt-5">
                  <textarea value={String(answers[question.id] ?? '')} onChange={(event) => setAnswer(question.id, event.target.value)} disabled={isSubmitting} rows={5} placeholder="Write your answer…" className="w-full rounded-xl sm:rounded-2xl border-2 border-gray-300 bg-gray-50 p-3 sm:p-4 font-semibold text-xs sm:text-base text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 disabled:cursor-wait disabled:opacity-70 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:focus:border-purple-400" />
                </div>
              )}
            </article>
          ))}

          {error && <p role="alert" className="rounded-xl border-2 border-red-300 bg-red-50 p-3.5 font-bold text-xs sm:text-base text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">{error}</p>}
          <button disabled={isSubmitting || !attempt} type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl sm:rounded-2xl border-2 border-purple-800 bg-purple-600 py-3 sm:py-4 font-['Kalam',cursive] text-lg sm:text-2xl font-bold text-white shadow-[0_4px_0_#6b21a8] sm:shadow-[0_6px_0_#6b21a8] active:translate-y-1 active:shadow-none transition-all disabled:cursor-wait disabled:opacity-70">
            {isSubmitting ? <LoaderCircle className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" /> : <Send className="h-5 w-5 sm:h-6 sm:w-6" />}
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
