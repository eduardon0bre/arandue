import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { ShieldAlert, Settings, ArrowLeft } from 'lucide-react';
import { useUser } from '../context/UserContext';
import Button from './Button';

export default function ProtectedRoute({ children, rolesPermitidos = [] }) {
  const { usuarioAtual, estaAutenticado } = useUser();
  const location = useLocation();

  // RF-06 e RF-07: Guarda de rotas para visitantes não autenticados
  if (!estaAutenticado || !usuarioAtual) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Se a rota possui restrição de papel (RBAC)
  if (rolesPermitidos.length > 0) {
    const papelUsuario = (usuarioAtual.tipo || '').toLowerCase();
    const papeisValidos = rolesPermitidos.map((r) => r.toLowerCase());

    const temPermissao = papelUsuario === 'ambos' || papeisValidos.includes(papelUsuario);

    if (!temPermissao) {
      return (
        <div className="container" style={{ maxWidth: '640px', padding: '3rem 1rem', textAlign: 'center' }}>
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '2.5rem 2rem',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'var(--danger-light)',
                color: 'var(--danger)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem'
              }}
            >
              <ShieldAlert size={28} />
            </div>

            <h2 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              Acesso Restrito ao Perfil
            </h2>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '1.75rem' }}>
              Seu perfil atual é <strong>{usuarioAtual.tipo}</strong>. Esta funcionalidade é restrita para contas do tipo{' '}
              <strong>{rolesPermitidos.join(' ou ')}</strong>.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link to="/">
                <Button variant="outline" icon={<ArrowLeft size={16} />}>
                  Voltar ao Mural
                </Button>
              </Link>
              <Link to="/configuracoes">
                <Button variant="primary" icon={<Settings size={16} />}>
                  Alterar Papel nas Configurações
                </Button>
              </Link>
            </div>
          </div>
        </div>
      );
    }
  }

  return children;
}
