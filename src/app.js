const path = require('path');
const express = require('express');
const cors = require('cors');
const { errorHandler } = require('./middlewares/errorHandler');

const authRoutes = require('./routes/auth');
const configRoutes = require('./routes/configuracion');
const clientesRoutes = require('./routes/clientes');
const pacientesRoutes = require('./routes/pacientes');
const citasRoutes = require('./routes/citas');
const serviciosRoutes = require('./routes/servicios');
const ventasRoutes = require('./routes/ventas');

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.static(path.join(__dirname, '../public')));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, clinic: "Chavez Pet's Doctor Veterinaria" });
});

app.use('/api/auth', authRoutes);
app.use('/api/configuracion', configRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/pacientes', pacientesRoutes);
app.use('/api/citas', citasRoutes);
app.use('/api/servicios', serviciosRoutes);
app.use('/api/ventas', ventasRoutes);

app.use(errorHandler);

module.exports = app;
