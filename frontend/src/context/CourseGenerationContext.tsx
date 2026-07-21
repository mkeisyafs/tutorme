import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { apiRequest } from '../lib/api';
import type { OutlineCreationResponse } from '../types/course-generation';

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
  startGeneration: (
    userId: string,
    topic: string,
    familiarity: string,
    language: string,
    referenceFile: File | null
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
  };

  const startGeneration = async (
    userId: string,
    topicName: string,
    familiarity: string,
    language: string,
    refFile: File | null
  ) => {
    setTopic(topicName);
    setReferenceFile(refFile);
    setErrorMessage('');
    setLoadingStep(0);
    setIsGenerating(true);
    setDraftId(null);

    try {
      const data = await apiRequest<OutlineCreationResponse>('/generation/outline', {
        method: "POST",
        body: {
          userId,
          topic: topicName,
          familiarity,
          language: language.trim() || 'English'
        }
      });

      if (!data.draftId) {
        throw new Error('The server did not return a draft ID.');
      }

      setLoadingStep(totalSteps);
      setDraftId(data.draftId);
    } catch (error) {
      setIsGenerating(false);
      setIsMinimized(false);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Failed to generate your course draft. Please try again.'
      );
    }
  };

  // Publishing / Preparing actions
  const startPublish = async (draftIdVal: string, courseTitleVal: string) => {
    setIsPublishing(true);
    setPublishStep(0);
    setPublishCourseTitle(courseTitleVal);
    setPublishError('');
    setIsPublishMinimized(false);
    setPublishCourseId(null);
    setPublishFirstLessonId(null);

    try {
      const result = await apiRequest<PublishResponse>(`/generation/outline/${encodeURIComponent(draftIdVal)}/publish`, {
        method: 'POST',
      });

      if (!result.courseId || !result.firstLessonId) {
        throw new Error('The server did not return a valid course ID or lesson ID.');
      }

      setPublishStep(1); // Moving to lesson generation
      
      await apiRequest(`/generation/lesson/${encodeURIComponent(result.firstLessonId)}/generate`, {
        method: 'POST',
      });

      setPublishStep(2); // Finalizing
      
      await new Promise(r => setTimeout(r, 800));

      setPublishCourseId(result.courseId);
      setPublishFirstLessonId(result.firstLessonId);
    } catch (error) {
      setIsPublishing(false);
      setIsPublishMinimized(false);
      setPublishError(
        error instanceof Error
          ? error.message
          : 'We could not publish this course. Please try again.'
      );
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
