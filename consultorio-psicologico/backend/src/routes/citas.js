const router = require('express').Router();
const db = require('../db/connection');
const { auth } = require('../middleware/auth');
router.use(auth);

router.get('/', async function(req, res) {
  try {
    const q = req.query;
    let sql = 'SELECT ci.*,(p.nombre||" "||p.apellido) as paciente_nombre,u.nombre as profesional_nombre FROM citas ci JOIN pacientes p ON ci.paciente_id=p.id JOIN usuarios u ON ci.profesional_id=u.id WHERE 1=1';
    const params = [];
    if (q.fecha_desde) { sql += ' AND ci.fecha>=?'; params.push(q.fecha_desde); }
    if (q.fecha_hasta) { sql += ' AND ci.fecha<=?'; params.push(q.fecha_hasta); }
    if (q.profesional_id) { sql += ' AND ci.profesional_id=?'; params.push(q.profesional_id); }
    if (q.paciente_id) { sql += ' AND ci.paciente_id=?'; params.push(q.paciente_id); }
    sql += ' ORDER BY ci.fecha,ci.hora_inicio';
    res.json(await db.all(sql, params));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async function(req, res) {
  try {
    const f = req.body;
    if (!f.paciente_id||!f.profesional_id||!f.fecha||!f.hora_inicio||!f.hora_fin) return res.status(400).json({ error: 'Datos incompletos' });
    const conflicto = await db.get("SELECT id FROM citas WHERE profesional_id=? AND fecha=? AND estado NOT IN ('cancelada') AND ((hora_inicio<? AND hora_fin>?) OR (hora_inicio>=? AND hora_inicio<?))",
      [f.profesional_id,f.fecha,f.hora_fin,f.hora_inicio,f.hora_inicio,f.hora_fin]);
    if (conflicto) return res.status(409).json({ error: 'Ya existe una cita en ese horario' });
    const r = await db.run('INSERT INTO citas (paciente_id,profesional_id,contrato_id,fecha,hora_inicio,hora_fin,tipo,notas_previas) VALUES (?,?,?,?,?,?,?,?)',
      [f.paciente_id,f.profesional_id,f.contrato_id||null,f.fecha,f.hora_inicio,f.hora_fin,f.tipo||'sesion',f.notas_previas||null]);
    res.status(201).json({ id: r.lastID });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id/estado', async function(req, res) {
  try {
    const estado = req.body.estado;
    const cita = await db.get('SELECT * FROM citas WHERE id=?', [req.params.id]);
    if (!cita) return res.status(404).json({ error: 'No encontrada' });
    await db.run('UPDATE citas SET estado=? WHERE id=?', [estado, req.params.id]);
    if (estado === 'completada' && cita.contrato_id) {
      await db.run('UPDATE contratos SET sesiones_usadas=sesiones_usadas+1 WHERE id=?', [cita.contrato_id]);
      const contrato = await db.get('SELECT * FROM contratos WHERE id=?', [cita.contrato_id]);
      if (contrato && contrato.sesiones_usadas >= contrato.sesiones_total) {
        await db.run("UPDATE contratos SET estado='completado' WHERE id=?", [cita.contrato_id]);
      }
    }
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async function(req, res) {
  try {
    const f = req.body;
    await db.run('UPDATE citas SET fecha=?,hora_inicio=?,hora_fin=?,tipo=?,notas_previas=?,profesional_id=? WHERE id=?',
      [f.fecha,f.hora_inicio,f.hora_fin,f.tipo,f.notas_previas||null,f.profesional_id,req.params.id]);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async function(req, res) {
  try {
    const cita = await db.get('SELECT * FROM citas WHERE id=?', [req.params.id]);
    if (!cita) return res.status(404).json({ error: 'No encontrada' });

    // Si viene el flag "definitivo=true", borrar el registro completamente
    // Usar solo para citas mal programadas que nunca ocurrieron
    if (req.query.definitivo === 'true') {
      // Solo se puede eliminar definitivamente si está programada (nunca se completó)
      if (cita.estado === 'completada') {
        return res.status(409).json({ error: 'No se puede eliminar una cita completada. Usa cancelar en su lugar.' });
      }
      // Evitar borrar si tiene notas clínicas asociadas
      const tieneNotas = await db.get('SELECT COUNT(*) as n FROM notas_clinicas WHERE cita_id=?', [req.params.id]);
      if (tieneNotas.n > 0) {
        return res.status(409).json({ error: 'Esta cita tiene notas clínicas asociadas. Cancélala en lugar de eliminarla.' });
      }
      await db.run('DELETE FROM citas WHERE id=?', [req.params.id]);
      return res.json({ ok: true, eliminado: true });
    }

    // Comportamiento por defecto: cancelar (queda en historial)
    await db.run("UPDATE citas SET estado='cancelada' WHERE id=?", [req.params.id]);
    res.json({ ok: true, cancelada: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
