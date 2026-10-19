/* oxlint-disable react/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

import { PERFIS_SISTEMA } from './perfisSistema';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [usuarioAtual, setUsuarioAtual] = useState(() => {
    const salvo = localStorage.getItem('arandue_usuario_ativo');
    if (salvo) {
      try {
        return JSON.parse(salvo);
      } catch {
        // Fallback se JSON inválido
      }
    }
    return null;
  });

  useEffect(() => {
    if (usuarioAtual) {
      localStorage.setItem('arandue_usuario_ativo', JSON.stringify(usuarioAtual));
    } else {
      localStorage.removeItem('arandue_usuario_ativo');
    }
  }, [usuarioAtual]);

  const trocarUsuario = (id) => {
    const encontrado = PERFIS_SISTEMA.find((u) => u.id === Number(id));
    if (encontrado) {
      setUsuarioAtual(encontrado);
    }
  };

  const login = (usuario) => {
    setUsuarioAtual(usuario);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignora falhas de rede no logout
    } finally {
      setUsuarioAtual(null);
      localStorage.removeItem('arandue_usuario_ativo');
    }
  };

  // RF-02: Atualização imediata do papel no perfil
  const atualizarPapel = async (novoPapel) => {
    const papelNormalizado = novoPapel.trim().toLowerCase();
    try {
      await api.patch('/users/me/role', { role: papelNormalizado });
    } catch {
      // Se a rota falhar offline, mantém a atualização de estado local
    }
    setUsuarioAtual((prev) => (prev ? { ...prev, tipo: papelNormalizado } : prev));
  };

  // Atualização de configurações cadastrais
  const atualizarPerfil = async (novosDados) => {
    setUsuarioAtual((prev) => (prev ? { ...prev, ...novosDados } : prev));
  };

  // RF-12: Exclusão lógica com anonimização
  const excluirConta = async (passwordConfirmation) => {
    await api.delete('/users/me', { data: { passwordConfirmation } });
    await logout();
  };

  return (
    <UserContext.Provider
      value={{
        usuarioAtual,
        estaAutenticado: Boolean(usuarioAtual),
        trocarUsuario,
        login,
        logout,
        atualizarPapel,
        atualizarPerfil,
        excluirConta,
        perfisDisponiveis: PERFIS_SISTEMA
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser deve ser utilizado dentro de um UserProvider');
  }
  return context;
}
