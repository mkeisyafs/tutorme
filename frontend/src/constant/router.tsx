import { createBrowserRouter } from "react-router-dom"
import { listed } from "./listed"
import Landing from "../pages/Landing"
import Home from "../pages/Home"
import Course from "../pages/Course"
import Settings from "../pages/Settings"
import Roadmap from "../pages/Roadmap"
import Lesson from "../pages/Lesson"
import Library from "../pages/Library"

const router = createBrowserRouter([
    {
        path: listed.landing,
        element: <Landing/>
    },
    {
        path : listed.home,
        element: <Home/>
    },
    {
        path: listed.course,
        element: <Course/>
    },
    {
        path: listed.library,
        element: <Library/>
    },
    {
        path: listed.settings,
        element: <Settings/>
    },
    {
        path: listed.roadmap,
        element: <Roadmap/>
    },
    {
        path: listed.lesson,
        element: <Lesson/>
    }
])

export default router
