import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import {
  mockDbQuery,
  resetMockDb,
  getMockDisponibilidades
} from '../helpers/mockDb';
import app from '../../backend/src/app';
import { generateTestToken } from '../helpers/auth';

describe('Integration Tests: Agenda e Calendário de Disponibilidade dos Diaristas', () => {
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

  describe('1. Gestão de Agenda pelo Diarista', () => {
    it('deve permitir que o diarista visualize seus horários cadastrados', async () => {
      const response = await request(app)
        .get('/api/disponibilidades/minhas')
        .set('Authorization', `Bearer ${tokenDiarista}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].data).toBe('2026-10-20');
    });

    it('deve permitir que o diarista cadastre um novo horário de disponibilidade', async () => {
      const payload = {
        data: '2026-10-25',
        hora_inicio: '08:00',
        hora_fim: '12:00',
        observacao: 'Turno da manhã disponível'
      };

      const response = await request(app)
        .post('/api/disponibilidades')
        .set('Authorization', `Bearer ${tokenDiarista}`)
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toBe('2026-10-25');
      expect(response.body.data.hora_inicio).toBe('08:00:00');
      expect(response.body.data.hora_fim).toBe('12:00:00');

      const mockSlots = getMockDisponibilidades();
      expect(mockSlots.some((s) => s.data === '2026-10-25')).toBe(true);
    });

    it('deve permitir que o diarista cadastre múltiplos dias de disponibilidade em lote', async () => {
      const payload = {
        datas: ['2026-10-26', '2026-10-27'],
        hora_inicio: '08:00',
        hora_fim: '17:00',
        observacao: 'Disponível dia todo'
      };

      const response = await request(app)
        .post('/api/disponibilidades')
        .set('Authorization', `Bearer ${tokenDiarista}`)
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);

      const mockSlots = getMockDisponibilidades();
      expect(mockSlots.some((s) => s.data === '2026-10-26')).toBe(true);
      expect(mockSlots.some((s) => s.data === '2026-10-27')).toBe(true);
    });

    it('deve rejeitar cadastro com hora de término menor ou igual à hora de início', async () => {
      const payload = {
        data: '2026-10-25',
        hora_inicio: '15:00',
        hora_fim: '10:00',
        observacao: 'Horário invertido'
      };

      const response = await request(app)
        .post('/api/disponibilidades')
        .set('Authorization', `Bearer ${tokenDiarista}`)
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('hora de início deve ser anterior');
    });

    it('deve rejeitar cadastro sem campos obrigatórios', async () => {
      const response = await request(app)
        .post('/api/disponibilidades')
        .set('Authorization', `Bearer ${tokenDiarista}`)
        .send({ data: '2026-10-25' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('obrigatórios');
    });

    it('deve bloquear contratante exclusivo de cadastrar disponibilidade (RBAC)', async () => {
      const payload = {
        data: '2026-10-25',
        hora_inicio: '08:00',
        hora_fim: '12:00'
      };

      const response = await request(app)
        .post('/api/disponibilidades')
        .set('Authorization', `Bearer ${tokenContratante}`)
        .send(payload);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('FORBIDDEN');
    });

    it('deve permitir que o diarista exclua um horário de sua agenda', async () => {
      const response = await request(app)
        .delete('/api/disponibilidades/1')
        .set('Authorization', `Bearer ${tokenDiarista}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('removido com sucesso');

      const mockSlots = getMockDisponibilidades();
      expect(mockSlots.find((s) => s.id === 1)).toBeUndefined();
    });
  });

  describe('2. Busca por Diaristas e Consulta de Agenda pelo Contratante', () => {
    it('deve permitir consultar a agenda de um diarista específico', async () => {
      const response = await request(app)
        .get('/api/disponibilidades/diarista/2');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('deve permitir listar diaristas com suas próximas disponibilidades', async () => {
      const response = await request(app)
        .get('/api/diaristas');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      const primeiro = response.body.data[0];
      expect(primeiro).toHaveProperty('nome');
      expect(primeiro).toHaveProperty('proximas_disponibilidades');
    });
  });
});
