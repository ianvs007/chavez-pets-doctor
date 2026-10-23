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
const campanasRoutes = require('./routes/campanas');

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Always advertise UTF-8 for JSON and HTML (avoids Windows mojibake on accents)
app.use((req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return originalJson(body);
  };
  next();
});

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(
  express.static(path.join(__dirname, '../public'), {
    setHeaders(res, filePath) {
      if (/\.(html?|js|css|json|svg|txt)$/i.test(filePath)) {
        const type = res.getHeader('Content-Type');
        if (typeof type === 'string' && !/charset=/i.test(type)) {
          res.setHeader('Content-Type', `${type}; charset=utf-8`);
        }
      }
    },
  })
);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, clinic: "Patitas al poder" });
});

app.use('/api/auth', authRoutes);
app.use('/api/configuracion', configRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/pacientes', pacientesRoutes);
app.use('/api/citas', citasRoutes);
app.use('/api/servicios', serviciosRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/campanas', campanasRoutes);

app.use(errorHandler);

module.exports = app;
