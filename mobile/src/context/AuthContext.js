import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { setApiUser } from '../services/api';

// Perfis padrão para demonstração rápida do Aranduê
export const USUARIOS_DEMO = {
  contratante: {
    id: 1,
    nome: 'Carlos Silva',
    email: 'carlos.silva@email.com',
    telefone: '(11) 98888-7777',
    tipo: 'contratante',
    bairro: 'Pinheiros',
    cidade: 'São Paulo - SP',
    notif_whatsapp: true,
    notif_email: true,
    notif_push: true,
    empresa: 'Buffet & Eventos Silva',
  },
  diarista: {
    id: 4,
    nome: 'Maria Santos',
    email: 'maria.santos@email.com',
    telefone: '(11) 97777-6666',
    tipo: 'diarista',
    bairro: 'Vila Mariana',
    cidade: 'São Paulo - SP',
    notif_whatsapp: true,
    notif_email: false,
    notif_push: true,
    experiencia: '4 anos',
  },
  ambos: {
    id: 8,
    nome: 'Ana Oliveira',
    email: 'ana.oliveira@email.com',
    telefone: '(11) 96666-5555',
    tipo: 'ambos',
    bairro: 'Perdizes',
    cidade: 'São Paulo - SP',
    notif_whatsapp: true,
    notif_email: true,
    notif_push: true,
  },
};

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  // Inicializa por padrão como Diarista (Maria Santos) para facilitar teste das telas de Agenda e Currículo
  const [usuario, setUsuario] = useState(USUARIOS_DEMO.diarista);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (usuario) {
      setApiUser(usuario);
    }
  }, [usuario]);

  // Login normal por e-mail e senha
  const login = async (email, senha) => {
    setCarregando(true);
    try {
      // Tenta via backend se online
      try {
        const response = await api.post('/auth/login', { email, senha });
        if (response?.data?.usuario || response?.data?.data) {
          const userObj = response.data.usuario || response.data.data;
          setUsuario(userObj);
          setApiUser(userObj, response.data.token);
          setCarregando(false);
          return { success: true, user: userObj };
        }
      } catch (backendError) {
        // Se a API estiver offline ou simulação local, procura nas contas demo
        const match = Object.values(USUARIOS_DEMO).find(
          (u) => u.email.toLowerCase() === (email || '').trim().toLowerCase()
        );
        if (match) {
          setUsuario(match);
          setApiUser(match);
          setCarregando(false);
          return { success: true, user: match };
        }
      }

      // Se não encontrou, cria perfil dinâmico com o e-mail informado
      const novoUsuario = {
        id: 99,
        nome: email ? email.split('@')[0] : 'Usuário Aranduê',
        email: email,
        tipo: 'diarista',
        bairro: 'São Paulo',
        telefone: '',
        notif_whatsapp: true,
        notif_email: true,
        notif_push: true,
      };
      setUsuario(novoUsuario);
      setApiUser(novoUsuario);
      setCarregando(false);
      return { success: true, user: novoUsuario };
    } catch (err) {
      setCarregando(false);
      return { success: false, message: err.message };
    }
  };

  // Login rápido de demonstração
  const loginComoDemo = (tipo) => {
    const perfil = USUARIOS_DEMO[tipo] || USUARIOS_DEMO.diarista;
    setUsuario(perfil);
    setApiUser(perfil);
    return perfil;
  };

  // Login simulado com Google OAuth
  const loginComGoogle = async () => {
    setCarregando(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    const googleUser = {
      id: 10,
      nome: 'Ana Oliveira (Google)',
      email: 'ana.oliveira@gmail.com',
      telefone: '',
      tipo: 'ambos',
      bairro: 'Pinheiros',
      notif_whatsapp: true,
      notif_email: true,
      notif_push: true,
      foto_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    };
    setUsuario(googleUser);
    setApiUser(googleUser);
    setCarregando(false);
    return googleUser;
  };

  const logout = () => {
    setUsuario(null);
    setApiUser(null);
  };

  const atualizarPapel = async (novoPapel) => {
    const papelNorm = novoPapel.toLowerCase();
    try {
      await api.patch('/perfil/me/role', { role: papelNorm });
    } catch {
      // Fallback local caso offline
    }
    setUsuario((prev) => (prev ? { ...prev, tipo: papelNorm } : prev));
  };

  const atualizarPerfil = (novosDados) => {
    setUsuario((prev) => (prev ? { ...prev, ...novosDados } : prev));
  };

  const alternarPerfilTeste = (tipo) => {
    return loginComoDemo(tipo);
  };

  const atualizarPreferenciasNotificacao = async (novasPrefs) => {
    try {
      await api.put('/configuracoes', novasPrefs);
    } catch {
      // Fallback local se offline
    }
    setUsuario((prev) => (prev ? { ...prev, ...novasPrefs } : prev));
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        user: usuario, // alias compatível
        usuarioAtual: usuario, // alias compatível
        perfilAtivo: usuario?.tipo || 'ambos',
        estaAutenticado: Boolean(usuario),
        carregando,
        login,
        loginComoDemo,
        loginComGoogle,
        alternarPerfilTeste,
        atualizarPreferenciasNotificacao,
        logout,
        atualizarPapel,
        atualizarPerfil,
        perfisDemo: USUARIOS_DEMO,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    // Retorna fallback seguro para não quebrar caso renderizado sem Provider
    return {
      usuario: USUARIOS_DEMO.diarista,
      user: USUARIOS_DEMO.diarista,
      usuarioAtual: USUARIOS_DEMO.diarista,
      estaAutenticado: true,
      carregando: false,
      login: async () => ({ success: true }),
      loginComoDemo: () => USUARIOS_DEMO.diarista,
      loginComGoogle: async () => USUARIOS_DEMO.ambos,
      logout: () => {},
      atualizarPapel: () => {},
      atualizarPerfil: () => {},
      perfisDemo: USUARIOS_DEMO,
    };
  }
  return context;
}

export default AuthContext;
