const express = require('express');
const router = express.Router();
const perfilController = require('../controllers/perfilController');
const { authMiddleware, requireRole } = require('../middlewares/authMiddleware');

// Todas as rotas de perfil requerem autenticação
router.use(authMiddleware);

// 5.1 Atualizar Tipo de Papel (RBAC)
router.patch('/me/role', perfilController.atualizarPapel);
router.patch('/role', perfilController.atualizarPapel);

// Configurações da Conta
router.get('/me/settings', perfilController.obterConfiguracoes);
router.get('/settings', perfilController.obterConfiguracoes);
router.put('/me/settings', perfilController.atualizarConfiguracoes);
router.put('/settings', perfilController.atualizarConfiguracoes);

// 5.3 Exclusão de Conta Definitiva (Zona de Perigo)
router.delete('/me', perfilController.excluirConta);
router.delete('/', perfilController.excluirConta);

// 5.4 Gestão de Currículo (apenas para DIARISTA e AMBOS editarem o seu)
router.get('/curriculo', requireRole(['diarista', 'ambos']), perfilController.obterCurriculo);
router.put('/curriculo', requireRole(['diarista', 'ambos']), perfilController.atualizarCurriculo);

// Visualização de Currículo de candidato por ID
router.get('/curriculo/:id', perfilController.obterCurriculoPorId);

module.exports = router;
