import { RouterProvider } from 'react-router-dom'
import router from './constant/router'
import { CourseGenerationProvider } from './context/CourseGenerationContext'

function App() {
  return (
    <CourseGenerationProvider>
      <RouterProvider router={router} />
    </CourseGenerationProvider>
  )
}

export default App
