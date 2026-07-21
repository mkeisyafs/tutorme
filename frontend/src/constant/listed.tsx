import type { AppRoutes } from '../types/routes';

export const listed = {
    landing: "/",
    home: "/home",
    course: "/course",
    library: "/library",
    profile: "/profile",
    settings: "/settings",
    roadmap: "/roadmap",
    lesson: "/lesson",
    quiz: "/quiz",
    finalExam: "/final-exam",
    analysis: "/analysis"
} as const satisfies AppRoutes;
