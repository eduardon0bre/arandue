# 📱 Aranduê Mobile — Aplicativo de Diárias e Oportunidades

Aplicativo móvel multiplataforma (Android, iOS e Web) do **Aranduê**, desenvolvido com **React Native** e **Expo SDK 52**. O aplicativo conta com arquitetura adaptativa por perfil de usuário, integração com notificações push nativas e resiliência offline.

---

## 🚀 Tecnologias Utilizadas

- **React Native 0.76.6** & **React 18.3.1**
- **Expo SDK 52** (com suporte à New Architecture)
- **React Navigation v7** (Native Stack & Bottom Tabs)
- **Expo Notifications (~0.29.0)** (registro de tokens, badges e canais Android)
- **Axios** (com interceptors de autenticação e fallback em desenvolvimento)
- **@expo/vector-icons** (Ionicons)

---

## 📂 Estrutura de Diretórios

```
mobile/
├── assets/                  # Ícones, splash screen e imagens do app
├── src/
│   ├── components/          # Componentes visuais compartilhados
│   │   └── ModalConfirmacao.js   # Modal nativo personalizável para ações críticas
│   ├── context/
│   │   └── AuthContext.js        # Estado global de autenticação e alternância de perfil
│   ├── screens/             # Telas do aplicativo
│   │   ├── MuralVagasScreen.js        # Visualização e candidatura a vagas
│   │   ├── NovaDemandaScreen.js       # Criação e anúncio de novas oportunidades
│   │   ├── MinhasDemandasScreen.js    # Gestão de vagas criadas e candidaturas
│   │   ├── BuscarDiaristasScreen.js   # Busca e contratação de profissionais
│   │   ├── AgendaScreen.js            # Calendário de diárias e disponibilidade
│   │   ├── CurriculoScreen.js         # Currículo profissional e especialidades
│   │   ├── ConfiguracoesScreen.js     # Preferências de notificação e perfil
│   │   └── NotificacoesScreen.js      # Painel de notificações e alertas push
│   └── services/
│       ├── api.js                # Cliente Axios com interceptors e modo offline
│       └── pushNotifications.js  # Gerenciamento de tokens Expo Push e alertas locais
├── App.js                   # Ponto de entrada, header customizado e navegação adaptativa
├── app.json                 # Configuração do Expo SDK 52 e plugins nativos
├── babel.config.js          # Configuração Babel com preset expo
├── package.json             # Dependências e scripts do projeto
├── .env.example             # Modelo de variáveis de ambiente
└── README.md                # Este documento
```

---

## ⚙️ Pré-requisitos e Instalação

1. Certifique-se de possuir o **Node.js** (versão 18 ou superior) instalado.
2. Navegue até a pasta `mobile`:
   ```bash
   cd mobile
   ```
3. Instale as dependências:
   ```bash
   npm install
   ```

---

## 🌐 Configuração de Ambiente (.env)

Crie um arquivo `.env` baseado no modelo `.env.example`:

```bash
cp .env.example .env
```

Conteúdo de `.env`:
```env
# URL da API backend do Aranduê
# Se testar no navegador (Web):
EXPO_PUBLIC_API_URL=http://localhost:3000/api

# Se testar no Emulador Android oficial:
# EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api

# Se testar em celular físico via Expo Go (mesma rede Wi-Fi):
# EXPO_PUBLIC_API_URL=http://192.168.x.x:3000/api
```

---

## ▶️ Executando o Aplicativo

Para iniciar o servidor de desenvolvimento Metro Bundler:

```bash
npx expo start
```

### Opções de Execução:
- **Expo Go no Celular**: Escaneie o QR Code exibido no terminal com o aplicativo Expo Go (Android) ou Câmera (iOS).
- **Navegador Web**: Pressione `w` no terminal ou execute `npm run web`.
- **Emulador Android**: Pressione `a` no terminal ou execute `npm run android`.
- **Simulador iOS**: Pressione `i` no terminal ou execute `npm run ios`.

---

## 🎯 Funcionalidades Principais

### 1. Navegação Adaptativa por Perfil de Usuário
O app adapta dinamicamente as abas inferiores e opções de acordo com o perfil logado (`usuario.tipo`):
- **Contratante**:
  - `Vagas`: Consulta e exploração de diárias publicadas.
  - `Criar Vaga`: Publicação de novas oportunidades com confirmação nativa.
  - `Minhas Vagas`: Gerenciamento de vagas abertas e candidatos inscritos.
  - `Diaristas`: Busca de profissionais com filtros por avaliação e bairro.
  - `Perfil`: Configurações de conta e canais de notificação.
- **Diarista**:
  - `Vagas`: Consulta e candidatura imediata a diárias.
  - `Inscrições`: Acompanhamento de status das propostas enviadas.
  - `Agenda`: Próximas diárias confirmadas e controle de dias disponíveis.
  - `Currículo`: Apresentação profissional, especialidades e valor base da diária.
  - `Perfil`: Configurações e canais de comunicação.
- **Ambos (Demo Geral)**:
  - Navegação unificada com acesso rápido a todas as ferramentas.

### 2. Header Inteligente com Troca Rápida de Perfil de Teste
No topo da interface há um badge interativo exibindo o perfil em uso (`Contratante`, `Diarista` ou `Ambos`). Ao tocar no badge, o app alterna instantaneamente o perfil ativo sem necessidade de recarregar a tela, facilitando a homologação e testes de usabilidade.

### 3. Sistema de Notificações Push & Local
- **Expo Notifications**: Registro do push token do aparelho e envio automático para `POST /api/notificacoes/push-token`.
- **Canais Android**: Canal de alta prioridade configurado com vibração e luz LED azul `#2563EB`.
- **Notificações Locais Imediatas**: Disparo de confirmação nativa ao candidatar-se ou publicar uma vaga.
- **Diagnóstico no App**: Na tela de *Perfil*, é possível ver o token gerado e disparar notificações de teste.
- **Preferências Multi-Canal**: Switches integrados para ativar/desativar WhatsApp, E-mail e Push.

### 4. Componente Reutilizável `ModalConfirmacao`
Localizado em `src/components/ModalConfirmacao.js`, o modal utiliza animação suave e suporta três variantes visuais:
- `primary`: Ações informativas e de envio.
- `danger`: Ações de cancelamento, exclusão de vagas e encerramento de sessão.
- `success`: Confirmações de conclusão e contratação.
