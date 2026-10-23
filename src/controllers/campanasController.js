const service = require('../services/campanasService');

async function list(req, res, next) {
  try {
    const rows = await service.list({
      estado: req.query.estado,
      q: req.query.q,
    });
    return res.json(rows);
  } catch (e) {
    return next(e);
  }
}

async function get(req, res, next) {
  try {
    const row = await service.getById(req.params.id);
    if (!row) return res.status(404).json({ error: 'Campaña no encontrada' });
    return res.json(row);
  } catch (e) {
    return next(e);
  }
}

async function create(req, res, next) {
  try {
    const { titulo, fecha_inicio } = req.body || {};
    if (!titulo || !fecha_inicio) {
      return res.status(400).json({ error: 'Título y fecha_inicio son requeridos' });
    }
    const campana = await service.create(req.body);
    return res.status(201).json(campana);
  } catch (e) {
    return next(e);
  }
}

async function update(req, res, next) {
  try {
    const campana = await service.update(req.params.id, req.body || {});
    return res.json(campana);
  } catch (e) {
    return next(e);
  }
}

async function remove(req, res, next) {
  try {
    const result = await service.remove(req.params.id);
    return res.json(result);
  } catch (e) {
    return next(e);
  }
}

async function listParticipantes(req, res, next) {
  try {
    const participantes = await service.listParticipantes(req.params.id);
    return res.json(participantes);
  } catch (e) {
    return next(e);
  }
}

async function addParticipante(req, res, next) {
  try {
    const { tutor_nombre, mascota_nombre } = req.body || {};
    if (!tutor_nombre || !mascota_nombre) {
      return res.status(400).json({ error: 'tutor_nombre y mascota_nombre son requeridos' });
    }
    const part = await service.addParticipante(req.params.id, req.body);
    return res.status(201).json(part);
  } catch (e) {
    return next(e);
  }
}

async function updateParticipante(req, res, next) {
  try {
    const part = await service.updateParticipante(req.params.participanteId, req.body);
    return res.json(part);
  } catch (e) {
    return next(e);
  }
}

async function removeParticipante(req, res, next) {
  try {
    const result = await service.removeParticipante(req.params.participanteId);
    return res.json(result);
  } catch (e) {
    return next(e);
  }
}

module.exports = {
  list,
  get,
  create,
  update,
  remove,
  listParticipantes,
  addParticipante,
  updateParticipante,
  removeParticipante,
};
