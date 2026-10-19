const dotenv = require('dotenv');
dotenv.config();

const app = require('./src/app');
const db = require('./src/config/db');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

async function startServer() {
  try {
    // Testa a conexão com o banco de dados antes de iniciar o servidor
    const [rows] = await db.query('SELECT 1 + 1 AS db_check');
    if (rows && rows.length > 0) {
      console.log(' Conexão com o banco de dados MySQL estabelecida com sucesso.');
    }

    // Auto-criação/migração idempotente de tabelas no boot (desative com AUTO_INIT_DB=false)
    if (process.env.AUTO_INIT_DB !== 'false') {
      try {
        const { init } = require('./src/scripts/initDb');
        await init();
      } catch (initErr) {
        console.warn(' Alerta ao auto-inicializar tabelas:', initErr.message);
      }
    }

    const server = app.listen(PORT, HOST, () => {
      console.log(` Servidor da API REST em execução em http://${HOST}:${PORT}`);
      console.log(` Healthcheck disponível em http://${HOST}:${PORT}/health`);
    });

    // Tratamento de encerramento gracioso para containers (Railway / Docker)
    const gracefulShutdown = (signal) => {
      console.log(` Recebido sinal ${signal}. Encerrando servidor graciosamente...`);
      server.close(() => {
        console.log(' Servidor HTTP finalizado.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    console.error(' Falha crítica ao conectar ao banco de dados MySQL:', error.message);
    process.exit(1);
  }
}

startServer();
