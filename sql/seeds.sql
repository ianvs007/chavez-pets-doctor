-- Seeds — Chavez Pet's Doctor Veterinaria
-- Passwords (plaintext, documentados en README):
--   vet@chavezpets.bo     / Vet123!
--   asistente@chavezpets.bo / Asist123!
USE chavez_pets;

INSERT INTO usuarios (nombre, email, password_hash, rol, activo) VALUES
  ('Dra. Chavez', 'vet@chavezpets.bo', '$2a$10$52jjaBJZr44M1G4A5cUJfePcnVoqTjQQOKAO6InHUdoWBJ/eSiy2S', 'veterinario', 1),
  ('Asistente Clínica', 'asistente@chavezpets.bo', '$2a$10$/1CaZjsLZ.M6c6qbU03LWusFTWzWppg3oNsygxCBVqwTlGGhYN3Bu', 'asistente', 1);

INSERT INTO configuracion_clinica (
  nombre_clinica, nit, direccion, telefono, ciudad, banco_nombre, cuenta_info
) VALUES (
  'Chavez Pet''s Doctor Veterinaria',
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
  ('Esterilización canina (referencial)', 'cirugia', 450.00, 1),
  ('Baño medicado', 'otro', 60.00, 1);

INSERT INTO clientes (nombres, apellidos, ci, telefono, email, direccion) VALUES
  ('María', 'Rojas', '4567890', '70111222', 'maria.rojas@email.bo', 'Zona Sur'),
  ('Carlos', 'Mamani', '5123456', '70999888', 'carlos.mamani@email.bo', 'Centro');

INSERT INTO pacientes (cliente_id, nombre, especie, raza, sexo, color, peso_kg) VALUES
  (1, 'Luna', 'Canino', 'Mestiza', 'hembra', 'Café', 12.50),
  (1, 'Michi', 'Felino', 'Común', 'macho', 'Gris', 4.20),
  (2, 'Rocky', 'Canino', 'Pastor alemán', 'macho', 'Negro/café', 28.00);

INSERT INTO citas (paciente_id, cliente_id, veterinario_id, fecha_hora, tipo, motivo, estado) VALUES
  (1, 1, 1, DATE_ADD(CURDATE(), INTERVAL 10 HOUR), 'consulta', 'Revisión general', 'programada'),
  (3, 2, 1, DATE_ADD(CURDATE(), INTERVAL 12 HOUR), 'vacuna', 'Refuerzo antirrábica', 'confirmada');
