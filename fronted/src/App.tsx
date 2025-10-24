import { BrowserRouter, Routes, Route } from "react-router-dom"
import DetailProject  from "@src/pages/DetailProject/DetailProject"
import Login from "@src/pages/Login"
import ConditionalLayout from "@src/components/core/layout/ConditionalLayout"

function App() {
  return (
    <BrowserRouter>
      <ConditionalLayout>
        <Routes>
          <Route path="/" element={<DetailProject />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </ConditionalLayout>
    </BrowserRouter>
  )
}

export default App

