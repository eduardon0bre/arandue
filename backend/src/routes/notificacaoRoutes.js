const express = require('express');
const router = express.Router();
const notificacaoController = require('../controllers/notificacaoController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// Todas as rotas de notificação exigem autenticação prévia
router.use(authMiddleware);

// Listagem e resumo de não lidas
router.get('/', notificacaoController.listar);

// Marcar todas como lidas (deve vir antes de /:id/lida para evitar conflito de roteamento)
router.patch('/ler-todas', notificacaoController.marcarTodasComoLidas);

// Marcar uma específica como lida
router.patch('/:id/lida', notificacaoController.marcarComoLida);

// Testar disparo nos canais configurados
router.post('/testar', notificacaoController.testar);

// Registrar token do dispositivo para push notification
router.post('/push-token', notificacaoController.salvarPushToken);

module.exports = router;
