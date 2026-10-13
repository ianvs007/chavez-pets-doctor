const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../db/pool');
const config = require('../config');

async function login(email, password) {
  const rows = await query(
    'SELECT id, nombre, email, password_hash, rol, activo FROM usuarios WHERE email = :email LIMIT 1',
    { email }
  );
  if (!rows.length || !rows[0].activo) {
    const err = new Error('Credenciales inválidas');
    err.status = 401;
    throw err;
  }
  const user = rows[0];
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    const err = new Error('Credenciales inválidas');
    err.status = 401;
    throw err;
  }
  const token = jwt.sign(
    { id: user.id, email: user.email, rol: user.rol, nombre: user.nombre },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
  return {
    token,
    user: {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
    },
  };
}

async function getProfile(userId) {
  const rows = await query(
    'SELECT id, nombre, email, rol, activo, created_at FROM usuarios WHERE id = :id LIMIT 1',
    { id: userId }
  );
  if (!rows.length) {
    const err = new Error('Usuario no encontrado');
    err.status = 404;
    throw err;
  }
  return rows[0];
}

module.exports = { login, getProfile };
