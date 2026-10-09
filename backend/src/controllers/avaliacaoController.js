const avaliacaoModel = require('../models/avaliacaoModel');

const avaliacaoController = {
  async criar(req, res) {
    try {
      const { demanda_id, avaliador_id, avaliado_id, nota, comentario } = req.body;

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

      const novaAvaliacao = await avaliacaoModel.create({
        demanda_id,
        avaliador_id,
        avaliado_id,
        nota: notaNum,
        comentario
      });

      return res.status(201).json({
        success: true,
        data: novaAvaliacao
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
      const avaliacoes = await avaliacaoModel.findByUsuarioId(id);
      return res.status(200).json({
        success: true,
        data: avaliacoes
      });
    } catch (error) {
      console.error('Erro ao listar avaliações do usuário:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno ao consultar avaliações.'
      });
    }
  }
};

module.exports = avaliacaoController;
