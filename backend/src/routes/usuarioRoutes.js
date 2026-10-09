const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const perfilController = require('../controllers/perfilController');
const { authMiddleware } = require('../middlewares/authMiddleware');

router.get('/', usuarioController.listar);
router.get('/:id', usuarioController.buscarPorId);
router.get('/:id/curriculo', authMiddleware, perfilController.obterCurriculoPorId);

module.exports = router;
