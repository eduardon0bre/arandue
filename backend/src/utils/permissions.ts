/**
 * Módulo de Controle de Acesso e Permissões (RBAC)
 * O sistema contempla os seguintes papéis:
 * - 'diarista': Candidata-se a vagas e gerencia currículo. Não pode criar vagas.
 * - 'contratante': Cria vagas. Não pode se candidatar nem gerenciar currículo.
 * - 'ambas' (ou 'ambos'): Perfil híbrido com acesso completo (criar vagas, candidatar-se e currículo).
 */

export type UserRole = 'diarista' | 'contratante' | 'ambas' | 'ambos' | string;

/**
 * Normaliza o papel do usuário para valor canônico minúsculo ('diarista', 'contratante', 'ambas').
 * Retorna null para papéis inválidos, nulos ou indefinidos.
 */
export function normalizeRole(role: unknown): string | null {
  if (typeof role !== 'string') {
    return null;
  }

  const trimmed = role.trim().toLowerCase();
  if (trimmed === 'ambos' || trimmed === 'ambas') {
    return 'ambas';
  }
  if (trimmed === 'diarista' || trimmed === 'contratante') {
    return trimmed;
  }

  return null;
}

/**
 * Verifica se o papel possui permissão para criar vagas/demandas.
 * Apenas 'contratante' e 'ambas' (ou 'ambos') possuem essa permissão.
 */
export function canCreateJob(role: unknown): boolean {
  const normalized = normalizeRole(role);
  return normalized === 'contratante' || normalized === 'ambas';
}

/**
 * Verifica se o papel possui permissão para se candidatar a vagas/demandas.
 * Apenas 'diarista' e 'ambas' (ou 'ambos') possuem essa permissão.
 */
export function canApplyToJob(role: unknown): boolean {
  const normalized = normalizeRole(role);
  return normalized === 'diarista' || normalized === 'ambas';
}

/**
 * Verifica se o papel possui permissão para visualizar e gerenciar currículo profissional.
 * Apenas 'diarista' e 'ambas' (ou 'ambos') possuem essa permissão.
 */
export function canManageResume(role: unknown): boolean {
  const normalized = normalizeRole(role);
  return normalized === 'diarista' || normalized === 'ambas';
}
