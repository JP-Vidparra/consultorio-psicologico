const router = require('express').Router();
const db = require('../db/connection');
const { auth } = require('../middleware/auth');
router.use(auth);

router.get('/', async function(req, res) {
  try {
    const q = req.query.q;
    let rows;
    if (q) {
      const like = '%' + q + '%';
      rows = await db.all('SELECT * FROM pacientes WHERE activo=1 AND (nombre LIKE ? OR apellido LIKE ? OR documento LIKE ? OR email LIKE ?) ORDER BY apellido,nombre', [like,like,like,like]);
    } else {
      rows = await db.all('SELECT * FROM pacientes WHERE activo=1 ORDER BY apellido,nombre', []);
    }
    res.json(rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async function(req, res) {
  try {
    const p = await db.get('SELECT * FROM pacientes WHERE id=? AND activo=1', [req.params.id]);
    if (!p) return res.status(404).json({ error: 'No encontrado' });
    const contratos = await db.all('SELECT c.*,pl.nombre as plan_nombre,u.nombre as profesional_nombre FROM contratos c JOIN planes pl ON c.plan_id=pl.id LEFT JOIN usuarios u ON c.profesional_id=u.id WHERE c.paciente_id=? ORDER BY c.creado_en DESC', [p.id]);
    const citas = await db.all('SELECT ci.*,u.nombre as profesional_nombre FROM citas ci JOIN usuarios u ON ci.profesional_id=u.id WHERE ci.paciente_id=? ORDER BY ci.fecha DESC,ci.hora_inicio DESC LIMIT 30', [p.id]);
    res.json(Object.assign({}, p, { contratos: contratos, citas: citas }));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async function(req, res) {
  try {
    const f = req.body;
    if (!f.nombre || !f.apellido) return res.status(400).json({ error: 'Nombre y apellido requeridos' });
    const r = await db.run('INSERT INTO pacientes (nombre,apellido,email,telefono,fecha_nac,documento,direccion,notas,creado_por) VALUES (?,?,?,?,?,?,?,?,?)',
      [f.nombre,f.apellido,f.email||null,f.telefono||null,f.fecha_nac||null,f.documento||null,f.direccion||null,f.notas||null,req.user.id]);
    res.status(201).json({ id: r.lastID });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async function(req, res) {
  try {
    const f = req.body;
    await db.run('UPDATE pacientes SET nombre=?,apellido=?,email=?,telefono=?,fecha_nac=?,documento=?,direccion=?,notas=? WHERE id=?',
      [f.nombre,f.apellido,f.email||null,f.telefono||null,f.fecha_nac||null,f.documento||null,f.direccion||null,f.notas||null,req.params.id]);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async function(req, res) {
  try {
    await db.run('UPDATE pacientes SET activo=0 WHERE id=?', [req.params.id]);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
