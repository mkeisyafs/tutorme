import type { CourseColor } from './course';

export interface DashboardCourse {
  id: string;
  title: string;
  description: string;
  category: string;
  color: CourseColor;
  progressPercentage: number;
  isCompleted: boolean;
  lastAccessedAt: string;
}

export interface DashboardData {
  fullName: string;
  streakCount: number;
  continueCourse: DashboardCourse | null;
  recentCourses: DashboardCourse[];
}
