import React from 'react';

export default function LoadingSpinner({
  text = 'Carregando dados...',
  size = 'md',
  fullPage = false
}) {
  const sizeClass = size === 'lg' ? 'spinner-lg' : '';

  const content = (
    <div className="flex flex-col items-center justify-between gap-4" style={{ padding: '2rem 1rem' }}>
      <div className={`spinner ${sizeClass}`} style={{ color: 'var(--primary)', borderColor: 'var(--border-color)', borderTopColor: 'var(--primary)' }} />
      {text && <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>{text}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        {content}
      </div>
    );
  }

  return content;
}
