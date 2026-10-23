-- Seeds — Patitas al poder
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
USE chavez_pets;

INSERT INTO usuarios (nombre, email, password_hash, rol, activo) VALUES
  ('Dra. Chavez', 'vet@chavezpets.bo', '$2a$10$52jjaBJZr44M1G4A5cUJfePcnVoqTjQQOKAO6InHUdoWBJ/eSiy2S', 'veterinario', 1),
  ('Asistente Clínica', 'asistente@chavezpets.bo', '$2a$10$/1CaZjsLZ.M6c6qbU03LWusFTWzWppg3oNsygxCBVqwTlGGhYN3Bu', 'asistente', 1);

INSERT INTO configuracion_clinica (
  nombre_clinica, nit, direccion, telefono, ciudad, banco_nombre, cuenta_info
) VALUES (
  'Patitas al poder',
  '1234567890',
  'Av. Principal #100, Bolivia',
  '+591 70000000',
  'Bolivia',
  'Banco Union',
  'Cuenta QR clínica — configurar imagen en Configuración'
);

INSERT INTO servicios_catalogo (nombre, tipo, precio_bob, activo) VALUES
  ('Consulta general', 'consulta', 80.00, 1),
  ('Consulta de control', 'consulta', 50.00, 1),
  ('Vacuna antirrábica', 'vacuna', 70.00, 1),
  ('Vacuna séxtuple canina', 'vacuna', 120.00, 1),
  ('Desparasitación interna canina/felina', 'otro', 35.00, 1),
  ('Desparasitación externa (pipeta)', 'otro', 45.00, 1),
  ('Esterilización canina (referencial)', 'cirugia', 450.00, 1),
  ('Esterilización felina', 'cirugia', 280.00, 1),
  ('Baño medicado', 'otro', 60.00, 1);

INSERT INTO clientes (nombres, apellidos, ci, telefono, email, direccion) VALUES
  ('María', 'Rojas', '4567890', '70111222', 'maria.rojas@email.bo', 'Zona Sur'),
  ('Carlos', 'Mamani', '5123456', '70999888', 'carlos.mamani@email.bo', 'Centro');

INSERT INTO pacientes (cliente_id, nombre, especie, raza, sexo, color, edad_aprox, peso_kg) VALUES
  (1, 'Luna', 'Canino', 'Mestiza', 'hembra', 'Café', '3 años', 12.50),
  (1, 'Michi', 'Felino', 'Común', 'macho', 'Gris', '1 año y 4 meses', 4.20),
  (2, 'Rocky', 'Canino', 'Pastor alemán', 'macho', 'Negro/café', '4 años', 28.00);

INSERT INTO citas (paciente_id, cliente_id, veterinario_id, fecha_hora, tipo, motivo, estado) VALUES
  (1, 1, 1, DATE_ADD(CURDATE(), INTERVAL 10 HOUR), 'consulta', 'Revisión general', 'programada'),
  (3, 2, 1, DATE_ADD(CURDATE(), INTERVAL 12 HOUR), 'vacuna', 'Refuerzo antirrábica', 'confirmada');

INSERT INTO atenciones_veterinarias (paciente_id, veterinario_id, servicio_id, tipo_atencion, fecha_hora, motivo_diagnostico, tratamiento_procedimiento, peso_actual_kg, proxima_cita, costo_bob) VALUES
  (1, 1, 3, 'vacunacion', DATE_SUB(NOW(), INTERVAL 30 DAY), 'Vacunación preventiva anual', 'Aplicación de Vacuna Antirrábica Nobivac Rabies Lote #84920. Sin reacciones adversas inmediatas.', 12.40, DATE_ADD(CURDATE(), INTERVAL 335 DAY), 70.00),
  (1, 1, 5, 'desparasitacion', DATE_SUB(NOW(), INTERVAL 15 DAY), 'Control preventivo trimestral', 'Administración oral de comprimido antiparasitario amplio espectro (Praziquantel/Pirantel).', 12.50, DATE_ADD(CURDATE(), INTERVAL 75 DAY), 35.00),
  (2, 1, 8, 'esterilizacion', DATE_SUB(NOW(), INTERVAL 60 DAY), 'Control de natalidad felina', 'Orquiectomía bilateral bajo anestesia general inhalatoria. Evolución postoperatoria favorable.', 4.10, NULL, 280.00),
  (3, 1, 1, 'consulta', DATE_SUB(NOW(), INTERVAL 5 DAY), 'Chequeo articular y pelaje opaco', 'Examen físico general. Articulaciones sin dolor aparente. Se prescribe suplemento de Omega 3 y control en 1 mes.', 28.00, DATE_ADD(CURDATE(), INTERVAL 25 DAY), 80.00);

INSERT INTO campanas (titulo, descripcion, tipo, especie_objetivo, fecha_inicio, fecha_fin, lugar, cupo_maximo, costo_bob, estado) VALUES
  ('Campaña Municipal de Vacunación Antirrábica', 'Jornada gratuita de vacunación antirrábica obligatoria para perros y gatos.', 'vacunacion', 'todos', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 15 DAY), 'Centro Veterinario Patitas al poder', 150, 0.00, 'activa'),
  ('Campaña de Esterilización Masiva a Costo Social', 'Esterilización preventiva para caninos y felinos con previa reserva de turno.', 'esterilizacion', 'todos', DATE_ADD(CURDATE(), INTERVAL 7 DAY), DATE_ADD(CURDATE(), INTERVAL 21 DAY), 'Quirófano Patitas al poder', 40, 120.00, 'activa'),
  ('Jornada de Desparasitación y Desparasitantes', 'Desparasitación masiva contra parásitos internos y externos.', 'desparasitacion', 'canino', DATE_ADD(CURDATE(), INTERVAL 20 DAY), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'Parque Urbano Central', 100, 15.00, 'planificada');
