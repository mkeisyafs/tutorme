import type { CourseColor } from './course';

export interface LibraryCourse {
  id: string;
  title: string;
  description: string;
  category: string;
  creator: string;
  lessons: number;
  learners: number;
  color: CourseColor;
  isMine: boolean;
  isEnrolled?: boolean;
  isPublic?: boolean;
}

export interface CoursePreviewLesson {
  id: string;
  title: string;
}

export interface CoursePreviewModule {
  id: string;
  title: string;
  lessons: CoursePreviewLesson[];
}

export interface CoursePreviewDetail {
  id: string;
  title: string;
  description: string;
  modules: CoursePreviewModule[];
}
