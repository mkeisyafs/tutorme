export interface NotebookItem {
  id: string;
  courseTitle: string;
  content: string;
  createdAt: string;
}

export interface Notebook {
  id: string;
  title: string;
  createdAt: string;
  items: NotebookItem[];
  body?: string;
}

const STORAGE_KEY = 'tutormeNotebooks';

export const getNotebooks = (): Notebook[] => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
};

const saveNotebooks = (notebooks: Notebook[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(notebooks));

export const createNotebook = (title: string): Notebook => {
  const notebook = { id: crypto.randomUUID(), title: title.trim(), createdAt: new Date().toISOString(), items: [] };
  saveNotebooks([...getNotebooks(), notebook]);
  return notebook;
};

export const addNotebookItem = (notebookId: string, courseTitle: string, content: string) => {
  const notebooks = getNotebooks().map((notebook) => {
    if (notebook.id !== notebookId) return notebook;

    const copiedResponse = `${notebook.body?.trim() ? '\n\n' : ''}${content}`;
    return {
      ...notebook,
      // AI responses are pasted straight into the editable notebook document.
      body: `${notebook.body ?? ''}${copiedResponse}`,
      items: [...notebook.items, { id: crypto.randomUUID(), courseTitle, content, createdAt: new Date().toISOString() }],
    };
  });
  saveNotebooks(notebooks);
};

export const updateNotebookBody = (notebookId: string, body: string) => {
  saveNotebooks(getNotebooks().map((notebook) => notebook.id === notebookId ? { ...notebook, body } : notebook));
};

export const getNotebookSummary = (notebook: Notebook) => {
  if (!notebook.items.length) return 'This notebook is empty. Add helpful AI responses from any course to start building your notes.';
  const courses = [...new Set(notebook.items.map((item) => item.courseTitle))];
  return `${notebook.items.length} saved AI response${notebook.items.length === 1 ? '' : 's'} from ${courses.join(', ')}. Review the notes below to revisit the key concepts.`;
};
