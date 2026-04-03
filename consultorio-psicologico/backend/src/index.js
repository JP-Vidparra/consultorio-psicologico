require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

app.use('/api/auth',      require('./routes/auth'));
app.use('/api/usuarios',  require('./routes/usuarios'));
app.use('/api/pacientes', require('./routes/pacientes'));
app.use('/api/planes',    require('./routes/planes'));
app.use('/api/contratos', require('./routes/contratos'));
app.use('/api/citas',     require('./routes/citas'));
app.use('/api/notas',     require('./routes/notas'));
app.use('/api/facturas',  require('./routes/facturas'));
app.use('/api/dashboard', require('./routes/dashboard'));

app.get('/api/health', function(req, res) { res.json({ ok: true }); });

app.listen(PORT, function() {
  console.log('Sistema Consultorio - Backend corriendo en puerto ' + PORT);
  console.log('http://localhost:' + PORT + '/api/health');
});
