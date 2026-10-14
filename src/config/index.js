require('dotenv').config();

module.exports = {
  port: Number(process.env.PORT) || 3847,
  jwt: {
    secret: process.env.JWT_SECRET || 'chavez-pets-dev-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3307,
    user: process.env.DB_USER || 'chavez',
    // Empty DB_PASSWORD= must stay empty (XAMPP root). Do not use || fallback.
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'chavezpass',
    database: process.env.DB_NAME || 'chavez_pets',
  },
  clinicName: "Patitas al poder",
};
