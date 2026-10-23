const { query } = require('../db/pool');

async function list({ estado, q } = {}) {
  const clauses = ['1=1'];
  const params = {};

  if (estado && estado !== 'todas') {
    clauses.push('c.estado = :estado');
    params.estado = estado;
  }
  if (q) {
    clauses.push('(c.titulo LIKE :like OR c.descripcion LIKE :like OR c.lugar LIKE :like)');
    params.like = `%${q}%`;
  }

  return query(
    `SELECT c.*,
            COUNT(cp.id) AS total_inscritos,
            SUM(CASE WHEN cp.asistio = 1 THEN 1 ELSE 0 END) AS total_asistieron
     FROM campanas c
     LEFT JOIN campana_participantes cp ON cp.campana_id = c.id
     WHERE ${clauses.join(' AND ')}
     GROUP BY c.id
     ORDER BY c.fecha_inicio DESC, c.id DESC`,
    params
  );
}

async function getById(id) {
  const rows = await query(
    `SELECT c.*,
            COUNT(cp.id) AS total_inscritos,
            SUM(CASE WHEN cp.asistio = 1 THEN 1 ELSE 0 END) AS total_asistieron
     FROM campanas c
     LEFT JOIN campana_participantes cp ON cp.campana_id = c.id
     WHERE c.id = :id
     GROUP BY c.id`,
    { id }
  );
  if (!rows[0]) return null;

  const participantes = await listParticipantes(id);
  return { ...rows[0], participantes };
}

async function create(data) {
  const result = await query(
    `INSERT INTO campanas
      (titulo, descripcion, tipo, especie_objetivo, fecha_inicio, fecha_fin, lugar, cupo_maximo, costo_bob, estado)
     VALUES
      (:titulo, :descripcion, :tipo, :especie_objetivo, :fecha_inicio, :fecha_fin, :lugar, :cupo_maximo, :costo_bob, :estado)`,
    {
      titulo: data.titulo,
      descripcion: data.descripcion || null,
      tipo: data.tipo || 'vacunacion',
      especie_objetivo: data.especie_objetivo || 'todos',
      fecha_inicio: data.fecha_inicio,
      fecha_fin: data.fecha_fin || data.fecha_inicio,
      lugar: data.lugar || 'Clínica Veterinaria Patitas al poder',
      cupo_maximo: Number(data.cupo_maximo || 0),
      costo_bob: Number(data.costo_bob || 0),
      estado: data.estado || 'activa',
    }
  );
  return getById(result.insertId);
}

async function update(id, data) {
  const existing = await getById(id);
  if (!existing) {
    const err = new Error('Campaña no encontrada');
    err.status = 404;
    throw err;
  }
  await query(
    `UPDATE campanas SET
      titulo = :titulo,
      descripcion = :descripcion,
      tipo = :tipo,
      especie_objetivo = :especie_objetivo,
      fecha_inicio = :fecha_inicio,
      fecha_fin = :fecha_fin,
      lugar = :lugar,
      cupo_maximo = :cupo_maximo,
      costo_bob = :costo_bob,
      estado = :estado
     WHERE id = :id`,
    {
      id,
      titulo: data.titulo ?? existing.titulo,
      descripcion: data.descripcion ?? existing.descripcion,
      tipo: data.tipo ?? existing.tipo,
      especie_objetivo: data.especie_objetivo ?? existing.especie_objetivo,
      fecha_inicio: data.fecha_inicio ?? existing.fecha_inicio,
      fecha_fin: data.fecha_fin ?? existing.fecha_fin,
      lugar: data.lugar ?? existing.lugar,
      cupo_maximo: data.cupo_maximo !== undefined ? Number(data.cupo_maximo) : existing.cupo_maximo,
      costo_bob: data.costo_bob !== undefined ? Number(data.costo_bob) : existing.costo_bob,
      estado: data.estado ?? existing.estado,
    }
  );
  return getById(id);
}

async function remove(id) {
  const existing = await getById(id);
  if (!existing) {
    const err = new Error('Campaña no encontrada');
    err.status = 404;
    throw err;
  }
  await query('DELETE FROM campanas WHERE id = :id', { id });
  return { ok: true };
}

async function listParticipantes(campanaId) {
  return query(
    `SELECT cp.*, p.nombre AS paciente_sistema_nombre, c.nombres AS tutor_sistema_nombres
     FROM campana_participantes cp
     LEFT JOIN pacientes p ON p.id = cp.paciente_id
     LEFT JOIN clientes c ON c.id = p.cliente_id
     WHERE cp.campana_id = :campanaId
     ORDER BY cp.fecha_registro DESC`,
    { campanaId }
  );
}

async function addParticipante(campanaId, data) {
  const campana = await getById(campanaId);
  if (!campana) {
    const err = new Error('Campaña no encontrada');
    err.status = 404;
    throw err;
  }

  // Si hay cupo_maximo definido y > 0, chequear si no excede
  if (campana.cupo_maximo > 0 && campana.total_inscritos >= campana.cupo_maximo) {
    const err = new Error('El cupo para esta campaña está completo');
    err.status = 400;
    throw err;
  }

  const result = await query(
    `INSERT INTO campana_participantes
      (campana_id, paciente_id, tutor_nombre, tutor_telefono, mascota_nombre, especie, asistio, observaciones)
     VALUES
      (:campana_id, :paciente_id, :tutor_nombre, :tutor_telefono, :mascota_nombre, :especie, :asistio, :observaciones)`,
    {
      campana_id: campanaId,
      paciente_id: data.paciente_id || null,
      tutor_nombre: data.tutor_nombre,
      tutor_telefono: data.tutor_telefono || null,
      mascota_nombre: data.mascota_nombre,
      especie: data.especie || 'Canino',
      asistio: data.asistio ? 1 : 0,
      observaciones: data.observaciones || null,
    }
  );

  const rows = await query(`SELECT * FROM campana_participantes WHERE id = :id`, { id: result.insertId });
  return rows[0] || null;
}

async function updateParticipante(participanteId, data) {
  const rows = await query(`SELECT * FROM campana_participantes WHERE id = :id`, { id: participanteId });
  const existing = rows[0];
  if (!existing) {
    const err = new Error('Participante no encontrado');
    err.status = 404;
    throw err;
  }

  await query(
    `UPDATE campana_participantes SET
      asistio = :asistio,
      observaciones = :observaciones
     WHERE id = :id`,
    {
      id: participanteId,
      asistio: data.asistio !== undefined ? (data.asistio ? 1 : 0) : existing.asistio,
      observaciones: data.observaciones !== undefined ? data.observaciones : existing.observaciones,
    }
  );

  const updated = await query(`SELECT * FROM campana_participantes WHERE id = :id`, { id: participanteId });
  return updated[0];
}

async function removeParticipante(participanteId) {
  await query('DELETE FROM campana_participantes WHERE id = :id', { id: participanteId });
  return { ok: true };
}

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  listParticipantes,
  addParticipante,
  updateParticipante,
  removeParticipante,
};
