import jwt from 'jsonwebtoken';

export const TEST_JWT_SECRET = process.env.JWT_SECRET || 'arandue-super-secret-jwt-key-2026';

export interface TestUserPayload {
  id: number | string;
  role: 'diarista' | 'contratante' | 'ambas' | 'ambos' | string;
  nome?: string;
  email?: string;
  bairro?: string;
  [key: string]: unknown;
}

/**
 * Gera um token JWT simulado para uso em testes automatizados.
 * Dispensa chamadas HTTP de login antes de cada teste.
 */
export function generateTestToken(payload: TestUserPayload): string {
  const normalizedRole = payload.role === 'ambos' ? 'ambas' : payload.role;
  const { id, role, ...rest } = payload;

  return jwt.sign(
    {
      ...rest,
      id: Number(id),
      sub: String(id),
      role: normalizedRole,
      tipo: normalizedRole,
      nome: payload.nome || `Usuário ${id}`,
      email: payload.email || `usuario_${id}@teste.local`,
      bairro: payload.bairro || 'Centro'
    },
    TEST_JWT_SECRET,
    { expiresIn: '2h' }
  );
}
