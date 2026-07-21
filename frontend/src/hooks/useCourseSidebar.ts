import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../lib/api';
import type { CourseDetail, CourseModule, LessonProgress } from '../types/course';
import { useAuth } from '../auth/useAuth';

export async function fetchAllLessonProgress(userId: string): Promise<LessonProgress[]> {
  try {
    const res = await apiRequest<{ data: LessonProgress[] }>(`/lesson-progress?userId=${encodeURIComponent(userId)}&take=100`);
    return res.data || [];
  } catch (error) {
    console.error('Failed to fetch lesson progress:', error);
    return [];
  }
}

export function useCourseSidebar(courseId?: string) {
  const { user } = useAuth();
  const [courseModules, setCourseModules] = useState<(CourseModule & { courseTitle?: string })[]>([]);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());

  const loadProgress = useCallback(async () => {
    if (!user?.id) {
      setCompletedLessonIds(new Set());
      return;
    }
    const allProgress = await fetchAllLessonProgress(user.id);
    const completed = new Set(
      allProgress
        .filter((p) => p.status === 'COMPLETED' && p.lessonId)
        .map((p) => p.lessonId as string)
    );
    setCompletedLessonIds(completed);
  }, [user?.id]);

  useEffect(() => {
    if (!courseId) return;
    apiRequest<CourseDetail>('/courses/' + encodeURIComponent(courseId))
      .then((course) => {
        const sorted = [...course.modules].sort((a, b) => a.orderIndex - b.orderIndex).map((m) => ({
          ...m,
          lessons: [...m.lessons].sort((a, b) => a.orderIndex - b.orderIndex),
        }));
        // We attach courseTitle to the first module for the sidebar header
        if (sorted.length > 0) {
          (sorted[0] as any).courseTitle = course.title;
        }
        setCourseModules(sorted);
      })
      .catch(() => undefined);
  }, [courseId]);

  useEffect(() => {
    void loadProgress();
  }, [loadProgress]);

  const orderedLessons = courseModules.flatMap((m) => m.lessons);
  const totalLessons = orderedLessons.length;
  const completedCount = orderedLessons.filter((l) => completedLessonIds.has(l.id)).length;
  const progressPercent = totalLessons === 0 ? 0 : Math.round((completedCount / totalLessons) * 100);

  return {
    courseModules,
    completedLessonIds,
    setCompletedLessonIds,
    orderedLessons,
    progressPercent,
    allDone: totalLessons > 0 && completedCount === totalLessons,
    refreshProgress: loadProgress,
  };
}
