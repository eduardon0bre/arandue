const express = require('express');
const router = express.Router();
const notificacaoController = require('../controllers/notificacaoController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// Rota para notificar diarista quando um contratante entra em contato (aceita contratante autenticado ou visitante)
router.post('/contato-diarista', (req, res, next) => {
  if (req.headers.authorization || req.headers['x-user-id']) {
    return authMiddleware(req, res, next);
  }
  next();
}, notificacaoController.contatarDiarista);

// Demais rotas de notificação exigem autenticação prévia
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
