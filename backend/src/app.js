const express = require('express');
const cors = require('cors');

const demandaRoutes = require('./routes/demandaRoutes');
const candidaturaRoutes = require('./routes/candidaturaRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const avaliacaoRoutes = require('./routes/avaliacaoRoutes');
const authRoutes = require('./routes/authRoutes');
const perfilRoutes = require('./routes/perfilRoutes');
const perfilController = require('./controllers/perfilController');
const { authMiddleware } = require('./middlewares/authMiddleware');

const app = express();

// Middlewares
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id']
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota de liveness / status da API
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'online',
      timestamp: new Date().toISOString()
    }
  });
});

// Registro das rotas REST
app.use('/api/auth', authRoutes);
app.use('/api/v1/auth', authRoutes);

// Vagas e Demandas (suporte a /api/demandas e /api/vagas conforme RBAC)
app.use('/api/demandas', demandaRoutes);
app.use('/api/vagas', demandaRoutes);

// Candidaturas
app.use('/api/candidaturas', candidaturaRoutes);

// Perfis e Currículos (/api/perfil, /api/profile, etc.)
app.use('/api/perfil', perfilRoutes);
app.use('/api/profile', perfilRoutes);
app.use('/api/v1/profile', perfilRoutes);
app.use('/api/users', perfilRoutes);
app.use('/api/v1/users', perfilRoutes);

// Configurações da Conta
app.put('/api/configuracoes', authMiddleware, perfilController.atualizarConfiguracoes);
app.get('/api/configuracoes', authMiddleware, perfilController.obterConfiguracoes);

// Exclusão de Conta / Encerramento
app.delete('/api/conta', authMiddleware, perfilController.excluirConta);

// Usuários e Avaliações
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/avaliacoes', avaliacaoRoutes);

// Tratamento de rotas inexistentes (404)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Rota ${req.method} ${req.originalUrl} não encontrada.`
  });
});

// Tratamento global de exceções não capturadas (500)
app.use((err, req, res, next) => {
  console.error('Unhandled internal error:', err);
  res.status(500).json({
    success: false,
    message: 'Erro interno no servidor.'
  });
});

module.exports = app;
