# Aranduê — Quadro de Diárias e Bicos (ODS 8)

Plataforma web de conexão direta, transparente e justa entre empregadores locais (comércios, eventos, pequenas empresas) e trabalhadores autônomos em busca de renda pontual.

O projeto é alinhado ao **Objetivo de Desenvolvimento Sustentável 8 da ONU (Trabalho Decente e Crescimento Econômico)**, assegurando transparência prévia de remuneração, jornada delimitada e eliminação de intermediações abusivas.

---

## 📌 Funcionalidades Principais

* **Mural Público de Oportunidades:** Listagem de vagas operacionais de curta duração com filtros por categoria profissional, faixa de valor e data.
* **Candidatura Ágil:** Trabalhadores autônomos podem se candidatar às oportunidades com mensagem de apresentação e disponibilidade.
* **Painel do Contratante:**
  * Publicação e edição de demandas com especificações de vestimenta, ferramentas e endereço operacional.
  * Gestão de status da vaga (`Aberta`, `Preenchida`, `Concluída`, `Cancelada`).
  * Triagem e aprovação/recusa de candidatos com atualização automática dos concorrentes.
* **Avaliação Mútua:** Registro de notas (1 a 5) e feedbacks entre empregadores e prestadores após a conclusão do serviço.
* **Segurança e Privacidade:** Endereço completo e telefone dos envolvidos protegidos até a confirmação formal da candidatura.

---

## 🛠️ Stack Tecnológica

* **Banco de Dados:** MySQL 8.0 (executado via Docker Compose com scripts de schema e seed automático)
* **Backend:** Node.js (LTS), Express, driver `mysql2/promise`, JWT, Dotenv, CORS
* **Frontend:** React 19 (Vite), React Router DOM, Axios, Lucide React, CSS Modules
* **Testes:** Vitest, Supertest, TypeScript (testes unitários e de integração de rotas/permissões)

---

## 📂 Estrutura do Repositório

```text
arandue/
├── backend/                  # API REST em Node.js / Express
│   ├── src/
│   │   ├── config/db.js      # Conexão e pool MySQL
│   │   ├── controllers/      # Regras de negócio e handlers HTTP
│   │   ├── middlewares/      # Middlewares de autenticação e validação
│   │   ├── models/           # Queries SQL com Prepared Statements
│   │   ├── routes/           # Rotas da API REST
│   │   └── utils/            # Utilitários e helpers de permissão
│   ├── server.js             # Inicialização do servidor Express
│   └── package.json
│
├── frontend/                 # Interface web em React + Vite
│   ├── src/
│   │   ├── assets/           # Imagens e ícones
│   │   ├── components/       # Componentes reutilizáveis (Navbar, Card, Modal, Table, etc.)
│   │   ├── context/          # Contexto global de autenticação (UserContext)
│   │   ├── pages/            # Telas da aplicação (Mural, Login, Painel, etc.)
│   │   ├── services/api.js   # Cliente HTTP Axios configurado
│   │   └── App.jsx
│   └── package.json
│
├── database/                 # Banco de Dados
│   ├── schema.sql            # Definição das tabelas relacionais
│   └── seed.sql              # Dados iniciais para testes e desenvolvimento
│
├── tests/                    # Suíte de testes com Vitest
│   ├── helpers/              # Mocks e helpers de autenticação/banco
│   ├── integration/          # Testes de integração de endpoints
│   └── unit/                 # Testes unitários de regras de negócio
│
├── docker-compose.yml        # Orquestração do MySQL e phpMyAdmin
├── GEMINI.md                 # Diretrizes de arquitetura e padrões de código
├── PLANO.md                  # Planejamento e checklist do projeto
├── SISTEMA.MD                # Especificação funcional detalhada
└── package.json              # Configurações de testes na raiz
```

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
* [Node.js](https://nodejs.org/) (versão LTS recomendada: 18+)
* [Docker](https://www.docker.com/) e Docker Compose
* [Git](https://git-scm.com/)

---

### 1. Inicializar o Banco de Dados (MySQL)

Na raiz do projeto, suba o container do MySQL e do phpMyAdmin:

```bash
docker compose up -d
```

* **MySQL:** Porta `3308` (usuário: `bicos_user`, senha: `bicos_password`, banco: `quadro_bicos_db`)
* **phpMyAdmin:** Acesse em [http://localhost:92](http://localhost:92) (usuário `root`, senha `root`)

Os scripts `database/schema.sql` e `database/seed.sql` são executados automaticamente na criação do volume.

---

### 2. Configurar e Executar o Backend

```bash
cd backend

# Copiar arquivo de variáveis de ambiente
cp .env.example .env

# Instalar dependências
npm install

# Iniciar servidor em modo de desenvolvimento
npm run dev
```

A API estará disponível em: `http://localhost:3000`

---

### 3. Configurar e Executar o Frontend

Em outro terminal:

```bash
cd frontend

# Copiar arquivo de variáveis de ambiente
cp .env.example .env

# Instalar dependências
npm install

# Iniciar aplicação React
npm run dev
```

Acesse a interface no navegador na URL indicada pelo Vite (geralmente `http://localhost:5173`).

---

## 🧪 Execução dos Testes

Os testes automatizados cobrem permissões unitárias e integração dos fluxos de autenticação e demandas:

```bash
# Executar todos os testes
npm test

# Executar testes unitários
npm run test:unit

# Executar testes de integração
npm run test:integration

# Verificação de tipos TypeScript
npm run typecheck
```

---

## 📋 Padrões de Código e Commits

O projeto adota o padrão de commits semânticos:

* `feat:` Novas funcionalidades (ex.: `feat: cria endpoint de cadastro de demandas`)
* `fix:` Correções de bugs (ex.: `fix: corrige query de busca por categoria`)
* `style:` Ajustes visuais ou de interface sem impacto na lógica
* `chore:` Atualizações de configuração, dependências e infraestrutura
* `test:` Adição ou modificação de testes automatizados
* `docs:` Alterações na documentação

Consulte o arquivo [GEMINI.md](file:///home/eduardo/Documentos/projetos/arandue/GEMINI.md) para detalhes das convenções de arquitetura e segurança.
