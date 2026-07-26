import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/DashboardLayout';
import { useCourseGeneration } from '../context/CourseGenerationContext';
import { Play, Flame, Clock, Sparkles, LoaderCircle, BookOpen } from 'lucide-react';
import { useAuth } from '../auth/useAuth';
import { apiRequest, getApiErrorMessage } from '../lib/api';
import type { CourseColor } from '../types/course';
import type { DashboardData } from '../types/dashboard';

const recentCardStyles: Record<CourseColor, { card: string; border: string; tape: string; title: string; track: string; progress: string; text: string }> = {
  blue: { card: 'bg-blue-100 dark:bg-blue-900/40', border: 'border-blue-300 dark:border-blue-700/50', tape: 'bg-blue-500/30 dark:bg-blue-400/20', title: 'text-blue-900 dark:text-blue-300', track: 'bg-blue-200 dark:bg-blue-800/50', progress: 'bg-blue-500 dark:bg-blue-400', text: 'text-blue-700 dark:text-blue-400/80' },
  yellow: { card: 'bg-yellow-100 dark:bg-yellow-900/40', border: 'border-yellow-300 dark:border-yellow-700/50', tape: 'bg-yellow-500/30 dark:bg-yellow-400/20', title: 'text-yellow-900 dark:text-yellow-300', track: 'bg-yellow-200 dark:bg-yellow-800/50', progress: 'bg-yellow-500 dark:bg-yellow-400', text: 'text-yellow-700 dark:text-yellow-400/80' },
  green: { card: 'bg-green-100 dark:bg-green-900/40', border: 'border-green-300 dark:border-green-700/50', tape: 'bg-green-500/30 dark:bg-green-400/20', title: 'text-green-900 dark:text-green-300', track: 'bg-green-200 dark:bg-green-800/50', progress: 'bg-green-500 dark:bg-green-400', text: 'text-green-700 dark:text-green-400/80' },
  pink: { card: 'bg-pink-100 dark:bg-pink-900/40', border: 'border-pink-300 dark:border-pink-700/50', tape: 'bg-pink-500/30 dark:bg-pink-400/20', title: 'text-pink-900 dark:text-pink-300', track: 'bg-pink-200 dark:bg-pink-800/50', progress: 'bg-pink-500 dark:bg-pink-400', text: 'text-pink-700 dark:text-pink-400/80' },
  purple: { card: 'bg-purple-100 dark:bg-purple-900/40', border: 'border-purple-300 dark:border-purple-700/50', tape: 'bg-purple-500/30 dark:bg-purple-400/20', title: 'text-purple-900 dark:text-purple-300', track: 'bg-purple-200 dark:bg-purple-800/50', progress: 'bg-purple-500 dark:bg-purple-400', text: 'text-purple-700 dark:text-purple-400/80' },
};

const normaliseColor = (color: string): CourseColor => (
  Object.hasOwn(recentCardStyles, color) ? color as CourseColor : 'blue'
);

const clampProgress = (progress: number) => Math.min(100, Math.max(0, progress));

const Home = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [topic, setTopic] = useState('');
  const { openModal } = useCourseGeneration();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletionCanceledNotice, setDeletionCanceledNotice] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('tutorme_deletion_canceled') === 'true') {
      setDeletionCanceledNotice(true);
      sessionStorage.removeItem('tutorme_deletion_canceled');
    }
  }, []);

  useEffect(() => {
    let isCurrent = true;

    const loadDashboard = async () => {
      try {
        const response = await apiRequest<DashboardData>('/users/me/dashboard');
        if (isCurrent) {
          setDashboard({
            ...response,
            continueCourse: response.continueCourse ? { ...response.continueCourse, color: normaliseColor(response.continueCourse.color) } : null,
            recentCourses: response.recentCourses.map((course) => ({ ...course, color: normaliseColor(course.color) })),
          });
        }
      } catch (requestError) {
        if (isCurrent) setError(getApiErrorMessage(requestError, t('home.loadDashboardError')));
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    };

    void loadDashboard();
    return () => {
      isCurrent = false;
    };
  }, [t]);

  const handleGenerate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    openModal(topic);
  };

  const displayName = dashboard?.fullName ?? user?.fullName ?? t('common.learner');
  const streakCount = dashboard?.streakCount ?? 0;
  const continueCourse = dashboard?.continueCourse;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto md:mx-0">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12 gap-4 sm:gap-6">
          <div>
            <h1 className="text-2xl sm:text-4xl font-['Kalam',cursive] font-bold text-gray-900 dark:text-gray-100 mb-1 sm:mb-2 leading-tight">{t('home.welcome')}, {displayName}! 👋</h1>
            <p className="text-gray-600 dark:text-gray-400 font-bold text-sm sm:text-lg">{t('home.subtitle')}</p>
          </div>
          <div className="bg-orange-100 dark:bg-orange-900/40 border-2 border-orange-300 dark:border-orange-700/50 px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl shadow-[3px_3px_0px_0px_rgba(251,146,60,1)] sm:shadow-[4px_4px_0px_0px_rgba(251,146,60,1)] dark:shadow-[3px_3px_0px_0px_rgba(194,65,12,0.8)] sm:dark:shadow-[4px_4px_0px_0px_rgba(194,65,12,0.8)] transform rotate-1 sm:rotate-2 inline-flex items-center gap-2.5 sm:gap-3 self-start md:self-auto">
            <Flame className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500 fill-orange-500 shrink-0" />
            <div>
              <div className="text-orange-900 dark:text-orange-300 font-bold font-['Kalam',cursive] text-xl sm:text-2xl leading-none">{t('home.streakDays', { count: streakCount })}</div>
              <div className="text-orange-700 dark:text-orange-400/80 text-xs sm:text-sm font-bold uppercase tracking-wide">{t('home.streakLabel')}</div>
            </div>
          </div>
        </div>

        {deletionCanceledNotice && (
          <div role="alert" className="mb-6 sm:mb-8 rounded-2xl border-4 border-green-400 bg-green-100 p-4 font-bold text-sm sm:text-base text-green-900 shadow-[4px_4px_0px_0px_rgba(74,222,128,1)] dark:border-green-700/60 dark:bg-green-900/40 dark:text-green-200 dark:shadow-[4px_4px_0px_0px_rgba(21,128,61,0.8)] flex items-center justify-between">
            <span>🎉 {t('settings.dangerZone.deletionCanceledNotice')}</span>
            <button onClick={() => setDeletionCanceledNotice(false)} className="text-green-800 dark:text-green-300 font-bold ml-4 text-lg hover:opacity-75">✕</button>
          </div>
        )}

        {error && <div role="alert" className="mb-6 sm:mb-8 rounded-xl border-2 border-red-300 bg-red-100 p-3.5 sm:p-4 font-bold text-sm sm:text-base text-red-800 dark:border-red-800 dark:bg-red-900/35 dark:text-red-200">{error}</div>}

        <section className="mb-10 sm:mb-16">
          <div className="bg-pink-100 dark:bg-pink-900/40 p-4 sm:p-8 rounded-2xl sm:rounded-3xl border-3 sm:border-4 border-pink-300 dark:border-pink-700/50 shadow-[4px_4px_0px_0px_rgba(244,114,182,1)] sm:shadow-[8px_8px_0px_0px_rgba(244,114,182,1)] dark:shadow-[4px_4px_0px_0px_rgba(190,24,93,0.8)] sm:dark:shadow-[8px_8px_0px_0px_rgba(190,24,93,0.8)] transform rotate-0.5 sm:rotate-1 relative">
            <div className="absolute -top-2.5 -right-2 sm:-top-3 sm:-right-4 w-10 sm:w-12 h-5 sm:h-6 bg-green-400/80 dark:bg-green-500/40 transform -rotate-12 backdrop-blur-sm shadow-sm pointer-events-none" />
            <h2 className="text-xl sm:text-3xl font-['Kalam',cursive] font-bold text-pink-900 dark:text-pink-300 mb-2.5 sm:mb-4 flex items-center gap-2 sm:gap-3 leading-snug">
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 fill-pink-500 text-pink-500 shrink-0" /> {t('home.askTopic')}
            </h2>
            <p className="text-pink-800 dark:text-pink-200/80 font-bold mb-4 sm:mb-6 font-['Nunito',sans-serif] text-sm sm:text-base">{t('home.askDescription')}</p>
            <form className="flex flex-col gap-3 sm:gap-4 w-full" onSubmit={handleGenerate}>
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full">
                <div className="w-full relative flex-grow">
                  <input type="text" value={topic} onChange={(event) => setTopic(event.target.value)} placeholder={t('home.topicPlaceholder')} className="w-full px-4 sm:px-6 py-3 sm:py-4 rounded-full border-2 border-pink-200 dark:border-pink-800/50 shadow-inner bg-white/90 dark:bg-gray-800/90 backdrop-blur-md focus:outline-none focus:border-pink-400 dark:focus:border-pink-500/50 focus:ring-4 focus:ring-pink-300/50 dark:focus:ring-pink-900/50 font-['Nunito',sans-serif] text-sm sm:text-lg text-gray-800 dark:text-gray-100 font-bold transition-all placeholder-gray-400 dark:placeholder-gray-500" />
                </div>
                <button type="submit" className="bg-pink-500 dark:bg-pink-600 hover:bg-pink-600 dark:hover:bg-pink-500 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-full shadow-[0_4px_0px_0px_rgba(190,24,93,1)] sm:shadow-[0_8px_0px_0px_rgba(190,24,93,1)] dark:shadow-[0_4px_0px_0px_rgba(157,23,77,1)] sm:dark:shadow-[0_8px_0px_0px_rgba(157,23,77,1)] hover:shadow-[0_2px_0px_0px_rgba(190,24,93,1)] dark:hover:shadow-[0_2px_0px_0px_rgba(157,23,77,1)] transform transition hover:translate-y-1 font-['Kalam',cursive] text-base sm:text-xl tracking-wide border-2 border-pink-700 dark:border-pink-800 flex items-center justify-center gap-2 w-full sm:w-auto shrink-0">{t('home.generateBtn')} <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" /></button>
              </div>
            </form>
          </div>
        </section>

        <section className="mb-10 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl font-['Kalam',cursive] font-bold text-blue-900 dark:text-blue-300 mb-4 sm:mb-6 flex items-center gap-2.5 sm:gap-3"><Play className="w-6 h-6 sm:w-8 sm:h-8 fill-blue-500 text-blue-500 shrink-0" /> {t('home.pickUpHeader')}</h2>
          <div className="bg-blue-100 dark:bg-blue-900/40 p-4 sm:p-8 rounded-2xl sm:rounded-3xl border-3 sm:border-4 border-blue-400 dark:border-blue-700/50 shadow-[4px_4px_0px_0px_rgba(96,165,250,1)] sm:shadow-[8px_8px_0px_0px_rgba(96,165,250,1)] dark:shadow-[4px_4px_0px_0px_rgba(30,58,138,1)] sm:dark:shadow-[8px_8px_0px_0px_rgba(30,58,138,1)] transform -rotate-0.5 sm:-rotate-1 relative">
            <div className="absolute -top-3 -right-2 sm:-top-4 sm:-right-4 w-10 sm:w-12 h-5 sm:h-6 bg-yellow-400/80 dark:bg-yellow-500/40 transform rotate-12 backdrop-blur-sm pointer-events-none" />
            {isLoading ? (
              <div className="flex items-center gap-3 py-4 sm:py-5 font-bold text-sm sm:text-base text-blue-700 dark:text-blue-300"><LoaderCircle className="w-6 h-6 sm:w-7 sm:h-7 animate-spin" /> {t('home.loadingCourse')}</div>
            ) : continueCourse ? (
              <div className="flex flex-col md:flex-row justify-between gap-6 sm:gap-8 items-start md:items-center">
                <div className="flex-grow w-full">
                  <span className="bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs sm:text-sm font-bold px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full uppercase tracking-wider mb-3 sm:mb-4 inline-block">{continueCourse.category}</span>
                  <h3 className="text-xl sm:text-3xl font-bold font-['Kalam',cursive] text-blue-950 dark:text-blue-200 mb-1.5 sm:mb-2">{continueCourse.title}</h3>
                  <p className="text-blue-800 dark:text-blue-300/80 text-xs sm:text-base font-medium mb-4 sm:mb-6">{continueCourse.description}</p>
                  <div className="w-full bg-blue-200 dark:bg-blue-800/50 rounded-full h-3 sm:h-4 mb-2 border border-blue-300 dark:border-blue-700">
                    <div className="bg-blue-500 dark:bg-blue-400 h-full rounded-full transition-all" style={{ width: `${clampProgress(continueCourse.progressPercentage)}%` }} />
                  </div>
                  <div className="text-blue-700 dark:text-blue-400 font-bold text-xs sm:text-sm">{t('home.completedPercentage', { percent: clampProgress(continueCourse.progressPercentage) })}</div>
                </div>
                <button onClick={() => navigate(`/courses/${continueCourse.id}`)} className="bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold py-3.5 sm:py-4 px-6 sm:px-8 rounded-xl shadow-[0_4px_0px_0px_rgba(29,78,216,1)] sm:shadow-[0_8px_0px_0px_rgba(29,78,216,1)] dark:shadow-[0_4px_0px_0px_rgba(30,58,138,1)] sm:dark:shadow-[0_8px_0px_0px_rgba(30,58,138,1)] transform transition hover:translate-y-1 hover:shadow-[0_2px_0px_0px_rgba(29,78,216,1)] dark:hover:shadow-[0_2px_0px_0px_rgba(30,58,138,1)] shrink-0 w-full md:w-auto text-lg sm:text-xl font-['Kalam',cursive] border-2 border-blue-700 dark:border-blue-800">{t('home.continueLearning')}</button>
              </div>
            ) : (
              <div className="py-4 sm:py-5">
                <h3 className="text-xl sm:text-3xl font-bold font-['Kalam',cursive] text-blue-950 dark:text-blue-200 mb-1.5 sm:mb-2">{t('home.noCourseTitle')}</h3>
                <p className="text-blue-800 dark:text-blue-300/80 text-xs sm:text-base font-medium mb-4 sm:mb-6">{t('home.noCourseDescription')}</p>
                <button onClick={() => openModal()} className="bg-blue-500 text-white font-bold py-2.5 sm:py-3 px-5 sm:px-6 rounded-xl font-['Kalam',cursive] text-lg sm:text-xl border-2 border-blue-700 w-full sm:w-auto">{t('home.createFirstCourse')}</button>
              </div>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-2xl sm:text-3xl font-['Kalam',cursive] font-bold text-gray-800 dark:text-gray-200 mb-4 sm:mb-6 flex items-center gap-2.5 sm:gap-3"><Clock className="w-6 h-6 sm:w-7 sm:h-7 text-gray-600 dark:text-gray-400 shrink-0" /> {t('home.recentCourses')}</h2>
          {isLoading ? (
            <div className="py-8 flex items-center gap-3 font-bold text-sm sm:text-base text-gray-600 dark:text-gray-300"><LoaderCircle className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" /> {t('home.loadingRecent')}</div>
          ) : dashboard?.recentCourses.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {dashboard.recentCourses.map((course, index) => {
                const style = recentCardStyles[course.color];
                const progress = clampProgress(course.progressPercentage);
                return (
                  <button key={course.id} onClick={() => navigate(`/courses/${course.id}`)} className={`${style.card} ${style.border} p-4 sm:p-6 rounded-2xl border-2 shadow-[3px_3px_0px_0px_rgba(100,116,139,.35)] sm:shadow-[4px_4px_0px_0px_rgba(100,116,139,.35)] ${index % 2 ? '-rotate-1' : 'rotate-1'} hover:rotate-0 transition-transform cursor-pointer relative text-left`}>
                    <div className={`absolute top-0 left-1/2 w-12 sm:w-16 h-3.5 sm:h-4 ${style.tape} -translate-x-1/2 -translate-y-2`} />
                    <h3 className={`text-lg sm:text-2xl font-bold font-['Kalam',cursive] ${style.title} mb-1.5 sm:mb-2`}>{course.title}</h3>
                    <p className={`mb-3 sm:mb-4 text-xs sm:text-sm font-bold ${style.text}`}>{course.category}</p>
                    <div className={`w-full ${style.track} rounded-full h-2 mb-2`}><div className={`${style.progress} h-full rounded-full`} style={{ width: `${progress}%` }} /></div>
                    <p className={`${style.text} font-bold text-xs sm:text-sm`}>{t('home.completedPercentage', { percent: progress })}</p>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center p-4 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-800/70 py-10 sm:py-14">
              <BookOpen className="mx-auto mb-3 w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
              <h3 className="font-['Kalam',cursive] text-xl sm:text-2xl font-bold text-gray-700 dark:text-gray-200">{t('home.recentEmptyTitle')}</h3>
              <p className="mt-1 sm:mt-2 text-xs sm:text-base font-semibold text-gray-500 dark:text-gray-400">{t('home.recentEmptyDesc')}</p>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
};

export default Home;
