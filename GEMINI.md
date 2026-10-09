# Diretrizes de Desenvolvimento — Quadro de Diárias e Bicos (ODS 8)

Este documento estabelece as regras de arquitetura, padrões de código e convenções obrigatórias para o desenvolvimento deste projeto full stack.

---

## 1. Stack Tecnológica
* **Banco de Dados:** MySQL 8.x
* **Backend:** Node.js (LTS), Express, driver `mysql2/promise`, `dotenv`, `cors`
* **Frontend:** React 18+ (Vite), React Router DOM, Axios, CSS Modules ou Tailwind CSS

---

## 2. Estrutura do Projeto
O repositório deve manter separação total entre cliente e servidor:

```text
/
├── backend/
│   ├── src/
│   │   ├── config/db.js           # Pool de conexões MySQL
│   │   ├── controllers/           # Lógica de requisição/resposta HTTP
│   │   ├── models/                # Queries SQL parametrizadas
│   │   ├── routes/                # Definição das rotas Express
│   │   └── app.js                 # Configuração de middlewares
│   ├── server.js                  # Ponto de entrada
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── assets/                # Imagens e ícones
│   │   ├── components/            # Componentes reutilizáveis (UI)
│   │   ├── pages/                 # Telas da aplicação
│   │   ├── services/api.js        # Configuração do Axios
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
└── gemini.md
```

---

## 3. Regras de Backend e Banco de Dados

### 3.1. Segurança e Banco de Dados
* **Proibido SQL Injection:** Nunca concatene strings em consultas SQL. Use sempre *Prepared Statements* com marcadores `?`:
  ```javascript
  // Correto:
  const [rows] = await db.query('SELECT * FROM demandas WHERE status = ?', [status]);
  ```
* **Conexão:** Utilize sempre pool de conexões (`mysql.createPool`) configurado via variáveis de ambiente no arquivo `.env`.
* **Tratamento de Exceções:** Todos os controllers devem utilizar blocos `try/catch`. Erros não tratados devem retornar status `500` com payload JSON padronizado.

### 3.2. Padrão de API RESTful
* As respostas da API devem seguir um padrão uniforme de JSON:
  * Sucesso: `{ "success": true, "data": ... }`
  * Erro: `{ "success": false, "message": "Descrição amigável do erro" }`
* **Status Codes Obrigatórios:**
  * `200 OK`: Leitura, atualização concluída.
  * `201 Created`: Novo registro criado com sucesso.
  * `400 Bad Request`: Falha de validação nos dados enviados (ex.: campos obrigatórios nulos).
  * `404 Not Found`: ID do recurso não encontrado no banco.
  * `500 Internal Server Error`: Erro no servidor ou falha na query do banco.

---

## 4. Regras de Frontend (ReactJS)

### 4.1. Componentização Rigorosa
* Toda interface deve ser quebrada em blocos funcionais e reutilizáveis:
  * `Navbar`: Barra de topo responsiva.
  * `Footer`: Rodapé informativo.
  * `Button`: Suporta props `variant` (`primary`, `danger`, `outline`), `disabled` e `onClick`.
  * `Card`: Renderiza cada diária/bico de forma isolada.
  * `Modal`: Componente de diálogo controlado por estado booleano (`isOpen`). Deve ser usado obrigatoriamente para confirmar ações destrutivas (`DELETE`).
  * `Table`: Exibição tabular de candidaturas e demandas cadastradas.
* Nenhuma página deve conter blocos gigantescos de HTML inline sem componentização.

### 4.2. Integração e Estados
* **Operações do CRUD:** Toda operação de criação, edição ou exclusão deve atualizar imediatamente a interface visual (atualizando o estado do componente), sem depender de `window.location.reload()`.
* **Feedbacks Visuais Obrigatórios:**
  * Estados de carregamento (*Loading spinners* ou botões desabilitados enquanto a requisição ocorre).
  * Mensagens claras de sucesso e erro para o usuário final.
  * Validação prévia de campos em formulários antes de disparar o `axios.post`/`put`.

---

## 5. Nomenclatura e Código Limpo
* **Arquivos React:** `PascalCase.jsx` para componentes e páginas (ex.: `CardDemanda.jsx`, `MuralVagas.jsx`).
* **Funções e Variáveis:** `camelCase` (ex.: `listarDemandas`, `valorDiaria`).
* **Tabelas e Colunas no MySQL:** `snake_case` e no plural para tabelas (ex.: `demandas`, `data_servico`).
* **Commits:** Mensagens diretas e semânticas:
  * `feat: cria endpoint de cadastro de demandas`
  * `fix: corrige query de busca por categoria`
  * `style: adiciona componente modal de confirmacao`