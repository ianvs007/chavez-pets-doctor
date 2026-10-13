function errorHandler(err, _req, res, _next) {
  console.error(err);
  if (err && (err.code === 'LIMIT_FILE_SIZE' || err.message === 'Solo imágenes o PDF')) {
    return res.status(400).json({ error: err.message });
  }
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Error interno del servidor',
  });
}

module.exports = { errorHandler };
