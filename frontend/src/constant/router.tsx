import { createBrowserRouter } from "react-router-dom"
import { listed } from "./listed"
import Landing from "../pages/Landing"
import Home from "../pages/Home"
import Course from "../pages/Course"
import Settings from "../pages/Settings"


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
        path: listed.settings,
        element: <Settings/>
    }
])

export default router
