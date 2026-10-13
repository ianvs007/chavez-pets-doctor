const authService = require('../services/authService');

async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'email y password son requeridos' });
    }
    const result = await authService.login(email, password);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

async function logout(_req, res) {
  return res.json({ ok: true, message: 'Sesión cerrada (cliente debe descartar el token)' });
}

async function profile(req, res, next) {
  try {
    const user = await authService.getProfile(req.user.id);
    return res.json(user);
  } catch (err) {
    return next(err);
  }
}

module.exports = { login, logout, profile };
