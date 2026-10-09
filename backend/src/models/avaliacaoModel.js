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
        u_avaliador.tipo AS avaliador_tipo,
        CASE 
          WHEN u_avaliador.tipo = 'contratante' THEN 'Contratante verificado'
          WHEN u_avaliador.tipo = 'diarista' THEN 'Diarista verificado'
          ELSE 'Usuário da plataforma'
        END AS avaliador_nome,
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
        u.tipo AS avaliador_tipo,
        CASE 
          WHEN u.tipo = 'contratante' THEN 'Contratante verificado'
          WHEN u.tipo = 'diarista' THEN 'Diarista verificado'
          ELSE 'Usuário da plataforma'
        END AS avaliador_nome,
        d.titulo AS demanda_titulo
      FROM avaliacoes a
      INNER JOIN usuarios u ON a.avaliador_id = u.id
      INNER JOIN demandas d ON a.demanda_id = d.id
      WHERE a.avaliado_id = ?
      ORDER BY a.data_criacao DESC
    `;
    const [rows] = await db.query(query, [usuarioId]);
    return rows;
  },

  async findByDemandaAndAvaliador(demandaId, avaliadorId) {
    const query = `
      SELECT * FROM avaliacoes WHERE demanda_id = ? AND avaliador_id = ?
    `;
    const [rows] = await db.query(query, [demandaId, avaliadorId]);
    return rows[0] || null;
  },

  async findByAvaliadorId(avaliadorId) {
    const query = `
      SELECT 
        a.id,
        a.demanda_id,
        a.avaliador_id,
        a.avaliado_id,
        a.nota,
        a.comentario,
        a.data_criacao,
        u_avaliado.nome AS avaliado_nome,
        d.titulo AS demanda_titulo
      FROM avaliacoes a
      INNER JOIN usuarios u_avaliado ON a.avaliado_id = u_avaliado.id
      INNER JOIN demandas d ON a.demanda_id = d.id
      WHERE a.avaliador_id = ?
      ORDER BY a.data_criacao DESC
    `;
    const [rows] = await db.query(query, [avaliadorId]);
    return rows;
  },

  async getMediaByUsuarioId(usuarioId) {
    const query = `
      SELECT 
        COUNT(*) AS total_avaliacoes,
        COALESCE(ROUND(AVG(nota), 1), 0.0) AS nota_media,
        COALESCE(SUM(CASE WHEN nota = 5 THEN 1 ELSE 0 END), 0) AS estrelas_5,
        COALESCE(SUM(CASE WHEN nota = 4 THEN 1 ELSE 0 END), 0) AS estrelas_4,
        COALESCE(SUM(CASE WHEN nota = 3 THEN 1 ELSE 0 END), 0) AS estrelas_3,
        COALESCE(SUM(CASE WHEN nota = 2 THEN 1 ELSE 0 END), 0) AS estrelas_2,
        COALESCE(SUM(CASE WHEN nota = 1 THEN 1 ELSE 0 END), 0) AS estrelas_1
      FROM avaliacoes
      WHERE avaliado_id = ?
    `;
    const [rows] = await db.query(query, [usuarioId]);
    const r = rows[0] || {};
    const total = Number(r.total_avaliacoes || 0);
    const media = Number(r.nota_media || 0);

    return {
      usuario_id: Number(usuarioId),
      total_avaliacoes: total,
      nota_media: total > 0 ? media : 0.0,
      distribuicao: {
        5: Number(r.estrelas_5 || 0),
        4: Number(r.estrelas_4 || 0),
        3: Number(r.estrelas_3 || 0),
        2: Number(r.estrelas_2 || 0),
        1: Number(r.estrelas_1 || 0)
      }
    };
  }
};

module.exports = avaliacaoModel;
