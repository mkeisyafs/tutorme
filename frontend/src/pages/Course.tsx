import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import GenerateCourseModal from '../components/GenerateCourseModal';
import { BookOpen, Search, Filter, Sparkles, Pin, CircleAlert, Users, X, Share2, Play, Check, Code, Palette, Terminal, Database, Languages } from 'lucide-react';
import { myCourses, type MyCourse } from '../constant/courses';

const getCourseOutline = (course: MyCourse) => [
  { title: 'Chapter 1: Start here', lessons: ['Welcome to the course', 'Set your learning goal'] },
  { title: 'Chapter 2: Core skills', lessons: ['Learn the key concepts', 'Practice with an activity'] },
  { title: 'Chapter 3: Apply what you learned', lessons: ['Build a small project', 'Review and next steps'] },
];

const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case 'web development': return <Code className="w-3.5 h-3.5" />;
    case 'design': return <Palette className="w-3.5 h-3.5" />;
    case 'programming': return <Terminal className="w-3.5 h-3.5" />;
    case 'data science': return <Database className="w-3.5 h-3.5" />;
    case 'language': return <Languages className="w-3.5 h-3.5" />;
    default: return <BookOpen className="w-3.5 h-3.5" />;
  }
};

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
  const [previewCourse, setPreviewCourse] = useState<MyCourse | null>(null);
  const [notice, setNotice] = useState('');

  const togglePin = (courseId: number, event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
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

  const handleShareToLibrary = (course: MyCourse) => {
    setPreviewCourse(null);
    setNotice(`"${course.title}" was successfully shared to the Course Library!`);
    setTimeout(() => setNotice(''), 4000);
  };

  const filteredCourses = myCourses.filter(course => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'In Progress') return course.progress > 0 && course.progress < 100;
    if (activeFilter === 'Completed') return course.progress === 100;
    if (activeFilter === 'Not Started') return course.progress === 0;
    return true;
  }).sort((firstCourse, secondCourse) => Number(pinnedCourseIds.includes(secondCourse.id)) - Number(pinnedCourseIds.includes(firstCourse.id)));

  const getColorClasses = (color: string) => {
    switch(color) {
      case 'blue': return { bg: 'bg-blue-100 dark:bg-blue-950', border: 'border-blue-300 dark:border-blue-700/50', shadow: 'shadow-[4px_4px_0px_0px_rgba(96,165,250,1)] dark:shadow-[4px_4px_0px_0px_rgba(30,58,138,0.8)]', tape: 'bg-yellow-400/80 dark:bg-yellow-500/40', text: 'text-blue-900 dark:text-blue-300', barBg: 'bg-blue-200 dark:bg-blue-800/50', barFill: 'bg-blue-500 dark:bg-blue-400' };
      case 'yellow': return { bg: 'bg-yellow-100 dark:bg-yellow-950', border: 'border-yellow-300 dark:border-yellow-700/50', shadow: 'shadow-[4px_4px_0px_0px_rgba(250,204,21,1)] dark:shadow-[4px_4px_0px_0px_rgba(161,98,7,0.8)]', tape: 'bg-pink-400/80 dark:bg-pink-500/40', text: 'text-yellow-900 dark:text-yellow-300', barBg: 'bg-yellow-200 dark:bg-yellow-800/50', barFill: 'bg-yellow-500 dark:bg-yellow-400' };
      case 'green': return { bg: 'bg-green-100 dark:bg-green-950', border: 'border-green-300 dark:border-green-700/50', shadow: 'shadow-[4px_4px_0px_0px_rgba(74,222,128,1)] dark:shadow-[4px_4px_0px_0px_rgba(21,128,61,0.8)]', tape: 'bg-blue-400/80 dark:bg-blue-500/40', text: 'text-green-900 dark:text-green-300', barBg: 'bg-green-200 dark:bg-green-800/50', barFill: 'bg-green-500 dark:bg-green-400' };
      case 'pink': return { bg: 'bg-pink-100 dark:bg-pink-950', border: 'border-pink-300 dark:border-pink-700/50', shadow: 'shadow-[4px_4px_0px_0px_rgba(244,114,182,1)] dark:shadow-[4px_4px_0px_0px_rgba(190,24,93,0.8)]', tape: 'bg-green-400/80 dark:bg-green-500/40', text: 'text-pink-900 dark:text-pink-300', barBg: 'bg-pink-200 dark:bg-pink-800/50', barFill: 'bg-pink-500 dark:bg-pink-400' };
      case 'purple': return { bg: 'bg-purple-100 dark:bg-purple-950', border: 'border-purple-300 dark:border-purple-700/50', shadow: 'shadow-[4px_4px_0px_0px_rgba(192,132,252,1)] dark:shadow-[4px_4px_0px_0px_rgba(107,33,168,0.8)]', tape: 'bg-yellow-400/80 dark:bg-yellow-500/40', text: 'text-purple-900 dark:text-purple-300', barBg: 'bg-purple-200 dark:bg-purple-800/50', barFill: 'bg-purple-500 dark:bg-purple-400' };
      default: return { bg: 'bg-gray-100 dark:bg-gray-800/50', border: 'border-gray-300 dark:border-gray-700', shadow: 'shadow-[4px_4px_0px_0px_rgba(156,163,175,1)] dark:shadow-[4px_4px_0px_0px_rgba(55,65,81,0.8)]', tape: 'bg-gray-400/80 dark:bg-gray-500/40', text: 'text-gray-900 dark:text-gray-100', barBg: 'bg-gray-200 dark:bg-gray-700', barFill: 'bg-gray-500 dark:bg-gray-400' };
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto md:mx-0 pb-16 relative">
        
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

        {notice && (
          <div className="mb-7 flex items-center justify-between gap-4 rounded-xl border-2 border-green-300 bg-green-100 dark:border-green-700 dark:bg-green-900/35 p-4 text-green-900 dark:text-green-200 font-bold shadow-[2px_2px_0px_0px_rgba(134,239,172,1)] dark:shadow-[2px_2px_0px_0px_rgba(21,128,61,0.8)]">
            <span className="flex gap-2 items-center"><Check className="w-5 h-5" /> {notice}</span>
            <button aria-label="Dismiss message" onClick={() => setNotice('')} className="hover:bg-green-200 dark:hover:bg-green-800 p-1 rounded-md transition-colors"><X className="w-5 h-5" /></button>
          </div>
        )}

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
              <div key={course.id} onClick={() => setPreviewCourse(course)} className={`${styles.bg} p-6 rounded-2xl border-2 ${styles.border} ${styles.shadow} transform ${course.rotation} hover:rotate-0 transition-transform cursor-pointer relative flex flex-col h-full mt-2 focus:outline-none focus:ring-4 focus:ring-blue-300`}>
                {/* Sticky Tape */}
                <div className={`absolute top-0 left-1/2 w-16 h-5 ${styles.tape} -translate-x-1/2 -translate-y-2.5 transform ${course.id % 2 === 0 ? 'rotate-2' : '-rotate-3'} backdrop-blur-sm shadow-sm`}></div>
                <button
                  type="button"
                  onClick={(e) => togglePin(course.id, e)}
                  aria-label={isPinned ? `Unpin ${course.title}` : `Pin ${course.title}`}
                  aria-pressed={isPinned}
                  className={`absolute right-4 top-4 z-10 rounded-xl border-2 p-2 transition-all ${isPinned ? 'border-yellow-500 bg-yellow-300 text-yellow-900 shadow-[2px_2px_0px_0px_rgba(202,138,4,0.55)]' : 'border-white/60 dark:border-gray-600 bg-white/60 dark:bg-gray-800/70 text-gray-500 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700'}`}
                >
                  <Pin className="w-5 h-5" fill={isPinned ? 'currentColor' : 'none'} />
                </button>
                
                <span className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5 px-2.5 py-1 bg-white/50 dark:bg-gray-900/30 rounded-md ${styles.text} w-max`}>
                  {getCategoryIcon(course.category)}
                  {course.category}
                </span>
                
                <h3 className={`text-2xl font-bold font-['Kalam',cursive] ${styles.text} mb-4 flex-grow pr-8`}>
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
                    onClick={(e) => { e.stopPropagation(); setPreviewCourse(course); }}
                    className={`w-full py-2 rounded-xl font-bold font-['Kalam',cursive] text-lg border-2 border-transparent transition-all hover:bg-white/40 dark:hover:bg-gray-900/20 ${styles.text} hover:border-white/60 dark:hover:border-gray-900/40 flex items-center justify-center gap-2`}
                  >
                    <BookOpen className="w-4 h-4" />
                    {course.progress === 100 ? 'Review Course' : course.progress === 0 ? 'Start Learning' : 'Continue'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>
      
      {/* Course Preview Modal */}
      {previewCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/45 p-4 backdrop-blur-sm" onMouseDown={() => setPreviewCourse(null)}>
          <section role="dialog" aria-modal="true" aria-labelledby="course-preview-title" onMouseDown={(event) => event.stopPropagation()} className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border-4 border-blue-400 bg-blue-50 p-7 shadow-[8px_8px_0_rgba(96,165,250,1)] dark:border-blue-700 dark:bg-gray-800 md:p-9 flex flex-col">
            <button type="button" aria-label="Close course preview" onClick={() => setPreviewCourse(null)} className="absolute right-5 top-5 rounded-lg p-1 text-blue-700 transition-colors hover:bg-blue-200 dark:text-blue-300 dark:hover:bg-gray-700"><X /></button>
            <div className="pr-10">
              <span className="rounded-md bg-blue-200 px-2.5 py-1 text-xs font-extrabold uppercase tracking-wide text-blue-900 dark:bg-blue-900 dark:text-blue-100 border-2 border-blue-300 dark:border-blue-800">{previewCourse.category}</span>
              <h2 id="course-preview-title" className="mt-4 font-['Kalam',cursive] text-4xl font-bold leading-tight text-blue-950 dark:text-blue-100">{previewCourse.title}</h2>
              <p className="mt-3 font-semibold leading-relaxed text-blue-800 dark:text-blue-200">{previewCourse.description}</p>
              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold text-blue-800 dark:text-blue-200">
                <span className="flex items-center gap-1.5 bg-white/50 dark:bg-gray-900/50 px-3 py-1 rounded-full"><BookOpen className="h-4 w-4" /> {previewCourse.lessons} lessons total</span>
                <span className="flex items-center gap-1.5 bg-white/50 dark:bg-gray-900/50 px-3 py-1 rounded-full"><Users className="h-4 w-4" /> By {previewCourse.creator}</span>
              </div>
            </div>
            
            <div className="mt-8 border-t-2 border-blue-200 pt-6 dark:border-blue-800 flex-grow">
              <div className="flex items-end justify-between gap-3 mb-5">
                <div>
                  <h3 className="font-['Kalam',cursive] text-2xl font-bold text-blue-950 dark:text-blue-100">Course Outline</h3>
                  <p className="font-semibold text-blue-700 dark:text-blue-300">A look at the chapters and lessons.</p>
                </div>
                <span className="rounded-full bg-white/70 px-3 py-1 text-sm font-bold text-blue-800 dark:bg-gray-900 dark:text-blue-200">{getCourseOutline(previewCourse).length} chapters</span>
              </div>
              <div className="space-y-4">
                {getCourseOutline(previewCourse).map((chapter, chapterIndex) => (
                  <article key={chapter.title} className="rounded-2xl border-2 border-blue-200 bg-white/75 p-4 dark:border-blue-800 dark:bg-gray-900/50 shadow-sm">
                    <h4 className="font-['Kalam',cursive] text-xl font-bold text-blue-950 dark:text-blue-100">{chapter.title}</h4>
                    <ol className="mt-3 space-y-2">
                      {chapter.lessons.map((lesson, lessonIndex) => (
                        <li key={lesson} className="flex items-center gap-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-extrabold text-blue-700 dark:bg-blue-900/60 dark:text-blue-200">{chapterIndex + lessonIndex + 1}</span>
                          {lesson}
                        </li>
                      ))}
                    </ol>
                  </article>
                ))}
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 pt-6 border-t-2 border-blue-200 dark:border-blue-800">
              <button 
                type="button" 
                onClick={() => handleShareToLibrary(previewCourse)} 
                className="flex-1 rounded-xl border-2 border-purple-400 bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/40 dark:border-purple-600 dark:text-purple-300 dark:hover:bg-purple-900/60 py-3 text-lg font-bold font-['Kalam',cursive] transition-all flex justify-center items-center gap-2 active:translate-y-0.5"
              >
                <Share2 className="w-5 h-5" /> Share to Library
              </button>
              <button 
                type="button" 
                onClick={() => navigate('/lesson')} 
                className="flex-[2] rounded-xl border-2 border-blue-700 bg-blue-500 py-3 text-xl font-bold font-['Kalam',cursive] text-white shadow-[0_5px_0_#1d4ed8] transition-all hover:translate-y-0.5 hover:shadow-[0_3px_0_#1d4ed8] active:translate-y-1 active:shadow-none flex justify-center items-center gap-2"
              >
                <Play className="w-5 h-5 fill-current" /> {previewCourse.progress === 100 ? 'Review Course' : previewCourse.progress === 0 ? 'Start Learning' : 'Continue Course'}
              </button>
            </div>
          </section>
        </div>
      )}

      <GenerateCourseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </DashboardLayout>
  );
};

export default Course;
