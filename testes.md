Você é um Engenheiro de Software Sênior especialista em QA e Testes Automatizados (Node.js, TypeScript e Vitest/Jest).

Sua tarefa é implementar a suíte completa de testes automatizados (Testes Unitários e Testes de Integração de API) para o módulo de controle de acesso (RBAC), autenticação e gestão de demandas/vagas da nossa aplicação.

---

### 1. REGRAS DE NEGÓCIO E PERMISSÕES (RBAC)

O sistema possui três papéis de usuário (`role`):
1. `diarista`:
   - PODE se candidatar a vagas (`POST /api/vagas/:id/candidaturas`).
   - NÃO PODE criar vagas (`POST /api/vagas`). Retorna `403 Forbidden` (`FORBIDDEN_ROLE`).
   - PODE gerenciar currículo (`GET|PUT /api/perfil/curriculo`).
2. `contratante`:
   - PODE criar vagas (`POST /api/vagas`).
   - NÃO PODE se candidatar a vagas. Retorna `403 Forbidden` (`FORBIDDEN_ROLE`).
   - NÃO acessa aba de currículo.
3. `ambas` (Perfil híbrido):
   - PODE criar vagas e PODE se candidatar a vagas.
   - PODE gerenciar currículo.

Rotas protegidas e regras gerais:
- Usuários não autenticados que tentarem acessar rotas restritas (como listar "minhas demandas" ou criar vagas) devem receber `401 Unauthorized`.
- Suporte a encerramento de sessão (`POST /api/auth/logout`) e exclusão de conta (`DELETE /api/conta`).
- Apenas o próprio usuário autenticado pode editar suas preferências e configurações (`PUT /api/configuracoes`).

---

### 2. ESCOPO DOS TESTES A IMPLEMENTAR

#### A. Testes Unitários (`tests/unit/permissions.spec.ts`)
- Testar a função isolada de checagem de permissões (`canCreateJob(role)`, `canApplyToJob(role)`, `canManageResume(role)`).
- Cobrir todos os 3 perfis (`diarista`, `contratante`, `ambas`).
- Validar caso de borda para papéis inválidos ou indefinidos (deve retornar `false`).

#### B. Testes de Integração de API (`tests/integration/jobs-auth.spec.ts`)
Utilizar `supertest` contra as rotas da aplicação:
1. `POST /api/vagas`:
   - Sem header de autenticação -> `401 Unauthorized`.
   - Com token de `diarista` -> `403 Forbidden` (body `{ code: 'FORBIDDEN_ROLE' }`).
   - Com token de `contratante` -> `201 Created`.
   - Com token de `ambas` -> `201 Created`.
2. `POST /api/vagas/:id/candidaturas`:
   - Sem autenticação -> `401 Unauthorized`.
   - Com token de `contratante` -> `403 Forbidden` (body `{ code: 'FORBIDDEN_ROLE' }`).
   - Com token de `diarista` -> `201 Created`.
   - Com token de `ambas` -> `201 Created`.
3. `GET /api/demandas/minhas`:
   - Sem autenticação -> `401 Unauthorized`.
   - Autenticado -> `200 OK` retornando apenas as demandas vinculadas ao usuário logado.
4. `POST /api/auth/logout` e `DELETE /api/conta`:
   - Validar invalidação de sessão e fluxo de exclusão/anonimização de dados.

---

### 3. PADRÕES E DIRETRIZES DE CÓDIGO
- Linguagem: TypeScript.
- Framework de Testes: Vitest (ou Jest).
- Biblioteca de Requisição: `supertest`.
- Estruturação: BDD semântico (`describe`, `it`, `expect`).
- Crie um helper `generateTestToken(payload)` para gerar tokens JWT simulados sem depender de chamada HTTP de login antes de cada teste.
- Garanta que o banco de dados em memória/mock seja limpo ou restaurado entre os testes (`beforeEach` / `afterEach`).
- Não utilize dados estáticos acoplados; use payloads com dados realistas.

Por favor, gere os arquivos completos de código com tipagem estrita, comentários explicativos e prontos para execução.