const db = require('../config/db');

const usuarioModel = {
  async findAll() {
    const [rows] = await db.query(
      'SELECT id, nome, email, telefone, tipo, bairro, data_criacao FROM usuarios ORDER BY nome ASC'
    );
    return rows;
  },

  async findById(id) {
    const [rows] = await db.query(
      'SELECT id, nome, email, telefone, tipo, bairro, data_criacao FROM usuarios WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  async findByTipo(tipo) {
    const [rows] = await db.query(
      'SELECT id, nome, email, telefone, tipo, bairro, data_criacao FROM usuarios WHERE tipo = ? ORDER BY nome ASC',
      [tipo]
    );
    return rows;
  },

  async create(usuario) {
    const { nome, email, telefone, tipo, bairro } = usuario;
    const [result] = await db.query(
      'INSERT INTO usuarios (nome, email, telefone, tipo, bairro) VALUES (?, ?, ?, ?, ?)',
      [nome, email, telefone, tipo, bairro]
    );
    return { id: result.insertId, ...usuario };
  }
};

module.exports = usuarioModel;
