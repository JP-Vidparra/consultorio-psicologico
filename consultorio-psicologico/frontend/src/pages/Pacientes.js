import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

function ModalPaciente({ paciente, onClose, onSaved }) {
  const isEdit = !!paciente?.id;
  const [form, setForm] = useState(paciente || { nombre:'', apellido:'', email:'', telefono:'', fecha_nac:'', documento:'', direccion:'', notas:'' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (isEdit) await api.put(`/pacientes/${paciente.id}`, form);
      else await api.post('/pacientes', form);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{isEdit ? 'Editar paciente' : 'Nuevo paciente'}</span>
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
                <label className="form-label">Apellido *</label>
                <input className="form-control" value={form.apellido} onChange={e => set('apellido', e.target.value)} required />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Documento</label>
                <input className="form-control" value={form.documento} onChange={e => set('documento', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Fecha nacimiento</label>
                <input className="form-control" type="date" value={form.fecha_nac} onChange={e => set('fecha_nac', e.target.value)} />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Teléfono</label>
                <input className="form-control" value={form.telefono} onChange={e => set('telefono', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-control" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Dirección</label>
              <input className="form-control" value={form.direccion} onChange={e => set('direccion', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Notas iniciales</label>
              <textarea className="form-control" value={form.notas} onChange={e => set('notas', e.target.value)} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar paciente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Pacientes() {
  const [pacientes, setPacientes] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editPaciente, setEditPaciente] = useState(null);
  const navigate = useNavigate();

  const cargar = useCallback(() => {
    setLoading(true);
    api.get('/pacientes', { params: q ? { q } : {} })
      .then(r => setPacientes(r.data))
      .finally(() => setLoading(false));
  }, [q]);

  useEffect(() => { const t = setTimeout(cargar, 300); return () => clearTimeout(t); }, [cargar]);

  const abrirEditar = (p, e) => { e.stopPropagation(); setEditPaciente(p); setModal(true); };
  const cerrar = () => { setModal(false); setEditPaciente(null); };

  const calcEdad = (fn) => {
    if (!fn) return '—';
    const hoy = new Date(); const nac = new Date(fn);
    let edad = hoy.getFullYear() - nac.getFullYear();
    if (hoy.getMonth() < nac.getMonth() || (hoy.getMonth() === nac.getMonth() && hoy.getDate() < nac.getDate())) edad--;
    return edad + ' años';
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Pacientes</h1>
          <p className="page-sub">{pacientes.length} registrados</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditPaciente(null); setModal(true); }}>
          + Nuevo paciente
        </button>
      </div>

      <div className="card">
        <div style={{ marginBottom: 16 }}>
          <div className="search-box">
            <span className="icon">🔍</span>
            <input
              className="form-control"
              placeholder="Buscar por nombre, documento o email..."
              value={q} onChange={e => setQ(e.target.value)}
              style={{ maxWidth: 400 }}
            />
          </div>
        </div>

        {loading
          ? <div className="spinner" />
          : pacientes.length === 0
            ? <div className="empty"><div className="empty-icon">👥</div><p>No hay pacientes{q ? ' con esa búsqueda' : ''}</p></div>
            : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Documento</th>
                      <th>Edad</th>
                      <th>Teléfono</th>
                      <th>Email</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pacientes.map(p => (
                      <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/pacientes/${p.id}`)}>
                        <td>
                          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <div style={{ width:34, height:34, borderRadius:'50%', background:'#ede9fe',
                                          display:'flex', alignItems:'center', justifyContent:'center',
                                          fontWeight:700, fontSize:13, color:'#5b21b6', flexShrink:0 }}>
                              {p.nombre[0]}{p.apellido[0]}
                            </div>
                            <span style={{ fontWeight: 500 }}>{p.nombre} {p.apellido}</span>
                          </div>
                        </td>
                        <td>{p.documento || '—'}</td>
                        <td>{calcEdad(p.fecha_nac)}</td>
                        <td>{p.telefono || '—'}</td>
                        <td>{p.email || '—'}</td>
                        <td>
                          <button className="btn btn-secondary btn-sm" onClick={e => abrirEditar(p, e)}>
                            Editar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
        }
      </div>

      {modal && (
        <ModalPaciente
          paciente={editPaciente}
          onClose={cerrar}
          onSaved={() => { cerrar(); cargar(); }}
        />
      )}
    </div>
  );
}
