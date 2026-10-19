const express = require('express');
const router = express.Router();
const disponibilidadeController = require('../controllers/disponibilidadeController');
const { authMiddleware, requireRole } = require('../middlewares/authMiddleware');

// Consulta de diaristas e busca com disponibilidades
router.get('/buscar', disponibilidadeController.buscarDiaristas);

// Consulta pública de horários disponíveis de um diarista específico
router.get('/diarista/:id', disponibilidadeController.obterPorDiarista);

// Gestão de disponibilidade pelo próprio diarista (autenticado)
router.get('/minhas', authMiddleware, requireRole(['diarista', 'ambos']), disponibilidadeController.listarMinhas);
router.post('/', authMiddleware, requireRole(['diarista', 'ambos']), disponibilidadeController.criar);
router.delete('/:id', authMiddleware, requireRole(['diarista', 'ambos']), disponibilidadeController.excluir);

module.exports = router;
