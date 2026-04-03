import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

function fmtCOP(n) {
  return '$' + Number(n).toLocaleString('es-CO');
}

function fmtHora(h) {
  if (!h) return '';
  const [hh, mm] = h.split(':');
  const hr = parseInt(hh);
  return `${hr > 12 ? hr - 12 : hr}:${mm} ${hr >= 12 ? 'pm' : 'am'}`;
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('/dashboard');
        
        if (response.data) {
          setData(response.data);
        } else {
          setError('No se recibieron datos del servidor');
        }
      } catch (err) {
        console.error('Error cargando dashboard:', err);
        setError(err.response?.data?.error || 'Error al cargar el dashboard');
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <p className="font-semibold">❌ Error al cargar el dashboard</p>
          <p className="text-sm mt-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-lg">
          <p className="font-semibold">⚠️ Sin datos disponibles</p>
          <p className="text-sm mt-2">No se pudieron cargar los datos del dashboard</p>
        </div>
      </div>
    );
  }

  // Destructuring seguro con valores por defecto
  const {
    stats = {},
    citas_hoy = [],
    proximas = []
  } = data;

  // Valores por defecto para stats
  const statsSeguro = {
    pacientes_total: stats.pacientes_total || 0,
    citas_hoy: stats.citas_hoy || 0,
    citas_mes: stats.citas_mes || 0,
    contratos_activos: stats.contratos_activos || 0,
    ingresos_mes: stats.ingresos_mes || 0,
    facturas_pendientes: stats.facturas_pendientes || 0
  };

  const estadoBadge = (e) => {
    const map = {
      programada: 'badge-blue',
      completada: 'badge-green',
      cancelada: 'badge-gray',
      no_asistio: 'badge-red'
    };
    const labels = {
      programada: 'Programada',
      completada: 'Completada',
      cancelada: 'Cancelada',
      no_asistio: 'No asistió'
    };
    return <span className={`badge ${map[e] || 'badge-gray'}`}>{labels[e] || e}</span>;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Buen día, {user?.nombre} 👋</h1>
          <p className="page-sub">
            {new Date().toLocaleDateString('es-CO', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/agenda')}>
          + Nueva cita
        </button>
      </div>

      <div className="stats-grid">
        {[
          { icon: '👥', label: 'Pacientes activos', value: statsSeguro.pacientes_total },
          { icon: '📅', label: 'Citas hoy', value: statsSeguro.citas_hoy },
          { icon: '✅', label: 'Sesiones este mes', value: statsSeguro.citas_mes },
          { icon: '📋', label: 'Contratos activos', value: statsSeguro.contratos_activos },
          { icon: '💰', label: 'Ingresos del mes', value: fmtCOP(statsSeguro.ingresos_mes) },
          { icon: '🧾', label: 'Facturas pendientes', value: statsSeguro.facturas_pendientes }
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">📅 Citas de hoy</span>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => navigate('/agenda')}
            >
              Ver agenda
            </button>
          </div>
          {citas_hoy.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">📭</div>
              <p>Sin citas para hoy</p>
            </div>
          ) : (
            citas_hoy.map(c => (
              <div
                key={c.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: '1px solid #f1f5f9'
                }}
              >
                <div>
                  <p style={{ fontWeight: 500, fontSize: 14 }}>
                    {c.paciente_nombre || 'Sin nombre'}
                  </p>
                  <p style={{ fontSize: 12, color: '#64748b' }}>
                    {fmtHora(c.hora_inicio)} — {c.profesional_nombre || 'Sin asignar'}
                  </p>
                </div>
                {estadoBadge(c.estado)}
              </div>
            ))
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">🔜 Próximas citas</span>
          </div>
          {proximas.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">📭</div>
              <p>Sin próximas citas</p>
            </div>
          ) : (
            proximas.map(c => (
              <div
                key={c.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: '1px solid #f1f5f9'
                }}
              >
                <div>
                  <p style={{ fontWeight: 500, fontSize: 14 }}>
                    {c.paciente_nombre || 'Sin nombre'}
                  </p>
                  <p style={{ fontSize: 12, color: '#64748b' }}>
                    {new Date(c.fecha + 'T00:00').toLocaleDateString('es-CO', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}{' '}
                    {fmtHora(c.hora_inicio)} — {c.profesional_nombre || 'Sin asignar'}
                  </p>
                </div>
                {estadoBadge(c.estado)}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
