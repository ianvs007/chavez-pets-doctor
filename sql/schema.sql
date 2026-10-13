-- Chavez Pet's Doctor Veterinaria — esquema fase 1
SET NAMES utf8mb4;
SET time_zone = '-04:00';

CREATE DATABASE IF NOT EXISTS chavez_pets
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE chavez_pets;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol ENUM('veterinario', 'asistente') NOT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS configuracion_clinica (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre_clinica VARCHAR(200) NOT NULL,
  nit VARCHAR(40) NULL,
  direccion VARCHAR(255) NULL,
  telefono VARCHAR(40) NULL,
  ciudad VARCHAR(80) NULL DEFAULT 'Bolivia',
  qr_cobro_path VARCHAR(255) NULL,
  banco_nombre VARCHAR(120) NULL,
  cuenta_info VARCHAR(255) NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS clientes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombres VARCHAR(120) NOT NULL,
  apellidos VARCHAR(120) NOT NULL,
  ci VARCHAR(40) NULL,
  telefono VARCHAR(40) NULL,
  email VARCHAR(160) NULL,
  direccion VARCHAR(255) NULL,
  notas TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_clientes_nombre (apellidos, nombres),
  INDEX idx_clientes_ci (ci)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pacientes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT UNSIGNED NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  especie VARCHAR(80) NOT NULL,
  raza VARCHAR(120) NULL,
  sexo ENUM('macho', 'hembra', 'desconocido') NOT NULL DEFAULT 'desconocido',
  color VARCHAR(80) NULL,
  fecha_nacimiento DATE NULL,
  peso_kg DECIMAL(6,2) NULL,
  notas TEXT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_pacientes_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id),
  INDEX idx_pacientes_cliente (cliente_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS citas (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  paciente_id INT UNSIGNED NOT NULL,
  cliente_id INT UNSIGNED NOT NULL,
  veterinario_id INT UNSIGNED NULL,
  fecha_hora DATETIME NOT NULL,
  tipo ENUM('consulta', 'vacuna', 'cirugia', 'control_puntos', 'otro') NOT NULL DEFAULT 'consulta',
  motivo VARCHAR(255) NULL,
  estado ENUM('programada', 'confirmada', 'en_curso', 'completada', 'cancelada', 'no_asistio') NOT NULL DEFAULT 'programada',
  notas TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_citas_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(id),
  CONSTRAINT fk_citas_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id),
  CONSTRAINT fk_citas_vet FOREIGN KEY (veterinario_id) REFERENCES usuarios(id),
  INDEX idx_citas_fecha (fecha_hora),
  INDEX idx_citas_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS servicios_catalogo (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(160) NOT NULL,
  tipo ENUM('consulta', 'vacuna', 'cirugia', 'otro') NOT NULL DEFAULT 'consulta',
  precio_bob DECIMAL(10,2) NOT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ventas (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  numero_recibo VARCHAR(32) NULL UNIQUE,
  cliente_id INT UNSIGNED NOT NULL,
  usuario_id INT UNSIGNED NOT NULL,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metodo_pago ENUM('efectivo', 'qr') NOT NULL,
  estado_pago ENUM('pagado', 'pendiente_verificacion', 'rechazado') NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  descuento DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  monto_recibido DECIMAL(12,2) NULL,
  vuelto DECIMAL(12,2) NULL,
  comprobante_path VARCHAR(255) NULL,
  referencia_pago VARCHAR(120) NULL,
  banco_origen VARCHAR(120) NULL,
  verificador_id INT UNSIGNED NULL,
  fecha_verificacion DATETIME NULL,
  motivo_rechazo VARCHAR(255) NULL,
  notas TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ventas_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id),
  CONSTRAINT fk_ventas_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  CONSTRAINT fk_ventas_verificador FOREIGN KEY (verificador_id) REFERENCES usuarios(id),
  INDEX idx_ventas_fecha (fecha),
  INDEX idx_ventas_estado (estado_pago)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ventas_detalle (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  venta_id INT UNSIGNED NOT NULL,
  servicio_id INT UNSIGNED NULL,
  descripcion VARCHAR(200) NOT NULL,
  cantidad DECIMAL(10,2) NOT NULL DEFAULT 1,
  precio_unitario DECIMAL(12,2) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  CONSTRAINT fk_detalle_venta FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
  CONSTRAINT fk_detalle_servicio FOREIGN KEY (servicio_id) REFERENCES servicios_catalogo(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
