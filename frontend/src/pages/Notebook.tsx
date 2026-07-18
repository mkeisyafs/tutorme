import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookMarked, FileText, MessageSquareText, Pin, Plus, Sparkles, FileQuestion } from 'lucide-react';
import { myCourses } from '../constant/courses';
import { useTheme } from '../hooks/useTheme';
import { createNotebook, getNotebooks, updateNotebookBody, type Notebook } from '../utils/notebooks';

const NotebookPage = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [notebooks, setNotebooks] = useState<Notebook[]>(getNotebooks);
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>(notebooks[0]?.id ?? null);
  const [newTitle, setNewTitle] = useState('');
  const activeNotebook = notebooks.find((notebook) => notebook.id === activeNotebookId) ?? null;
  const [body, setBody] = useState(activeNotebook?.body ?? '');
  const [wasSummarized, setWasSummarized] = useState(false);

  useEffect(() => {
    setBody(activeNotebook?.body ?? '');
    setWasSummarized(false);
  }, [activeNotebookId]);

  const createNewNotebook = () => {
    if (!newTitle.trim()) return;
    const notebook = createNotebook(newTitle);
    setNotebooks([...notebooks, notebook]);
    setActiveNotebookId(notebook.id);
    setNewTitle('');
  };

  const saveBody = (value: string) => {
    setBody(value);
    if (!activeNotebook) return;
    updateNotebookBody(activeNotebook.id, value);
    setNotebooks(notebooks.map((notebook) => notebook.id === activeNotebook.id ? { ...notebook, body: value } : notebook));
  };

  const summarizeDocument = () => {
    const sentences = body.replace(/\s+/g, ' ').trim().match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [];
    if (!sentences.length) return;

    // BACKEND TODO: Replace this lightweight client-side summary with an AI summary endpoint.
    // It should receive the notebook body and return a concise, well-structured replacement document.
    const summary = sentences.slice(0, 4).map((sentence) => `• ${sentence.trim()}`).join('\n');
    saveBody(`Summary\n\n${summary}`);
    setWasSummarized(true);
  };

  const createQuizFromNotebook = () => {
    if (!activeNotebook || !body.trim()) return;
    // BACKEND TODO: Send notebookContent to the quiz API so questions reflect the actual saved notes.
    navigate('/quiz', { state: { notebookTitle: activeNotebook.title, notebookContent: body } });
  };

  return <div className="h-screen overflow-hidden bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-100 font-['Nunito',sans-serif] flex">
    <aside className="w-80 shrink-0 bg-white/85 dark:bg-gray-800/90 border-r-2 border-dashed border-purple-200 dark:border-gray-700 p-5 flex flex-col shadow-[5px_0_18px_rgba(0,0,0,.04)]">
      <button onClick={() => navigate('/home')} className="mb-7 flex items-center gap-2 self-start rounded-xl px-3 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"><ArrowLeft className="w-4 h-4" /> Back to dashboard</button>
      <div className="mb-5 flex items-center gap-3"><div className="rounded-xl bg-purple-100 p-2 text-purple-600 dark:bg-purple-900/40"><BookMarked className="w-6 h-6" /></div><div><h1 className="text-3xl font-bold font-['Kalam',cursive] text-purple-700 dark:text-purple-300">Notebook</h1><p className="text-xs font-bold text-gray-500 dark:text-gray-400">Your learning notes</p></div></div>
      <div className="flex-1 overflow-y-auto pr-1">
        <section><div className="mb-3 flex items-center justify-between"><h2 className="font-bold uppercase tracking-wider text-xs text-purple-700 dark:text-purple-300">My notebooks</h2><span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">{notebooks.length}</span></div><div className="space-y-1">{notebooks.map((notebook) => <button key={notebook.id} onClick={() => setActiveNotebookId(notebook.id)} className={`flex w-full items-center gap-2 rounded-xl px-3 py-3 text-left font-bold transition-colors ${notebook.id === activeNotebookId ? 'bg-purple-500 text-white shadow-sm' : 'text-gray-700 hover:bg-purple-50 dark:text-gray-200 dark:hover:bg-purple-900/30'}`}><FileText className="w-4 h-4 shrink-0" /><span className="truncate">{notebook.title}</span><span className="ml-auto text-xs opacity-80">{notebook.items.length}</span></button>)}</div><div className="mt-3 flex gap-2"><input value={newTitle} onChange={(event) => setNewTitle(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && createNewNotebook()} placeholder="New notebook" className="min-w-0 flex-1 rounded-xl border border-purple-200 bg-purple-50/50 px-3 py-2 text-sm outline-none focus:border-purple-500 dark:border-purple-800 dark:bg-gray-900" /><button onClick={createNewNotebook} aria-label="Create notebook" className="rounded-xl bg-purple-500 p-2 text-white hover:bg-purple-600"><Plus className="w-5 h-5" /></button></div></section>
        <section className="mt-8 border-t-2 border-dashed border-gray-200 pt-6 dark:border-gray-700"><h2 className="mb-3 flex items-center gap-2 font-bold uppercase tracking-wider text-xs text-blue-700 dark:text-blue-300"><MessageSquareText className="w-4 h-4" /> Course chats</h2><div className="space-y-1">{myCourses.map((course) => <button key={course.id} onClick={() => navigate('/lesson', { state: { courseTitle: course.title } })} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-gray-600 hover:bg-blue-50 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-blue-900/30 dark:hover:text-blue-300"><MessageSquareText className="w-4 h-4 shrink-0" /><span className="truncate">{course.title}</span></button>)}</div></section>
      </div>
    </aside>
    <main className="flex-1 overflow-y-auto p-5 md:p-10" style={{ backgroundImage: isDark ? 'linear-gradient(#374151 1px, transparent 1px), linear-gradient(90deg, #374151 1px, transparent 1px)' : 'linear-gradient(#f0f0f0 1px, transparent 1px), linear-gradient(90deg, #f0f0f0 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      {activeNotebook ? <div className="relative mx-auto max-w-4xl min-h-[calc(100vh-5rem)] rounded-[2rem] border-2 border-yellow-300 bg-[#fffdf5] p-7 md:p-12 shadow-[12px_12px_0px_rgba(76,29,149,.22)] dark:border-yellow-800 dark:bg-gray-800 overflow-hidden">
        <div className="absolute -top-1 left-1/2 h-7 w-32 -translate-x-1/2 rotate-[-2deg] bg-purple-300/65 dark:bg-purple-500/35" />
        <div className="absolute inset-y-0 left-9 w-px bg-red-300/70 dark:bg-red-900/60" />
        <div className="mb-8 border-b-2 border-dashed border-yellow-200 pb-6 dark:border-yellow-800"><div className="mb-3 flex items-center justify-between gap-4"><h2 className="text-4xl font-bold font-['Kalam',cursive] text-yellow-900 dark:text-yellow-200">{activeNotebook.title}</h2><span className="rounded-full bg-yellow-200 px-3 py-1 text-sm font-bold text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">{activeNotebook.items.length} notes</span></div><p className="font-medium text-yellow-700 dark:text-yellow-300">A place for your own thoughts and saved AI explanations.</p></div>
        <section className="mb-8 flex flex-col gap-4 rounded-2xl border-2 border-yellow-200 bg-yellow-50/70 p-5 dark:border-yellow-800 dark:bg-yellow-900/20"><div><h3 className="mb-1 flex items-center gap-2 font-bold text-yellow-900 dark:text-yellow-200"><Pin className="w-4 h-4" /> Document actions</h3><p className="text-sm leading-relaxed text-yellow-800 dark:text-yellow-300">Summarize the current notes or create a quiz from this notebook.</p></div><div className="flex flex-wrap gap-3"><button type="button" onClick={summarizeDocument} disabled={!body.trim()} className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-yellow-400 px-4 py-3 font-bold text-yellow-950 shadow-[3px_3px_0px_rgba(202,138,4,.55)] transition hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-50"><Sparkles className="w-5 h-5" /> Summary</button><button type="button" onClick={createQuizFromNotebook} disabled={!body.trim()} className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-3 font-bold text-white shadow-[3px_3px_0px_rgba(29,78,216,.5)] transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"><FileQuestion className="w-5 h-5" /> Create quiz</button></div></section>
        {wasSummarized && <p className="mb-5 rounded-xl bg-green-100 px-4 py-3 text-sm font-bold text-green-800 dark:bg-green-900/30 dark:text-green-300">The document was replaced with its summary.</p>}
        <section><div className="mb-3 flex items-center justify-between"><label className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Notebook document</label><span className="flex items-center gap-1 text-xs font-bold text-purple-600 dark:text-purple-300"><MessageSquareText className="w-4 h-4" /> AI responses paste here</span></div><textarea value={body} onChange={(event) => saveBody(event.target.value)} placeholder="Start writing here…&#10;&#10;When you choose “Add to notebook” in AI chat, its response will be copied and pasted into this document." className="min-h-[26rem] w-full resize-y border-0 bg-transparent pl-7 pr-1 py-2 text-lg leading-[2.1rem] text-gray-700 outline-none placeholder:text-gray-400 dark:text-gray-200" style={{ backgroundImage: 'linear-gradient(transparent 32px, #efdca5 33px)', backgroundSize: '100% 34px' }} /></section>
      </div> : <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center text-center"><BookMarked className="mb-4 w-14 h-14 text-purple-500" /><h2 className="text-4xl font-bold font-['Kalam',cursive] text-gray-800 dark:text-gray-100">Create your first notebook</h2><p className="mt-2 font-medium text-gray-600 dark:text-gray-300">Use the sidebar to create a notebook, then save AI responses from your course chats.</p></div>}
    </main>
  </div>;
};

export default NotebookPage;
