/**
 * Banco de Dados em Memória (Mock) para Testes Automatizados
 * Permite isolamento completo, resets entre execuções e testes independentes de MySQL externo.
 */

export interface MockUser {
  id: number;
  nome: string;
  email: string;
  google_id?: string | null;
  avatar_url?: string | null;
  telefone: string;
  tipo: 'contratante' | 'diarista' | 'ambas' | string;
  bairro: string;
  status: 'ativo' | 'inativo';
  notif_whatsapp?: boolean;
  notif_email?: boolean;
  notif_push?: boolean;
}

export interface MockDemanda {
  id: number;
  contratante_id: number;
  titulo: string;
  descricao: string;
  categoria: string;
  valor_diaria: number;
  data_servico: string;
  bairro: string;
  status: string;
  data_criacao: string;
}

export interface MockCandidatura {
  id: number;
  demanda_id: number;
  diarista_id: number;
  mensagem: string;
  status: string;
  data_criacao: string;
}

export interface MockAvaliacao {
  id: number;
  demanda_id: number;
  avaliador_id: number;
  avaliado_id: number;
  nota: number;
  comentario: string | null;
  data_criacao: string;
}

export interface MockDisponibilidade {
  id: number;
  diarista_id: number;
  data: string;
  hora_inicio: string;
  hora_fim: string;
  status: 'disponivel' | 'ocupado' | 'indisponivel';
  observacao?: string | null;
  data_criacao: string;
}

let users: MockUser[] = [];
let demandas: MockDemanda[] = [];
let candidaturas: MockCandidatura[] = [];
let avaliacoes: MockAvaliacao[] = [];
let disponibilidades: MockDisponibilidade[] = [];
let autoIncDemanda = 100;
let autoIncCandidatura = 500;
let autoIncAvaliacao = 300;
let autoIncDisponibilidade = 400;

export const INITIAL_USERS: MockUser[] = [
  {
    id: 1,
    nome: 'Carlos Mendes',
    email: 'carlos.mendes@buffetsabor.com.br',
    telefone: '11988887777',
    tipo: 'contratante',
    bairro: 'Pinheiros',
    status: 'ativo'
  },
  {
    id: 2,
    nome: 'Lucas Pereira',
    email: 'lucas.pereira@email.com',
    telefone: '11955554444',
    tipo: 'diarista',
    bairro: 'Centro',
    status: 'ativo'
  },
  {
    id: 3,
    nome: 'Patrícia Prado',
    email: 'patricia.prado@email.com',
    telefone: '11911110000',
    tipo: 'ambas',
    bairro: 'Vila Mariana',
    status: 'ativo'
  }
];

export const INITIAL_DEMANDAS: MockDemanda[] = [
  {
    id: 1,
    contratante_id: 1,
    titulo: 'Limpeza Residencial Pré-Mudança',
    descricao: 'Limpeza completa de apartamento de 75m² desocupado.',
    categoria: 'Limpeza',
    valor_diaria: 220.0,
    data_servico: '2026-10-15',
    bairro: 'Pinheiros',
    status: 'aberta',
    data_criacao: '2026-10-01T10:00:00Z'
  },
  {
    id: 2,
    contratante_id: 1,
    titulo: 'Organização de Armários e Cozinha',
    descricao: 'Organização de despensa e armários planejados.',
    categoria: 'Organização',
    valor_diaria: 180.0,
    data_servico: '2026-10-18',
    bairro: 'Pinheiros',
    status: 'aberta',
    data_criacao: '2026-10-02T14:30:00Z'
  }
];

export const INITIAL_DISPONIBILIDADES: MockDisponibilidade[] = [
  {
    id: 1,
    diarista_id: 2,
    data: '2026-10-20',
    hora_inicio: '08:00',
    hora_fim: '12:00',
    status: 'disponivel',
    observacao: 'Período da manhã',
    data_criacao: '2026-10-01T10:00:00Z'
  },
  {
    id: 2,
    diarista_id: 2,
    data: '2026-10-20',
    hora_inicio: '13:00',
    hora_fim: '17:00',
    status: 'disponivel',
    observacao: 'Período da tarde',
    data_criacao: '2026-10-01T10:00:00Z'
  },
  {
    id: 3,
    diarista_id: 2,
    data: '2026-10-22',
    hora_inicio: '08:00',
    hora_fim: '17:00',
    status: 'disponivel',
    observacao: 'Dia inteiro',
    data_criacao: '2026-10-01T10:00:00Z'
  }
];

/**
 * Restaura o estado original do banco em memória.
 * Deve ser executado em beforeEach/afterEach para garantir isolamento.
 */
export function resetMockDb(): void {
  users = JSON.parse(JSON.stringify(INITIAL_USERS));
  demandas = JSON.parse(JSON.stringify(INITIAL_DEMANDAS));
  candidaturas = [];
  avaliacoes = [];
  disponibilidades = JSON.parse(JSON.stringify(INITIAL_DISPONIBILIDADES));
  autoIncDemanda = 100;
  autoIncCandidatura = 500;
  autoIncAvaliacao = 300;
  autoIncDisponibilidade = 400;
}

export function getMockUsers(): MockUser[] {
  return users;
}

export function getMockDemandas(): MockDemanda[] {
  return demandas;
}

export function getMockCandidaturas(): MockCandidatura[] {
  return candidaturas;
}

export function getMockAvaliacoes(): MockAvaliacao[] {
  return avaliacoes;
}

export function getMockDisponibilidades(): MockDisponibilidade[] {
  return disponibilidades;
}

/**
 * Função de execução SQL simulada compatível com mysql2/promise pool.query
 */
export async function mockDbQuery(sql: string, params: any[] = []): Promise<[any, any]> {
  const norm = sql.replace(/\s+/g, ' ').trim().toUpperCase();

  // 1. SELECT usuarios WHERE id = ?
  if (norm.includes('FROM USUARIOS') && norm.includes('WHERE ID = ?')) {
    const id = Number(params[0]);
    const found = users.find((u) => u.id === id);
    return [found ? [found] : [], {}];
  }

  // 1.1 SELECT usuarios WHERE google_id = ?
  if (norm.includes('FROM USUARIOS') && norm.includes('WHERE GOOGLE_ID = ?')) {
    const googleId = String(params[0]);
    const found = users.find((u) => u.google_id === googleId);
    return [found ? [found] : [], {}];
  }

  // 1.2 SELECT usuarios WHERE LOWER(email) = ?
  if (norm.includes('FROM USUARIOS') && (norm.includes('LOWER(EMAIL) = ?') || norm.includes('EMAIL = ?'))) {
    const emailTarget = String(params[0]).toLowerCase();
    const found = users.find((u) => u.email.toLowerCase() === emailTarget);
    return [found ? [found] : [], {}];
  }

  // 1.3 INSERT INTO usuarios
  if (norm.startsWith('INSERT INTO USUARIOS')) {
    const newId = users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1;
    let novoUser: MockUser;
    if (norm.includes('GOOGLE_ID')) {
      const [nome, email, google_id, avatar_url, tipo] = params;
      novoUser = {
        id: newId,
        nome: String(nome),
        email: String(email).toLowerCase(),
        google_id: String(google_id),
        avatar_url: avatar_url ? String(avatar_url) : null,
        telefone: '',
        tipo: tipo || 'contratante',
        bairro: '',
        status: 'ativo'
      };
    } else {
      const [nome, email, telefone, tipo, bairro] = params;
      novoUser = {
        id: newId,
        nome: String(nome),
        email: String(email).toLowerCase(),
        telefone: String(telefone || ''),
        tipo: tipo || 'contratante',
        bairro: String(bairro || ''),
        status: 'ativo'
      };
    }
    users.push(novoUser);
    return [{ insertId: newId, affectedRows: 1 }, {}];
  }

  // 2. INSERT INTO demandas
  if (norm.startsWith('INSERT INTO DEMANDAS')) {
    const [contratante_id, titulo, descricao, categoria, valor_diaria, data_servico, bairro, status] = params;
    const newId = ++autoIncDemanda;
    const nova: MockDemanda = {
      id: newId,
      contratante_id: Number(contratante_id),
      titulo: String(titulo),
      descricao: String(descricao),
      categoria: String(categoria),
      valor_diaria: Number(valor_diaria),
      data_servico: String(data_servico),
      bairro: String(bairro),
      status: status || 'aberta',
      data_criacao: new Date().toISOString()
    };
    demandas.push(nova);
    return [{ insertId: newId, affectedRows: 1 }, {}];
  }

  // 3. SELECT demandas WHERE id = ?
  if (norm.includes('FROM DEMANDAS') && (norm.includes('WHERE D.ID = ?') || norm.includes('WHERE ID = ?'))) {
    const id = Number(params[0]);
    const d = demandas.find((item) => item.id === id);
    if (!d) return [[], {}];
    const u = users.find((user) => user.id === d.contratante_id);
    const enriched = {
      ...d,
      contratante_nome: u?.nome || 'Contratante',
      contratante_email: u?.email || 'email@teste.com',
      contratante_telefone: u?.telefone || '11988887777',
      contratante_bairro: u?.bairro || 'Pinheiros',
      total_candidatos: candidaturas.filter((c) => c.demanda_id === d.id).length,
      contratante_nota_media: 5.0
    };
    return [[enriched], {}];
  }

  // 4. SELECT demandas WHERE contratante_id = ?
  if (norm.includes('FROM DEMANDAS') && norm.includes('CONTRATANTE_ID = ?')) {
    // Pode ser query com filtro ou listarMinhas
    const paramVal = params[params.length - 1] ?? params[0];
    const contratanteId = Number(paramVal);
    const userDemandas = demandas.filter((d) => d.contratante_id === contratanteId);
    return [userDemandas, {}];
  }

  // 5. SELECT candidaturas duplicidade: WHERE demanda_id = ? AND diarista_id = ?
  if (norm.includes('FROM CANDIDATURAS') && norm.includes('DEMANDA_ID = ?') && norm.includes('DIARISTA_ID = ?')) {
    const [demanda_id, diarista_id] = params.map(Number);
    const existing = candidaturas.find((c) => c.demanda_id === demanda_id && c.diarista_id === diarista_id);
    return [existing ? [existing] : [], {}];
  }

  // 5.1 Conflito de agenda: checkAgendaConflict
  if (norm.includes('FROM CANDIDATURAS') && norm.includes("STATUS = 'ACEITA'") && (norm.includes('DATA_SERVICO') || norm.includes('DATE(D.DATA_SERVICO)'))) {
    const diaristaId = Number(params[0]);
    const excludeDemandaId = norm.includes('DEMANDA_ID != ?') || norm.includes('D.ID != ?') ? Number(params[1]) : null;
    const dataAlvoParam = excludeDemandaId ? params[2] : params[1];
    const dataAlvo = String(dataAlvoParam).slice(0, 10);

    const conflito = candidaturas.find((c) => {
      if (c.diarista_id !== diaristaId || c.status !== 'aceita') return false;
      if (excludeDemandaId && c.demanda_id === excludeDemandaId) return false;
      const d = demandas.find((dem) => dem.id === c.demanda_id);
      if (!d) return false;
      const dData = String(d.data_servico).slice(0, 10);
      return dData === dataAlvo && ['aberta', 'preenchida'].includes(d.status);
    });

    if (conflito) {
      const d = demandas.find((dem) => dem.id === conflito.demanda_id);
      return [[{
        id: conflito.id,
        demanda_id: conflito.demanda_id,
        titulo: d?.titulo || 'Demanda',
        data_servico: d?.data_servico || dataAlvo
      }], {}];
    }
    return [[], {}];
  }

  // 6. INSERT INTO candidaturas
  if (norm.startsWith('INSERT INTO CANDIDATURAS')) {
    const [demanda_id, diarista_id, mensagem] = params;
    const newId = ++autoIncCandidatura;
    const novaCand: MockCandidatura = {
      id: newId,
      demanda_id: Number(demanda_id),
      diarista_id: Number(diarista_id),
      mensagem: String(mensagem || ''),
      status: 'pendente',
      data_criacao: new Date().toISOString()
    };
    candidaturas.push(novaCand);
    return [{ insertId: newId, affectedRows: 1 }, {}];
  }

  // 7. Checagem de pendências ativas ao excluir conta (demandas)
  if (norm.includes('FROM DEMANDAS') && norm.includes('STATUS IN')) {
    const contratanteId = Number(params[0]);
    const ativas = demandas.filter(
      (d) => d.contratante_id === contratanteId && (d.status === 'aberta' || d.status === 'preenchida')
    );
    return [ativas, {}];
  }

  // 8. Checagem de pendências ativas ao excluir conta (candidaturas aceitas)
  if (norm.includes('FROM CANDIDATURAS') && norm.includes("STATUS = 'ACEITA'") && norm.includes('DIARISTA_ID = ?')) {
    const diaristaId = Number(params[0]);
    const ativas = candidaturas.filter((c) => c.diarista_id === diaristaId && c.status === 'aceita');
    return [ativas, {}];
  }

  // 9. UPDATE usuarios (anonimização / soft delete / google_id)
  if (norm.startsWith('UPDATE USUARIOS')) {
    const id = Number(params[params.length - 1]);
    const u = users.find((item) => item.id === id);
    if (u) {
      if (norm.includes("STATUS = 'INATIVO'")) {
        u.status = 'inativo';
        u.nome = 'Conta Encerrada';
        u.email = String(params[0]);
        u.telefone = '00000000000';
      }
      if (norm.includes('GOOGLE_ID = ?')) {
        u.google_id = String(params[0]);
        if (params[1]) u.avatar_url = String(params[1]);
      }
      if (norm.includes('AVATAR_URL = ?') && !norm.includes('GOOGLE_ID = ?')) {
        u.avatar_url = String(params[0]);
      }
    }
    return [{ affectedRows: 1 }, {}];
  }

  // 10. DELETE FROM candidaturas WHERE id = ?
  if (norm.startsWith('DELETE FROM CANDIDATURAS') && norm.includes('WHERE ID = ?')) {
    const id = Number(params[0]);
    const idx = candidaturas.findIndex((c) => c.id === id);
    if (idx !== -1) {
      candidaturas.splice(idx, 1);
      return [{ affectedRows: 1 }, {}];
    }
    return [{ affectedRows: 0 }, {}];
  }

  // 10.1 DELETE candidaturas concorrentes pendentes: WHERE demanda_id = ? AND id != ?
  if (norm.startsWith('DELETE FROM CANDIDATURAS') && norm.includes('DEMANDA_ID = ?') && norm.includes('ID != ?')) {
    const [demandaId, excId] = params.map(Number);
    let rem = 0;
    for (let i = candidaturas.length - 1; i >= 0; i--) {
      if (candidaturas[i].demanda_id === demandaId && candidaturas[i].id !== excId && candidaturas[i].status === 'pendente') {
        candidaturas.splice(i, 1);
        rem++;
      }
    }
    return [{ affectedRows: rem }, {}];
  }

  // 10.2 UPDATE candidaturas SET status = ? WHERE id = ?
  if (norm.startsWith('UPDATE CANDIDATURAS') && norm.includes('STATUS = ?') && norm.includes('WHERE ID = ?')) {
    const [novoStatus, idParam] = params;
    const id = Number(idParam);
    const cand = candidaturas.find((c) => c.id === id);
    if (cand) {
      cand.status = String(novoStatus);
      return [{ affectedRows: 1 }, {}];
    }
    return [{ affectedRows: 0 }, {}];
  }

  // 11. SELECT candidaturas findById (com joins)
  if (norm.includes('FROM CANDIDATURAS') && (norm.includes('WHERE C.ID = ?') || norm.includes('WHERE ID = ?'))) {
    const id = Number(params[0]);
    const cand = candidaturas.find((c) => c.id === id);
    if (!cand) return [[], {}];
    const u = users.find((user) => user.id === cand.diarista_id);
    const d = demandas.find((dem) => dem.id === cand.demanda_id);
    return [[{
      id: cand.id,
      demanda_id: cand.demanda_id,
      diarista_id: cand.diarista_id,
      status: cand.status,
      mensagem: cand.mensagem,
      data_criacao: cand.data_criacao,
      data_servico: d?.data_servico || '2026-10-15',
      demanda_status: d?.status || 'aberta',
      diarista_nome: u?.nome || 'Lucas Pereira',
      diarista_email: u?.email || 'lucas.pereira@email.com',
      diarista_telefone: u?.telefone || '11955554444',
      diarista_bairro: u?.bairro || 'Centro',
      demanda_titulo: d?.titulo || 'Demanda',
      contratante_id: d?.contratante_id || 1
    }], {}];
  }

  // 12. SELECT candidaturas findByDemandaId
  if (norm.includes('FROM CANDIDATURAS') && (norm.includes('WHERE C.DEMANDA_ID = ?') || norm.includes('WHERE DEMANDA_ID = ?')) && !norm.includes('DIARISTA_ID = ?')) {
    const demandaId = Number(params[0]);
    const list = candidaturas.filter((c) => c.demanda_id === demandaId).map((c) => {
      const u = users.find((user) => user.id === c.diarista_id);
      return {
        id: c.id,
        demanda_id: c.demanda_id,
        diarista_id: c.diarista_id,
        status: c.status,
        mensagem: c.mensagem,
        data_criacao: c.data_criacao,
        diarista_nome: u?.nome || 'Lucas Pereira',
        diarista_email: u?.email || 'lucas.pereira@email.com',
        diarista_telefone: u?.telefone || '11955554444',
        diarista_bairro: u?.bairro || 'Centro',
        diarista_nota_media: 5.0,
        total_bicos_concluidos: 2,
        diarista_foto_url: '',
        diarista_bio: 'Profissional com 3 anos de experiência em limpezas e eventos.',
        diarista_experiencia: '3 a 5 anos',
        diarista_servicos: JSON.stringify(['Limpeza Residencial', 'Passar Roupa']),
        diarista_regioes: 'Centro e proximidades'
      };
    });
    return [list, {}];
  }

  // 13. SELECT FROM curriculos WHERE usuario_id = ?
  if (norm.includes('FROM CURRICULOS') && norm.includes('USUARIO_ID = ?')) {
    const usuarioId = Number(params[0]);
    return [[{
      id: 1,
      usuario_id: usuarioId,
      foto_url: '',
      bio: 'Profissional com 3 anos de experiência em limpezas e eventos.',
      experiencia: '3 a 5 anos',
      servicos: JSON.stringify(['Limpeza Residencial', 'Passar Roupa']),
      regioes: 'Centro e proximidades',
      data_atualizacao: new Date().toISOString()
    }], {}];
  }

  // 14. SELECT avaliacoes WHERE avaliado_id = ?
  if (norm.includes('FROM AVALIACOES') && norm.includes('AVALIADO_ID = ?')) {
    if (norm.includes('AVG(NOTA)') || norm.includes('NOTA_MEDIA') || norm.includes('ESTRELAS_5') || norm.includes('COUNT(*)')) {
      const avaliadoId = Number(params[0]);
      const userAvals = avaliacoes.filter((a) => a.avaliado_id === avaliadoId);
      const total = userAvals.length;
      const media = total > 0 ? Number((userAvals.reduce((s, a) => s + a.nota, 0) / total).toFixed(1)) : (norm.includes('ESTRELAS_5') ? 0.0 : 5.0);
      const e5 = userAvals.filter((a) => a.nota === 5).length;
      const e4 = userAvals.filter((a) => a.nota === 4).length;
      const e3 = userAvals.filter((a) => a.nota === 3).length;
      const e2 = userAvals.filter((a) => a.nota === 2).length;
      const e1 = userAvals.filter((a) => a.nota === 1).length;
      return [[{
        nota_media: media,
        total_avaliacoes: total,
        estrelas_5: e5,
        estrelas_4: e4,
        estrelas_3: e3,
        estrelas_2: e2,
        estrelas_1: e1
      }], {}];
    }
    const avaliadoId = Number(params[0]);
    const list = avaliacoes.filter((a) => a.avaliado_id === avaliadoId).map((a) => {
      const uAvaliador = users.find((u) => u.id === a.avaliador_id);
      const d = demandas.find((dem) => dem.id === a.demanda_id);
      return {
        id: a.id,
        demanda_id: a.demanda_id,
        nota: a.nota,
        comentario: a.comentario,
        avaliador_nome: uAvaliador?.tipo === 'contratante' ? 'Contratante verificado' : uAvaliador?.tipo === 'diarista' ? 'Diarista verificado' : 'Usuário da plataforma',
        avaliador_tipo: uAvaliador?.tipo || 'usuario',
        demanda_titulo: d?.titulo || 'Demanda'
      };
    });
    return [list, {}];
  }

  // 15. SELECT candidaturas findByDiaristaId
  if (norm.includes('FROM CANDIDATURAS') && (norm.includes('WHERE C.DIARISTA_ID = ?') || norm.includes('WHERE DIARISTA_ID = ?')) && !norm.includes('DEMANDA_ID = ?')) {
    const diaristaId = Number(params[0]);
    const list = candidaturas.filter((c) => c.diarista_id === diaristaId).map((c) => {
      const d = demandas.find((dem) => dem.id === c.demanda_id);
      const u = users.find((user) => user.id === d?.contratante_id);
      return {
        id: c.id,
        demanda_id: c.demanda_id,
        status: c.status,
        candidatura_status: c.status,
        mensagem: c.mensagem,
        candidatura_data: c.data_criacao,
        demanda_titulo: d?.titulo || 'Demanda',
        demanda_categoria: d?.categoria || 'Geral',
        demanda_valor: d?.valor_diaria || 200,
        demanda_data: d?.data_servico || '2026-10-25',
        demanda_data_servico: d?.data_servico || '2026-10-25',
        demanda_bairro: d?.bairro || 'Centro',
        demanda_status: d?.status || 'aberta',
        contratante_nome: u?.nome || 'Contratante',
        contratante_telefone: u?.telefone || '11988887777'
      };
    });
    return [list, {}];
  }

  // 16. UPDATE demandas
  if (norm.startsWith('UPDATE DEMANDAS')) {
    const id = Number(params[params.length - 1]);
    const d = demandas.find((item) => item.id === id);
    if (d) {
      const statusParam = params.find((p) => typeof p === 'string' && ['aberta', 'preenchida', 'concluida', 'cancelada'].includes(p));
      if (norm.includes("STATUS = 'CONCLUIDA'")) {
        d.status = 'concluida';
      } else if (norm.includes("STATUS = 'PREENCHIDA'")) {
        d.status = 'preenchida';
      } else if (statusParam) {
        d.status = statusParam;
      }
      return [{ affectedRows: 1 }, {}];
    }
    return [{ affectedRows: 0 }, {}];
  }

  // 17. INSERT INTO avaliacoes
  if (norm.startsWith('INSERT INTO AVALIACOES')) {
    const [demanda_id, avaliador_id, avaliado_id, nota, comentario] = params;
    const newId = ++autoIncAvaliacao;
    const novaAvaliacao: MockAvaliacao = {
      id: newId,
      demanda_id: Number(demanda_id),
      avaliador_id: Number(avaliador_id),
      avaliado_id: Number(avaliado_id),
      nota: Number(nota),
      comentario: comentario ? String(comentario) : null,
      data_criacao: new Date().toISOString()
    };
    avaliacoes.push(novaAvaliacao);
    return [{ insertId: newId, affectedRows: 1 }, {}];
  }

  // 18. SELECT FROM avaliacoes WHERE demanda_id = ? AND avaliador_id = ?
  if (norm.includes('FROM AVALIACOES') && norm.includes('DEMANDA_ID = ?') && norm.includes('AVALIADOR_ID = ?')) {
    const [demanda_id, avaliador_id] = params.map(Number);
    const found = avaliacoes.find((a) => a.demanda_id === demanda_id && a.avaliador_id === avaliador_id);
    return [found ? [found] : [], {}];
  }

  // 19. SELECT FROM avaliacoes WHERE demanda_id = ?
  if (norm.includes('FROM AVALIACOES') && norm.includes('DEMANDA_ID = ?') && !norm.includes('AVALIADOR_ID = ?')) {
    const demandaId = Number(params[0]);
    const list = avaliacoes.filter((a) => a.demanda_id === demandaId).map((a) => {
      const uAvaliador = users.find((u) => u.id === a.avaliador_id);
      const uAvaliado = users.find((u) => u.id === a.avaliado_id);
      return {
        ...a,
        avaliador_nome: uAvaliador?.nome || 'Usuário',
        avaliado_nome: uAvaliado?.nome || 'Usuário'
      };
    });
    return [list, {}];
  }

  // 20. SELECT FROM avaliacoes WHERE avaliador_id = ?
  if (norm.includes('FROM AVALIACOES') && norm.includes('AVALIADOR_ID = ?') && !norm.includes('DEMANDA_ID = ?')) {
    const avaliadorId = Number(params[0]);
    const list = avaliacoes.filter((a) => a.avaliador_id === avaliadorId).map((a) => {
      const d = demandas.find((dem) => dem.id === a.demanda_id);
      const uAvaliado = users.find((u) => u.id === a.avaliado_id);
      return {
        ...a,
        avaliado_nome: uAvaliado?.nome || 'Usuário',
        demanda_titulo: d?.titulo || 'Demanda'
      };
    });
    return [list, {}];
  }

  // 21. INSERT INTO disponibilidades
  if (norm.startsWith('INSERT INTO DISPONIBILIDADES')) {
    const [diarista_id, data, hora_inicio, hora_fim, status, observacao] = params;
    const newId = ++autoIncDisponibilidade;
    const novaDisp: MockDisponibilidade = {
      id: newId,
      diarista_id: Number(diarista_id),
      data: String(data),
      hora_inicio: String(hora_inicio).slice(0, 5),
      hora_fim: String(hora_fim).slice(0, 5),
      status: status || 'disponivel',
      observacao: observacao || '',
      data_criacao: new Date().toISOString()
    };
    disponibilidades.push(novaDisp);
    return [{ insertId: newId, affectedRows: 1 }, {}];
  }

  // 22. DELETE FROM disponibilidades WHERE id = ? AND diarista_id = ?
  if (norm.startsWith('DELETE FROM DISPONIBILIDADES') && norm.includes('WHERE ID = ? AND DIARISTA_ID = ?')) {
    const [idParam, diaristaParam] = params.map(Number);
    const idx = disponibilidades.findIndex((d) => d.id === idParam && d.diarista_id === diaristaParam);
    if (idx !== -1) {
      disponibilidades.splice(idx, 1);
      return [{ affectedRows: 1 }, {}];
    }
    return [{ affectedRows: 0 }, {}];
  }

  // 23. SELECT FROM disponibilidades WHERE d.id = ?
  if (norm.includes('FROM DISPONIBILIDADES') && (norm.includes('WHERE D.ID = ?') || norm.includes('WHERE ID = ?')) && !norm.includes('DIARISTA_ID = ?')) {
    const id = Number(params[0]);
    const disp = disponibilidades.find((d) => d.id === id);
    if (!disp) return [[], {}];
    const u = users.find((user) => user.id === disp.diarista_id);
    return [[{
      ...disp,
      diarista_nome: u?.nome || 'Diarista'
    }], {}];
  }

  // 24. SELECT FROM disponibilidades WHERE diarista_id = ?
  if (norm.includes('FROM DISPONIBILIDADES') && norm.includes('DIARISTA_ID = ?')) {
    const diaristaId = Number(params[0]);
    let result = disponibilidades.filter((d) => d.diarista_id === diaristaId);
    if (norm.includes("STATUS = 'DISPONIVEL'") || norm.includes('STATUS = ?')) {
      const statusParam = norm.includes('STATUS = ?') ? params[params.length - 1] : 'disponivel';
      result = result.filter((d) => d.status === statusParam);
    }
    return [result, {}];
  }

  // 25. SELECT usuarios u (buscarDiaristas)
  if (norm.includes('FROM USUARIOS U') && norm.includes("U.TIPO IN ('DIARISTA', 'AMBOS')")) {
    const diaristas = users.filter((u) => (u.tipo === 'diarista' || u.tipo === 'ambas' || u.tipo === 'ambos') && u.status === 'ativo').map((u) => {
      const proxs = disponibilidades.filter((d) => d.diarista_id === u.id && d.status === 'disponivel');
      return {
        id: u.id,
        nome: u.nome,
        email: u.email,
        telefone: u.telefone,
        tipo: u.tipo,
        bairro: u.bairro,
        avatar_url: u.avatar_url || null,
        foto_url: '',
        bio: 'Profissional dedicado e com experiência em limpeza residencial e comercial.',
        experiencia: '3 a 5 anos',
        servicos: JSON.stringify(['Limpeza Residencial', 'Passar Roupa']),
        regioes: `${u.bairro} e proximidades`,
        nota_media: 5.0,
        total_avaliacoes: 3,
        total_concluidos: 5,
        proximas_disponibilidades: proxs
      };
    });
    return [diaristas, {}];
  }

  return [[], {}];
}

