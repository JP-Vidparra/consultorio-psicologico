import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

function fmtCOP(n) { return '$' + Number(n).toLocaleString('es-CO'); }
function fmtFecha(f) {
  if (!f) return '—';
  return new Date(f + 'T00:00').toLocaleDateString('es-CO', { day:'numeric', month:'long', year:'numeric' });
}

function ModalContrato({ pacienteId, profesionales, onClose, onSaved }) {
  const [planes, setPlanes] = useState([]);
  const [form, setForm] = useState({ plan_id:'', profesional_id:'', precio_pagado:'', notas:'' });
  const [planSel, setPlanSel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { api.get('/planes').then(r => setPlanes(r.data)); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const selPlan = (id) => {
    const p = planes.find(pl => pl.id === parseInt(id));
    setPlanSel(p);
    set('plan_id', id);
    if (p) set('precio_pagado', p.precio);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await api.post('/contratos', { ...form, paciente_id: pacienteId });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Asignar plan / paquete</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-group">
              <label className="form-label">Plan *</label>
              <select className="form-control" value={form.plan_id} onChange={e => selPlan(e.target.value)} required>
                <option value="">Seleccionar plan...</option>
                {planes.map(p => <option key={p.id} value={p.id}>{p.nombre} — {p.num_sesiones} sesiones — {fmtCOP(p.precio)}</option>)}
              </select>
            </div>
            {planSel && (
              <div className="alert alert-info" style={{ fontSize:13 }}>
                {planSel.num_sesiones} sesiones · Vigencia {planSel.vigencia_dias} días · {planSel.descripcion || ''}
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Profesional asignado</label>
              <select className="form-control" value={form.profesional_id} onChange={e => set('profesional_id', e.target.value)}>
                <option value="">Sin asignar</option>
                {profesionales.map(u => <option key={u.id} value={u.id}>{u.nombre} {u.apellido}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Precio cobrado (COP) *</label>
              <input className="form-control" type="number" value={form.precio_pagado}
                     onChange={e => set('precio_pagado', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Notas</label>
              <textarea className="form-control" value={form.notas} onChange={e => set('notas', e.target.value)} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar y generar factura'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ModalNota({ pacienteId, citas, onClose, onSaved }) {
  const [form, setForm] = useState({ cita_id:'', contenido:'', privada: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await api.post('/notas', { ...form, paciente_id: pacienteId });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Nueva nota clínica</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-group">
              <label className="form-label">Cita relacionada (opcional)</label>
              <select className="form-control" value={form.cita_id} onChange={e => set('cita_id', e.target.value)}>
                <option value="">Sin cita específica</option>
                {citas.slice(0,20).map(c => (
                  <option key={c.id} value={c.id}>{c.fecha} {c.hora_inicio} — {c.estado}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Contenido *</label>
              <textarea className="form-control" style={{ minHeight:150 }}
                value={form.contenido} onChange={e => set('contenido', e.target.value)} required />
            </div>
            <div className="form-group">
              <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:14 }}>
                <input type="checkbox" checked={form.privada} onChange={e => set('privada', e.target.checked)} />
                Nota privada (solo visible para mí)
              </label>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar nota'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PacienteDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [notas, setNotas] = useState([]);
  const [profesionales, setProfesionales] = useState([]);
  const [tab, setTab] = useState('info');
  const [loading, setLoading] = useState(true);
  const [modalContrato, setModalContrato] = useState(false);
  const [modalNota, setModalNota] = useState(false);

  const cargar = () => {
    setLoading(true);
    Promise.all([
      api.get(`/pacientes/${id}`),
      api.get('/notas', { params: { paciente_id: id } }),
      api.get('/usuarios'),
    ]).then(([pRes, nRes, uRes]) => {
      setData(pRes.data);
      setNotas(nRes.data);
      setProfesionales(uRes.data.filter(u => u.rol !== 'recepcion'));
    }).finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, [id]);

  if (loading) return <div className="spinner" />;
  if (!data) return <p>Paciente no encontrado</p>;

  const estadoBadge = (e) => {
    const map = { activo:'badge-green', completado:'badge-blue', vencido:'badge-red', cancelado:'badge-gray' };
    return <span className={`badge ${map[e] || 'badge-gray'}`}>{e}</span>;
  };

  const citaBadge = (e) => {
    const map = { programada:'badge-blue', completada:'badge-green', cancelada:'badge-gray', no_asistio:'badge-red' };
    const labels = { programada:'Programada', completada:'Completada', cancelada:'Cancelada', no_asistio:'No asistió' };
    return <span className={`badge ${map[e] || 'badge-gray'}`}>{labels[e] || e}</span>;
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/pacientes')}>← Volver</button>
          <div style={{ width:46, height:46, borderRadius:'50%', background:'#ede9fe',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontWeight:700, fontSize:16, color:'#5b21b6' }}>
            {data.nombre[0]}{data.apellido[0]}
          </div>
          <div>
            <h1 className="page-title">{data.nombre} {data.apellido}</h1>
            <p className="page-sub">{data.documento || 'Sin documento'} · {data.telefono || 'Sin teléfono'}</p>
          </div>
        </div>
      </div>

      <div className="tabs">
        {[['info','📋 Información'],['contratos','📦 Planes'],['citas','📅 Citas'],['notas','📝 Notas']].map(([k,l]) => (
          <button key={k} className={`tab${tab===k?' active':''}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === 'info' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Datos del paciente</span>
          </div>
          <div className="grid-2">
            {[
              ['Nombre completo', `${data.nombre} ${data.apellido}`],
              ['Documento', data.documento || '—'],
              ['Fecha nacimiento', fmtFecha(data.fecha_nac)],
              ['Teléfono', data.telefono || '—'],
              ['Email', data.email || '—'],
              ['Dirección', data.direccion || '—'],
            ].map(([l,v]) => (
              <div key={l} style={{ marginBottom:14 }}>
                <p style={{ fontSize:12, color:'#64748b', fontWeight:500 }}>{l}</p>
                <p style={{ fontSize:14, color:'#1e293b', marginTop:2 }}>{v}</p>
              </div>
            ))}
          </div>
          {data.notas && (
            <div style={{ marginTop:8, padding:14, background:'#f8fafc', borderRadius:8 }}>
              <p style={{ fontSize:12, color:'#64748b', fontWeight:500, marginBottom:6 }}>Notas generales</p>
              <p style={{ fontSize:14, whiteSpace:'pre-wrap' }}>{data.notas}</p>
            </div>
          )}
        </div>
      )}

      {tab === 'contratos' && (
        <div>
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:14 }}>
            <button className="btn btn-primary" onClick={() => setModalContrato(true)}>+ Asignar plan</button>
          </div>
          {data.contratos.length === 0
            ? <div className="card"><div className="empty"><div className="empty-icon">📦</div><p>Sin planes asignados</p></div></div>
            : data.contratos.map(c => (
                <div className="card" key={c.id} style={{ marginBottom:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div>
                      <p style={{ fontWeight:600, fontSize:15 }}>{c.plan_nombre}</p>
                      <p style={{ fontSize:13, color:'#64748b', marginTop:2 }}>
                        {c.profesional_nombre ? `Prof. ${c.profesional_nombre} · ` : ''}
                        Desde {fmtFecha(c.fecha_inicio)} · Vence {fmtFecha(c.fecha_vence)}
                      </p>
                    </div>
                    {estadoBadge(c.estado)}
                  </div>
                  <div style={{ display:'flex', gap:20, marginTop:14 }}>
                    <div>
                      <p style={{ fontSize:11, color:'#64748b' }}>Sesiones</p>
                      <p style={{ fontWeight:600 }}>{c.sesiones_usadas} / {c.sesiones_total}</p>
                    </div>
                    <div>
                      <p style={{ fontSize:11, color:'#64748b' }}>Restantes</p>
                      <p style={{ fontWeight:600, color: c.sesiones_total - c.sesiones_usadas <= 2 ? '#dc2626' : '#1e293b' }}>
                        {c.sesiones_total - c.sesiones_usadas}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize:11, color:'#64748b' }}>Precio pagado</p>
                      <p style={{ fontWeight:600 }}>{fmtCOP(c.precio_pagado)}</p>
                    </div>
                  </div>
                  <div style={{ marginTop:10, background:'#f1f5f9', borderRadius:6, height:8, overflow:'hidden' }}>
                    <div style={{ height:'100%', background:'#6366f1', width:`${(c.sesiones_usadas/c.sesiones_total)*100}%`, transition:'width .3s' }} />
                  </div>
                </div>
              ))
          }
        </div>
      )}

      {tab === 'citas' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Historial de citas</span>
          </div>
          {data.citas.length === 0
            ? <div className="empty"><div className="empty-icon">📅</div><p>Sin citas registradas</p></div>
            : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Fecha</th><th>Hora</th><th>Profesional</th><th>Tipo</th><th>Estado</th></tr></thead>
                  <tbody>
                    {data.citas.map(c => (
                      <tr key={c.id}>
                        <td>{fmtFecha(c.fecha)}</td>
                        <td>{c.hora_inicio}</td>
                        <td>{c.profesional_nombre}</td>
                        <td style={{ textTransform:'capitalize' }}>{c.tipo}</td>
                        <td>{citaBadge(c.estado)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </div>
      )}

      {tab === 'notas' && (
        <div>
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:14 }}>
            <button className="btn btn-primary" onClick={() => setModalNota(true)}>+ Nueva nota</button>
          </div>
          {notas.length === 0
            ? <div className="card"><div className="empty"><div className="empty-icon">📝</div><p>Sin notas clínicas</p></div></div>
            : notas.map(n => (
                <div className="card" key={n.id} style={{ marginBottom:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                    <div>
                      <span style={{ fontWeight:500, fontSize:14 }}>{n.profesional_nombre}</span>
                      {n.privada ? <span className="badge badge-yellow" style={{ marginLeft:8 }}>Privada</span> : null}
                    </div>
                    <span style={{ fontSize:12, color:'#64748b' }}>
                      {new Date(n.creado_en).toLocaleString('es-CO')}
                      {n.cita_fecha ? ` · Cita: ${n.cita_fecha} ${n.cita_hora || ''}` : ''}
                    </span>
                  </div>
                  <p style={{ fontSize:14, whiteSpace:'pre-wrap', color:'#374151', lineHeight:1.6 }}>{n.contenido}</p>
                </div>
              ))
          }
        </div>
      )}

      {modalContrato && (
        <ModalContrato
          pacienteId={parseInt(id)}
          profesionales={profesionales}
          onClose={() => setModalContrato(false)}
          onSaved={() => { setModalContrato(false); cargar(); }}
        />
      )}
      {modalNota && (
        <ModalNota
          pacienteId={parseInt(id)}
          citas={data.citas}
          onClose={() => setModalNota(false)}
          onSaved={() => { setModalNota(false); cargar(); }}
        />
      )}
    </div>
  );
}
