import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Check,
  ChevronDown,
  FileUp,
  LibraryBig,
  LoaderCircle,
  Search,
  Sparkles,
  Upload,
  Users,
  X,
  Code,
  Palette,
  Database,
  Languages,
  Brain,
  Heart,
  CircleAlert,
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { apiRequest, getApiErrorMessage } from '../lib/api';
import type { ListResponse } from '../types/api';
import type { CourseColor } from '../types/course';
import type { CoursePreviewDetail, LibraryCourse } from '../types/library';

const colorStyles: Record<CourseColor, { card: string; border: string; text: string; tape: string; button: string }> = {
  blue: { card: 'bg-blue-100 dark:bg-blue-900/40', border: 'border-blue-300 dark:border-blue-700/50', text: 'text-blue-950 dark:text-blue-200', tape: 'bg-blue-400/40', button: 'bg-blue-500 hover:bg-blue-600 border-blue-700 shadow-[0_4px_0_#1d4ed8]' },
  pink: { card: 'bg-pink-100 dark:bg-pink-900/40', border: 'border-pink-300 dark:border-pink-700/50', text: 'text-pink-950 dark:text-pink-200', tape: 'bg-pink-400/40', button: 'bg-pink-500 hover:bg-pink-600 border-pink-700 shadow-[0_4px_0_#be185d]' },
  green: { card: 'bg-green-100 dark:bg-green-900/40', border: 'border-green-300 dark:border-green-700/50', text: 'text-green-950 dark:text-green-200', tape: 'bg-green-400/40', button: 'bg-green-500 hover:bg-green-600 border-green-700 shadow-[0_4px_0_#15803d]' },
  yellow: { card: 'bg-yellow-100 dark:bg-yellow-900/40', border: 'border-yellow-300 dark:border-yellow-700/50', text: 'text-yellow-950 dark:text-yellow-200', tape: 'bg-yellow-400/40', button: 'bg-yellow-500 hover:bg-yellow-600 border-yellow-700 shadow-[0_4px_0_#a16207]' },
  purple: { card: 'bg-purple-100 dark:bg-purple-900/40', border: 'border-purple-300 dark:border-purple-700/50', text: 'text-purple-950 dark:text-purple-200', tape: 'bg-purple-400/40', button: 'bg-purple-500 hover:bg-purple-600 border-purple-700 shadow-[0_4px_0_#6b21a8]' },
};

const normaliseColor = (color: string): CourseColor => (
  Object.hasOwn(colorStyles, color) ? color as CourseColor : 'blue'
);

const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case 'web development': return <Code className="w-3.5 h-3.5" />;
    case 'design': return <Palette className="w-3.5 h-3.5" />;
    case 'data science': return <Database className="w-3.5 h-3.5" />;
    case 'languages': return <Languages className="w-3.5 h-3.5" />;
    case 'learning': return <Brain className="w-3.5 h-3.5" />;
    case 'life skills': return <Heart className="w-3.5 h-3.5" />;
    default: return <BookOpen className="w-3.5 h-3.5" />;
  }
};

const Library = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<LibraryCourse[]>([]);
  const [myCourses, setMyCourses] = useState<LibraryCourse[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All topics');
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [courseSearch, setCourseSearch] = useState('');
  const [formError, setFormError] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [previewCourse, setPreviewCourse] = useState<LibraryCourse | null>(null);
  const [previewDetail, setPreviewDetail] = useState<CoursePreviewDetail | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');

  const loadCourses = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [library, mine] = await Promise.all([
        apiRequest<ListResponse<LibraryCourse>>('/courses/library?take=100'),
        apiRequest<ListResponse<LibraryCourse>>('/courses/mine'),
      ]);
      setCourses(Array.isArray(library.data) ? library.data.map((course) => ({ ...course, color: normaliseColor(course.color) })) : []);
      setMyCourses(Array.isArray(mine.data) ? mine.data.map((course) => ({ ...course, color: normaliseColor(course.color) })) : []);
    } catch (requestError) {
      setCourses([]);
      setMyCourses([]);
      setError(getApiErrorMessage(requestError, 'We could not load the course library. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  const categories = useMemo(() => ['All topics', ...new Set(courses.map((course) => course.category).sort())], [courses]);
  const selectedCourse = myCourses.find((course) => course.id === selectedCourseId);
  const selectableCourses = myCourses.filter((course) => `${course.title} ${course.category}`.toLowerCase().includes(courseSearch.toLowerCase()));
  const visibleCourses = useMemo(() => courses.filter((course) => {
    const matchesCategory = category === 'All topics' || course.category === category;
    const haystack = `${course.title} ${course.description} ${course.category} ${course.creator}`.toLowerCase();
    return matchesCategory && haystack.includes(query.toLowerCase());
  }), [category, courses, query]);

  const openPreview = async (course: LibraryCourse) => {
    setPreviewCourse(course);
    setPreviewDetail(null);
    setPreviewError('');
    setIsPreviewLoading(true);
    try {
      const detail = await apiRequest<CoursePreviewDetail>(`/courses/${encodeURIComponent(course.id)}`);
      setPreviewDetail(detail);
    } catch (requestError) {
      setPreviewError(getApiErrorMessage(requestError, 'We could not load this course preview. Please try again.'));
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const publishCourse = async () => {
    if (!selectedCourse) {
      setFormError('Choose one of your courses before sharing.');
      return;
    }

    setFormError('');
    setIsPublishing(true);
    try {
      await apiRequest(`/courses/${encodeURIComponent(selectedCourse.id)}/share`, { method: 'PATCH' });
      setShowUpload(false);
      setSelectedCourseId(null);
      setCourseSearch('');
      setNotice(`“${selectedCourse.title}” is now shared in the library.`);
      await loadCourses();
    } catch (requestError) {
      setFormError(getApiErrorMessage(requestError, 'We could not share this course. Please try again.'));
    } finally {
      setIsPublishing(false);
    }
  };

  const reuseCourse = async (course: LibraryCourse) => {
    if (course.isMine || course.isEnrolled) {
      navigate(`/courses/${course.id}`);
      return;
    }

    try {
      await apiRequest(`/courses/${encodeURIComponent(course.id)}/reuse`, { method: 'POST' });
      setCourses((current) => current.map((item) => item.id === course.id ? { ...item, isEnrolled: true, learners: item.learners + 1 } : item));
      setNotice(`“${course.title}” was added to your courses.`);
      window.setTimeout(() => navigate(`/courses/${course.id}`), 650);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'We could not add this course. Please try again.'));
    }
  };

  const previewModules = previewDetail?.modules ?? [];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto md:mx-0 pb-16">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-purple-100 dark:bg-purple-900/40 px-4 py-1.5 text-purple-800 dark:text-purple-200 font-bold text-sm mb-4 border border-purple-200 dark:border-purple-700"><Users className="w-4 h-4" /> Learn together</div>
            <h1 className="text-5xl font-['Kalam',cursive] font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-4"><LibraryBig className="w-10 h-10 text-purple-500" /> Course Library</h1>
            <p className="text-gray-600 dark:text-gray-400 font-bold text-lg">Discover courses shared by learners, then make them your own.</p>
          </div>
          <button onClick={() => setShowUpload(true)} className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-xl border-2 border-purple-700 shadow-[0_5px_0_#6b21a8] hover:translate-y-0.5 hover:shadow-[0_3px_0_#6b21a8] transition-all font-['Kalam',cursive] text-xl flex items-center justify-center gap-2"><Upload className="w-5 h-5" /> Share a course</button>
        </div>

        <section className="bg-purple-100 dark:bg-purple-900/35 border-3 border-purple-300 dark:border-purple-700/60 rounded-3xl p-6 md:p-8 shadow-[6px_6px_0_#c084fc] dark:shadow-[6px_6px_0_#581c87] mb-12 relative overflow-hidden">
          <div className="absolute -right-8 -top-8 text-purple-300/40 dark:text-purple-400/15"><Sparkles className="w-40 h-40" /></div>
          <div className="relative flex flex-col md:flex-row md:items-center gap-5 justify-between"><div><h2 className="font-['Kalam',cursive] text-3xl font-bold text-purple-950 dark:text-purple-100">Have a course to share?</h2><p className="text-purple-800 dark:text-purple-200 font-semibold mt-1">Select one of your database-backed courses to make it public for other learners.</p></div><button onClick={() => setShowUpload(true)} className="shrink-0 bg-white/80 dark:bg-gray-800/80 text-purple-800 dark:text-purple-200 border-2 border-purple-300 dark:border-purple-600 rounded-xl px-5 py-3 font-bold hover:bg-white dark:hover:bg-gray-800 transition-colors flex gap-2 items-center"><FileUp className="w-5 h-5" /> Share course</button></div>
        </section>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <label className="relative flex-grow"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search shared courses..." className="w-full rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white/85 dark:bg-gray-800/85 py-3 pl-12 pr-4 font-bold text-gray-800 dark:text-gray-100 focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-200 dark:focus:ring-purple-900/50" /></label>
          <div className="relative md:w-56"><button type="button" aria-haspopup="listbox" aria-expanded={isCategoryMenuOpen} onClick={() => setIsCategoryMenuOpen((isOpen) => !isOpen)} className={`flex w-full items-center justify-between rounded-xl border-2 bg-white/85 dark:bg-gray-800/85 py-3 pl-4 pr-3 font-bold text-gray-700 dark:text-gray-200 transition-colors focus:outline-none focus:ring-4 focus:ring-purple-200 dark:focus:ring-purple-900/50 ${isCategoryMenuOpen ? 'border-purple-500' : 'border-gray-300 dark:border-gray-700 hover:border-purple-300'}`}>{category}<ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isCategoryMenuOpen ? 'rotate-180' : ''}`} /></button>{isCategoryMenuOpen && <div role="listbox" aria-label="Course topic" className="absolute right-0 z-20 mt-2 w-full overflow-hidden rounded-xl border-2 border-purple-300 dark:border-purple-700 bg-white dark:bg-gray-800 shadow-[4px_4px_0_rgba(168,85,247,.35)]">{categories.map((item) => <button key={item} type="button" role="option" aria-selected={category === item} onClick={() => { setCategory(item); setIsCategoryMenuOpen(false); }} className={`flex w-full items-center justify-between px-4 py-2.5 text-left font-bold transition-colors ${category === item ? 'bg-purple-500 text-white' : 'text-gray-700 dark:text-gray-200 hover:bg-purple-100 dark:hover:bg-purple-900/40'}`}>{item}{category === item && <Check className="w-4 h-4" />}</button>)}</div>}</div>
        </div>

        {(notice || error) && <div role={error ? 'alert' : 'status'} className={`mb-7 flex items-center justify-between gap-4 rounded-xl border-2 p-4 font-bold ${error ? 'border-red-300 bg-red-100 text-red-800 dark:border-red-700 dark:bg-red-900/35 dark:text-red-200' : 'border-green-300 bg-green-100 text-green-900 dark:border-green-700 dark:bg-green-900/35 dark:text-green-200'}`}><span className="flex gap-2 items-center"><Check className="w-5 h-5" /> {error || notice}</span><button aria-label="Dismiss message" onClick={() => { setError(''); setNotice(''); }}><X className="w-5 h-5" /></button></div>}

        {isLoading ? <div className="py-20 grid place-items-center text-purple-700 dark:text-purple-300 font-bold"><LoaderCircle className="w-8 h-8 animate-spin mb-3" />Loading library…</div> : <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-7">{visibleCourses.map((course, index) => {
          const style = colorStyles[course.color];
          const actionLabel = course.isMine || course.isEnrolled ? 'Open course' : 'Reuse this course';
          return <article key={course.id} role="button" tabIndex={0} onClick={() => void openPreview(course)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); void openPreview(course); } }} className={`${style.card} ${style.border} border-2 rounded-2xl p-6 relative flex flex-col shadow-[4px_4px_0_rgba(100,116,139,.35)] ${index % 2 ? '-rotate-1' : 'rotate-1'} hover:rotate-0 transition-transform cursor-pointer focus:outline-none focus:ring-4 focus:ring-purple-300`}><div className={`absolute -top-2 left-1/2 h-5 w-16 -translate-x-1/2 ${style.tape} ${index % 2 ? 'rotate-3' : '-rotate-3'}`} /><div className="flex items-start justify-between gap-3 mb-4"><span className={`rounded-md bg-white/55 dark:bg-black/20 px-2.5 py-1 text-xs font-extrabold uppercase tracking-wide flex items-center gap-1.5 ${style.text}`}>{getCategoryIcon(course.category)}{course.category}</span>{course.isMine && <span className="text-xs font-bold text-purple-700 dark:text-purple-300">Shared by you</span>}</div><h2 className={`font-['Kalam',cursive] text-2xl font-bold leading-tight ${style.text}`}>{course.title}</h2><p className={`mt-3 text-sm font-semibold leading-relaxed opacity-80 ${style.text} flex-grow`}>{course.description}</p><p className={`mt-5 text-sm font-bold ${style.text}`}>Created by {course.creator}</p><div className={`my-4 border-y border-black/10 dark:border-white/10 py-3 flex gap-4 text-sm font-bold ${style.text}`}><span className="flex items-center gap-1"><BookOpen className="w-4 h-4" /> {course.lessons} lessons</span><span className="flex items-center gap-1"><Users className="w-4 h-4" /> {course.learners.toLocaleString()}</span></div><button onClick={(event) => { event.stopPropagation(); void openPreview(course); }} className={`mb-2 w-full rounded-xl border-2 border-transparent py-2 font-bold text-sm transition-colors hover:border-white/70 hover:bg-white/35 dark:hover:bg-black/15 ${style.text}`}>Preview chapters & lessons</button><button onClick={(event) => { event.stopPropagation(); void reuseCourse(course); }} className={`text-white rounded-xl border-2 py-2.5 font-bold font-['Kalam',cursive] text-lg transition-all hover:translate-y-0.5 hover:shadow-none ${style.button}`}>{actionLabel}</button></article>;
        })}</div>}

        {!isLoading && visibleCourses.length === 0 && <div className="text-center bg-white/70 dark:bg-gray-800/70 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 py-16"><BookOpen className="w-10 h-10 mx-auto mb-3 text-gray-400" /><h2 className="font-['Kalam',cursive] text-2xl font-bold text-gray-700 dark:text-gray-200">No shared courses found</h2><p className="text-gray-500 dark:text-gray-400 font-semibold mt-1">Try another topic or share the first course from My Courses.</p></div>}
      </div>

      {showUpload && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm" onMouseDown={() => setShowUpload(false)}><section role="dialog" aria-modal="true" aria-labelledby="share-course-title" onMouseDown={(event) => event.stopPropagation()} className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border-4 border-purple-400 dark:border-purple-700 bg-purple-50 dark:bg-gray-800 p-7 md:p-9 shadow-[8px_8px_0_#a855f7]"><button type="button" aria-label="Close sharing dialog" onClick={() => setShowUpload(false)} className="absolute right-5 top-5 rounded-lg p-1 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-gray-700"><X /></button><h2 id="share-course-title" className="font-['Kalam',cursive] text-3xl font-bold text-purple-950 dark:text-purple-100">Share your course</h2><p className="mt-1 text-purple-800 dark:text-purple-200 font-semibold">Choose a course you created to publish it to the community.</p><div className="mt-7"><label className="block font-bold text-gray-700 dark:text-gray-200">Select a course from My Courses</label><div className="relative mt-1.5"><Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-500" /><input value={courseSearch} onChange={(event) => { setCourseSearch(event.target.value); setSelectedCourseId(null); setFormError(''); }} placeholder="Search your courses..." className="w-full rounded-xl border-2 border-purple-200 dark:border-gray-600 bg-white dark:bg-gray-900 py-3 pl-12 pr-4 font-semibold focus:outline-none focus:border-purple-500" /></div><div className="mt-2 max-h-52 overflow-y-auto rounded-xl border-2 border-purple-200 dark:border-gray-600 bg-white dark:bg-gray-900">{selectableCourses.length ? selectableCourses.map((course) => <button key={course.id} type="button" onClick={() => { setSelectedCourseId(course.id); setFormError(''); }} className={`flex w-full items-center justify-between gap-3 border-b border-purple-100 dark:border-gray-700 px-4 py-3 text-left font-bold text-gray-800 dark:text-gray-100 last:border-b-0 hover:bg-purple-50 dark:hover:bg-gray-800 ${selectedCourseId === course.id ? 'bg-purple-100 dark:bg-purple-900/30' : ''}`}><span>{course.title}</span><span className="text-xs text-purple-700 dark:text-purple-300">{course.isPublic ? 'Already shared' : course.category}</span></button>) : <p className="px-4 py-3 font-semibold text-gray-500">No matching courses.</p>}</div>{selectedCourse && <div className="mt-4 rounded-xl border-2 border-purple-200 dark:border-purple-700 bg-purple-100/70 dark:bg-purple-900/30 p-4"><p className="font-['Kalam',cursive] text-xl font-bold text-purple-950 dark:text-purple-100">{selectedCourse.title}</p><p className="mt-1 text-sm font-semibold text-purple-800 dark:text-purple-200">{selectedCourse.category} · {selectedCourse.lessons} lessons</p></div>}{formError && <p role="alert" className="mt-3 text-sm font-bold text-red-600 dark:text-red-400">{formError}</p>}</div><button type="button" disabled={isPublishing} onClick={() => void publishCourse()} className="mt-7 w-full rounded-xl border-2 border-purple-700 bg-purple-500 py-3 text-xl font-bold font-['Kalam',cursive] text-white shadow-[0_5px_0_#6b21a8] hover:translate-y-0.5 hover:shadow-[0_3px_0_#6b21a8] transition-all disabled:cursor-wait disabled:opacity-70">{isPublishing ? 'Publishing…' : 'Publish to library'}</button></section></div>}

      {previewCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/45 p-2 sm:p-4 pt-16 sm:pt-4 backdrop-blur-sm" onMouseDown={() => setPreviewCourse(null)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="course-preview-title"
            onMouseDown={(event) => event.stopPropagation()}
            className="relative max-h-[80vh] sm:max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl sm:rounded-3xl border-4 border-purple-400 bg-purple-50 p-4 sm:p-7 shadow-[8px_8px_0_#a855f7] dark:border-purple-700 dark:bg-gray-800 md:p-9 flex flex-col"
          >
            <button type="button" aria-label="Close course preview" onClick={() => setPreviewCourse(null)} className="absolute right-3 top-3 sm:right-5 sm:top-5 z-10 rounded-lg p-1 text-purple-700 transition-colors hover:bg-purple-200 dark:text-purple-300 dark:hover:bg-gray-700"><X /></button>
            
            <div className="pr-8 sm:pr-10 shrink-0">
              <span className="rounded-md bg-purple-200 px-2.5 py-1 text-xs font-extrabold uppercase tracking-wide text-purple-900 dark:bg-purple-900 dark:text-purple-100">{previewCourse.category}</span>
              <h2 id="course-preview-title" className="mt-1.5 sm:mt-4 font-['Kalam',cursive] text-lg sm:text-3xl md:text-4xl font-bold leading-snug sm:leading-tight text-purple-950 dark:text-purple-100">{previewCourse.title}</h2>
              <p className="mt-1.5 sm:mt-3 text-xs sm:text-base font-semibold leading-normal sm:leading-relaxed text-purple-800 dark:text-purple-200 line-clamp-3 sm:line-clamp-none">{previewCourse.description}</p>
            </div>

            <div className="mt-3 sm:mt-6 border-t-2 border-purple-200 pt-3 sm:pt-4 dark:border-purple-800 flex-1 flex flex-col min-h-0">
              <h3 className="font-['Kalam',cursive] text-lg sm:text-2xl font-bold text-purple-950 dark:text-purple-100 mb-2 shrink-0">Course preview</h3>
              
              {isPreviewLoading ? (
                <div className="flex min-h-36 sm:min-h-44 flex-col items-center justify-center text-center font-bold text-purple-700 dark:text-purple-300">
                  <LoaderCircle className="h-8 w-8 sm:h-9 sm:w-9 animate-spin text-purple-500" />
                  <p className="mt-3 text-sm sm:text-base">Loading chapters…</p>
                </div>
              ) : previewError ? (
                <div role="alert" className="rounded-2xl border-2 border-red-300 bg-red-50 p-4 sm:p-5 text-center font-bold text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
                  <CircleAlert className="mx-auto h-7 w-7" />
                  <p className="mt-2 text-sm sm:text-base">{previewError}</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto min-h-0 pr-1 sm:pr-2 space-y-3 sm:space-y-4 pb-2 custom-scrollbar">
                  {previewModules.length ? (
                    previewModules.map((module, moduleIndex) => (
                      <article key={module.id} className="rounded-2xl border-2 border-purple-200 bg-white/75 p-3.5 sm:p-4 dark:border-purple-800 dark:bg-gray-900/50 shadow-sm">
                        <h4 className="font-['Kalam',cursive] text-lg sm:text-xl font-bold text-purple-950 dark:text-purple-100">{module.title}</h4>
                        <ol className="mt-2.5 sm:mt-3 space-y-2">
                          {module.lessons.map((lesson, lessonIndex) => (
                            <li key={lesson.id} className="flex items-center gap-2.5 sm:gap-3 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200">
                              <span className="flex h-5 w-5 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-[0.7rem] sm:text-xs font-extrabold text-purple-700 dark:bg-purple-900/60 dark:text-purple-200">{moduleIndex + lessonIndex + 1}</span>
                              <span className="flex-1">{lesson.title}</span>
                            </li>
                          ))}
                        </ol>
                      </article>
                    ))
                  ) : (
                    <p className="rounded-xl border-2 border-dashed border-purple-300 bg-white/70 p-4 sm:p-5 text-center font-bold text-purple-700 dark:border-purple-800 dark:bg-gray-900/50 dark:text-purple-200">This course does not have any published lessons yet.</p>
                  )}
                </div>
              )}
            </div>

            <div className="mt-2.5 sm:mt-4 pt-2.5 sm:pt-4 border-t-2 border-purple-200 dark:border-purple-800 shrink-0 bg-purple-50 dark:bg-gray-800">
              <button
                type="button"
                onClick={() => { setPreviewCourse(null); void reuseCourse(previewCourse); }}
                className="w-full rounded-xl border-2 border-purple-700 bg-purple-500 py-2.5 sm:py-3 text-lg sm:text-xl font-bold font-['Kalam',cursive] text-white shadow-[0_4px_0_#6b21a8] sm:shadow-[0_5px_0_#6b21a8] transition-all hover:translate-y-0.5 hover:shadow-[0_3px_0_#6b21a8] active:translate-y-1 active:shadow-none flex justify-center items-center gap-2"
              >
                {previewCourse.isMine || previewCourse.isEnrolled ? 'Open course' : 'Reuse this course'}
              </button>
            </div>
          </section>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Library;
