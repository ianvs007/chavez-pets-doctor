# Patitas al poder · Registro y control de atención veterinaria

Sistema veterinario integral para gestión clínica, atención médica de mascotas, campañas comunitarias, agenda, catálogo de servicios en BOB, caja (efectivo + QR con verificación manual), recibo 80 mm y arqueo diario.

## Módulos Implementados

1. **Registro de Mascotas y Cuidadores:**
   - Alta y edición de cuidadores (nombres, apellidos, CI, teléfono, correo, dirección).
   - Registro de mascotas vinculado a su cuidador con: nombre, especie (canino, felino, otro), raza, sexo, **edad aproximada** y **peso**.
2. **Servicios Veterinarios y Atenciones:**
   - Registro de atenciones clínicas veterinarias: **vacunación**, **desparasitación**, **esterilización**, **consulta general** y procedimientos especiales.
   - Detalle de diagnóstico, medicación/fármaco administrado, peso en la consulta, costo y fecha de próximo refuerzo/control.
3. **Campañas Sanitarias Comunitarias:**
   - Publicación y organización de actividades masivas (ej. campañas de vacunación antirrábica, jornadas de esterilización preventiva, desparasitación comunitaria).
   - Control de especie objetivo, fechas, ubicación, cupo máximo y costo (gratuita o con costo social).
   - Padrón de mascotas inscritas y control de asistencia con un solo clic.
4. **Historial Clínico y Consultas:**
   - Buscador global de pacientes por nombre, tutor o especie.
   - Expediente completo con datos del cuidador y línea de tiempo (timeline) cronológica filtrable por tipo de atención.
   - Registro directo de atenciones médicas desde el expediente del paciente.
5. **Caja, Facturación y Agenda:**
   - Venta en efectivo y QR con flujo de verificación manual y recibo térmico de 80 mm con logo de la clínica.

## Requisitos

- Node.js 18+
- Docker + Docker Compose (MySQL 8)

## Cómo correr

```bash
# 1) Base de datos
docker compose up -d

# 2) Dependencias y API + frontend estático
cp .env.example .env   # si aún no existe
npm install
npm run dev
```

App: [http://127.0.0.1:3847](http://127.0.0.1:3847)

MySQL queda expuesto en el puerto host **3307** (usuario `chavez` / `chavezpass`, DB `chavez_pets`).
Las tablas nuevas y actualizaciones de esquema se aplican de forma automática al iniciar el servidor (`src/db/migrate.js`).

## Credenciales de prueba

| Rol | Email | Password |
|-----|-------|----------|
| Veterinario | `vet@chavezpets.bo` | `Vet123!` |
| Asistente | `asistente@chavezpets.bo` | `Asist123!` |

## Endpoints de la API

- **Auth:** `POST /api/auth/login` · `GET /api/auth/profile` · `POST /api/auth/logout`
- **Cuidadores / Clientes:** `GET|POST /api/clientes`, `PUT|DELETE /api/clientes/:id`
- **Mascotas / Pacientes:**
  - `GET|POST /api/pacientes`, `PUT|DELETE /api/pacientes/:id`
  - `GET /api/pacientes/:id/historial` (expediente completo)
  - `GET|POST /api/pacientes/:id/atenciones` (registrar vacuna, desparasitación, etc.)
- **Campañas Veterinarias:**
  - `GET|POST /api/campanas`, `PUT|DELETE /api/campanas/:id`
  - `GET|POST /api/campanas/:id/participantes`
  - `PATCH /api/campanas/:id/participantes/:participanteId` (asistencia)
- **Agenda:** `CRUD /api/citas`
- **Servicios:** `CRUD /api/servicios`
- **Ventas & Caja:** `POST /api/ventas/efectivo`, `POST /api/ventas/qr`, `POST .../confirmar`, `GET .../recibo`, `GET /api/ventas/arqueo`

## Estructura

```
sql/schema.sql          DDL con esquema de pacientes, atenciones y campañas
sql/seeds.sql           Datos iniciales con mascotas, atenciones y campañas
src/db/migrate.js       Migración automática de esquema al iniciar
src/                    API Express (rutas, controladores, servicios)
public/                 Frontend HTML/CSS/JS con logo institucional
public/img/logo.jpg     Logo oficial Patitas al poder
```
