const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/connection');
const { auth } = require('../middleware/auth');

const SECRET = process.env.JWT_SECRET || 'consultorio_secret_2024';

router.post('/login', async function(req, res) {
  try {
    const email = req.body.email;
    const password = req.body.password;
    if (!email || !password) return res.status(400).json({ error: 'Email y contrasena requeridos' });

    const user = await db.get('SELECT * FROM usuarios WHERE email = ? AND activo = 1', [email.toLowerCase().trim()]);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }
    const token = jwt.sign(
      { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol },
      SECRET, { expiresIn: '12h' }
    );
    res.json({ token: token, user: { id: user.id, nombre: user.nombre, apellido: user.apellido, email: user.email, rol: user.rol } });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/me', auth, async function(req, res) {
  try {
    const user = await db.get('SELECT id, nombre, apellido, email, rol FROM usuarios WHERE id = ?', [req.user.id]);
    res.json(user);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.put('/cambiar-password', auth, async function(req, res) {
  try {
    const user = await db.get('SELECT * FROM usuarios WHERE id = ?', [req.user.id]);
    if (!bcrypt.compareSync(req.body.actual, user.password)) {
      return res.status(400).json({ error: 'Contrasena actual incorrecta' });
    }
    const hash = bcrypt.hashSync(req.body.nueva, 10);
    await db.run('UPDATE usuarios SET password = ? WHERE id = ?', [hash, req.user.id]);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
