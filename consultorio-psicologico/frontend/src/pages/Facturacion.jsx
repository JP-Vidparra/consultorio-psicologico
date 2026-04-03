import React, { useState, useEffect } from 'react';

const Facturacion = () => {
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState('todas'); // 'todas', 'pendiente', 'pagada'
  const [mostrarModal, setMostrarModal] = useState(false);
  const [pacientes, setPacientes] = useState([]);
  const [profesionales, setProfesionales] = useState([]);

  const [formData, setFormData] = useState({
    paciente_id: '',
    profesional_id: '',
    items: [{ descripcion: '', cantidad: 1, precio_unitario: 0 }],
    notas: ''
  });

  // Cargar facturas al montarse
  useEffect(() => {
    cargarFacturas();
    cargarPacientes();
    cargarProfesionales();
  }, [filtro]);

  const cargarFacturas = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/facturas', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 403) {
        setError('❌ Solo administrador y usuario de facturación pueden acceder');
        setFacturas([]);
        return;
      }

      if (!response.ok) throw new Error('Error al cargar facturas');

      const data = await response.json();
      
      // Filtrar por estado
      if (filtro !== 'todas') {
        const filtradas = data.filter(f => f.estado === filtro);
        setFacturas(filtradas);
      } else {
        setFacturas(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const cargarPacientes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/pacientes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPacientes(data);
      }
    } catch (err) {
      console.error('Error cargando pacientes:', err);
    }
  };

  const cargarProfesionales = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/usuarios', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const profs = data.filter(u => u.rol === 'psicologo');
        setProfesionales(profs);
      }
    } catch (err) {
      console.error('Error cargando profesionales:', err);
    }
  };

  const agregarItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { descripcion: '', cantidad: 1, precio_unitario: 0 }]
    });
  };

  const eliminarItem = (index) => {
    const nuevosItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: nuevosItems });
  };

  const actualizarItem = (index, campo, valor) => {
    const nuevosItems = [...formData.items];
    nuevosItems[index][campo] = campo === 'descripcion' ? valor : parseFloat(valor) || 0;
    setFormData({ ...formData, items: nuevosItems });
  };

  const calcularTotal = () => {
    return formData.items.reduce((sum, item) => sum + (item.cantidad * item.precio_unitario), 0);
  };

  const crearFactura = async (e) => {
    e.preventDefault();
    
    if (!formData.paciente_id || !formData.items.some(i => i.descripcion)) {
      setError('Completa paciente y al menos un item');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const monto_total = calcularTotal();

      const response = await fetch('http://localhost:3001/api/facturas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          paciente_id: parseInt(formData.paciente_id),
          profesional_id: formData.profesional_id ? parseInt(formData.profesional_id) : null,
          items: formData.items,
          monto_total: monto_total,
          notas: formData.notas
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al crear factura');
      }

      alert('✓ Factura creada correctamente');
      setMostrarModal(false);
      setFormData({
        paciente_id: '',
        profesional_id: '',
        items: [{ descripcion: '', cantidad: 1, precio_unitario: 0 }],
        notas: ''
      });
      cargarFacturas();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const marcarComoPagada = async (factura_id) => {
    if (!window.confirm('¿Marcar esta factura como pagada?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/facturas/${factura_id}/pagar`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fecha_pago: new Date().toISOString(),
          metodo_pago: 'no especificado'
        })
      });

      if (!response.ok) throw new Error('Error al actualizar');

      alert('✓ Factura marcada como pagada');
      cargarFacturas();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">💰 Facturación</h1>
            <p className="text-gray-500 mt-1">Gestiona facturas y cobros</p>
          </div>
          <button
            onClick={() => setMostrarModal(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-semibold transition"
          >
            + Nueva Factura
          </button>
        </div>

        {/* Filtros */}
        <div className="mb-6 flex gap-2">
          {['todas', 'pendiente', 'pagada'].map(estado => (
            <button
              key={estado}
              onClick={() => setFiltro(estado)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filtro === estado
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {estado === 'todas' ? '📋 Todas' : estado === 'pendiente' ? '⏳ Pendientes' : '✅ Pagadas'}
            </button>
          ))}
        </div>

        {/* Mensajes */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Tabla de facturas */}
        {loading && !mostrarModal ? (
          <div className="text-center py-8 text-gray-500">Cargando facturas...</div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            {facturas.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No hay facturas {filtro !== 'todas' ? `en estado "${filtro}"` : ''}</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Factura #</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Paciente</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Profesional</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Monto</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Fecha</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Estado</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {facturas.map(factura => (
                    <tr key={factura.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        #{factura.numero_factura}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{factura.paciente}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{factura.profesional || '—'}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        ${factura.monto_total?.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(factura.fecha).toLocaleDateString('es-CO')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          factura.estado === 'pagada'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {factura.estado === 'pagada' ? '✅ Pagada' : '⏳ Pendiente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        {factura.estado === 'pendiente' && (
                          <button
                            onClick={() => marcarComoPagada(factura.id)}
                            className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 font-semibold text-xs"
                          >
                            Marcar pagada
                          </button>
                        )}
                        <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 font-semibold text-xs">
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Modal de nueva factura */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Nueva Factura</h2>
              <button
                onClick={() => setMostrarModal(false)}
                className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={crearFactura} className="p-6 space-y-6">
              {/* Paciente */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Paciente *
                </label>
                <select
                  value={formData.paciente_id}
                  onChange={(e) => setFormData({ ...formData, paciente_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Selecciona un paciente</option>
                  {pacientes.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Profesional (opcional) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Profesional (opcional)
                </label>
                <select
                  value={formData.profesional_id}
                  onChange={(e) => setFormData({ ...formData, profesional_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Sin asignar</option>
                  {profesionales.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Items */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Items de Factura *
                </label>
                <div className="space-y-3">
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex gap-3 items-end">
                      <input
                        type="text"
                        placeholder="Descripción (p.ej: Consulta)"
                        value={item.descripcion}
                        onChange={(e) => actualizarItem(index, 'descripcion', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        required
                      />
                      <input
                        type="number"
                        placeholder="Cantidad"
                        value={item.cantidad}
                        onChange={(e) => actualizarItem(index, 'cantidad', e.target.value)}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        min="1"
                      />
                      <input
                        type="number"
                        placeholder="Precio"
                        value={item.precio_unitario}
                        onChange={(e) => actualizarItem(index, 'precio_unitario', e.target.value)}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        min="0"
                        step="0.01"
                      />
                      <span className="w-24 text-right font-semibold text-gray-900">
                        ${(item.cantidad * item.precio_unitario).toFixed(2)}
                      </span>
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => eliminarItem(index)}
                          className="px-3 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={agregarItem}
                  className="mt-3 text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  + Agregar item
                </button>
              </div>

              {/* Total */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-700">Total:</span>
                  <span className="text-2xl font-bold text-blue-600">${calcularTotal().toFixed(2)}</span>
                </div>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notas (opcional)
                </label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  placeholder="Términos, condiciones, observaciones..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                />
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setMostrarModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  {loading ? 'Guardando...' : 'Crear Factura'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Facturacion;
