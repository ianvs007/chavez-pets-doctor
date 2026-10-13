const configService = require('../services/configService');

async function getQr(req, res, next) {
  try {
    const cfg = await configService.getConfig();
    return res.json(cfg);
  } catch (err) {
    return next(err);
  }
}

async function postQr(req, res, next) {
  try {
    const qrPath = req.file ? `/uploads/qr-clinica/${req.file.filename}` : undefined;
    const updated = await configService.updateQrCobro({
      qrPath,
      bancoNombre: req.body.banco_nombre,
      cuentaInfo: req.body.cuenta_info,
    });
    return res.json(updated);
  } catch (err) {
    return next(err);
  }
}

module.exports = { getQr, postQr };
