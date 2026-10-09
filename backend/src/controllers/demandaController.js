const demandaModel = require('../models/demandaModel');
const candidaturaModel = require('../models/candidaturaModel');
const usuarioModel = require('../models/usuarioModel');
const db = require('../config/db');
const { canCreateJob } = require('../utils/permissions');

const demandaController = {
  async listar(req, res) {
    try {
      const { categoria, status, contratante_id, busca } = req.query;
      const demandas = await demandaModel.findAll({
        categoria,
        status,
        contratante_id,
        busca
      });

      return res.status(200).json({
        success: true,
        data: demandas
      });
    } catch (error) {
      console.error('Erro ao listar demandas:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno ao consultar lista de demandas.'
      });
    }
  },

  // GET /api/demandas/minhas e GET /api/vagas/minhas
  async listarMinhas(req, res) {
    try {
      if (!req.usuario) {
        return res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'Acesso negado. Usuário não autenticado.'
        });
      }

      const usuarioId = req.usuario.id;
      let demandas = [];

      try {
        const [rows] = await db.query(
          'SELECT * FROM demandas WHERE contratante_id = ? ORDER BY data_criacao DESC',
          [usuarioId]
        );
        demandas = rows || [];
      } catch {
        demandas = await demandaModel.findAll({ contratante_id: usuarioId });
      }

      return res.status(200).json({
        success: true,
        data: demandas
      });
    } catch (error) {
      console.error('Erro ao listar minhas demandas:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno ao consultar demandas do usuário.'
      });
    }
  },

  async buscarPorId(req, res) {
    try {
      const { id } = req.params;
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Identificador de demanda inválido.'
        });
      }

      const demanda = await demandaModel.findById(id);
      if (!demanda) {
        return res.status(404).json({
          success: false,
          message: 'Demanda não encontrada.'
        });
      }

      return res.status(200).json({
        success: true,
        data: demanda
      });
    } catch (error) {
      console.error('Erro ao buscar detalhes da demanda:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno ao consultar demanda.'
      });
    }
  },

  async criar(req, res) {
    try {
      const { titulo, descricao, categoria, valor_diaria, data_servico, bairro } = req.body;
      const contratante_id = req.body.contratante_id || req.usuario?.id;
      const papelUsuario = req.usuario?.tipo;

      // Validação de RBAC se usuário estiver autenticado
      if (req.usuario && !canCreateJob(papelUsuario)) {
        return res.status(403).json({
          success: false,
          error: 'FORBIDDEN',
          code: 'FORBIDDEN_ROLE',
          message: "Seu perfil atual é Diarista. Altere para 'Contratante' ou 'Ambos' nas configurações para criar vagas."
        });
      }

      // Validação prévia de campos obrigatórios
      if (!contratante_id || !titulo || !descricao || !categoria || !valor_diaria || !data_servico || !bairro) {
        return res.status(400).json({
          success: false,
          message: 'Todos os campos são obrigatórios: contratante_id, titulo, descricao, categoria, valor_diaria, data_servico e bairro.'
        });
      }

      // Se não autenticado via middleware, verifica usuário no banco
      if (!req.usuario) {
        const anunciante = await usuarioModel.findById(contratante_id);
        if (anunciante && !canCreateJob(anunciante.tipo)) {
          return res.status(403).json({
            success: false,
            error: 'FORBIDDEN',
            code: 'FORBIDDEN_ROLE',
            message: "Seu perfil atual é Diarista. Altere para 'Contratante' ou 'Ambos' nas configurações para criar vagas."
          });
        }
      }

      const valorNumerico = parseFloat(valor_diaria);
      if (isNaN(valorNumerico) || valorNumerico <= 0) {
        return res.status(400).json({
          success: false,
          message: 'O valor da diária deve ser um número positivo e fixado previamente.'
        });
      }

      const novaDemanda = await demandaModel.create({
        contratante_id,
        titulo: String(titulo).trim(),
        descricao: String(descricao).trim(),
        categoria: String(categoria).trim(),
        valor_diaria: valorNumerico,
        data_servico,
        bairro: String(bairro).trim(),
        status: 'aberta'
      });

      return res.status(201).json({
        success: true,
        data: novaDemanda
      });
    } catch (error) {
      console.error('Erro ao cadastrar demanda:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno ao cadastrar nova demanda.'
      });
    }
  },

  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const { titulo, descricao, categoria, valor_diaria, data_servico, bairro, status } = req.body;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Identificador de demanda inválido.'
        });
      }

      const demandaExistente = await demandaModel.findById(id);
      if (!demandaExistente) {
        return res.status(404).json({
          success: false,
          message: 'Demanda não encontrada para atualização.'
        });
      }

      let valorFinal = demandaExistente.valor_diaria;
      if (valor_diaria !== undefined) {
        const parsed = parseFloat(valor_diaria);
        if (isNaN(parsed) || parsed <= 0) {
          return res.status(400).json({
            success: false,
            message: 'O valor da diária deve ser válido e positivo.'
          });
        }
        valorFinal = parsed;
      }

      await demandaModel.update(id, {
        titulo: titulo ? titulo.trim() : demandaExistente.titulo,
        descricao: descricao ? descricao.trim() : demandaExistente.descricao,
        categoria: categoria ? categoria.trim() : demandaExistente.categoria,
        valor_diaria: valorFinal,
        data_servico: data_servico || demandaExistente.data_servico,
        bairro: bairro ? bairro.trim() : demandaExistente.bairro,
        status: status || demandaExistente.status
      });

      const demandaAtualizada = await demandaModel.findById(id);

      return res.status(200).json({
        success: true,
        data: demandaAtualizada
      });
    } catch (error) {
      console.error('Erro ao atualizar demanda:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno ao atualizar demanda.'
      });
    }
  },

  async excluir(req, res) {
    try {
      const { id } = req.params;
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Identificador de demanda inválido.'
        });
      }

      const demandaExistente = await demandaModel.findById(id);
      if (!demandaExistente) {
        return res.status(404).json({
          success: false,
          message: 'Demanda não encontrada para exclusão.'
        });
      }

      // Regra de integridade de negócio: verifica se já há candidato aceito
      const candidatos = await candidaturaModel.findByDemandaId(id);
      const candidatoAceito = candidatos.find(c => c.status === 'aceita');
      if (candidatoAceito) {
        return res.status(400).json({
          success: false,
          message: 'Não é possível excluir diretamente uma vaga que já possui diarista aceito/selecionado.'
        });
      }

      await demandaModel.delete(id);

      return res.status(200).json({
        success: true,
        data: { id: Number(id), message: 'Demanda excluída com sucesso.' }
      });
    } catch (error) {
      console.error('Erro ao excluir demanda:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno ao excluir demanda.'
      });
    }
  },

  async concluir(req, res) {
    try {
      const { id } = req.params;
      const usuarioId = req.usuario ? req.usuario.id : req.body.usuario_id;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Identificador de demanda inválido.'
        });
      }

      const demandaExistente = await demandaModel.findById(id);
      if (!demandaExistente) {
        return res.status(404).json({
          success: false,
          message: 'Demanda não encontrada.'
        });
      }

      // Validação de permissão: apenas o contratante dono ou o diarista aceito podem concluir
      if (usuarioId) {
        const isDono = Number(demandaExistente.contratante_id) === Number(usuarioId);
        let isDiaristaAceito = false;
        if (!isDono) {
          const candidatos = await candidaturaModel.findByDemandaId(id);
          isDiaristaAceito = candidatos.some(
            (c) => Number(c.diarista_id) === Number(usuarioId) && c.status === 'aceita'
          );
        }

        if (!isDono && !isDiaristaAceito) {
          return res.status(403).json({
            success: false,
            message: 'Apenas o anunciante da vaga ou o diarista contratado podem marcar a diária como concluída.'
          });
        }
      }

      await demandaModel.update(id, { status: 'concluida' });
      const demandaAtualizada = await demandaModel.findById(id);

      return res.status(200).json({
        success: true,
        data: demandaAtualizada,
        message: 'Trabalho marcado como concluído com sucesso!'
      });
    } catch (error) {
      console.error('Erro ao concluir demanda:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno ao marcar demanda como concluída.'
      });
    }
  }
};

module.exports = demandaController;
