const { query } = require('../db/pool');

async function list({ clienteId, q } = {}) {
  const clauses = ['1=1'];
  const params = {};
  if (clienteId) {
    clauses.push('p.cliente_id = :clienteId');
    params.clienteId = clienteId;
  }
  if (q) {
    clauses.push('(p.nombre LIKE :like OR p.especie LIKE :like OR c.nombres LIKE :like OR c.apellidos LIKE :like)');
    params.like = `%${q}%`;
  }
  return query(
    `SELECT p.*, CONCAT(c.nombres, ' ', c.apellidos) AS propietario, c.telefono AS propietario_telefono
     FROM pacientes p
     JOIN clientes c ON c.id = p.cliente_id
     WHERE ${clauses.join(' AND ')}
     ORDER BY p.nombre`,
    params
  );
}

async function getById(id) {
  const rows = await query(
    `SELECT p.*, CONCAT(c.nombres, ' ', c.apellidos) AS propietario
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
      (cliente_id, nombre, especie, raza, sexo, color, fecha_nacimiento, peso_kg, notas, activo)
     VALUES
      (:cliente_id, :nombre, :especie, :raza, :sexo, :color, :fecha_nacimiento, :peso_kg, :notas, :activo)`,
    {
      cliente_id: data.cliente_id,
      nombre: data.nombre,
      especie: data.especie,
      raza: data.raza || null,
      sexo: data.sexo || 'desconocido',
      color: data.color || null,
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

module.exports = { list, getById, create, update, remove };
