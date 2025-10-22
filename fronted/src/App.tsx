import { BrowserRouter, Routes, Route } from "react-router-dom"
import Home from "@src/pages/Home/Home"
import DetailProject  from "@src/pages/DetailProject/DetailProject"


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DetailProject />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

