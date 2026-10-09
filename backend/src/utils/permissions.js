/**
 * Módulo de Controle de Acesso e Permissões (RBAC)
 */

function normalizeRole(role) {
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

function canCreateJob(role) {
  const normalized = normalizeRole(role);
  return normalized === 'contratante' || normalized === 'ambas';
}

function canApplyToJob(role) {
  const normalized = normalizeRole(role);
  return normalized === 'diarista' || normalized === 'ambas';
}

function canManageResume(role) {
  const normalized = normalizeRole(role);
  return normalized === 'diarista' || normalized === 'ambas';
}

module.exports = {
  normalizeRole,
  canCreateJob,
  canApplyToJob,
  canManageResume
};
