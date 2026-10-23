const express = require('express');
const ctrl = require('../controllers/pacientesController');
const { authenticate, requireRole } = require('../middlewares/auth');

const router = express.Router();
const both = [authenticate, requireRole(['veterinario', 'asistente'])];

router.get('/', ...both, ctrl.list);
router.get('/:id', ...both, ctrl.get);
router.post('/', ...both, ctrl.create);
router.put('/:id', ...both, ctrl.update);
router.delete('/:id', ...both, ctrl.remove);

router.get('/:id/historial', ...both, ctrl.getHistorial);
router.get('/:id/atenciones', ...both, ctrl.listAtenciones);
router.post('/:id/atenciones', ...both, ctrl.createAtencion);

module.exports = router;
