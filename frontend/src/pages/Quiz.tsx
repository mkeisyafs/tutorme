import { useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, CheckCircle2, FileImage, Lightbulb, Lock, Minus, Plus, Send, Sidebar, Sparkles, Target, XCircle } from 'lucide-react';

type QuestionType = 'multiple-choice' | 'essay';

interface QuizQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  options?: string[];
  correctAnswer?: number;
  requiresImage?: boolean;
}

interface QuizSettings {
  enableEssayQuestions: boolean;
  requireImageSubmission: boolean;
  quizLength: string;
}

const defaultSettings: QuizSettings = {
  enableEssayQuestions: true,
  requireImageSubmission: false,
  quizLength: 'Random',
};

const multipleChoiceBank = [
  { prompt: 'Which responsibility belongs to the back end of an application?', options: ['Styling buttons and layouts', 'Storing data and processing requests', 'Writing page headlines', 'Choosing brand colours'], correctAnswer: 1 },
  { prompt: 'In the restaurant analogy, what does the server side most closely represent?', options: ['The dining room', 'The printed menu', 'The kitchen that prepares orders', 'The restaurant sign'], correctAnswer: 2 },
  { prompt: 'Which component is responsible for keeping an application’s information?', options: ['Database', 'Button', 'Browser tab', 'Style sheet'], correctAnswer: 0 },
  { prompt: 'What happens first when a user asks an app to load data?', options: ['The database sends a styled page', 'The front end makes a request to the server', 'The server changes the browser layout', 'The user writes a new database'], correctAnswer: 1 },
  { prompt: 'Which is an example of front-end work rather than back-end work?', options: ['Validating a request', 'Saving a profile', 'Designing a navigation menu', 'Querying a database'], correctAnswer: 2 },
];

const essayBank = [
  'In your own words, explain the difference between the front end and back end. Use the restaurant analogy if it helps.',
  'Describe how information could travel when a learner opens a course in TutorMe, from click to displayed lesson.',
  'Choose one back-end component (server, application, or database) and explain why it matters to an app user.',
];

const shuffle = <T,>(items: T[]) => [...items].sort(() => Math.random() - 0.5);

const getQuizSettings = (): QuizSettings => {
  try {
    const stored = localStorage.getItem('tutorme-course-quiz-settings');
    if (!stored) return defaultSettings;
    const parsed = JSON.parse(stored) as Partial<QuizSettings>;
    return {
      enableEssayQuestions: parsed.enableEssayQuestions ?? defaultSettings.enableEssayQuestions,
      requireImageSubmission: Boolean(parsed.requireImageSubmission && parsed.enableEssayQuestions),
      quizLength: ['3 questions', '5 questions', '8 questions', 'Random'].includes(parsed.quizLength ?? '') ? parsed.quizLength! : defaultSettings.quizLength,
    };
  } catch {
    return defaultSettings;
  }
};

const generateQuiz = (settings: QuizSettings): QuizQuestion[] => {
  const total = settings.quizLength === 'Random' ? 3 + Math.floor(Math.random() * 3) : Number(settings.quizLength.split(' ')[0]);
  const essayCount = settings.enableEssayQuestions ? Math.min(Math.max(1, Math.floor(total / 3)), total) : 0;
  const mcCount = total - essayCount;
  const multipleChoice = Array.from({ length: mcCount }, (_, index) => {
    const source = shuffle(multipleChoiceBank)[index % multipleChoiceBank.length];
    return { id: `mc-${index}-${Date.now()}`, type: 'multiple-choice' as const, ...source };
  });
  const essays = Array.from({ length: essayCount }, (_, index) => ({
    id: `essay-${index}-${Date.now()}`,
    type: 'essay' as const,
    prompt: shuffle(essayBank)[index % essayBank.length],
    requiresImage: settings.requireImageSubmission,
  }));
  return shuffle([...multipleChoice, ...essays]);
};

const Quiz = () => {
  const navigate = useNavigate();
  const [{ questions, settings }] = useState(() => {
    const generatedSettings = getQuizSettings();
    return { questions: generateQuiz(generatedSettings), settings: generatedSettings };
  });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [attachments, setAttachments] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isFoundationsOpen, setIsFoundationsOpen] = useState(true);
  const [showQuizRequiredNotice, setShowQuizRequiredNotice] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  const multipleChoiceQuestions = questions.filter((question) => question.type === 'multiple-choice');
  const correctCount = multipleChoiceQuestions.filter((question) => answers[question.id] === String(question.correctAnswer)).length;
  const score = multipleChoiceQuestions.length ? Math.round((correctCount / multipleChoiceQuestions.length) * 100) : 100;

  const feedback = useMemo(() => questions.map((question) => {
    const answer = answers[question.id]?.trim();
    if (question.type === 'multiple-choice') {
      const isCorrect = answer === String(question.correctAnswer);
      const selected = answer ? question.options?.[Number(answer)] : 'No answer selected';
      return { id: question.id, isCorrect, title: isCorrect ? 'You got it!' : 'A useful correction', detail: isCorrect
        ? `You chose “${selected}.” Great job connecting the back end with its role behind the scenes. Apply this idea to the next example you see.`
        : `You chose “${selected}.” The back end handles data and request processing; visible layout is front-end work. Revisit the Server, Application, and Database section, then explain how those pieces work together.` };
    }
    const wordCount = answer ? answer.split(/\s+/).filter(Boolean).length : 0;
    const isDetailed = wordCount >= 12;
    return { id: question.id, isCorrect: isDetailed, title: isDetailed ? 'Thoughtful explanation' : 'Build out your explanation', detail: isDetailed
      ? `You gave a ${wordCount}-word explanation${question.requiresImage ? ' with the required image evidence' : ''}. Next, trace one real request from the interface to the server and database to reinforce your reasoning.`
      : 'Add a little more detail: identify what the learner sees on the front end, what the server does on the back end, and how data moves between them. The restaurant analogy is a useful structure.' };
  }), [answers, questions]);

  const submitQuiz = (event: FormEvent) => {
    event.preventDefault();
    if (questions.some((question) => !answers[question.id]?.trim())) {
      setError('Answer every question before submitting your quiz.');
      return;
    }
    if (questions.some((question) => question.requiresImage && !attachments[question.id])) {
      setError('Attach an image for each essay question that requires image submission.');
      return;
    }
    setError('');
    setSubmitted(true);
  };

  const addAttachment = (questionId: string, event: ChangeEvent<HTMLInputElement>) => setAttachments((current) => ({ ...current, [questionId]: event.target.files?.[0]?.name ?? '' }));

  const requestNavigation = (path: string) => {
    if (!submitted) {
      setPendingNavigation(path);
      setShowQuizRequiredNotice(true);
      return;
    }
    navigate(path);
  };

  return <div className="min-h-screen bg-gray-50 font-['Nunito',sans-serif] text-gray-800 transition-colors duration-300 dark:bg-gray-900 dark:text-gray-100">
    <main className="min-h-screen px-6 py-8 lg:ml-72 md:px-12">
    <div className="mx-auto max-w-5xl pb-16">
      <button onClick={() => requestNavigation('/lesson')} className="mb-7 flex items-center gap-2 font-bold text-gray-500 transition-colors hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"><ArrowLeft className="h-5 w-5" /> Back to lesson</button>
      <div className="block">
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 overflow-y-auto border-r-2 border-dashed border-gray-300 bg-white/80 p-6 shadow-[4px_0_24px_rgba(0,0,0,.02)] backdrop-blur-xl dark:border-gray-700 dark:bg-gray-800/80 lg:block">
          <div className="flex h-full flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <button onClick={() => requestNavigation('/home')} className="font-['Kalam',cursive] text-3xl font-bold text-blue-600 transition-transform hover:-rotate-2 dark:text-blue-400">TutorMe</button>
                <button type="button" aria-label="Collapse course sidebar" className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"><Sidebar className="h-6 w-6" /></button>
              </div>
              <div className="relative mt-10 rounded-2xl border-4 border-blue-300 bg-blue-100 p-5 shadow-[4px_4px_0_#60a5fa] dark:border-blue-700/60 dark:bg-blue-900/40 dark:shadow-[4px_4px_0_#1e3a8a]"><div className="absolute -right-2 -top-3 h-4 w-8 rotate-12 bg-yellow-400/80 dark:bg-yellow-500/40" /><span className="text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300">Your course</span><h2 className="mt-1 font-['Kalam',cursive] text-2xl font-bold leading-tight text-blue-950 dark:text-blue-100">Back-End Developer</h2><div className="mt-5 h-2 overflow-hidden rounded-full border border-blue-300 bg-blue-200 dark:border-blue-700 dark:bg-blue-800/50"><div className="h-full w-[35%] rounded-full bg-blue-500 dark:bg-blue-400" /></div><div className="mt-2 flex justify-between text-xs font-bold text-blue-700 dark:text-blue-300"><span>4/12 Lesson</span><span>35%</span></div></div>
              <section className="mt-10"><p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Course roadmap</p><div className="mt-5 space-y-5"><div><button type="button" onClick={() => setIsFoundationsOpen((open) => !open)} className="flex w-full items-center justify-between text-left font-bold text-gray-800 transition-colors hover:text-blue-600 dark:text-gray-200 dark:hover:text-blue-400"><span>01 Foundations</span>{isFoundationsOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}</button>{isFoundationsOpen && <div className="mt-4 space-y-3 pl-2">{['What is back end?', 'History of backend'].map((lesson) => <button key={lesson} type="button" onClick={() => requestNavigation('/lesson')} className={`flex items-center gap-3 text-left text-sm font-semibold ${lesson === 'History of backend' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'}`}><CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />{lesson}</button>)}<button type="button" onClick={() => requestNavigation('/lesson')} className="flex items-center gap-3 text-sm font-semibold text-gray-500 dark:text-gray-400"><Lock className="h-4 w-4 shrink-0" />Request &amp; Response</button><button type="button" onClick={() => requestNavigation('/lesson')} className="flex items-center gap-3 text-sm font-semibold text-gray-500 dark:text-gray-400"><Lock className="h-4 w-4 shrink-0" />APIs</button></div>}</div><button type="button" onClick={() => requestNavigation('/lesson')} className="flex w-full items-center justify-between text-left font-bold text-gray-800 transition-colors hover:text-blue-600 dark:text-gray-200 dark:hover:text-blue-400"><span>02 Node.js &amp; Express</span><Plus className="h-4 w-4 text-gray-400" /></button></div></section>
            </div>
            <button onClick={() => requestNavigation('/roadmap')} className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-gray-300 bg-gray-100 px-4 py-3 font-['Kalam',cursive] text-lg font-bold text-gray-700 shadow-[2px_2px_0_rgba(156,163,175,1)] transition-all hover:bg-gray-200 active:translate-y-0.5 active:shadow-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"><ArrowLeft className="h-5 w-5" /> Back to Roadmap</button>
          </div>
          <div className="hidden">
          <button onClick={() => navigate('/home')} className="font-['Kalam',cursive] text-3xl font-bold text-blue-600 transition-transform hover:-rotate-2 dark:text-blue-400">TutorMe</button>
          <div className="mt-10">
          <p className="text-xs font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">Your course</p>
          <h2 className="mt-1 font-['Kalam',cursive] text-2xl font-bold text-gray-900 dark:text-gray-100">Back-End Developer</h2>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-blue-100 dark:bg-blue-900/60"><div className="h-full w-[35%] rounded-full bg-blue-500" /></div>
          <p className="mt-2 text-sm font-bold text-blue-700 dark:text-blue-300">4 of 12 lessons complete</p>
          <div className="mt-7 space-y-5">
            <div><p className="text-xs font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">Chapter 1 · Foundations</p><ul className="mt-3 space-y-3 border-l-2 border-dashed border-blue-200 pl-4 dark:border-blue-800"><li className="flex items-center gap-2 text-sm font-bold text-green-600 dark:text-green-400"><CheckCircle2 className="h-4 w-4 shrink-0" /> What is back end?</li><li className="-ml-[7px] flex items-center gap-2 rounded-lg border-2 border-pink-300 bg-pink-100 px-3 py-2 text-sm font-bold text-pink-800 dark:border-pink-700 dark:bg-pink-900/35 dark:text-pink-200"><Target className="h-4 w-4 shrink-0" /> Lesson quiz</li><li className="flex items-center gap-2 text-sm font-semibold text-gray-400 dark:text-gray-500"><span className="ml-1 h-2.5 w-2.5 rounded-full bg-gray-300 dark:bg-gray-600" /> Request &amp; Response</li><li className="flex items-center gap-2 text-sm font-semibold text-gray-400 dark:text-gray-500"><span className="ml-1 h-2.5 w-2.5 rounded-full bg-gray-300 dark:bg-gray-600" /> APIs</li></ul></div>
            <div><p className="text-xs font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">Chapter 2 · Node.js &amp; Express</p><p className="mt-2 text-sm font-semibold text-gray-400 dark:text-gray-500">5 lessons locked</p></div>
          </div>
          <p className="mt-7 rounded-xl bg-blue-50 p-3 text-sm font-bold text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">Finish this quiz to unlock Request &amp; Response.</p>
          </div>
          <button onClick={() => navigate('/roadmap')} className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-gray-300 bg-gray-100 px-4 py-3 font-['Kalam',cursive] text-lg font-bold text-gray-700 transition-colors hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"><ArrowLeft className="h-5 w-5" /> Back to Roadmap</button>
          </div>
        </aside>
        <div className="min-w-0">
      <header className="rounded-3xl border-4 border-blue-300 bg-blue-100 p-7 shadow-[7px_7px_0_#60a5fa] dark:border-blue-700 dark:bg-blue-900/35 dark:shadow-[7px_7px_0_#1e3a8a]"><p className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-300"><Target className="h-4 w-4" /> Automatically generated lesson quiz</p><h1 className="mt-2 font-['Kalam',cursive] text-4xl font-bold text-blue-950 dark:text-blue-100">What is Back-End?</h1><p className="mt-2 font-semibold text-blue-800 dark:text-blue-200">{questions.length} questions · {settings.quizLength === 'Random' ? 'Random length selected by your course creator' : settings.quizLength} · Complete this quiz to unlock the next lesson.</p></header>

      {!submitted ? <form onSubmit={submitQuiz} className="mt-9 space-y-7">
        {questions.map((question, index) => <section key={question.id} className="rounded-3xl border-3 border-gray-300 bg-white/85 p-6 shadow-[4px_4px_0_rgba(100,116,139,.25)] dark:border-gray-700 dark:bg-gray-800/85"><p className="text-sm font-extrabold uppercase tracking-wider text-pink-600 dark:text-pink-400">Question {index + 1} · {question.type === 'multiple-choice' ? 'Multiple choice' : 'Written response'}</p><h2 className="mt-2 text-xl font-bold leading-relaxed text-gray-900 dark:text-gray-100">{question.prompt}</h2>{question.type === 'multiple-choice' ? <div className="mt-5 space-y-3">{question.options?.map((option, optionIndex) => <label key={option} className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 font-semibold transition-colors ${answers[question.id] === String(optionIndex) ? 'border-blue-500 bg-blue-50 text-blue-950 dark:bg-blue-900/35 dark:text-blue-100' : 'border-gray-200 hover:border-blue-300 dark:border-gray-700 dark:hover:border-blue-700'}`}><input type="radio" name={question.id} checked={answers[question.id] === String(optionIndex)} onChange={() => { setAnswers((current) => ({ ...current, [question.id]: String(optionIndex) })); setError(''); }} className="h-4 w-4 accent-blue-500" />{option}</label>)}</div> : <div className="mt-5"><textarea value={answers[question.id] ?? ''} onChange={(event) => { setAnswers((current) => ({ ...current, [question.id]: event.target.value })); setError(''); }} placeholder="Write your answer here..." className="min-h-36 w-full rounded-xl border-2 border-gray-200 bg-white p-4 font-medium text-gray-800 outline-none transition-colors focus:border-pink-400 focus:ring-4 focus:ring-pink-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-pink-500 dark:focus:ring-pink-900/40" />{question.requiresImage && <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl border-2 border-dashed border-pink-300 bg-pink-50 px-4 py-3 font-bold text-pink-700 transition-colors hover:bg-pink-100 dark:border-pink-700 dark:bg-pink-900/25 dark:text-pink-200"><FileImage className="h-5 w-5" />{attachments[question.id] || 'Attach a required image'}<input type="file" accept="image/*" onChange={(event) => addAttachment(question.id, event)} className="hidden" /></label>}{!question.requiresImage && <p className="mt-4 text-sm font-bold text-gray-500 dark:text-gray-400">Image uploads are disabled for this quiz by the course creator.</p>}</div>}</section>)}
        {error && <p className="rounded-xl border-2 border-red-300 bg-red-50 p-4 font-bold text-red-700 dark:border-red-700 dark:bg-red-900/25 dark:text-red-200">{error}</p>}
        <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-pink-700 bg-pink-500 py-4 font-['Kalam',cursive] text-2xl font-bold text-white shadow-[0_6px_0_#be185d] transition-all hover:translate-y-0.5 hover:shadow-[0_4px_0_#be185d]"><Send className="h-5 w-5" /> Submit quiz for feedback</button>
      </form> : <section className="mt-9 space-y-6"><div className="rounded-3xl border-4 border-green-300 bg-green-100 p-7 shadow-[7px_7px_0_#4ade80] dark:border-green-700 dark:bg-green-900/35 dark:shadow-[7px_7px_0_#166534]"><div className="flex items-start gap-4"><div className="rounded-2xl bg-white/70 p-3 text-green-600 dark:bg-gray-900/60 dark:text-green-300"><Sparkles className="h-8 w-8 fill-current" /></div><div><p className="text-sm font-extrabold uppercase tracking-wider text-green-700 dark:text-green-300">Quiz complete</p><h2 className="font-['Kalam',cursive] text-3xl font-bold text-green-950 dark:text-green-100">{score}% on multiple choice</h2><p className="mt-1 font-semibold text-green-800 dark:text-green-200">Review your answers and personalized suggestions below before continuing.</p></div></div></div>{questions.map((question, index) => { const result = feedback.find((item) => item.id === question.id)!; const answer = question.type === 'multiple-choice' ? question.options?.[Number(answers[question.id])] : answers[question.id]; return <article key={question.id} className={`rounded-2xl border-2 p-6 ${result.isCorrect ? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/25' : 'border-orange-300 bg-orange-50 dark:border-orange-700 dark:bg-orange-900/25'}`}><div className="flex items-start gap-3">{result.isCorrect ? <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-green-500" /> : <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-orange-500" />}<div className="min-w-0"><p className="text-sm font-extrabold uppercase tracking-wider opacity-70">Question {index + 1}</p><h3 className="mt-1 text-lg font-bold text-gray-900 dark:text-gray-100">{question.prompt}</h3><p className="mt-3 rounded-xl bg-white/65 p-3 font-semibold text-gray-700 dark:bg-gray-900/45 dark:text-gray-200"><span className="font-extrabold">Your answer: </span>{answer}</p>{attachments[question.id] && <p className="mt-2 text-sm font-bold text-gray-600 dark:text-gray-300">Attached image: {attachments[question.id]}</p>}<div className="mt-4 flex gap-2"><Lightbulb className="h-5 w-5 shrink-0 text-pink-500" /><div><h4 className="font-['Kalam',cursive] text-xl font-bold text-gray-900 dark:text-gray-100">AI feedback: {result.title}</h4><p className="mt-1 font-semibold leading-relaxed text-gray-700 dark:text-gray-200">{result.detail}</p></div></div></div></div></article>; })}<button onClick={() => navigate('/lesson')} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-blue-700 bg-blue-500 py-4 font-['Kalam',cursive] text-2xl font-bold text-white shadow-[0_6px_0_#1d4ed8] transition-all hover:translate-y-0.5 hover:shadow-[0_4px_0_#1d4ed8]"><Check className="h-6 w-6" /> Continue to next lesson</button></section>}
        </div>
      </div>
    </div>
    </main>
    {showQuizRequiredNotice && <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/45 p-4 backdrop-blur-sm"><section role="dialog" aria-modal="true" aria-labelledby="quiz-required-title" className="w-full max-w-md rounded-3xl border-4 border-pink-400 bg-pink-50 p-7 text-center shadow-[7px_7px_0_#ec4899] dark:border-pink-700 dark:bg-gray-800"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-100 text-pink-500 dark:bg-pink-900/40"><Target className="h-7 w-7" /></div><h2 id="quiz-required-title" className="mt-4 font-['Kalam',cursive] text-3xl font-bold text-pink-950 dark:text-pink-100">Leave this quiz?</h2><p className="mt-2 font-semibold leading-relaxed text-pink-800 dark:text-pink-200">Your current answers and any attached images have not been submitted. If you leave now, they will be reset and you will need to answer the generated quiz again.</p><div className="mt-6 grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => { setShowQuizRequiredNotice(false); setPendingNavigation(null); }} className="rounded-xl border-2 border-pink-300 bg-white py-3 font-['Kalam',cursive] text-lg font-bold text-pink-800 transition-colors hover:bg-pink-100 dark:border-pink-700 dark:bg-gray-900 dark:text-pink-200 dark:hover:bg-pink-900/30">Keep answering</button><button type="button" onClick={() => { const destination = pendingNavigation; setAnswers({}); setAttachments({}); setSubmitted(false); setShowQuizRequiredNotice(false); setPendingNavigation(null); if (destination) navigate(destination); }} className="rounded-xl border-2 border-pink-700 bg-pink-500 py-3 font-['Kalam',cursive] text-lg font-bold text-white shadow-[0_4px_0_#be185d] transition-all hover:translate-y-0.5 hover:shadow-[0_2px_0_#be185d]">Leave &amp; reset</button></div></section></div>}
  </div>;
};

export default Quiz;
