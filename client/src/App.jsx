import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Clientes from './pages/Clientes'
import Dashboard from './pages/Dashboard'
import Inventario from './pages/Inventario'
import Locales from './pages/Locales'
import Login from './pages/Login'
import PuntoDeVenta from './pages/PuntoDeVenta'
import SelectorModulos from './pages/SelectorModulos'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <SelectorModulos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fit-market"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="pos" element={<PuntoDeVenta />} />
          <Route path="inventario" element={<Inventario />} />
          <Route path="locales" element={<Locales />} />
          <Route path="clientes" element={<Clientes />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
