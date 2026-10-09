const express = require('express');
const router = express.Router();
const avaliacaoController = require('../controllers/avaliacaoController');

router.post('/', avaliacaoController.criar);
router.get('/demanda/:id', avaliacaoController.listarPorDemanda);
router.get('/usuario/:id', avaliacaoController.listarPorUsuario);

module.exports = router;
