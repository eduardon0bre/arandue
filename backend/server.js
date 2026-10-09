const dotenv = require('dotenv');
dotenv.config();

const app = require('./src/app');
const db = require('./src/config/db');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Testa a conexão com o banco de dados antes de iniciar o servidor
    const [rows] = await db.query('SELECT 1 + 1 AS db_check');
    if (rows && rows.length > 0) {
      console.log(' Conexão com o banco de dados MySQL estabelecida com sucesso.');
    }

    app.listen(PORT, () => {
      console.log(` Servidor da API REST em execução na porta ${PORT}`);
      console.log(` Endpoint base: http://localhost:${PORT}/api/demandas`);
    });
  } catch (error) {
    console.error(' Falha crítica ao conectar ao banco de dados MySQL:', error.message);
    process.exit(1);
  }
}

startServer();
