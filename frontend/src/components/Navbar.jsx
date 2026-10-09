import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  PlusCircle,
  LayoutDashboard,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  LogIn,
  ChevronDown
} from 'lucide-react';
import { useUser } from '../context/UserContext';

export default function Navbar() {
  const navigate = useNavigate();
  const { usuarioAtual, estaAutenticado, logout } = useUser();
  const [mobileMenuAberto, setMobileMenuAberto] = useState(false);
  const [userDropdownAberto, setUserDropdownAberto] = useState(false);

  const fecharMenuMobile = () => {
    setMobileMenuAberto(false);
    setUserDropdownAberto(false);
  };

  const handleLogout = async () => {
    fecharMenuMobile();
    await logout();
    navigate('/');
  };

  // RF-09: Visibilidade do Currículo restrita a Diarista e Ambos
  const podeVerCurriculo =
    estaAutenticado && (usuarioAtual?.tipo === 'diarista' || usuarioAtual?.tipo === 'ambos');

  const podeCriarVaga =
    estaAutenticado && (usuarioAtual?.tipo === 'contratante' || usuarioAtual?.tipo === 'ambos');

  return (
    <header className="navbar">
      <div className="container navbar-container">
        <Link to="/" className="navbar-brand" onClick={fecharMenuMobile}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                backgroundColor: 'var(--primary)',
                color: '#fff',
                padding: '0.4rem',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Briefcase size={20} />
            </span>
            <span>Quadro de Diárias</span>
          </div>
        </Link>

        {/* Botão Hambúrguer Mobile */}
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={() => setMobileMenuAberto(!mobileMenuAberto)}
          aria-label={mobileMenuAberto ? 'Fechar menu' : 'Abrir menu'}
        >
          {mobileMenuAberto ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Links de Navegação Principal (Seção 4.1 da especificação) */}
        <nav className={`navbar-nav ${mobileMenuAberto ? 'open' : ''}`}>
          <NavLink
            to="/"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={fecharMenuMobile}
            end
          >
            <Briefcase size={17} />
            <span>Vagas Disponíveis</span>
          </NavLink>

          {/* Criar Vaga (visível no menu caso tenha permissão) */}
          {podeCriarVaga && (
            <NavLink
              to="/demandas/nova"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={fecharMenuMobile}
            >
              <PlusCircle size={17} />
              <span>Criar Vaga</span>
            </NavLink>
          )}

          {/* Minhas Demandas (Exige autenticação) */}
          {estaAutenticado && (
            <NavLink
              to="/minhas-demandas"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={fecharMenuMobile}
            >
              <LayoutDashboard size={17} />
              <span>Minhas Demandas</span>
            </NavLink>
          )}

          {/* Currículo (Visível apenas para Diarista e Ambos - RF-09) */}
          {podeVerCurriculo && (
            <NavLink
              to="/curriculo"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={fecharMenuMobile}
            >
              <FileText size={17} />
              <span>Currículo</span>
            </NavLink>
          )}

          {/* Estado Não Autenticado: Botão Entrar */}
          {!estaAutenticado && (
            <NavLink
              to="/login"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={fecharMenuMobile}
            >
              <LogIn size={17} />
              <span>Entrar</span>
            </NavLink>
          )}

          {/* Menu do Usuário Autenticado (Dropdown conforme Wireframe 4.1) */}
          {estaAutenticado && (
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setUserDropdownAberto(!userDropdownAberto)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-full)',
                  padding: '0.35rem 0.75rem',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '0.85rem',
                  color: 'var(--text-primary)'
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}
                >
                  {usuarioAtual?.nome?.charAt(0) || 'U'}
                </div>
                <span style={{ fontWeight: 600, maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {usuarioAtual?.nome?.split(' ')[0]}
                </span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    backgroundColor: 'var(--primary-light)',
                    color: 'var(--primary)',
                    padding: '0.1rem 0.35rem',
                    borderRadius: '4px',
                    fontWeight: 700,
                    textTransform: 'uppercase'
                  }}
                >
                  {usuarioAtual?.tipo}
                </span>
                <ChevronDown size={14} color="var(--text-muted)" />
              </button>

              {userDropdownAberto && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    right: 0,
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-md)',
                    minWidth: '200px',
                    padding: '0.5rem 0',
                    zIndex: 50
                  }}
                >
                  <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{usuarioAtual?.nome}</div>
                    <div style={{ color: 'var(--text-muted)' }}>{usuarioAtual?.email}</div>
                  </div>

                  <Link
                    to="/configuracoes"
                    onClick={fecharMenuMobile}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.6rem 1rem',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                      textDecoration: 'none'
                    }}
                  >
                    <Settings size={15} color="var(--text-muted)" />
                    <span>Configurações</span>
                  </Link>

                  <div style={{ borderTop: '1px solid var(--border-color)', margin: '0.25rem 0' }} />

                  <button
                    type="button"
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.6rem 1rem',
                      color: 'var(--danger)',
                      fontSize: '0.85rem',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'inherit'
                    }}
                  >
                    <LogOut size={15} />
                    <span>Sair da Conta (Logout)</span>
                  </button>
                </div>
              )}
            </div>
          )}

        </nav>
      </div>
    </header>
  );
}
