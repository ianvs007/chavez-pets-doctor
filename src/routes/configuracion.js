const express = require('express');
const ctrl = require('../controllers/configController');
const { authenticate, requireRole } = require('../middlewares/auth');
const { uploadQrClinica } = require('../middlewares/upload');

const router = express.Router();

router.get('/qr-cobro', authenticate, requireRole(['veterinario', 'asistente']), ctrl.getQr);
router.post(
  '/qr-cobro',
  authenticate,
  requireRole(['veterinario']),
  uploadQrClinica.single('qr'),
  ctrl.postQr
);

module.exports = router;
