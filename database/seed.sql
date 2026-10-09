-- ========================================================
-- Quadro de Diárias e Bicos (ODS 8)
-- Dados de Teste (Seed Data)
-- ========================================================

USE quadro_bicos_db;

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Limpeza prévia para garantir idempotência em reexecução
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE avaliacoes;
TRUNCATE TABLE candidaturas;
TRUNCATE TABLE demandas;
TRUNCATE TABLE usuarios;
SET FOREIGN_KEY_CHECKS = 1;

-- --------------------------------------------------------
-- Inserção de Usuários
-- --------------------------------------------------------
-- Contratantes (IDs 1, 2, 3)
INSERT INTO usuarios (id, nome, email, telefone, tipo, bairro) VALUES
(1, 'Carlos Mendes (Buffet Sabor & Festa)', 'carlos.mendes@buffetsabor.com.br', '11988887777', 'contratante', 'Pinheiros'),
(2, 'Mariana Ramos (LogExpress Distribuição)', 'mariana.ramos@logexpress.com.br', '11977776666', 'contratante', 'Lapa'),
(3, 'Roberto Silva (Silva Pinturas e Reformas)', 'roberto.silva@silvareformas.com.br', '11966665555', 'contratante', 'Santana');

-- Diaristas (IDs 4, 5, 6, 7)
INSERT INTO usuarios (id, nome, email, telefone, tipo, bairro) VALUES
(4, 'Lucas Pereira', 'lucas.pereira@email.com', '11955554444', 'diarista', 'Centro'),
(5, 'Juliana Costa', 'juliana.costa@email.com', '11944443333', 'diarista', 'Vila Mariana'),
(6, 'Marcos Souza', 'marcos.souza@email.com', '11933332222', 'diarista', 'Mooca'),
(7, 'Beatriz Lima', 'beatriz.lima@email.com', '11922221111', 'diarista', 'Tatuapé'),
(8, 'Patrícia Prado', 'patricia.prado@email.com', '11911110000', 'ambos', 'Pinheiros');

-- --------------------------------------------------------
-- Inserção de Demandas (Vagas Operacionais)
-- --------------------------------------------------------
INSERT INTO demandas (id, contratante_id, titulo, descricao, categoria, valor_diaria, data_servico, bairro, status) VALUES
(1, 1, 'Garçom para Evento Corporativo', 'Atendimento a convidados em coquetel de negócios. Necessário calça e sapato pretos. Horário das 18h às 23h.', 'Eventos', 180.00, '2026-10-15', 'Pinheiros', 'aberta'),
(2, 2, 'Auxiliar de Carga e Descarga', 'Descarregamento de paletes de caixas secas em galpão logístico. Uso de EPI fornecido pela empresa. Horário das 08h às 16h.', 'Logística', 160.00, '2026-10-16', 'Lapa', 'preenchida'),
(3, 3, 'Ajudante de Pintura Residencial', 'Preparação de paredes, lixamento e proteção de rodapés com fita crepe em apartamento térreo. Horário das 08h às 17h.', 'Construção', 150.00, '2026-10-17', 'Santana', 'aberta'),
(4, 1, 'Montador de Estande para Feira', 'Montagem de painéis modulares e fixação de suportes de madeira para exposição. Ferramentas fornecidas no local.', 'Montagem', 200.00, '2026-10-18', 'Pinheiros', 'aberta'),
(5, 3, 'Auxiliar de Limpeza Pós-Obra', 'Limpeza fina de vidros, esquadrias e remoção de poeira residual em imóvel comercial recém-reformado.', 'Limpeza', 170.00, '2026-10-20', 'Perdizes', 'aberta');

-- --------------------------------------------------------
-- Inserção de Candidaturas
-- --------------------------------------------------------
INSERT INTO candidaturas (demanda_id, diarista_id, status, mensagem) VALUES
(1, 4, 'pendente', 'Possuo experiência de 3 anos em eventos corporativos e disponibilidade imediata no horário.'),
(1, 5, 'pendente', 'Experiência como garçonete em feiras e coquetéis, com uniforme social completo.'),
(2, 6, 'aceita', 'Trabalho rotineiramente com carga e descarga e tenho bota de segurança.'),
(3, 7, 'pendente', 'Tenho experiência prática com lixamento e isolamento com fita crepe.');

-- --------------------------------------------------------
-- Inserção de Currículos (Perfis Profissionais dos Diaristas)
-- --------------------------------------------------------
INSERT INTO curriculos (usuario_id, foto_url, bio, experiencia, servicos, regioes) VALUES
(4, '', 'Profissional pontual, experiente em serviços residenciais e eventos com atenção aos mínimos detalhes.', '3 a 5 anos', '["Garçom para Eventos", "Limpeza Residencial", "Apoio em Eventos"]', 'Centro, Consolação e Bela Vista'),
(5, '', 'Especialista em atendimento de coquetéis, banquetes e organização de buffets.', '1 a 2 anos', '["Garçom para Eventos", "Cozinha & Apoio"]', 'Vila Mariana, Saúde e Paraíso'),
(6, '', 'Experiência sólida com movimentação de cargas, estoques e logística pesada com foco em segurança.', 'Mais de 5 anos', '["Carga e Descarga", "Limpeza Pós-Obra", "Jardinagem & Área Externa"]', 'Mooca, Brás e Belém'),
(7, '', 'Atuo com reparos, lixamento, pequenas pinturas e manutenção residencial cuidadosa.', '3 a 5 anos', '["Pintura Básica", "Limpeza Pós-Obra", "Organização de Ambientes"]', 'Tatuapé, Penha e Carrão'),
(8, '', 'Profissional versátil com experiência tanto na gestão de demandas quanto na execução de serviços de limpeza e organização.', '3 a 5 anos', '["Limpeza Residencial", "Passar Roupa", "Organização de Ambientes"]', 'Pinheiros, Vila Madalena e Jardins');

-- --------------------------------------------------------
-- Inserção de Avaliações Mútuas
-- --------------------------------------------------------
-- Avaliação da Demanda 2 (entre Mariana Ramos e Marcos Souza)
INSERT INTO avaliacoes (demanda_id, avaliador_id, avaliado_id, nota, comentario) VALUES
(2, 2, 6, 5, 'Excelente postura, muito pontual e eficiente no descarregamento das mercadorias.'),
(2, 6, 2, 5, 'Galpão organizado, equipe prestativa e pagamento realizado imediatamente ao final do expediente.');

