import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './suplementos/components/Layout'
import LayoutInfinity from './infinity/components/Layout'
import ProtectedRoute from './compartido/components/ProtectedRoute'
import Clientes from './suplementos/pages/Clientes'
import Dashboard from './suplementos/pages/Dashboard'
import Inventario from './suplementos/pages/Inventario'
import Locales from './suplementos/pages/Locales'
import Login from './compartido/pages/Login'
import PuntoDeVenta from './suplementos/pages/PuntoDeVenta'
import SelectorModulos from './compartido/pages/SelectorModulos'
import DashboardInfinity from './infinity/pages/Dashboard'
import Ingreso from './infinity/pages/Ingreso'
import Socios from './infinity/pages/Socios'
import Membresias from './infinity/pages/Membresias'
import Vencidas from './infinity/pages/Vencidas'
import Caja from './infinity/pages/Caja'
import SucursalesInfinity from './infinity/pages/Sucursales'
import Empleados from './infinity/pages/Empleados'

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
              <LayoutInfinity />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardInfinity />} />
          <Route path="ingreso" element={<Ingreso />} />
          <Route path="socios" element={<Socios />} />
          <Route path="membresias" element={<Membresias />} />
          <Route path="pagos" element={<Navigate to="/infinity-academia/socios" replace />} />
          <Route path="vencidas" element={<Vencidas />} />
          <Route path="caja" element={<Caja />} />
          <Route path="sucursales" element={<SucursalesInfinity />} />
          <Route path="empleados" element={<Empleados />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
