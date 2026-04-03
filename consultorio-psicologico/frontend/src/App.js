import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';

import Login       from './pages/Login';
import Layout      from './components/layout/Layout';
import Dashboard   from './pages/Dashboard';
import Pacientes   from './pages/Pacientes';
import PacienteDetalle from './pages/PacienteDetalle';
import Agenda      from './pages/Agenda';
import { Planes }   from './pages/PlanesFacturasUsuarios';
import { Facturas } from './pages/PlanesFacturasUsuarios';
import { Usuarios } from './pages/PlanesFacturasUsuarios';
import Facturacion from './pages/Facturacion';

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner" />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.rol)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="pacientes" element={<Pacientes />} />
            <Route path="pacientes/:id" element={<PacienteDetalle />} />
            <Route path="agenda" element={<Agenda />} />
            <Route path="planes" element={<PrivateRoute roles={['admin','recepcion']}><Planes /></PrivateRoute>} />
            <Route path="facturas" element={<PrivateRoute roles={['admin','recepcion']}><Facturas /></PrivateRoute>} />
            <Route path="usuarios" element={<PrivateRoute roles={['admin']}><Usuarios /></PrivateRoute>} />
            <Route path="facturacion" element={<PrivateRoute roles={['admin','facturacion']}><Facturacion /></PrivateRoute>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
