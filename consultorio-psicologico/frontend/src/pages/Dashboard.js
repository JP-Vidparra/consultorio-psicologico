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
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" />;

  const { stats, citas_hoy, proximas } = data;

  const estadoBadge = (e) => {
    const map = { programada: 'badge-blue', completada: 'badge-green', cancelada: 'badge-gray', no_asistio: 'badge-red' };
    const labels = { programada: 'Programada', completada: 'Completada', cancelada: 'Cancelada', no_asistio: 'No asistió' };
    return <span className={`badge ${map[e] || 'badge-gray'}`}>{labels[e] || e}</span>;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Buen día, {user?.nombre} 👋</h1>
          <p className="page-sub">{new Date().toLocaleDateString('es-CO', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/agenda')}>
          + Nueva cita
        </button>
      </div>

      <div className="stats-grid">
        {[
          { icon: '👥', label: 'Pacientes activos',   value: stats.pacientes_total },
          { icon: '📅', label: 'Citas hoy',            value: stats.citas_hoy },
          { icon: '✅', label: 'Sesiones este mes',    value: stats.citas_mes },
          { icon: '📋', label: 'Contratos activos',    value: stats.contratos_activos },
          { icon: '💰', label: 'Ingresos del mes',     value: fmtCOP(stats.ingresos_mes) },
          { icon: '🧾', label: 'Facturas pendientes',  value: stats.facturas_pendientes },
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
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/agenda')}>Ver agenda</button>
          </div>
          {citas_hoy.length === 0
            ? <div className="empty"><div className="empty-icon">📭</div><p>Sin citas para hoy</p></div>
            : citas_hoy.map(c => (
                <div key={c.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                     padding:'10px 0', borderBottom:'1px solid #f1f5f9' }}>
                  <div>
                    <p style={{ fontWeight:500, fontSize:14 }}>{c.paciente_nombre}</p>
                    <p style={{ fontSize:12, color:'#64748b' }}>{fmtHora(c.hora_inicio)} — {c.profesional_nombre}</p>
                  </div>
                  {estadoBadge(c.estado)}
                </div>
              ))
          }
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">🔜 Próximas citas</span>
          </div>
          {proximas.length === 0
            ? <div className="empty"><div className="empty-icon">📭</div><p>Sin próximas citas</p></div>
            : proximas.map(c => (
                <div key={c.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                     padding:'10px 0', borderBottom:'1px solid #f1f5f9' }}>
                  <div>
                    <p style={{ fontWeight:500, fontSize:14 }}>{c.paciente_nombre}</p>
                    <p style={{ fontSize:12, color:'#64748b' }}>
                      {new Date(c.fecha + 'T00:00').toLocaleDateString('es-CO', { weekday:'short', month:'short', day:'numeric' })}
                      {' '}{fmtHora(c.hora_inicio)} — {c.profesional_nombre}
                    </p>
                  </div>
                  {estadoBadge(c.estado)}
                </div>
              ))
          }
        </div>
      </div>
    </div>
  );
}
