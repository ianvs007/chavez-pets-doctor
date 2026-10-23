-- Migración V2: Atenciones Veterinarias, Campañas y Edad de Mascotas
-- Ejecutar este script en DBeaver sobre la base de datos 'chavez_pets'

USE chavez_pets;

-- 1. Agregar campo edad_aprox en la tabla pacientes (si aún no existe)
SET @col_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'pacientes'
    AND COLUMN_NAME = 'edad_aprox'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE pacientes ADD COLUMN edad_aprox VARCHAR(80) NULL AFTER color;',
  'SELECT "Columna edad_aprox ya existe";'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Crear tabla atenciones_veterinarias
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Crear tabla campanas
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Crear tabla campana_participantes
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Semillas iniciales opcionales de campañas (si la tabla está vacía)
INSERT INTO campanas (titulo, descripcion, tipo, especie_objetivo, fecha_inicio, fecha_fin, lugar, cupo_maximo, costo_bob, estado)
SELECT 'Campaña de Vacunación Antirrábica Canina y Felina', 'Jornada gratuita de inmunización antirrábica para proteger a nuestras mascotas.', 'vacunacion', 'todos', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 15 DAY), 'Clínica Patitas al poder', 150, 0.00, 'activa'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM campanas);

INSERT INTO campanas (titulo, descripcion, tipo, especie_objetivo, fecha_inicio, fecha_fin, lugar, cupo_maximo, costo_bob, estado)
SELECT 'Jornada de Esterilización Preventiva', 'Esterilización a bajo costo para frenar la sobrepoblación.', 'esterilizacion', 'todos', DATE_ADD(CURDATE(), INTERVAL 5 DAY), DATE_ADD(CURDATE(), INTERVAL 20 DAY), 'Quirófano Patitas al poder', 40, 120.00, 'activa'
FROM DUAL
WHERE (SELECT COUNT(*) FROM campanas) <= 1;
