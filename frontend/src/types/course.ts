export type CourseColor = 'blue' | 'yellow' | 'green' | 'pink' | 'purple';

export type CourseFilter = 'All' | 'In Progress' | 'Completed' | 'Not Started';

export type LessonProgressStatus = 'LOCKED' | 'IN_PROGRESS' | 'COMPLETED';

export interface CourseLesson {
  id: string;
  title: string;
  videoUrl: string | null;
  orderIndex: number;
  isGenerated: boolean;
}

export interface CourseModule {
  id: string;
  title: string;
  description: string | null;
  orderIndex: number;
  lessons: CourseLesson[];
}

export interface CourseCreator {
  id: string;
  fullName: string;
}

export interface CourseDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  color: string;
  level: string;
  creator?: CourseCreator;
  modules: CourseModule[];
}

export interface EnrollmentCourse {
  id: string;
  title: string;
  category: string;
  color: string;
  level: string;
}

export interface Enrollment {
  id: string;
  courseId: string;
  progressPercentage: number;
  isCompleted: boolean;
  course: EnrollmentCourse;
}

export interface LessonProgress {
  lessonId: string;
  status: LessonProgressStatus;
}

export interface CourseCard {
  id: string;
  title: string;
  category: string;
  level: string;
  progress: number;
  isCompleted: boolean;
  color: CourseColor;
  rotation: string;
}

export interface MyCourse {
  id: number;
  title: string;
  description: string;
  category: string;
  progress: number;
  lessons: number;
  color: CourseColor;
  rotation: string;
  creator: string;
}
