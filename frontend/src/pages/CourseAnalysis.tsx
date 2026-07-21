import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  LoaderCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { AssessmentReview } from '../components/AssessmentReview';
import { CourseSidebar } from '../components/CourseSidebar';
import { useCourseSidebar } from '../hooks/useCourseSidebar';
import { apiRequest, getApiErrorMessage } from '../lib/api';
import type { ReturnToCourseResponse, SubmissionSummary } from '../types/assessment';
import type { CourseLesson } from '../types/course';

const CourseAnalysis = () => {
  const navigate = useNavigate();
  const { submissionId } = useParams<{ submissionId: string }>();
  const [summary, setSummary] = useState<SubmissionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReturning, setIsReturning] = useState(false);
  const [isNavigatingNext, setIsNavigatingNext] = useState(false);
  const [nextLessonGenerating, setNextLessonGenerating] = useState(false);
  const [error, setError] = useState('');
  const [returnError, setReturnError] = useState('');

  const courseId = summary?.quiz.courseId || '';
  const { courseModules, completedLessonIds, orderedLessons, progressPercent, allDone } = useCourseSidebar(courseId);

  const loadSummary = useCallback(async () => {
    if (!submissionId) {
      setError('This result link is missing its submission ID.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const response = await apiRequest<SubmissionSummary>(
        '/generation/submission/' + encodeURIComponent(submissionId)
      );
      setSummary(response);
      setReturnError('');
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'We could not load this assessment result.'));
    } finally {
      setIsLoading(false);
    }
  }, [submissionId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSummary();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadSummary]);

  const handleBackToCourse = async () => {
    if (!summary) return;
    if (summary.quiz.type === 'FINAL_EXAM') {
      navigate('/courses/' + encodeURIComponent(summary.quiz.courseId));
      return;
    }
    if (!submissionId || isReturning) return;

    setReturnError('');
    setIsReturning(true);
    try {
      const result = await apiRequest<ReturnToCourseResponse>(
        '/generation/submission/' + encodeURIComponent(submissionId) + '/return-to-course',
        { method: 'POST' }
      );
      navigate('/courses/' + encodeURIComponent(result.courseId) + '/lessons/' + encodeURIComponent(result.lessonId));
    } catch (requestError) {
      setReturnError(getApiErrorMessage(requestError, 'We could not return you to the course. Please try again.'));
    } finally {
      setIsReturning(false);
    }
  };

  const currentLessonIndex = useMemo(
    () => summary?.quiz.lessonId ? orderedLessons.findIndex((l) => l.id === summary.quiz.lessonId) : -1,
    [orderedLessons, summary?.quiz.lessonId]
  );
  const nextLesson: CourseLesson | null =
    currentLessonIndex >= 0 && currentLessonIndex < orderedLessons.length - 1
      ? orderedLessons[currentLessonIndex + 1]
      : null;

  if (isLoading && !summary) {
    return (
      <main className="min-h-screen grid place-items-center bg-gray-50 p-6 font-['Nunito',sans-serif] dark:bg-gray-900">
        <section className="rounded-3xl border-4 border-green-300 bg-white p-10 text-center shadow-[8px_8px_0_#4ade80] dark:border-green-800 dark:bg-gray-800">
          <LoaderCircle className="mx-auto h-12 w-12 animate-spin text-green-500" />
          <h1 className="mt-4 font-['Kalam',cursive] text-3xl font-bold text-gray-900 dark:text-white">Loading your result</h1>
        </section>
      </main>
    );
  }

  if (error && !summary) {
    return (
      <main className="min-h-screen grid place-items-center bg-gray-50 p-6 font-['Nunito',sans-serif] dark:bg-gray-900">
        <section className="max-w-lg rounded-3xl border-4 border-red-300 bg-white p-10 text-center shadow-[8px_8px_0_#f87171] dark:border-red-800 dark:bg-gray-800">
          <CircleAlert className="mx-auto h-12 w-12 text-red-500" />
          <h1 className="mt-4 font-['Kalam',cursive] text-3xl font-bold text-gray-900 dark:text-white">Result unavailable</h1>
          <p role="alert" className="mt-3 font-bold text-red-700 dark:text-red-300">{error}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button onClick={() => void loadSummary()} className="inline-flex items-center gap-2 rounded-xl border-2 border-green-700 bg-green-500 px-5 py-3 font-['Kalam',cursive] text-lg font-bold text-white shadow-[2px_2px_0_#15803d]"><RefreshCw className="h-5 w-5" /> Try again</button>
            <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 rounded-xl border-2 border-gray-300 bg-gray-100 px-5 py-3 font-['Kalam',cursive] text-lg font-bold text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"><ArrowLeft className="h-5 w-5" /> Go back</button>
          </div>
        </section>
      </main>
    );
  }

  const passed = summary ? summary.score >= 70 : false;
  const submittedAt = summary?.submittedAt ? new Date(summary.submittedAt).toLocaleString() : '';
  const isChapterQuiz = summary?.quiz.type === 'CHAPTER_QUIZ';

  const handleNextLesson = async () => {
    if (!nextLesson || !courseId || isNavigatingNext) return;
    setIsNavigatingNext(true);
    setReturnError('');
    try {
      // First mark the current lesson complete via return-to-course
      if (submissionId && isChapterQuiz) {
        await apiRequest<ReturnToCourseResponse>(
          '/generation/submission/' + encodeURIComponent(submissionId) + '/return-to-course',
          { method: 'POST' }
        ).catch(() => { /* already completed, ignore */ });
      }
      // If the next lesson isn't generated, trigger generation and wait
      if (!nextLesson.isGenerated) {
        setNextLessonGenerating(true);
        await apiRequest(
          '/generation/lesson/' + encodeURIComponent(nextLesson.id) + '/generate',
          { method: 'POST' }
        );
        setNextLessonGenerating(false);
      }
      navigate('/courses/' + encodeURIComponent(courseId) + '/lessons/' + encodeURIComponent(nextLesson.id));
    } catch (requestError) {
      setNextLessonGenerating(false);
      setReturnError(getApiErrorMessage(requestError, 'Could not navigate to the next lesson.'));
    } finally {
      setIsNavigatingNext(false);
    }
  };

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
          <section className="w-full max-w-4xl mx-auto rounded-3xl border-4 border-green-300 bg-white p-8 shadow-[10px_10px_0_#4ade80] dark:border-green-800 dark:bg-gray-800 sm:p-11">
        <div className="text-center">
          <Award className="mx-auto h-14 w-14 text-green-500" />
          <p className="mt-4 font-bold uppercase tracking-wider text-green-700 dark:text-green-300">{summary?.quiz.type === 'FINAL_EXAM' ? 'Final exam result' : 'Lesson quiz result'}</p>
          <h1 className="mt-2 font-['Kalam',cursive] text-4xl font-bold text-gray-900 dark:text-white">{summary?.quiz.title || 'Assessment result'}</h1>
          <p className="mt-3 font-semibold text-gray-600 dark:text-gray-300">Your result was calculated and stored by the server.</p>
        </div>

        <div className="mt-9 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border-2 border-green-300 bg-green-50 p-5 text-center dark:border-green-800 dark:bg-green-950/30"><p className="text-sm font-bold uppercase tracking-wide text-green-700 dark:text-green-300">Score</p><p className="mt-2 font-['Kalam',cursive] text-4xl font-bold text-green-950 dark:text-green-100">{summary?.score ?? 0}%</p></div>
          <div className="rounded-2xl border-2 border-blue-300 bg-blue-50 p-5 text-center dark:border-blue-800 dark:bg-blue-950/30"><p className="text-sm font-bold uppercase tracking-wide text-blue-700 dark:text-blue-300">Grade</p><p className="mt-2 font-['Kalam',cursive] text-4xl font-bold text-blue-950 dark:text-blue-100">{summary?.gradeLetter || '—'}</p></div>
          <div className="rounded-2xl border-2 border-purple-300 bg-purple-50 p-5 text-center dark:border-purple-800 dark:bg-purple-950/30"><p className="text-sm font-bold uppercase tracking-wide text-purple-700 dark:text-purple-300">Correct</p><p className="mt-2 font-['Kalam',cursive] text-4xl font-bold text-purple-950 dark:text-purple-100">{String(summary?.correctCount ?? 0) + '/' + String(summary?.totalQuestions ?? 0)}</p></div>
        </div>

        <div className={'mt-7 rounded-2xl border-2 p-5 ' + (passed ? 'border-green-300 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950/30 dark:text-green-100' : 'border-orange-300 bg-orange-50 text-orange-900 dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-100')}>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-6 w-6 flex-shrink-0" />
            <div>
              <h2 className="font-['Kalam',cursive] text-2xl font-bold">{passed ? 'Great work!' : 'Keep practicing'}</h2>
              <p className="mt-1 font-semibold">{passed ? 'You reached the passing score for this assessment.' : 'Review the lesson material and try the next practice opportunity when it is available.'}</p>
            </div>
          </div>
        </div>

        {summary?.aiFeedback && <section className="mt-7 rounded-2xl border-2 border-pink-300 bg-pink-50 p-5 dark:border-pink-800 dark:bg-pink-950/30"><h2 className="font-['Kalam',cursive] text-2xl font-bold text-pink-950 dark:text-pink-100">Tutor feedback</h2><p className="mt-2 whitespace-pre-wrap font-semibold leading-relaxed text-pink-900 dark:text-pink-200">{summary.aiFeedback}</p></section>}

        {isChapterQuiz && <AssessmentReview review={summary?.review} userAnswers={summary?.userAnswers} />}

        <p className="mt-7 text-center text-sm font-bold text-gray-500 dark:text-gray-400">{submittedAt ? 'Submitted ' + submittedAt : ''}</p>
        {error && <p role="alert" className="mt-4 rounded-xl border-2 border-orange-300 bg-orange-50 p-3 text-center font-bold text-orange-800 dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-200">The saved result is shown, but refreshing it failed: {error}</p>}
        {returnError && <p role="alert" aria-live="polite" className="mt-4 rounded-xl border-2 border-red-300 bg-red-50 p-3 text-center font-bold text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">{returnError}</p>}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {isChapterQuiz && nextLesson && (
            <button
              onClick={() => void handleNextLesson()}
              disabled={isNavigatingNext || isReturning}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-blue-700 bg-blue-500 px-5 py-3 font-['Kalam',cursive] text-lg font-bold text-white shadow-[2px_2px_0_#1d4ed8] hover:bg-blue-600 transition-all disabled:cursor-wait disabled:opacity-70"
            >
              {isNavigatingNext ? (
                <>
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                  {nextLessonGenerating ? 'Generating lesson…' : 'Loading…'}
                </>
              ) : (
                <>
                  {nextLesson.isGenerated ? null : <Sparkles className="h-5 w-5 fill-current" />}
                  Next Lesson
                  <ChevronRight className="h-5 w-5" />
                </>
              )}
            </button>
          )}
          <button onClick={() => void handleBackToCourse()} disabled={isReturning || isNavigatingNext || !summary} className="inline-flex items-center gap-2 rounded-xl border-2 border-green-700 bg-green-500 px-5 py-3 font-['Kalam',cursive] text-lg font-bold text-white shadow-[2px_2px_0_#15803d] disabled:cursor-wait disabled:opacity-70">{isReturning ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />} {isReturning ? 'Returning…' : 'Back to course'}</button>
          <button onClick={() => navigate(-1)} disabled={isReturning || isNavigatingNext} className="inline-flex items-center gap-2 rounded-xl border-2 border-gray-300 bg-gray-100 px-5 py-3 font-['Kalam',cursive] text-lg font-bold text-gray-700 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"><ArrowLeft className="h-5 w-5" /> Previous page</button>
        </div>
      </section>
        </div>
      </main>
    </div>
  );
};

export default CourseAnalysis;
