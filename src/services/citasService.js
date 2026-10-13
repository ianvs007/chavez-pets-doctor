const { query } = require('../db/pool');

async function list({ fecha, estado, desde, hasta } = {}) {
  const clauses = ['1=1'];
  const params = {};
  if (fecha) {
    clauses.push('DATE(c.fecha_hora) = :fecha');
    params.fecha = fecha;
  }
  if (desde) {
    clauses.push('c.fecha_hora >= :desde');
    params.desde = desde;
  }
  if (hasta) {
    clauses.push('c.fecha_hora <= :hasta');
    params.hasta = hasta;
  }
  if (estado) {
    clauses.push('c.estado = :estado');
    params.estado = estado;
  }
  return query(
    `SELECT c.*,
            p.nombre AS paciente_nombre,
            p.especie AS paciente_especie,
            CONCAT(cl.nombres, ' ', cl.apellidos) AS cliente_nombre,
            u.nombre AS veterinario_nombre
     FROM citas c
     JOIN pacientes p ON p.id = c.paciente_id
     JOIN clientes cl ON cl.id = c.cliente_id
     LEFT JOIN usuarios u ON u.id = c.veterinario_id
     WHERE ${clauses.join(' AND ')}
     ORDER BY c.fecha_hora ASC`,
    params
  );
}

async function getById(id) {
  const rows = await query(
    `SELECT c.*,
            p.nombre AS paciente_nombre,
            CONCAT(cl.nombres, ' ', cl.apellidos) AS cliente_nombre
     FROM citas c
     JOIN pacientes p ON p.id = c.paciente_id
     JOIN clientes cl ON cl.id = c.cliente_id
     WHERE c.id = :id`,
    { id }
  );
  return rows[0] || null;
}

async function create(data) {
  const result = await query(
    `INSERT INTO citas
      (paciente_id, cliente_id, veterinario_id, fecha_hora, tipo, motivo, estado, notas)
     VALUES
      (:paciente_id, :cliente_id, :veterinario_id, :fecha_hora, :tipo, :motivo, :estado, :notas)`,
    {
      paciente_id: data.paciente_id,
      cliente_id: data.cliente_id,
      veterinario_id: data.veterinario_id || null,
      fecha_hora: data.fecha_hora,
      tipo: data.tipo || 'consulta',
      motivo: data.motivo || null,
      estado: data.estado || 'programada',
      notas: data.notas || null,
    }
  );
  return getById(result.insertId);
}

async function update(id, data) {
  const existing = await getById(id);
  if (!existing) {
    const err = new Error('Cita no encontrada');
    err.status = 404;
    throw err;
  }
  await query(
    `UPDATE citas SET
      paciente_id = :paciente_id,
      cliente_id = :cliente_id,
      veterinario_id = :veterinario_id,
      fecha_hora = :fecha_hora,
      tipo = :tipo,
      motivo = :motivo,
      estado = :estado,
      notas = :notas
     WHERE id = :id`,
    {
      id,
      paciente_id: data.paciente_id ?? existing.paciente_id,
      cliente_id: data.cliente_id ?? existing.cliente_id,
      veterinario_id: data.veterinario_id ?? existing.veterinario_id,
      fecha_hora: data.fecha_hora ?? existing.fecha_hora,
      tipo: data.tipo ?? existing.tipo,
      motivo: data.motivo ?? existing.motivo,
      estado: data.estado ?? existing.estado,
      notas: data.notas ?? existing.notas,
    }
  );
  return getById(id);
}

async function remove(id) {
  const existing = await getById(id);
  if (!existing) {
    const err = new Error('Cita no encontrada');
    err.status = 404;
    throw err;
  }
  await query('DELETE FROM citas WHERE id = :id', { id });
  return { ok: true };
}

module.exports = { list, getById, create, update, remove };
