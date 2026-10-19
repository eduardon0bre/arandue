const db = require('../config/db');

const disponibilidadeModel = {
  /**
   * Lista disponibilidades de um diarista com filtros opcionais de data
   */
  async findByDiarista(diaristaId, { dataInicio, dataFim, status } = {}) {
    let query = `
      SELECT 
        d.id,
        d.diarista_id,
        DATE_FORMAT(d.data, '%Y-%m-%d') AS data,
        DATE_FORMAT(d.hora_inicio, '%H:%i') AS hora_inicio,
        DATE_FORMAT(d.hora_fim, '%H:%i') AS hora_fim,
        d.status,
        d.observacao,
        d.data_criacao
      FROM disponibilidades d
      WHERE d.diarista_id = ?
    `;
    const params = [diaristaId];

    if (dataInicio) {
      query += ' AND d.data >= ?';
      params.push(dataInicio);
    }

    if (dataFim) {
      query += ' AND d.data <= ?';
      params.push(dataFim);
    }

    if (status) {
      query += ' AND d.status = ?';
      params.push(status);
    }

    query += ' ORDER BY d.data ASC, d.hora_inicio ASC';

    const [rows] = await db.query(query, params);
    return rows;
  },

  /**
   * Busca um horário de disponibilidade por ID
   */
  async findById(id) {
    const query = `
      SELECT 
        d.id,
        d.diarista_id,
        DATE_FORMAT(d.data, '%Y-%m-%d') AS data,
        DATE_FORMAT(d.hora_inicio, '%H:%i') AS hora_inicio,
        DATE_FORMAT(d.hora_fim, '%H:%i') AS hora_fim,
        d.status,
        d.observacao,
        d.data_criacao,
        u.nome AS diarista_nome
      FROM disponibilidades d
      INNER JOIN usuarios u ON d.diarista_id = u.id
      WHERE d.id = ?
    `;
    const [rows] = await db.query(query, [id]);
    return rows[0] || null;
  },

  /**
   * Cria um novo horário de disponibilidade
   */
  async create({ diarista_id, data, hora_inicio, hora_fim, status = 'disponivel', observacao = '' }) {
    const query = `
      INSERT INTO disponibilidades (diarista_id, data, hora_inicio, hora_fim, status, observacao)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(query, [
      diarista_id,
      data,
      hora_inicio,
      hora_fim,
      status,
      observacao || null
    ]);

    return {
      id: result.insertId,
      diarista_id,
      data,
      hora_inicio,
      hora_fim,
      status,
      observacao
    };
  },

  /**
   * Remove um horário de disponibilidade (garantindo que pertence ao diarista)
   */
  async delete(id, diarista_id) {
    const query = 'DELETE FROM disponibilidades WHERE id = ? AND diarista_id = ?';
    const [result] = await db.query(query, [id, diarista_id]);
    return result.affectedRows > 0;
  },

  /**
   * Atualiza status ou dados de um horário
   */
  async update(id, diarista_id, { data, hora_inicio, hora_fim, status, observacao }) {
    const campos = [];
    const params = [];

    if (data) {
      campos.push('data = ?');
      params.push(data);
    }
    if (hora_inicio) {
      campos.push('hora_inicio = ?');
      params.push(hora_inicio);
    }
    if (hora_fim) {
      campos.push('hora_fim = ?');
      params.push(hora_fim);
    }
    if (status) {
      campos.push('status = ?');
      params.push(status);
    }
    if (observacao !== undefined) {
      campos.push('observacao = ?');
      params.push(observacao || null);
    }

    if (campos.length === 0) return true;

    params.push(id, diarista_id);
    const query = `UPDATE disponibilidades SET ${campos.join(', ')} WHERE id = ? AND diarista_id = ?`;
    const [result] = await db.query(query, params);
    return result.affectedRows > 0;
  },

  /**
   * Busca diaristas disponíveis com filtros de busca, data, bairro e serviço
   */
  async buscarDiaristas({ data, bairro, servico, busca } = {}) {
    let query = `
      SELECT 
        u.id,
        u.nome,
        u.email,
        u.telefone,
        u.tipo,
        u.bairro,
        u.avatar_url,
        c.foto_url,
        c.bio,
        c.experiencia,
        c.servicos,
        c.regioes,
        (SELECT ROUND(AVG(nota), 1) FROM avaliacoes WHERE avaliado_id = u.id) AS nota_media,
        (SELECT COUNT(*) FROM avaliacoes WHERE avaliado_id = u.id) AS total_avaliacoes,
        (SELECT COUNT(*) FROM candidaturas WHERE diarista_id = u.id AND status = 'aceita') AS total_concluidos
      FROM usuarios u
      LEFT JOIN curriculos c ON u.id = c.usuario_id
      WHERE u.status = 'ativo'
        AND u.tipo IN ('diarista', 'ambos')
    `;
    const params = [];

    if (bairro) {
      query += ' AND (u.bairro LIKE ? OR c.regioes LIKE ?)';
      params.push(`%${bairro}%`, `%${bairro}%`);
    }

    if (servico) {
      query += ' AND c.servicos LIKE ?';
      params.push(`%${servico}%`);
    }

    if (busca) {
      query += ' AND (u.nome LIKE ? OR c.bio LIKE ? OR c.servicos LIKE ? OR u.bairro LIKE ?)';
      const termo = `%${busca}%`;
      params.push(termo, termo, termo, termo);
    }

    if (data) {
      // Exige que o diarista tenha ao menos um horário 'disponivel' na data solicitada
      query += `
        AND EXISTS (
          SELECT 1 FROM disponibilidades disp
          WHERE disp.diarista_id = u.id
            AND disp.data = ?
            AND disp.status = 'disponivel'
        )
      `;
      params.push(data);
    }

    query += ' ORDER BY nota_media DESC, u.nome ASC';

    const [rows] = await db.query(query, params);

    // Carrega os próximos horários disponíveis de cada diarista
    const diaristasEnriquecidos = await Promise.all(
      rows.map(async (diarista) => {
        let servicosArray = [];
        try {
          servicosArray = typeof diarista.servicos === 'string'
            ? JSON.parse(diarista.servicos)
            : (diarista.servicos || []);
        } catch {
          servicosArray = diarista.servicos ? diarista.servicos.split(',').map((s) => s.trim()) : [];
        }

        // Busca próximos slots disponíveis a partir de hoje
        const [slots] = await db.query(
          `SELECT 
            id,
            DATE_FORMAT(data, '%Y-%m-%d') AS data,
            DATE_FORMAT(hora_inicio, '%H:%i') AS hora_inicio,
            DATE_FORMAT(hora_fim, '%H:%i') AS hora_fim,
            status,
            observacao
           FROM disponibilidades
           WHERE diarista_id = ?
             AND status = 'disponivel'
           ORDER BY data ASC, hora_inicio ASC
           LIMIT 10`,
          [diarista.id]
        );

        return {
          ...diarista,
          servicos: servicosArray,
          nota_media: diarista.nota_media ? Number(diarista.nota_media) : 5.0,
          total_avaliacoes: Number(diarista.total_avaliacoes || 0),
          total_concluidos: Number(diarista.total_concluidos || 0),
          proximas_disponibilidades: slots || []
        };
      })
    );

    return diaristasEnriquecidos;
  }
};

module.exports = disponibilidadeModel;
