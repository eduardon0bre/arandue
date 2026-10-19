# 🚀 Guia de Deploy — Vercel (Frontend) + Railway (Backend & MySQL)

Este documento descreve o passo a passo para colocar a aplicação em produção utilizando **Vercel** para o Frontend e **Railway** para o Backend e Banco de Dados MySQL.

---

## 1. Backend e Banco de Dados no Railway

### Passo 1.1: Criar o Projeto e o Banco de Dados
1. Acesse o [Railway](https://railway.com/) e faça login com seu GitHub.
2. Clique em **"New Project"**.
3. Selecione **"Provision MySQL"**. O Railway criará uma instância de MySQL gerenciada na nuvem e gerará automaticamente a variável `MYSQL_URL`.

### Passo 1.2: Conectar o Backend
1. No mesmo projeto do Railway, clique em **"+ New"** > **"GitHub Repo"** e selecione o repositório do projeto.
2. Clique no serviço criado e vá até a aba **"Settings"**:
   - **Root Directory:** defina como `/backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js` (ou deixe automático, o Railway lerá o `railway.json` e `Procfile`).
3. Vá para a aba **"Variables"** e adicione:
   - `MYSQL_URL`: use a referência da variável do serviço MySQL (clique em "Add Reference" e selecione `MySQL.MYSQL_URL`) ou cole a URL de conexão do MySQL.
   - `JWT_SECRET`: uma chave segura (ex: `sua-chave-super-secreta-producao-2026`).
   - `NODE_ENV`: `production`
   - `GOOGLE_CLIENT_ID`: seu ID de cliente Google (se configurado).
4. Na aba **"Networking"**, clique em **"Generate Domain"** para criar uma URL pública HTTPS (exemplo: `https://arandue-api-production.up.railway.app`).

### Passo 1.3: Inicializar as Tabelas do Banco
Para criar todas as tabelas e dados no MySQL do Railway:
- Conecte via Railway CLI (`railway run npm run db:init` ou `railway run npm run db:seed` dentro da pasta `backend`).
- Ou acerte os comandos SQL executando o script `backend/src/scripts/initDb.js` com a `MYSQL_URL` do Railway.

---

## 2. Frontend na Vercel

O frontend React (Vite) já possui o arquivo `frontend/vercel.json` configurado para garantir que rotas diretas (como `/login`, `/curriculo` e `/minhas-demandas`) funcionem sem erro 404.

### Passo 2.1: Conectar o Repositório na Vercel
1. Acesse a [Vercel](https://vercel.com/) e faça login.
2. Clique em **"Add New..."** > **"Project"** e importe o repositório do GitHub.
3. Na tela de configuração do projeto (**Configure Project**):
   - **Framework Preset:** `Vite` (detectado automaticamente)
   - **Root Directory:** clique em "Edit" e selecione a pasta `frontend`.
4. Em **Environment Variables**, adicione:
   - `VITE_API_URL`: a URL pública gerada no Railway adicionando `/api` no final:
     ```text
     https://sua-api.up.railway.app/api
     ```
   - `VITE_GOOGLE_CLIENT_ID`: seu Client ID do Google Cloud (se for utilizar login Google real).
5. Clique em **"Deploy"**.

---

## ⚡ Ambientes de Produção Ativos

- **Frontend (Vercel):** [https://frontend-murex-one-99.vercel.app](https://frontend-murex-one-99.vercel.app)
- **Backend API (Railway):** [https://backend-production-8ba16.up.railway.app](https://backend-production-8ba16.up.railway.app)
- **Healthcheck:** [https://backend-production-8ba16.up.railway.app/health](https://backend-production-8ba16.up.railway.app/health)
- **API Demandas:** [https://backend-production-8ba16.up.railway.app/api/demandas](https://backend-production-8ba16.up.railway.app/api/demandas)

---

## 3. Verificação Pós-Deploy

1. **Health Check do Backend:**
   Acesse no navegador:
   ```text
   https://backend-production-8ba16.up.railway.app/health
   ```
   A resposta esperada é:
   ```json
   {
     "success": true,
     "data": {
       "status": "online",
       "service": "arandue-api",
       "timestamp": "..."
     }
   }
   ```

2. **Acesso ao Frontend:**
   Acesse a URL da Vercel (ex: `https://arandue.vercel.app`) e teste o fluxo de login e navegação pelas vagas e perfis.
