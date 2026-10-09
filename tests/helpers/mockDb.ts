/**
 * Banco de Dados em Memória (Mock) para Testes Automatizados
 * Permite isolamento completo, resets entre execuções e testes independentes de MySQL externo.
 */

export interface MockUser {
  id: number;
  nome: string;
  email: string;
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

let users: MockUser[] = [];
let demandas: MockDemanda[] = [];
let candidaturas: MockCandidatura[] = [];
let autoIncDemanda = 100;
let autoIncCandidatura = 500;

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

/**
 * Restaura o estado original do banco em memória.
 * Deve ser executado em beforeEach/afterEach para garantir isolamento.
 */
export function resetMockDb(): void {
  users = JSON.parse(JSON.stringify(INITIAL_USERS));
  demandas = JSON.parse(JSON.stringify(INITIAL_DEMANDAS));
  candidaturas = [];
  autoIncDemanda = 100;
  autoIncCandidatura = 500;
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

  // 9. UPDATE usuarios (anonimização / soft delete)
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
    return [[{ nota_media: 5.0, total_avaliacoes: 2 }], {}];
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

  return [[], {}];
}
