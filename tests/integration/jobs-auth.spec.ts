import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import {
  mockDbQuery,
  resetMockDb,
  getMockUsers,
  getMockDemandas,
  getMockCandidaturas
} from '../helpers/mockDb';

import db from '../../backend/src/config/db';
import app from '../../backend/src/app';
import { generateTestToken } from '../helpers/auth';
import { beforeAll, afterAll } from 'vitest';

describe('Integration Tests: RBAC, Autenticação e Gestão de Vagas/Demandas', () => {
  beforeAll(() => {
    (globalThis as any).__mockDbQueryHandler = mockDbQuery;
  });

  afterAll(() => {
    (globalThis as any).__mockDbQueryHandler = null;
  });
  // Configura tokens com perfis realistas
  const tokenContratante = generateTestToken({
    id: 1,
    role: 'contratante',
    nome: 'Carlos Mendes',
    email: 'carlos.mendes@buffetsabor.com.br'
  });

  const tokenDiarista = generateTestToken({
    id: 2,
    role: 'diarista',
    nome: 'Lucas Pereira',
    email: 'lucas.pereira@email.com'
  });

  const tokenAmbas = generateTestToken({
    id: 3,
    role: 'ambas',
    nome: 'Patrícia Prado',
    email: 'patricia.prado@email.com'
  });

  beforeEach(() => {
    resetMockDb();
  });

  afterEach(() => {
    resetMockDb();
  });

  describe('1. Criação de Vagas: POST /api/vagas', () => {
    const payloadNovaVaga = {
      titulo: 'Pintura Residencial e Reparos em Paredes',
      descricao: 'Serviço de repintura interna em alvenaria e aplicação de massa corrida.',
      categoria: 'Pintura',
      valor_diaria: 280.0,
      data_servico: '2026-10-25',
      bairro: 'Jardins'
    };

    it('deve retornar 401 Unauthorized quando não for fornecido header de autenticação', async () => {
      const response = await request(app)
        .post('/api/vagas')
        .send(payloadNovaVaga);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('UNAUTHORIZED');
    });

    it('deve retornar 403 Forbidden com código FORBIDDEN_ROLE quando executado por usuário diarista', async () => {
      const response = await request(app)
        .post('/api/vagas')
        .set('Authorization', `Bearer ${tokenDiarista}`)
        .send(payloadNovaVaga);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('FORBIDDEN_ROLE');
    });

    it('deve retornar 201 Created quando executado por contratante', async () => {
      const response = await request(app)
        .post('/api/vagas')
        .set('Authorization', `Bearer ${tokenContratante}`)
        .send(payloadNovaVaga);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.titulo).toBe(payloadNovaVaga.titulo);
      expect(response.body.data.contratante_id).toBe(1);

      // Validação da persistência no banco em memória
      const demandas = getMockDemandas();
      expect(demandas.some((d) => d.titulo === payloadNovaVaga.titulo)).toBe(true);
    });

    it('deve retornar 201 Created quando executado por perfil híbrido ambas', async () => {
      const payloadVagaHibrida = {
        titulo: 'Apoio em Evento Corporativo e Buffet',
        descricao: 'Auxílio na organização de coffee break para 40 participantes.',
        categoria: 'Eventos',
        valor_diaria: 250.0,
        data_servico: '2026-10-28',
        bairro: 'Vila Mariana'
      };

      const response = await request(app)
        .post('/api/vagas')
        .set('Authorization', `Bearer ${tokenAmbas}`)
        .send(payloadVagaHibrida);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.contratante_id).toBe(3);
    });
  });

  describe('2. Candidatura a Vagas: POST /api/vagas/:id/candidaturas', () => {
    it('deve retornar 401 Unauthorized quando não autenticado', async () => {
      const response = await request(app)
        .post('/api/vagas/1/candidaturas')
        .send({ mensagem: 'Olá, tenho interesse na oportunidade.' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('deve retornar 403 Forbidden com código FORBIDDEN_ROLE para contratante tentando se candidatar', async () => {
      const response = await request(app)
        .post('/api/vagas/1/candidaturas')
        .set('Authorization', `Bearer ${tokenContratante}`)
        .send({ mensagem: 'Tentativa indevida de candidatura.' });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('FORBIDDEN_ROLE');
    });

    it('deve retornar 201 Created quando diarista se candidata com sucesso', async () => {
      const response = await request(app)
        .post('/api/vagas/1/candidaturas')
        .set('Authorization', `Bearer ${tokenDiarista}`)
        .send({
          mensagem: 'Tenho 4 anos de experiência com limpezas residenciais detalhadas.'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.diarista_id).toBe(2);
      expect(response.body.data.demanda_id).toBe('1');

      // Verifica inserção no banco em memória
      const candidaturas = getMockCandidaturas();
      expect(candidaturas.some((c) => c.diarista_id === 2 && c.demanda_id === 1)).toBe(true);
    });

    it('deve retornar 201 Created quando perfil híbrido ambas se candidata à vaga', async () => {
      const response = await request(app)
        .post('/api/vagas/2/candidaturas')
        .set('Authorization', `Bearer ${tokenAmbas}`)
        .send({
          mensagem: 'Possuo curso de personal organizer e disponibilidade para a data.'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.diarista_id).toBe(3);
    });

    it('deve retornar 401 Unauthorized ao tentar se candidatar via POST /api/candidaturas sem autenticação', async () => {
      const response = await request(app)
        .post('/api/candidaturas')
        .send({ demanda_id: 1, mensagem: 'Tentativa não autenticada' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('UNAUTHORIZED');
    });

    it('deve retornar 403 Forbidden para contratante via POST /api/candidaturas', async () => {
      const response = await request(app)
        .post('/api/candidaturas')
        .set('Authorization', `Bearer ${tokenContratante}`)
        .send({ demanda_id: 1, mensagem: 'Tentativa indevida' });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('FORBIDDEN_ROLE');
    });

    it('deve retornar 400 Bad Request ao tentar se candidatar pela segunda vez na mesma vaga (duplicidade)', async () => {
      // Primeira inscrição com sucesso
      await request(app)
        .post('/api/vagas/1/candidaturas')
        .set('Authorization', `Bearer ${tokenDiarista}`)
        .send({ mensagem: 'Primeira inscrição' });

      // Segunda tentativa para a mesma vaga
      const response = await request(app)
        .post('/api/vagas/1/candidaturas')
        .set('Authorization', `Bearer ${tokenDiarista}`)
        .send({ mensagem: 'Segunda inscrição duplicada' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('já possui candidatura');
    });

    it('deve retornar 400 Bad Request quando anunciante tenta se candidatar à sua própria vaga', async () => {
      // Cria uma vaga com a usuária 3 (perfil ambas)
      const novaVaga = await request(app)
        .post('/api/vagas')
        .set('Authorization', `Bearer ${tokenAmbas}`)
        .send({
          titulo: 'Organização de Escritório',
          descricao: 'Organização de arquivos e mesas de trabalho.',
          categoria: 'Organização',
          valor_diaria: 190.0,
          data_servico: '2026-10-28',
          bairro: 'Vila Mariana'
        });

      const vagaId = novaVaga.body.data.id;

      // Usuária 3 tenta se candidatar à sua própria vaga
      const response = await request(app)
        .post(`/api/vagas/${vagaId}/candidaturas`)
        .set('Authorization', `Bearer ${tokenAmbas}`)
        .send({ mensagem: 'Tentativa de se candidatar na própria vaga' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('anunciante não pode se candidatar');
    });

    it('deve consultar com sucesso o histórico de candidaturas do diarista via GET /api/candidaturas/diarista/:id', async () => {
      // Registra candidatura para o diarista 2
      await request(app)
        .post('/api/vagas/1/candidaturas')
        .set('Authorization', `Bearer ${tokenDiarista}`)
        .send({ mensagem: 'Inscrição para teste de listagem' });

      const response = await request(app)
        .get('/api/candidaturas/diarista/2');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      expect(response.body.data[0]).toHaveProperty('demanda_id', 1);
      expect(response.body.data[0]).toHaveProperty('status');
      expect(response.body.data[0]).toHaveProperty('demanda_titulo');
    });
  });

  describe('3. Consulta de Demandas do Usuário: GET /api/demandas/minhas', () => {
    it('deve retornar 401 Unauthorized para usuário não autenticado', async () => {
      const response = await request(app).get('/api/demandas/minhas');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('deve retornar 200 OK com as demandas vinculadas exclusivamente ao contratante logado', async () => {
      const response = await request(app)
        .get('/api/demandas/minhas')
        .set('Authorization', `Bearer ${tokenContratante}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);

      // Todos os registros retornados devem pertencer ao contratante com id 1
      const todasDoUsuario = response.body.data.every(
        (demanda: any) => demanda.contratante_id === 1
      );
      expect(todasDoUsuario).toBe(true);
    });

    it('deve retornar 200 OK com array vazio para usuário sem demandas cadastradas', async () => {
      const response = await request(app)
        .get('/api/demandas/minhas')
        .set('Authorization', `Bearer ${tokenDiarista}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });
  });

  describe('4. Sessão e Anonimização de Dados: POST /api/auth/logout e DELETE /api/conta', () => {
    it('deve invalidar a sessão com sucesso no logout e remover cookie auth_token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${tokenContratante}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Valida header de remoção de cookie
      const setCookie = response.headers['set-cookie'];
      const cookieValido = Array.isArray(setCookie)
        ? setCookie.some((cookie: string) => cookie.includes('auth_token=;') || cookie.includes('Max-Age=0'))
        : typeof setCookie === 'string'
        ? setCookie.includes('auth_token=;') || setCookie.includes('Max-Age=0')
        : false;
      expect(cookieValido).toBe(true);
    });

    it('deve executar fluxo de exclusão/anonimização de conta respeitando a LGPD', async () => {
      // Usuário 3 (Ambas) não possui pendências ativas iniciais
      const response = await request(app)
        .delete('/api/conta')
        .set('Authorization', `Bearer ${tokenAmbas}`)
        .send({ passwordConfirmation: 'CONFIRMAR_EXCLUSAO' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('anonimizados');

      // Verifica se no banco em memória os dados sensíveis foram anonimizados
      const usuarios = getMockUsers();
      const usuarioExcluido = usuarios.find((u) => u.id === 3);

      expect(usuarioExcluido).toBeDefined();
      expect(usuarioExcluido?.status).toBe('inativo');
      expect(usuarioExcluido?.nome).toBe('Conta Encerrada');
      expect(usuarioExcluido?.telefone).toBe('00000000000');
      expect(usuarioExcluido?.email).toContain('@excluido.local');
    });

    it('deve rejeitar acesso a recursos protegidos após exclusão da conta', async () => {
      // Primeiro exclui a conta do usuário 2
      await request(app)
        .delete('/api/conta')
        .set('Authorization', `Bearer ${tokenDiarista}`)
        .send({ passwordConfirmation: 'EXCLUIR' });

      // Em seguida tenta acessar rota protegida com o mesmo token
      const response = await request(app)
        .get('/api/demandas/minhas')
        .set('Authorization', `Bearer ${tokenDiarista}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('UNAUTHORIZED');
    });
  });

  describe('5. Análise de Candidatos, Visualização de Currículo e Recusa com Exclusão', () => {
    beforeEach(async () => {
      // Cria uma candidatura do diarista 2 para a demanda 1
      await request(app)
        .post('/api/vagas/1/candidaturas')
        .set('Authorization', `Bearer ${tokenDiarista}`)
        .send({ mensagem: 'Tenho experiência em limpezas finas.' });
    });

    it('deve listar candidatos da vaga incluindo dados de currículo do diarista', async () => {
      const response = await request(app)
        .get('/api/demandas/1/candidatos')
        .set('Authorization', `Bearer ${tokenContratante}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);

      const candidato = response.body.data.find((c: any) => c.diarista_id === 2);
      expect(candidato).toBeDefined();
      expect(candidato.diarista_nome).toBe('Lucas Pereira');
      expect(candidato).toHaveProperty('diarista_bio');
      expect(candidato).toHaveProperty('diarista_experiencia');
      expect(Array.isArray(candidato.diarista_servicos)).toBe(true);
    });

    it('deve permitir que o contratante visualize o currículo completo do diarista via GET /api/perfil/curriculo/:id', async () => {
      const response = await request(app)
        .get('/api/perfil/curriculo/2')
        .set('Authorization', `Bearer ${tokenContratante}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('usuario_id', 2);
      expect(response.body.data).toHaveProperty('nome', 'Lucas Pereira');
      expect(response.body.data).toHaveProperty('bio');
      expect(response.body.data).toHaveProperty('experiencia');
      expect(response.body.data).toHaveProperty('servicos');
      expect(response.body.data).toHaveProperty('nota_media');
      expect(response.body.data).toHaveProperty('total_bicos_concluidos');
    });

    it('ao recusar via DELETE /api/candidaturas/:id, deve apagar a candidatura do banco', async () => {
      const candidaturasAntes = getMockCandidaturas();
      const cand = candidaturasAntes.find((c) => c.demanda_id === 1 && c.diarista_id === 2);
      expect(cand).toBeDefined();

      const response = await request(app)
        .delete(`/api/candidaturas/${cand!.id}`)
        .set('Authorization', `Bearer ${tokenContratante}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Valida que a candidatura foi realmente apagada da lista
      const candidaturasDepois = getMockCandidaturas();
      expect(candidaturasDepois.some((c) => c.id === cand!.id)).toBe(false);
    });

    it('ao recusar via PATCH /api/candidaturas/:id/status com status recusada, deve apagar a candidatura', async () => {
      const candidaturasAntes = getMockCandidaturas();
      const cand = candidaturasAntes.find((c) => c.demanda_id === 1 && c.diarista_id === 2);
      expect(cand).toBeDefined();

      const response = await request(app)
        .patch(`/api/candidaturas/${cand!.id}/status`)
        .set('Authorization', `Bearer ${tokenContratante}`)
        .send({ status: 'recusada' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('status', 'recusada');
      expect(response.body.data).toHaveProperty('apagada', true);

      // Valida que a candidatura foi apagada do banco
      const candidaturasDepois = getMockCandidaturas();
      expect(candidaturasDepois.some((c) => c.id === cand!.id)).toBe(false);
    });
  });
});
