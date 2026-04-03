const router = require('express').Router();
const db = require('../db/connection');
const { auth, role } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
router.use(auth);

router.get('/', async function(req, res) {
  try { res.json(await db.all('SELECT id,nombre,apellido,email,rol,activo,creado_en FROM usuarios ORDER BY nombre', [])); }
  catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/', role('admin'), async function(req, res) {
  try {
    const f = req.body;
    if (!f.nombre||!f.email||!f.password) return res.status(400).json({ error: 'Datos incompletos' });
    const hash = bcrypt.hashSync(f.password, 10);
    const r = await db.run('INSERT INTO usuarios (nombre,apellido,email,password,rol) VALUES (?,?,?,?,?)',
      [f.nombre,f.apellido||'',f.email.toLowerCase(),hash,f.rol||'psicologo']);
    res.status(201).json({ id: r.lastID });
  } catch(e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Email ya registrado' });
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id', role('admin'), async function(req, res) {
  try {
    const f = req.body;
    await db.run('UPDATE usuarios SET nombre=?,apellido=?,email=?,rol=?,activo=? WHERE id=?',
      [f.nombre,f.apellido||'',f.email,f.rol,f.activo?1:0,req.params.id]);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ========== ENDPOINTS DE CONTRASEÑA ==========

// Cambiar contraseña de otro usuario (solo admin)
// PATCH /usuarios/:id/password
// Body: { password: "nueva_contraseña" }
router.patch('/:id/password', role('admin'), async function(req, res) {
  try {
    const idUsuario = parseInt(req.params.id);
    const { password } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    }

    const usuario = await db.get('SELECT id FROM usuarios WHERE id=?', [idUsuario]);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    const hash = bcrypt.hashSync(password, 10);
    await db.run('UPDATE usuarios SET password=? WHERE id=?', [hash, idUsuario]);
    
    res.json({ ok: true, mensaje: 'Contraseña actualizada correctamente' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Cambiar propia contraseña (cualquier usuario autenticado)
// POST /usuarios/me/change-password
// Body: { password_actual: "...", password_nueva: "..." }
router.post('/me/change-password', async function(req, res) {
  try {
    const { password_actual, password_nueva } = req.body;

    if (!password_actual || !password_nueva) {
      return res.status(400).json({ error: 'Se requieren contraseña actual y nueva' });
    }

    if (password_nueva.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    }

    const usuario = await db.get('SELECT password FROM usuarios WHERE id=?', [req.user.id]);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    // Verificar contraseña actual
    if (!bcrypt.compareSync(password_actual, usuario.password)) {
      return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    }

    const hash = bcrypt.hashSync(password_nueva, 10);
    await db.run('UPDATE usuarios SET password=? WHERE id=?', [hash, req.user.id]);
    
    res.json({ ok: true, mensaje: 'Contraseña cambiada correctamente' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Eliminar usuario: reasigna sus notas y citas a otro profesional, luego desactiva
router.delete('/:id', role('admin'), async function(req, res) {
  try {
    const idEliminar = parseInt(req.params.id);
    const reasignarA = req.body.reasignar_a ? parseInt(req.body.reasignar_a) : null;

    // No permitir eliminar el propio admin que hace la petición
    if (idEliminar === req.user.id) {
      return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
    }

    const usuario = await db.get('SELECT * FROM usuarios WHERE id=?', [idEliminar]);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    // Si es psicólogo y tiene notas o citas, se requiere reasignación
    if (usuario.rol === 'psicologo' || usuario.rol === 'admin') {
      const tieneNotas = await db.get('SELECT COUNT(*) as n FROM notas_clinicas WHERE profesional_id=?', [idEliminar]);
      const tieneCitas = await db.get('SELECT COUNT(*) as n FROM citas WHERE profesional_id=? AND estado="programada"', [idEliminar]);

      if ((tieneNotas.n > 0 || tieneCitas.n > 0) && !reasignarA) {
        return res.status(409).json({
          error: 'Este usuario tiene notas clínicas o citas programadas. Indica un profesional al que reasignar.',
          tiene_notas: tieneNotas.n,
          tiene_citas: tieneCitas.n,
          requiere_reasignacion: true
        });
      }

      if (reasignarA) {
        const nuevoProf = await db.get('SELECT id FROM usuarios WHERE id=? AND activo=1', [reasignarA]);
        if (!nuevoProf) return res.status(400).json({ error: 'El profesional de reasignación no existe o está inactivo' });

        // Reasignar notas clínicas (se mantienen en la DB, solo cambia el profesional)
        await db.run('UPDATE notas_clinicas SET profesional_id=? WHERE profesional_id=?', [reasignarA, idEliminar]);
        // Reasignar citas programadas futuras
        await db.run('UPDATE citas SET profesional_id=? WHERE profesional_id=? AND estado="programada"', [reasignarA, idEliminar]);
        // Reasignar contratos activos
        await db.run('UPDATE contratos SET profesional_id=? WHERE profesional_id=? AND estado="activo"', [reasignarA, idEliminar]);
      }
    }

    // Desactivar el usuario (soft delete, preserva historial)
    await db.run('UPDATE usuarios SET activo=0 WHERE id=?', [idEliminar]);
    res.json({ ok: true, mensaje: 'Usuario desactivado y datos reasignados correctamente' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
