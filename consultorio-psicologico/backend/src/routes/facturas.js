const router = require('express').Router();
const db = require('../db/connection');
const { auth, requireFacturacion } = require('../middleware/auth');

// Todos los endpoints de facturación requieren autenticación y rol de facturación/admin
router.use(auth);

/**
 * FACTURAS
 */

// Listar todas las facturas
// GET /api/facturas
// Permisos: admin, facturacion
router.get('/', requireFacturacion, async (req, res) => {
  try {
    const facturas = await db.all(`
      SELECT 
        f.id, 
        f.numero_factura,
        f.fecha,
        f.monto_total,
        f.estado,
        p.nombre as paciente,
        u.nombre as profesional
      FROM facturas f
      LEFT JOIN pacientes p ON f.paciente_id = p.id
      LEFT JOIN usuarios u ON f.profesional_id = u.id
      ORDER BY f.fecha DESC
    `, []);

    res.json(facturas);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Crear nueva factura
// POST /api/facturas
// Permisos: admin, facturacion
// Body: { paciente_id, profesional_id, items: [...], monto_total, notas? }
router.post('/', requireFacturacion, async (req, res) => {
  try {
    const { paciente_id, profesional_id, items, monto_total, notas } = req.body;

    if (!paciente_id || !items || !monto_total) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }

    // Generar número de factura único
    const ultimaFactura = await db.get(
      'SELECT MAX(CAST(numero_factura AS INTEGER)) as max FROM facturas'
    );
    const numero = (ultimaFactura?.max || 0) + 1;

    const result = await db.run(`
      INSERT INTO facturas 
      (numero_factura, paciente_id, profesional_id, fecha, monto_total, estado, notas, creada_por)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [numero, paciente_id, profesional_id, new Date().toISOString(), monto_total, 'pendiente', notas, req.user.id]);

    // Guardar items de la factura
    for (const item of items) {
      await db.run(`
        INSERT INTO factura_items 
        (factura_id, descripcion, cantidad, precio_unitario, subtotal)
        VALUES (?, ?, ?, ?, ?)
      `, [result.lastID, item.descripcion, item.cantidad, item.precio_unitario, item.subtotal]);
    }

    res.status(201).json({
      id: result.lastID,
      numero_factura: numero,
      mensaje: 'Factura creada correctamente'
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Obtener detalle de factura
// GET /api/facturas/:id
// Permisos: admin, facturacion
router.get('/:id', requireFacturacion, async (req, res) => {
  try {
    const factura = await db.get(`
      SELECT 
        f.*,
        p.nombre as paciente,
        p.email as paciente_email,
        p.telefono as paciente_telefono,
        u.nombre as profesional,
        u.email as profesional_email
      FROM facturas f
      LEFT JOIN pacientes p ON f.paciente_id = p.id
      LEFT JOIN usuarios u ON f.profesional_id = u.id
      WHERE f.id = ?
    `, [req.params.id]);

    if (!factura) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }

    const items = await db.all(
      'SELECT * FROM factura_items WHERE factura_id = ?',
      [req.params.id]
    );

    res.json({ ...factura, items });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Marcar factura como pagada
// PATCH /api/facturas/:id/pagar
// Permisos: admin, facturacion
// Body: { fecha_pago?, metodo_pago?, referencia? }
router.patch('/:id/pagar', requireFacturacion, async (req, res) => {
  try {
    const { fecha_pago, metodo_pago, referencia } = req.body;

    await db.run(`
      UPDATE facturas 
      SET 
        estado = ?,
        fecha_pago = ?,
        metodo_pago = ?,
        referencia_pago = ?,
        actualizado_en = CURRENT_TIMESTAMP
      WHERE id = ?
    `, ['pagada', fecha_pago || new Date().toISOString(), metodo_pago, referencia, req.params.id]);

    res.json({ ok: true, mensaje: 'Factura marcada como pagada' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * PAGOS
 */

// Listar pagos de un paciente
// GET /api/pagos?paciente_id=...
// Permisos: admin, facturacion
router.get('/registro/pagos', requireFacturacion, async (req, res) => {
  try {
    const { paciente_id } = req.query;

    let query = `
      SELECT 
        p.*,
        pac.nombre as paciente,
        f.numero_factura
      FROM pagos p
      LEFT JOIN pacientes pac ON p.paciente_id = pac.id
      LEFT JOIN facturas f ON p.factura_id = f.id
      WHERE 1=1
    `;

    const params = [];

    if (paciente_id) {
      query += ' AND p.paciente_id = ?';
      params.push(paciente_id);
    }

    query += ' ORDER BY p.fecha DESC';

    const pagos = await db.all(query, params);
    res.json(pagos);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * REPORTES DE CONTABILIDAD
 */

// Reporte de ingresos por mes
// GET /api/contabilidad/ingresos?mes=2024-01
// Permisos: admin, facturacion
router.get('/contabilidad/ingresos', requireFacturacion, async (req, res) => {
  try {
    const { mes } = req.query;

    let filtro = 'f.estado = "pagada"';
    const params = [];

    if (mes) {
      filtro += ' AND strftime("%Y-%m", f.fecha_pago) = ?';
      params.push(mes);
    }

    const ingresos = await db.get(`
      SELECT 
        COUNT(*) as total_facturas,
        SUM(f.monto_total) as monto_total,
        AVG(f.monto_total) as monto_promedio,
        MIN(f.monto_total) as monto_minimo,
        MAX(f.monto_total) as monto_maximo
      FROM facturas f
      WHERE ${filtro}
    `, params);

    res.json(ingresos);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Reporte de facturación por profesional
// GET /api/contabilidad/por-profesional?mes=2024-01
// Permisos: admin, facturacion
router.get('/contabilidad/por-profesional', requireFacturacion, async (req, res) => {
  try {
    const { mes } = req.query;

    let filtro = '1=1';
    const params = [];

    if (mes) {
      filtro += ' AND strftime("%Y-%m", f.fecha) = ?';
      params.push(mes);
    }

    const datos = await db.all(`
      SELECT 
        u.nombre as profesional,
        COUNT(f.id) as total_facturas,
        SUM(f.monto_total) as monto_total,
        SUM(CASE WHEN f.estado = 'pagada' THEN 1 ELSE 0 END) as facturas_pagadas,
        SUM(CASE WHEN f.estado = 'pendiente' THEN f.monto_total ELSE 0 END) as pendiente
      FROM facturas f
      LEFT JOIN usuarios u ON f.profesional_id = u.id
      WHERE ${filtro}
      GROUP BY f.profesional_id, u.nombre
      ORDER BY monto_total DESC
    `, params);

    res.json(datos);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * HISTORIAL DE CUENTAS POR COBRAR
 */

// GET /api/contabilidad/cuentas-por-cobrar
// Permisos: admin, facturacion
router.get('/contabilidad/cuentas-por-cobrar', requireFacturacion, async (req, res) => {
  try {
    const datos = await db.all(`
      SELECT 
        p.id,
        p.nombre as paciente,
        SUM(f.monto_total) as monto_adeudado,
        COUNT(f.id) as facturas_pendientes,
        MAX(f.fecha) as factura_mas_antigua,
        CAST((julianday('now') - julianday(MAX(f.fecha))) AS INTEGER) as dias_adeudados
      FROM facturas f
      LEFT JOIN pacientes p ON f.paciente_id = p.id
      WHERE f.estado = 'pendiente'
      GROUP BY p.id, p.nombre
      ORDER BY monto_adeudado DESC
    `, []);

    res.json(datos);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
