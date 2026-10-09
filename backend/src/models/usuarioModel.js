const db = require('../config/db');

const usuarioModel = {
  async findAll() {
    const [rows] = await db.query(
      `SELECT 
        u.id, u.nome, u.email, u.telefone, u.tipo, u.bairro, u.data_criacao,
        (SELECT ROUND(AVG(nota), 1) FROM avaliacoes WHERE avaliado_id = u.id) AS nota_media,
        (SELECT COUNT(*) FROM avaliacoes WHERE avaliado_id = u.id) AS total_avaliacoes
       FROM usuarios u 
       ORDER BY u.nome ASC`
    );
    return rows;
  },

  async findById(id) {
    const [rows] = await db.query(
      `SELECT 
        u.id, u.nome, u.email, u.telefone, u.tipo, u.bairro, u.data_criacao,
        (SELECT ROUND(AVG(nota), 1) FROM avaliacoes WHERE avaliado_id = u.id) AS nota_media,
        (SELECT COUNT(*) FROM avaliacoes WHERE avaliado_id = u.id) AS total_avaliacoes
       FROM usuarios u 
       WHERE u.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  async findByTipo(tipo) {
    const [rows] = await db.query(
      `SELECT 
        u.id, u.nome, u.email, u.telefone, u.tipo, u.bairro, u.data_criacao,
        (SELECT ROUND(AVG(nota), 1) FROM avaliacoes WHERE avaliado_id = u.id) AS nota_media,
        (SELECT COUNT(*) FROM avaliacoes WHERE avaliado_id = u.id) AS total_avaliacoes
       FROM usuarios u 
       WHERE u.tipo = ? 
       ORDER BY u.nome ASC`,
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
