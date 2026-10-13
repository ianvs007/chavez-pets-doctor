const { pool, query } = require('../db/pool');

async function getById(id) {
  const rows = await query(
    `SELECT v.*,
            CONCAT(c.nombres, ' ', c.apellidos) AS cliente_nombre,
            c.ci AS cliente_ci,
            c.telefono AS cliente_telefono,
            u.nombre AS cajero_nombre,
            ver.nombre AS verificador_nombre
     FROM ventas v
     JOIN clientes c ON c.id = v.cliente_id
     JOIN usuarios u ON u.id = v.usuario_id
     LEFT JOIN usuarios ver ON ver.id = v.verificador_id
     WHERE v.id = :id`,
    { id }
  );
  if (!rows.length) return null;
  const venta = rows[0];
  venta.detalle = await query(
    'SELECT * FROM ventas_detalle WHERE venta_id = :id ORDER BY id',
    { id }
  );
  return venta;
}

function buildLines(items) {
  if (!Array.isArray(items) || !items.length) {
    const err = new Error('La venta requiere al menos una línea');
    err.status = 400;
    throw err;
  }
  return items.map((item) => {
    const cantidad = Number(item.cantidad || 1);
    const precio = Number(item.precio_unitario);
    if (!item.descripcion || Number.isNaN(precio) || cantidad <= 0) {
      const err = new Error('Línea de venta inválida');
      err.status = 400;
      throw err;
    }
    return {
      servicio_id: item.servicio_id || null,
      descripcion: item.descripcion,
      cantidad,
      precio_unitario: precio,
      subtotal: Math.round(cantidad * precio * 100) / 100,
    };
  });
}

async function nextReciboNumber(conn) {
  const [rows] = await conn.execute(
    `SELECT COUNT(*) AS n FROM ventas WHERE estado_pago = 'pagado' AND DATE(fecha) = CURDATE()`
  );
  const n = Number(rows[0].n) + 1;
  const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `RCP-${ymd}-${String(n).padStart(4, '0')}`;
}

async function insertVenta(conn, payload, lines) {
  const subtotal = lines.reduce((s, l) => s + l.subtotal, 0);
  const descuento = Number(payload.descuento || 0);
  const total = Math.round((subtotal - descuento) * 100) / 100;
  if (total < 0) {
    const err = new Error('Total inválido');
    err.status = 400;
    throw err;
  }

  const [result] = await conn.execute(
    `INSERT INTO ventas (
      numero_recibo, cliente_id, usuario_id, fecha, metodo_pago, estado_pago,
      subtotal, descuento, total, monto_recibido, vuelto,
      comprobante_path, referencia_pago, banco_origen, notas
    ) VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.numero_recibo || null,
      payload.cliente_id,
      payload.usuario_id,
      payload.metodo_pago,
      payload.estado_pago,
      subtotal,
      descuento,
      total,
      payload.monto_recibido ?? null,
      payload.vuelto ?? null,
      payload.comprobante_path || null,
      payload.referencia_pago || null,
      payload.banco_origen || null,
      payload.notas || null,
    ]
  );

  const ventaId = result.insertId;
  for (const line of lines) {
    await conn.execute(
      `INSERT INTO ventas_detalle
        (venta_id, servicio_id, descripcion, cantidad, precio_unitario, subtotal)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        ventaId,
        line.servicio_id,
        line.descripcion,
        line.cantidad,
        line.precio_unitario,
        line.subtotal,
      ]
    );
  }
  return ventaId;
}

async function crearEfectivo({ cliente_id, usuario_id, items, descuento, monto_recibido, notas }) {
  const lines = buildLines(items);
  const subtotal = lines.reduce((s, l) => s + l.subtotal, 0);
  const desc = Number(descuento || 0);
  const total = Math.round((subtotal - desc) * 100) / 100;
  const recibido = Number(monto_recibido);
  if (Number.isNaN(recibido) || recibido < total) {
    const err = new Error('Monto recibido insuficiente');
    err.status = 400;
    throw err;
  }
  const vuelto = Math.round((recibido - total) * 100) / 100;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const numero = await nextReciboNumber(conn);
    const id = await insertVenta(
      conn,
      {
        numero_recibo: numero,
        cliente_id,
        usuario_id,
        metodo_pago: 'efectivo',
        estado_pago: 'pagado',
        descuento: desc,
        monto_recibido: recibido,
        vuelto,
        notas,
      },
      lines
    );
    await conn.commit();
    return getById(id);
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

async function crearQr({ cliente_id, usuario_id, items, descuento, referencia_pago, banco_origen, notas }) {
  const lines = buildLines(items);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const id = await insertVenta(
      conn,
      {
        cliente_id,
        usuario_id,
        metodo_pago: 'qr',
        estado_pago: 'pendiente_verificacion',
        descuento: Number(descuento || 0),
        referencia_pago,
        banco_origen,
        notas,
      },
      lines
    );
    await conn.commit();
    return getById(id);
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

async function subirComprobante(id, { comprobante_path, referencia_pago, banco_origen }) {
  const venta = await getById(id);
  if (!venta) {
    const err = new Error('Venta no encontrada');
    err.status = 404;
    throw err;
  }
  if (venta.metodo_pago !== 'qr') {
    const err = new Error('Solo ventas QR aceptan comprobante');
    err.status = 400;
    throw err;
  }
  if (venta.estado_pago === 'pagado') {
    const err = new Error('La venta ya está pagada');
    err.status = 400;
    throw err;
  }
  await query(
    `UPDATE ventas SET
      comprobante_path = :comprobante_path,
      referencia_pago = COALESCE(:referencia_pago, referencia_pago),
      banco_origen = COALESCE(:banco_origen, banco_origen),
      estado_pago = 'pendiente_verificacion',
      motivo_rechazo = NULL
     WHERE id = :id`,
    {
      id,
      comprobante_path,
      referencia_pago: referencia_pago || null,
      banco_origen: banco_origen || null,
    }
  );
  return getById(id);
}

async function confirmarPago(id, verificadorId) {
  const venta = await getById(id);
  if (!venta) {
    const err = new Error('Venta no encontrada');
    err.status = 404;
    throw err;
  }
  if (venta.estado_pago !== 'pendiente_verificacion') {
    const err = new Error('La venta no está pendiente de verificación');
    err.status = 400;
    throw err;
  }
  if (!venta.comprobante_path) {
    const err = new Error('Falta comprobante de pago');
    err.status = 400;
    throw err;
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const numero = await nextReciboNumber(conn);
    await conn.execute(
      `UPDATE ventas SET
        estado_pago = 'pagado',
        numero_recibo = ?,
        verificador_id = ?,
        fecha_verificacion = NOW(),
        motivo_rechazo = NULL
       WHERE id = ?`,
      [numero, verificadorId, id]
    );
    await conn.commit();
    return getById(id);
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

async function rechazarPago(id, verificadorId, motivo) {
  const venta = await getById(id);
  if (!venta) {
    const err = new Error('Venta no encontrada');
    err.status = 404;
    throw err;
  }
  if (venta.estado_pago !== 'pendiente_verificacion') {
    const err = new Error('La venta no está pendiente de verificación');
    err.status = 400;
    throw err;
  }
  if (!motivo) {
    const err = new Error('Motivo de rechazo requerido');
    err.status = 400;
    throw err;
  }
  await query(
    `UPDATE ventas SET
      estado_pago = 'rechazado',
      verificador_id = :verificadorId,
      fecha_verificacion = NOW(),
      motivo_rechazo = :motivo
     WHERE id = :id`,
    { id, verificadorId, motivo }
  );
  return getById(id);
}

async function list({ estado, fecha, metodo } = {}) {
  const clauses = ['1=1'];
  const params = {};
  if (estado) {
    clauses.push('v.estado_pago = :estado');
    params.estado = estado;
  }
  if (fecha) {
    clauses.push('DATE(v.fecha) = :fecha');
    params.fecha = fecha;
  }
  if (metodo) {
    clauses.push('v.metodo_pago = :metodo');
    params.metodo = metodo;
  }
  return query(
    `SELECT v.*, CONCAT(c.nombres, ' ', c.apellidos) AS cliente_nombre, u.nombre AS cajero_nombre
     FROM ventas v
     JOIN clientes c ON c.id = v.cliente_id
     JOIN usuarios u ON u.id = v.usuario_id
     WHERE ${clauses.join(' AND ')}
     ORDER BY v.fecha DESC`,
    params
  );
}

async function recibo(id) {
  const venta = await getById(id);
  if (!venta) {
    const err = new Error('Venta no encontrada');
    err.status = 404;
    throw err;
  }
  if (venta.estado_pago !== 'pagado') {
    const err = new Error('Recibo disponible solo cuando el pago está confirmado (pagado)');
    err.status = 400;
    throw err;
  }
  const configRows = await query('SELECT * FROM configuracion_clinica ORDER BY id ASC LIMIT 1');
  return { clinica: configRows[0] || null, venta };
}

async function arqueoDiario(fecha) {
  const day = fecha || new Date().toISOString().slice(0, 10);
  const resumen = await query(
    `SELECT
       metodo_pago,
       estado_pago,
       COUNT(*) AS cantidad,
       COALESCE(SUM(total), 0) AS monto
     FROM ventas
     WHERE DATE(fecha) = :day
     GROUP BY metodo_pago, estado_pago
     ORDER BY metodo_pago, estado_pago`,
    { day }
  );
  const pagados = await query(
    `SELECT COALESCE(SUM(total), 0) AS total_pagado,
            COALESCE(SUM(CASE WHEN metodo_pago = 'efectivo' THEN total ELSE 0 END), 0) AS efectivo,
            COALESCE(SUM(CASE WHEN metodo_pago = 'qr' THEN total ELSE 0 END), 0) AS qr,
            COUNT(*) AS tickets
     FROM ventas
     WHERE DATE(fecha) = :day AND estado_pago = 'pagado'`,
    { day }
  );
  const pendientes = await query(
    `SELECT COUNT(*) AS n, COALESCE(SUM(total), 0) AS monto
     FROM ventas
     WHERE DATE(fecha) = :day AND estado_pago = 'pendiente_verificacion'`,
    { day }
  );
  const detalle = await query(
    `SELECT v.id, v.numero_recibo, v.fecha, v.metodo_pago, v.estado_pago, v.total,
            CONCAT(c.nombres, ' ', c.apellidos) AS cliente_nombre
     FROM ventas v
     JOIN clientes c ON c.id = v.cliente_id
     WHERE DATE(v.fecha) = :day
     ORDER BY v.fecha`,
    { day }
  );
  return {
    fecha: day,
    resumen,
    totales_pagados: pagados[0],
    pendientes: pendientes[0],
    detalle,
  };
}

module.exports = {
  getById,
  list,
  crearEfectivo,
  crearQr,
  subirComprobante,
  confirmarPago,
  rechazarPago,
  recibo,
  arqueoDiario,
};
