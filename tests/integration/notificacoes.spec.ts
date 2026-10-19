import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import {
  mockDbQuery,
  resetMockDb,
  getMockNotificacoes,
  getMockUsers
} from '../helpers/mockDb';
import app from '../../backend/src/app';
import { generateTestToken } from '../helpers/auth';

describe('Integration Tests: Sistema de Notificações Multi-Canal do Aranduê', () => {
  beforeAll(() => {
    (globalThis as any).__mockDbQueryHandler = mockDbQuery;
  });

  afterAll(() => {
    (globalThis as any).__mockDbQueryHandler = null;
  });

  beforeEach(() => {
    resetMockDb();
  });

  afterEach(() => {
    resetMockDb();
  });

  const tokenUsuario = generateTestToken({
    id: 1,
    role: 'contratante',
    nome: 'Carlos Mendes',
    email: 'carlos.mendes@buffetsabor.com.br'
  });

  const tokenOutroUsuario = generateTestToken({
    id: 2,
    role: 'diarista',
    nome: 'Lucas Pereira',
    email: 'lucas.pereira@email.com'
  });

  describe('1. Autenticação e Listagem de Notificações', () => {
    it('deve retornar 401 para requisições não autenticadas em GET /api/notificacoes', async () => {
      const response = await request(app).get('/api/notificacoes');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('UNAUTHORIZED');
    });

    it('deve listar notificações e retornar total_nao_lidas correto para usuário autenticado', async () => {
      const mockNotifs = getMockNotificacoes();
      mockNotifs.push(
        {
          id: 101,
          usuario_id: 1,
          tipo: 'candidatura',
          titulo: 'Nova Candidatura Recebida',
          mensagem: 'Um diarista se candidatou à sua vaga.',
          canais_enviados: 'whatsapp,email',
          lida: false,
          data_criacao: '2026-10-19T10:00:00Z'
        },
        {
          id: 102,
          usuario_id: 1,
          tipo: 'sistema',
          titulo: 'Vaga Publicada com Sucesso',
          mensagem: 'Sua vaga está visível no mural.',
          canais_enviados: 'email',
          lida: true,
          data_criacao: '2026-10-18T15:00:00Z'
        },
        {
          id: 103,
          usuario_id: 1,
          tipo: 'avaliacao',
          titulo: 'Você recebeu uma nova avaliação',
          mensagem: 'Lucas Pereira avaliou o serviço prestado.',
          canais_enviados: 'push,whatsapp',
          lida: false,
          data_criacao: '2026-10-19T11:00:00Z'
        }
      );

      const response = await request(app)
        .get('/api/notificacoes')
        .set('Authorization', `Bearer ${tokenUsuario}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('notificacoes');
      expect(response.body.data).toHaveProperty('total_nao_lidas');

      expect(Array.isArray(response.body.data.notificacoes)).toBe(true);
      expect(response.body.data.notificacoes.length).toBe(3);
      expect(response.body.data.total_nao_lidas).toBe(2);
    });
  });

  describe('2. Disparo de Notificações Multi-Canal e Respeito às Preferências', () => {
    it('deve disparar notificação de teste e retornar os canais acionados conforme preferências ativas', async () => {
      // O usuário 1 possui notif_whatsapp, notif_email e notif_push ativos
      const response = await request(app)
        .post('/api/notificacoes/testar')
        .set('Authorization', `Bearer ${tokenUsuario}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('canais_enviados');
      expect(Array.isArray(response.body.data.canais_enviados)).toBe(true);

      const canais = response.body.data.canais_enviados;
      expect(canais).toContain('whatsapp');
      expect(canais).toContain('email');
      expect(canais).toContain('push');

      // Verifica se a notificação foi persistida no histórico
      const mockNotifs = getMockNotificacoes();
      expect(mockNotifs.length).toBeGreaterThan(0);
      const salva = mockNotifs[mockNotifs.length - 1];
      expect(salva.usuario_id).toBe(1);
      expect(salva.tipo).toBe('teste');
    });

    it('deve respeitar desativação de canal: se notif_whatsapp for false, não deve incluir WhatsApp nos canais enviados', async () => {
      // Desativa WhatsApp nas preferências do usuário 1
      const user = getMockUsers().find((u) => u.id === 1);
      if (user) {
        user.notif_whatsapp = false;
        user.notif_email = true;
        user.notif_push = true;
      }

      const response = await request(app)
        .post('/api/notificacoes/testar')
        .set('Authorization', `Bearer ${tokenUsuario}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const canais = response.body.data.canais_enviados;
      expect(canais).not.toContain('whatsapp');
      expect(canais).toContain('email');
      expect(canais).toContain('push');
    });

    it('deve respeitar desativação de todos os canais quando o usuário assim desejar', async () => {
      const user = getMockUsers().find((u) => u.id === 1);
      if (user) {
        user.notif_whatsapp = false;
        user.notif_email = false;
        user.notif_push = false;
      }

      const response = await request(app)
        .post('/api/notificacoes/testar')
        .set('Authorization', `Bearer ${tokenUsuario}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.canais_enviados).toEqual([]);
    });
  });

  describe('3. Marcação de Notificações como Lidas', () => {
    it('deve marcar uma notificação específica como lida via PATCH /api/notificacoes/:id/lida', async () => {
      const mockNotifs = getMockNotificacoes();
      mockNotifs.push({
        id: 105,
        usuario_id: 1,
        tipo: 'sistema',
        titulo: 'Aviso Importante',
        mensagem: 'Atualização de termos de uso.',
        canais_enviados: 'email',
        lida: false,
        data_criacao: '2026-10-19T12:00:00Z'
      });

      const response = await request(app)
        .patch('/api/notificacoes/105/lida')
        .set('Authorization', `Bearer ${tokenUsuario}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('marcada como lida');

      const notifAtualizada = mockNotifs.find((n) => n.id === 105);
      expect(notifAtualizada?.lida).toBe(true);
    });

    it('deve rejeitar marcação com identificador inválido com status 400', async () => {
      const response = await request(app)
        .patch('/api/notificacoes/invalido/lida')
        .set('Authorization', `Bearer ${tokenUsuario}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('inválido');
    });

    it('deve marcar todas as notificações do usuário como lidas via PATCH /api/notificacoes/ler-todas', async () => {
      const mockNotifs = getMockNotificacoes();
      mockNotifs.push(
        {
          id: 106,
          usuario_id: 1,
          tipo: 'candidatura',
          titulo: 'Alerta 1',
          mensagem: 'Mensagem 1',
          canais_enviados: '',
          lida: false,
          data_criacao: '2026-10-19T13:00:00Z'
        },
        {
          id: 107,
          usuario_id: 1,
          tipo: 'candidatura',
          titulo: 'Alerta 2',
          mensagem: 'Mensagem 2',
          canais_enviados: '',
          lida: false,
          data_criacao: '2026-10-19T13:05:00Z'
        },
        {
          id: 108,
          usuario_id: 2, // Outro usuário
          tipo: 'sistema',
          titulo: 'Alerta de outro usuário',
          mensagem: 'Mensagem privada',
          canais_enviados: '',
          lida: false,
          data_criacao: '2026-10-19T13:10:00Z'
        }
      );

      const response = await request(app)
        .patch('/api/notificacoes/ler-todas')
        .set('Authorization', `Bearer ${tokenUsuario}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Todas as notificações foram marcadas como lidas');

      // Verifica que as notificações do usuário 1 foram lidas
      expect(mockNotifs.find((n) => n.id === 106)?.lida).toBe(true);
      expect(mockNotifs.find((n) => n.id === 107)?.lida).toBe(true);

      // Garante isolamento: notificação do usuário 2 permanece não lida
      expect(mockNotifs.find((n) => n.id === 108)?.lida).toBe(false);

      // Verificação via GET subsequente
      const getResponse = await request(app)
        .get('/api/notificacoes')
        .set('Authorization', `Bearer ${tokenUsuario}`);

      expect(getResponse.body.data.total_nao_lidas).toBe(0);
    });
  });

  describe('4. Registro de Push Token', () => {
    it('deve salvar push_token do usuário com sucesso via POST /api/notificacoes/push-token', async () => {
      const payload = {
        push_token: 'ExponentPushToken[AbCdEf1234567890XyZ]'
      };

      const response = await request(app)
        .post('/api/notificacoes/push-token')
        .set('Authorization', `Bearer ${tokenUsuario}`)
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.push_token).toBe(payload.push_token);

      const user = getMockUsers().find((u) => u.id === 1);
      expect(user?.push_token).toBe(payload.push_token);
    });

    it('deve rejeitar requisição sem push_token com status 400', async () => {
      const response = await request(app)
        .post('/api/notificacoes/push-token')
        .set('Authorization', `Bearer ${tokenUsuario}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('push_token é obrigatório');
    });
  });
});
