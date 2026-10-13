const { query } = require('../db/pool');

async function list({ q } = {}) {
  if (q) {
    const like = `%${q}%`;
    return query(
      `SELECT * FROM clientes
       WHERE nombres LIKE :like OR apellidos LIKE :like OR ci LIKE :like OR telefono LIKE :like
       ORDER BY apellidos, nombres`,
      { like }
    );
  }
  return query('SELECT * FROM clientes ORDER BY apellidos, nombres');
}

async function getById(id) {
  const rows = await query('SELECT * FROM clientes WHERE id = :id', { id });
  return rows[0] || null;
}

async function create(data) {
  const result = await query(
    `INSERT INTO clientes (nombres, apellidos, ci, telefono, email, direccion, notas)
     VALUES (:nombres, :apellidos, :ci, :telefono, :email, :direccion, :notas)`,
    {
      nombres: data.nombres,
      apellidos: data.apellidos,
      ci: data.ci || null,
      telefono: data.telefono || null,
      email: data.email || null,
      direccion: data.direccion || null,
      notas: data.notas || null,
    }
  );
  return getById(result.insertId);
}

async function update(id, data) {
  const existing = await getById(id);
  if (!existing) {
    const err = new Error('Cliente no encontrado');
    err.status = 404;
    throw err;
  }
  await query(
    `UPDATE clientes SET
      nombres = :nombres,
      apellidos = :apellidos,
      ci = :ci,
      telefono = :telefono,
      email = :email,
      direccion = :direccion,
      notas = :notas
     WHERE id = :id`,
    {
      id,
      nombres: data.nombres ?? existing.nombres,
      apellidos: data.apellidos ?? existing.apellidos,
      ci: data.ci ?? existing.ci,
      telefono: data.telefono ?? existing.telefono,
      email: data.email ?? existing.email,
      direccion: data.direccion ?? existing.direccion,
      notas: data.notas ?? existing.notas,
    }
  );
  return getById(id);
}

async function remove(id) {
  const existing = await getById(id);
  if (!existing) {
    const err = new Error('Cliente no encontrado');
    err.status = 404;
    throw err;
  }
  await query('DELETE FROM clientes WHERE id = :id', { id });
  return { ok: true };
}

module.exports = { list, getById, create, update, remove };
