const { query } = require('../db/pool');

async function list({ clienteId, q } = {}) {
  const clauses = ['1=1'];
  const params = {};
  if (clienteId) {
    clauses.push('p.cliente_id = :clienteId');
    params.clienteId = clienteId;
  }
  if (q) {
    clauses.push('(p.nombre LIKE :like OR p.especie LIKE :like OR p.raza LIKE :like OR c.nombres LIKE :like OR c.apellidos LIKE :like)');
    params.like = `%${q}%`;
  }
  return query(
    `SELECT p.*, CONCAT(c.nombres, ' ', c.apellidos) AS propietario, c.telefono AS propietario_telefono, c.ci AS propietario_ci
     FROM pacientes p
     JOIN clientes c ON c.id = p.cliente_id
     WHERE ${clauses.join(' AND ')}
     ORDER BY p.nombre`,
    params
  );
}

async function getById(id) {
  const rows = await query(
    `SELECT p.*, CONCAT(c.nombres, ' ', c.apellidos) AS propietario, c.telefono AS propietario_telefono,
            c.email AS propietario_email, c.ci AS propietario_ci, c.direccion AS propietario_direccion
     FROM pacientes p
     JOIN clientes c ON c.id = p.cliente_id
     WHERE p.id = :id`,
    { id }
  );
  return rows[0] || null;
}

async function create(data) {
  const result = await query(
    `INSERT INTO pacientes
      (cliente_id, nombre, especie, raza, sexo, color, edad_aprox, fecha_nacimiento, peso_kg, notas, activo)
     VALUES
      (:cliente_id, :nombre, :especie, :raza, :sexo, :color, :edad_aprox, :fecha_nacimiento, :peso_kg, :notas, :activo)`,
    {
      cliente_id: data.cliente_id,
      nombre: data.nombre,
      especie: data.especie,
      raza: data.raza || null,
      sexo: data.sexo || 'desconocido',
      color: data.color || null,
      edad_aprox: data.edad_aprox || null,
      fecha_nacimiento: data.fecha_nacimiento || null,
      peso_kg: data.peso_kg ?? null,
      notas: data.notas || null,
      activo: data.activo === undefined ? 1 : data.activo ? 1 : 0,
    }
  );
  return getById(result.insertId);
}

async function update(id, data) {
  const existing = await getById(id);
  if (!existing) {
    const err = new Error('Paciente no encontrado');
    err.status = 404;
    throw err;
  }
  await query(
    `UPDATE pacientes SET
      cliente_id = :cliente_id,
      nombre = :nombre,
      especie = :especie,
      raza = :raza,
      sexo = :sexo,
      color = :color,
      edad_aprox = :edad_aprox,
      fecha_nacimiento = :fecha_nacimiento,
      peso_kg = :peso_kg,
      notas = :notas,
      activo = :activo
     WHERE id = :id`,
    {
      id,
      cliente_id: data.cliente_id ?? existing.cliente_id,
      nombre: data.nombre ?? existing.nombre,
      especie: data.especie ?? existing.especie,
      raza: data.raza ?? existing.raza,
      sexo: data.sexo ?? existing.sexo,
      color: data.color ?? existing.color,
      edad_aprox: data.edad_aprox ?? existing.edad_aprox,
      fecha_nacimiento: data.fecha_nacimiento ?? existing.fecha_nacimiento,
      peso_kg: data.peso_kg ?? existing.peso_kg,
      notas: data.notas ?? existing.notas,
      activo: data.activo === undefined ? existing.activo : data.activo ? 1 : 0,
    }
  );
  return getById(id);
}

async function remove(id) {
  const existing = await getById(id);
  if (!existing) {
    const err = new Error('Paciente no encontrado');
    err.status = 404;
    throw err;
  }
  await query('DELETE FROM pacientes WHERE id = :id', { id });
  return { ok: true };
}

async function getAtenciones(pacienteId) {
  return query(
    `SELECT a.*, u.nombre AS veterinario_nombre, s.nombre AS servicio_nombre
     FROM atenciones_veterinarias a
     LEFT JOIN usuarios u ON u.id = a.veterinario_id
     LEFT JOIN servicios_catalogo s ON s.id = a.servicio_id
     WHERE a.paciente_id = :pacienteId
     ORDER BY a.fecha_hora DESC, a.id DESC`,
    { pacienteId }
  );
}

async function createAtencion(pacienteId, data, usuarioId) {
  const paciente = await getById(pacienteId);
  if (!paciente) {
    const err = new Error('Paciente no encontrado');
    err.status = 404;
    throw err;
  }

  const result = await query(
    `INSERT INTO atenciones_veterinarias
      (paciente_id, veterinario_id, servicio_id, tipo_atencion, fecha_hora, motivo_diagnostico, tratamiento_procedimiento, peso_actual_kg, proxima_cita, costo_bob, notas)
     VALUES
      (:paciente_id, :veterinario_id, :servicio_id, :tipo_atencion, :fecha_hora, :motivo_diagnostico, :tratamiento_procedimiento, :peso_actual_kg, :proxima_cita, :costo_bob, :notas)`,
    {
      paciente_id: pacienteId,
      veterinario_id: data.veterinario_id || usuarioId || null,
      servicio_id: data.servicio_id || null,
      tipo_atencion: data.tipo_atencion || 'consulta',
      fecha_hora: data.fecha_hora || new Date().toISOString().slice(0, 19).replace('T', ' '),
      motivo_diagnostico: data.motivo_diagnostico || null,
      tratamiento_procedimiento: data.tratamiento_procedimiento || null,
      peso_actual_kg: data.peso_actual_kg ?? null,
      proxima_cita: data.proxima_cita || null,
      costo_bob: data.costo_bob ?? 0.00,
      notas: data.notas || null,
    }
  );

  // Actualizar peso actual de la mascota si se registró nuevo peso
  if (data.peso_actual_kg) {
    await query(`UPDATE pacientes SET peso_kg = :peso WHERE id = :id`, {
      peso: data.peso_actual_kg,
      id: pacienteId,
    });
  }

  const rows = await query(
    `SELECT a.*, u.nombre AS veterinario_nombre, s.nombre AS servicio_nombre
     FROM atenciones_veterinarias a
     LEFT JOIN usuarios u ON u.id = a.veterinario_id
     LEFT JOIN servicios_catalogo s ON s.id = a.servicio_id
     WHERE a.id = :id`,
    { id: result.insertId }
  );
  return rows[0] || null;
}

async function getHistorialCompleto(pacienteId) {
  const paciente = await getById(pacienteId);
  if (!paciente) {
    const err = new Error('Paciente no encontrado');
    err.status = 404;
    throw err;
  }

  const atenciones = await getAtenciones(pacienteId);

  const citas = await query(
    `SELECT c.*, u.nombre AS veterinario_nombre
     FROM citas c
     LEFT JOIN usuarios u ON u.id = c.veterinario_id
     WHERE c.paciente_id = :pacienteId
     ORDER BY c.fecha_hora DESC`,
    { pacienteId }
  );

  return {
    paciente,
    atenciones,
    citas,
  };
}

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  getAtenciones,
  createAtencion,
  getHistorialCompleto,
};
