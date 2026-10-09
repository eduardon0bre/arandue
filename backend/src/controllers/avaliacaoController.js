const avaliacaoModel = require('../models/avaliacaoModel');

const avaliacaoController = {
  async criar(req, res) {
    try {
      const { demanda_id, avaliado_id, nota, comentario } = req.body;
      const avaliador_id = req.usuario ? req.usuario.id : req.body.avaliador_id;

      if (!demanda_id || !avaliador_id || !avaliado_id || nota === undefined) {
        return res.status(400).json({
          success: false,
          message: 'demanda_id, avaliador_id, avaliado_id e nota são obrigatórios.'
        });
      }

      const notaNum = parseInt(nota, 10);
      if (isNaN(notaNum) || notaNum < 1 || notaNum > 5) {
        return res.status(400).json({
          success: false,
          message: 'A nota deve ser um número inteiro entre 1 e 5.'
        });
      }

      // Impede avaliação duplicada para a mesma demanda pelo mesmo avaliador
      const jaAvaliou = await avaliacaoModel.findByDemandaAndAvaliador(demanda_id, avaliador_id);
      if (jaAvaliou) {
        return res.status(400).json({
          success: false,
          message: 'Você já enviou uma avaliação para este serviço.'
        });
      }

      const novaAvaliacao = await avaliacaoModel.create({
        demanda_id,
        avaliador_id,
        avaliado_id,
        nota: notaNum,
        comentario: comentario ? String(comentario).trim() : null
      });

      return res.status(201).json({
        success: true,
        data: novaAvaliacao,
        message: 'Avaliação registrada com sucesso!'
      });
    } catch (error) {
      console.error('Erro ao registrar avaliação:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno ao registrar avaliação.'
      });
    }
  },

  async listarPorDemanda(req, res) {
    try {
      const { id } = req.params;
      const avaliacoes = await avaliacaoModel.findByDemandaId(id);
      return res.status(200).json({
        success: true,
        data: avaliacoes
      });
    } catch (error) {
      console.error('Erro ao listar avaliações da demanda:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno ao consultar avaliações.'
      });
    }
  },

  async listarPorUsuario(req, res) {
    try {
      const { id } = req.params;
      const [avaliacoes, resumo] = await Promise.all([
        avaliacaoModel.findByUsuarioId(id),
        avaliacaoModel.getMediaByUsuarioId(id)
      ]);
      return res.status(200).json({
        success: true,
        data: avaliacoes,
        resumo
      });
    } catch (error) {
      console.error('Erro ao listar avaliações do usuário:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno ao consultar avaliações.'
      });
    }
  },

  async obterMedia(req, res) {
    try {
      const { id } = req.params;
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Identificador de usuário inválido.'
        });
      }
      const media = await avaliacaoModel.getMediaByUsuarioId(id);
      return res.status(200).json({
        success: true,
        data: media
      });
    } catch (error) {
      console.error('Erro ao calcular média de avaliações:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno ao calcular média de avaliações.'
      });
    }
  },

  async listarEnviadas(req, res) {
    try {
      const usuarioId = req.params.id || (req.usuario ? req.usuario.id : null);
      if (!usuarioId || isNaN(usuarioId)) {
        return res.status(400).json({
          success: false,
          message: 'Identificador de usuário inválido.'
        });
      }

      const avaliacoes = await avaliacaoModel.findByAvaliadorId(usuarioId);
      return res.status(200).json({
        success: true,
        data: avaliacoes
      });
    } catch (error) {
      console.error('Erro ao listar avaliações enviadas:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno ao consultar avaliações enviadas.'
      });
    }
  }
};

module.exports = avaliacaoController;
