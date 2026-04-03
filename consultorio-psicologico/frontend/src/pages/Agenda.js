import React, { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';

function fmtHora(h) {
  if (!h) return '';
  const [hh, mm] = h.split(':');
  const hr = parseInt(hh);
  return `${hr > 12 ? hr - 12 : hr}:${mm} ${hr >= 12 ? 'pm' : 'am'}`;
}

function getWeekDays(base) {
  const d = new Date(base);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const lunes = new Date(d.setDate(diff));
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(lunes);
    dd.setDate(lunes.getDate() + i);
    return dd;
  });
}

function toISO(d) { return d.toISOString().split('T')[0]; }

function ModalCita({ profesionales, pacientes, onClose, onSaved, cita }) {
  const isEdit = !!cita?.id;
  const [form, setForm] = useState(cita ? {
    paciente_id: cita.paciente_id, profesional_id: cita.profesional_id,
    fecha: cita.fecha, hora_inicio: cita.hora_inicio, hora_fin: cita.hora_fin,
    tipo: cita.tipo, notas_previas: cita.notas_previas || ''
  } : {
    paciente_id:'', profesional_id:'', fecha: toISO(new Date()),
    hora_inicio:'09:00', hora_fin:'10:00', tipo:'sesion', notas_previas:''
  });
  const [contratos, setContratos] = useState([]);
  const [contrato_id, setContratoId] = useState(cita?.contrato_id || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (form.paciente_id) {
      api.get('/contratos', { params: { paciente_id: form.paciente_id } })
        .then(r => setContratos(r.data.filter(c => c.estado === 'activo')));
    }
  }, [form.paciente_id]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const payload = { ...form, contrato_id: contrato_id || null };
      if (isEdit) await api.put(`/citas/${cita.id}`, payload);
      else await api.post('/citas', payload);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    } finally { setLoading(false); }
  };

  const completar = async () => {
    try {
      await api.put(`/citas/${cita.id}/estado`, { estado: 'completada' });
      onSaved();
    } catch (err) { setError(err.response?.data?.error || 'Error'); }
  };

  // Cancelar: marca la cita como cancelada (queda en historial)
  const cancelar = async () => {
    if (window.confirm('¿Cancelar esta cita? Quedará registrada como cancelada en el historial.')) {
      try {
        await api.delete(`/citas/${cita.id}`);
        onSaved();
      } catch (err) { setError(err.response?.data?.error || 'Error'); }
    }
  };

  // Eliminar: borra definitivamente una cita mal programada
  const eliminarDefinitivo = async () => {
    if (window.confirm('¿ELIMINAR esta cita? Esta acción borra el registro completamente, úsala solo para citas mal programadas.')) {
      try {
        await api.delete(`/citas/${cita.id}`, { params: { definitivo: true } });
        onSaved();
      } catch (err) { setError(err.response?.data?.error || 'Error'); }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{isEdit ? 'Editar cita' : 'Nueva cita'}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-group">
              <label className="form-label">Paciente *</label>
              <select className="form-control" value={form.paciente_id} onChange={e => set('paciente_id', e.target.value)} required>
                <option value="">Seleccionar...</option>
                {pacientes.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
              </select>
            </div>
            {contratos.length > 0 && (
              <div className="form-group">
                <label className="form-label">Plan activo (opcional)</label>
                <select className="form-control" value={contrato_id} onChange={e => setContratoId(e.target.value)}>
                  <option value="">Sin plan</option>
                  {contratos.map(c => <option key={c.id} value={c.id}>{c.plan_nombre} — {c.sesiones_total - c.sesiones_usadas} sesiones restantes</option>)}
                </select>
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Profesional *</label>
              <select className="form-control" value={form.profesional_id} onChange={e => set('profesional_id', e.target.value)} required>
                <option value="">Seleccionar...</option>
                {profesionales.map(u => <option key={u.id} value={u.id}>{u.nombre} {u.apellido}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Fecha *</label>
              <input className="form-control" type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} required />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Hora inicio *</label>
                <input className="form-control" type="time" value={form.hora_inicio} onChange={e => set('hora_inicio', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Hora fin *</label>
                <input className="form-control" type="time" value={form.hora_fin} onChange={e => set('hora_fin', e.target.value)} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Tipo</label>
              <select className="form-control" value={form.tipo} onChange={e => set('tipo', e.target.value)}>
                <option value="sesion">Sesión</option>
                <option value="evaluacion">Evaluación inicial</option>
                <option value="seguimiento">Seguimiento</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Notas previas</label>
              <textarea className="form-control" value={form.notas_previas} onChange={e => set('notas_previas', e.target.value)} />
            </div>
          </div>
          <div className="modal-footer">
            {isEdit && cita.estado === 'programada' && (
              <>
                {/* Eliminar definitivo: para citas mal programadas */}
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ color:'#dc2626', borderColor:'#fecaca' }}
                  onClick={eliminarDefinitivo}
                  title="Elimina el registro completamente (cita mal programada)"
                >
                  🗑 Eliminar
                </button>
                {/* Cancelar: queda en historial */}
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={cancelar}
                  title="Marca como cancelada, queda en el historial"
                >
                  ✕ Cancelar cita
                </button>
                <button type="button" className="btn btn-primary btn-sm" onClick={completar} style={{ background:'#16a34a' }}>✓ Completar</button>
              </>
            )}
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cerrar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Agenda() {
  const [baseDate, setBaseDate] = useState(new Date());
  const [citas, setCitas] = useState([]);
  const [profesionales, setProfesionales] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [filtroProf, setFiltroProf] = useState('');
  const [modal, setModal] = useState(false);
  const [citaSel, setCitaSel] = useState(null);
  const [loading, setLoading] = useState(true);

  const dias = getWeekDays(baseDate);
  const desde = toISO(dias[0]);
  const hasta = toISO(dias[6]);

  const DIAS_ES = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
  const MESES_ES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

  const cargar = useCallback(() => {
    setLoading(true);
    const params = { fecha_desde: desde, fecha_hasta: hasta };
    if (filtroProf) params.profesional_id = filtroProf;
    api.get('/citas', { params }).then(r => setCitas(r.data)).finally(() => setLoading(false));
  }, [desde, hasta, filtroProf]);

  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => {
    api.get('/usuarios').then(r => setProfesionales(r.data.filter(u => u.rol !== 'recepcion' && u.rol !== 'financiero' && u.activo)));
    api.get('/pacientes').then(r => setPacientes(r.data));
  }, []);

  const citasDelDia = (fecha) => citas.filter(c => c.fecha === fecha);

  const abrirNueva = (fecha) => { setCitaSel({ fecha }); setModal(true); };
  const abrirEditar = (cita) => { setCitaSel(cita); setModal(true); };
  const cerrar = () => { setModal(false); setCitaSel(null); };

  const estadoClass = (e) => {
    const map = { programada:'', completada:'completada', cancelada:'cancelada', no_asistio:'cancelada' };
    return map[e] || '';
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Agenda</h1>
          <p className="page-sub">
            {dias[0].getDate()} — {dias[6].getDate()} de {MESES_ES[dias[6].getMonth()]} {dias[6].getFullYear()}
          </p>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <select className="form-control" style={{ width:180 }} value={filtroProf} onChange={e => setFiltroProf(e.target.value)}>
            <option value="">Todos los profesionales</option>
            {profesionales.map(u => <option key={u.id} value={u.id}>{u.nombre} {u.apellido}</option>)}
          </select>
          <button className="btn btn-secondary" onClick={() => setBaseDate(d => { const n=new Date(d); n.setDate(n.getDate()-7); return n; })}>← Anterior</button>
          <button className="btn btn-secondary" onClick={() => setBaseDate(new Date())}>Hoy</button>
          <button className="btn btn-secondary" onClick={() => setBaseDate(d => { const n=new Date(d); n.setDate(n.getDate()+7); return n; })}>Siguiente →</button>
          <button className="btn btn-primary" onClick={() => { setCitaSel(null); setModal(true); }}>+ Nueva cita</button>
        </div>
      </div>

      {loading
        ? <div className="spinner" />
        : (
          <div className="agenda-grid">
            {dias.map((dia, i) => {
              const iso = toISO(dia);
              const esHoy = iso === toISO(new Date());
              const citasDia = citasDelDia(iso);
              return (
                <div key={iso} className="agenda-day" style={{ border: esHoy ? '2px solid #6366f1' : undefined }}>
                  <div className="agenda-day-header" style={{ color: esHoy ? '#6366f1' : undefined }}>
                    {DIAS_ES[i]} {dia.getDate()}
                  </div>
                  {citasDia.map(c => (
                    <div key={c.id} className={`agenda-cita ${estadoClass(c.estado)}`}
                         onClick={() => abrirEditar(c)}>
                      <strong>{fmtHora(c.hora_inicio)}</strong> {c.paciente_nombre?.split(' ')[0]}
                      <div style={{ fontSize:10, opacity:.8 }}>{c.profesional_nombre?.split(' ')[0]}</div>
                    </div>
                  ))}
                  <button
                    onClick={() => abrirNueva(iso)}
                    style={{ width:'100%', marginTop:4, padding:'3px 0', background:'none',
                             border:'1px dashed #d1d5db', borderRadius:4, cursor:'pointer',
                             fontSize:11, color:'#94a3b8' }}>
                    + cita
                  </button>
                </div>
              );
            })}
          </div>
        )
      }

      {modal && (
        <ModalCita
          profesionales={profesionales}
          pacientes={pacientes}
          cita={citaSel}
          onClose={cerrar}
          onSaved={() => { cerrar(); cargar(); }}
        />
      )}
    </div>
  );
}
