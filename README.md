# Chavez Pet's Doctor Veterinaria

Sistema veterinario — **primera entrega**: autenticación JWT/RBAC, clientes y pacientes, agenda, catálogo de servicios con precios editables en BOB, caja (efectivo + QR con verificación manual), recibo 80 mm y arqueo diario.

Fuera de alcance en esta fase: ficha quirúrgica/consentimiento, vacunación/WhatsApp, stock de insumos.

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

### Acentos / UTF-8 (si ves `MarÃa` en vez de `María`)

El stack usa **utf8mb4** de punta a punta (MySQL server, conexión Node, JSON/HTML). Si ya cargaste seeds con datos corruptos, recrea el volumen MySQL (**borra datos locales**):

```bash
docker compose down -v
docker compose up -d
```

Luego reinicia la app (`npm run dev`).

## Credenciales seed

| Rol | Email | Password |
|-----|-------|----------|
| Veterinario | `vet@chavezpets.bo` | `Vet123!` |
| Asistente | `asistente@chavezpets.bo` | `Asist123!` |

También se cargan 2 propietarios, 3 pacientes, citas de ejemplo y 5 servicios con precios editables.

## Roles

- **veterinario** y **asistente**: clientes, pacientes, citas, servicios, caja, verificación QR, recibos, arqueo.
- Solo **veterinario**: subir/actualizar el QR de cobro de la clínica (`POST /api/configuracion/qr-cobro`).

## Flujo de cobro QR

1. Caja crea venta QR → `pendiente_verificacion`
2. Se muestra el QR de clínica y se sube comprobante
3. Bandeja de verificación → `pagado` (emite recibo) o `rechazado` (con motivo)
4. Recibo 80 mm solo si `estado_pago = pagado`

## API (resumen)

- `POST /api/auth/login` · `GET /api/auth/profile` · `POST /api/auth/logout`
- `GET|POST /api/configuracion/qr-cobro`
- CRUD `/api/clientes`, `/api/pacientes`, `/api/citas`, `/api/servicios`
- Ventas: `POST /api/ventas/efectivo`, `POST /api/ventas/qr`, `POST /api/ventas/:id/comprobante`, `POST .../confirmar`, `POST .../rechazar`, `GET .../recibo`, `GET /api/ventas/arqueo`

Colección Postman v2.1: [`postman/ChavezPetsDoctor.postman_collection.json`](postman/ChavezPetsDoctor.postman_collection.json)

## Estructura

```
sql/schema.sql          DDL
sql/seeds.sql           datos iniciales
src/                    Express (rutas → controladores → servicios → mysql2)
public/                 HTML/CSS/JS vanilla
uploads/                QR clínica y comprobantes
```

## Variables de entorno

Ver `.env.example` (`PORT=3847`, credenciales MySQL, `JWT_SECRET`).
