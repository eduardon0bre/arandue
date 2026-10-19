const db = require('../config/db');
const notificacaoModel = require('../models/notificacaoModel');
const whatsappProvider = require('./providers/whatsappProvider');
const emailProvider = require('./providers/emailProvider');
const pushProvider = require('./providers/pushProvider');

/**
 * Busca os dados de comunicação e preferências do usuário de forma segura.
 */
async function buscarUsuarioParaNotificacao(usuario_id) {
  try {
    const [rows] = await db.query(
      `SELECT id, nome, email, telefone, notif_whatsapp, notif_email, notif_push, push_token
       FROM usuarios
       WHERE id = ?`,
      [usuario_id]
    );
    return rows && rows[0] ? rows[0] : null;
  } catch (error) {
    console.warn('[notificationService] Falha ao consultar preferências do usuário:', error.message);
    return null;
  }
}

const notificationService = {
  /**
   * Dispara notificação multi-canal respeitando as preferências individuais do usuário.
   *
   * @param {Object} params
   * @param {number} params.usuario_id - ID do destinatário
   * @param {string} [params.tipo='sistema'] - Tipo do evento (ex: 'candidatura_recebida', 'candidatura_aceita', etc.)
   * @param {string} params.titulo - Título da notificação
   * @param {string} params.mensagem - Texto da notificação
   * @param {Object} [params.metadata] - Dados contextuais adicionais
   * @returns {Promise<{ success: boolean, canais_enviados: string[], resultados: Object, notificacao?: Object, error?: string }>}
   */
  async dispararNotificacao({ usuario_id, tipo = 'sistema', titulo, mensagem, metadata = {} }) {
    try {
      if (!usuario_id || !titulo || !mensagem) {
        console.warn('[notificationService] Parâmetros obrigatórios ausentes:', { usuario_id, titulo });
        return {
          success: false,
          canais_enviados: [],
          resultados: {},
          error: 'Parâmetros obrigatórios ausentes.'
        };
      }

      // 1. Busca preferências e contatos do destinatário
      const usuario = await buscarUsuarioParaNotificacao(usuario_id);
      if (!usuario) {
        console.warn(`[notificationService] Usuário ID ${usuario_id} não localizado.`);
        return {
          success: false,
          canais_enviados: [],
          resultados: {},
          error: `Usuário ${usuario_id} não encontrado.`
        };
      }

      // 2. Validação rigorosa dos canais autorizados pelo usuário
      const querWhatsapp = Boolean(usuario.notif_whatsapp);
      const querEmail = Boolean(usuario.notif_email);
      const querPush = Boolean(usuario.notif_push);

      const canaisAtivos = [];
      const disparos = [];
      const mapaResultados = {};

      // 2.1 WhatsApp
      if (querWhatsapp && (usuario.telefone || metadata?.telefone)) {
        const tel = usuario.telefone || metadata.telefone;
        canaisAtivos.push('whatsapp');
        disparos.push(
          whatsappProvider
            .sendWhatsApp({
              to: tel,
              message: `*${titulo}*\n\n${mensagem}\n\n_Equipe Aranduê_`
            })
            .then((res) => {
              mapaResultados.whatsapp = res;
            })
            .catch((err) => {
              mapaResultados.whatsapp = { success: false, error: err.message };
            })
        );
      }

      // 2.2 E-mail
      if (querEmail && (usuario.email || metadata?.email)) {
        const destEmail = usuario.email || metadata.email;
        canaisAtivos.push('email');
        disparos.push(
          emailProvider
            .sendEmail({
              to: destEmail,
              subject: titulo,
              message: mensagem,
              destinatarioNome: usuario.nome
            })
            .then((res) => {
              mapaResultados.email = res;
            })
            .catch((err) => {
              mapaResultados.email = { success: false, error: err.message };
            })
        );
      }

      // 2.3 Push Mobile (Expo)
      const tokenPush = usuario.push_token || metadata?.push_token;
      if (querPush) {
        canaisAtivos.push('push');
        disparos.push(
          pushProvider
            .sendPushNotification({
              pushToken: tokenPush,
              title: titulo,
              body: mensagem,
              data: {
                tipo,
                ...metadata
              }
            })
            .then((res) => {
              mapaResultados.push = res;
            })
            .catch((err) => {
              mapaResultados.push = { success: false, error: err.message };
            })
        );
      }

      // Executa todos os envios de forma paralela
      await Promise.all(disparos);

      // 3. Persistência no histórico de notificações
      const canaisString = canaisAtivos.join(',');
      const notificacaoSalva = await notificacaoModel.create({
        usuario_id,
        tipo,
        titulo,
        mensagem,
        canais_enviados: canaisString,
        push_token: tokenPush || null
      });

      return {
        success: true,
        canais_enviados: canaisAtivos,
        resultados: mapaResultados,
        notificacao: notificacaoSalva
      };
    } catch (error) {
      console.error('[notificationService] Falha segura ao processar notificação:', error);
      return {
        success: false,
        canais_enviados: [],
        resultados: {},
        error: error.message
      };
    }
  }
};

module.exports = notificationService;
