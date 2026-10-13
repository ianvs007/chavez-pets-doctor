const { query } = require('../db/pool');

async function list({ activo } = {}) {
  if (activo === '1' || activo === 1 || activo === true) {
    return query('SELECT * FROM servicios_catalogo WHERE activo = 1 ORDER BY nombre');
  }
  return query('SELECT * FROM servicios_catalogo ORDER BY nombre');
}

async function getById(id) {
  const rows = await query('SELECT * FROM servicios_catalogo WHERE id = :id', { id });
  return rows[0] || null;
}

async function create(data) {
  const result = await query(
    `INSERT INTO servicios_catalogo (nombre, tipo, precio_bob, activo)
     VALUES (:nombre, :tipo, :precio_bob, :activo)`,
    {
      nombre: data.nombre,
      tipo: data.tipo || 'consulta',
      precio_bob: data.precio_bob,
      activo: data.activo === undefined ? 1 : data.activo ? 1 : 0,
    }
  );
  return getById(result.insertId);
}

async function update(id, data) {
  const existing = await getById(id);
  if (!existing) {
    const err = new Error('Servicio no encontrado');
    err.status = 404;
    throw err;
  }
  await query(
    `UPDATE servicios_catalogo SET
      nombre = :nombre,
      tipo = :tipo,
      precio_bob = :precio_bob,
      activo = :activo
     WHERE id = :id`,
    {
      id,
      nombre: data.nombre ?? existing.nombre,
      tipo: data.tipo ?? existing.tipo,
      precio_bob: data.precio_bob ?? existing.precio_bob,
      activo: data.activo === undefined ? existing.activo : data.activo ? 1 : 0,
    }
  );
  return getById(id);
}

async function remove(id) {
  const existing = await getById(id);
  if (!existing) {
    const err = new Error('Servicio no encontrado');
    err.status = 404;
    throw err;
  }
  await query('UPDATE servicios_catalogo SET activo = 0 WHERE id = :id', { id });
  return getById(id);
}

module.exports = { list, getById, create, update, remove };
