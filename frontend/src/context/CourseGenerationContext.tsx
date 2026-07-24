import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { apiRequest } from '../lib/api';
import router from '../constant/router';
import type { OutlineCreationResponse } from '../types/course-generation';

export const saveDraftToLocalStorage = (id: string, title: string, topic: string) => {
  try {
    const savedDraftsRaw = localStorage.getItem('tutorme_drafts') ?? '[]';
    let savedDrafts = JSON.parse(savedDraftsRaw);
    if (!Array.isArray(savedDrafts)) {
      savedDrafts = [];
    }
    
    // Check if draft already exists
    const existingIndex = savedDrafts.findIndex((d: any) => d.id === id);
    if (existingIndex > -1) {
      // Update existing draft's title
      savedDrafts[existingIndex].title = title || savedDrafts[existingIndex].title;
      savedDrafts[existingIndex].topic = topic || savedDrafts[existingIndex].topic;
    } else {
      savedDrafts.unshift({
        id,
        title: title || topic,
        topic,
        createdAt: new Date().toISOString()
      });
    }

    localStorage.setItem('tutorme_drafts', JSON.stringify(savedDrafts));
  } catch (e) {
    console.error('Failed to save draft to localStorage', e);
  }
};

export const removeDraftFromLocalStorage = (id: string) => {
  try {
    const savedDraftsRaw = localStorage.getItem('tutorme_drafts') ?? '[]';
    const savedDrafts = JSON.parse(savedDraftsRaw);
    if (!Array.isArray(savedDrafts)) return;

    const updated = savedDrafts.filter((d: any) => d.id !== id);
    localStorage.setItem('tutorme_drafts', JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to remove draft from localStorage', e);
  }
};

interface PublishResponse {
  courseId: string;
  firstLessonId: string;
}

interface CourseGenerationContextType {
  // Course Generation States
  isOpen: boolean;
  isGenerating: boolean;
  loadingStep: number;
  totalSteps: number;
  topic: string;
  isMinimized: boolean;
  errorMessage: string;
  draftId: string | null;
  initialTopic: string;
  referenceFile: File | null;
  openModal: (topic?: string, file?: File | null) => void;
  closeModal: () => void;
  minimize: () => void;
  maximize: () => void;
  reset: () => void;
  cancelGeneration: () => void;
  startGeneration: (
    userId: string,
    topic: string,
    familiarity: string,
    language: string,
    referenceFile: File | null,
    quizSettings?: {
      enableEssayQuestions: boolean;
      requireImageSubmission: boolean;
      quizLength: string;
    }
  ) => Promise<void>;

  // Course Publishing / Preparing States
  isPublishing: boolean;
  publishStep: number;
  publishCourseTitle: string;
  isPublishMinimized: boolean;
  publishError: string;
  publishCourseId: string | null;
  publishFirstLessonId: string | null;
  startPublish: (draftId: string, courseTitle: string) => Promise<void>;
  minimizePublish: () => void;
  maximizePublish: () => void;
  resetPublish: () => void;
  cancelPublish: () => void;
}

const CourseGenerationContext = createContext<CourseGenerationContextType | undefined>(undefined);

export const CourseGenerationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Course Generation state
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [topic, setTopic] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [draftId, setDraftId] = useState<string | null>(null);
  const [initialTopic, setInitialTopic] = useState('');
  const [referenceFile, setReferenceFile] = useState<File | null>(null);

  // Course Publishing state
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishStep, setPublishStep] = useState(0);
  const [publishCourseTitle, setPublishCourseTitle] = useState('');
  const [isPublishMinimized, setIsPublishMinimized] = useState(false);
  const [publishError, setPublishError] = useState('');
  const [publishCourseId, setPublishCourseId] = useState<string | null>(null);
  const [publishFirstLessonId, setPublishFirstLessonId] = useState<string | null>(null);

  const totalSteps = referenceFile ? 6 : 5;
  const timerRef = useRef<number | null>(null);
  const generationAbortRef = useRef<AbortController | null>(null);
  const publishAbortRef = useRef<AbortController | null>(null);
  const publishedCourseDetailsRef = useRef<{ courseId: string; firstLessonId: string } | null>(null);
  const publishedDraftIdRef = useRef<string | null>(null);

  // Manage progress timer for generation
  useEffect(() => {
    if (!isGenerating || loadingStep >= totalSteps - 1) return;

    timerRef.current = window.setTimeout(() => {
      setLoadingStep((step) => step + 1);
    }, 900);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [isGenerating, loadingStep, totalSteps]);

  // Generation actions
  const openModal = (topicDefault = '', file: File | null = null) => {
    if (isGenerating) {
      setIsMinimized(false);
      setIsOpen(true);
      return;
    }
    setInitialTopic(topicDefault);
    setReferenceFile(file);
    setIsOpen(true);
    setIsMinimized(false);
    setErrorMessage('');
    setDraftId(null);
  };

  const closeModal = () => {
    if (isGenerating) {
      setIsMinimized(true);
    } else {
      setIsOpen(false);
      setReferenceFile(null);
    }
  };

  const minimize = () => {
    setIsMinimized(true);
  };

  const maximize = () => {
    setIsMinimized(false);
    setIsOpen(true);
  };

  const reset = () => {
    setIsOpen(false);
    setIsGenerating(false);
    setLoadingStep(0);
    setTopic('');
    setIsMinimized(false);
    setErrorMessage('');
    setDraftId(null);
    setInitialTopic('');
    setReferenceFile(null);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    if (generationAbortRef.current) {
      generationAbortRef.current.abort();
      generationAbortRef.current = null;
    }
  };

  const cancelGeneration = () => {
    if (generationAbortRef.current) {
      generationAbortRef.current.abort();
      generationAbortRef.current = null;
    }
    setIsGenerating(false);
    setLoadingStep(0);
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const startGeneration = async (
    userId: string,
    topicName: string,
    familiarity: string,
    language: string,
    refFile: File | null,
    quizSettings?: {
      enableEssayQuestions: boolean;
      requireImageSubmission: boolean;
      quizLength: string;
    }
  ) => {
    if (isGenerating || isPublishing) {
      setErrorMessage('Another generation or publishing process is already active. Please wait or cancel it first.');
      return;
    }

    setTopic(topicName);
    setReferenceFile(refFile);
    setErrorMessage('');
    setLoadingStep(0);
    setIsGenerating(true);
    setDraftId(null);

    if (generationAbortRef.current) {
      generationAbortRef.current.abort();
    }
    const controller = new AbortController();
    generationAbortRef.current = controller;

    try {
      const data = await apiRequest<OutlineCreationResponse>('/generation/outline', {
        method: "POST",
        body: {
          userId,
          topic: topicName,
          familiarity,
          language: language.trim() || 'English',
          enableEssayQuestions: quizSettings?.enableEssayQuestions ?? true,
          requireImageSubmission: quizSettings?.requireImageSubmission ?? false,
          quizLength: quizSettings?.quizLength ?? 'Random',
        },
        signal: controller.signal
      });

      if (!data.draftId) {
        throw new Error('The server did not return a draft ID.');
      }

      setLoadingStep(totalSteps);
      setDraftId(data.draftId);
      saveDraftToLocalStorage(data.draftId, topicName, topicName);
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }
      setIsGenerating(false);
      setIsMinimized(false);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Failed to generate your course draft. Please try again.'
      );
    } finally {
      if (generationAbortRef.current === controller) {
        generationAbortRef.current = null;
      }
    }
  };

  // Publishing / Preparing actions
  const startPublish = async (draftIdVal: string, courseTitleVal: string) => {
    if (isGenerating || isPublishing) {
      setPublishError('Another generation or publishing process is already active. Please wait or cancel it first.');
      return;
    }

    setIsPublishing(true);
    setPublishStep(0);
    setPublishCourseTitle(courseTitleVal);
    setPublishError('');
    setIsPublishMinimized(false);
    setPublishCourseId(null);
    setPublishFirstLessonId(null);
    publishedCourseDetailsRef.current = null;
    publishedDraftIdRef.current = draftIdVal;

    if (publishAbortRef.current) {
      publishAbortRef.current.abort();
    }
    const controller = new AbortController();
    publishAbortRef.current = controller;

    try {
      const result = await apiRequest<PublishResponse>(`/generation/outline/${encodeURIComponent(draftIdVal)}/publish`, {
        method: 'POST',
        signal: controller.signal
      });

      if (!result.courseId || !result.firstLessonId) {
        throw new Error('The server did not return a valid course ID or lesson ID.');
      }

      publishedCourseDetailsRef.current = { courseId: result.courseId, firstLessonId: result.firstLessonId };
      setPublishStep(1); // Moving to lesson generation
      
      await apiRequest(`/generation/lesson/${encodeURIComponent(result.firstLessonId)}/generate`, {
        method: 'POST',
        signal: controller.signal
      });

      setPublishStep(2); // Finalizing
      
      if (controller.signal.aborted) return;
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(resolve, 800);
        controller.signal.addEventListener('abort', () => {
          clearTimeout(timeout);
          reject(new DOMException('Aborted', 'AbortError'));
        });
      });

      setPublishCourseId(result.courseId);
      setPublishFirstLessonId(result.firstLessonId);
      removeDraftFromLocalStorage(draftIdVal);
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }
      setIsPublishing(false);
      setIsPublishMinimized(false);
      setPublishError(
        error instanceof Error
          ? error.message
          : 'We could not publish this course. Please try again.'
      );
    } finally {
      if (publishAbortRef.current === controller) {
        publishAbortRef.current = null;
      }
    }
  };

  const cancelPublish = () => {
    if (publishAbortRef.current) {
      publishAbortRef.current.abort();
      publishAbortRef.current = null;
    }

    const currentCourseDetails = publishedCourseDetailsRef.current;
    const currentDraftId = publishedDraftIdRef.current;

    setIsPublishing(false);
    setPublishStep(0);
    setPublishCourseTitle('');
    setIsPublishMinimized(false);
    setPublishError('');
    setPublishCourseId(null);
    setPublishFirstLessonId(null);
    publishedCourseDetailsRef.current = null;
    publishedDraftIdRef.current = null;

    if (currentCourseDetails) {
      if (currentDraftId) {
        removeDraftFromLocalStorage(currentDraftId);
      }
      router.navigate(`/courses/${encodeURIComponent(currentCourseDetails.courseId)}/lessons/${encodeURIComponent(currentCourseDetails.firstLessonId)}`);
    }
  };

  const minimizePublish = () => {
    setIsPublishMinimized(true);
  };

  const maximizePublish = () => {
    setIsPublishMinimized(false);
  };

  const resetPublish = () => {
    setIsPublishing(false);
    setPublishStep(0);
    setPublishCourseTitle('');
    setIsPublishMinimized(false);
    setPublishError('');
    setPublishCourseId(null);
    setPublishFirstLessonId(null);
    if (publishAbortRef.current) {
      publishAbortRef.current.abort();
      publishAbortRef.current = null;
    }
  };

  return (
    <CourseGenerationContext.Provider
      value={{
        isOpen,
        isGenerating,
        loadingStep,
        totalSteps,
        topic,
        isMinimized,
        errorMessage,
        draftId,
        initialTopic,
        referenceFile,
        openModal,
        closeModal,
        minimize,
        maximize,
        reset,
        startGeneration,
        cancelGeneration,

        // Publishing
        isPublishing,
        publishStep,
        publishCourseTitle,
        isPublishMinimized,
        publishError,
        publishCourseId,
        publishFirstLessonId,
        startPublish,
        minimizePublish,
        maximizePublish,
        resetPublish,
        cancelPublish,
      }}
    >
      {children}
    </CourseGenerationContext.Provider>
  );
};

export const useCourseGeneration = () => {
  const context = useContext(CourseGenerationContext);
  if (context === undefined) {
    throw new Error('useCourseGeneration must be used within a CourseGenerationProvider');
  }
  return context;
};
