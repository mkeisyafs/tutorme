import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  LoaderCircle,
  Play,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../auth/useAuth';
import { apiRequest, getApiErrorMessage } from '../lib/api';
import type { FinalExamStatus } from '../types/assessment';

const FinalExam = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const [status, setStatus] = useState<FinalExamStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isQueueing, setIsQueueing] = useState(false);
  const [error, setError] = useState('');
  const hasAutoQueued = useRef(false);

  const requestFinalExam = useCallback(async () => {
    if (!courseId) return null;
    setIsQueueing(true);
    try {
      const nextStatus = await apiRequest<FinalExamStatus>(
        '/generation/course/' + encodeURIComponent(courseId) + '/final-exam',
        { method: 'POST' }
      );
      setStatus(nextStatus);
      return nextStatus;
    } finally {
      setIsQueueing(false);
    }
  }, [courseId]);

  const loadStatus = useCallback(async () => {
    if (!courseId || !user) {
      setError(courseId ? 'Sign in to check your final-exam eligibility.' : 'This final-exam link is missing its course ID.');
      setIsLoading(false);
      return;
    }

    setError('');
    try {
      let nextStatus = await apiRequest<FinalExamStatus>(
        '/generation/course/' + encodeURIComponent(courseId) + '/final-exam'
      );
      // Already sat this exam: send the learner straight to their saved result.
      if (nextStatus.state === 'completed' && nextStatus.submissionId) {
        navigate('/submissions/' + encodeURIComponent(nextStatus.submissionId), { replace: true });
        return;
      }
      if (nextStatus.state === 'queued' && nextStatus.canGenerate && !hasAutoQueued.current) {
        hasAutoQueued.current = true;
        nextStatus = await requestFinalExam() || nextStatus;
      }
      setStatus(nextStatus);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'We could not check the final-exam status.'));
    } finally {
      setIsLoading(false);
    }
  }, [courseId, navigate, requestFinalExam, user]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (!status || (status.state !== 'queued' && status.state !== 'generating')) {
      return;
    }
    const interval = window.setInterval(() => {
      void loadStatus();
    }, 2500);
    return () => window.clearInterval(interval);
  }, [loadStatus, status]);

  const handleRetry = async () => {
    setError('');
    try {
      hasAutoQueued.current = true;
      await requestFinalExam();
      await loadStatus();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'We could not queue the final exam. Please try again.'));
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen grid place-items-center bg-gray-50 p-6 font-['Nunito',sans-serif] dark:bg-gray-900">
        <section className="rounded-3xl border-4 border-red-300 bg-white p-10 text-center shadow-[8px_8px_0_#f87171] dark:border-red-800 dark:bg-gray-800">
          <LoaderCircle className="mx-auto h-12 w-12 animate-spin text-red-500" />
          <h1 className="mt-4 font-['Kalam',cursive] text-3xl font-bold text-gray-900 dark:text-white">Checking final exam</h1>
        </section>
      </main>
    );
  }

  if (error && !status) {
    return (
      <main className="min-h-screen grid place-items-center bg-gray-50 p-6 font-['Nunito',sans-serif] dark:bg-gray-900">
        <section className="max-w-lg rounded-3xl border-4 border-red-300 bg-white p-10 text-center shadow-[8px_8px_0_#f87171] dark:border-red-800 dark:bg-gray-800">
          <ShieldAlert className="mx-auto h-12 w-12 text-red-500" />
          <h1 className="mt-4 font-['Kalam',cursive] text-3xl font-bold text-gray-900 dark:text-white">Final exam unavailable</h1>
          <p role="alert" className="mt-3 font-bold text-red-700 dark:text-red-300">{error}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button onClick={() => void loadStatus()} className="inline-flex items-center gap-2 rounded-xl border-2 border-red-700 bg-red-500 px-5 py-3 font-['Kalam',cursive] text-lg font-bold text-white shadow-[2px_2px_0_#b91c1c]"><RefreshCw className="h-5 w-5" /> Try again</button>
            <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 rounded-xl border-2 border-gray-300 bg-gray-100 px-5 py-3 font-['Kalam',cursive] text-lg font-bold text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"><ArrowLeft className="h-5 w-5" /> Go back</button>
          </div>
        </section>
      </main>
    );
  }

  const completeText = String(status?.completedLessons || 0) + '/' + String(status?.totalLessons || 0) + ' lessons completed';
  const isGenerating = status?.state === 'queued' || status?.state === 'generating' || isQueueing;

  return (
    <main className="min-h-screen grid place-items-center bg-gray-50 p-6 font-['Nunito',sans-serif] text-gray-800 dark:bg-gray-900 dark:text-gray-100">
      <section className="w-full max-w-2xl rounded-3xl border-4 border-red-300 bg-white p-8 text-center shadow-[10px_10px_0_#ef4444] dark:border-red-800 dark:bg-gray-800 sm:p-11">
        <ClipboardCheck className="mx-auto h-14 w-14 text-red-500" />
        <p className="mt-4 font-bold uppercase tracking-wider text-red-600 dark:text-red-300">Course final exam</p>
        <h1 className="mt-2 font-['Kalam',cursive] text-4xl font-bold text-gray-900 dark:text-white">
          {status?.state === 'ready' ? 'Your final exam is ready' : 'Final evaluation'}
        </h1>
        <p className="mt-4 rounded-xl border-2 border-red-200 bg-red-50 p-3 font-bold text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">{completeText}</p>

        {status?.state === 'blocked' && (
          <div className="mt-7">
            <CircleAlert className="mx-auto h-10 w-10 text-orange-500" />
            <p className="mt-3 font-semibold leading-relaxed text-gray-700 dark:text-gray-200">{status.reason || 'Complete all lessons before generating the final exam.'}</p>
            {status.retryable && <button onClick={() => void handleRetry()} className="mt-6 inline-flex items-center gap-2 rounded-xl border-2 border-red-700 bg-red-500 px-5 py-3 font-['Kalam',cursive] text-lg font-bold text-white shadow-[2px_2px_0_#b91c1c]"><RefreshCw className="h-5 w-5" /> Retry generation</button>}
          </div>
        )}

        {isGenerating && (
          <div className="mt-7">
            <LoaderCircle className="mx-auto h-12 w-12 animate-spin text-red-500" />
            <h2 className="mt-4 font-['Kalam',cursive] text-2xl font-bold">Generating your final exam</h2>
            <p className="mt-2 font-semibold text-gray-700 dark:text-gray-200">TutorMe is building the final assessment from the lessons you completed. This page updates automatically.</p>
          </div>
        )}

        {status?.state === 'ready' && status.quizId && (
          <div className="mt-7">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
            <p className="mt-3 font-semibold text-gray-700 dark:text-gray-200">The assessment is ready. Questions and grading are delivered through the protected learner quiz flow.</p>
            <button onClick={() => navigate('/courses/' + encodeURIComponent(courseId || '') + '/quizzes/' + encodeURIComponent(status.quizId || ''))} className="mt-6 inline-flex items-center gap-2 rounded-xl border-2 border-red-700 bg-red-500 px-6 py-4 font-['Kalam',cursive] text-2xl font-bold text-white shadow-[3px_3px_0_#b91c1c]"><Play className="h-6 w-6 fill-current" /> Start final exam</button>
          </div>
        )}

        {error && <p role="alert" className="mt-6 rounded-xl border-2 border-red-300 bg-red-50 p-3 font-bold text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">{error}</p>}
        <button onClick={() => navigate(-1)} className="mt-8 inline-flex items-center gap-2 font-['Kalam',cursive] text-lg font-bold text-gray-600 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-300"><ArrowLeft className="h-5 w-5" /> Back to learning</button>
      </section>
    </main>
  );
};

export default FinalExam;
