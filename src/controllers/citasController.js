const service = require('../services/citasService');

async function list(req, res, next) {
  try {
    res.json(
      await service.list({
        fecha: req.query.fecha,
        estado: req.query.estado,
        desde: req.query.desde,
        hasta: req.query.hasta,
      })
    );
  } catch (e) {
    next(e);
  }
}

async function get(req, res, next) {
  try {
    const row = await service.getById(req.params.id);
    if (!row) return res.status(404).json({ error: 'Cita no encontrada' });
    return res.json(row);
  } catch (e) {
    return next(e);
  }
}

async function create(req, res, next) {
  try {
    const { paciente_id, cliente_id, fecha_hora } = req.body || {};
    if (!paciente_id || !cliente_id || !fecha_hora) {
      return res.status(400).json({ error: 'paciente_id, cliente_id y fecha_hora son requeridos' });
    }
    return res.status(201).json(await service.create(req.body));
  } catch (e) {
    return next(e);
  }
}

async function update(req, res, next) {
  try {
    return res.json(await service.update(req.params.id, req.body || {}));
  } catch (e) {
    return next(e);
  }
}

async function remove(req, res, next) {
  try {
    return res.json(await service.remove(req.params.id));
  } catch (e) {
    return next(e);
  }
}

module.exports = { list, get, create, update, remove };
