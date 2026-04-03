const router = require('express').Router();
const db = require('../db/connection');
const { auth } = require('../middleware/auth');
router.use(auth);

router.get('/', async function(req, res) {
  try {
    const hoy = new Date().toISOString().split('T')[0];
    const inicioMes = hoy.slice(0,7) + '-01';
    const stats = {
      pacientes_total:     (await db.get('SELECT COUNT(*) as n FROM pacientes WHERE activo=1', [])).n,
      citas_hoy:           (await db.get("SELECT COUNT(*) as n FROM citas WHERE fecha=? AND estado='programada'", [hoy])).n,
      citas_mes:           (await db.get("SELECT COUNT(*) as n FROM citas WHERE fecha>=? AND estado='completada'", [inicioMes])).n,
      contratos_activos:   (await db.get("SELECT COUNT(*) as n FROM contratos WHERE estado='activo'", [])).n,
      ingresos_mes:        (await db.get("SELECT COALESCE(SUM(monto),0) as n FROM facturas WHERE estado='pagada' AND fecha_pago>=?", [inicioMes])).n,
      facturas_pendientes: (await db.get("SELECT COUNT(*) as n FROM facturas WHERE estado='pendiente'", [])).n,
    };
    const citas_hoy = await db.all('SELECT ci.*,(p.nombre||" "||p.apellido) as paciente_nombre,u.nombre as profesional_nombre FROM citas ci JOIN pacientes p ON ci.paciente_id=p.id JOIN usuarios u ON ci.profesional_id=u.id WHERE ci.fecha=? ORDER BY ci.hora_inicio', [hoy]);
    const proximas = await db.all("SELECT ci.*,(p.nombre||\" \"||p.apellido) as paciente_nombre,u.nombre as profesional_nombre FROM citas ci JOIN pacientes p ON ci.paciente_id=p.id JOIN usuarios u ON ci.profesional_id=u.id WHERE ci.fecha>? AND ci.estado='programada' ORDER BY ci.fecha,ci.hora_inicio LIMIT 10", [hoy]);
    res.json({ stats: stats, citas_hoy: citas_hoy, proximas: proximas });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
