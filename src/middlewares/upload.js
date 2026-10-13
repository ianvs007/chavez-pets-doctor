const path = require('path');
const fs = require('fs');
const multer = require('multer');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function createUploader(subdir) {
  const dest = path.join(__dirname, '../../uploads', subdir);
  ensureDir(dest);
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dest),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      const safe = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, safe);
    },
  });
  return multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const ok = /image\/(jpeg|jpg|png|webp|gif)|application\/pdf/.test(file.mimetype);
      if (!ok) return cb(new Error('Solo imágenes o PDF'));
      return cb(null, true);
    },
  });
}

const uploadQrClinica = createUploader('qr-clinica');
const uploadComprobante = createUploader('comprobantes-pago');

module.exports = { uploadQrClinica, uploadComprobante };
