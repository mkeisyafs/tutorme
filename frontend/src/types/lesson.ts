export interface LessonRecord {
  id: string;
  title: string;
  content: string | null;
  videoUrl: string | null;
  module?: {
    id: string;
    title: string;
    courseId: string;
  };
}

export interface LessonGenerationStatus {
  state: 'ready' | 'generating' | 'not_started';
  isGenerated: boolean;
  isGenerating: boolean;
  contentLength: number;
}

export interface QuizGenerationStatus {
  state: 'blocked' | 'not_started' | 'queued' | 'generating' | 'failed' | 'ready';
  isGenerated: boolean;
  isGenerating: boolean;
  quizId?: string;
  reason?: string;
}

export type TutorRole = 'assistant' | 'user';

export interface TutorMessage {
  id: string;
  role: TutorRole;
  content: string;
}

export interface TutorResponse {
  reply?: string;
}
