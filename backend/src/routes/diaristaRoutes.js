const express = require('express');
const router = express.Router();
const disponibilidadeController = require('../controllers/disponibilidadeController');

// Busca de diaristas e profissionais com filtros e datas disponíveis
router.get('/', disponibilidadeController.buscarDiaristas);
router.get('/:id/disponibilidades', disponibilidadeController.obterPorDiarista);

module.exports = router;
