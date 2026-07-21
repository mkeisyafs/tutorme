import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar, Plus, Minus, CheckCircle2, Play, Lock, ArrowLeft } from 'lucide-react';
import type { CourseModule } from '../types/course';

interface CourseSidebarProps {
  courseModules: (CourseModule & { courseTitle?: string })[];
  completedLessonIds: Set<string>;
  orderedLessons: { id: string, title: string, isGenerated: boolean }[];
  progressPercent: number;
  allDone: boolean;
  activeLessonId?: string;
  courseId: string;
}

export function CourseSidebar({
  courseModules,
  completedLessonIds,
  orderedLessons,
  progressPercent,
  allDone,
  activeLessonId,
  courseId,
}: CourseSidebarProps) {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(320);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);

  // Initialize expanded module based on active lesson
  const [sidebarExpandedModule, setSidebarExpandedModule] = useState<string | null>(null);

  useEffect(() => {
    if (activeLessonId && courseModules.length > 0 && !sidebarExpandedModule) {
      const activeModule = courseModules.find(m => m.lessons.some(l => l.id === activeLessonId));
      if (activeModule) {
        setSidebarExpandedModule(activeModule.id);
      }
    }
  }, [activeLessonId, courseModules, sidebarExpandedModule]);

  // Handle Dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingLeft) {
        const newWidth = Math.max(250, Math.min(e.clientX, 600));
        setLeftSidebarWidth(newWidth);
      }
    };
    const handleMouseUp = () => { setIsDraggingLeft(false); };
    if (isDraggingLeft) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.userSelect = '';
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingLeft]);

  return (
    <>
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="absolute top-6 left-6 z-30 bg-white dark:bg-gray-800 p-3 rounded-xl shadow-[4px_4px_0px_0px_rgba(229,231,235,1)] dark:shadow-[4px_4px_0px_0px_rgba(55,65,81,0.8)] border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm"
        >
          <Sidebar className="w-6 h-6" />
        </button>
      )}

      {isSidebarOpen && (
        <aside
          style={{ width: `${leftSidebarWidth}px` }}
          className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-r-2 border-dashed border-gray-300 dark:border-gray-700 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20 flex-shrink-0 transition-colors duration-300 h-full flex flex-col"
        >
          <div
            onMouseDown={() => setIsDraggingLeft(true)}
            className={`absolute top-0 -right-2 bottom-0 w-4 cursor-col-resize hover:bg-blue-500/20 active:bg-blue-500/40 z-30 transition-colors ${isDraggingLeft ? 'bg-blue-500/40' : ''}`}
          />
          <div className="flex flex-col justify-between h-full p-6 overflow-y-auto custom-scrollbar">
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-center mt-2">
                <div
                  className="text-3xl font-['Kalam',cursive] font-bold text-blue-600 dark:text-blue-400 cursor-pointer transform -rotate-2"
                  onClick={() => navigate('/home')}
                >
                  TutorMe
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <Sidebar className="w-6 h-6" />
                </button>
              </div>

              {/* Course Progress Card */}
              <div className="bg-blue-100 dark:bg-blue-900/40 p-5 rounded-2xl border-4 border-blue-300 dark:border-blue-700/50 shadow-[4px_4px_0px_0px_rgba(96,165,250,1)] dark:shadow-[4px_4px_0px_0px_rgba(30,58,138,0.8)] transform -rotate-1 relative">
                <div className="absolute -top-3 -right-2 w-8 h-4 bg-yellow-400/80 dark:bg-yellow-500/40 transform rotate-12 backdrop-blur-sm shadow-sm pointer-events-none"></div>
                <span className="text-xs font-bold uppercase tracking-wider mb-2 inline-block text-blue-800 dark:text-blue-300">Your course</span>
                <h3 className="text-2xl font-bold font-['Kalam',cursive] text-blue-950 dark:text-blue-100 mb-4 leading-tight">
                  {courseModules.length > 0
                    ? courseModules[0].courseTitle || 'Your Course'
                    : 'Your Course'}
                </h3>
                <div className="w-full bg-blue-200 dark:bg-blue-800/50 rounded-full h-2 mb-2 border border-blue-300 dark:border-blue-700">
                  <div
                    className="bg-blue-500 dark:bg-blue-400 h-full rounded-full transition-all duration-700"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs font-bold text-blue-700 dark:text-blue-300">
                  <span>{allDone ? 'Completed' : 'In progress'}</span>
                  <span>{progressPercent}%</span>
                </div>
              </div>

              {/* Course Roadmap Nav */}
              <div className="mt-4 flex flex-col gap-4">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Course Roadmap</span>
                <div className="flex flex-col gap-2">
                  {courseModules.map((module) => {
                    const isExpanded = sidebarExpandedModule === module.id;
                    const isCurrentModule = module.lessons.some(l => l.id === activeLessonId);
                    return (
                      <div key={module.id} className="flex flex-col gap-1">
                        <div
                          className="flex justify-between items-center cursor-pointer group py-1"
                          onClick={() => setSidebarExpandedModule(isExpanded ? null : module.id)}
                        >
                          <h4 className={`font-bold transition-colors text-[15px] group-hover:text-blue-600 dark:group-hover:text-blue-400 ${isCurrentModule ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'}`}>
                            {module.title}
                          </h4>
                          <button className="text-gray-400 group-hover:text-blue-500 flex-shrink-0 ml-2">
                            {isExpanded ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                          </button>
                        </div>
                        {isExpanded && (
                          <div className="flex flex-col gap-2 pl-2 mt-1 mb-2">
                            {module.lessons.map((moduleLesson) => {
                              const isThisLesson = moduleLesson.id === activeLessonId;
                              const isThisCompleted = completedLessonIds.has(moduleLesson.id);
                              const isGenerated = moduleLesson.isGenerated;
                              const globalIndex = orderedLessons.findIndex((l) => l.id === moduleLesson.id);
                              const prevGlobalLesson = globalIndex > 0 ? orderedLessons[globalIndex - 1] : null;
                              const isAccessible =
                                isThisLesson ||
                                isThisCompleted ||
                                isGenerated ||
                                globalIndex === 0 ||
                                (prevGlobalLesson !== null && completedLessonIds.has(prevGlobalLesson.id));
                              return (
                                <div
                                  key={moduleLesson.id}
                                  className={`flex items-center gap-3 text-[14px] group/lesson ${isAccessible ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                                  onClick={() => {
                                    if (!isThisLesson && isAccessible && courseId) {
                                      navigate(`/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(moduleLesson.id)}`);
                                    }
                                  }}
                                >
                                  {isThisCompleted ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                  ) : isAccessible ? (
                                    <Play className="w-4 h-4 text-blue-500 fill-blue-500 flex-shrink-0" />
                                  ) : (
                                    <Lock className={`w-4 h-4 flex-shrink-0 ${isAccessible ? 'text-blue-400' : 'text-gray-400'}`} />
                                  )}
                                  <span className={`font-semibold transition-colors ${isThisLesson ? 'text-blue-600 dark:text-blue-400' : isAccessible ? 'group-hover/lesson:text-blue-500 text-gray-600 dark:text-gray-400' : 'text-gray-400 dark:text-gray-600'}`}>
                                    {moduleLesson.title}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate(-1)}
              className="mt-8 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 shadow-[2px_2px_0px_0px_rgba(156,163,175,1)] dark:shadow-[2px_2px_0px_0px_rgba(75,85,99,1)] transition-all active:translate-y-0.5 active:shadow-none w-full font-['Kalam',cursive] text-lg flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
          </div>
        </aside>
      )}
    </>
  );
}
