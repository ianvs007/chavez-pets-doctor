const express = require('express');
const ctrl = require('../controllers/campanasController');
const { authenticate, requireRole } = require('../middlewares/auth');

const router = express.Router();
const both = [authenticate, requireRole(['veterinario', 'asistente'])];

router.get('/', ...both, ctrl.list);
router.get('/:id', ...both, ctrl.get);
router.post('/', ...both, ctrl.create);
router.put('/:id', ...both, ctrl.update);
router.delete('/:id', ...both, ctrl.remove);

router.get('/:id/participantes', ...both, ctrl.listParticipantes);
router.post('/:id/participantes', ...both, ctrl.addParticipante);
router.patch('/:id/participantes/:participanteId', ...both, ctrl.updateParticipante);
router.delete('/:id/participantes/:participanteId', ...both, ctrl.removeParticipante);

module.exports = router;
