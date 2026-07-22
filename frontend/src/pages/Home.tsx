import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const { user } = useAuth();
  const [topic, setTopic] = useState('');
  const { openModal } = useCourseGeneration();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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
        if (isCurrent) setError(getApiErrorMessage(requestError, 'We could not load your learning dashboard. Please try again.'));
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    };

    void loadDashboard();
    return () => {
      isCurrent = false;
    };
  }, []);

  const handleGenerate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    openModal(topic);
  };

  const displayName = dashboard?.fullName ?? user?.fullName ?? 'Learner';
  const streakCount = dashboard?.streakCount ?? 0;
  const continueCourse = dashboard?.continueCourse;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto md:mx-0">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-['Kalam',cursive] font-bold text-gray-900 dark:text-gray-100 mb-2">Welcome back, {displayName}! 👋</h1>
            <p className="text-gray-600 dark:text-gray-400 font-bold text-lg">Ready to continue your learning journey?</p>
          </div>
          <div className="bg-orange-100 dark:bg-orange-900/40 border-2 border-orange-300 dark:border-orange-700/50 px-6 py-3 rounded-2xl shadow-[4px_4px_0px_0px_rgba(251,146,60,1)] dark:shadow-[4px_4px_0px_0px_rgba(194,65,12,0.8)] transform rotate-2 inline-flex items-center gap-3">
            <Flame className="w-8 h-8 text-orange-500 fill-orange-500" />
            <div><div className="text-orange-900 dark:text-orange-300 font-bold font-['Kalam',cursive] text-2xl leading-none">{streakCount} {streakCount === 1 ? 'Day' : 'Days'}</div><div className="text-orange-700 dark:text-orange-400/80 text-sm font-bold uppercase tracking-wide">Streak</div></div>
          </div>
        </div>

        {error && <div role="alert" className="mb-8 rounded-xl border-2 border-red-300 bg-red-100 p-4 font-bold text-red-800 dark:border-red-800 dark:bg-red-900/35 dark:text-red-200">{error}</div>}

        <section className="mb-16">
          <div className="bg-pink-100 dark:bg-pink-900/40 p-5 sm:p-8 rounded-3xl border-4 border-pink-300 dark:border-pink-700/50 shadow-[8px_8px_0px_0px_rgba(244,114,182,1)] dark:shadow-[8px_8px_0px_0px_rgba(190,24,93,0.8)] transform rotate-1 relative">
            <div className="absolute -top-3 -right-4 w-12 h-6 bg-green-400/80 dark:bg-green-500/40 transform -rotate-12 backdrop-blur-sm shadow-sm pointer-events-none" />
            <h2 className="text-2xl sm:text-3xl font-['Kalam',cursive] font-bold text-pink-900 dark:text-pink-300 mb-4 flex items-center gap-3"><Sparkles className="w-7 h-7 sm:w-8 sm:h-8 fill-pink-500 text-pink-500 flex-shrink-0" /> What do you want to learn today?</h2>
            <p className="text-pink-800 dark:text-pink-200/80 font-bold mb-6 font-['Nunito',sans-serif]">Add a topic or upload a reference file, and our AI will generate a personalized, step-by-step curriculum for you.</p>
            <form className="flex flex-col gap-4 w-full" onSubmit={handleGenerate}><div className="flex flex-col sm:flex-row items-center gap-4 w-full"><div className="w-full relative flex-grow"><input type="text" value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="e.g. Python for Beginners, Introduction to Economics..." className="w-full px-5 sm:px-6 py-3.5 sm:py-4 rounded-full border-2 border-pink-200 dark:border-pink-800/50 shadow-inner bg-white/90 dark:bg-gray-800/90 backdrop-blur-md focus:outline-none focus:border-pink-400 dark:focus:border-pink-500/50 focus:ring-4 focus:ring-pink-300/50 dark:focus:ring-pink-900/50 font-['Nunito',sans-serif] text-base sm:text-lg text-gray-800 dark:text-gray-100 font-bold transition-all placeholder-gray-400 dark:placeholder-gray-500" /></div><button type="submit" className="bg-pink-500 dark:bg-pink-600 hover:bg-pink-600 dark:hover:bg-pink-500 text-white font-bold py-3.5 sm:py-4 px-8 rounded-full shadow-[0_8px_0px_0px_rgba(190,24,93,1)] dark:shadow-[0_8px_0px_0px_rgba(157,23,77,1)] hover:shadow-[0_4px_0px_0px_rgba(190,24,93,1)] dark:hover:shadow-[0_4px_0px_0px_rgba(157,23,77,1)] transform transition hover:translate-y-1 font-['Kalam',cursive] text-lg sm:text-xl tracking-wide border-2 border-pink-700 dark:border-pink-800 flex items-center justify-center gap-2 w-full sm:w-auto flex-shrink-0">Generate Course <Sparkles className="w-5 h-5" /></button></div></form>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-['Kalam',cursive] font-bold text-blue-900 dark:text-blue-300 mb-6 flex items-center gap-3"><Play className="w-8 h-8 fill-blue-500 text-blue-500" /> Pick up where you left off</h2>
          <div className="bg-blue-100 dark:bg-blue-900/40 p-5 sm:p-8 rounded-3xl border-4 border-blue-400 dark:border-blue-700/50 shadow-[8px_8px_0px_0px_rgba(96,165,250,1)] dark:shadow-[8px_8px_0px_0px_rgba(30,58,138,1)] transform -rotate-1 relative">
            <div className="absolute -top-4 -right-4 w-12 h-6 bg-yellow-400/80 dark:bg-yellow-500/40 transform rotate-12 backdrop-blur-sm" />
            {isLoading ? <div className="flex items-center gap-3 py-5 font-bold text-blue-700 dark:text-blue-300"><LoaderCircle className="w-7 h-7 animate-spin" /> Loading your course…</div> : continueCourse ? <div className="flex flex-col md:flex-row justify-between gap-8 items-start md:items-center"><div className="flex-grow"><span className="bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-sm font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block">{continueCourse.category}</span><h3 className="text-2xl sm:text-3xl font-bold font-['Kalam',cursive] text-blue-950 dark:text-blue-200 mb-2">{continueCourse.title}</h3><p className="text-blue-800 dark:text-blue-300/80 font-medium mb-6">{continueCourse.description}</p><div className="w-full bg-blue-200 dark:bg-blue-800/50 rounded-full h-4 mb-2 border border-blue-300 dark:border-blue-700"><div className="bg-blue-500 dark:bg-blue-400 h-full rounded-full transition-all" style={{ width: `${clampProgress(continueCourse.progressPercentage)}%` }} /></div><div className="text-blue-700 dark:text-blue-400 font-bold text-sm">{clampProgress(continueCourse.progressPercentage)}% Completed</div></div><button onClick={() => navigate(`/courses/${continueCourse.id}`)} className="bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold py-4 px-8 rounded-xl shadow-[0_8px_0px_0px_rgba(29,78,216,1)] dark:shadow-[0_8px_0px_0px_rgba(30,58,138,1)] transform transition hover:translate-y-1 hover:shadow-[0_4px_0px_0px_rgba(29,78,216,1)] dark:hover:shadow-[0_4px_0px_0px_rgba(30,58,138,1)] flex-shrink-0 w-full md:w-auto text-xl font-['Kalam',cursive] border-2 border-blue-700 dark:border-blue-800">Continue Learning</button></div> : <div className="py-5"><h3 className="text-3xl font-bold font-['Kalam',cursive] text-blue-950 dark:text-blue-200 mb-2">No course in progress yet</h3><p className="text-blue-800 dark:text-blue-300/80 font-medium mb-6">Generate a new course or reuse one from the library to start learning.</p><button onClick={() => openModal()} className="bg-blue-500 text-white font-bold py-3 px-6 rounded-xl font-['Kalam',cursive] text-xl border-2 border-blue-700">Create your first course</button></div>}
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-['Kalam',cursive] font-bold text-gray-800 dark:text-gray-200 mb-6 flex items-center gap-3"><Clock className="w-7 h-7 text-gray-600 dark:text-gray-400" /> Recent Courses</h2>
          {isLoading ? <div className="py-10 flex items-center gap-3 font-bold text-gray-600 dark:text-gray-300"><LoaderCircle className="w-6 h-6 animate-spin" /> Loading recent courses…</div> : dashboard?.recentCourses.length ? <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">{dashboard.recentCourses.map((course, index) => {
            const style = recentCardStyles[course.color];
            const progress = clampProgress(course.progressPercentage);
            return <button key={course.id} onClick={() => navigate(`/courses/${course.id}`)} className={`${style.card} ${style.border} p-5 sm:p-6 rounded-2xl border-2 shadow-[4px_4px_0px_0px_rgba(100,116,139,.35)] ${index % 2 ? '-rotate-2' : 'rotate-1'} hover:rotate-0 transition-transform cursor-pointer relative text-left`}><div className={`absolute top-0 left-1/2 w-16 h-4 ${style.tape} -translate-x-1/2 -translate-y-2`} /><h3 className={`text-xl sm:text-2xl font-bold font-['Kalam',cursive] ${style.title} mb-2`}>{course.title}</h3><p className={`mb-4 text-sm font-bold ${style.text}`}>{course.category}</p><div className={`w-full ${style.track} rounded-full h-2 mb-2`}><div className={`${style.progress} h-full rounded-full`} style={{ width: `${progress}%` }} /></div><p className={`${style.text} font-bold text-sm`}>{progress}% Completed</p></button>;
          })}</div> : <div className="text-center p-4 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-800/70 py-14"><BookOpen className="mx-auto mb-3 w-10 h-10 text-gray-400" /><h3 className="font-['Kalam',cursive] text-2xl font-bold text-gray-700 dark:text-gray-200">Your recent courses will appear here</h3><p className="mt-2 font-semibold text-gray-500 dark:text-gray-400">Start or reuse a course to see it on your dashboard.</p></div>}
        </section>
      </div>
    </DashboardLayout>
  );
};
 
export default Home;
