const db = require('../config/db');

const perfilController = {
  // PATCH /api/v1/users/me/role
  async atualizarPapel(req, res) {
    try {
      const { role } = req.body;
      const usuarioId = req.usuario.id;

      if (!role || typeof role !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'BAD_REQUEST',
          message: 'O campo role é obrigatório. Valores aceitos: DIARISTA, CONTRATANTE, AMBOS.'
        });
      }

      const roleNormalizada = role.trim().toLowerCase();
      const papeisValidos = ['diarista', 'contratante', 'ambos'];

      if (!papeisValidos.includes(roleNormalizada)) {
        return res.status(400).json({
          success: false,
          error: 'BAD_REQUEST',
          message: 'Papel inválido fornecido. Escolha entre DIARISTA, CONTRATANTE ou AMBOS.'
        });
      }

      await db.query(
        'UPDATE usuarios SET tipo = ? WHERE id = ?',
        [roleNormalizada, usuarioId]
      );

      return res.status(200).json({
        success: true,
        data: {
          id: usuarioId,
          role: roleNormalizada
        },
        message: 'Papel de usuário atualizado com sucesso.'
      });
    } catch (error) {
      console.error('Erro ao atualizar papel do usuário:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno ao atualizar papel da conta.'
      });
    }
  },

  // GET /api/v1/users/me/settings
  async obterConfiguracoes(req, res) {
    try {
      const usuarioId = req.usuario.id;
      const [rows] = await db.query(
        'SELECT id, nome, email, telefone, tipo, bairro, notif_whatsapp, notif_email, notif_push, data_criacao FROM usuarios WHERE id = ?',
        [usuarioId]
      );

      if (!rows || rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado.'
        });
      }

      return res.status(200).json({
        success: true,
        data: rows[0]
      });
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno ao consultar configurações.'
      });
    }
  },

  // PUT /api/v1/users/me/settings
  async atualizarConfiguracoes(req, res) {
    try {
      const usuarioId = req.usuario.id;
      const { nome, telefone, bairro, tipo, notif_whatsapp, notif_email, notif_push } = req.body;

      if (!nome || !telefone || !bairro) {
        return res.status(400).json({
          success: false,
          message: 'Nome, telefone e bairro são campos obrigatórios.'
        });
      }

      let papelAtual = req.usuario.tipo;
      if (tipo) {
        const tNormalizado = tipo.trim().toLowerCase();
        if (['diarista', 'contratante', 'ambos'].includes(tNormalizado)) {
          papelAtual = tNormalizado;
        }
      }

      await db.query(
        `UPDATE usuarios 
         SET nome = ?, telefone = ?, bairro = ?, tipo = ?,
             notif_whatsapp = ?, notif_email = ?, notif_push = ?
         WHERE id = ?`,
        [
          nome.trim(),
          telefone.trim(),
          bairro.trim(),
          papelAtual,
          notif_whatsapp !== undefined ? Boolean(notif_whatsapp) : true,
          notif_email !== undefined ? Boolean(notif_email) : true,
          notif_push !== undefined ? Boolean(notif_push) : true,
          usuarioId
        ]
      );

      const [atualizado] = await db.query(
        'SELECT id, nome, email, telefone, tipo, bairro, notif_whatsapp, notif_email, notif_push FROM usuarios WHERE id = ?',
        [usuarioId]
      );

      return res.status(200).json({
        success: true,
        data: atualizado[0],
        message: 'Configurações atualizadas com sucesso.'
      });
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno ao salvar configurações.'
      });
    }
  },

  // DELETE /api/v1/users/me
  async excluirConta(req, res) {
    try {
      const usuarioId = req.usuario.id;
      const { passwordConfirmation } = req.body || {};

      // Se enviado explicitamente no corpo da requisição, valida formato
      if (req.body && 'passwordConfirmation' in req.body) {
        if (!passwordConfirmation || typeof passwordConfirmation !== 'string' || !passwordConfirmation.trim()) {
          return res.status(400).json({
            success: false,
            error: 'BAD_REQUEST',
            message: 'Confirmação de senha ou frase de segurança é obrigatória.'
          });
        }
      }

      // Validação de Pendências Ativas (RF-12 da especificação)
      // 1. Demandas ativas onde o usuário é contratante
      const [demandasAtivas] = await db.query(
        `SELECT id, titulo, status FROM demandas 
         WHERE contratante_id = ? AND status IN ('aberta', 'preenchida')`,
        [usuarioId]
      );

      if (demandasAtivas && demandasAtivas.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'BAD_REQUEST',
          message: `Você possui ${demandasAtivas.length} demanda(s) em andamento. Conclua ou cancele suas demandas antes de excluir a conta.`
        });
      }

      // 2. Candidaturas aceitas em demandas ativas onde o usuário é diarista
      const [candidaturasAtivas] = await db.query(
        `SELECT c.id FROM candidaturas c
         JOIN demandas d ON c.demanda_id = d.id
         WHERE c.diarista_id = ? AND c.status = 'aceita' AND d.status IN ('aberta', 'preenchida')`,
        [usuarioId]
      );

      if (candidaturasAtivas && candidaturasAtivas.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'BAD_REQUEST',
          message: 'Você possui serviços agendados em andamento. Finalize seus compromissos antes de encerrar sua conta.'
        });
      }

      // Soft delete e anonimização LGPD
      const emailAnonimo = `anon_${usuarioId}_${Date.now()}@excluido.local`;
      await db.query(
        `UPDATE usuarios 
         SET status = 'inativo',
             nome = 'Conta Encerrada',
             email = ?,
             telefone = '00000000000'
         WHERE id = ?`,
        [emailAnonimo, usuarioId]
      );

      res.clearCookie('auth_token', { path: '/' });

      return res.status(200).json({
        success: true,
        message: 'Conta encerrada e dados anonimizados com sucesso.'
      });
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno ao processar encerramento de conta.'
      });
    }
  },

  // GET /api/v1/profile/curriculo
  async obterCurriculo(req, res) {
    try {
      const usuarioId = req.usuario.id;
      const [rows] = await db.query(
        'SELECT * FROM curriculos WHERE usuario_id = ?',
        [usuarioId]
      );

      let servicosFormatados = [];
      let curriculoData = {
        usuario_id: usuarioId,
        nome: req.usuario.nome,
        bairro: req.usuario.bairro,
        telefone: req.usuario.telefone,
        foto_url: '',
        bio: '',
        experiencia: '1 a 2 anos',
        servicos: ['Limpeza Residencial', 'Passar Roupa'],
        regioes: req.usuario.bairro || 'Todas as regiões'
      };

      if (rows && rows.length > 0) {
        const item = rows[0];
        try {
          servicosFormatados = typeof item.servicos === 'string' ? JSON.parse(item.servicos) : (item.servicos || []);
        } catch {
          servicosFormatados = item.servicos ? item.servicos.split(',') : [];
        }

        curriculoData = {
          id: item.id,
          usuario_id: usuarioId,
          nome: req.usuario.nome,
          bairro: req.usuario.bairro,
          telefone: req.usuario.telefone,
          foto_url: item.foto_url || '',
          bio: item.bio || '',
          experiencia: item.experiencia || '1 a 2 anos',
          servicos: servicosFormatados,
          regioes: item.regioes || req.usuario.bairro || 'São Paulo'
        };
      }

      return res.status(200).json({
        success: true,
        data: curriculoData
      });
    } catch (error) {
      console.error('Erro ao buscar currículo:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno ao carregar informações do currículo.'
      });
    }
  },

  // PUT /api/v1/profile/curriculo
  async atualizarCurriculo(req, res) {
    try {
      const usuarioId = req.usuario.id;
      const { bio, experiencia, servicos, regioes, foto_url } = req.body;

      const servicosJson = Array.isArray(servicos) ? JSON.stringify(servicos) : JSON.stringify([servicos]);

      await db.query(
        `INSERT INTO curriculos (usuario_id, bio, experiencia, servicos, regioes, foto_url)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           bio = VALUES(bio),
           experiencia = VALUES(experiencia),
           servicos = VALUES(servicos),
           regioes = VALUES(regioes),
           foto_url = VALUES(foto_url)`,
        [
          usuarioId,
          (bio || '').trim(),
          (experiencia || '1 a 2 anos').trim(),
          servicosJson,
          (regioes || '').trim(),
          (foto_url || '').trim()
        ]
      );

      return res.status(200).json({
        success: true,
        message: 'Currículo profissional salvo com sucesso.'
      });
    } catch (error) {
      console.error('Erro ao atualizar currículo:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno ao atualizar currículo.'
      });
    }
  },

  // GET /api/perfil/curriculo/:id
  async obterCurriculoPorId(req, res) {
    try {
      const { id } = req.params;
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Identificador de usuário inválido.'
        });
      }

      const [usuarioRows] = await db.query(
        'SELECT id, nome, email, telefone, tipo, bairro FROM usuarios WHERE id = ?',
        [id]
      );

      if (!usuarioRows || usuarioRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado.'
        });
      }

      const usuario = usuarioRows[0];
      const [curriculoRows] = await db.query(
        'SELECT * FROM curriculos WHERE usuario_id = ?',
        [id]
      );

      const [avaliacaoRows] = await db.query(
        'SELECT ROUND(AVG(nota), 1) as nota_media, COUNT(*) as total_avaliacoes FROM avaliacoes WHERE avaliado_id = ?',
        [id]
      );

      const [concluidosRows] = await db.query(
        "SELECT COUNT(*) as total_concluidos FROM candidaturas WHERE diarista_id = ? AND status = 'aceita'",
        [id]
      );

      let servicosFormatados = ['Limpeza Residencial', 'Passar Roupa'];
      let bio = '';
      let experiencia = '1 a 2 anos';
      let regioes = usuario.bairro ? `${usuario.bairro} e proximidades` : 'São Paulo';
      let foto_url = '';

      if (curriculoRows && curriculoRows.length > 0) {
        const item = curriculoRows[0];
        try {
          servicosFormatados = typeof item.servicos === 'string' ? JSON.parse(item.servicos) : (item.servicos || []);
        } catch {
          servicosFormatados = item.servicos ? item.servicos.split(',').map(s => s.trim()) : [];
        }
        bio = item.bio || '';
        experiencia = item.experiencia || '1 a 2 anos';
        regioes = item.regioes || regioes;
        foto_url = item.foto_url || '';
      }

      const notaMedia = avaliacaoRows && avaliacaoRows[0] && avaliacaoRows[0].nota_media ? Number(avaliacaoRows[0].nota_media) : 5.0;
      const totalConcluidos = concluidosRows && concluidosRows[0] ? Number(concluidosRows[0].total_concluidos) : 0;

      return res.status(200).json({
        success: true,
        data: {
          usuario_id: usuario.id,
          nome: usuario.nome,
          bairro: usuario.bairro,
          tipo: usuario.tipo,
          foto_url,
          bio,
          experiencia,
          servicos: servicosFormatados,
          regioes,
          nota_media: notaMedia,
          total_bicos_concluidos: totalConcluidos
        }
      });
    } catch (error) {
      console.error('Erro ao buscar currículo por ID:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno ao consultar currículo do candidato.'
      });
    }
  }
};

module.exports = perfilController;
