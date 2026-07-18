import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import GenerateCourseModal from '../components/GenerateCourseModal';
import { BookOpen, Search, Filter, Sparkles, Pin, CircleAlert } from 'lucide-react';
import { myCourses } from '../constant/courses';

const Course = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [pinnedCourseIds, setPinnedCourseIds] = useState<number[]>(() => {
    try {
      const savedPins = JSON.parse(localStorage.getItem('pinnedCourseIds') ?? '[]');
      return Array.isArray(savedPins) ? savedPins.filter((id): id is number => typeof id === 'number').slice(0, 3) : [];
    } catch {
      return [];
    }
  });
  const [pinLimitReached, setPinLimitReached] = useState(false);

  const togglePin = (courseId: number) => {
    const isPinned = pinnedCourseIds.includes(courseId);
    if (!isPinned && pinnedCourseIds.length === 3) {
      setPinLimitReached(true);
      return;
    }

    const nextPinnedCourses = isPinned
      ? pinnedCourseIds.filter((id) => id !== courseId)
      : [...pinnedCourseIds, courseId];

    setPinnedCourseIds(nextPinnedCourses);
    localStorage.setItem('pinnedCourseIds', JSON.stringify(nextPinnedCourses));
    setPinLimitReached(false);
  };

  const filteredCourses = myCourses.filter(course => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'In Progress') return course.progress > 0 && course.progress < 100;
    if (activeFilter === 'Completed') return course.progress === 100;
    if (activeFilter === 'Not Started') return course.progress === 0;
    return true;
  }).sort((firstCourse, secondCourse) => Number(pinnedCourseIds.includes(secondCourse.id)) - Number(pinnedCourseIds.includes(firstCourse.id)));

  // Helper function to map colors to tailwind classes
  const getColorClasses = (color: string) => {
    switch(color) {
      case 'blue': return { bg: 'bg-blue-100 dark:bg-blue-900/40', border: 'border-blue-300 dark:border-blue-700/50', shadow: 'shadow-[4px_4px_0px_0px_rgba(96,165,250,1)] dark:shadow-[4px_4px_0px_0px_rgba(30,58,138,0.8)]', tape: 'bg-yellow-400/80 dark:bg-yellow-500/40', text: 'text-blue-900 dark:text-blue-300', barBg: 'bg-blue-200 dark:bg-blue-800/50', barFill: 'bg-blue-500 dark:bg-blue-400' };
      case 'yellow': return { bg: 'bg-yellow-100 dark:bg-yellow-900/40', border: 'border-yellow-300 dark:border-yellow-700/50', shadow: 'shadow-[4px_4px_0px_0px_rgba(250,204,21,1)] dark:shadow-[4px_4px_0px_0px_rgba(161,98,7,0.8)]', tape: 'bg-pink-400/80 dark:bg-pink-500/40', text: 'text-yellow-900 dark:text-yellow-300', barBg: 'bg-yellow-200 dark:bg-yellow-800/50', barFill: 'bg-yellow-500 dark:bg-yellow-400' };
      case 'green': return { bg: 'bg-green-100 dark:bg-green-900/40', border: 'border-green-300 dark:border-green-700/50', shadow: 'shadow-[4px_4px_0px_0px_rgba(74,222,128,1)] dark:shadow-[4px_4px_0px_0px_rgba(21,128,61,0.8)]', tape: 'bg-blue-400/80 dark:bg-blue-500/40', text: 'text-green-900 dark:text-green-300', barBg: 'bg-green-200 dark:bg-green-800/50', barFill: 'bg-green-500 dark:bg-green-400' };
      case 'pink': return { bg: 'bg-pink-100 dark:bg-pink-900/40', border: 'border-pink-300 dark:border-pink-700/50', shadow: 'shadow-[4px_4px_0px_0px_rgba(244,114,182,1)] dark:shadow-[4px_4px_0px_0px_rgba(190,24,93,0.8)]', tape: 'bg-green-400/80 dark:bg-green-500/40', text: 'text-pink-900 dark:text-pink-300', barBg: 'bg-pink-200 dark:bg-pink-800/50', barFill: 'bg-pink-500 dark:bg-pink-400' };
      case 'purple': return { bg: 'bg-purple-100 dark:bg-purple-900/40', border: 'border-purple-300 dark:border-purple-700/50', shadow: 'shadow-[4px_4px_0px_0px_rgba(192,132,252,1)] dark:shadow-[4px_4px_0px_0px_rgba(107,33,168,0.8)]', tape: 'bg-yellow-400/80 dark:bg-yellow-500/40', text: 'text-purple-900 dark:text-purple-300', barBg: 'bg-purple-200 dark:bg-purple-800/50', barFill: 'bg-purple-500 dark:bg-purple-400' };
      default: return { bg: 'bg-gray-100 dark:bg-gray-800/50', border: 'border-gray-300 dark:border-gray-700', shadow: 'shadow-[4px_4px_0px_0px_rgba(156,163,175,1)] dark:shadow-[4px_4px_0px_0px_rgba(55,65,81,0.8)]', tape: 'bg-gray-400/80 dark:bg-gray-500/40', text: 'text-gray-900 dark:text-gray-100', barBg: 'bg-gray-200 dark:bg-gray-700', barFill: 'bg-gray-500 dark:bg-gray-400' };
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto md:mx-0 pb-16">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
          <div>
            <h1 className="text-5xl font-['Kalam',cursive] font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-4">
              <BookOpen className="w-10 h-10 text-blue-500" />
              My Courses
            </h1>
            <p className="text-gray-600 dark:text-gray-400 font-bold text-lg">All your active and completed learning paths.</p>
            <p className="mt-2 text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2"><Pin className="w-4 h-4" /> Pinned courses: {pinnedCourseIds.length}/3</p>
          </div>
          
          {/* Search and Filter */}
          <div className="flex flex-wrap gap-4 w-full md:w-auto items-center">
            <div className="relative flex-grow md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5 pointer-events-none" />
              <input 
                type="text" 
                placeholder="Search courses..." 
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 dark:border-gray-700 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm focus:outline-none focus:border-blue-400 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-900/50 transition-all font-bold text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
            <div className="relative">
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`border-2 p-2 rounded-xl transition-all shadow-sm flex items-center justify-center ${isFilterOpen ? 'bg-gray-100 dark:bg-gray-700 border-blue-400 dark:border-blue-500 text-blue-600 dark:text-blue-400' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-400 dark:hover:border-blue-500'}`}
              >
                <Filter className="w-6 h-6" />
              </button>

              {isFilterOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-2xl shadow-[4px_4px_0px_0px_rgba(156,163,175,1)] dark:shadow-[4px_4px_0px_0px_rgba(75,85,99,1)] border-4 border-gray-300 dark:border-gray-600 z-50 overflow-hidden font-bold text-gray-700 dark:text-gray-300 flex flex-col">
                  {['All', 'In Progress', 'Completed', 'Not Started'].map((filterType) => (
                    <div 
                      key={filterType}
                      onClick={() => { setActiveFilter(filterType); setIsFilterOpen(false); }}
                      className={`p-3 border-b-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex items-center justify-between ${activeFilter === filterType ? 'text-blue-600 dark:text-blue-400' : ''} last:border-b-0`}
                    >
                      {filterType}
                      {activeFilter === filterType && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button 
              className="bg-pink-500 dark:bg-pink-600 hover:bg-pink-600 dark:hover:bg-pink-500 text-white font-bold py-2 px-6 rounded-xl shadow-[0_4px_0px_0px_rgba(190,24,93,1)] dark:shadow-[0_4px_0px_0px_rgba(157,23,77,1)] hover:shadow-[0_2px_0px_0px_rgba(190,24,93,1)] dark:hover:shadow-[0_2px_0px_0px_rgba(157,23,77,1)] transform transition hover:translate-y-0.5 font-['Kalam',cursive] text-lg tracking-wide border-2 border-pink-700 dark:border-pink-800 flex items-center justify-center gap-2 flex-shrink-0"
              onClick={() => setIsModalOpen(true)}
            >
              <Sparkles className="w-5 h-5" /> Make Course
            </button>
          </div>
        </div>

        {pinLimitReached && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border-2 border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/30 px-4 py-3 font-bold text-orange-800 dark:text-orange-200">
            <CircleAlert className="w-5 h-5 shrink-0" /> You can pin up to 3 courses. Unpin one to add another.
          </div>
        )}

        {/* Course Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCourses.map((course) => {
            const styles = getColorClasses(course.color);
            const isPinned = pinnedCourseIds.includes(course.id);
            return (
              <div key={course.id} className={`${styles.bg} p-6 rounded-2xl border-2 ${styles.border} ${styles.shadow} transform ${course.rotation} hover:rotate-0 transition-transform cursor-pointer relative flex flex-col h-full mt-2`}>
                {/* Sticky Tape */}
                <div className={`absolute top-0 left-1/2 w-16 h-5 ${styles.tape} -translate-x-1/2 -translate-y-2.5 transform ${course.id % 2 === 0 ? 'rotate-2' : '-rotate-3'} backdrop-blur-sm shadow-sm`}></div>
                <button
                  type="button"
                  onClick={() => togglePin(course.id)}
                  aria-label={isPinned ? `Unpin ${course.title}` : `Pin ${course.title}`}
                  aria-pressed={isPinned}
                  className={`absolute right-4 top-4 z-10 rounded-xl border-2 p-2 transition-all ${isPinned ? 'border-yellow-500 bg-yellow-300 text-yellow-900 shadow-[2px_2px_0px_0px_rgba(202,138,4,0.55)]' : 'border-white/60 dark:border-gray-600 bg-white/60 dark:bg-gray-800/70 text-gray-500 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700'}`}
                >
                  <Pin className="w-5 h-5" fill={isPinned ? 'currentColor' : 'none'} />
                </button>
                
                <span className={`text-xs font-bold uppercase tracking-wider mb-3 inline-block px-2 py-1 bg-white/50 dark:bg-gray-900/30 rounded-md ${styles.text} w-max`}>
                  {course.category}
                </span>
                
                <h3 className={`text-2xl font-bold font-['Kalam',cursive] ${styles.text} mb-4 flex-grow`}>
                  {course.title}
                </h3>
                
                <div className="mt-auto">
                  <div className="flex justify-between items-end mb-2">
                    <span className={`${styles.text} font-bold text-sm`}>Progress</span>
                    <span className={`${styles.text} font-bold text-sm`}>{course.progress}%</span>
                  </div>
                  <div className={`w-full ${styles.barBg} rounded-full h-2.5 mb-4 border border-white/40 dark:border-black/20 overflow-hidden`}>
                    <div className={`${styles.barFill} h-full rounded-full transition-all duration-1000`} style={{ width: `${course.progress}%` }}></div>
                  </div>
                  
                  <button 
                    onClick={() => navigate('/lesson')}
                    className={`w-full py-2 rounded-xl font-bold font-['Kalam',cursive] text-lg border-2 border-transparent transition-all hover:bg-white/40 dark:hover:bg-gray-900/20 ${styles.text} hover:border-white/60 dark:hover:border-gray-900/40`}
                  >
                    {course.progress === 100 ? 'Review Course' : course.progress === 0 ? 'Start Learning' : 'Continue'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>
      
      <GenerateCourseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </DashboardLayout>
  );
};

export default Course;
