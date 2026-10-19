const db = require('../config/db');

const notificacaoModel = {
  /**
   * Registra uma nova notificação no banco de dados.
   * @param {Object} dados
   * @param {number} dados.usuario_id
   * @param {string} [dados.tipo='sistema']
   * @param {string} dados.titulo
   * @param {string} dados.mensagem
   * @param {string} [dados.canais_enviados='']
   * @param {string|null} [dados.push_token=null]
   * @returns {Promise<Object>}
   */
  async create({ usuario_id, tipo = 'sistema', titulo, mensagem, canais_enviados = '', push_token = null }) {
    try {
      const [result] = await db.query(
        `INSERT INTO notificacoes (usuario_id, tipo, titulo, mensagem, canais_enviados, push_token)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [usuario_id, tipo, titulo, mensagem, canais_enviados, push_token]
      );

      return {
        id: result?.insertId || 1,
        usuario_id,
        tipo,
        titulo,
        mensagem,
        canais_enviados,
        push_token,
        lida: false,
        data_criacao: new Date().toISOString()
      };
    } catch (error) {
      console.warn('[notificacaoModel.create] Alerta/Fallback ao persistir notificação:', error.message);
      return {
        id: 0,
        usuario_id,
        tipo,
        titulo,
        mensagem,
        canais_enviados,
        push_token,
        lida: false,
        data_criacao: new Date().toISOString()
      };
    }
  },

  /**
   * Lista as notificações de um usuário, ordenadas pela mais recente.
   * @param {number} usuario_id
   * @param {number} [limit=50]
   * @returns {Promise<Array>}
   */
  async findByUsuarioId(usuario_id, limit = 50) {
    try {
      const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 100));
      const [rows] = await db.query(
        `SELECT id, usuario_id, tipo, titulo, mensagem, canais_enviados, lida, push_token, data_criacao
         FROM notificacoes
         WHERE usuario_id = ?
         ORDER BY data_criacao DESC, id DESC
         LIMIT ${safeLimit}`,
        [usuario_id]
      );
      return Array.isArray(rows) ? rows : [];
    } catch (error) {
      console.warn('[notificacaoModel.findByUsuarioId] Alerta ao consultar notificações:', error.message);
      return [];
    }
  },

  /**
   * Retorna a quantidade de notificações não lidas de um usuário.
   * @param {number} usuario_id
   * @returns {Promise<number>}
   */
  async countNaoLidas(usuario_id) {
    try {
      const [rows] = await db.query(
        `SELECT COUNT(*) AS total
         FROM notificacoes
         WHERE usuario_id = ? AND lida = FALSE`,
        [usuario_id]
      );
      if (rows && rows.length > 0) {
        return Number(rows[0].total || 0);
      }
      return 0;
    } catch (error) {
      console.warn('[notificacaoModel.countNaoLidas] Alerta ao contar não lidas:', error.message);
      return 0;
    }
  },

  /**
   * Marca uma notificação específica como lida.
   * @param {number} id
   * @param {number} usuario_id
   * @returns {Promise<{ success: boolean, affectedRows: number }>}
   */
  async marcarComoLida(id, usuario_id) {
    try {
      const [result] = await db.query(
        `UPDATE notificacoes
         SET lida = TRUE
         WHERE id = ? AND usuario_id = ?`,
        [id, usuario_id]
      );
      return {
        success: true,
        affectedRows: result?.affectedRows || 0
      };
    } catch (error) {
      console.warn('[notificacaoModel.marcarComoLida] Alerta ao marcar como lida:', error.message);
      return {
        success: false,
        affectedRows: 0
      };
    }
  },

  /**
   * Marca todas as notificações do usuário como lidas.
   * @param {number} usuario_id
   * @returns {Promise<{ success: boolean, affectedRows: number }>}
   */
  async marcarTodasComoLidas(usuario_id) {
    try {
      const [result] = await db.query(
        `UPDATE notificacoes
         SET lida = TRUE
         WHERE usuario_id = ? AND lida = FALSE`,
        [usuario_id]
      );
      return {
        success: true,
        affectedRows: result?.affectedRows || 0
      };
    } catch (error) {
      console.warn('[notificacaoModel.marcarTodasComoLidas] Alerta ao marcar todas lidas:', error.message);
      return {
        success: false,
        affectedRows: 0
      };
    }
  },

  /**
   * Atualiza ou cadastra o push_token na tabela do usuário.
   * @param {number} usuario_id
   * @param {string|null} push_token
   * @returns {Promise<{ success: boolean, usuario_id: number, push_token: string|null }>}
   */
  async salvarPushToken(usuario_id, push_token) {
    try {
      await db.query(
        `UPDATE usuarios
         SET push_token = ?
         WHERE id = ?`,
        [push_token, usuario_id]
      );
      return {
        success: true,
        usuario_id,
        push_token
      };
    } catch (error) {
      console.warn('[notificacaoModel.salvarPushToken] Alerta ao salvar push_token:', error.message);
      return {
        success: false,
        usuario_id,
        push_token
      };
    }
  }
};

module.exports = notificacaoModel;
