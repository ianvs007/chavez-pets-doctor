const { query } = require('../db/pool');

async function getConfig() {
  const rows = await query('SELECT * FROM configuracion_clinica ORDER BY id ASC LIMIT 1');
  return rows[0] || null;
}

async function updateQrCobro({ qrPath, bancoNombre, cuentaInfo }) {
  const current = await getConfig();
  if (!current) {
    const err = new Error('Configuración de clínica no encontrada');
    err.status = 404;
    throw err;
  }
  await query(
    `UPDATE configuracion_clinica
     SET qr_cobro_path = COALESCE(:qrPath, qr_cobro_path),
         banco_nombre = COALESCE(:bancoNombre, banco_nombre),
         cuenta_info = COALESCE(:cuentaInfo, cuenta_info)
     WHERE id = :id`,
    {
      id: current.id,
      qrPath: qrPath || null,
      bancoNombre: bancoNombre || null,
      cuentaInfo: cuentaInfo || null,
    }
  );
  return getConfig();
}

module.exports = { getConfig, updateQrCobro };
