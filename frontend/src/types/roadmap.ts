export interface DraftLesson {
  id: string;
  title: string;
  orderIndex: number;
}

export interface DraftModule {
  id: string;
  title: string;
  description: string | null;
  orderIndex: number;
  lessons: DraftLesson[];
}

export interface DraftOutline {
  draftId: string;
  topic: string;
  courseTitle: string;
  courseDescription: string;
  courseCategory: string;
  courseLevel: string;
  modules: DraftModule[];
}

export type EditorMessageRole = 'assistant' | 'user';

export interface EditorMessage {
  id: string;
  role: EditorMessageRole;
  content: string;
}

export interface EditorChatResponse {
  reply: string;
  draft: DraftOutline;
}

export interface PublishResponse {
  courseId: string;
  firstLessonId: string;
}
