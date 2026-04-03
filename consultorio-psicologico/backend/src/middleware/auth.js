const jwt = require('jsonwebtoken');
const db = require('../db/connection');

const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_super_seguro_aqui';

// Roles definidos en el sistema
const ROLES = {
  admin: ['admin', 'todo'],
  psicologo: ['psicologo', 'pacientes', 'citas', 'notas', 'planes'],
  facturacion: ['facturacion', 'facturas', 'contabilidad', 'pagos'],
  recepcion: ['recepcion', 'agenda', 'pacientes', 'citas']
};

// Middleware de autenticación
const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token no proporcionado' });

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

// Middleware de roles
const role = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'No autenticado' });

    // Admin tiene acceso a todo
    if (req.user.rol === 'admin') {
      return next();
    }

    // Verificar si el rol del usuario está en los permitidos
    if (rolesPermitidos.includes(req.user.rol)) {
      return next();
    }

    // Verificar si el rol tiene acceso al módulo solicitado
    const modulosDelRol = ROLES[req.user.rol] || [];
    const moduloSolicitado = req.path.split('/')[1];

    if (modulosDelRol.includes(moduloSolicitado) || modulosDelRol.includes('todo')) {
      return next();
    }

    res.status(403).json({ error: 'No tienes permiso para acceder a este recurso' });
  };
};

// Middleware especializado para facturación
const requireFacturacion = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });

  if (req.user.rol === 'admin' || req.user.rol === 'facturacion') {
    return next();
  }

  res.status(403).json({ error: 'Acceso solo para administrador o usuario de facturación' });
};

// Middleware especializado para clínica (psicólogos y admin)
const requireClinica = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });

  if (req.user.rol === 'admin' || req.user.rol === 'psicologo') {
    return next();
  }

  res.status(403).json({ error: 'Acceso solo para administrador o psicólogos' });
};

module.exports = { auth, role, requireFacturacion, requireClinica, JWT_SECRET, ROLES };
