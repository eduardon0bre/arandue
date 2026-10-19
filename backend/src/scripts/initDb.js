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

async function init() {
  console.log('🔄 Iniciando criação e verificação das tabelas no banco de dados...');
  try {
    const schemaPath = path.resolve(__dirname, '../../../database/schema.sql');
    await runSqlFile(schemaPath);
    console.log('✅ Tabelas criadas/verificadas com sucesso!');

    // Executa seed se solicitado via argumento --seed ou SEED=true
    if (process.argv.includes('--seed') || process.env.SEED === 'true') {
      console.log('🌱 Inserindo dados iniciais (seed)...');
      const seedPath = path.resolve(__dirname, '../../../database/seed.sql');
      await runSqlFile(seedPath);
      console.log('✅ Dados de teste inseridos com sucesso!');
    }

    console.log('🎉 Inicialização do banco concluída!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro fatal ao inicializar banco de dados:', err);
    process.exit(1);
  }
}

init();
