import { createBrowserRouter, Outlet } from "react-router-dom"
import type { ReactNode } from "react"
import { listed } from "./listed"
import { ProtectedRoute } from "../auth/ProtectedRoute"
import RouteErrorBoundary from "../components/RouteErrorBoundary"
import GenerateCourseModal from "../components/GenerateCourseModal"
import Landing from "../pages/Landing"
import Home from "../pages/Home"
import Course from "../pages/Course"
import Settings from "../pages/Settings"
import Roadmap from "../pages/Roadmap"
import Lesson from "../pages/Lesson"
import Library from "../pages/Library"
import Profile from "../pages/Profile"
import Quiz from "../pages/Quiz"
import FinalExam from "../pages/FinalExam"
import CourseAnalysis from "../pages/CourseAnalysis"

const protectedPage = (page: ReactNode) => <ProtectedRoute>{page}</ProtectedRoute>

const RootLayout = () => (
    <>
        <Outlet />
        <GenerateCourseModal />
    </>
)

const routes = [
    {
        path: "/",
        element: <RootLayout />,
        errorElement: <RouteErrorBoundary />,
        children: [
            {
                path: listed.landing,
                element: <Landing/>
            },
            {
                path : listed.home,
                element: protectedPage(<Home/>)
            },
            {
                path: listed.course,
                element: protectedPage(<Course/>)
            },
            {
                path: "/courses",
                element: protectedPage(<Course/>)
            },
            {
                path: "/courses/:courseId",
                element: protectedPage(<Course/>)
            },
            {
                path: listed.library,
                element: protectedPage(<Library/>)
            },
            {
                path: listed.profile,
                element: protectedPage(<Profile/>)
            },
            {
                path: listed.settings,
                element: protectedPage(<Settings/>)
            },
            {
                path: listed.roadmap,
                element: protectedPage(<Roadmap/>)
            },
            {
                path: "/drafts/:draftId",
                element: protectedPage(<Roadmap/>)
            },
            {
                path: listed.lesson,
                element: protectedPage(<Lesson/>)
            },
            {
                path: "/courses/:courseId/lessons/:lessonId",
                element: protectedPage(<Lesson/>)
            },
            {
                path: listed.quiz,
                element: protectedPage(<Quiz/>)
            },
            {
                path: "/courses/:courseId/quizzes/:quizId",
                element: protectedPage(<Quiz/>)
            },
            {
                path: "/quizzes/:quizId",
                element: protectedPage(<Quiz/>)
            },
            {
                path: listed.finalExam,
                element: protectedPage(<FinalExam/>)
            },
            {
                path: "/courses/:courseId/final-exam",
                element: protectedPage(<FinalExam/>)
            },
            {
                path: listed.analysis,
                element: protectedPage(<CourseAnalysis/>)
            },
            {
                path: "/submissions/:submissionId",
                element: protectedPage(<CourseAnalysis/>)
            },
            {
                path: "*",
                element: null,
                loader: () => { throw new Response("Not Found", { status: 404 }) }
            }
        ].map((route) => ({
            ...route,
            errorElement: <RouteErrorBoundary />,
        }))
    }
]

const router = createBrowserRouter(routes)

export default router
