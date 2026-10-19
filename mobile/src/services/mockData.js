/**
 * Dados de demonstração realistas para fallback gracioso no app mobile Aranduê
 * Baseados nas diretrizes do ODS 8 e seed oficial da plataforma.
 */

export const MOCK_VAGAS = [
  {
    id: 1,
    contratante_id: 1,
    contratante_nome: 'Buffet Sabor & Festa (Carlos)',
    contratante_telefone: '11988887777',
    titulo: 'Garçom para Evento Corporativo',
    descricao: 'Atendimento a convidados em coquetel empresarial de negócios. Necessário calça e sapato sociais pretos. Horário das 18h às 23h com intervalo.',
    categoria: 'Eventos',
    valor_diaria: 180.0,
    data_servico: '2026-10-25',
    bairro: 'Pinheiros, São Paulo',
    status: 'aberta',
    alimentacao_inclusa: true,
    vale_transporte: true,
    total_candidatos: 2
  },
  {
    id: 2,
    contratante_id: 2,
    contratante_nome: 'LogExpress Distribuição (Mariana)',
    contratante_telefone: '11977776666',
    titulo: 'Auxiliar de Carga e Descarga',
    descricao: 'Descarregamento de paletes de caixas secas em galpão logístico. Uso de EPI fornecido pela empresa no local. Horário das 08h às 16h.',
    categoria: 'Logística',
    valor_diaria: 160.0,
    data_servico: '2026-10-26',
    bairro: 'Lapa, São Paulo',
    status: 'aberta',
    alimentacao_inclusa: true,
    vale_transporte: false,
    total_candidatos: 1
  },
  {
    id: 3,
    contratante_id: 3,
    contratante_nome: 'Silva Pinturas e Reformas (Roberto)',
    contratante_telefone: '11966665555',
    titulo: 'Ajudante de Pintura Residencial',
    descricao: 'Preparação de paredes com lixa fina, proteção de rodapés e tomadas com fita crepe em apartamento térreo. Horário das 08h às 17h.',
    categoria: 'Construção',
    valor_diaria: 150.0,
    data_servico: '2026-10-27',
    bairro: 'Santana, São Paulo',
    status: 'aberta',
    alimentacao_inclusa: false,
    vale_transporte: true,
    total_candidatos: 3
  },
  {
    id: 4,
    contratante_id: 1,
    contratante_nome: 'Buffet Sabor & Festa (Carlos)',
    contratante_telefone: '11988887777',
    titulo: 'Montador de Estande para Feira',
    descricao: 'Montagem de divisórias modulares e fixação de painéis para feira de tecnologia. Ferramentas fornecidas no local. Horário das 07h às 15h.',
    categoria: 'Montagem',
    valor_diaria: 200.0,
    data_servico: '2026-10-28',
    bairro: 'Pinheiros, São Paulo',
    status: 'aberta',
    alimentacao_inclusa: true,
    vale_transporte: true,
    total_candidatos: 0
  },
  {
    id: 5,
    contratante_id: 3,
    contratante_nome: 'Silva Pinturas e Reformas (Roberto)',
    contratante_telefone: '11966665555',
    titulo: 'Auxiliar de Limpeza Pós-Obra',
    descricao: 'Limpeza minuciosa de vidros, esquadrias e remoção de pó fino em conjunto comercial recém-reformado. Produtos fornecidos no local.',
    categoria: 'Limpeza',
    valor_diaria: 170.0,
    data_servico: '2026-10-29',
    bairro: 'Perdizes, São Paulo',
    status: 'aberta',
    alimentacao_inclusa: false,
    vale_transporte: true,
    total_candidatos: 4
  },
  {
    id: 6,
    contratante_id: 8,
    contratante_nome: 'Patrícia Prado',
    contratante_telefone: '11911110000',
    titulo: 'Faxina Residencial Completa & Passadoria',
    descricao: 'Faxina padrão em apartamento de 3 dormitórios com atenção a banheiros e passar lote de camisas. Ambiente tranquilo, horário das 08h às 16h.',
    categoria: 'Faxina Residencial',
    valor_diaria: 220.0,
    data_servico: '2026-10-30',
    bairro: 'Vila Mariana, São Paulo',
    status: 'aberta',
    alimentacao_inclusa: true,
    vale_transporte: true,
    total_candidatos: 2
  }
];

export const MOCK_DIARISTAS = [
  {
    id: 4,
    nome: 'Lucas Pereira',
    email: 'lucas.pereira@email.com',
    telefone: '11955554444',
    bairro: 'Centro, São Paulo',
    regioes: 'Centro, Consolação, Bela Vista e Paulista',
    tipo: 'diarista',
    nota_media: 4.9,
    media_avaliacoes: 4.9,
    total_avaliacoes: 38,
    valor_base: 180,
    bio: 'Profissional pontual, experiente em serviços residenciais e eventos com atenção aos mínimos detalhes e postura impecável.',
    experiencia: '3 a 5 anos',
    servicos: ['Garçom para Eventos', 'Limpeza Residencial', 'Apoio em Eventos', 'Cozinha Básica'],
    verificado: true,
    avaliacoesRecentes: [
      { id: 1, autor: 'Carlos Mendes', nota: 5, comentario: 'Pontualidade britânica e ótimo atendimento aos nossos convidados.' },
      { id: 2, autor: 'Mariana Ramos', nota: 5, comentario: 'Muito educado, ágil e prestativo durante todo o turno de trabalho.' }
    ],
    agendaDisponivel: [
      { id: 101, data: '2026-10-21', hora_inicio: '08:00', hora_fim: '17:00', observacao: 'Disponível dia todo' },
      { id: 102, data: '2026-10-22', hora_inicio: '08:00', hora_fim: '14:00', observacao: 'Manhã e início da tarde' },
      { id: 103, data: '2026-10-24', hora_inicio: '13:00', hora_fim: '22:00', observacao: 'Eventos noturnos' }
    ]
  },
  {
    id: 5,
    nome: 'Juliana Costa',
    email: 'juliana.costa@email.com',
    telefone: '11944443333',
    bairro: 'Vila Mariana, São Paulo',
    regioes: 'Vila Mariana, Saúde, Paraíso e Moema',
    tipo: 'diarista',
    nota_media: 5.0,
    media_avaliacoes: 5.0,
    total_avaliacoes: 52,
    valor_base: 190,
    bio: 'Especialista em atendimento de coquetéis, banquetes finos e organização minuciosa de buffets e cozinhas residenciais.',
    experiencia: 'Mais de 5 anos',
    servicos: ['Garçom para Eventos', 'Cozinha & Apoio', 'Passadeira', 'Organização de Ambientes'],
    verificado: true,
    avaliacoesRecentes: [
      { id: 3, autor: 'Roberto Silva', nota: 5, comentario: 'Trabalho de altíssimo nível, roupas impecáveis e extrema discrição.' },
      { id: 4, autor: 'Patrícia Prado', nota: 5, comentario: 'A melhor profissional que já contratamos no Aranduê!' }
    ],
    agendaDisponivel: [
      { id: 104, data: '2026-10-22', hora_inicio: '09:00', hora_fim: '16:00', observacao: 'Buffet ou residência' },
      { id: 105, data: '2026-10-25', hora_inicio: '08:00', hora_fim: '17:00', observacao: 'Diária completa' }
    ]
  },
  {
    id: 6,
    nome: 'Marcos Souza',
    email: 'marcos.souza@email.com',
    telefone: '11933332222',
    bairro: 'Mooca, São Paulo',
    regioes: 'Mooca, Brás, Belém e Tatuapé',
    tipo: 'diarista',
    nota_media: 4.8,
    media_avaliacoes: 4.8,
    total_avaliacoes: 44,
    valor_base: 160,
    bio: 'Experiência sólida com movimentação de cargas, estoques, logística pesada e limpeza pós-obra com foco total em segurança.',
    experiencia: 'Mais de 5 anos',
    servicos: ['Carga e Descarga', 'Limpeza Pós-Obra', 'Jardinagem & Área Externa', 'Apoio em Mudança'],
    verificado: true,
    avaliacoesRecentes: [
      { id: 5, autor: 'Mariana Ramos', nota: 5, comentario: 'Galpão organizado e descarregamento feito no prazo com segurança.' }
    ],
    agendaDisponivel: [
      { id: 106, data: '2026-10-21', hora_inicio: '07:00', hora_fim: '16:00', observacao: 'Logística matutina' },
      { id: 107, data: '2026-10-23', hora_inicio: '08:00', hora_fim: '17:00', observacao: 'Dia completo' }
    ]
  },
  {
    id: 7,
    nome: 'Beatriz Lima',
    email: 'beatriz.lima@email.com',
    telefone: '11922221111',
    bairro: 'Tatuapé, São Paulo',
    regioes: 'Tatuapé, Penha, Carrão e Anália Franco',
    tipo: 'diarista',
    nota_media: 4.9,
    media_avaliacoes: 4.9,
    total_avaliacoes: 29,
    valor_base: 170,
    bio: 'Atuo com pinturas decorativas básicas, lixamento fino, reparos domésticos e limpeza pós-obra com perfeição de acabamento.',
    experiencia: '3 a 5 anos',
    servicos: ['Pintura Básica', 'Limpeza Pós-Obra', 'Organização de Ambientes', 'Passadeira'],
    verificado: true,
    avaliacoesRecentes: [
      { id: 6, autor: 'Carlos Mendes', nota: 5, comentario: 'Isolou tudo perfeitamente com fita e o acabamento ficou ótimo.' }
    ],
    agendaDisponivel: [
      { id: 108, data: '2026-10-23', hora_inicio: '08:30', hora_fim: '17:30', observacao: 'Pintura e acabamento' },
      { id: 109, data: '2026-10-24', hora_inicio: '09:00', hora_fim: '14:00', observacao: 'Manutenção rápida' }
    ]
  }
];

export const MOCK_CANDIDATOS_DEMANDA = [
  {
    id: 201,
    candidatura_id: 201,
    diarista_id: 4,
    diarista_nome: 'Lucas Pereira',
    diarista_telefone: '11955554444',
    diarista_bairro: 'Centro, SP',
    nota_media: 4.9,
    total_avaliacoes: 38,
    status: 'pendente',
    mensagem: 'Olá! Possuo 4 anos de experiência em eventos e buffet corporativo. Traje social completo e disponibilidade pontual no horário do evento.',
    data_candidatura: '2026-10-18T14:30:00Z',
    diarista_servicos: ['Garçom para Eventos', 'Limpeza Residencial']
  },
  {
    id: 202,
    candidatura_id: 202,
    diarista_id: 5,
    diarista_nome: 'Juliana Costa',
    diarista_telefone: '11944443333',
    diarista_bairro: 'Vila Mariana, SP',
    nota_media: 5.0,
    total_avaliacoes: 52,
    status: 'aceita',
    mensagem: 'Tenho ampla experiência com coquetéis finos, recepção de autoridades e organização de louças.',
    data_candidatura: '2026-10-18T15:00:00Z',
    diarista_servicos: ['Garçom para Eventos', 'Cozinha & Apoio']
  }
];

export const MOCK_MINHAS_CANDIDATURAS = [
  {
    id: 301,
    demanda_id: 1,
    diarista_id: 4,
    status: 'aceita',
    mensagem: 'Possuo experiência em eventos corporativos e disponibilidade imediata.',
    data_candidatura: '2026-10-18T10:00:00Z',
    titulo: 'Garçom para Evento Corporativo',
    categoria: 'Eventos',
    valor_diaria: 180.0,
    data_servico: '2026-10-25',
    bairro: 'Pinheiros, São Paulo',
    contratante_nome: 'Carlos Mendes',
    contratante_telefone: '11988887777',
    contratante_email: 'carlos.mendes@buffetsabor.com.br',
    endereco_completo: 'Rua dos Pinheiros, 1200 - 3º andar'
  },
  {
    id: 302,
    demanda_id: 3,
    diarista_id: 4,
    status: 'pendente',
    mensagem: 'Tenho interesse na vaga de ajudante e ferramentas básicas.',
    data_candidatura: '2026-10-18T12:00:00Z',
    titulo: 'Ajudante de Pintura Residencial',
    categoria: 'Construção',
    valor_diaria: 150.0,
    data_servico: '2026-10-27',
    bairro: 'Santana, São Paulo',
    contratante_nome: 'Roberto Silva',
    contratante_telefone: '11966665555'
  },
  {
    id: 303,
    demanda_id: 5,
    diarista_id: 4,
    status: 'recusada',
    mensagem: 'Experiência em pós-obra detalhado.',
    data_candidatura: '2026-10-17T09:00:00Z',
    titulo: 'Auxiliar de Limpeza Pós-Obra',
    categoria: 'Limpeza',
    valor_diaria: 170.0,
    data_servico: '2026-10-29',
    bairro: 'Perdizes, São Paulo',
    contratante_nome: 'Silva Reformas',
    contratante_telefone: '11966665555'
  }
];

export const CATEGORIAS_FILTRO = [
  'Todas',
  'Faxina Residencial',
  'Limpeza Comercial',
  'Passadeira',
  'Cozinha',
  'Eventos',
  'Cuidado',
  'Construção',
  'Logística'
];

export const CATEGORIAS_FORMULARIO = [
  'Faxina Residencial',
  'Limpeza Comercial',
  'Passadeira',
  'Cozinha',
  'Eventos',
  'Cuidado',
  'Construção',
  'Logística',
  'Montagem',
  'Outros'
];
