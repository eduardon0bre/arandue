const express = require('express');
const router = express.Router();
const candidaturaController = require('../controllers/candidaturaController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// Rotas de candidaturas
router.post('/', authMiddleware, candidaturaController.inscrever);
router.patch('/:id/status', authMiddleware, candidaturaController.atualizarStatus);
router.delete('/:id', authMiddleware, candidaturaController.excluir);
router.get('/diarista/:id', candidaturaController.listarPorDiarista);

module.exports = router;
