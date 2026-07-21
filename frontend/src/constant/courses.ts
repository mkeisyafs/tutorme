import type { MyCourse } from '../types/course';

// This is the user's course collection. Other features can import this same
// source so a course selected for sharing is always one shown on My Courses.
export const myCourses: MyCourse[] = [
  { id: 1, title: 'React Hooks Deep Dive', description: 'Master useEffect, custom hooks, and component lifecycle with practical examples.', category: 'Web Development', progress: 45, lessons: 16, color: 'blue', rotation: 'rotate-1', creator: 'Jordan Lee' },
  { id: 2, title: 'Intro to UI/UX Design', description: 'Learn the foundations of user-centred design, wireframes, and polished interfaces.', category: 'Design', progress: 80, lessons: 12, color: 'yellow', rotation: '-rotate-2', creator: 'Andi Pratama' },
  { id: 3, title: 'Advanced TypeScript', description: 'Build confidence with types, generics, utility types, and scalable application patterns.', category: 'Programming', progress: 15, lessons: 14, color: 'green', rotation: 'rotate-2', creator: 'Maya Chen' },
  { id: 4, title: 'Machine Learning Basics', description: 'A gentle introduction to machine learning concepts, models, and real-world applications.', category: 'Data Science', progress: 0, lessons: 10, color: 'pink', rotation: '-rotate-1', creator: 'Sofia Ramirez' },
  { id: 5, title: 'Spanish for Beginners', description: 'Build everyday vocabulary and confidence for your first Spanish conversations.', category: 'Language', progress: 100, lessons: 20, color: 'purple', rotation: 'rotate-1', creator: 'Nina Patel' },
];
