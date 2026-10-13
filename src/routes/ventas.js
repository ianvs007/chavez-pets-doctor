const express = require('express');
const ctrl = require('../controllers/ventasController');
const { authenticate, requireRole } = require('../middlewares/auth');
const { uploadComprobante } = require('../middlewares/upload');

const router = express.Router();
const both = [authenticate, requireRole(['veterinario', 'asistente'])];

router.get('/', ...both, ctrl.list);
router.get('/arqueo', ...both, ctrl.arqueo);
router.get('/:id', ...both, ctrl.get);
router.get('/:id/recibo', ...both, ctrl.recibo);
router.post('/efectivo', ...both, ctrl.crearEfectivo);
router.post('/qr', ...both, ctrl.crearQr);
router.post('/:id/comprobante', ...both, uploadComprobante.single('comprobante'), ctrl.subirComprobante);
router.post('/:id/confirmar', ...both, ctrl.confirmar);
router.post('/:id/rechazar', ...both, ctrl.rechazar);

module.exports = router;
