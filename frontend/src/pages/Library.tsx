import { useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Check,
  ChevronDown,
  Clock3,
  FileUp,
  LibraryBig,
  Search,
  Sparkles,
  Star,
  Upload,
  Users,
  X,
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { myCourses, type CourseColor } from '../constant/courses';

interface LibraryCourse {
  id: number;
  title: string;
  description: string;
  category: string;
  creator: string;
  lessons: number;
  learners: number;
  rating: number;
  color: CourseColor;
  isMine?: boolean;
}

interface CourseChapter {
  title: string;
  lessons: string[];
}

const starterCourses: LibraryCourse[] = [
  { id: 1, title: 'Practical Python for Data', description: 'A friendly project-based path from Python basics to useful data analysis.', category: 'Data Science', creator: 'Maya Chen', lessons: 18, learners: 1240, rating: 4.9, color: 'blue' },
  { id: 2, title: 'Design Systems, Clearly', description: 'Learn to build consistent interfaces, tokens, components, and documentation.', category: 'Design', creator: 'Andi Pratama', lessons: 12, learners: 856, rating: 4.8, color: 'pink' },
  { id: 3, title: 'Conversational Spanish', description: 'Small daily lessons to get comfortable with real-world Spanish conversation.', category: 'Languages', creator: 'Sofia Ramirez', lessons: 24, learners: 2090, rating: 4.9, color: 'yellow' },
  { id: 4, title: 'React from Components to Apps', description: 'A hands-on course for designing, building, and shipping polished React apps.', category: 'Web Development', creator: 'Jordan Lee', lessons: 20, learners: 1675, rating: 4.7, color: 'green' },
  { id: 5, title: 'Personal Finance Foundations', description: 'Create a practical money system for budgeting, saving, and confident decisions.', category: 'Life Skills', creator: 'Nina Patel', lessons: 10, learners: 721, rating: 4.8, color: 'purple' },
  { id: 6, title: 'Productive Study Systems', description: 'A repeatable approach to focus, note-taking, active recall, and exam prep.', category: 'Learning', creator: 'Owen Brown', lessons: 8, learners: 940, rating: 4.6, color: 'blue' },
];

const colorStyles: Record<CourseColor, { card: string; border: string; text: string; tape: string; button: string }> = {
  blue: { card: 'bg-blue-100 dark:bg-blue-900/40', border: 'border-blue-300 dark:border-blue-700/50', text: 'text-blue-950 dark:text-blue-200', tape: 'bg-blue-400/40', button: 'bg-blue-500 hover:bg-blue-600 border-blue-700 shadow-[0_4px_0_#1d4ed8]' },
  pink: { card: 'bg-pink-100 dark:bg-pink-900/40', border: 'border-pink-300 dark:border-pink-700/50', text: 'text-pink-950 dark:text-pink-200', tape: 'bg-pink-400/40', button: 'bg-pink-500 hover:bg-pink-600 border-pink-700 shadow-[0_4px_0_#be185d]' },
  green: { card: 'bg-green-100 dark:bg-green-900/40', border: 'border-green-300 dark:border-green-700/50', text: 'text-green-950 dark:text-green-200', tape: 'bg-green-400/40', button: 'bg-green-500 hover:bg-green-600 border-green-700 shadow-[0_4px_0_#15803d]' },
  yellow: { card: 'bg-yellow-100 dark:bg-yellow-900/40', border: 'border-yellow-300 dark:border-yellow-700/50', text: 'text-yellow-950 dark:text-yellow-200', tape: 'bg-yellow-400/40', button: 'bg-yellow-500 hover:bg-yellow-600 border-yellow-700 shadow-[0_4px_0_#a16207]' },
  purple: { card: 'bg-purple-100 dark:bg-purple-900/40', border: 'border-purple-300 dark:border-purple-700/50', text: 'text-purple-950 dark:text-purple-200', tape: 'bg-purple-400/40', button: 'bg-purple-500 hover:bg-purple-600 border-purple-700 shadow-[0_4px_0_#6b21a8]' },
};

const categories = ['All topics', 'Web Development', 'Data Science', 'Design', 'Languages', 'Life Skills', 'Learning'];

const courseOutlines: Record<string, CourseChapter[]> = {
  'Practical Python for Data': [
    { title: 'Chapter 1: Python foundations', lessons: ['Welcome and setup', 'Variables, lists, and dictionaries', 'Your first data exercise'] },
    { title: 'Chapter 2: Working with data', lessons: ['Reading CSV files', 'Cleaning missing values', 'Exploring a dataset'] },
    { title: 'Chapter 3: Tell the story', lessons: ['Charts that answer questions', 'A mini analysis project'] },
  ],
  'Design Systems, Clearly': [
    { title: 'Chapter 1: A shared design language', lessons: ['What design systems solve', 'UI inventory and foundations'] },
    { title: 'Chapter 2: Build reusable parts', lessons: ['Tokens and variables', 'Component anatomy', 'Documenting decisions'] },
    { title: 'Chapter 3: Put it into practice', lessons: ['Patterns and templates', 'System handoff'] },
  ],
  'Conversational Spanish': [
    { title: 'Chapter 1: Start speaking', lessons: ['Greetings and introductions', 'Numbers and everyday questions', 'Pronunciation practice'] },
    { title: 'Chapter 2: Real-life conversations', lessons: ['Ordering food', 'Getting around town', 'Talking about your day'] },
    { title: 'Chapter 3: Build confidence', lessons: ['Past and future plans', 'Conversation challenge'] },
  ],
  'React from Components to Apps': [
    { title: 'Chapter 1: Component thinking', lessons: ['Your first component', 'Props and composition', 'Rendering dynamic lists'] },
    { title: 'Chapter 2: Interactive interfaces', lessons: ['State and events', 'Effects and data fetching', 'Reusable custom hooks'] },
    { title: 'Chapter 3: Ship an app', lessons: ['Routing and structure', 'Final project'] },
  ],
  'Personal Finance Foundations': [
    { title: 'Chapter 1: Know your money', lessons: ['Set your money goals', 'Track income and spending'] },
    { title: 'Chapter 2: Create your system', lessons: ['A budget you can use', 'Saving and emergency funds'] },
    { title: 'Chapter 3: Plan ahead', lessons: ['Debt and investing basics', 'Your next 90 days'] },
  ],
  'Productive Study Systems': [
    { title: 'Chapter 1: Set up for focus', lessons: ['Design your study space', 'Make a realistic study plan'] },
    { title: 'Chapter 2: Learn actively', lessons: ['Effective note-taking', 'Active recall and spaced repetition'] },
    { title: 'Chapter 3: Review and improve', lessons: ['Weekly review ritual', 'Exam preparation plan'] },
  ],
};

const getCourseOutline = (course: LibraryCourse): CourseChapter[] => courseOutlines[course.title] ?? [
  { title: 'Chapter 1: Start here', lessons: ['Welcome to the course', 'Set your learning goal'] },
  { title: 'Chapter 2: Core skills', lessons: ['Learn the key concepts', 'Practice with an activity'] },
  { title: 'Chapter 3: Apply what you learned', lessons: ['Build a small project', 'Review and next steps'] },
];

const Library = () => {
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);
  const [courses, setCourses] = useState(starterCourses);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All topics');
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState('');
  const [notice, setNotice] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [courseSearch, setCourseSearch] = useState('');
  const [isCoursePickerOpen, setIsCoursePickerOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [previewCourse, setPreviewCourse] = useState<LibraryCourse | null>(null);

  const selectedCourse = myCourses.find((course) => course.id === selectedCourseId);
  const selectableCourses = myCourses.filter((course) => `${course.title} ${course.category}`.toLowerCase().includes(courseSearch.toLowerCase()));

  const visibleCourses = useMemo(() => courses.filter((course) => {
    const matchesCategory = category === 'All topics' || course.category === category;
    const haystack = `${course.title} ${course.description} ${course.category} ${course.creator}`.toLowerCase();
    return matchesCategory && haystack.includes(query.toLowerCase());
  }), [category, courses, query]);

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(event.target.files?.[0]?.name ?? '');
  };

  const publishCourse = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedCourse) {
      setFormError('Choose one of your existing courses before publishing.');
      setIsCoursePickerOpen(true);
      return;
    }
    setCourses((current) => [{
      id: Date.now(),
      title: selectedCourse.title,
      description: selectedCourse.description,
      category: selectedCourse.category,
      creator: 'You',
      lessons: selectedCourse.lessons,
      learners: 0,
      rating: 0,
      color: selectedCourse.color,
      isMine: true,
    }, ...current]);
    setShowUpload(false);
    setSelectedCourseId(null);
    setCourseSearch('');
    setFormError('');
    setSelectedFile('');
    setNotice('Your course is now in the library for other learners to reuse.');
  };

  const reuseCourse = (course: LibraryCourse) => {
    setNotice(`“${course.title}” was added to your courses.`);
    window.setTimeout(() => navigate('/course'), 650);
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto md:mx-0 pb-16">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-purple-100 dark:bg-purple-900/40 px-4 py-1.5 text-purple-800 dark:text-purple-200 font-bold text-sm mb-4 border border-purple-200 dark:border-purple-700">
              <Users className="w-4 h-4" /> Learn together
            </div>
            <h1 className="text-5xl font-['Kalam',cursive] font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-4">
              <LibraryBig className="w-10 h-10 text-purple-500" /> Course Library
            </h1>
            <p className="text-gray-600 dark:text-gray-400 font-bold text-lg">Discover AI-made courses shared by learners, then make them your own.</p>
          </div>
          <button onClick={() => setShowUpload(true)} className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-xl border-2 border-purple-700 shadow-[0_5px_0_#6b21a8] hover:translate-y-0.5 hover:shadow-[0_3px_0_#6b21a8] transition-all font-['Kalam',cursive] text-xl flex items-center justify-center gap-2">
            <Upload className="w-5 h-5" /> Share a course
          </button>
        </div>

        <section className="bg-purple-100 dark:bg-purple-900/35 border-3 border-purple-300 dark:border-purple-700/60 rounded-3xl p-6 md:p-8 shadow-[6px_6px_0_#c084fc] dark:shadow-[6px_6px_0_#581c87] mb-12 relative overflow-hidden">
          <div className="absolute -right-8 -top-8 text-purple-300/40 dark:text-purple-400/15"><Sparkles className="w-40 h-40" /></div>
          <div className="relative flex flex-col md:flex-row md:items-center gap-5 justify-between">
            <div>
              <h2 className="font-['Kalam',cursive] text-3xl font-bold text-purple-950 dark:text-purple-100">Have an AI-generated course already?</h2>
              <p className="text-purple-800 dark:text-purple-200 font-semibold mt-1">Upload its outline or fill in the details so someone else can learn from it too.</p>
            </div>
            <button onClick={() => setShowUpload(true)} className="shrink-0 bg-white/80 dark:bg-gray-800/80 text-purple-800 dark:text-purple-200 border-2 border-purple-300 dark:border-purple-600 rounded-xl px-5 py-3 font-bold hover:bg-white dark:hover:bg-gray-800 transition-colors flex gap-2 items-center"><FileUp className="w-5 h-5" /> Upload course</button>
          </div>
        </section>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <label className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search shared courses..." className="w-full rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white/85 dark:bg-gray-800/85 py-3 pl-12 pr-4 font-bold text-gray-800 dark:text-gray-100 focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-200 dark:focus:ring-purple-900/50" />
          </label>
          <div className="relative md:w-56">
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={isCategoryMenuOpen}
              onClick={() => setIsCategoryMenuOpen((isOpen) => !isOpen)}
              className={`flex w-full items-center justify-between rounded-xl border-2 bg-white/85 dark:bg-gray-800/85 py-3 pl-4 pr-3 font-bold text-gray-700 dark:text-gray-200 transition-colors focus:outline-none focus:ring-4 focus:ring-purple-200 dark:focus:ring-purple-900/50 ${isCategoryMenuOpen ? 'border-purple-500' : 'border-gray-300 dark:border-gray-700 hover:border-purple-300'}`}
            >
              {category}
              <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isCategoryMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {isCategoryMenuOpen && <div role="listbox" aria-label="Course topic" className="absolute right-0 z-20 mt-2 w-full overflow-hidden rounded-xl border-2 border-purple-300 dark:border-purple-700 bg-white dark:bg-gray-800 shadow-[4px_4px_0_rgba(168,85,247,.35)]">
              {categories.map((item) => <button key={item} type="button" role="option" aria-selected={category === item} onClick={() => { setCategory(item); setIsCategoryMenuOpen(false); }} className={`flex w-full items-center justify-between px-4 py-2.5 text-left font-bold transition-colors ${category === item ? 'bg-purple-500 text-white' : 'text-gray-700 dark:text-gray-200 hover:bg-purple-100 dark:hover:bg-purple-900/40'}`}>
                {item}
                {category === item && <Check className="w-4 h-4" />}
              </button>)}
            </div>}
          </div>
        </div>

        {notice && <div className="mb-7 flex items-center justify-between gap-4 rounded-xl border-2 border-green-300 bg-green-100 dark:border-green-700 dark:bg-green-900/35 p-4 text-green-900 dark:text-green-200 font-bold"><span className="flex gap-2 items-center"><Check className="w-5 h-5" /> {notice}</span><button aria-label="Dismiss message" onClick={() => setNotice('')}><X className="w-5 h-5" /></button></div>}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-7">
          {visibleCourses.map((course, index) => {
            const style = colorStyles[course.color];
            return <article key={course.id} role="button" tabIndex={0} onClick={() => setPreviewCourse(course)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setPreviewCourse(course); } }} className={`${style.card} ${style.border} border-2 rounded-2xl p-6 relative flex flex-col shadow-[4px_4px_0_rgba(100,116,139,.35)] ${index % 2 ? '-rotate-1' : 'rotate-1'} hover:rotate-0 transition-transform cursor-pointer focus:outline-none focus:ring-4 focus:ring-purple-300`}>
              <div className={`absolute -top-2 left-1/2 h-5 w-16 -translate-x-1/2 ${style.tape} ${index % 2 ? 'rotate-3' : '-rotate-3'}`} />
              <div className="flex items-start justify-between gap-3 mb-4">
                <span className={`rounded-md bg-white/55 dark:bg-black/20 px-2.5 py-1 text-xs font-extrabold uppercase tracking-wide ${style.text}`}>{course.category}</span>
                {course.isMine && <span className="text-xs font-bold text-purple-700 dark:text-purple-300">Shared by you</span>}
              </div>
              <h2 className={`font-['Kalam',cursive] text-2xl font-bold leading-tight ${style.text}`}>{course.title}</h2>
              <p className={`mt-3 text-sm font-semibold leading-relaxed opacity-80 ${style.text} flex-grow`}>{course.description}</p>
              <p className={`mt-5 text-sm font-bold ${style.text}`}>Created by {course.creator}</p>
              <div className={`my-4 border-y border-black/10 dark:border-white/10 py-3 flex gap-4 text-sm font-bold ${style.text}`}>
                <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" /> {course.lessons} lessons</span>
                <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {course.learners.toLocaleString()}</span>
                {course.rating > 0 && <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-current" /> {course.rating}</span>}
              </div>
              <button onClick={(event) => { event.stopPropagation(); setPreviewCourse(course); }} className={`mb-2 w-full rounded-xl border-2 border-transparent py-2 font-bold text-sm transition-colors hover:border-white/70 hover:bg-white/35 dark:hover:bg-black/15 ${style.text}`}>Preview chapters & lessons</button>
              <button onClick={(event) => { event.stopPropagation(); reuseCourse(course); }} className={`text-white rounded-xl border-2 py-2.5 font-bold font-['Kalam',cursive] text-lg transition-all hover:translate-y-0.5 hover:shadow-none ${style.button}`}>{course.isMine ? 'View course' : 'Reuse this course'}</button>
            </article>;
          })}
        </div>

        {visibleCourses.length === 0 && <div className="text-center bg-white/70 dark:bg-gray-800/70 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 py-16"><BookOpen className="w-10 h-10 mx-auto mb-3 text-gray-400" /><h2 className="font-['Kalam',cursive] text-2xl font-bold text-gray-700 dark:text-gray-200">No shared courses found</h2><p className="text-gray-500 dark:text-gray-400 font-semibold mt-1">Try another topic or share the first course in this category.</p></div>}
      </div>

      {showUpload && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm" onMouseDown={() => setShowUpload(false)}>
        <form onSubmit={publishCourse} onMouseDown={(event) => event.stopPropagation()} className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border-4 border-purple-400 dark:border-purple-700 bg-purple-50 dark:bg-gray-800 p-7 md:p-9 shadow-[8px_8px_0_#a855f7]">
          <button type="button" onClick={() => setShowUpload(false)} className="absolute right-5 top-5 rounded-lg p-1 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-gray-700"><X /></button>
          <h2 className="font-['Kalam',cursive] text-3xl font-bold text-purple-950 dark:text-purple-100">Share your course</h2>
          <p className="mt-1 text-purple-800 dark:text-purple-200 font-semibold">Choose a course from My Courses to share it with the community.</p>
          <div className="mt-7 space-y-4">
            <div className="relative">
              <label className="block font-bold text-gray-700 dark:text-gray-200">Select a course from My Courses</label>
              <div className="relative mt-1.5">
                <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-500" />
                <input value={courseSearch} onFocus={() => setIsCoursePickerOpen(true)} onChange={(event) => { setCourseSearch(event.target.value); setSelectedCourseId(null); setFormError(''); setIsCoursePickerOpen(true); }} placeholder="Search your courses..." className="w-full rounded-xl border-2 border-purple-200 dark:border-gray-600 bg-white dark:bg-gray-900 py-3 pl-12 pr-4 font-semibold focus:outline-none focus:border-purple-500" />
              </div>
              {isCoursePickerOpen && <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-xl border-2 border-purple-200 dark:border-gray-600 bg-white dark:bg-gray-900 shadow-lg">
                {selectableCourses.length > 0 ? selectableCourses.map((course) => <button key={course.id} type="button" onClick={() => { setSelectedCourseId(course.id); setCourseSearch(course.title); setIsCoursePickerOpen(false); setFormError(''); }} className="flex w-full items-center justify-between gap-3 border-b border-purple-100 dark:border-gray-700 px-4 py-3 text-left font-bold text-gray-800 dark:text-gray-100 last:border-b-0 hover:bg-purple-50 dark:hover:bg-gray-800"><span>{course.title}</span><span className="text-xs text-purple-700 dark:text-purple-300">{course.category}</span></button>) : <p className="px-4 py-3 font-semibold text-gray-500">No matching courses.</p>}
              </div>}
              {formError && <p className="mt-2 text-sm font-bold text-red-600 dark:text-red-400">{formError}</p>}
            </div>
            {selectedCourse && <div className="rounded-xl border-2 border-purple-200 dark:border-purple-700 bg-purple-100/70 dark:bg-purple-900/30 p-4"><p className="font-['Kalam',cursive] text-xl font-bold text-purple-950 dark:text-purple-100">{selectedCourse.title}</p><p className="mt-1 text-sm font-semibold text-purple-800 dark:text-purple-200">{selectedCourse.category} · {selectedCourse.lessons} lessons · {selectedCourse.progress}% complete</p></div>}
            <input ref={fileInput} onChange={handleFile} type="file" accept=".pdf,.doc,.docx,.txt,.json" className="hidden" />
            <button type="button" onClick={() => fileInput.current?.click()} className="w-full rounded-xl border-2 border-dashed border-purple-400 p-4 text-purple-800 dark:text-purple-200 font-bold hover:bg-purple-100 dark:hover:bg-purple-900/30 flex items-center justify-center gap-2"><FileUp className="w-5 h-5" /> {selectedFile || 'Attach an outline (optional)'}</button>
          </div>
          <button type="submit" className="mt-7 w-full rounded-xl border-2 border-purple-700 bg-purple-500 py-3 text-xl font-bold font-['Kalam',cursive] text-white shadow-[0_5px_0_#6b21a8] hover:translate-y-0.5 hover:shadow-[0_3px_0_#6b21a8] transition-all">Publish to library</button>
          <p className="mt-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 flex justify-center gap-1 items-center"><Clock3 className="w-3.5 h-3.5" /> Course details stay on this device in this demo.</p>
        </form>
      </div>}

      {previewCourse && <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/45 p-4 backdrop-blur-sm" onMouseDown={() => setPreviewCourse(null)}>
        <section role="dialog" aria-modal="true" aria-labelledby="course-preview-title" onMouseDown={(event) => event.stopPropagation()} className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border-4 border-purple-400 bg-purple-50 p-7 shadow-[8px_8px_0_#a855f7] dark:border-purple-700 dark:bg-gray-800 md:p-9">
          <button type="button" aria-label="Close course preview" onClick={() => setPreviewCourse(null)} className="absolute right-5 top-5 rounded-lg p-1 text-purple-700 transition-colors hover:bg-purple-200 dark:text-purple-300 dark:hover:bg-gray-700"><X /></button>
          <div className="pr-10">
            <span className="rounded-md bg-purple-200 px-2.5 py-1 text-xs font-extrabold uppercase tracking-wide text-purple-900 dark:bg-purple-900 dark:text-purple-100">{previewCourse.category}</span>
            <h2 id="course-preview-title" className="mt-4 font-['Kalam',cursive] text-4xl font-bold leading-tight text-purple-950 dark:text-purple-100">{previewCourse.title}</h2>
            <p className="mt-3 font-semibold leading-relaxed text-purple-800 dark:text-purple-200">{previewCourse.description}</p>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold text-purple-800 dark:text-purple-200"><span className="flex items-center gap-1.5"><BookOpen className="h-4 w-4" /> {previewCourse.lessons} lessons total</span><span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {previewCourse.learners.toLocaleString()} learners</span></div>
          </div>
          <div className="mt-8 border-t-2 border-purple-200 pt-6 dark:border-purple-800">
            <div className="flex items-end justify-between gap-3"><div><h3 className="font-['Kalam',cursive] text-2xl font-bold text-purple-950 dark:text-purple-100">Course preview</h3><p className="font-semibold text-purple-700 dark:text-purple-300">A look at the first chapters and lessons.</p></div><span className="rounded-full bg-white/70 px-3 py-1 text-sm font-bold text-purple-800 dark:bg-gray-900 dark:text-purple-200">{getCourseOutline(previewCourse).length} chapters</span></div>
            <div className="mt-5 space-y-4">{getCourseOutline(previewCourse).map((chapter, chapterIndex) => <article key={chapter.title} className="rounded-2xl border-2 border-purple-200 bg-white/75 p-4 dark:border-purple-800 dark:bg-gray-900/50"><h4 className="font-['Kalam',cursive] text-xl font-bold text-purple-950 dark:text-purple-100">{chapter.title}</h4><ol className="mt-3 space-y-2">{chapter.lessons.map((lesson, lessonIndex) => <li key={lesson} className="flex items-center gap-3 text-sm font-semibold text-gray-700 dark:text-gray-200"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-extrabold text-purple-700 dark:bg-purple-900/60 dark:text-purple-200">{chapterIndex + lessonIndex + 1}</span>{lesson}</li>)}</ol></article>)}</div>
          </div>
          <button type="button" onClick={() => { setPreviewCourse(null); reuseCourse(previewCourse); }} className="mt-8 w-full rounded-xl border-2 border-purple-700 bg-purple-500 py-3 text-xl font-bold font-['Kalam',cursive] text-white shadow-[0_5px_0_#6b21a8] transition-all hover:translate-y-0.5 hover:shadow-[0_3px_0_#6b21a8]">{previewCourse.isMine ? 'View course' : 'Reuse this course'}</button>
        </section>
      </div>}
    </DashboardLayout>
  );
};

export default Library;
