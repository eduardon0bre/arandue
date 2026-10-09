const db = require('../config/db');

const candidaturaModel = {
  async create({ demanda_id, diarista_id, mensagem }) {
    const query = `
      INSERT INTO candidaturas (demanda_id, diarista_id, status, mensagem)
      VALUES (?, ?, 'pendente', ?)
    `;
    const [result] = await db.query(query, [demanda_id, diarista_id, mensagem || null]);
    return { id: result.insertId, demanda_id, diarista_id, status: 'pendente', mensagem };
  },

  async findById(id) {
    const query = `
      SELECT 
        c.id,
        c.demanda_id,
        c.diarista_id,
        c.status,
        c.mensagem,
        c.data_criacao,
        u.nome AS diarista_nome,
        u.email AS diarista_email,
        u.telefone AS diarista_telefone,
        u.bairro AS diarista_bairro,
        d.titulo AS demanda_titulo,
        d.contratante_id
      FROM candidaturas c
      INNER JOIN usuarios u ON c.diarista_id = u.id
      INNER JOIN demandas d ON c.demanda_id = d.id
      WHERE c.id = ?
    `;
    const [rows] = await db.query(query, [id]);
    return rows[0] || null;
  },

  async findByDemandaId(demandaId) {
    const query = `
      SELECT 
        c.id,
        c.demanda_id,
        c.diarista_id,
        c.status,
        c.mensagem,
        c.data_criacao,
        u.nome AS diarista_nome,
        u.email AS diarista_email,
        u.telefone AS diarista_telefone,
        u.bairro AS diarista_bairro,
        (SELECT ROUND(AVG(nota), 1) FROM avaliacoes WHERE avaliado_id = u.id) AS diarista_nota_media,
        (SELECT COUNT(*) FROM candidaturas c2 WHERE c2.diarista_id = u.id AND c2.status = 'aceita') AS total_bicos_concluidos,
        cur.foto_url AS diarista_foto_url,
        cur.bio AS diarista_bio,
        cur.experiencia AS diarista_experiencia,
        cur.servicos AS diarista_servicos,
        cur.regioes AS diarista_regioes
      FROM candidaturas c
      INNER JOIN usuarios u ON c.diarista_id = u.id
      LEFT JOIN curriculos cur ON cur.usuario_id = u.id
      WHERE c.demanda_id = ?
      ORDER BY c.data_criacao ASC
    `;
    const [rows] = await db.query(query, [demandaId]);
    return rows;
  },

  async findByDiaristaId(diaristaId) {
    const query = `
      SELECT 
        c.id,
        c.demanda_id,
        c.status,
        c.status AS candidatura_status,
        c.mensagem,
        c.data_criacao AS candidatura_data,
        d.titulo AS demanda_titulo,
        d.categoria AS demanda_categoria,
        d.valor_diaria AS demanda_valor,
        d.data_servico AS demanda_data,
        d.data_servico AS demanda_data_servico,
        d.bairro AS demanda_bairro,
        d.status AS demanda_status,
        u.nome AS contratante_nome,
        u.telefone AS contratante_telefone
      FROM candidaturas c
      INNER JOIN demandas d ON c.demanda_id = d.id
      INNER JOIN usuarios u ON d.contratante_id = u.id
      WHERE c.diarista_id = ?
      ORDER BY d.data_servico DESC, c.data_criacao DESC
    `;
    const [rows] = await db.query(query, [diaristaId]);
    return rows;
  },

  async checkExisting(demandaId, diaristaId) {
    const [rows] = await db.query(
      'SELECT id FROM candidaturas WHERE demanda_id = ? AND diarista_id = ?',
      [demandaId, diaristaId]
    );
    return rows[0] || null;
  },

  async updateStatus(id, status) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Ao recusar, apaga imediatamente a candidatura
      if (status === 'recusada') {
        const [result] = await connection.query(
          'DELETE FROM candidaturas WHERE id = ?',
          [id]
        );
        await connection.commit();
        return result.affectedRows > 0;
      }

      // Atualiza o status da candidatura selecionada
      const [result] = await connection.query(
        'UPDATE candidaturas SET status = ? WHERE id = ?',
        [status, id]
      );

      if (result.affectedRows === 0) {
        await connection.rollback();
        return false;
      }

      // Se a candidatura for aceita, marca a demanda como preenchida
      // e remove automaticamente as demais candidaturas pendentes da mesma vaga
      if (status === 'aceita') {
        const [rows] = await connection.query(
          'SELECT demanda_id FROM candidaturas WHERE id = ?',
          [id]
        );
        if (rows.length > 0) {
          const demandaId = rows[0].demanda_id;
          await connection.query(
            "UPDATE demandas SET status = 'preenchida' WHERE id = ?",
            [demandaId]
          );
          await connection.query(
            "DELETE FROM candidaturas WHERE demanda_id = ? AND id != ? AND status = 'pendente'",
            [demandaId, id]
          );
        }
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async delete(id) {
    const [result] = await db.query('DELETE FROM candidaturas WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
};

module.exports = candidaturaModel;
