const disponibilidadeModel = require('../models/disponibilidadeModel');

const disponibilidadeController = {
  /**
   * GET /api/disponibilidades/minhas
   * Lista os horários de disponibilidade do diarista logado
   */
  async listarMinhas(req, res) {
    try {
      const diaristaId = req.usuario.id;
      const { dataInicio, dataFim, status } = req.query;

      const disponibilidades = await disponibilidadeModel.findByDiarista(diaristaId, {
        dataInicio,
        dataFim,
        status
      });

      return res.status(200).json({
        success: true,
        data: disponibilidades
      });
    } catch (error) {
      console.error('Erro ao listar disponibilidades do diarista:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno ao consultar agenda de disponibilidades.'
      });
    }
  },

  /**
   * POST /api/disponibilidades
   * Cadastra um novo intervalo de disponibilidade
   */
  async criar(req, res) {
    try {
      const diaristaId = req.usuario.id;
      const { data, hora_inicio, hora_fim, observacao, status } = req.body;

      if (!data || !hora_inicio || !hora_fim) {
        return res.status(400).json({
          success: false,
          message: 'Data, hora de início e hora de término são campos obrigatórios.'
        });
      }

      // Validação simples de formato de data YYYY-MM-DD
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(data)) {
        return res.status(400).json({
          success: false,
          message: 'Data em formato inválido. Utilize o formato AAAA-MM-DD.'
        });
      }

      // Validação de horário HH:MM ou HH:MM:SS
      const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;
      if (!timeRegex.test(hora_inicio) || !timeRegex.test(hora_fim)) {
        return res.status(400).json({
          success: false,
          message: 'Horários em formato inválido. Utilize o formato HH:MM.'
        });
      }

      // Normaliza para HH:MM:SS
      const inicioNorm = hora_inicio.length === 5 ? `${hora_inicio}:00` : hora_inicio;
      const fimNorm = hora_fim.length === 5 ? `${hora_fim}:00` : hora_fim;

      if (inicioNorm >= fimNorm) {
        return res.status(400).json({
          success: false,
          message: 'A hora de início deve ser anterior à hora de término.'
        });
      }

      const novaDisponibilidade = await disponibilidadeModel.create({
        diarista_id: diaristaId,
        data,
        hora_inicio: inicioNorm,
        hora_fim: fimNorm,
        status: status || 'disponivel',
        observacao: observacao ? String(observacao).trim() : ''
      });

      return res.status(201).json({
        success: true,
        data: novaDisponibilidade,
        message: 'Horário de disponibilidade cadastrado com sucesso.'
      });
    } catch (error) {
      console.error('Erro ao cadastrar disponibilidade:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno ao salvar horário de disponibilidade.'
      });
    }
  },

  /**
   * DELETE /api/disponibilidades/:id
   * Exclui um horário da agenda do diarista logado
   */
  async excluir(req, res) {
    try {
      const diaristaId = req.usuario.id;
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Identificador de disponibilidade inválido.'
        });
      }

      const removido = await disponibilidadeModel.delete(Number(id), diaristaId);

      if (!removido) {
        return res.status(404).json({
          success: false,
          message: 'Horário de disponibilidade não encontrado ou não pertence a este usuário.'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Horário de disponibilidade removido com sucesso.'
      });
    } catch (error) {
      console.error('Erro ao excluir disponibilidade:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno ao remover horário de disponibilidade.'
      });
    }
  },

  /**
   * GET /api/disponibilidades/diarista/:id
   * Consulta a agenda pública de um diarista específico
   */
  async obterPorDiarista(req, res) {
    try {
      const { id } = req.params;
      const { dataInicio, dataFim } = req.query;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Identificador de diarista inválido.'
        });
      }

      const disponibilidades = await disponibilidadeModel.findByDiarista(Number(id), {
        dataInicio,
        dataFim,
        status: 'disponivel'
      });

      return res.status(200).json({
        success: true,
        data: disponibilidades
      });
    } catch (error) {
      console.error('Erro ao consultar agenda do diarista:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno ao consultar agenda do profissional.'
      });
    }
  },

  /**
   * GET /api/diaristas
   * Busca e filtra diaristas com perfil e horários disponíveis
   */
  async buscarDiaristas(req, res) {
    try {
      const { data, bairro, servico, busca } = req.query;

      const diaristas = await disponibilidadeModel.buscarDiaristas({
        data,
        bairro,
        servico,
        busca
      });

      return res.status(200).json({
        success: true,
        data: diaristas
      });
    } catch (error) {
      console.error('Erro ao buscar diaristas:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno ao buscar profissionais disponíveis.'
      });
    }
  }
};

module.exports = disponibilidadeController;
