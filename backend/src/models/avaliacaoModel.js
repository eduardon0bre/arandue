const db = require('../config/db');

const avaliacaoModel = {
  async create({ demanda_id, avaliador_id, avaliado_id, nota, comentario }) {
    const query = `
      INSERT INTO avaliacoes (demanda_id, avaliador_id, avaliado_id, nota, comentario)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(query, [
      demanda_id,
      avaliador_id,
      avaliado_id,
      nota,
      comentario || null
    ]);
    return { id: result.insertId, demanda_id, avaliador_id, avaliado_id, nota, comentario };
  },

  async findByDemandaId(demandaId) {
    const query = `
      SELECT 
        a.id,
        a.demanda_id,
        a.avaliador_id,
        a.avaliado_id,
        a.nota,
        a.comentario,
        a.data_criacao,
        u_avaliador.nome AS avaliador_nome,
        u_avaliado.nome AS avaliado_nome
      FROM avaliacoes a
      INNER JOIN usuarios u_avaliador ON a.avaliador_id = u_avaliador.id
      INNER JOIN usuarios u_avaliado ON a.avaliado_id = u_avaliado.id
      WHERE a.demanda_id = ?
    `;
    const [rows] = await db.query(query, [demandaId]);
    return rows;
  },

  async findByUsuarioId(usuarioId) {
    const query = `
      SELECT 
        a.id,
        a.demanda_id,
        a.nota,
        a.comentario,
        a.data_criacao,
        u.nome AS avaliador_nome,
        d.titulo AS demanda_titulo
      FROM avaliacoes a
      INNER JOIN usuarios u ON a.avaliador_id = u.id
      INNER JOIN demandas d ON a.demanda_id = d.id
      WHERE a.avaliado_id = ?
      ORDER BY a.data_criacao DESC
    `;
    const [rows] = await db.query(query, [usuarioId]);
    return rows;
  }
};

module.exports = avaliacaoModel;
