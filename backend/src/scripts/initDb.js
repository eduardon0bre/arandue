const fs = require('fs');
const path = require('path');
const db = require('../config/db');

async function runSqlFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`Arquivo não encontrado: ${filePath}`);
    return;
  }

  const rawSql = fs.readFileSync(filePath, 'utf-8');

  // Remove linhas de comentário e diretivas locais de CREATE DATABASE / USE
  const sanitizedSql = rawSql
    .replace(/^--.*$/gm, '')
    .replace(/CREATE\s+DATABASE\s+IF\s+NOT\s+EXISTS\s+[^;]+;/gi, '')
    .replace(/USE\s+[^;]+;/gi, '');

  // Divide os comandos SQL por ponto e vírgula
  const statements = sanitizedSql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const connection = await db.getConnection();
  try {
    for (const sql of statements) {
      try {
        await connection.query(sql);
      } catch (err) {
        console.warn(`Alerta ao executar comando SQL: ${err.message}`);
      }
    }
  } finally {
    connection.release();
  }
}

function findSqlFile(filename) {
  const candidates = [
    path.resolve(__dirname, '../../database', filename),
    path.resolve(__dirname, '../../../database', filename),
    path.resolve(process.cwd(), 'database', filename),
    path.resolve(process.cwd(), '../database', filename)
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return candidates[0];
}

async function init() {
  console.log('🔄 Iniciando criação e verificação das tabelas no banco de dados...');
  try {
    const schemaPath = findSqlFile('schema.sql');
    await runSqlFile(schemaPath);

    // Migrações incrementais seguras para bancos existentes
    try {
      const conn = await db.getConnection();
      try {
        await conn.query('ALTER TABLE usuarios ADD COLUMN push_token VARCHAR(255) NULL');
      } catch (colErr) {
        // Ignora erro se coluna já existir (código 1060 / ER_DUP_FIELDNAME)
      } finally {
        conn.release();
      }
    } catch (migErr) {
      // Ignora caso conexão não esteja disponível neste momento
    }

    console.log('✅ Tabelas criadas/verificadas com sucesso!');

    // Executa seed se solicitado via argumento --seed ou SEED=true
    if (process.argv.includes('--seed') || process.env.SEED === 'true') {
      console.log('🌱 Inserindo dados iniciais (seed)...');
      const seedPath = findSqlFile('seed.sql');
      await runSqlFile(seedPath);
      console.log('✅ Dados de teste inseridos com sucesso!');
    }

    console.log('🎉 Inicialização do banco concluída!');
    if (require.main === module) {
      process.exit(0);
    }
  } catch (err) {
    console.error('❌ Erro fatal ao inicializar banco de dados:', err);
    if (require.main === module) {
      process.exit(1);
    }
    throw err;
  }
}

if (require.main === module) {
  init();
}

module.exports = { init, runSqlFile };

