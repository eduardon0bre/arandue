import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export default function Alert({
  type = 'info',
  title,
  message,
  children,
  onClose,
  popup = false,
  autoDismiss = 4000
}) {
  useEffect(() => {
    if (!popup || !autoDismiss || !onClose) return;
    const timer = setTimeout(() => {
      onClose();
    }, autoDismiss);
    return () => clearTimeout(timer);
  }, [popup, autoDismiss, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={popup ? 19 : 18} />;
      case 'danger':
      case 'error':
        return <AlertCircle size={popup ? 19 : 18} />;
      case 'warning':
        return <AlertTriangle size={popup ? 19 : 18} />;
      default:
        return <Info size={popup ? 19 : 18} />;
    }
  };

  if (popup) {
    const isSuccess = type === 'success';
    const isDanger = type === 'danger' || type === 'error';
    const isWarning = type === 'warning';

    const borderColor = isSuccess
      ? 'var(--success-border)'
      : isDanger
      ? 'var(--danger-border)'
      : isWarning
      ? 'var(--warning-border)'
      : 'var(--info-border)';

    const iconBg = isSuccess
      ? 'var(--success-light)'
      : isDanger
      ? 'var(--danger-light)'
      : isWarning
      ? 'var(--warning-light)'
      : 'var(--info-light)';

    const iconColor = isSuccess
      ? 'var(--success)'
      : isDanger
      ? 'var(--danger)'
      : isWarning
      ? 'var(--warning)'
      : 'var(--info)';

    return (
      <div
        className="toast-notification"
        style={{
          backgroundColor: '#ffffff',
          border: `1.5px solid ${borderColor}`,
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem 1.15rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          animation: 'fadeIn 0.2s ease-out'
        }}
        role="status"
        aria-live="polite"
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: iconBg,
            color: iconColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          {getIcon()}
        </div>

        <div style={{ flex: 1, fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 600, lineHeight: 1.4 }}>
          {title && <strong style={{ display: 'block', marginBottom: '0.15rem' }}>{title}</strong>}
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
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.2rem',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '4px'
            }}
            aria-label="Fechar pop-up"
          >
            <X size={16} />
          </button>
        )}
      </div>
    );
  }

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
