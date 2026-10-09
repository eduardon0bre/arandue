const candidaturaModel = require('../models/candidaturaModel');
const demandaModel = require('../models/demandaModel');
const usuarioModel = require('../models/usuarioModel');
const { canApplyToJob } = require('../utils/permissions');

const candidaturaController = {
  async inscrever(req, res) {
    try {
      const { demanda_id, mensagem } = req.body;
      const diarista_id = req.usuario ? req.usuario.id : req.body.diarista_id;

      if (!demanda_id || !diarista_id) {
        return res.status(400).json({
          success: false,
          message: 'Os campos demanda_id e diarista_id são obrigatórios.'
        });
      }

      // RF-04 (Bloqueio de Candidatura para Contratantes Exclusivos)
      const candidato = req.usuario || (await usuarioModel.findById(diarista_id));
      if (candidato && !canApplyToJob(candidato.tipo)) {
        return res.status(403).json({
          success: false,
          error: 'FORBIDDEN',
          code: 'FORBIDDEN_ROLE',
          message: "Contratantes não podem se candidatar. Altere seu perfil para 'Diarista' ou 'Ambos' para aceitar demandas."
        });
      }

      // Verifica se a demanda existe e se está aberta
      const demanda = await demandaModel.findById(demanda_id);
      if (!demanda) {
        return res.status(404).json({
          success: false,
          message: 'Demanda não encontrada.'
        });
      }

      if (demanda.status !== 'aberta') {
        return res.status(400).json({
          success: false,
          message: 'Esta vaga não está aberta para novas candidaturas.'
        });
      }

      // Impede que o próprio contratante se candidate em sua demanda
      if (Number(demanda.contratante_id) === Number(diarista_id)) {
        return res.status(400).json({
          success: false,
          message: 'O anunciante não pode se candidatar à sua própria demanda.'
        });
      }

      // Verifica duplicidade de candidatura
      const candidaturaExistente = await candidaturaModel.checkExisting(demanda_id, diarista_id);
      if (candidaturaExistente) {
        return res.status(400).json({
          success: false,
          message: 'O trabalhador já possui candidatura registrada para esta vaga.'
        });
      }

      const novaCandidatura = await candidaturaModel.create({
        demanda_id,
        diarista_id,
        mensagem
      });

      return res.status(201).json({
        success: true,
        data: novaCandidatura
      });
    } catch (error) {
      console.error('Erro ao registrar candidatura:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno ao realizar candidatura.'
      });
    }
  },

  // Rota RESTful de sub-recurso: POST /api/vagas/:id/candidaturas
  async inscreverNaVaga(req, res) {
    try {
      if (!req.usuario) {
        return res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'Acesso negado. Usuário não autenticado.'
        });
      }

      const papel = req.usuario.tipo;
      if (!canApplyToJob(papel)) {
        return res.status(403).json({
          success: false,
          error: 'FORBIDDEN',
          code: 'FORBIDDEN_ROLE',
          message: "Contratantes não podem se candidatar. Altere seu perfil para 'Diarista' ou 'Ambos' para aceitar demandas."
        });
      }

      const demanda_id = req.params.id;
      const diarista_id = req.usuario.id;
      const { mensagem } = req.body || {};

      const demanda = await demandaModel.findById(demanda_id);
      if (!demanda) {
        return res.status(404).json({
          success: false,
          message: 'Demanda/vaga não encontrada.'
        });
      }

      if (demanda.status !== 'aberta') {
        return res.status(400).json({
          success: false,
          message: 'Esta vaga não está aberta para novas candidaturas.'
        });
      }

      // Impede que o anunciante se candidate à sua própria vaga
      if (Number(demanda.contratante_id) === Number(diarista_id)) {
        return res.status(400).json({
          success: false,
          message: 'O anunciante não pode se candidatar à sua própria vaga.'
        });
      }

      // Verifica duplicidade de candidatura
      const candidaturaExistente = await candidaturaModel.checkExisting(demanda_id, diarista_id);
      if (candidaturaExistente) {
        return res.status(400).json({
          success: false,
          message: 'Você já possui candidatura registrada para esta vaga.'
        });
      }

      const novaCandidatura = await candidaturaModel.create({
        demanda_id,
        diarista_id,
        mensagem: mensagem || 'Tenho interesse nesta vaga.'
      });

      return res.status(201).json({
        success: true,
        data: novaCandidatura
      });
    } catch (error) {
      console.error('Erro ao realizar candidatura na vaga:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno ao registrar candidatura.'
      });
    }
  },

  async listarPorDemanda(req, res) {
    try {
      const { id } = req.params;
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Identificador de demanda inválido.'
        });
      }

      const candidatos = await candidaturaModel.findByDemandaId(id);

      const dadosFiltrados = candidatos.map(c => {
        let servicos = [];
        if (c.diarista_servicos) {
          try {
            servicos = typeof c.diarista_servicos === 'string' ? JSON.parse(c.diarista_servicos) : c.diarista_servicos;
          } catch {
            servicos = typeof c.diarista_servicos === 'string' ? c.diarista_servicos.split(',').map(s => s.trim()) : [];
          }
        }
        return {
          ...c,
          diarista_servicos: Array.isArray(servicos) ? servicos : [],
          diarista_telefone: c.status === 'aceita' 
            ? c.diarista_telefone 
            : (c.diarista_telefone ? c.diarista_telefone.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) *****-$3') : '')
        };
      });

      return res.status(200).json({
        success: true,
        data: dadosFiltrados
      });
    } catch (error) {
      console.error('Erro ao listar candidatos da demanda:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno ao listar candidatos.'
      });
    }
  },

  async listarPorDiarista(req, res) {
    try {
      const { id } = req.params;
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Identificador de diarista inválido.'
        });
      }

      const candidaturas = await candidaturaModel.findByDiaristaId(id);

      return res.status(200).json({
        success: true,
        data: candidaturas
      });
    } catch (error) {
      console.error('Erro ao listar histórico de candidaturas:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno ao consultar histórico.'
      });
    }
  },

  async atualizarStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Identificador de candidatura inválido.'
        });
      }

      if (!status || !['aceita', 'recusada'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status inválido. Permitido apenas "aceita" ou "recusada".'
        });
      }

      const candidaturaExistente = await candidaturaModel.findById(id);
      if (!candidaturaExistente) {
        return res.status(404).json({
          success: false,
          message: 'Candidatura não encontrada.'
        });
      }

      // Ao recusar, apagar a candidatura do banco de dados
      if (status === 'recusada') {
        await candidaturaModel.delete(id);
        return res.status(200).json({
          success: true,
          data: { id: Number(id), status: 'recusada', apagada: true },
          message: 'Candidatura recusada e excluída com sucesso.'
        });
      }

      await candidaturaModel.updateStatus(id, status);

      const candidaturaAtualizada = await candidaturaModel.findById(id);

      return res.status(200).json({
        success: true,
        data: candidaturaAtualizada
      });
    } catch (error) {
      console.error('Erro ao atualizar status da candidatura:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno ao atualizar status da candidatura.'
      });
    }
  },

  async excluir(req, res) {
    try {
      const { id } = req.params;
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Identificador de candidatura inválido.'
        });
      }

      const candidatura = await candidaturaModel.findById(id);
      if (!candidatura) {
        return res.status(404).json({
          success: false,
          message: 'Candidatura não encontrada.'
        });
      }

      if (candidatura.status === 'aceita') {
        return res.status(400).json({
          success: false,
          message: 'Não é possível cancelar diretamente uma candidatura que já foi aceita.'
        });
      }

      await candidaturaModel.delete(id);

      return res.status(200).json({
        success: true,
        data: { id: Number(id), message: 'Candidatura cancelada com sucesso.' }
      });
    } catch (error) {
      console.error('Erro ao excluir candidatura:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno ao cancelar candidatura.'
      });
    }
  }
};

module.exports = candidaturaController;
