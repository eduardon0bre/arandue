import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// Mocks do banco de dados
import { resetMockDb, mockDbQuery, getMockNotificacoes, getMockUsers } from '../helpers/mockDb';

// @ts-ignore
const db = require('../../backend/src/config/db');
// @ts-ignore
const app = require('../../backend/src/app');
// @ts-ignore
const whatsappProvider = require('../../backend/src/services/providers/whatsappProvider');
// @ts-ignore
const emailProvider = require('../../backend/src/services/providers/emailProvider');
// @ts-ignore
const pushProvider = require('../../backend/src/services/providers/pushProvider');
// @ts-ignore
const notificacaoModel = require('../../backend/src/models/notificacaoModel');
// @ts-ignore
const notificationService = require('../../backend/src/services/notificationService');

const JWT_SECRET = process.env.JWT_SECRET || 'arandue-super-secret-jwt-key-2026';

function generateAuthToken(usuarioId: number, tipo = 'contratante', nome = 'Carlos Mendes') {
  return jwt.sign({ id: usuarioId, tipo, nome, email: `${nome.toLowerCase().replace(' ', '.')}@email.com` }, JWT_SECRET);
}

describe('Sistema de Notificações Multi-Canal (Backend)', () => {
  beforeEach(() => {
    resetMockDb();
    db.setQueryHandler(mockDbQuery);
  });

  describe('Provedores Plugáveis (Mock/Fallback Seguro)', () => {
    it('whatsappProvider deve simular envio com segurança sem credenciais', async () => {
      const res = await whatsappProvider.sendWhatsApp({
        to: '11988887777',
        message: 'Teste de mensagem WhatsApp'
      });

      expect(res.success).toBe(true);
      expect(res.simulated).toBe(true);
      expect(res.to).toBe('5511988887777');
    });

    it('emailProvider deve simular envio e gerar template HTML Aranduê', async () => {
      const res = await emailProvider.sendEmail({
        to: 'carlos@buffetsabor.com.br',
        subject: 'Nova Candidatura',
        message: 'Você recebeu um novo candidato.',
        destinatarioNome: 'Carlos'
      });

      expect(res.success).toBe(true);
      expect(res.simulated).toBe(true);
      expect(res.to).toBe('carlos@buffetsabor.com.br');
    });

    it('pushProvider deve simular envio quando token for nulo ou modo mock', async () => {
      const res = await pushProvider.sendPushNotification({
        pushToken: '',
        title: 'Vaga preenchida',
        body: 'O serviço foi confirmado.'
      });

      expect(res.success).toBe(true);
      expect(res.simulated).toBe(true);
      expect(res.provider).toBe('expo-mock');
    });
  });

  describe('Model de Notificações (notificacaoModel)', () => {
    it('deve criar uma nova notificação e persistir no mockDb', async () => {
      const notif = await notificacaoModel.create({
        usuario_id: 1,
        tipo: 'candidatura_recebida',
        titulo: 'Nova Candidatura',
        mensagem: 'Lucas se candidatou à sua vaga.',
        canais_enviados: 'whatsapp,email,push',
        push_token: 'ExponentPushToken[xxxx]'
      });

      expect(notif).toBeDefined();
      expect(notif.usuario_id).toBe(1);
      expect(notif.tipo).toBe('candidatura_recebida');
      expect(notif.canais_enviados).toBe('whatsapp,email,push');
      expect(notif.lida).toBe(false);

      const todas = getMockNotificacoes();
      expect(todas.length).toBe(1);
    });

    it('deve listar notificações e contar não lidas corretamente', async () => {
      await notificacaoModel.create({
        usuario_id: 1,
        tipo: 'teste',
        titulo: 'Aviso 1',
        mensagem: 'Mensagem 1'
      });
      await notificacaoModel.create({
        usuario_id: 1,
        tipo: 'teste',
        titulo: 'Aviso 2',
        mensagem: 'Mensagem 2'
      });

      const lista = await notificacaoModel.findByUsuarioId(1);
      expect(lista.length).toBe(2);

      const naoLidas = await notificacaoModel.countNaoLidas(1);
      expect(naoLidas).toBe(2);
    });

    it('deve marcar uma notificação como lida', async () => {
      const notif = await notificacaoModel.create({
        usuario_id: 1,
        tipo: 'teste',
        titulo: 'Aviso',
        mensagem: 'Mensagem'
      });

      const res = await notificacaoModel.marcarComoLida(notif.id, 1);
      expect(res.success).toBe(true);

      const naoLidas = await notificacaoModel.countNaoLidas(1);
      expect(naoLidas).toBe(0);
    });

    it('deve marcar todas as notificações do usuário como lidas', async () => {
      await notificacaoModel.create({ usuario_id: 2, tipo: 'teste', titulo: '1', mensagem: 'm1' });
      await notificacaoModel.create({ usuario_id: 2, tipo: 'teste', titulo: '2', mensagem: 'm2' });

      expect(await notificacaoModel.countNaoLidas(2)).toBe(2);

      await notificacaoModel.marcarTodasComoLidas(2);
      expect(await notificacaoModel.countNaoLidas(2)).toBe(0);
    });

    it('deve atualizar o push_token do usuário', async () => {
      const res = await notificacaoModel.salvarPushToken(2, 'ExponentPushToken[abc123456]');
      expect(res.success).toBe(true);

      const user = getMockUsers().find((u) => u.id === 2);
      expect(user?.push_token).toBe('ExponentPushToken[abc123456]');
    });
  });

  describe('Serviço de Notificações (notificationService)', () => {
    it('deve disparar apenas os canais autorizados pelo usuário', async () => {
      // Usuário 1 tem notif_whatsapp: true, notif_email: true, notif_push: true
      const resultado = await notificationService.dispararNotificacao({
        usuario_id: 1,
        tipo: 'teste',
        titulo: 'Alerta Importante',
        mensagem: 'Você tem um novo compromisso.'
      });

      expect(resultado.success).toBe(true);
      expect(resultado.canais_enviados).toContain('whatsapp');
      expect(resultado.canais_enviados).toContain('email');
      expect(resultado.canais_enviados).toContain('push');

      // Verifica se a notificação foi gravada
      const salvos = getMockNotificacoes();
      expect(salvos.length).toBe(1);
      expect(salvos[0].canais_enviados).toContain('whatsapp');
    });

    it('não deve disparar canais desativados pelo usuário', async () => {
      const user = getMockUsers().find((u) => u.id === 1);
      if (user) {
        user.notif_whatsapp = false;
        user.notif_email = false;
      }

      const resultado = await notificationService.dispararNotificacao({
        usuario_id: 1,
        tipo: 'teste',
        titulo: 'Apenas Push',
        mensagem: 'Testando filtro de preferências'
      });

      expect(resultado.success).toBe(true);
      expect(resultado.canais_enviados).not.toContain('whatsapp');
      expect(resultado.canais_enviados).not.toContain('email');
      expect(resultado.canais_enviados).toContain('push');
    });
  });

  describe('Rotas de Notificação (/api/notificacoes)', () => {
    it('deve rejeitar requisição sem autenticação com 401', async () => {
      const res = await request(app).get('/api/notificacoes');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/notificacoes deve retornar lista e contador de não lidas', async () => {
      await notificacaoModel.create({
        usuario_id: 1,
        tipo: 'sistema',
        titulo: 'Bem-vindo ao Aranduê',
        mensagem: 'Sua conta foi criada.'
      });

      const token = generateAuthToken(1);
      const res = await request(app)
        .get('/api/notificacoes')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.notificacoes.length).toBe(1);
      expect(res.body.data.total_nao_lidas).toBe(1);
    });

    it('POST /api/notificacoes/testar deve acionar disparo de teste', async () => {
      const token = generateAuthToken(1);
      const res = await request(app)
        .post('/api/notificacoes/testar')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.canais_enviados).toBeDefined();
    });

    it('PATCH /api/notificacoes/ler-todas deve marcar todas como lidas', async () => {
      await notificacaoModel.create({ usuario_id: 1, tipo: 'teste', titulo: 'T1', mensagem: 'M1' });
      const token = generateAuthToken(1);

      const res = await request(app)
        .patch('/api/notificacoes/ler-todas')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const naoLidas = await notificacaoModel.countNaoLidas(1);
      expect(naoLidas).toBe(0);
    });

    it('POST /api/notificacoes/push-token deve salvar push_token do usuário', async () => {
      const token = generateAuthToken(2, 'diarista', 'Lucas Pereira');

      const res = await request(app)
        .post('/api/notificacoes/push-token')
        .set('Authorization', `Bearer ${token}`)
        .send({ push_token: 'ExponentPushToken[teste12345]' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const u2 = getMockUsers().find((u) => u.id === 2);
      expect(u2?.push_token).toBe('ExponentPushToken[teste12345]');
    });
  });
});
