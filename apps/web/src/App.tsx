import { RouterProvider } from "react-router-dom"
import { useAppRouter } from "@/hooks/useAppRouter"

function App() {
  const appRouter = useAppRouter()

  return <RouterProvider router={appRouter} />
}

export default App
