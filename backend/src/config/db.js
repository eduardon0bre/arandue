const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3308,
  user: process.env.DB_USER || 'bicos_user',
  password: process.env.DB_PASS || 'bicos_password',
  database: process.env.DB_NAME || 'quadro_bicos_db',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const db = {
  async query(sql, params) {
    if (globalThis.__mockDbQueryHandler) {
      return globalThis.__mockDbQueryHandler(sql, params);
    }
    return pool.query(sql, params);
  },
  async execute(sql, params) {
    if (globalThis.__mockDbQueryHandler) {
      return globalThis.__mockDbQueryHandler(sql, params);
    }
    return pool.execute(sql, params);
  },
  getConnection() {
    return pool.getConnection();
  },
  setQueryHandler(fn) {
    globalThis.__mockDbQueryHandler = fn;
  },
  resetQueryHandler() {
    globalThis.__mockDbQueryHandler = null;
  }
};

module.exports = db;
