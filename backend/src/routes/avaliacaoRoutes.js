const express = require('express');
const router = express.Router();
const avaliacaoController = require('../controllers/avaliacaoController');
const { authMiddleware } = require('../middlewares/authMiddleware');

const optionalAuth = (req, res, next) => {
  if (req.headers.authorization || req.headers['x-user-id'] || req.headers.cookie) {
    return authMiddleware(req, res, next);
  }
  next();
};

router.post('/', optionalAuth, avaliacaoController.criar);
router.get('/demanda/:id', avaliacaoController.listarPorDemanda);
router.get('/usuario/:id/media', avaliacaoController.obterMedia);
router.get('/media/:id', avaliacaoController.obterMedia);
router.get('/usuario/:id', avaliacaoController.listarPorUsuario);
router.get('/enviadas/:id', avaliacaoController.listarEnviadas);

module.exports = router;
