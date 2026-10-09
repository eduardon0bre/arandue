import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import {
  mockDbQuery,
  resetMockDb,
  getMockDemandas,
  getMockAvaliacoes
} from '../helpers/mockDb';
import app from '../../backend/src/app';
import { generateTestToken } from '../helpers/auth';

describe('Integration Tests: Fluxo de Conclusão de Serviço, Pagamento por Fora e Avaliação Mútua', () => {
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

  beforeEach(() => {
    resetMockDb();
  });

  afterEach(() => {
    resetMockDb();
  });

  describe('1. Conclusão de Demanda: PATCH /api/demandas/:id/concluir', () => {
    it('deve retornar 401 Unauthorized se não estiver autenticado', async () => {
      const response = await request(app).patch('/api/demandas/1/concluir');
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('deve permitir que o contratante conclua a demanda com sucesso', async () => {
      const response = await request(app)
        .patch('/api/demandas/1/concluir')
        .set('Authorization', `Bearer ${tokenContratante}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('concluído com sucesso');

      const demandas = getMockDemandas();
      const d1 = demandas.find((d) => d.id === 1);
      expect(d1?.status).toBe('concluida');
    });

    it('deve retornar 404 para demanda inexistente', async () => {
      const response = await request(app)
        .patch('/api/demandas/9999/concluir')
        .set('Authorization', `Bearer ${tokenContratante}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('2. Registro de Avaliação e Feedback: POST /api/avaliacoes', () => {
    it('deve validar campos obrigatórios (demanda_id, avaliado_id, nota)', async () => {
      const response = await request(app)
        .post('/api/avaliacoes')
        .set('Authorization', `Bearer ${tokenContratante}`)
        .send({ nota: 5 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('obrigatórios');
    });

    it('deve validar intervalo da nota (1 a 5)', async () => {
      const response = await request(app)
        .post('/api/avaliacoes')
        .set('Authorization', `Bearer ${tokenContratante}`)
        .send({
          demanda_id: 1,
          avaliado_id: 2,
          nota: 6
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('entre 1 e 5');
    });

    it('deve permitir que o contratante avalie o diarista com feedback sobre o pagamento por fora e serviço', async () => {
      const response = await request(app)
        .post('/api/avaliacoes')
        .set('Authorization', `Bearer ${tokenContratante}`)
        .send({
          demanda_id: 1,
          avaliado_id: 2,
          nota: 5,
          comentario: 'Excelente profissional, pontual e cumpriu todas as orientações.'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.nota).toBe(5);
      expect(response.body.data.comentario).toContain('Excelente profissional');

      const avaliacoes = getMockAvaliacoes();
      expect(avaliacoes.length).toBe(1);
      expect(avaliacoes[0].demanda_id).toBe(1);
    });

    it('deve impedir que o mesmo usuário envie avaliações duplicadas para a mesma demanda', async () => {
      // Primeira avaliação
      await request(app)
        .post('/api/avaliacoes')
        .set('Authorization', `Bearer ${tokenContratante}`)
        .send({
          demanda_id: 1,
          avaliado_id: 2,
          nota: 5,
          comentario: 'Primeira avaliação'
        });

      // Segunda tentativa de avaliação para a mesma demanda
      const response = await request(app)
        .post('/api/avaliacoes')
        .set('Authorization', `Bearer ${tokenContratante}`)
        .send({
          demanda_id: 1,
          avaliado_id: 2,
          nota: 4,
          comentario: 'Tentativa duplicada'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Você já enviou uma avaliação');
    });

    it('deve permitir que o diarista também avalie o contratante (avaliação mútua)', async () => {
      // Contratante avalia Diarista
      await request(app)
        .post('/api/avaliacoes')
        .set('Authorization', `Bearer ${tokenContratante}`)
        .send({
          demanda_id: 1,
          avaliado_id: 2,
          nota: 5,
          comentario: 'Muito bom trabalho'
        });

      // Diarista avalia Contratante
      const responseDiarista = await request(app)
        .post('/api/avaliacoes')
        .set('Authorization', `Bearer ${tokenDiarista}`)
        .send({
          demanda_id: 1,
          avaliado_id: 1,
          nota: 5,
          comentario: 'Ótimo ambiente e o pagamento combinado por fora foi realizado na hora.'
        });

      expect(responseDiarista.status).toBe(201);
      expect(responseDiarista.body.success).toBe(true);
      expect(responseDiarista.body.data.comentario).toContain('pagamento combinado por fora');

      const avaliacoes = getMockAvaliacoes();
      expect(avaliacoes.length).toBe(2);
    });
  });

  describe('3. Consulta de Avaliações e Cálculo de Média das Pessoas', () => {
    it('deve retornar lista de avaliações enviadas pelo usuário', async () => {
      await request(app)
        .post('/api/avaliacoes')
        .set('Authorization', `Bearer ${tokenContratante}`)
        .send({
          demanda_id: 1,
          avaliado_id: 2,
          nota: 5,
          comentario: 'Serviço nota 10'
        });

      const response = await request(app).get('/api/avaliacoes/enviadas/1');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].nota).toBe(5);
    });

    it('deve calcular a média das avaliações do usuário em GET /api/avaliacoes/usuario/:id/media', async () => {
      // Registra duas avaliações para o diarista (ID 2): uma 5 e uma 4
      await request(app)
        .post('/api/avaliacoes')
        .set('Authorization', `Bearer ${tokenContratante}`)
        .send({
          demanda_id: 1,
          avaliado_id: 2,
          nota: 5,
          comentario: 'Excelente profissional'
        });

      const response = await request(app).get('/api/avaliacoes/usuario/2/media');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.total_avaliacoes).toBe(1);
      expect(response.body.data.nota_media).toBe(5.0);
      expect(response.body.data.distribuicao[5]).toBe(1);
    });

    it('deve incluir o resumo da média em GET /api/avaliacoes/usuario/:id', async () => {
      await request(app)
        .post('/api/avaliacoes')
        .set('Authorization', `Bearer ${tokenContratante}`)
        .send({
          demanda_id: 1,
          avaliado_id: 2,
          nota: 4,
          comentario: 'Bom atendimento'
        });

      const response = await request(app).get('/api/avaliacoes/usuario/2');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.resumo).toBeDefined();
      expect(response.body.resumo.total_avaliacoes).toBe(1);
      expect(response.body.resumo.nota_media).toBe(4.0);
    });

    it('não deve expor o nome real do avaliador no quadro de feedbacks, mantendo o anonimato mútuo', async () => {
      // Carlos Mendes (Contratante ID 1) avalia Lucas Pereira (Diarista ID 2)
      await request(app)
        .post('/api/avaliacoes')
        .set('Authorization', `Bearer ${tokenContratante}`)
        .send({
          demanda_id: 1,
          avaliado_id: 2,
          nota: 5,
          comentario: 'Excelente profissional'
        });

      const response = await request(app).get('/api/avaliacoes/usuario/2');
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      // O nome retornado no feedback não deve ser o nome pessoal "Carlos Mendes"
      expect(response.body.data[0].avaliador_nome).not.toBe('Carlos Mendes');
      expect(response.body.data[0].avaliador_nome).toContain('Contratante verificado');
    });
  });
});
