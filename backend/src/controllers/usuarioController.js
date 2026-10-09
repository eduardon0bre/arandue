const usuarioModel = require('../models/usuarioModel');

const usuarioController = {
  async listar(req, res) {
    try {
      const { tipo } = req.query;
      let usuarios;
      if (tipo) {
        usuarios = await usuarioModel.findByTipo(tipo);
      } else {
        usuarios = await usuarioModel.findAll();
      }
      return res.status(200).json({
        success: true,
        data: usuarios
      });
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno ao consultar lista de usuários.'
      });
    }
  },

  async buscarPorId(req, res) {
    try {
      const { id } = req.params;
      const usuario = await usuarioModel.findById(id);

      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado.'
        });
      }

      return res.status(200).json({
        success: true,
        data: usuario
      });
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno ao buscar usuário.'
      });
    }
  }
};

module.exports = usuarioController;
