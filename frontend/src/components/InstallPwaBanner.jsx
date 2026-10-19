import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'arandue_pwa_banner_dismissed';

export default function InstallPwaBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS] = useState(() => {
    if (typeof window === 'undefined') return false;
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios|android/.test(userAgent);
    return isIosDevice && isSafari;
  });

  useEffect(() => {
    // 1. Verifica se já está rodando em modo standalone (PWA instalado)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      return;
    }

    // 2. Verifica se o usuário dispensou o banner nesta sessão ou recentemente
    const isDismissed = localStorage.getItem(STORAGE_KEY);
    if (isDismissed) {
      const dismissedTimestamp = parseInt(isDismissed, 10);
      const daysPassed = (Date.now() - dismissedTimestamp) / (1000 * 60 * 60 * 24);
      // Se dispensou há menos de 7 dias, não mostra novamente
      if (daysPassed < 7) {
        return;
      }
    }

    // 3. Detecção de dispositivo iOS Safari
    if (isIOS) {
      // Opcional: mostrar após 3 segundos no iOS se não estiver em standalone
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    // 4. Captura do evento padrão de PWA 'beforeinstallprompt'
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Evento quando o app for instalado com sucesso
    const handleAppInstalled = () => {
      setIsVisible(false);
      setDeferredPrompt(null);
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isIOS]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;

    if (choiceResult.outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
  };

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Instalação do Aplicativo"
      style={{
        position: 'fixed',
        bottom: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        width: 'calc(100% - 32px)',
        maxWidth: '480px',
        backgroundColor: '#0f172a',
        color: '#f8fafc',
        borderRadius: '16px',
        padding: '14px 18px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
        border: '1px solid #1e293b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        backdropFilter: 'blur(8px)',
        animation: 'slideUp 0.3s ease-out'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
        <img
          src="/favicon.svg"
          alt="Aranduê Logo"
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            backgroundColor: '#1e293b',
            padding: '4px',
            flexShrink: 0
          }}
        />
        <div style={{ minWidth: 0 }}>
          <h4
            style={{
              margin: 0,
              fontSize: '0.92rem',
              fontWeight: 600,
              color: '#ffffff',
              lineHeight: 1.2
            }}
          >
            Instale o App Aranduê
          </h4>
          <p
            style={{
              margin: '3px 0 0 0',
              fontSize: '0.78rem',
              color: '#94a3b8',
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {isIOS
              ? 'Toque no ícone Compartilhar ⎋ e "Adicionar à Tela de Início"'
              : 'Acesso rápido a vagas e diárias na tela inicial'}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {!isIOS && deferredPrompt && (
          <button
            onClick={handleInstallClick}
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background-color 0.2s',
              boxShadow: '0 2px 4px rgba(37, 99, 235, 0.3)'
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
          >
            Instalar
          </button>
        )}
        <button
          onClick={handleDismiss}
          aria-label="Fechar aviso de instalação"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
            lineHeight: 1,
            transition: 'color 0.2s'
          }}
          onMouseOver={(e) => (e.currentTarget.style.color = '#e2e8f0')}
          onMouseOut={(e) => (e.currentTarget.style.color = '#64748b')}
        >
          ✕
        </button>
      </div>
    </aside>
  );
}
