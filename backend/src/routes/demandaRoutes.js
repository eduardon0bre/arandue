const express = require('express');
const router = express.Router();
const demandaController = require('../controllers/demandaController');
const candidaturaController = require('../controllers/candidaturaController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// Rotas de listagem
router.get('/', demandaController.listar);
router.get('/minhas', authMiddleware, demandaController.listarMinhas);
router.get('/:id', demandaController.buscarPorId);

// Criação e gestão de demandas/vagas
router.post('/', authMiddleware, demandaController.criar);
router.put('/:id', authMiddleware, demandaController.atualizar);
router.patch('/:id/concluir', authMiddleware, demandaController.concluir);
router.delete('/:id', authMiddleware, demandaController.excluir);

// Sub-recursos de candidatos e candidaturas
router.get('/:id/candidatos', candidaturaController.listarPorDemanda);
router.post('/:id/candidaturas', authMiddleware, candidaturaController.inscreverNaVaga);

module.exports = router;
