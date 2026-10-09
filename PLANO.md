# Plano de Desenvolvimento — Quadro de Diárias e Bicos (ODS 8)

Plano de execução passo a passo para construção do sistema web full stack com MySQL, Node.js (API REST) e ReactJS.

---

## Cronograma de Etapas

```text
Etapa 1: Banco de Dados (MySQL)
   └── Etapa 2: Backend & API REST (Node.js)
          └── Etapa 3: Frontend & Componentes (ReactJS)
                 └── Etapa 4: Integração CRUD & Regras de Negócio
                        └── Etapa 5: Validação Final & Deploy Local
```

---

## Etapa 1: Banco de Dados (MySQL)

O objetivo desta etapa é criar a estrutura relacional do banco garantindo integridade referencial e chaves estrangeiras.

### Tarefas
- [x] Instalar e inicializar o servidor MySQL localmente (ou via container Docker).
- [x] Criar o banco de dados `quadro_bicos_db`.
- [x] Escrever o arquivo `database/schema.sql` contendo:
  - Tabela `usuarios` (`id`, `nome`, `email` [UNIQUE], `telefone`, `tipo` ['contratante', 'diarista'], `bairro`, `data_criacao`).
  - Tabela `demandas` (`id`, `contratante_id` [FK -> usuarios.id], `titulo`, `descricao`, `categoria`, `valor_diaria`, `data_servico`, `status` ['aberta', 'preenchida', 'cancelada'], `data_criacao`).
  - Tabela `candidaturas` (`id`, `demanda_id` [FK -> demandas.id], `diarista_id` [FK -> usuarios.id], `status` ['pendente', 'aceita', 'recusada'], `mensagem`, `data_criacao`).
  - Tabela `avaliacoes` (`id`, `demanda_id` [FK], `avaliador_id` [FK], `avaliado_id` [FK], `nota`, `comentario`, `data_criacao`).
- [x] Adicionar restrição de unicidade em `candidaturas` para impedir que o mesmo diarista se inscreva duas vezes na mesma demanda (`UNIQUE(demanda_id, diarista_id)`).
- [x] Escrever o arquivo `database/seed.sql` com registros fictícios para testes imediatos (ao menos 2 contratantes, 3 diaristas e 4 demandas).

### Critério de Conclusão da Etapa
Executar `SOURCE schema.sql` e `SOURCE seed.sql` sem erros de chave estrangeira ou sintaxe.

---

## Etapa 2: Backend e API RESTful (Node.js)

O objetivo desta etapa é construir a API com arquitetura em camadas e disponibilizar o CRUD completo com respostas em formato JSON.

### Tarefas
- [x] Inicializar o projeto no diretório `backend/` (`npm init -y`).
- [x] Instalar dependências: `express`, `mysql2`, `cors`, `dotenv`.
- [x] Configurar variáveis de ambiente no arquivo `.env` (`PORT`, `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`).
- [x] Configurar a conexão do banco em `src/config/db.js` utilizando `mysql2/promise` com pool de conexões (`createPool`).
- [x] Implementar Models e Queries SQL seguras com Prepared Statements:
  - `src/models/demandaModel.js`: `create`, `findAll`, `findById`, `update`, `delete`.
  - `src/models/candidaturaModel.js`: `create`, `findByDemandaId`, `updateStatus`.
- [x] Implementar Controllers para tratamento de requisição e resposta:
  - `src/controllers/demandaController.js`: validação de entrada, status codes (200, 201, 400, 404, 500).
  - `src/controllers/candidaturaController.js`: controle de candidaturas e liberação de dados de contato.
- [x] Definir e registrar as rotas REST em `src/routes/`:
  - `POST   /api/demandas` -> Cadastra nova demanda (**Create**).
  - `GET    /api/demandas` -> Lista todas as demandas abertas (**Read**).
  - `GET    /api/demandas/:id` -> Retorna detalhes da demanda e dados do anunciante (**Read**).
  - `PUT    /api/demandas/:id` -> Atualiza informações da demanda (**Update**).
  - `DELETE /api/demandas/:id` -> Remove ou cancela a demanda (**Delete**).
  - `POST   /api/candidaturas` -> Diarista se inscreve na vaga.
  - `GET    /api/demandas/:id/candidatos` -> Lista inscritos na vaga.
  - `PATCH  /api/candidaturas/:id/status` -> Aprova/Recusa candidato e libera telefone.
- [x] Configurar middlewares no `src/app.js` (`cors()`, `express.json()`).

### Critério de Conclusão da Etapa
Todos os endpoints testados e validados via Postman ou Insomnia, cobrindo casos de sucesso e respostas de erro 400/404.

---

## Etapa 3: Frontend e Componentização (ReactJS)

O objetivo desta etapa é montar a estrutura visual da aplicação no diretório `frontend/`, criando componentes reutilizáveis e modulares.

### Tarefas
- [x] Inicializar o frontend com Vite (`npm create vite@latest frontend -- --template react`).
- [x] Instalar dependências: `axios`, `react-router-dom`, `lucide-react`.
- [x] Criar a estrutura de diretórios em `src/`:
  - `src/components/`
  - `src/pages/`
  - `src/services/`
  - `src/context/`
- [x] Desenvolver os componentes atômicos e estruturais:
  - `Navbar`: Menu com links para Mural, Criar Vaga, Minhas Demandas e alternância de perfil de usuário.
  - `Footer`: Rodapé informativo com referência ao ODS 8 (Trabalho Decente).
  - `Button`: Botão reutilizável com variantes (`primary`, `danger`, `outline`) e propriedade `loading`.
  - `Card`: Card de apresentação da vaga contendo título, categoria, valor, data, bairro e botão de ação.
  - `FormInput` / `FormSelect`: Componentes de campo com rótulo, validação e exibição de erro.
  - `Modal`: Janela de diálogo controlada por estado (`isOpen`) para confirmações de exclusão e formulários rápidos.
  - `Table`: Tabela reutilizável com cabeçalhos dinâmicos e botões de ação na linha (Editar, Excluir, Ver Candidatos).
- [x] Montar o roteamento de páginas no `src/App.jsx` com `BrowserRouter`:
  - `/` -> `MuralVagas` (Vitrine pública).
  - `/demandas/nova` -> `NovaDemanda` (Formulário de cadastro).
  - `/demandas/editar/:id` -> `EditarDemanda` (Formulário de edição).
  - `/painel` -> `PainelContratante` (Tabela de gestão de vagas próprias).

### Critério de Conclusão da Etapa
Navegação entre rotas funcionando e componentes reutilizáveis renderizando de forma isolada com props e layouts responsivos.

---

## Etapa 4: Integração Full Stack e Validação do CRUD

O objetivo desta etapa é conectar as chamadas de API do Axios aos componentes visuais, garantindo que todas as operações ocorram pela interface.

### Tarefas
- [ ] Configurar cliente HTTP em `src/services/api.js` apontando para `http://localhost:3000/api`.
- [ ] **Integração do Create:**
  - Ligar o formulário da página `NovaDemanda` ao método `api.post('/demandas', dados)`.
  - Adicionar validação de campos vazios e desabilitar botão durante envio.
  - Redirecionar para o mural após criação com feedback visual de sucesso.
- [ ] **Integração do Read:**
  - Na página `MuralVagas`, carregar dados via `api.get('/demandas')` dentro de um `useEffect`.
  - Renderizar a lista mapeando cada item no componente `Card`.
  - Adicionar estados visuais de `Carregando...` e `Nenhuma vaga encontrada`.
  - Implementar filtro dinâmico por categoria ou busca por texto.
- [ ] **Integração do Update:**
  - Na página `EditarDemanda`, carregar os dados atuais via `api.get('/demandas/:id')` e preencher os campos.
  - Submeter as alterações via `api.put('/demandas/:id', dadosAtualizados)`.
  - Atualizar o estado e retornar ao painel.
- [ ] **Integração do Delete:**
  - Na tabela do `PainelContratante`, ao clicar no botão "Excluir", abrir o componente `Modal`.
  - O modal deve exibir a mensagem: *"Tem certeza que deseja cancelar esta vaga?"*.
  - Ao confirmar, disparar `api.delete('/demandas/:id')`.
  - Atualizar a lista na interface removendo a linha via estado (`setDemandas(prev => prev.filter(...))`), sem recarregar a página.
- [ ] **Integração da Ação de Contato/Aprovação:**
  - No detalhe da vaga, listar candidatos inscritos.
  - Botão "Aprovar" dispara `api.patch('/candidaturas/:id/status')` e exibe o botão direto de WhatsApp com link para o diarista (`wa.me/55...`).

### Critério de Conclusão da Etapa
Execução do ciclo completo (criar vaga -> visualizar no mural -> editar valores -> receber inscrição -> excluir vaga) realizado 100% pela interface gráfica.

---

## Etapa 5: Validação Final e Checklist de Entrega

O objetivo desta etapa é auditar o projeto contra todos os requisitos obrigatórios definidos.

### Checklist de Conformidade
- [ ] **Banco MySQL:** Tabelas normalizadas, sem dados soltos e com relacionamentos (1:N) íntegros.
- [ ] **API Node.js:** Estrutura organizada em pastas (`controllers`, `models`, `routes`, `config`), sem queries concatenadas diretamente.
- [ ] **CRUD Completo:** As 4 operações (Create, Read, Update, Delete) operam sem falhas no console do navegador e no terminal do servidor.
- [ ] **Frontend React:** Código modular com Navbar, Footer, Buttons, Cards, Modais e Tabelas separados em arquivos individuais na pasta `components`.
- [ ] **Restrições Respeitadas:** Conteúdo restrito ao público adulto (+18), sem temas proibidos (saúde, religião, esportes).
- [ ] **Repositório:** Arquivo `.gitignore` configurado ignorando `node_modules` e `.env` em ambas as pastas (backend e frontend).