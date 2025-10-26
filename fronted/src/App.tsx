import { BrowserRouter, Routes, Route } from "react-router-dom"
import DetailProject  from "@src/pages/DetailProject/DetailProject"
import Login from "@src/pages/Login"
import Proyectos from "@src/pages/Proyectos/Proyectos"
import Dashboard from "@src/pages/Dashboard/Dashboard"
import Logs from "@src/pages/Logs/Logs"
import Profile from "@src/pages/Profile/Profile"
import Configuracion from "@src/pages/Configuracion/Configuracion"
import ConditionalLayout from "@src/components/core/layout/ConditionalLayout"
import ProtectedRoute from "@src/components/ProtectedRoute"

function App() {
  return (
    <BrowserRouter>
      <ConditionalLayout>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/detalle-proyecto/:projectId" element={
            <ProtectedRoute>
              <DetailProject />
            </ProtectedRoute>
          } />
          <Route path="/proyectos" element={
            <ProtectedRoute>
              <Proyectos />
            </ProtectedRoute>
          } />
          <Route path="/logs" element={
            <ProtectedRoute>
              <Logs />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/configuracion" element={
            <ProtectedRoute>
              <Configuracion />
            </ProtectedRoute>
          } />
        </Routes>
      </ConditionalLayout>
    </BrowserRouter>
  )
}

export default App

