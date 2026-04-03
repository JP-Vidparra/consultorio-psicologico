const router = require('express').Router();
const db = require('../db/connection');
const { auth } = require('../middleware/auth');
router.use(auth);

router.get('/', async function(req, res) {
  try {
    const pid = req.query.paciente_id;
    let rows;
    if (pid) {
      rows = await db.all('SELECT c.*,pl.nombre as plan_nombre,pl.num_sesiones,(p.nombre||" "||p.apellido) as paciente_nombre,u.nombre as profesional_nombre FROM contratos c JOIN planes pl ON c.plan_id=pl.id JOIN pacientes p ON c.paciente_id=p.id LEFT JOIN usuarios u ON c.profesional_id=u.id WHERE c.paciente_id=? ORDER BY c.creado_en DESC', [pid]);
    } else {
      rows = await db.all('SELECT c.*,pl.nombre as plan_nombre,pl.num_sesiones,(p.nombre||" "||p.apellido) as paciente_nombre,u.nombre as profesional_nombre FROM contratos c JOIN planes pl ON c.plan_id=pl.id JOIN pacientes p ON c.paciente_id=p.id LEFT JOIN usuarios u ON c.profesional_id=u.id ORDER BY c.creado_en DESC', []);
    }
    res.json(rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async function(req, res) {
  try {
    const f = req.body;
    if (!f.paciente_id || !f.plan_id || f.precio_pagado === undefined) return res.status(400).json({ error: 'Datos incompletos' });
    const plan = await db.get('SELECT * FROM planes WHERE id=?', [f.plan_id]);
    if (!plan) return res.status(404).json({ error: 'Plan no encontrado' });
    const vence = new Date();
    vence.setDate(vence.getDate() + plan.vigencia_dias);
    const fechaVence = vence.toISOString().split('T')[0];
    const r = await db.run('INSERT INTO contratos (paciente_id,plan_id,profesional_id,sesiones_total,fecha_vence,precio_pagado,notas) VALUES (?,?,?,?,?,?,?)',
      [f.paciente_id,f.plan_id,f.profesional_id||null,plan.num_sesiones,fechaVence,f.precio_pagado,f.notas||null]);
    const num = 'F-' + String(r.lastID).padStart(5,'0');
    await db.run('INSERT INTO facturas (contrato_id,paciente_id,numero,monto) VALUES (?,?,?,?)', [r.lastID,f.paciente_id,num,f.precio_pagado]);
    res.status(201).json({ id: r.lastID, factura_numero: num });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id/estado', async function(req, res) {
  try {
    await db.run('UPDATE contratos SET estado=? WHERE id=?', [req.body.estado, req.params.id]);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
