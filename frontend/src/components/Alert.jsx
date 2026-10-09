import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export default function Alert({
  type = 'info',
  title,
  message,
  children,
  onClose
}) {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={18} />;
      case 'danger':
        return <AlertCircle size={18} />;
      case 'warning':
        return <AlertTriangle size={18} />;
      default:
        return <Info size={18} />;
    }
  };

  return (
    <div className={`alert alert-${type}`} role="alert">
      <div style={{ flexShrink: 0, marginTop: '2px' }}>{getIcon()}</div>
      <div style={{ flex: 1 }}>
        {title && <strong style={{ display: 'block', marginBottom: '0.2rem' }}>{title}</strong>}
        {message && <div>{message}</div>}
        {children}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            color: 'inherit',
            opacity: 0.7
          }}
          aria-label="Fechar alerta"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
