const router = require('express').Router();
const db = require('../db/connection');
const { auth } = require('../middleware/auth');
router.use(auth);

router.get('/', async function(req, res) {
  try {
    const pid = req.query.paciente_id;
    if (!pid) return res.status(400).json({ error: 'paciente_id requerido' });
    const rows = await db.all('SELECT n.*,u.nombre as profesional_nombre,c.fecha as cita_fecha,c.hora_inicio as cita_hora FROM notas_clinicas n JOIN usuarios u ON n.profesional_id=u.id LEFT JOIN citas c ON n.cita_id=c.id WHERE n.paciente_id=? AND (n.privada=0 OR n.profesional_id=?) ORDER BY n.creado_en DESC',
      [pid, req.user.id]);
    res.json(rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async function(req, res) {
  try {
    const f = req.body;
    if (!f.paciente_id||!f.contenido) return res.status(400).json({ error: 'Datos incompletos' });
    const r = await db.run('INSERT INTO notas_clinicas (cita_id,paciente_id,profesional_id,contenido,privada) VALUES (?,?,?,?,?)',
      [f.cita_id||null,f.paciente_id,req.user.id,f.contenido,f.privada?1:0]);
    res.status(201).json({ id: r.lastID });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async function(req, res) {
  try {
    const nota = await db.get('SELECT * FROM notas_clinicas WHERE id=?', [req.params.id]);
    if (!nota) return res.status(404).json({ error: 'No encontrada' });
    if (nota.profesional_id !== req.user.id && req.user.rol !== 'admin') return res.status(403).json({ error: 'Sin permisos' });
    await db.run("UPDATE notas_clinicas SET contenido=?,privada=?,actualizado_en=datetime('now','localtime') WHERE id=?",
      [req.body.contenido, req.body.privada?1:0, req.params.id]);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async function(req, res) {
  try {
    await db.run('DELETE FROM notas_clinicas WHERE id=?', [req.params.id]);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
