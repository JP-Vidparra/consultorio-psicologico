import React, { useState } from 'react';

const ChangeMyPasswordModal = ({ onClose, onSuccess }) => {
  const [password_actual, setPasswordActual] = useState('');
  const [password_nueva, setPasswordNueva] = useState('');
  const [confirmar_password, setConfirmarPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [mostrarContrasenas, setMostrarContrasenas] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validaciones
    if (!password_actual || !password_nueva || !confirmar_password) {
      setError('Completa todos los campos');
      return;
    }

    if (password_nueva.length < 8) {
      setError('La contraseña nueva debe tener al menos 8 caracteres');
      return;
    }

    if (password_nueva !== confirmar_password) {
      setError('Las contraseñas nuevas no coinciden');
      return;
    }

    if (password_actual === password_nueva) {
      setError('La nueva contraseña debe ser diferente a la actual');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/usuarios/me/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password_actual, password_nueva })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al cambiar la contraseña');
      }

      setSuccess('✓ Contraseña cambiada correctamente');
      setPasswordActual('');
      setPasswordNueva('');
      setConfirmarPassword('');

      // Cerrar modal después de 1.5 segundos
      setTimeout(() => {
        onSuccess?.();
        onClose?.();
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Cambiar mi contraseña
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              {success}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña actual *
            </label>
            <div className="relative">
              <input
                type={mostrarContrasenas ? 'text' : 'password'}
                value={password_actual}
                onChange={(e) => setPasswordActual(e.target.value)}
                placeholder="Tu contraseña actual"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nueva contraseña *
            </label>
            <div className="relative">
              <input
                type={mostrarContrasenas ? 'text' : 'password'}
                value={password_nueva}
                onChange={(e) => setPasswordNueva(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar nueva contraseña *
            </label>
            <div className="relative">
              <input
                type={mostrarContrasenas ? 'text' : 'password'}
                value={confirmar_password}
                onChange={(e) => setConfirmarPassword(e.target.value)}
                placeholder="Repite tu nueva contraseña"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setMostrarContrasenas(!mostrarContrasenas)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {mostrarContrasenas ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-3 rounded text-sm text-blue-700">
            ⚠️ Necesitarás tu contraseña actual para confirmar este cambio.
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {loading ? 'Guardando...' : 'Cambiar contraseña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangeMyPasswordModal;
