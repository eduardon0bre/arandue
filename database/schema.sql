-- ========================================================
-- Quadro de Diárias e Bicos (ODS 8)
-- Schema DDL - Banco de Dados MySQL 8.x
-- ========================================================

CREATE DATABASE IF NOT EXISTS quadro_bicos_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE quadro_bicos_db;

-- --------------------------------------------------------
-- 1. Tabela: usuarios
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  telefone VARCHAR(20) NOT NULL,
  tipo ENUM('contratante', 'diarista', 'ambos') NOT NULL,
  bairro VARCHAR(100) NOT NULL,
  status ENUM('ativo', 'inativo') NOT NULL DEFAULT 'ativo',
  notif_whatsapp BOOLEAN DEFAULT TRUE,
  notif_email BOOLEAN DEFAULT TRUE,
  notif_push BOOLEAN DEFAULT TRUE,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 2. Tabela: demandas (Vagas de diárias e bicos)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS demandas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contratante_id INT NOT NULL,
  titulo VARCHAR(150) NOT NULL,
  descricao TEXT NOT NULL,
  categoria VARCHAR(50) NOT NULL,
  valor_diaria DECIMAL(10, 2) NOT NULL,
  data_servico DATE NOT NULL,
  bairro VARCHAR(100) NOT NULL,
  status ENUM('aberta', 'preenchida', 'concluida', 'cancelada') NOT NULL DEFAULT 'aberta',
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_demandas_contratante
    FOREIGN KEY (contratante_id) REFERENCES usuarios(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 3. Tabela: candidaturas (Inscrições dos trabalhadores)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS candidaturas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  demanda_id INT NOT NULL,
  diarista_id INT NOT NULL,
  status ENUM('pendente', 'aceita', 'recusada') NOT NULL DEFAULT 'pendente',
  mensagem TEXT NULL,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_candidatura_demanda_diarista UNIQUE (demanda_id, diarista_id),
  CONSTRAINT fk_candidaturas_demanda
    FOREIGN KEY (demanda_id) REFERENCES demandas(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_candidaturas_diarista
    FOREIGN KEY (diarista_id) REFERENCES usuarios(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 4. Tabela: avaliacoes (Reputação mútua após o serviço)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS avaliacoes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  demanda_id INT NOT NULL,
  avaliador_id INT NOT NULL,
  avaliado_id INT NOT NULL,
  nota TINYINT NOT NULL,
  comentario TEXT NULL,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_avaliacoes_nota CHECK (nota BETWEEN 1 AND 5),
  CONSTRAINT uq_avaliacao_demanda_avaliador UNIQUE (demanda_id, avaliador_id),
  CONSTRAINT fk_avaliacoes_demanda
    FOREIGN KEY (demanda_id) REFERENCES demandas(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_avaliacoes_avaliador
    FOREIGN KEY (avaliador_id) REFERENCES usuarios(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_avaliacoes_avaliado
    FOREIGN KEY (avaliado_id) REFERENCES usuarios(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 5. Tabela: curriculos (Perfil profissional do diarista)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS curriculos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL UNIQUE,
  foto_url VARCHAR(255) NULL,
  bio TEXT NULL,
  experiencia VARCHAR(100) NULL,
  servicos TEXT NULL,
  regioes VARCHAR(255) NULL,
  data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_curriculo_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
