import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Home } from 'lucide-react';
import Button from '../components/Button';

export default function NotFound() {
  return (
    <div className="container" style={{ textAlign: 'center', padding: '5rem 1rem' }}>
      <div style={{
        display: 'inline-flex',
        padding: '1.25rem',
        borderRadius: '50%',
        backgroundColor: 'var(--primary-light)',
        color: 'var(--primary)',
        marginBottom: '1.5rem'
      }}>
        <AlertCircle size={48} />
      </div>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>404 - Página Não Encontrada</h1>
      <p style={{ maxWidth: '500px', margin: '0 auto 2rem', color: 'var(--text-muted)' }}>
        A página que você tentou acessar não existe ou foi movida. Retorne ao mural de oportunidades.
      </p>
      <Link to="/">
        <Button variant="primary" icon={<Home size={16} />}>
          Voltar ao Mural de Vagas
        </Button>
      </Link>
    </div>
  );
}
