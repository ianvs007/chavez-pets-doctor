const app = require('./app');
const config = require('./config');
const { pool } = require('./db/pool');

async function waitForDb(retries = 30) {
  for (let i = 0; i < retries; i += 1) {
    try {
      const conn = await pool.getConnection();
      await conn.ping();
      conn.release();
      return;
    } catch (err) {
      console.log(`Esperando MySQL... (${i + 1}/${retries})`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw new Error('No se pudo conectar a MySQL');
}

waitForDb()
  .then(() => {
    app.listen(config.port, '0.0.0.0', () => {
      console.log(`Patitas al poder escuchando en http://127.0.0.1:${config.port}`);
    });
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
