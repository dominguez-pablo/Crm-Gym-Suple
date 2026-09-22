import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/layout/Layout'
import LayoutGym from './components/layout/LayoutGym'
import ProtectedRoute from './components/ProtectedRoute'
import Clientes from './pages/Clientes'
import Dashboard from './pages/Dashboard'
import Inventario from './pages/Inventario'
import Locales from './pages/Locales'
import Login from './pages/Login'
import PuntoDeVenta from './pages/PuntoDeVenta'
import SelectorModulos from './pages/SelectorModulos'
import DashboardGym from './pages/gym/DashboardGym'
import Ingreso from './pages/gym/Ingreso'
import Socios from './pages/gym/Socios'
import Membresias from './pages/gym/Membresias'
import Vencidas from './pages/gym/Vencidas'
import Caja from './pages/gym/Caja'
import SucursalesGym from './pages/gym/SucursalesGym'
import Empleados from './pages/gym/Empleados'

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
        <Route
          path="/infinity-academia"
          element={
            <ProtectedRoute>
              <LayoutGym />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardGym />} />
          <Route path="ingreso" element={<Ingreso />} />
          <Route path="socios" element={<Socios />} />
          <Route path="membresias" element={<Membresias />} />
          <Route path="pagos" element={<Navigate to="/infinity-academia/socios" replace />} />
          <Route path="vencidas" element={<Vencidas />} />
          <Route path="caja" element={<Caja />} />
          <Route path="sucursales" element={<SucursalesGym />} />
          <Route path="empleados" element={<Empleados />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
