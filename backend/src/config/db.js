const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

// Configuração flexível de pool compatível com Railway (MYSQL_URL, MYSQLHOST) e ambiente local
let poolConfig;

const connectionUri = process.env.MYSQL_URL || process.env.DATABASE_URL || process.env.MYSQL_PUBLIC_URL;

if (connectionUri) {
  poolConfig = {
    uri: connectionUri,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4'
  };
} else {
  poolConfig = {
    host: process.env.DB_HOST || process.env.MYSQLHOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || process.env.MYSQLPORT) || 3308,
    user: process.env.DB_USER || process.env.MYSQLUSER || 'bicos_user',
    password: process.env.DB_PASS || process.env.MYSQLPASSWORD || 'bicos_password',
    database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'quadro_bicos_db',
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };
}

if (process.env.DB_SSL === 'true' || process.env.MYSQL_SSL === 'true') {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = mysql.createPool(poolConfig);

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
  async getConnection() {
    if (globalThis.__mockDbConnectionHandler) {
      return globalThis.__mockDbConnectionHandler();
    }
    if (globalThis.__mockDbQueryHandler) {
      return {
        query: (sql, params) => globalThis.__mockDbQueryHandler(sql, params),
        execute: (sql, params) => globalThis.__mockDbQueryHandler(sql, params),
        beginTransaction: async () => {},
        commit: async () => {},
        rollback: async () => {},
        release: () => {}
      };
    }
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
