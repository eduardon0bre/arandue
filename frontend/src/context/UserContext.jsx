import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

// Perfis pré-cadastrados (baseados no seed.sql + perfil híbrido AMBOS)
export const PERFIS_SISTEMA = [
  { id: 1, nome: 'Carlos Mendes', email: 'carlos.mendes@buffetsabor.com.br', empresa: 'Buffet Sabor & Festa', tipo: 'contratante', bairro: 'Pinheiros', telefone: '11988887777' },
  { id: 2, nome: 'Mariana Ramos', email: 'mariana.ramos@logexpress.com.br', empresa: 'LogExpress Distribuição', tipo: 'contratante', bairro: 'Lapa', telefone: '11977776666' },
  { id: 3, nome: 'Roberto Silva', email: 'roberto.silva@silvareformas.com.br', empresa: 'Silva Reformas', tipo: 'contratante', bairro: 'Santana', telefone: '11966665555' },
  { id: 4, nome: 'Lucas Pereira', email: 'lucas.pereira@email.com', tipo: 'diarista', bairro: 'Centro', telefone: '11955554444' },
  { id: 5, nome: 'Juliana Costa', email: 'juliana.costa@email.com', tipo: 'diarista', bairro: 'Vila Mariana', telefone: '11944443333' },
  { id: 6, nome: 'Marcos Souza', email: 'marcos.souza@email.com', tipo: 'diarista', bairro: 'Mooca', telefone: '11933332222' },
  { id: 7, nome: 'Beatriz Lima', email: 'beatriz.lima@email.com', tipo: 'diarista', bairro: 'Tatuapé', telefone: '11922221111' },
  { id: 8, nome: 'Patrícia Prado', email: 'patricia.prado@email.com', tipo: 'ambos', bairro: 'Pinheiros', telefone: '11911110000' }
];

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
