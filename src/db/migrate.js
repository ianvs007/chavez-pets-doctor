const { query } = require('./pool');

async function runMigrations() {
  console.log('[Migrate] Verificando esquema de base de datos...');

  // 1. Añadir columna edad_aprox a pacientes si no existe
  try {
    const cols = await query(`SHOW COLUMNS FROM pacientes LIKE 'edad_aprox'`);
    if (!cols || cols.length === 0) {
      await query(`ALTER TABLE pacientes ADD COLUMN edad_aprox VARCHAR(80) NULL AFTER color`);
      console.log('[Migrate] Columna edad_aprox agregada a pacientes');
    }
  } catch (err) {
    console.warn('[Migrate] Advertencia al verificar edad_aprox:', err.message);
  }

  // 2. Crear tabla atenciones_veterinarias
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS atenciones_veterinarias (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        paciente_id INT UNSIGNED NOT NULL,
        veterinario_id INT UNSIGNED NULL,
        servicio_id INT UNSIGNED NULL,
        tipo_atencion ENUM('vacunacion', 'desparasitacion', 'esterilizacion', 'consulta', 'otro') NOT NULL,
        fecha_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        motivo_diagnostico TEXT NULL,
        tratamiento_procedimiento TEXT NULL,
        peso_actual_kg DECIMAL(6,2) NULL,
        proxima_cita DATE NULL,
        costo_bob DECIMAL(10,2) NULL DEFAULT 0.00,
        notas TEXT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_atenciones_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
        CONSTRAINT fk_atenciones_vet FOREIGN KEY (veterinario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
        CONSTRAINT fk_atenciones_servicio FOREIGN KEY (servicio_id) REFERENCES servicios_catalogo(id) ON DELETE SET NULL,
        INDEX idx_atenciones_paciente (paciente_id),
        INDEX idx_atenciones_fecha (fecha_hora),
        INDEX idx_atenciones_tipo (tipo_atencion)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('[Migrate] Tabla atenciones_veterinarias lista');
  } catch (err) {
    console.warn('[Migrate] Advertencia en tabla atenciones_veterinarias:', err.message);
  }

  // 3. Crear tabla campanas
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS campanas (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        titulo VARCHAR(200) NOT NULL,
        descripcion TEXT NULL,
        tipo ENUM('vacunacion', 'desparasitacion', 'esterilizacion', 'consulta_general', 'otro') NOT NULL DEFAULT 'vacunacion',
        especie_objetivo ENUM('canino', 'felino', 'todos') NOT NULL DEFAULT 'todos',
        fecha_inicio DATE NOT NULL,
        fecha_fin DATE NOT NULL,
        lugar VARCHAR(255) NULL,
        cupo_maximo INT UNSIGNED NULL DEFAULT 0,
        costo_bob DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        estado ENUM('planificada', 'activa', 'finalizada', 'cancelada') NOT NULL DEFAULT 'activa',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_campanas_estado (estado),
        INDEX idx_campanas_fechas (fecha_inicio, fecha_fin)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('[Migrate] Tabla campanas lista');
  } catch (err) {
    console.warn('[Migrate] Advertencia en tabla campanas:', err.message);
  }

  // 4. Crear tabla campana_participantes
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS campana_participantes (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        campana_id INT UNSIGNED NOT NULL,
        paciente_id INT UNSIGNED NULL,
        tutor_nombre VARCHAR(150) NOT NULL,
        tutor_telefono VARCHAR(40) NULL,
        mascota_nombre VARCHAR(120) NOT NULL,
        especie VARCHAR(80) NOT NULL,
        asistio TINYINT(1) NOT NULL DEFAULT 0,
        observaciones TEXT NULL,
        fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_participantes_campana FOREIGN KEY (campana_id) REFERENCES campanas(id) ON DELETE CASCADE,
        CONSTRAINT fk_participantes_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE SET NULL,
        INDEX idx_participantes_campana (campana_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('[Migrate] Tabla campana_participantes lista');
  } catch (err) {
    console.warn('[Migrate] Advertencia en tabla campana_participantes:', err.message);
  }

  // 5. Semillas de servicios (desparasitación y esterilización si faltan)
  try {
    const existing = await query(`SELECT nombre FROM servicios_catalogo WHERE nombre LIKE '%desparasita%'`);
    if (!existing || existing.length === 0) {
      await query(`
        INSERT INTO servicios_catalogo (nombre, tipo, precio_bob, activo) VALUES
        ('Desparasitación interna canina/felina', 'otro', 35.00, 1),
        ('Desparasitación externa (pipeta)', 'otro', 45.00, 1),
        ('Esterilización felina', 'cirugia', 280.00, 1)
      `);
      console.log('[Migrate] Servicios complementarios añadidos al catálogo');
    }
  } catch (err) {
    console.warn('[Migrate] Advertencia en servicios adicionales:', err.message);
  }

  // 6. Semillas de campañas iniciales de ejemplo si la tabla está vacía
  try {
    const campCount = await query(`SELECT COUNT(*) AS total FROM campanas`);
    if (campCount[0]?.total === 0) {
      await query(`
        INSERT INTO campanas (titulo, descripcion, tipo, especie_objetivo, fecha_inicio, fecha_fin, lugar, cupo_maximo, costo_bob, estado)
        VALUES
        ('Campaña de Vacunación Antirrábica Canina y Felina', 'Jornada gratuita de inmunización antirrábica para proteger a nuestras mascotas y comunidad.', 'vacunacion', 'todos', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 14 DAY), 'Clínica Patitas al poder - Sucursal Central', 100, 0.00, 'activa'),
        ('Jornada de Esterilización Preventiva a Bajo Costo', 'Campaña solidaria de esterilización para frenar la sobrepoblación canina y felina con cupos limitados.', 'esterilizacion', 'todos', DATE_ADD(CURDATE(), INTERVAL 5 DAY), DATE_ADD(CURDATE(), INTERVAL 20 DAY), 'Quirófano Patitas al poder', 30, 150.00, 'activa'),
        ('Desparasitación Masiva Comunitaria', 'Campaña de desparasitación interna y externa para cachorros y adultos.', 'desparasitacion', 'canino', DATE_ADD(CURDATE(), INTERVAL 15 DAY), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'Plaza Principal', 80, 20.00, 'planificada')
      `);
      console.log('[Migrate] Campañas iniciales sembradas');
    }
  } catch (err) {
    console.warn('[Migrate] Advertencia al sembrar campanas:', err.message);
  }

  console.log('[Migrate] Migraciones completadas exitosamente.');
}

module.exports = { runMigrations };
