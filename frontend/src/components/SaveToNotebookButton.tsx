import { useState } from 'react';
import { BookmarkPlus, Check, Plus } from 'lucide-react';
import { addNotebookItem, createNotebook, getNotebooks, type Notebook } from '../utils/notebooks';

interface SaveToNotebookButtonProps { courseTitle: string; content: string; }

const SaveToNotebookButton = ({ courseTitle, content }: SaveToNotebookButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [newNotebookTitle, setNewNotebookTitle] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  const openMenu = () => { setNotebooks(getNotebooks()); setIsOpen(true); setIsSaved(false); };
  const saveToNotebook = (notebookId: string) => { addNotebookItem(notebookId, courseTitle, content); setIsSaved(true); setTimeout(() => setIsOpen(false), 700); };
  const createAndSave = () => {
    if (!newNotebookTitle.trim()) return;
    const notebook = createNotebook(newNotebookTitle);
    addNotebookItem(notebook.id, courseTitle, content);
    setNotebooks([...notebooks, notebook]);
    setNewNotebookTitle('');
    setIsSaved(true);
    setTimeout(() => setIsOpen(false), 700);
  };

  return <div className="mt-3">
    <button type="button" onClick={openMenu} className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40"><BookmarkPlus className="w-4 h-4" /> Add to notebook</button>
    {isOpen && <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button type="button" aria-label="Close save to notebook dialog" className="absolute inset-0 bg-gray-950/45 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      <div role="dialog" aria-modal="true" aria-label="Save response to notebook" className="relative z-10 w-full max-w-sm rounded-2xl border-2 border-purple-200 dark:border-purple-700 bg-white dark:bg-gray-800 p-5 shadow-[0_20px_50px_rgba(76,29,149,.35)]">
        <p className="mb-3 text-sm font-bold uppercase tracking-wide text-purple-700 dark:text-purple-300">Save to notebook</p>
        <div className="max-h-40 space-y-1 overflow-y-auto">{notebooks.map((notebook) => <button key={notebook.id} type="button" onClick={() => saveToNotebook(notebook.id)} className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-bold text-gray-700 hover:bg-purple-50 dark:text-gray-200 dark:hover:bg-purple-900/40">{notebook.title}</button>)}</div>
        <div className="mt-3 border-t border-purple-100 dark:border-purple-900 pt-3"><input autoFocus value={newNotebookTitle} onChange={(event) => setNewNotebookTitle(event.target.value)} placeholder="New notebook name" className="w-full rounded-lg border border-purple-200 bg-purple-50/50 px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-purple-500 dark:border-purple-800 dark:bg-gray-900 dark:text-gray-100" /><button type="button" onClick={createAndSave} className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg bg-purple-500 px-3 py-2.5 text-sm font-bold text-white hover:bg-purple-600"><Plus className="w-4 h-4" /> Create & save</button></div>
        {isSaved && <span className="mt-3 flex items-center gap-1 text-xs font-bold text-green-600"><Check className="w-4 h-4" /> Saved</span>}
      </div>
    </div>}
  </div>;
};

export default SaveToNotebookButton;
