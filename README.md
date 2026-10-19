# Aranduê — Quadro de Diárias e Bicos (ODS 8)

Plataforma web e mobile de conexão direta, transparente e justa entre empregadores locais (comércios, eventos, pequenas empresas) e trabalhadores autônomos em busca de renda pontual.

O projeto é alinhado ao **Objetivo de Desenvolvimento Sustentável 8 da ONU (Trabalho Decente e Crescimento Econômico)**, assegurando transparência prévia de remuneração, jornada delimitada e eliminação de intermediações abusivas.

---

## 🌐 Produção e Downloads

* **Aplicação Web (Vercel):** [https://arandue-projeto-final.vercel.app](https://arandue-projeto-final.vercel.app)
* **API Backend (Railway):** [https://backend-production-8ba16.up.railway.app](https://backend-production-8ba16.up.railway.app) ([Healthcheck](https://backend-production-8ba16.up.railway.app/health))
* **Aplicativo Android (APK):** Disponível para download direto na barra de navegação da plataforma web ou no arquivo `arandue.apk` na raiz do projeto.

---

## 🎯 Contexto e Apresentação do Projeto

### 💡 Problema
A contratação de serviços temporários e operacionais ("bicos" e diárias como garçom, auxiliar de carga, ajudante ou pintor) ainda ocorre predominantemente por grupos informais de mensagens ou boca a boca, gerando vulnerabilidades graves:
* **Falta de transparência:** O trabalhador aceita turnos sem clareza sobre jornada exata, condições operacionais ou valor líquido acordado ("a combinar"), ficando sujeito a calotes e remunerações predatórias.
* **Intermediações abusivas:** Plataformas tradicionais cobram comissões pesadas de quem já se encontra em situação de vulnerabilidade financeira.
* **Insegurança mútua:** Contratantes têm dificuldade para encontrar profissionais confiáveis com histórico transparente; diaristas enfrentam exposição indevida de dados e cancelamentos de última hora sem amparo.

### 🌎 ODS Alinhada (ODS 8 — Trabalho Decente e Crescimento Econômico)
O Aranduê atua diretamente nas metas da **ODS 8 da ONU**, promovendo o trabalho produtivo e protegido:
* **Transparência Tarifária Obrigatória (Meta 8.5):** Proibição total de vagas "a combinar". Todo anúncio exige valor monetário líquido visível e acordado previamente.
* **Jornadas e Condições Claras (Meta 8.8):** Delimitação expressa de horários de início/fim, vestimenta e ferramentas exigidas, evitando sobrecarga ou exigências abusivas.
* **Eliminação de Taxas Predatórias:** Conexão direta entre empregador local e prestador de serviço, assegurando que o trabalhador receba 100% da sua diária.
* **Proteção e Maioridade:** Salvaguarda estrita com exigência de maioridade civil (+18 anos), prevenindo o trabalho infantojuvenil irregular.

### 👥 Público-alvo
* **Trabalhadores Autônomos e Diaristas (+18):** Profissionais operacionais que buscam flexibilidade e renda imediata com segurança, respeito e previsibilidade.
* **Empregadores e Pequenos Negócios Locais:** Bares, restaurantes, lojas, organizadores de eventos e pequenas empresas que precisam de reforço de equipe ágil para picos de demanda ou emergências pontuais.

### ❤️ Impacto
* **Impacto Social:** Resgate da dignidade e autonomia financeira do trabalhador informal; proteção de dados pessoais (endereço e contato protegidos até a confirmação formal); redução do risco de exploração.
* **Impacto Profissional e Econômico:** Criação de um histórico de reputação verificado e bilateral (avaliação mútua justa), gerando credibilidade profissional para o diarista e fortalecendo a dinâmica econômica dos bairros e comércios locais.

---

## 📌 Funcionalidades Principais

* **Autenticação e Controle de Acesso (RBAC):**
  * Login via credenciais (JWT) e **Google OAuth 2.0** com fluxo de complementação de cadastro.
  * Três perfis de acesso (`contratante`, `diarista` e perfil híbrido `ambas`), além de alternância rápida de perfil para homologação.
* **Mural Público de Oportunidades:** Listagem de vagas operacionais de curta duração com filtros dinâmicos por categoria profissional, faixa de valor, bairro e busca textual.
* **Busca de Diaristas e Currículo Profissional:**
  * Vitrine de prestadores com filtros por especialidade, bairro e avaliação.
  * Gestão de currículo com especialidades, experiência, valor base da diária e histórico de avaliações recebidas.
* **Agenda de Disponibilidade e Prevenção de Conflitos:**
  * Calendário interativo para diaristas gerenciarem datas disponíveis (incluindo cadastro em lote).
  * Validação transacional automática que bloqueia conflitos de agenda ao aprovar candidaturas na mesma data.
* **Painel do Contratante e Fluxo de Candidaturas:**
  * Publicação, edição e exclusão de demandas com confirmação em modal.
  * Gestão do ciclo de vida da vaga (`Aberta`, `Preenchida`, `Concluída`, `Cancelada`).
  * Triagem e aprovação/recusa de candidatos com atualização automática dos demais inscritos.
* **Avaliação Mútua:** Registro de notas (1 a 5 estrelas) e comentários entre contratantes e diaristas após a conclusão do serviço.
* **Notificações Multicanal e Contato Direto:**
  * Alertas por **E-mail** (Nodemailer + Relay HTTPS Serverless na Vercel) ao receber candidaturas, aprovações ou contatos diretos.
  * Integração com **WhatsApp** (redirecionamento direto `wa.me` com mensagem pré-formatada e suporte a provedores Twilio / Meta Cloud API) e notificações em tempo real no navegador/push.
* **Experiência Mobile (APK Android, PWA e Expo):**
  * **APK Android Assinado:** Gerado com Capacitor para instalação direta em dispositivos Android.
  * **PWA (Progressive Web App):** Manifesto, Service Worker e banner de instalação na web.
  * **App React Native (Expo):** Aplicativo móvel multiplataforma no diretório `mobile/`.

---

## 🛠️ Stack Tecnológica

* **Banco de Dados:** MySQL 8.0 (Docker Compose em desenvolvimento / Railway em produção)
* **Backend:** Node.js (LTS), Express 5, `mysql2/promise`, JWT (`jsonwebtoken`), Google Auth (`google-auth-library`), Nodemailer, Twilio, Dotenv, CORS
* **Frontend Web & Android APK:** React 19 (Vite 8), React Router DOM v7, Axios, `@react-oauth/google`, Lucide React, CSS Modules, PWA, Capacitor 8 (`@capacitor/android`)
* **Mobile Nativo:** React Native 0.76, Expo SDK 52, React Navigation v7, Expo Notifications
* **Testes e Qualidade:** Vitest, Supertest, TypeScript, Oxlint
* **Infraestrutura e Deploy:** Vercel (Frontend + Serverless Relay) e Railway (API Node.js + MySQL)

---

## 📂 Estrutura do Repositório

```text
arandue/
├── backend/                  # API REST em Node.js / Express
│   ├── src/
│   │   ├── config/db.js      # Conexão e pool MySQL (suporte a variáveis e MYSQL_URL)
│   │   ├── controllers/      # Regras de negócio (auth, demandas, candidaturas, agenda, etc.)
│   │   ├── middlewares/      # Autenticação JWT e controle de permissões (RBAC)
│   │   ├── models/           # Queries SQL parametrizadas (Prepared Statements)
│   │   ├── routes/           # Rotas da API REST
│   │   ├── scripts/initDb.js # Script CLI de inicialização de schema e seed
│   │   ├── services/         # Serviços de notificação multicanal (E-mail, WhatsApp, Push)
│   │   └── utils/            # Helpers de validação e permissões
│   ├── railway.json          # Configuração de deploy no Railway
│   ├── server.js             # Ponto de entrada do servidor Express
│   └── package.json
│
├── frontend/                 # Interface Web (React + Vite), PWA e Projeto Android (Capacitor)
│   ├── android/              # Projeto nativo Android (Gradle / Capacitor)
│   ├── api/email-relay.js    # Serverless Function (Vercel) para relay de e-mails via HTTPS
│   ├── public/               # Manifesto PWA, Service Worker, ícones e APK para download
│   ├── src/
│   │   ├── assets/           # Imagens e recursos visuais
│   │   ├── components/       # Componentes reutilizáveis (Navbar, Card, Modal, Table, Alert, etc.)
│   │   ├── context/          # Estado global de autenticação e perfis (UserContext)
│   │   ├── pages/            # Telas (Mural, Login, Painel, BuscarDiaristas, Curriculo, Agenda, etc.)
│   │   ├── services/api.js   # Cliente HTTP Axios configurado
│   │   └── App.jsx
│   ├── capacitor.config.json # Configuração do Capacitor para build Android
│   ├── vercel.json           # Regras de rewrite SPA e rotas da Vercel
│   └── package.json
│
├── mobile/                   # Aplicativo mobile em React Native + Expo SDK 52
│   ├── src/
│   │   ├── components/       # Componentes nativos compartilhados
│   │   ├── context/          # Contexto de autenticação mobile
│   │   ├── screens/          # Telas adaptativas por perfil de usuário
│   │   └── services/         # Cliente API e serviço de Push Notifications
│   ├── App.js
│   └── package.json
│
├── database/                 # Scripts SQL do Banco de Dados
│   ├── schema.sql            # Definição das tabelas relacionais e constraints
│   └── seed.sql              # Dados iniciais para homologação e testes
│
├── tests/                    # Suíte de testes automatizados com Vitest e Supertest
│   ├── helpers/              # Mocks de banco de dados e geradores de token JWT
│   ├── integration/          # Testes de integração (auth, vagas, agenda, avaliações, notificações)
│   └── unit/                 # Testes unitários (permissões RBAC e provedores de notificação)
│
├── arandue.apk               # Pacote Android (APK Release assinado) pronto para instalação
├── docker-compose.yml        # Orquestração local do MySQL 8.0 e phpMyAdmin
├── DEPLOY.md                 # Guia passo a passo de deploy na Vercel e Railway
├── GEMINI.md                 # Diretrizes de arquitetura e padrões de código
├── PLANO.md                  # Planejamento e checklist de etapas concluídas
├── SISTEMA.MD                # Especificação funcional detalhada do sistema
└── package.json              # Scripts globais de testes e typecheck na raiz
```

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
* [Node.js](https://nodejs.org/) (versão LTS recomendada: 18+)
* [Docker](https://www.docker.com/) e Docker Compose (ou MySQL 8.x local)
* [Git](https://git-scm.com/)

---

### 1. Inicializar o Banco de Dados (MySQL)

Na raiz do projeto, suba os containers do MySQL e do phpMyAdmin:

```bash
docker compose up -d
```

* **MySQL:** Porta `3308` (usuário: `bicos_user`, senha: `bicos_password`, banco: `quadro_bicos_db`)
* **phpMyAdmin:** Acesse em [http://localhost:92](http://localhost:92) (usuário `root`, senha `root`)

Os scripts `database/schema.sql` e `database/seed.sql` são executados automaticamente na criação do volume Docker. Caso deseje recriar as tabelas e popular os dados via script Node.js:

```bash
cd backend
npm run db:seed
```

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

### 3. Configurar e Executar o Frontend Web

Em outro terminal:

```bash
cd frontend

# Copiar arquivo de variáveis de ambiente
cp .env.example .env

# Instalar dependências
npm install

# Iniciar aplicação React (Vite)
npm run dev
```

Acesse a interface no navegador em `http://localhost:5173`.

---

### 4. Gerar APK Android ou Executar App Mobile

* **Gerar APK Release assinado (Capacitor):**
  ```bash
  cd frontend
  npm run apk
  ```
  O pacote final será copiado para `arandue.apk` na raiz do projeto.

* **Executar App React Native (Expo):**
  ```bash
  cd mobile
  cp .env.example .env
  npm install
  npx expo start
  ```

---

## 🧪 Execução dos Testes

A suíte automatizada utiliza **Vitest** e **Supertest** para validar permissões (RBAC), autenticação, prevenção de conflitos de agenda, conclusão de demandas, avaliações mútuas e disparo de notificações:

```bash
# Executar todos os testes (na raiz do projeto)
npm test

# Executar apenas testes unitários
npm run test:unit

# Executar apenas testes de integração
npm run test:integration

# Verificação de tipos TypeScript
npm run typecheck
```

---

## 📋 Padrões de Código e Documentação Complementar

O projeto adota commits semânticos (`feat:`, `fix:`, `refactor:`, `style:`, `test:`, `docs:`, `chore:`). Para mais detalhes técnicos, consulte:

* [GEMINI.md](file:///home/eduardo/Documentos/projetos/arandue/GEMINI.md) — Diretrizes de arquitetura, componentização e segurança.
* [SISTEMA.MD](file:///home/eduardo/Documentos/projetos/arandue/SISTEMA.MD) — Especificação funcional e regras de negócio.
* [DEPLOY.md](file:///home/eduardo/Documentos/projetos/arandue/DEPLOY.md) — Guia de deploy em produção (Vercel + Railway).
* [mobile/README.md](file:///home/eduardo/Documentos/projetos/arandue/mobile/README.md) — Documentação específica do aplicativo mobile Expo.
