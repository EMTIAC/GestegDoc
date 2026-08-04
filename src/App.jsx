import { BrowserRouter, Routes, Route } from 'react-router'
import AuthProvider from './context/AuthProvider'
import Home from './pages/Home'
import Editor from './pages/Editor'
import PrintView from './pages/PrintView'
import Documentation from './pages/Documentation'
import Login from './pages/Login'
import './App.css'
import './print.css'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/edit/:id" element={<Editor />} />
          <Route path="/print" element={<PrintView />} />
          <Route path="/aide" element={<Documentation />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
