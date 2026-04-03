import React, { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

function fmtCOP(n) { return '$' + Number(n).toLocaleString('es-CO'); }

// ─── PLANES ───────────────────────────────────────────────────────────────────
function ModalPlan({ plan, onClose, onSaved }) {
  const isEdit = !!plan?.id;
  const [form, setForm] = useState(plan || { nombre:'', num_sesiones:'', precio:'', vigencia_dias:90, descripcion:'' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (isEdit) await api.put(`/planes/${plan.id}`, form);
      else await api.post('/planes', form);
      onSaved();
    } catch (err) { setError(err.response?.data?.error || 'Error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{isEdit ? 'Editar plan' : 'Nuevo plan'}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-group">
              <label className="form-label">Nombre del plan *</label>
              <input className="form-control" value={form.nombre} onChange={e => set('nombre', e.target.value)} required />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Número de sesiones *</label>
                <input className="form-control" type="number" min="1" value={form.num_sesiones} onChange={e => set('num_sesiones', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Vigencia (días) *</label>
                <input className="form-control" type="number" min="1" value={form.vigencia_dias} onChange={e => set('vigencia_dias', e.target.value)} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Precio (COP) *</label>
              <input className="form-control" type="number" min="0" value={form.precio} onChange={e => set('precio', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Descripción</label>
              <textarea className="form-control" value={form.descripcion} onChange={e => set('descripcion', e.target.value)} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Planes() {
  const { user } = useAuth();
  const [planes, setPlanes] = useState([]);
  const [modal, setModal] = useState(false);
  const [editPlan, setEditPlan] = useState(null);
  const [error, setError] = useState('');

  const canEdit = user?.rol === 'admin' || user?.rol === 'recepcion';

  const cargar = () => api.get('/planes').then(r => setPlanes(r.data));
  useEffect(() => { cargar(); }, []);

  const eliminarPlan = async (plan) => {
    if (!window.confirm(`¿Eliminar el plan "${plan.nombre}"? Esta acción no se puede deshacer.`)) return;
    setError('');
    try {
      await api.delete(`/planes/${plan.id}`);
      cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Planes y paquetes</h1><p className="page-sub">{planes.length} planes activos</p></div>
        {canEdit && (
          <button className="btn btn-primary" onClick={() => { setEditPlan(null); setModal(true); }}>+ Nuevo plan</button>
        )}
      </div>
      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:16 }}>
        {planes.map(p => (
          <div className="card" key={p.id}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
              <h3 style={{ fontSize:16, fontWeight:600 }}>{p.nombre}</h3>
              <span className="badge badge-purple">{p.num_sesiones} sesiones</span>
            </div>
            <p style={{ fontSize:24, fontWeight:700, color:'#6366f1' }}>{fmtCOP(p.precio)}</p>
            <p style={{ fontSize:12, color:'#64748b', marginTop:4 }}>Vigencia: {p.vigencia_dias} días</p>
            {p.descripcion && <p style={{ fontSize:13, color:'#374151', marginTop:8 }}>{p.descripcion}</p>}
            {canEdit && (
              <div style={{ marginTop:14, display:'flex', justifyContent:'flex-end', gap:8 }}>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ color:'#dc2626', borderColor:'#fecaca' }}
                  onClick={() => eliminarPlan(p)}
                >
                  Eliminar
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => { setEditPlan(p); setModal(true); }}>Editar</button>
              </div>
            )}
          </div>
        ))}
        {planes.length === 0 && <div className="empty"><div className="empty-icon">📋</div><p>Sin planes creados</p></div>}
      </div>
      {modal && <ModalPlan plan={editPlan} onClose={() => setModal(false)} onSaved={() => { setModal(false); cargar(); }} />}
    </div>
  );
}

// ─── FACTURAS ─────────────────────────────────────────────────────────────────
export function Facturas() {
  const { user } = useAuth();
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const canManage = user?.rol === 'admin' || user?.rol === 'financiero';

  const cargar = () => {
    setLoading(true);
    api.get('/facturas').then(r => setFacturas(r.data)).finally(() => setLoading(false));
  };
  useEffect(() => { cargar(); }, []);

  const pagar = async (f) => {
    const metodo = window.prompt('Método de pago (efectivo, transferencia, tarjeta):', 'efectivo');
    if (!metodo) return;
    try {
      await api.put(`/facturas/${f.id}/pagar`, { metodo_pago: metodo });
      cargar();
    } catch (err) { setError(err.response?.data?.error || 'Error al registrar pago'); }
  };

  const anular = async (f) => {
    const motivo = window.prompt('Motivo de anulación:');
    if (motivo === null) return;
    try {
      await api.put(`/facturas/${f.id}/anular`, { motivo });
      cargar();
    } catch (err) { setError(err.response?.data?.error || 'Error al anular'); }
  };

  const eliminar = async (f) => {
    if (!window.confirm(`¿Eliminar la factura ${f.numero}? Solo se pueden eliminar facturas pendientes o anuladas.`)) return;
    try {
      await api.delete(`/facturas/${f.id}`);
      cargar();
    } catch (err) { setError(err.response?.data?.error || 'Error al eliminar'); }
  };

  const estadoBadge = (e) => {
    const map = { pendiente:'badge-yellow', pagada:'badge-green', anulada:'badge-gray' };
    return <span className={`badge ${map[e]}`}>{e}</span>;
  };

  const total = facturas.filter(f => f.estado === 'pagada').reduce((a, f) => a + f.monto, 0);
  const pendiente = facturas.filter(f => f.estado === 'pendiente').reduce((a, f) => a + f.monto, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Facturación</h1>
          <p className="page-sub">
            Cobrado: <strong>{fmtCOP(total)}</strong>
            {canManage && <span style={{ marginLeft:16, color:'#f59e0b' }}>Pendiente: <strong>{fmtCOP(pendiente)}</strong></span>}
          </p>
        </div>
      </div>
      {error && <div className="alert alert-error" style={{ marginBottom:16 }}>{error}</div>}
      <div className="card">
        {loading
          ? <div className="spinner" />
          : facturas.length === 0
            ? <div className="empty"><div className="empty-icon">🧾</div><p>Sin facturas</p></div>
            : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>#</th><th>Paciente</th><th>Plan</th><th>Monto</th>
                      <th>Estado</th><th>Método</th><th>Fecha</th><th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {facturas.map(f => (
                      <tr key={f.id}>
                        <td style={{ fontFamily:'monospace', fontSize:12 }}>{f.numero}</td>
                        <td style={{ fontWeight:500 }}>{f.paciente_nombre}</td>
                        <td>{f.plan_nombre}</td>
                        <td style={{ fontWeight:600 }}>{fmtCOP(f.monto)}</td>
                        <td>{estadoBadge(f.estado)}</td>
                        <td style={{ textTransform:'capitalize' }}>{f.metodo_pago || '—'}</td>
                        <td style={{ fontSize:12 }}>{f.fecha_emision}</td>
                        <td style={{ display:'flex', gap:6, flexWrap:'nowrap' }}>
                          {f.estado === 'pendiente' && (
                            <button className="btn btn-primary btn-sm" onClick={() => pagar(f)}>Registrar pago</button>
                          )}
                          {canManage && f.estado !== 'anulada' && f.estado !== 'pendiente' && (
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ color:'#dc2626', borderColor:'#fecaca' }}
                              onClick={() => anular(f)}
                            >
                              Anular
                            </button>
                          )}
                          {canManage && (f.estado === 'pendiente' || f.estado === 'anulada') && (
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ color:'#dc2626', borderColor:'#fecaca' }}
                              onClick={() => eliminar(f)}
                            >
                              Eliminar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
        }
      </div>
    </div>
  );
}

// ─── MODAL REASIGNACIÓN ───────────────────────────────────────────────────────
function ModalReasignar({ usuario, profesionales, onConfirm, onClose }) {
  const [reasignarA, setReasignarA] = useState('');
  const opciones = profesionales.filter(p => p.id !== usuario.id && p.activo && (p.rol === 'psicologo' || p.rol === 'admin'));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Reasignar antes de eliminar</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="alert alert-error" style={{ marginBottom:16 }}>
            <strong>{usuario.nombre} {usuario.apellido}</strong> tiene notas clínicas o citas programadas.
            Debes reasignarlas a otro profesional antes de continuar.
          </div>
          <div className="form-group">
            <label className="form-label">Reasignar registros a *</label>
            <select className="form-control" value={reasignarA} onChange={e => setReasignarA(e.target.value)} required>
              <option value="">Seleccionar profesional...</option>
              {opciones.map(p => (
                <option key={p.id} value={p.id}>{p.nombre} {p.apellido} ({p.rol})</option>
              ))}
            </select>
          </div>
          <p style={{ fontSize:12, color:'#64748b', marginTop:8 }}>
            Las notas clínicas e historial se mantendrán en la base de datos. Solo se cambia el profesional asignado.
          </p>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button
            type="button"
            className="btn btn-primary"
            style={{ background:'#dc2626' }}
            disabled={!reasignarA}
            onClick={() => onConfirm(reasignarA)}
          >
            Reasignar y eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── USUARIOS ─────────────────────────────────────────────────────────────────
function ModalUsuario({ usuario, onClose, onSaved }) {
  const isEdit = !!usuario?.id;
  const [form, setForm] = useState(usuario ? { ...usuario, password:'' } : { nombre:'', apellido:'', email:'', password:'', rol:'psicologo' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (isEdit) await api.put(`/usuarios/${usuario.id}`, form);
      else await api.post('/usuarios', form);
      onSaved();
    } catch (err) { setError(err.response?.data?.error || 'Error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{isEdit ? 'Editar usuario' : 'Nuevo usuario'}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Nombre *</label>
                <input className="form-control" value={form.nombre} onChange={e => set('nombre', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Apellido</label>
                <input className="form-control" value={form.apellido} onChange={e => set('apellido', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input className="form-control" type="email" value={form.email} onChange={e => set('email', e.target.value)} required />
            </div>
            {!isEdit && (
              <div className="form-group">
                <label className="form-label">Contraseña *</label>
                <input className="form-control" type="password" value={form.password} onChange={e => set('password', e.target.value)} required />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Rol *</label>
              <select className="form-control" value={form.rol} onChange={e => set('rol', e.target.value)}>
                <option value="admin">Administrador</option>
                <option value="psicologo">Psicólogo</option>
                <option value="recepcion">Recepción</option>
                <option value="financiero">Financiero</option>
              </select>
            </div>
            {isEdit && (
              <div className="form-group">
                <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
                  <input type="checkbox" checked={!!form.activo} onChange={e => set('activo', e.target.checked)} />
                  <span className="form-label" style={{ margin:0 }}>Usuario activo</span>
                </label>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Usuarios() {
  const { user: currentUser } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [modal, setModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [modalReasignar, setModalReasignar] = useState(false);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);
  const [error, setError] = useState('');

  const cargar = () => api.get('/usuarios').then(r => setUsuarios(r.data));
  useEffect(() => { cargar(); }, []);

  const rolBadge = (r) => {
    const map = { admin:'badge-purple', psicologo:'badge-blue', recepcion:'badge-green', financiero:'badge-yellow' };
    return <span className={`badge ${map[r] || 'badge-gray'}`}>{r}</span>;
  };

  const eliminarUsuario = async (usuario) => {
    setError('');
    // Intentar eliminar sin reasignación primero
    try {
      await api.delete(`/usuarios/${usuario.id}`);
      cargar();
    } catch (err) {
      if (err.response?.data?.requiere_reasignacion) {
        // El backend pide reasignación
        setUsuarioAEliminar(usuario);
        setModalReasignar(true);
      } else {
        setError(err.response?.data?.error || 'Error al eliminar usuario');
      }
    }
  };

  const confirmarEliminacionConReasignacion = async (reasignarA) => {
    setError('');
    try {
      await api.delete(`/usuarios/${usuarioAEliminar.id}`, { data: { reasignar_a: reasignarA } });
      setModalReasignar(false);
      setUsuarioAEliminar(null);
      cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar usuario');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Usuarios del sistema</h1><p className="page-sub">{usuarios.length} usuarios</p></div>
        <button className="btn btn-primary" onClick={() => { setEditUser(null); setModal(true); }}>+ Nuevo usuario</button>
      </div>
      {error && <div className="alert alert-error" style={{ marginBottom:16 }}>{error}</div>}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight:500 }}>{u.nombre} {u.apellido}</td>
                  <td>{u.email}</td>
                  <td>{rolBadge(u.rol)}</td>
                  <td><span className={`badge ${u.activo ? 'badge-green' : 'badge-gray'}`}>{u.activo ? 'Activo' : 'Inactivo'}</span></td>
                  <td style={{ display:'flex', gap:6 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => { setEditUser(u); setModal(true); }}>Editar</button>
                    {/* No mostrar botón eliminar para el propio usuario logueado */}
                    {u.id !== currentUser?.id && (
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ color:'#dc2626', borderColor:'#fecaca' }}
                        onClick={() => {
                          if (window.confirm(`¿Desactivar a ${u.nombre} ${u.apellido}? Se reasignarán sus datos si es necesario.`)) {
                            eliminarUsuario(u);
                          }
                        }}
                      >
                        Eliminar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {modal && <ModalUsuario usuario={editUser} onClose={() => setModal(false)} onSaved={() => { setModal(false); cargar(); }} />}
      {modalReasignar && usuarioAEliminar && (
        <ModalReasignar
          usuario={usuarioAEliminar}
          profesionales={usuarios}
          onConfirm={confirmarEliminacionConReasignacion}
          onClose={() => { setModalReasignar(false); setUsuarioAEliminar(null); }}
        />
      )}
    </div>
  );
}
