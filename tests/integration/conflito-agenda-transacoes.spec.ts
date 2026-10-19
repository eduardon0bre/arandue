import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import {
  mockDbQuery,
  resetMockDb,
  getMockDemandas,
  getMockCandidaturas
} from '../helpers/mockDb';
import app from '../../backend/src/app';
import { generateTestToken } from '../helpers/auth';

describe('Integration Tests: Trava de Conflito de Agenda e Transações Atômicas (ACID)', () => {
  beforeAll(() => {
    (globalThis as any).__mockDbQueryHandler = mockDbQuery;
  });

  afterAll(() => {
    (globalThis as any).__mockDbQueryHandler = null;
  });

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

  const tokenDiarista2 = generateTestToken({
    id: 4,
    role: 'diarista',
    nome: 'Beatriz Lima',
    email: 'beatriz.lima@email.com'
  });

  beforeEach(() => {
    resetMockDb();
  });

  afterEach(() => {
    resetMockDb();
  });

  describe('1. Trava de Conflito de Agenda na Inscrição do Trabalhador', () => {
    it('deve bloquear candidatura de diarista que já possui diária aceita na mesma data', async () => {
      // 1. Cria duas demandas na mesma data ('2026-10-20')
      const demandas = getMockDemandas();
      demandas.push(
        {
          id: 10,
          contratante_id: 1,
          titulo: 'Garçom para Coquetel',
          descricao: 'Atendimento a convidados',
          categoria: 'Eventos',
          valor_diaria: 180.0,
          data_servico: '2026-10-20',
          bairro: 'Pinheiros',
          status: 'preenchida',
          data_criacao: new Date().toISOString()
        },
        {
          id: 11,
          contratante_id: 1,
          titulo: 'Auxiliar de Limpeza',
          descricao: 'Limpeza de salão',
          categoria: 'Limpeza',
          valor_diaria: 150.0,
          data_servico: '2026-10-20',
          bairro: 'Pinheiros',
          status: 'aberta',
          data_criacao: new Date().toISOString()
        }
      );

      // Diarista (id: 2) já possui candidatura aceita na demanda 10
      const candidaturas = getMockCandidaturas();
      candidaturas.push({
        id: 50,
        demanda_id: 10,
        diarista_id: 2,
        status: 'aceita',
        mensagem: 'Confirmado',
        data_criacao: new Date().toISOString()
      });

      // Tenta se candidatar na demanda 11 (mesma data '2026-10-20')
      const response = await request(app)
        .post('/api/vagas/11/candidaturas')
        .set('Authorization', `Bearer ${tokenDiarista}`)
        .send({ mensagem: 'Gostaria de participar desta vaga.' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('CONFLICT_SCHEDULE');
      expect(response.body.message).toContain('Conflito de agenda');
    });

    it('deve permitir candidatura se a data do serviço for diferente', async () => {
      const demandas = getMockDemandas();
      demandas.push(
        {
          id: 20,
          contratante_id: 1,
          titulo: 'Garçom no Sábado',
          descricao: 'Atendimento',
          categoria: 'Eventos',
          valor_diaria: 180.0,
          data_servico: '2026-10-20',
          bairro: 'Pinheiros',
          status: 'preenchida',
          data_criacao: new Date().toISOString()
        },
        {
          id: 21,
          contratante_id: 1,
          titulo: 'Garçom no Domingo',
          descricao: 'Atendimento',
          categoria: 'Eventos',
          valor_diaria: 190.0,
          data_servico: '2026-10-21',
          bairro: 'Pinheiros',
          status: 'aberta',
          data_criacao: new Date().toISOString()
        }
      );

      // Diarista aceito no dia 20
      const candidaturas = getMockCandidaturas();
      candidaturas.push({
        id: 60,
        demanda_id: 20,
        diarista_id: 2,
        status: 'aceita',
        mensagem: 'Confirmado',
        data_criacao: new Date().toISOString()
      });

      // Candidatura no dia 21 deve ser aceita normalmente
      const response = await request(app)
        .post('/api/vagas/21/candidaturas')
        .set('Authorization', `Bearer ${tokenDiarista}`)
        .send({ mensagem: 'Tenho disponibilidade total no domingo.' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(Number(response.body.data.demanda_id)).toBe(21);
    });
  });

  describe('2. Transações Atômicas (ACID) na Aprovação de Candidatura', () => {
    it('ao aprovar candidatura, deve mudar demanda para preenchida e descartar concorrentes pendentes', async () => {
      const demandas = getMockDemandas();
      demandas.push({
        id: 30,
        contratante_id: 1,
        titulo: 'Ajudante de Carga',
        descricao: 'Descarregar mercadorias',
        categoria: 'Logística',
        valor_diaria: 170.0,
        data_servico: '2026-10-28',
        bairro: 'Lapa',
        status: 'aberta',
        data_criacao: new Date().toISOString()
      });

      const candidaturas = getMockCandidaturas();
      candidaturas.push(
        {
          id: 71,
          demanda_id: 30,
          diarista_id: 2,
          status: 'pendente',
          mensagem: 'Candidato 1',
          data_criacao: new Date().toISOString()
        },
        {
          id: 72,
          demanda_id: 30,
          diarista_id: 4,
          status: 'pendente',
          mensagem: 'Candidato 2',
          data_criacao: new Date().toISOString()
        }
      );

      // Contratante aprova o candidato 71 (Diarista 2)
      const response = await request(app)
        .patch('/api/candidaturas/71/status')
        .set('Authorization', `Bearer ${tokenContratante}`)
        .send({ status: 'aceita' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('aceita');

      // Verifica atomicidade:
      // 1. Demanda 30 vira 'preenchida'
      const demandaAtualizada = demandas.find((d) => d.id === 30);
      expect(demandaAtualizada?.status).toBe('preenchida');

      // 2. Candidatura concorrente 72 é removida
      const concorrente = candidaturas.find((c) => c.id === 72);
      expect(concorrente).toBeUndefined();
    });

    it('deve abortar aprovação se o diarista já tiver sido aprovado para outra vaga na mesma data', async () => {
      const demandas = getMockDemandas();
      demandas.push(
        {
          id: 40,
          contratante_id: 1,
          titulo: 'Evento A',
          descricao: 'Coquetel',
          categoria: 'Eventos',
          valor_diaria: 200.0,
          data_servico: '2026-10-29',
          bairro: 'Centro',
          status: 'preenchida',
          data_criacao: new Date().toISOString()
        },
        {
          id: 41,
          contratante_id: 1,
          titulo: 'Evento B',
          descricao: 'Recepção',
          categoria: 'Eventos',
          valor_diaria: 180.0,
          data_servico: '2026-10-29',
          bairro: 'Centro',
          status: 'aberta',
          data_criacao: new Date().toISOString()
        }
      );

      const candidaturas = getMockCandidaturas();
      // Candidatura já aceita na demanda 40
      candidaturas.push(
        {
          id: 81,
          demanda_id: 40,
          diarista_id: 2,
          status: 'aceita',
          mensagem: 'Primeira vaga',
          data_criacao: new Date().toISOString()
        },
        {
          id: 82,
          demanda_id: 41,
          diarista_id: 2,
          status: 'pendente',
          mensagem: 'Segunda vaga para a mesma data',
          data_criacao: new Date().toISOString()
        }
      );

      // Tenta aprovar o candidato na segunda vaga para a mesma data
      const response = await request(app)
        .patch('/api/candidaturas/82/status')
        .set('Authorization', `Bearer ${tokenContratante}`)
        .send({ status: 'aceita' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('CONFLICT_SCHEDULE');
      expect(response.body.message).toContain('Conflito de agenda');

      // Vaga 41 deve permanecer 'aberta' devido ao rollback da transação
      const d41 = demandas.find((d) => d.id === 41);
      expect(d41?.status).toBe('aberta');
    });
  });
});
