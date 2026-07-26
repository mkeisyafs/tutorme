import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Download,
  LoaderCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { AssessmentReview } from '../components/AssessmentReview';
import { CourseCertificateModal } from '../components/CourseCertificateModal';
import { CourseSidebar } from '../components/CourseSidebar';
import { useAuth } from '../auth/useAuth';
import { useCourseSidebar } from '../hooks/useCourseSidebar';
import { apiRequest, getApiErrorMessage } from '../lib/api';
import { downloadCertificatePdf } from '../lib/certificate';
import type { ReturnToCourseResponse, SubmissionSummary } from '../types/assessment';
import type { CourseLesson } from '../types/course';

const CourseAnalysis = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { submissionId } = useParams<{ submissionId: string }>();
  const [summary, setSummary] = useState<SubmissionSummary | null>(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const [isDownloadingCertificate, setIsDownloadingCertificate] = useState(false);
  const [certificateError, setCertificateError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isReturning, setIsReturning] = useState(false);
  const [isNavigatingNext, setIsNavigatingNext] = useState(false);
  const [nextLessonGenerating, setNextLessonGenerating] = useState(false);
  const [isRetakingExam, setIsRetakingExam] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [error, setError] = useState('');
  const [returnError, setReturnError] = useState('');

  const lessonGenerationSteps = useMemo(() => [
    t('courseAnalysis.genSteps.s1'),
    t('courseAnalysis.genSteps.s2'),
    t('courseAnalysis.genSteps.s3'),
    t('courseAnalysis.genSteps.s4'),
  ], [t]);

  const courseId = summary?.quiz.courseId || '';
  const { courseModules, completedLessonIds, orderedLessons, progressPercent, allDone } = useCourseSidebar(courseId);

  useEffect(() => {
    if (!nextLessonGenerating) {
      setGenerationStep(0);
      return;
    }
    const timer = window.setInterval(() => {
      setGenerationStep((prev) => Math.min(prev + 1, lessonGenerationSteps.length - 1));
    }, 1200);
    return () => window.clearInterval(timer);
  }, [nextLessonGenerating, lessonGenerationSteps.length]);

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

  // Retaking regenerates a fresh set of final-exam questions server-side; the
  // saved result stays untouched so the learner can still open it later.
  const handleRetakeFinalExam = async () => {
    if (!courseId || isRetakingExam) return;
    setReturnError('');
    setIsRetakingExam(true);
    try {
      await apiRequest('/generation/course/' + encodeURIComponent(courseId) + '/final-exam/retake', { method: 'POST' });
      navigate('/courses/' + encodeURIComponent(courseId) + '/final-exam');
    } catch (requestError) {
      setReturnError(getApiErrorMessage(requestError, t('courseAnalysis.retakeFailed')));
      setIsRetakingExam(false);
    }
  };

  const handleDownloadCertificate = async () => {
    if (!summary || isDownloadingCertificate) return;
    setCertificateError('');
    setIsDownloadingCertificate(true);
    try {
      await downloadCertificatePdf({
        courseTitle,
        userName: user?.fullName || '',
        completedAt: summary.submittedAt ? new Date(summary.submittedAt) : new Date(),
      });
    } catch {
      setCertificateError(t('certificate.downloadFailed'));
    } finally {
      setIsDownloadingCertificate(false);
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
          <h1 className="mt-4 font-['Kalam',cursive] text-3xl font-bold text-gray-900 dark:text-white">{t('courseAnalysis.loadingResult')}</h1>
        </section>
      </main>
    );
  }

  if (error && !summary) {
    return (
      <main className="min-h-screen grid place-items-center bg-gray-50 p-6 font-['Nunito',sans-serif] dark:bg-gray-900">
        <section className="max-w-lg rounded-3xl border-4 border-red-300 bg-white p-10 text-center shadow-[8px_8px_0_#f87171] dark:border-red-800 dark:bg-gray-800">
          <CircleAlert className="mx-auto h-12 w-12 text-red-500" />
          <h1 className="mt-4 font-['Kalam',cursive] text-3xl font-bold text-gray-900 dark:text-white">{t('courseAnalysis.resultUnavailable')}</h1>
          <p role="alert" className="mt-3 font-bold text-red-700 dark:text-red-300">{error}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button onClick={() => void loadSummary()} className="inline-flex items-center gap-2 rounded-xl border-2 border-green-700 bg-green-500 px-5 py-3 font-['Kalam',cursive] text-lg font-bold text-white shadow-[2px_2px_0_#15803d]"><RefreshCw className="h-5 w-5" /> {t('courseAnalysis.tryAgain')}</button>
            <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 rounded-xl border-2 border-gray-300 bg-gray-100 px-5 py-3 font-['Kalam',cursive] text-lg font-bold text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"><ArrowLeft className="h-5 w-5" /> {t('courseAnalysis.goBack')}</button>
          </div>
        </section>
      </main>
    );
  }

  const passed = summary ? summary.score >= 70 : false;
  const submittedAt = summary?.submittedAt ? new Date(summary.submittedAt).toLocaleString() : '';
  const isChapterQuiz = summary?.quiz.type === 'CHAPTER_QUIZ';
  const isFinalExam = summary?.quiz.type === 'FINAL_EXAM';
  const earnedCertificate = passed && isFinalExam;
  const courseTitle = courseModules[0]?.courseTitle || summary?.quiz.title || '';

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
      <main className="flex-1 flex flex-col h-full overflow-y-auto relative p-3 sm:p-8 md:p-12 pt-14 sm:pt-8 md:pt-12">
        <div className="max-w-5xl w-full mx-auto flex flex-col flex-1">
          <section className="w-full max-w-4xl mx-auto rounded-2xl sm:rounded-3xl border-3 sm:border-4 border-green-300 bg-white p-4 sm:p-8 shadow-[5px_5px_0_#4ade80] sm:shadow-[10px_10px_0_#4ade80] dark:border-green-800 dark:bg-gray-800 md:p-11">
        <div className="text-center">
          <Award className="mx-auto h-10 w-10 sm:h-14 sm:w-14 text-green-500" />
          <p className="mt-2 sm:mt-4 text-xs sm:text-sm font-bold uppercase tracking-wider text-green-700 dark:text-green-300">{summary?.quiz.type === 'FINAL_EXAM' ? t('courseAnalysis.finalExamBadge') : t('courseAnalysis.quizResultBadge')}</p>
          <h1 className="mt-1 sm:mt-2 font-['Kalam',cursive] text-2xl sm:text-4xl font-bold text-gray-900 dark:text-white leading-tight">{summary?.quiz.title || t('courseAnalysis.assessmentResultTitle')}</h1>
        </div>

        <div className="mt-5 sm:mt-9 grid grid-cols-3 gap-2 sm:gap-4">
          <div className="rounded-xl sm:rounded-2xl border-2 border-green-300 bg-green-50 p-2.5 sm:p-5 text-center dark:border-green-800 dark:bg-green-950/30"><p className="text-[10px] sm:text-sm font-bold uppercase tracking-wide text-green-700 dark:text-green-300">{t('courseAnalysis.score')}</p><p className="mt-1 sm:mt-2 font-['Kalam',cursive] text-xl sm:text-4xl font-bold text-green-950 dark:text-green-100">{summary?.score ?? 0}%</p></div>
          <div className="rounded-xl sm:rounded-2xl border-2 border-blue-300 bg-blue-50 p-2.5 sm:p-5 text-center dark:border-blue-800 dark:bg-blue-950/30"><p className="text-[10px] sm:text-sm font-bold uppercase tracking-wide text-blue-700 dark:text-blue-300">{t('courseAnalysis.grade')}</p><p className="mt-1 sm:mt-2 font-['Kalam',cursive] text-xl sm:text-4xl font-bold text-blue-950 dark:text-blue-100">{summary?.gradeLetter || '—'}</p></div>
          <div className="rounded-xl sm:rounded-2xl border-2 border-purple-300 bg-purple-50 p-2.5 sm:p-5 text-center dark:border-purple-800 dark:bg-purple-950/30"><p className="text-[10px] sm:text-sm font-bold uppercase tracking-wide text-purple-700 dark:text-purple-300">{t('courseAnalysis.correct')}</p><p className="mt-1 sm:mt-2 font-['Kalam',cursive] text-xl sm:text-4xl font-bold text-purple-950 dark:text-purple-100">{String(summary?.correctCount ?? 0) + '/' + String(summary?.totalQuestions ?? 0)}</p></div>
        </div>

        <div className={'mt-5 sm:mt-7 rounded-xl sm:rounded-2xl border-2 p-3.5 sm:p-5 ' + (passed ? 'border-green-300 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950/30 dark:text-green-100' : 'border-orange-300 bg-orange-50 text-orange-900 dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-100')}>
          <div className="flex items-start gap-2.5 sm:gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
            <div>
              <h2 className="font-['Kalam',cursive] text-xl sm:text-2xl font-bold">{passed ? t('courseAnalysis.greatWork') : t('courseAnalysis.keepPracticing')}</h2>
              <p className="mt-0.5 sm:mt-1 text-xs sm:text-base font-semibold">{passed ? t('courseAnalysis.passedDesc') : t('courseAnalysis.failedDesc')}</p>
            </div>
          </div>
        </div>

        {summary?.aiFeedback && (
          <div className="mt-4 sm:mt-6 rounded-xl sm:rounded-2xl border-2 border-blue-200 bg-blue-50/60 p-3.5 sm:p-5 dark:border-blue-800 dark:bg-blue-950/20">
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-blue-500 dark:text-blue-400">{t('courseAnalysis.aiFeedback')}</p>
            <p className="mt-1.5 sm:mt-2 whitespace-pre-wrap text-xs sm:text-base font-medium leading-relaxed text-gray-700 dark:text-gray-200">{summary.aiFeedback}</p>
          </div>
        )}

        {summary?.review && <AssessmentReview review={summary.review} userAnswers={summary.userAnswers} />}

        {/* Certificate download sits at the bottom of the final-exam review. */}
        {earnedCertificate && (
          <section className="mt-6 sm:mt-8 rounded-xl sm:rounded-2xl border-2 border-blue-300 bg-blue-50 p-4 sm:p-6 text-center dark:border-blue-800 dark:bg-blue-950/30">
            <Award className="mx-auto h-9 w-9 sm:h-12 sm:w-12 text-blue-500" />
            <h2 className="mt-2 font-['Kalam',cursive] text-xl sm:text-2xl font-bold text-blue-950 dark:text-blue-100">{t('certificate.earnedTitle')}</h2>
            <p className="mt-1 text-xs sm:text-base font-semibold text-blue-800 dark:text-blue-200">{t('certificate.earnedDesc')}</p>
            {certificateError && (
              <p role="alert" className="mt-3 rounded-xl border-2 border-red-300 bg-red-50 p-2.5 text-xs sm:text-sm font-bold text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">{certificateError}</p>
            )}
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3">
              <button
                onClick={() => setShowCertificate(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border-2 border-blue-700 bg-white px-5 py-3 font-['Kalam',cursive] text-base sm:text-lg font-bold text-blue-700 shadow-[2px_2px_0_#1d4ed8] transition-all hover:bg-blue-50 active:translate-y-0.5 active:shadow-none dark:bg-gray-800 dark:text-blue-300"
              >
                <Award className="h-5 w-5" /> {t('certificate.getButton')}
              </button>
              <button
                onClick={() => void handleDownloadCertificate()}
                disabled={isDownloadingCertificate}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border-2 border-blue-700 bg-blue-500 px-5 py-3 font-['Kalam',cursive] text-base sm:text-lg font-bold text-white shadow-[2px_2px_0_#1d4ed8] transition-all hover:bg-blue-600 active:translate-y-0.5 active:shadow-none disabled:cursor-wait disabled:opacity-70"
              >
                {isDownloadingCertificate ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />} {t('certificate.download')}
              </button>
            </div>
          </section>
        )}

        {submittedAt && <p className="mt-5 sm:mt-7 text-center text-xs sm:text-sm text-gray-400 dark:text-gray-500">{submittedAt}</p>}
        {error && <p role="alert" className="mt-3 sm:mt-4 rounded-xl border-2 border-orange-300 bg-orange-50 p-3 text-center text-xs sm:text-sm font-bold text-orange-800 dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-200">{error}</p>}
        {returnError && <p role="alert" aria-live="polite" className="mt-3 sm:mt-4 rounded-xl border-2 border-red-300 bg-red-50 p-3 text-center text-xs sm:text-sm font-bold text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">{returnError}</p>}
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-center gap-3">
          <button onClick={() => void handleBackToCourse()} disabled={isReturning || isNavigatingNext || !summary} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border-2 border-green-700 bg-green-500 px-5 py-3 font-['Kalam',cursive] text-base sm:text-lg font-bold text-white shadow-[2px_2px_0_#15803d] disabled:cursor-wait disabled:opacity-70">{isReturning ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />} {isReturning ? t('courseAnalysis.returning') : t('courseAnalysis.backToCourse')}</button>
          {isFinalExam && (
            <button
              onClick={() => void handleRetakeFinalExam()}
              disabled={isRetakingExam}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border-2 border-orange-700 bg-orange-500 px-5 py-3 font-['Kalam',cursive] text-base sm:text-lg font-bold text-white shadow-[2px_2px_0_#c2410c] transition-all hover:bg-orange-600 active:translate-y-0.5 active:shadow-none disabled:cursor-wait disabled:opacity-70"
            >
              {isRetakingExam ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
              {isRetakingExam ? t('courseAnalysis.retakeStarting') : t('courseAnalysis.retakeExam')}
            </button>
          )}
          {isChapterQuiz && nextLesson && (
            <button
              onClick={() => void handleNextLesson()}
              disabled={isNavigatingNext || isReturning}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border-2 border-blue-700 bg-blue-500 px-5 py-3 font-['Kalam',cursive] text-base sm:text-lg font-bold text-white shadow-[2px_2px_0_#1d4ed8] hover:bg-blue-600 transition-all disabled:cursor-wait disabled:opacity-70"
            >
              {isNavigatingNext ? (
                <>
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                  {nextLessonGenerating ? t('courseAnalysis.generatingLesson') : t('common.loading')}
                </>
              ) : (
                <>
                  {nextLesson.isGenerated ? null : <Sparkles className="h-5 w-5 fill-current" />}
                  {t('courseAnalysis.nextLesson')}
                  <ChevronRight className="h-5 w-5" />
                </>
              )}
            </button>
          )}
        </div>
      </section>
        </div>
      </main>

      {/* ── Course Certificate Modal ── */}
      {showCertificate && (
        <CourseCertificateModal
          courseTitle={courseTitle}
          userName={user?.fullName || ''}
          completedAt={summary?.submittedAt}
          onClose={() => setShowCertificate(false)}
        />
      )}

      {/* ── Next Lesson Generation Modal ── */}
      {nextLessonGenerating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/20 p-2.5 sm:p-4 backdrop-blur-md dark:bg-gray-900/40" role="dialog" aria-modal="true" aria-labelledby="lesson-generation-modal-title">
          <div className="relative w-[calc(100vw-1rem)] sm:w-full max-w-xl scale-100 sm:scale-105 transition-all duration-300">
            <div className="pointer-events-none absolute left-1/2 top-0 z-20 h-6 sm:h-8 w-20 sm:w-24 -translate-x-1/2 -translate-y-3 sm:-translate-y-4 -rotate-2 rounded-sm border border-blue-200/50 bg-blue-400/40 backdrop-blur-md dark:border-blue-700/50 dark:bg-blue-500/40" />
            <div className="relative overflow-hidden rounded-2xl border-3 sm:border-4 border-blue-400 bg-blue-50/95 shadow-[4px_4px_0px_0px_rgba(96,165,250,1)] sm:shadow-[8px_8px_0px_0px_rgba(96,165,250,1)] backdrop-blur-xl dark:border-blue-700 dark:bg-gray-800/95 dark:shadow-[4px_4px_0px_0px_rgba(30,58,138,0.8)] sm:dark:shadow-[8px_8px_0px_0px_rgba(30,58,138,0.8)]">
              <div className="relative p-5 sm:p-8 md:p-10">
                <div className="mx-auto flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-xl sm:rounded-2xl border-3 sm:border-4 border-blue-300 bg-white shadow-[3px_3px_0_#60a5fa] sm:shadow-[4px_4px_0_#60a5fa] dark:border-blue-700 dark:bg-gray-900 dark:shadow-[3px_3px_0_rgba(30,58,138,0.7)] sm:dark:shadow-[4px_4px_0_rgba(30,58,138,0.7)]">
                  <Sparkles className="h-6 w-6 sm:h-9 sm:w-9 text-blue-500 fill-blue-500 animate-spin" />
                </div>
                <h2 id="lesson-generation-modal-title" className="mt-3 sm:mt-5 text-center font-['Kalam',cursive] text-2xl sm:text-3xl font-bold text-blue-950 dark:text-blue-100 leading-tight">
                  {t('courseAnalysis.generatingNextLessonTitle')}
                </h2>
                <p className="mt-1.5 text-center font-semibold text-xs sm:text-base text-blue-800 dark:text-blue-200">
                  {nextLesson?.title ? t('courseAnalysis.creatingNextLesson', { title: nextLesson.title }) : t('courseAnalysis.creatingNextLessonFallback')}
                </p>

                <div className="mt-5 sm:mt-8 space-y-3 sm:space-y-5 font-['Nunito',sans-serif] text-sm sm:text-lg font-bold text-blue-950 dark:text-blue-100">
                  {lessonGenerationSteps.map((step, index) => {
                    const isComplete = index < generationStep;
                    const isCurrent = index === generationStep;
                    return (
                      <div key={step} className={`flex items-center gap-2.5 sm:gap-4 transition-all duration-500 ${isCurrent ? 'translate-x-1 sm:translate-x-2 scale-105 text-blue-600 dark:text-blue-300' : isComplete ? 'opacity-80' : 'opacity-40'}`}>
                        {isComplete ? <CheckCircle2 className="h-5 w-5 sm:h-7 sm:w-7 flex-none text-green-500" /> : isCurrent ? <LoaderCircle className="h-5 w-5 sm:h-7 sm:w-7 flex-none animate-spin text-blue-500" /> : <span className="h-4 w-4 sm:h-6 sm:w-6 flex-none rounded-md border-2 border-blue-300 dark:border-blue-700" />}
                        <span>{step}</span>
                      </div>
                    );
                  })}
                </div>
                <Sparkles className="pointer-events-none absolute -bottom-8 -right-8 h-32 w-32 sm:h-40 sm:w-40 animate-pulse fill-blue-500 text-blue-500 opacity-20 hidden sm:block" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseAnalysis;
