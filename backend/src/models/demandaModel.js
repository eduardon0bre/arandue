const db = require('../config/db');

const demandaModel = {
  async findAll({ categoria, status, contratante_id, busca } = {}) {
    let query = `
      SELECT 
        d.id,
        d.contratante_id,
        d.titulo,
        d.descricao,
        d.categoria,
        d.valor_diaria,
        d.data_servico,
        d.bairro,
        d.status,
        d.data_criacao,
        u.nome AS contratante_nome,
        u.telefone AS contratante_telefone,
        (SELECT COUNT(*) FROM candidaturas c WHERE c.demanda_id = d.id) AS total_candidatos
      FROM demandas d
      INNER JOIN usuarios u ON d.contratante_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (categoria) {
      query += ' AND d.categoria = ?';
      params.push(categoria);
    }

    if (status) {
      query += ' AND d.status = ?';
      params.push(status);
    }

    if (contratante_id) {
      query += ' AND d.contratante_id = ?';
      params.push(contratante_id);
    }

    if (busca) {
      query += ' AND (d.titulo LIKE ? OR d.descricao LIKE ? OR d.bairro LIKE ?)';
      const term = `%${busca}%`;
      params.push(term, term, term);
    }

    query += ' ORDER BY d.data_servico ASC, d.data_criacao DESC';

    const [rows] = await db.query(query, params);
    return rows;
  },

  async findById(id) {
    const query = `
      SELECT 
        d.id,
        d.contratante_id,
        d.titulo,
        d.descricao,
        d.categoria,
        d.valor_diaria,
        d.data_servico,
        d.bairro,
        d.status,
        d.data_criacao,
        u.nome AS contratante_nome,
        u.email AS contratante_email,
        u.telefone AS contratante_telefone,
        u.bairro AS contratante_bairro,
        (SELECT COUNT(*) FROM candidaturas c WHERE c.demanda_id = d.id) AS total_candidatos,
        (SELECT ROUND(AVG(nota), 1) FROM avaliacoes WHERE avaliado_id = u.id) AS contratante_nota_media
      FROM demandas d
      INNER JOIN usuarios u ON d.contratante_id = u.id
      WHERE d.id = ?
    `;
    const [rows] = await db.query(query, [id]);
    return rows[0] || null;
  },

  async create({ contratante_id, titulo, descricao, categoria, valor_diaria, data_servico, bairro, status = 'aberta' }) {
    const query = `
      INSERT INTO demandas (contratante_id, titulo, descricao, categoria, valor_diaria, data_servico, bairro, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(query, [
      contratante_id,
      titulo,
      descricao,
      categoria,
      valor_diaria,
      data_servico,
      bairro,
      status
    ]);
    return { id: result.insertId, contratante_id, titulo, descricao, categoria, valor_diaria, data_servico, bairro, status };
  },

  async update(id, { titulo, descricao, categoria, valor_diaria, data_servico, bairro, status }) {
    const query = `
      UPDATE demandas 
      SET 
        titulo = COALESCE(?, titulo),
        descricao = COALESCE(?, descricao),
        categoria = COALESCE(?, categoria),
        valor_diaria = COALESCE(?, valor_diaria),
        data_servico = COALESCE(?, data_servico),
        bairro = COALESCE(?, bairro),
        status = COALESCE(?, status)
      WHERE id = ?
    `;
    const [result] = await db.query(query, [
      titulo,
      descricao,
      categoria,
      valor_diaria,
      data_servico,
      bairro,
      status,
      id
    ]);
    return result.affectedRows > 0;
  },

  async delete(id) {
    const [result] = await db.query('DELETE FROM demandas WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
};

module.exports = demandaModel;
