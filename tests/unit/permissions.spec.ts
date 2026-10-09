import { describe, it, expect } from 'vitest';
import {
  canCreateJob,
  canApplyToJob,
  canManageResume,
  normalizeRole
} from '../../backend/src/utils/permissions';

describe('Unit Tests: Controle de Acesso e Permissões (RBAC)', () => {
  describe('canCreateJob(role)', () => {
    it('deve permitir perfil contratante criar vagas', () => {
      expect(canCreateJob('contratante')).toBe(true);
      expect(canCreateJob('CONTRATANTE')).toBe(true);
      expect(canCreateJob('  contratante  ')).toBe(true);
    });

    it('deve permitir perfil híbrido ambas (ou ambos) criar vagas', () => {
      expect(canCreateJob('ambas')).toBe(true);
      expect(canCreateJob('ambos')).toBe(true);
      expect(canCreateJob('AMBAS')).toBe(true);
    });

    it('deve proibir perfil diarista de criar vagas', () => {
      expect(canCreateJob('diarista')).toBe(false);
      expect(canCreateJob('DIARISTA')).toBe(false);
    });

    it('deve retornar false para papéis inválidos, nulos ou indefinidos', () => {
      expect(canCreateJob(undefined)).toBe(false);
      expect(canCreateJob(null)).toBe(false);
      expect(canCreateJob('')).toBe(false);
      expect(canCreateJob('admin')).toBe(false);
      expect(canCreateJob('visitante')).toBe(false);
      expect(canCreateJob(123)).toBe(false);
      expect(canCreateJob({})).toBe(false);
    });
  });

  describe('canApplyToJob(role)', () => {
    it('deve permitir perfil diarista se candidatar a vagas', () => {
      expect(canApplyToJob('diarista')).toBe(true);
      expect(canApplyToJob('DIARISTA')).toBe(true);
      expect(canApplyToJob('  diarista  ')).toBe(true);
    });

    it('deve permitir perfil híbrido ambas (ou ambos) se candidatar a vagas', () => {
      expect(canApplyToJob('ambas')).toBe(true);
      expect(canApplyToJob('ambos')).toBe(true);
      expect(canApplyToJob('AMBAS')).toBe(true);
    });

    it('deve proibir perfil contratante de se candidatar a vagas', () => {
      expect(canApplyToJob('contratante')).toBe(false);
      expect(canApplyToJob('CONTRATANTE')).toBe(false);
    });

    it('deve retornar false para papéis inválidos, nulos ou indefinidos', () => {
      expect(canApplyToJob(undefined)).toBe(false);
      expect(canApplyToJob(null)).toBe(false);
      expect(canApplyToJob('')).toBe(false);
      expect(canApplyToJob('supervisor')).toBe(false);
      expect(canApplyToJob('guest')).toBe(false);
      expect(canApplyToJob(456)).toBe(false);
      expect(canApplyToJob([])).toBe(false);
    });
  });

  describe('canManageResume(role)', () => {
    it('deve permitir perfil diarista gerenciar currículo', () => {
      expect(canManageResume('diarista')).toBe(true);
      expect(canManageResume('DIARISTA')).toBe(true);
    });

    it('deve permitir perfil híbrido ambas (ou ambos) gerenciar currículo', () => {
      expect(canManageResume('ambas')).toBe(true);
      expect(canManageResume('ambos')).toBe(true);
    });

    it('deve proibir perfil contratante de gerenciar currículo', () => {
      expect(canManageResume('contratante')).toBe(false);
      expect(canManageResume('CONTRATANTE')).toBe(false);
    });

    it('deve retornar false para papéis inválidos, nulos ou indefinidos', () => {
      expect(canManageResume(undefined)).toBe(false);
      expect(canManageResume(null)).toBe(false);
      expect(canManageResume('')).toBe(false);
      expect(canManageResume('outro')).toBe(false);
      expect(canManageResume(true)).toBe(false);
    });
  });

  describe('normalizeRole(role)', () => {
    it('deve normalizar papéis válidos com variações de caixa e espaços', () => {
      expect(normalizeRole('  DIARISTA  ')).toBe('diarista');
      expect(normalizeRole('Contratante')).toBe('contratante');
      expect(normalizeRole('AMBAS')).toBe('ambas');
      expect(normalizeRole('Ambos')).toBe('ambas');
    });

    it('deve retornar null para qualquer entrada inválida', () => {
      expect(normalizeRole(undefined)).toBeNull();
      expect(normalizeRole(null)).toBeNull();
      expect(normalizeRole('')).toBeNull();
      expect(normalizeRole('invalido')).toBeNull();
      expect(normalizeRole(12345)).toBeNull();
    });
  });
});
