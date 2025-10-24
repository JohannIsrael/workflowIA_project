import { BrowserRouter, Routes, Route } from "react-router-dom"
import DetailProject  from "@src/pages/DetailProject/DetailProject"
import Login from "@src/pages/Login"
import Proyectos from "@src/pages/Proyectos/Proyectos"
import Dashboard from "@src/pages/Dashboard/Dashboard"
import Logs from "@src/pages/Logs/Logs"
import Profile from "@src/pages/Profile/Profile"
import Configuracion from "@src/pages/Configuracion/Configuracion"
import ConditionalLayout from "@src/components/core/layout/ConditionalLayout"

function App() {
  return (
    <BrowserRouter>
      <ConditionalLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/detalle-proyecto" element={<DetailProject />} />
          <Route path="/proyectos" element={<Proyectos />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/configuracion" element={<Configuracion />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </ConditionalLayout>
    </BrowserRouter>
  )
}

export default App

