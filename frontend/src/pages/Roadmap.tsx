import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, CircleAlert, LoaderCircle, MessageCircle, Pencil, Play, RefreshCw, Save, Send, Sidebar, Sparkles, X } from 'lucide-react';
import { ApiError, apiRequest } from '../lib/api';
import type {
  DraftOutline,
  EditorChatResponse,
  EditorMessage,
  PublishResponse,
} from '../types/roadmap';

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message;
  }

  return fallback;
};

const makeMessage = (role: EditorMessage['role'], content: string): EditorMessage => ({
  id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  role,
  content,
});

const Roadmap = () => {
  const navigate = useNavigate();
  const { draftId } = useParams<{ draftId: string }>();
  const [draft, setDraft] = useState<DraftOutline | null>(null);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDraftLoading, setIsDraftLoading] = useState(true);
  const [draftError, setDraftError] = useState('');
  const [actionError, setActionError] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [chatMessages, setChatMessages] = useState<EditorMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const loadDraft = useCallback(async () => {
    if (!draftId) {
      setDraft(null);
      setDraftError('This roadmap is missing its draft ID. Generate a new course draft and try again.');
      setIsDraftLoading(false);
      return;
    }

    setIsDraftLoading(true);
    setDraftError('');
    setActionError('');

    try {
      const data = await apiRequest<DraftOutline>(`/generation/outline/${encodeURIComponent(draftId)}`);

      if (!data.draftId || !Array.isArray(data.modules)) {
        throw new Error('The server returned an invalid course draft.');
      }

      setDraft(data);
      setEditedTitle(data.courseTitle);
      setEditedDescription(data.courseDescription);
      setExpandedModule(data.modules[0]?.id ?? null);
      setChatMessages([
        makeMessage(
          'assistant',
          `Your ${data.courseTitle} outline is ready. Ask me to add, remove, rename, or reorder any module or lesson before you start learning.`
        ),
      ]);
    } catch (error) {
      setDraft(null);
      setDraftError(getErrorMessage(error, 'We could not load this course draft. Please try again.'));
    } finally {
      setIsDraftLoading(false);
    }
  }, [draftId]);

  useEffect(() => {
    void loadDraft();
  }, [loadDraft]);

  useEffect(() => {
    if (!toastMessage) return;

    const timeout = window.setTimeout(() => setToastMessage(''), 4000);
    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  const lessonCount = useMemo(
    () => draft?.modules.reduce((total, module) => total + module.lessons.length, 0) ?? 0,
    [draft]
  );

  const showGuideMessage = (message: string) => {
    setToastMessage(message);
  };

  const handleSaveDetails = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!draftId || !draft) return;

    const courseTitle = editedTitle.trim();
    if (!courseTitle) {
      setActionError('A course title is required.');
      return;
    }

    setActionError('');
    setIsSavingDetails(true);

    try {
      const updatedDraft = await apiRequest<DraftOutline>(`/generation/outline/${encodeURIComponent(draftId)}`, {
        method: 'PATCH',
        body: {
          courseTitle,
          courseDescription: editedDescription.trim(),
        },
      });

      setDraft(updatedDraft);
      setEditedTitle(updatedDraft.courseTitle);
      setEditedDescription(updatedDraft.courseDescription);
      setIsEditingDetails(false);
      showGuideMessage('Draft details saved. Your course still will not be published until you click Start Learning.');
    } catch (error) {
      setActionError(getErrorMessage(error, 'We could not save your draft details. Please try again.'));
    } finally {
      setIsSavingDetails(false);
    }
  };

  const handleEditorChat = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const message = chatInput.trim();
    if (!message || !draftId || !draft || isChatting) return;

    const userMessage = makeMessage('user', message);
    const nextMessages = [...chatMessages, userMessage];
    setChatMessages(nextMessages);
    setChatInput('');
    setActionError('');
    setIsChatting(true);

    try {
      const result = await apiRequest<EditorChatResponse>(`/generation/outline/${encodeURIComponent(draftId)}/chat`, {
        method: 'POST',
        body: {
          messages: nextMessages.map(({ role, content }) => ({ role, content })),
        },
      });

      if (!result.draft || !Array.isArray(result.draft.modules)) {
        throw new Error('The editor did not return an updated draft.');
      }

      setDraft(result.draft);
      setEditedTitle(result.draft.courseTitle);
      setEditedDescription(result.draft.courseDescription);
      setExpandedModule(result.draft.modules[0]?.id ?? null);
      setChatMessages([
        ...nextMessages,
        makeMessage('assistant', result.reply || 'I updated your draft outline.'),
      ]);
      showGuideMessage('Your outline has been updated in this draft.');
    } catch (error) {
      setActionError(getErrorMessage(error, 'The outline editor could not update your draft. Please try again.'));
    } finally {
      setIsChatting(false);
    }
  };

  const handlePublish = async () => {
    if (!draftId || isPublishing) return;

    setActionError('');
    setIsPublishing(true);

    try {
      const result = await apiRequest<PublishResponse>(`/generation/outline/${encodeURIComponent(draftId)}/publish`, {
        method: 'POST',
      });

      if (!result.courseId) {
        throw new Error('The server did not return a course ID.');
      }

      navigate(`/courses/${encodeURIComponent(result.courseId)}`);
    } catch (error) {
      setActionError(getErrorMessage(error, 'We could not publish this course. Please try again.'));
      setIsPublishing(false);
    }
  };

  if (isDraftLoading) {
    return (
      <div className="min-h-screen w-full bg-gray-50 px-6 py-16 font-['Nunito',sans-serif] text-gray-800 dark:bg-gray-900 dark:text-gray-100">
        <div className="mx-auto flex max-w-xl flex-col items-center rounded-3xl border-4 border-purple-300 bg-white p-10 text-center shadow-[8px_8px_0px_0px_rgba(168,85,247,1)] dark:border-purple-700 dark:bg-gray-800">
          <LoaderCircle className="h-12 w-12 animate-spin text-purple-500" />
          <h1 className="mt-5 font-['Kalam',cursive] text-3xl font-bold">Loading your draft roadmap</h1>
          <p className="mt-2 font-bold text-gray-600 dark:text-gray-300">Getting your modules and lessons ready for review…</p>
        </div>
      </div>
    );
  }

  if (draftError || !draft) {
    return (
      <div className="min-h-screen w-full bg-gray-50 px-6 py-16 font-['Nunito',sans-serif] text-gray-800 dark:bg-gray-900 dark:text-gray-100">
        <div className="mx-auto flex max-w-xl flex-col items-center rounded-3xl border-4 border-red-300 bg-white p-10 text-center shadow-[8px_8px_0px_0px_rgba(248,113,113,1)] dark:border-red-800 dark:bg-gray-800">
          <CircleAlert className="h-12 w-12 text-red-500" />
          <h1 className="mt-5 font-['Kalam',cursive] text-3xl font-bold">We couldn’t open this draft</h1>
          <p role="alert" className="mt-3 font-bold text-red-700 dark:text-red-300">{draftError || 'The draft is unavailable.'}</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <button onClick={() => void loadDraft()} className="flex items-center gap-2 rounded-xl border-2 border-purple-700 bg-purple-500 px-5 py-3 font-['Kalam',cursive] text-lg font-bold text-white shadow-[2px_2px_0px_0px_rgba(126,34,206,1)] transition-all active:translate-y-0.5 active:shadow-none">
              <RefreshCw className="h-5 w-5" />
              Try again
            </button>
            <button onClick={() => navigate(-1)} className="rounded-xl border-2 border-gray-300 bg-gray-100 px-5 py-3 font-['Kalam',cursive] text-lg font-bold text-gray-700 shadow-[2px_2px_0px_0px_rgba(156,163,175,1)] transition-all active:translate-y-0.5 active:shadow-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100">
              Go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-white font-['Nunito',sans-serif] text-gray-800 transition-colors duration-300 dark:bg-gray-900 dark:text-gray-100">
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="absolute left-6 top-6 z-30 rounded-xl border-2 border-gray-200 bg-white p-3 text-gray-600 shadow-[4px_4px_0px_0px_rgba(229,231,235,1)] transition-all hover:-translate-y-0.5 hover:bg-gray-50 active:translate-y-0 active:shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:shadow-[4px_4px_0px_0px_rgba(55,65,81,0.8)] dark:hover:bg-gray-700"
          aria-label="Open course sidebar"
        >
          <Sidebar className="h-6 w-6" />
        </button>
      )}

      {isSidebarOpen && (
        <aside className="relative z-20 flex h-full w-72 flex-shrink-0 flex-col justify-between overflow-y-auto border-r-2 border-dashed border-gray-300 bg-white/70 p-6 shadow-[4px_0_24px_rgba(0,0,0,0.02)] backdrop-blur-xl transition-all duration-300 dark:border-gray-700 dark:bg-gray-800/70">
          <div className="flex flex-col gap-6">
            <div className="mt-2 flex items-center justify-between">
              <div className="cursor-pointer font-['Kalam',cursive] text-3xl font-bold text-blue-600 -rotate-2 transform dark:text-blue-400">TutorMe</div>
              <button onClick={() => setIsSidebarOpen(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" aria-label="Collapse course sidebar">
                <Sidebar className="h-6 w-6" />
              </button>
            </div>

            <div className="relative -rotate-1 transform rounded-2xl border-4 border-blue-300 bg-blue-100 p-5 shadow-[4px_4px_0px_0px_rgba(96,165,250,1)] dark:border-blue-700/50 dark:bg-blue-900/40 dark:shadow-[4px_4px_0px_0px_rgba(30,58,138,0.8)]">
              <div className="pointer-events-none absolute -right-2 -top-3 h-4 w-8 rotate-12 transform bg-yellow-400/80 shadow-sm backdrop-blur-sm dark:bg-yellow-500/40" />
              <span className="mb-2 inline-block text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300">Your draft</span>
              <h3 className="mb-4 font-['Kalam',cursive] text-2xl font-bold leading-tight text-blue-950 dark:text-blue-100">{draft.courseTitle}</h3>
              <div className="mb-2 h-2 w-full rounded-full border border-blue-300 bg-blue-200 dark:border-blue-700 dark:bg-blue-800/50">
                <div className="h-full w-0 rounded-full bg-blue-500 dark:bg-blue-400" />
              </div>
              <div className="flex justify-between text-xs font-bold text-blue-700 dark:text-blue-300">
                <span>{lessonCount} {lessonCount === 1 ? 'lesson' : 'lessons'}</span>
                <span>Not started</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate(-1)}
            className="mt-8 flex w-full flex-shrink-0 items-center justify-center gap-2 rounded-xl border-2 border-gray-300 bg-gray-100 px-4 py-3 font-['Kalam',cursive] text-lg font-bold text-gray-700 shadow-[2px_2px_0px_0px_rgba(156,163,175,1)] transition-all active:translate-y-0.5 active:shadow-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:shadow-[2px_2px_0px_0px_rgba(75,85,99,1)] dark:hover:bg-gray-700"
          >
            <ArrowLeft className="h-5 w-5" />
            Back
          </button>
        </aside>
      )}

      <main className="relative flex h-full flex-1 flex-col overflow-y-auto bg-gray-50 dark:bg-gray-900">
        <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col px-8 py-10">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <h1 className="flex items-center gap-4 font-['Kalam',cursive] text-4xl font-bold uppercase tracking-wide text-gray-900 md:text-5xl dark:text-gray-100">
              <Play className="h-10 w-10 rotate-12 transform fill-pink-500 text-pink-500" />
              Roadmap
            </h1>
            <div className="flex gap-3 sm:gap-4">
              <button
                onClick={() => navigate(-1)}
                disabled={isPublishing}
                className="rounded-xl border-2 border-gray-300 bg-white px-4 py-2.5 font-['Kalam',cursive] text-lg font-bold text-gray-600 shadow-[2px_2px_0px_0px_rgba(156,163,175,1)] transition-all active:translate-y-0.5 active:shadow-none disabled:cursor-not-allowed disabled:opacity-60 sm:px-6 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:shadow-[2px_2px_0px_0px_rgba(75,85,99,1)] dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => void handlePublish()}
                disabled={isPublishing || isSavingDetails || isChatting}
                className="flex items-center gap-2 rounded-xl border-2 border-green-700 bg-green-500 px-4 py-2.5 font-['Kalam',cursive] text-lg font-bold text-white shadow-[2px_2px_0px_0px_rgba(21,128,61,1)] transition-all active:translate-y-0.5 active:shadow-none disabled:cursor-not-allowed disabled:opacity-60 sm:px-6 dark:bg-green-600 dark:hover:bg-green-500"
              >
                {isPublishing && <LoaderCircle className="h-5 w-5 animate-spin" />}
                {isPublishing ? 'Starting…' : 'Start Learning'}
              </button>
            </div>
          </div>

          <div className="mb-8 flex items-start gap-4 rounded-2xl border-4 border-purple-300 bg-purple-100 p-5 shadow-[4px_4px_0px_0px_rgba(168,85,247,1)] rotate-1 transform dark:border-purple-700/50 dark:bg-purple-900/40 dark:shadow-[4px_4px_0px_0px_rgba(126,34,206,0.8)] sm:items-center">
            <div className="flex-shrink-0 rounded-full border-2 border-purple-400 bg-purple-200 p-3 dark:border-purple-600 dark:bg-purple-800">
              <Sparkles className="h-6 w-6 text-purple-700 dark:text-purple-300" />
            </div>
            <div>
              <h3 className="mb-1 font-['Kalam',cursive] text-2xl font-bold text-purple-950 dark:text-purple-100">Editor Mode</h3>
              <p className="text-sm font-bold text-purple-800 dark:text-purple-300">This outline is a draft only. Use the editor assistant to change modules and lessons; it is saved as a draft and enters your course database only after you click <strong className="text-purple-900 dark:text-purple-200">Start Learning</strong>.</p>
            </div>
          </div>

          {actionError && (
            <div role="alert" className="mb-6 flex items-start gap-3 rounded-2xl border-4 border-red-300 bg-red-50 p-4 font-bold text-red-700 shadow-[4px_4px_0px_0px_rgba(248,113,113,1)] dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
              <CircleAlert className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          <div className="relative mb-8 rounded-3xl border-4 border-yellow-200 bg-yellow-50 p-8 shadow-[8px_8px_0px_0px_rgba(253,224,71,1)] dark:border-yellow-700/50 dark:bg-yellow-900/20 dark:shadow-[8px_8px_0px_0px_rgba(161,98,7,0.8)]">
            <div className="pointer-events-none absolute -right-4 -top-4 h-6 w-12 -rotate-12 transform border-2 border-pink-500 bg-pink-400/80 shadow-sm backdrop-blur-sm dark:border-pink-600 dark:bg-pink-500/40" />
            {isEditingDetails ? (
              <form onSubmit={handleSaveDetails} className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">Course title</span>
                  <input value={editedTitle} onChange={(event) => setEditedTitle(event.target.value)} className="w-full rounded-xl border-2 border-yellow-400 bg-white px-4 py-3 text-2xl font-bold text-gray-900 outline-none focus:ring-4 focus:ring-yellow-300 dark:bg-gray-800 dark:text-gray-100" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">Description</span>
                  <textarea value={editedDescription} onChange={(event) => setEditedDescription(event.target.value)} rows={3} className="w-full resize-y rounded-xl border-2 border-yellow-400 bg-white px-4 py-3 font-bold text-gray-700 outline-none focus:ring-4 focus:ring-yellow-300 dark:bg-gray-800 dark:text-gray-100" />
                </label>
                <div className="flex flex-wrap gap-3">
                  <button type="submit" disabled={isSavingDetails} className="flex items-center gap-2 rounded-xl border-2 border-yellow-700 bg-yellow-400 px-4 py-2.5 font-['Kalam',cursive] text-lg font-bold text-yellow-950 shadow-[2px_2px_0px_0px_rgba(161,98,7,1)] transition-all active:translate-y-0.5 active:shadow-none disabled:cursor-not-allowed disabled:opacity-60">
                    {isSavingDetails ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    Save draft details
                  </button>
                  <button type="button" disabled={isSavingDetails} onClick={() => { setEditedTitle(draft.courseTitle); setEditedDescription(draft.courseDescription); setIsEditingDetails(false); }} className="flex items-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-4 py-2.5 font-['Kalam',cursive] text-lg font-bold text-gray-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200">
                    <X className="h-5 w-5" />
                    Cancel edit
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="mb-4 font-['Kalam',cursive] text-4xl font-bold text-gray-900 dark:text-gray-100">{draft.courseTitle}</h2>
                    <p className="max-w-2xl text-lg font-bold text-gray-600 dark:text-gray-300">{draft.courseDescription || `A personalized learning path for ${draft.topic}.`}</p>
                  </div>
                  <button onClick={() => setIsEditingDetails(true)} className="flex items-center gap-2 rounded-xl border-2 border-yellow-500 bg-white/80 px-4 py-2.5 font-['Kalam',cursive] text-lg font-bold text-yellow-800 shadow-[2px_2px_0px_0px_rgba(234,179,8,1)] transition-all active:translate-y-0.5 active:shadow-none dark:bg-gray-800 dark:text-yellow-300">
                    <Pencil className="h-5 w-5" />
                    Edit details
                  </button>
                </div>
                <div className="mt-5 flex flex-wrap gap-2 text-sm font-bold">
                  <span className="rounded-full border-2 border-yellow-300 bg-white/70 px-3 py-1 text-yellow-800 dark:border-yellow-700 dark:bg-gray-800 dark:text-yellow-200">{draft.courseCategory}</span>
                  <span className="rounded-full border-2 border-yellow-300 bg-white/70 px-3 py-1 text-yellow-800 dark:border-yellow-700 dark:bg-gray-800 dark:text-yellow-200">{draft.courseLevel}</span>
                </div>
              </>
            )}
          </div>

          <div className="space-y-5 pb-12">
            {draft.modules.length === 0 ? (
              <div className="rounded-2xl border-4 border-dashed border-gray-300 bg-white p-8 text-center font-bold text-gray-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300">
                This draft has no modules yet. Ask the outline editor to add your first module.
              </div>
            ) : draft.modules.map((module) => {
              const isExpanded = expandedModule === module.id;
              const moduleNumber = String(module.orderIndex + 1).padStart(2, '0');

              return (
                <div key={module.id} className="overflow-hidden rounded-2xl border-4 border-gray-300 bg-white shadow-[4px_4px_0px_0px_rgba(156,163,175,1)] transition-all hover:border-blue-400 dark:border-gray-600 dark:bg-gray-800 dark:shadow-[4px_4px_0px_0px_rgba(55,65,81,0.8)] dark:hover:border-blue-500">
                  <button type="button" onClick={() => setExpandedModule(isExpanded ? null : module.id)} className={`flex w-full items-center gap-5 p-5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${isExpanded ? 'bg-gray-50 dark:bg-gray-700/50' : ''}`} aria-expanded={isExpanded}>
                    <div className="flex h-14 w-14 flex-shrink-0 -rotate-6 transform items-center justify-center rounded-full border-2 border-blue-300 bg-blue-100 font-['Kalam',cursive] text-xl font-bold text-blue-700 shadow-[2px_2px_0px_0px_rgba(96,165,250,1)] dark:border-blue-700 dark:bg-blue-900/40 dark:text-blue-300 dark:shadow-[2px_2px_0px_0px_rgba(30,58,138,1)]">{moduleNumber}</div>
                    <div className="flex-1">
                      <h3 className="font-['Nunito',sans-serif] text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">{module.title}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400">
                        <span>{module.lessons.length} {module.lessons.length === 1 ? 'lesson' : 'lessons'}</span>
                        <span className="h-1.5 w-1.5 rounded-full bg-gray-400 dark:bg-gray-500" />
                        <span>{module.description || 'A focused set of lessons'}</span>
                      </div>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-gray-200 bg-white text-gray-600 shadow-sm transition-colors dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300">
                      <ChevronRight className={`h-6 w-6 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                  </button>

                  <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                      <div className="border-t-2 border-dashed border-gray-200 bg-white px-5 pb-6 pt-4 pl-14 dark:border-gray-700 dark:bg-gray-800">
                        {module.lessons.length === 0 ? (
                          <p className="font-bold text-gray-500 dark:text-gray-400">No lessons in this module yet. Ask the editor to add one.</p>
                        ) : (
                          <ul className="space-y-3">
                            {module.lessons.map((lesson) => (
                              <li key={lesson.id}>
                                <button type="button" onClick={() => showGuideMessage('This is an unpublished draft. Click Start Learning to create the course before opening lessons.')} className="group flex w-full items-center justify-between gap-4 rounded-xl border-2 border-transparent p-3 text-left text-lg font-bold text-gray-700 transition-colors hover:bg-gray-50 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-gray-700/50 dark:hover:text-blue-400">
                                  <span className="flex items-center gap-3 pl-2">
                                    <span className="h-2 w-2 flex-shrink-0 rounded-full bg-gray-300 transition-colors group-hover:bg-blue-400 dark:bg-gray-600" />
                                    {lesson.title}
                                  </span>
                                  <span className="rounded-md bg-blue-100 px-2 py-1 text-xs font-bold uppercase tracking-wider text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">Draft</span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className={`pointer-events-none fixed bottom-8 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 transition-all duration-300 ${toastMessage ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <div className="flex items-center gap-3 rounded-2xl border-4 border-yellow-400 bg-yellow-100 px-6 py-4 font-['Nunito',sans-serif] text-lg font-bold text-yellow-900 shadow-[4px_4px_0_rgba(234,179,8,1)] dark:border-yellow-600 dark:bg-yellow-900/80 dark:text-yellow-100">
              <Sparkles className="h-6 w-6 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
              {toastMessage}
            </div>
          </div>
        </div>
      </main>

      <aside className="relative z-20 flex h-full w-80 flex-shrink-0 flex-col border-l-2 border-dashed border-gray-300 bg-purple-50/50 p-6 shadow-[-4px_0_24px_rgba(0,0,0,0.02)] backdrop-blur-xl transition-colors duration-300 dark:border-gray-700 dark:bg-gray-800/40">
        <h2 className="mb-2 flex -rotate-1 transform items-center gap-3 font-['Kalam',cursive] text-3xl font-bold tracking-wide text-purple-600 dark:text-purple-400">
          <MessageCircle className="h-8 w-8 fill-purple-500 text-purple-500" />
          Outline Editor
        </h2>
        <p className="mb-6 text-sm font-bold text-purple-800 dark:text-purple-300">Assistant 1 edits this draft’s modules and lessons.</p>

        <div className="custom-scrollbar flex flex-1 flex-col gap-4 overflow-y-auto pb-4 pr-2" aria-live="polite">
          {chatMessages.map((message) => (
            <div key={message.id} className={message.role === 'assistant' ? 'mr-4 rounded-3xl rounded-tl-none border-4 border-gray-200 bg-white p-4 text-md font-bold text-gray-700 shadow-[4px_4px_0px_0px_rgba(229,231,235,1)] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:shadow-[4px_4px_0px_0px_rgba(55,65,81,0.8)]' : 'ml-4 self-end rounded-3xl rounded-tr-none border-4 border-pink-300 bg-pink-100 p-4 text-md font-bold text-pink-900 shadow-[4px_4px_0px_0px_rgba(244,114,182,1)] rotate-1 transform dark:border-pink-700 dark:bg-pink-900/40 dark:text-pink-100 dark:shadow-[4px_4px_0px_0px_rgba(190,24,93,0.8)]'}>
              {message.content}
            </div>
          ))}
          {isChatting && (
            <div className="mr-4 flex items-center gap-2 rounded-3xl rounded-tl-none border-4 border-gray-200 bg-white p-4 font-bold text-gray-600 shadow-[4px_4px_0px_0px_rgba(229,231,235,1)] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:shadow-[4px_4px_0px_0px_rgba(55,65,81,0.8)]">
              <LoaderCircle className="h-5 w-5 animate-spin text-purple-500" />
              Updating your outline…
            </div>
          )}
        </div>

        <form onSubmit={handleEditorChat} className="relative mt-4">
          <input
            type="text"
            value={chatInput}
            onChange={(event) => setChatInput(event.target.value)}
            disabled={isChatting || isPublishing}
            placeholder="Add, remove, or reorder…"
            className="w-full rounded-full border-4 border-purple-200 bg-white/90 py-4 pl-5 pr-14 text-lg font-bold text-gray-700 shadow-inner transition-all placeholder-gray-400 focus:border-purple-400 focus:outline-none focus:ring-4 focus:ring-purple-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-purple-800/50 dark:bg-gray-900/90 dark:text-gray-200 dark:focus:border-purple-500 dark:focus:ring-purple-900/50"
          />
          <button type="submit" disabled={!chatInput.trim() || isChatting || isPublishing} className="absolute right-2 top-1/2 flex -translate-y-1/2 transform rounded-full bg-purple-500 p-3 text-white shadow-[0_4px_0px_0px_rgba(126,34,206,1)] transition-all active:translate-y-[calc(-50%+4px)] active:shadow-none disabled:cursor-not-allowed disabled:opacity-55 hover:bg-purple-600" aria-label="Send editor request">
            {isChatting ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </form>
        <p className="mt-3 text-center text-xs font-bold text-purple-700 dark:text-purple-300">Your outline remains a draft until Start Learning.</p>
      </aside>
    </div>
  );
};

export default Roadmap;
