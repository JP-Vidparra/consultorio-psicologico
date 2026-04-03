const router = require('express').Router();
const db = require('../db/connection');
const { auth, role } = require('../middleware/auth');
router.use(auth);

router.get('/', async function(req, res) {
  try { res.json(await db.all('SELECT * FROM planes WHERE activo=1 ORDER BY precio', [])); }
  catch(e) { res.status(500).json({ error: e.message }); }
});

// Recepción y admin pueden crear y editar planes
router.post('/', role('admin', 'recepcion'), async function(req, res) {
  try {
    const f = req.body;
    if (!f.nombre || !f.num_sesiones || !f.precio) return res.status(400).json({ error: 'Datos incompletos' });
    const r = await db.run('INSERT INTO planes (nombre,num_sesiones,precio,vigencia_dias,descripcion) VALUES (?,?,?,?,?)',
      [f.nombre, f.num_sesiones, f.precio, f.vigencia_dias||90, f.descripcion||null]);
    res.status(201).json({ id: r.lastID });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', role('admin', 'recepcion'), async function(req, res) {
  try {
    const f = req.body;
    await db.run('UPDATE planes SET nombre=?,num_sesiones=?,precio=?,vigencia_dias=?,descripcion=? WHERE id=?',
      [f.nombre,f.num_sesiones,f.precio,f.vigencia_dias,f.descripcion||null,req.params.id]);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Solo admin puede eliminar planes (acción destructiva)
router.delete('/:id', role('admin', 'recepcion'), async function(req, res) {
  try {
    // Verificar que no haya contratos activos con este plan
    const enUso = await db.get("SELECT COUNT(*) as n FROM contratos WHERE plan_id=? AND estado='activo'", [req.params.id]);
    if (enUso.n > 0) {
      return res.status(409).json({ error: `No se puede eliminar: hay ${enUso.n} contrato(s) activo(s) con este plan` });
    }
    await db.run('UPDATE planes SET activo=0 WHERE id=?', [req.params.id]);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
