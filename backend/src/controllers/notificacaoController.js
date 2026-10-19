const notificacaoModel = require('../models/notificacaoModel');
const notificationService = require('../services/notificationService');

const notificacaoController = {
  /**
   * Lista notificações e o contador de não lidas do usuário autenticado.
   * GET /api/notificacoes
   */
  async listar(req, res) {
    try {
      const usuarioId = req.usuario.id;
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;

      const [notificacoes, total_nao_lidas] = await Promise.all([
        notificacaoModel.findByUsuarioId(usuarioId, limit),
        notificacaoModel.countNaoLidas(usuarioId)
      ]);

      return res.status(200).json({
        success: true,
        data: {
          notificacoes,
          total_nao_lidas
        }
      });
    } catch (error) {
      console.error('Erro ao listar notificações:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno ao consultar notificações.'
      });
    }
  },

  /**
   * Marca todas as notificações do usuário autenticado como lidas.
   * PATCH /api/notificacoes/ler-todas
   */
  async marcarTodasComoLidas(req, res) {
    try {
      const usuarioId = req.usuario.id;
      await notificacaoModel.marcarTodasComoLidas(usuarioId);

      return res.status(200).json({
        success: true,
        message: 'Todas as notificações foram marcadas como lidas.'
      });
    } catch (error) {
      console.error('Erro ao marcar todas notificações como lidas:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno ao atualizar notificações.'
      });
    }
  },

  /**
   * Marca uma notificação específica como lida.
   * PATCH /api/notificacoes/:id/lida
   */
  async marcarComoLida(req, res) {
    try {
      const usuarioId = req.usuario.id;
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Identificador de notificação inválido.'
        });
      }

      await notificacaoModel.marcarComoLida(Number(id), usuarioId);

      return res.status(200).json({
        success: true,
        message: 'Notificação marcada como lida.'
      });
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno ao marcar notificação como lida.'
      });
    }
  },

  /**
   * Dispara notificação de teste para o usuário autenticado.
   * POST /api/notificacoes/testar
   */
  async testar(req, res) {
    try {
      const usuarioId = req.usuario.id;

      const resultado = await notificationService.dispararNotificacao({
        usuario_id: usuarioId,
        tipo: 'teste',
        titulo: 'Teste de Notificação Aranduê',
        mensagem: 'Este é um teste do sistema de notificações multi-canal. Suas preferências de comunicação estão ativas!',
        metadata: {
          origem: 'teste_manual',
          timestamp: new Date().toISOString()
        }
      });

      return res.status(200).json({
        success: true,
        data: {
          canais_enviados: resultado.canais_enviados,
          resultados: resultado.resultados,
          notificacao: resultado.notificacao
        },
        message: 'Notificação de teste processada com sucesso.'
      });
    } catch (error) {
      console.error('Erro ao disparar notificação de teste:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno ao enviar notificação de teste.'
      });
    }
  },

  /**
   * Registra ou atualiza o push_token para o dispositivo do usuário logado.
   * POST /api/notificacoes/push-token
   */
  async salvarPushToken(req, res) {
    try {
      const usuarioId = req.usuario.id;
      const { push_token } = req.body || {};

      if (!push_token || typeof push_token !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'O campo push_token é obrigatório.'
        });
      }

      await notificacaoModel.salvarPushToken(usuarioId, push_token.trim());

      return res.status(200).json({
        success: true,
        message: 'Push token salvo com sucesso.',
        data: {
          push_token: push_token.trim()
        }
      });
    } catch (error) {
      console.error('Erro ao salvar push token:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno ao salvar token de notificação push.'
      });
    }
  },

  /**
   * Dispara notificação (E-mail, WhatsApp, Push) quando um contratante entra em contato com um diarista.
   * Respeita rigorosamente as preferências (notif_whatsapp, notif_email, notif_push) do diarista.
   * POST /api/notificacoes/contato-diarista
   */
  async contatarDiarista(req, res) {
    try {
      const { diarista_id, contratante_nome, horario_interesse, vaga_titulo, mensagem_adicional } = req.body || {};

      if (!diarista_id || isNaN(diarista_id)) {
        return res.status(400).json({
          success: false,
          message: 'O campo diarista_id é obrigatório.'
        });
      }

      const nomeContratante =
        req.usuario?.nome || contratante_nome || 'Um contratante da plataforma Aranduê';
      const emailContratante = req.usuario?.email ? ` (${req.usuario.email})` : '';
      const telefoneContratante = req.usuario?.telefone ? ` | Tel: ${req.usuario.telefone}` : '';

      let detalhes = `${nomeContratante}${emailContratante}${telefoneContratante} iniciou contato com você pelo Aranduê para combinar uma diária.`;
      if (vaga_titulo) {
        detalhes += `\n• Vaga/Serviço: "${vaga_titulo}"`;
      }
      if (horario_interesse) {
        detalhes += `\n• Data/Horário de interesse: ${horario_interesse}`;
      }
      if (mensagem_adicional) {
        detalhes += `\n• Mensagem: "${mensagem_adicional}"`;
      }

      const resultado = await notificationService.dispararNotificacao({
        usuario_id: Number(diarista_id),
        tipo: 'contato_contratante',
        titulo: `Novo interesse de contratação: ${nomeContratante}`,
        mensagem: detalhes,
        metadata: {
          origem: 'contato_contratante',
          contratante_id: req.usuario?.id || null,
          contratante_nome: nomeContratante,
          horario_interesse: horario_interesse || null,
          vaga_titulo: vaga_titulo || null
        }
      });

      return res.status(200).json({
        success: true,
        data: {
          canais_enviados: resultado.canais_enviados,
          resultados: resultado.resultados,
          notificacao: resultado.notificacao
        },
        message: 'Notificação de contato enviada ao diarista conforme as preferências configuradas.'
      });
    } catch (error) {
      console.error('Erro ao notificar contato com diarista:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno ao processar notificação de contato.'
      });
    }
  }
};

module.exports = notificacaoController;
