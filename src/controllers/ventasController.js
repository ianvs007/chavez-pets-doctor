const service = require('../services/ventasService');

async function list(req, res, next) {
  try {
    res.json(
      await service.list({
        estado: req.query.estado,
        fecha: req.query.fecha,
        metodo: req.query.metodo,
      })
    );
  } catch (e) {
    next(e);
  }
}

async function get(req, res, next) {
  try {
    const row = await service.getById(req.params.id);
    if (!row) return res.status(404).json({ error: 'Venta no encontrada' });
    return res.json(row);
  } catch (e) {
    return next(e);
  }
}

async function crearEfectivo(req, res, next) {
  try {
    const body = req.body || {};
    if (!body.cliente_id || !body.items) {
      return res.status(400).json({ error: 'cliente_id e items son requeridos' });
    }
    const venta = await service.crearEfectivo({
      ...body,
      usuario_id: req.user.id,
    });
    return res.status(201).json(venta);
  } catch (e) {
    return next(e);
  }
}

async function crearQr(req, res, next) {
  try {
    const body = req.body || {};
    if (!body.cliente_id || !body.items) {
      return res.status(400).json({ error: 'cliente_id e items son requeridos' });
    }
    const venta = await service.crearQr({
      ...body,
      usuario_id: req.user.id,
    });
    return res.status(201).json(venta);
  } catch (e) {
    return next(e);
  }
}

async function subirComprobante(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Archivo de comprobante requerido' });
    }
    const venta = await service.subirComprobante(req.params.id, {
      comprobante_path: `/uploads/comprobantes-pago/${req.file.filename}`,
      referencia_pago: req.body.referencia_pago,
      banco_origen: req.body.banco_origen,
    });
    return res.json(venta);
  } catch (e) {
    return next(e);
  }
}

async function confirmar(req, res, next) {
  try {
    return res.json(await service.confirmarPago(req.params.id, req.user.id));
  } catch (e) {
    return next(e);
  }
}

async function rechazar(req, res, next) {
  try {
    const motivo = (req.body && req.body.motivo) || '';
    return res.json(await service.rechazarPago(req.params.id, req.user.id, motivo));
  } catch (e) {
    return next(e);
  }
}

async function recibo(req, res, next) {
  try {
    return res.json(await service.recibo(req.params.id));
  } catch (e) {
    return next(e);
  }
}

async function arqueo(req, res, next) {
  try {
    return res.json(await service.arqueoDiario(req.query.fecha));
  } catch (e) {
    return next(e);
  }
}

module.exports = {
  list,
  get,
  crearEfectivo,
  crearQr,
  subirComprobante,
  confirmar,
  rechazar,
  recibo,
  arqueo,
};
