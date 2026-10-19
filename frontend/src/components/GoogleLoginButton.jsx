import React, { useState, useEffect } from 'react';
import { X, UserPlus, AlertTriangle, ArrowRight } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import api from '../services/api';
import styles from './GoogleLoginButton.module.css';

/**
 * Ícone SVG oficial do Google (4 cores)
 */
function GoogleSvgIcon({ className = styles.googleIcon }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

const CONTAS_PADRAO = [
  {
    name: 'Tramontina',
    email: 'tramontina9299@gmail.com'
  },
  {
    name: 'Admin Teste',
    email: 'admin@gmail.com'
  }
];

export default function GoogleLoginButton({
  onSuccess,
  onError,
  role = 'contratante',
  disabled = false
}) {
  const [carregando, setCarregando] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [modoNovaConta, setModoNovaConta] = useState(false);
  const [novoEmail, setNovoEmail] = useState('');
  const [novoNome, setNovoNome] = useState('');
  const [erroForm, setErroForm] = useState(null);

  const isGoogleConfigurado = Boolean(
    import.meta.env.VITE_GOOGLE_CLIENT_ID &&
    import.meta.env.VITE_GOOGLE_CLIENT_ID.trim() !== '' &&
    import.meta.env.VITE_GOOGLE_CLIENT_ID !== 'dummy-google-client-id'
  );

  const [contasSalvas, setContasSalvas] = useState(() => {
    try {
      const salvo = localStorage.getItem('arandue_contas_google');
      if (salvo) return JSON.parse(salvo);
    } catch {}
    return CONTAS_PADRAO;
  });

  useEffect(() => {
    try {
      localStorage.setItem('arandue_contas_google', JSON.stringify(contasSalvas));
    } catch {}
  }, [contasSalvas]);

  const executarLoginComConta = async (conta, googleToken = null) => {
    try {
      setCarregando(true);
      setModalAberto(false);
      setModoNovaConta(false);

      // Salva ou atualiza a conta usada recentemente na lista
      if (conta.email) {
        setContasSalvas((prev) => {
          const filtrada = prev.filter((c) => c.email.toLowerCase() !== conta.email.toLowerCase());
          return [conta, ...filtrada];
        });
      }

      const res = await api.post('/auth/google', {
        token: googleToken || 'mock_google_session',
        email: conta.email.trim().toLowerCase(),
        name: conta.name?.trim() || conta.email.split('@')[0],
        google_id: conta.sub || `google_${conta.email.replace(/[^a-zA-Z0-9]/g, '_')}`,
        picture: conta.picture || null,
        role: role
      });

      if (res.data?.success) {
        const usuario = res.data.user || res.data.data;
        if (onSuccess) {
          onSuccess(usuario, res.data);
        }
      } else {
        throw new Error(res.data?.message || 'Falha ao autenticar com o Google.');
      }
    } catch (err) {
      console.error('Erro na autenticação com o Google:', err);
      const msg = err.response?.data?.message || err.message || 'Erro ao conectar com o Google.';
      if (onError) {
        onError(msg);
      }
    } finally {
      setCarregando(false);
    }
  };

  // Seletor de contas oficial do Google via OAuth popup
  const loginGoogleReal = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setCarregando(true);
        setModalAberto(false);
        setModoNovaConta(false);

        let nome = '';
        let email = '';
        let picture = null;
        let sub = '';

        try {
          const resInfo = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`
            }
          });
          if (resInfo.data) {
            email = resInfo.data.email;
            nome = resInfo.data.name || email?.split('@')[0];
            picture = resInfo.data.picture || null;
            sub = resInfo.data.sub;
          }
        } catch (infoErr) {
          console.warn('Não foi possível obter dados detalhados via Google userinfo:', infoErr);
        }

        const conta = {
          name: nome || 'Conta Google',
          email: email,
          picture: picture,
          sub: sub
        };

        if (email) {
          setContasSalvas((prev) => {
            const filtrada = prev.filter((c) => c.email.toLowerCase() !== email.toLowerCase());
            return [conta, ...filtrada];
          });
        }

        await executarLoginComConta(conta, tokenResponse.access_token);
      } catch (err) {
        console.error('Erro após autenticação no Google:', err);
        const msg = err.response?.data?.message || err.message || 'Erro ao conectar com o Google.';
        if (onError) onError(msg);
      } finally {
        setCarregando(false);
      }
    },
    onError: (err) => {
      console.error('Erro no seletor de contas do Google:', err);
      setCarregando(false);
      if (err?.error !== 'popup_closed_by_user') {
        const msg =
          err?.error_description ||
          err?.details ||
          'Não foi possível abrir o seletor de contas do Google.';
        if (onError) onError(msg);
      }
    },
    flow: 'implicit',
    prompt: 'select_account'
  });

  const handleUsarOutraConta = () => {
    if (isGoogleConfigurado) {
      setModalAberto(false);
      try {
        loginGoogleReal();
      } catch (err) {
        console.error('Erro ao acionar o seletor de contas do Google:', err);
        if (onError) onError('Não foi possível abrir o seletor do Google.');
      }
    } else {
      setModoNovaConta(true);
      setErroForm(null);
    }
  };

  const handleSubmeterNovaConta = (e) => {
    e.preventDefault();
    setErroForm(null);

    const emailLimpo = novoEmail.trim().toLowerCase();
    if (!emailLimpo || !/\S+@\S+\.\S+/.test(emailLimpo)) {
      setErroForm('Informe um e-mail válido.');
      return;
    }

    const nomeCalculado = novoNome.trim() || emailLimpo.split('@')[0];
    const contaCriada = {
      name: nomeCalculado,
      email: emailLimpo
    };

    setModoNovaConta(false);
    setNovoEmail('');
    setNovoNome('');
    executarLoginComConta(contaCriada);
  };

  const handleBotaoPrincipalClick = () => {
    setModoNovaConta(false);
    setModalAberto(true);
  };

  return (
    <>
      <div className={styles.googleButtonWrapper}>
        <button
          type="button"
          className={styles.customGoogleBtn}
          onClick={handleBotaoPrincipalClick}
          disabled={disabled || carregando}
        >
          {carregando ? (
            <>
              <span className={styles.spinner} aria-hidden="true" />
              <span className={styles.btnText}>Conectando ao Google...</span>
            </>
          ) : (
            <>
              <GoogleSvgIcon />
              <span className={styles.btnText}>Continuar com o Google</span>
            </>
          )}
        </button>

        <div className={styles.divider}>
          <span>ou continue com e-mail</span>
        </div>
      </div>

      {/* Modal de Escolha de Conta do Google */}
      {modalAberto && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget && !carregando) {
              setModalAberto(false);
              setModoNovaConta(false);
            }
          }}
        >
          <div className={styles.modalCard}>
            <button
              type="button"
              className={styles.closeButton}
              onClick={() => {
                setModalAberto(false);
                setModoNovaConta(false);
              }}
              disabled={carregando}
              aria-label="Fechar"
            >
              <X size={18} />
            </button>

            <div className={styles.modalHeader}>
              <GoogleSvgIcon className={styles.modalGoogleLogo} />
              <h2 className={styles.modalTitle}>Fazer login com o Google</h2>
              <p className={styles.modalSubtitle}>
                {modoNovaConta
                  ? 'Digite o e-mail da conta Google para testar'
                  : 'Escolha uma conta para continuar'}
              </p>
            </div>

            {!isGoogleConfigurado && (
              <div className={styles.envWarningBanner}>
                <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  <strong>Aviso:</strong> Para abrir o popup oficial do Google sem o <strong>Erro 401</strong>, configure <code>VITE_GOOGLE_CLIENT_ID</code> no arquivo <code>frontend/.env</code>.
                </span>
              </div>
            )}

            {!modoNovaConta ? (
              <div className={styles.accountList}>
                {contasSalvas.map((conta) => (
                  <button
                    key={conta.email}
                    type="button"
                    className={styles.accountItem}
                    onClick={() => executarLoginComConta(conta)}
                    disabled={carregando}
                  >
                    {conta.picture ? (
                      <img
                        src={conta.picture}
                        alt={conta.name}
                        className={styles.avatarImg}
                      />
                    ) : (
                      <div className={styles.avatarCircle}>
                        {(conta.name || conta.email).charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className={styles.accountDetails}>
                      <span className={styles.accountName}>{conta.name}</span>
                      <span className={styles.accountEmail}>{conta.email}</span>
                    </div>
                  </button>
                ))}

                <button
                  type="button"
                  className={styles.addAccountBtn}
                  onClick={handleUsarOutraConta}
                  disabled={carregando}
                >
                  <div className={styles.addIconCircle}>
                    <UserPlus size={18} />
                  </div>
                  <span>Usar outra conta</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmeterNovaConta} className={styles.customEmailForm}>
                {erroForm && (
                  <div style={{ color: '#ef4444', fontSize: '0.82rem', padding: '0.25rem 0' }}>
                    {erroForm}
                  </div>
                )}

                <input
                  type="email"
                  placeholder="E-mail do Google (ex: outra.conta@gmail.com)"
                  value={novoEmail}
                  onChange={(e) => setNovoEmail(e.target.value)}
                  className={styles.formInput}
                  autoFocus
                  required
                />

                <input
                  type="text"
                  placeholder="Nome do Usuário (opcional)"
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  className={styles.formInput}
                />

                <div className={styles.formActions}>
                  <button
                    type="button"
                    className={styles.cancelBtn}
                    onClick={() => setModoNovaConta(false)}
                  >
                    Voltar
                  </button>

                  <button type="submit" className={styles.confirmBtn} disabled={!novoEmail.trim()}>
                    <span>Acessar</span>
                    <ArrowRight size={16} />
                  </button>
                </div>

                <button
                  type="button"
                  className={styles.forceGoogleBtn}
                  onClick={() => {
                    setModalAberto(false);
                    setModoNovaConta(false);
                    loginGoogleReal();
                  }}
                >
                  Tentar abrir janela oficial do Google mesmo assim
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
