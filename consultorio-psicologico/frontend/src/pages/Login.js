import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'linear-gradient(135deg,#1e293b 0%,#334155 100%)'
    }}>
      <div style={{ width: '100%', maxWidth: 380, padding: 16 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🧠</div>
          <h1 style={{ color: '#f1f5f9', fontSize: 22, fontWeight: 700 }}>Consultorio Psicológico</h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>Sistema de gestión</p>
        </div>

        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, color: '#1e293b' }}>
            Iniciar sesión
          </h2>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Correo electrónico</label>
              <input
                className="form-control"
                type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input
                className="form-control"
                type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '10px', marginTop: 4 }}
              disabled={loading}
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <div style={{ marginTop: 20, padding: 12, background: '#f8fafc', borderRadius: 8, fontSize: 12, color: '#64748b' }}>
            <strong>Acceso inicial:</strong><br />
            admin@consultorio.com<br />
            Consultorio2024!
          </div>
        </div>
      </div>
    </div>
  );
}
