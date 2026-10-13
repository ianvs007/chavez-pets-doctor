const service = require('../services/pacientesService');

async function list(req, res, next) {
  try {
    res.json(
      await service.list({
        clienteId: req.query.cliente_id,
        q: req.query.q,
      })
    );
  } catch (e) {
    next(e);
  }
}

async function get(req, res, next) {
  try {
    const row = await service.getById(req.params.id);
    if (!row) return res.status(404).json({ error: 'Paciente no encontrado' });
    return res.json(row);
  } catch (e) {
    return next(e);
  }
}

async function create(req, res, next) {
  try {
    const { cliente_id, nombre, especie } = req.body || {};
    if (!cliente_id || !nombre || !especie) {
      return res.status(400).json({ error: 'cliente_id, nombre y especie son requeridos' });
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
