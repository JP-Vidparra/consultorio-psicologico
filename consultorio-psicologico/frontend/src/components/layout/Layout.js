import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { to: '/',          icon: '📊', label: 'Dashboard',  exact: true },
  { to: '/agenda',    icon: '📅', label: 'Agenda' },
  { to: '/pacientes', icon: '👥', label: 'Pacientes' },
  { to: '/planes',    icon: '📋', label: 'Planes',     roles: ['admin','recepcion'] },
  { to: '/facturas',  icon: '💰', label: 'Facturación',roles: ['admin','recepcion'] },
  { to: '/usuarios',  icon: '⚙️', label: 'Usuarios',   roles: ['admin'] },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>Consultorio<br/>Psicológico</h1>
          <p>Sistema de gestión</p>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">Menú principal</div>
          {NAV.filter(n => !n.roles || n.roles.includes(user?.rol)).map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.exact}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon">{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-user">
          <p>{user?.nombre} {user?.apellido}</p>
          <small style={{ textTransform: 'capitalize' }}>{user?.rol}</small>
          <br />
          <button
            onClick={handleLogout}
            style={{ marginTop: 8, background: 'none', border: 'none',
                     color: '#64748b', fontSize: 12, cursor: 'pointer', padding: 0 }}
          >
            Cerrar sesión →
          </button>
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
