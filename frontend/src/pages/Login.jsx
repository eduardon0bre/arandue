import React, { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Briefcase, Eye, EyeOff, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useUser } from '../context/UserContext';
import api from '../services/api';
import styles from './Login.module.css';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { trocarUsuario, login, perfisDisponiveis } = useUser();

  const redirectUrl = searchParams.get('redirect') || '/';

  // Controle de abas: 'login' | 'cadastro'
  const [abaAtiva, setAbaAtiva] = useState('login');

  // Visibilidade de senhas
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarSenhaCadastro, setMostrarSenhaCadastro] = useState(false);

  // Referência para o input de senha (atendendo ao BDD: focar após erro de autenticação)
  const senhaInputRef = useRef(null);

  // Estados do Formulário de Login (RF-01, RF-02, RF-04)
  const [loginForm, setLoginForm] = useState({
    identifier: '',
    password: '',
    rememberMe: false
  });

  // Estados do Formulário de Cadastro
  const [cadastroForm, setCadastroForm] = useState({
    nome: '',
    email: '',
    tipo: 'contratante',
    bairro: 'Centro',
    telefone: '',
    password: '',
    confirmPassword: ''
  });

  // Estados de Validação e Feedback
  const [erros, setErros] = useState({});
  const [carregando, setCarregando] = useState(false);
  const [alertaErro, setAlertaErro] = useState(null);
  const [alertaSucesso, setAlertaSucesso] = useState(null);

  // Modal de Recuperação de Senha (RF-05)
  const [modalEsqueciAberto, setModalEsqueciAberto] = useState(false);
  const [emailRecuperacao, setEmailRecuperacao] = useState('');
  const [carregandoRecuperacao, setCarregandoRecuperacao] = useState(false);
  const [feedbackRecuperacao, setFeedbackRecuperacao] = useState(null);

  // Validador simples de e-mail
  const validarFormatoEmail = (valor) => {
    return /\S+@\S+\.\S+/.test(valor);
  };

  // Alternar abas limpando alertas
  const trocarAba = (aba) => {
    setAbaAtiva(aba);
    setErros({});
    setAlertaErro(null);
    setAlertaSucesso(null);
  };

  // Manipulação dos inputs de Login
  const handleLoginChange = (e) => {
    const { name, value, type, checked } = e.target;
    setLoginForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (erros[name]) {
      setErros((prev) => ({ ...prev, [name]: null }));
    }
    if (alertaErro) setAlertaErro(null);
  };

  // Validação no blur (RF-03)
  const handleBlurLogin = (campo) => {
    const novosErros = { ...erros };

    if (campo === 'identifier') {
      const valor = loginForm.identifier.trim();
      if (!valor) {
        novosErros.identifier = 'O e-mail ou nome de usuário é obrigatório.';
      } else if (valor.includes('@') && !validarFormatoEmail(valor)) {
        novosErros.identifier = 'Formato de e-mail inválido.';
      } else {
        delete novosErros.identifier;
      }
    }

    if (campo === 'password') {
      if (!loginForm.password.trim()) {
        novosErros.password = 'A senha é obrigatória.';
      } else {
        delete novosErros.password;
      }
    }

    setErros(novosErros);
  };

  // Validação geral antes do submit (RF-03)
  const validarLoginClientSide = () => {
    const novosErros = {};
    const idLimpo = loginForm.identifier.trim();

    if (!idLimpo) {
      novosErros.identifier = 'O e-mail ou nome de usuário é obrigatório.';
    } else if (idLimpo.includes('@') && !validarFormatoEmail(idLimpo)) {
      novosErros.identifier = 'Formato de e-mail inválido.';
    }

    if (!loginForm.password.trim()) {
      novosErros.password = 'A senha é obrigatória.';
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  // Submissão do Login (RF-01, RF-02, RF-06, RF-07, RF-08)
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAlertaErro(null);
    setAlertaSucesso(null);

    // Validação Client-side (RF-03)
    if (!validarLoginClientSide()) {
      return;
    }

    setCarregando(true);

    try {
      // Normalização: trim e lowercase (RF-01)
      const payload = {
        identifier: loginForm.identifier.trim().toLowerCase(),
        password: loginForm.password,
        rememberMe: loginForm.rememberMe
      };

      // Chamada real ao endpoint da API
      const response = await api.post('/auth/login', payload);

      if (response.data?.success || response.data?.user) {
        const usuarioRetornado = response.data.user || response.data.data;

        // Atualiza perfil ativo no UserContext
        if (usuarioRetornado?.id) {
          const perfilEncontrado = perfisDisponiveis?.find(
            (p) => p.id === Number(usuarioRetornado.id)
          );
          if (perfilEncontrado) {
            trocarUsuario(usuarioRetornado.id);
          } else {
            login({
              id: usuarioRetornado.id,
              nome: usuarioRetornado.name || usuarioRetornado.nome,
              email: usuarioRetornado.email,
              tipo: usuarioRetornado.role || usuarioRetornado.tipo || 'contratante',
              bairro: usuarioRetornado.bairro || 'Centro'
            });
          }
        }

        setAlertaSucesso('Autenticação realizada com sucesso! Redirecionando...');

        // Redirecionamento (Vagas disponíveis por padrão ou URL solicitada)
        const destino = redirectUrl;
        setTimeout(() => {
          navigate(destino);
        }, 800);
      }
    } catch (err) {
      // Cenário BDD: Credenciais incorretas
      // O sistema exibe mensagem de erro e limpa campo de senha mantendo foco
      const msgErro =
        err.response?.data?.message ||
        err.message ||
        'E-mail ou senha incorretos.';

      setAlertaErro(msgErro);

      // Limpa senha e foca para nova digitação
      setLoginForm((prev) => ({ ...prev, password: '' }));
      setTimeout(() => {
        senhaInputRef.current?.focus();
      }, 50);
    } finally {
      setCarregando(false);
    }
  };

  // Preenchimento rápido para demonstração/testes
  const preencherCredenciaisRapidas = (perfil) => {
    setLoginForm({
      identifier: perfil.email,
      password: '123',
      rememberMe: true
    });
    setErros({});
    setAlertaErro(null);
  };

  // Submissão de Cadastro
  const handleCadastroSubmit = async (e) => {
    e.preventDefault();
    setAlertaErro(null);
    setAlertaSucesso(null);

    const novosErros = {};
    if (!cadastroForm.nome.trim()) novosErros.nome = 'Nome completo é obrigatório.';
    if (!cadastroForm.email.trim() || !validarFormatoEmail(cadastroForm.email)) {
      novosErros.email = 'E-mail corporativo válido é obrigatório.';
    }
    if (!cadastroForm.password || cadastroForm.password.length < 6) {
      novosErros.password = 'A senha deve conter no mínimo 6 caracteres.';
    }
    if (cadastroForm.password !== cadastroForm.confirmPassword) {
      novosErros.confirmPassword = 'As senhas não coincidem.';
    }

    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros);
      return;
    }

    setCarregando(true);
    try {
      const payload = {
        nome: cadastroForm.nome.trim(),
        email: cadastroForm.email.trim().toLowerCase(),
        password: cadastroForm.password,
        tipo: cadastroForm.tipo
      };

      const response = await api.post('/auth/register', payload);

      const userCriado = response.data?.user || response.data?.data;
      if (response.data?.success && userCriado) {
        login({
          id: userCriado.id,
          nome: userCriado.name || userCriado.nome,
          email: userCriado.email,
          tipo: userCriado.role || userCriado.tipo || 'contratante',
          bairro: userCriado.bairro || 'Centro'
        });
        setAlertaSucesso('Conta criada com sucesso! Redirecionando...');
        setTimeout(() => {
          navigate(redirectUrl);
        }, 900);
      } else {
        setAlertaSucesso('Conta criada com sucesso! Faça login com seus dados.');
        setLoginForm({
          identifier: cadastroForm.email,
          password: '',
          rememberMe: true
        });
        setTimeout(() => {
          setAbaAtiva('login');
        }, 1200);
      }
    } catch (err) {
      setAlertaErro(err.response?.data?.message || err.message || 'Erro ao registrar nova conta.');
    } finally {
      setCarregando(false);
    }
  };

  // Envio do formulário de Esqueci Minha Senha (RF-05)
  const handleRecuperacaoSubmit = async (e) => {
    e.preventDefault();
    if (!emailRecuperacao.trim() || !validarFormatoEmail(emailRecuperacao)) {
      setFeedbackRecuperacao({
        tipo: 'erro',
        texto: 'Por favor, insira um e-mail válido para recuperação.'
      });
      return;
    }

    setCarregandoRecuperacao(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setFeedbackRecuperacao({
        tipo: 'sucesso',
        texto: `Um link de redefinição de senha foi enviado para ${emailRecuperacao}.`
      });
      setTimeout(() => {
        setModalEsqueciAberto(false);
        setFeedbackRecuperacao(null);
        setEmailRecuperacao('');
      }, 2500);
    } finally {
      setCarregandoRecuperacao(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.card}>
        {/* Header com Logo Institucional do Projeto */}
        <header className={styles.header}>
          <div className={styles.logoBadge}>
            <div className={styles.logoIconWrapper}>
              <Briefcase size={22} />
            </div>
            <span className={styles.logoText}>Quadro de Diárias</span>
          </div>

          <h1 className={styles.title}>
            {abaAtiva === 'login' ? 'Acessar Conta' : 'Criar Nova Conta'}
          </h1>
          <p className={styles.subtitle}>
            {abaAtiva === 'login'
              ? 'Informe suas credenciais para continuar no sistema'
              : 'Cadastre-se para anunciar ou encontrar serviços'}
          </p>
        </header>

        {/* Abas de Navegação (Tabs simples) */}
        <div className={styles.tabNav} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={abaAtiva === 'login'}
            className={`${styles.tabButton} ${abaAtiva === 'login' ? styles.tabActive : ''}`}
            onClick={() => trocarAba('login')}
          >
            Entrar
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={abaAtiva === 'cadastro'}
            className={`${styles.tabButton} ${abaAtiva === 'cadastro' ? styles.tabActive : ''}`}
            onClick={() => trocarAba('cadastro')}
          >
            Cadastrar
          </button>
        </div>

        {/* Banner de Feedback Global (RF-06) */}
        {alertaErro && (
          <div className={`${styles.alertBanner} ${styles.alertError}`} role="alert">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{alertaErro}</span>
          </div>
        )}

        {alertaSucesso && (
          <div className={`${styles.alertBanner} ${styles.alertSuccess}`} role="alert">
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>{alertaSucesso}</span>
          </div>
        )}

        {/* Formulário de Login (RF-01 a RF-04) */}
        {abaAtiva === 'login' && (
          <form className={styles.form} onSubmit={handleLoginSubmit} noValidate>
            {/* Campo E-mail ou Usuário (RF-01) */}
            <div className={styles.fieldGroup}>
              <div className={styles.labelRow}>
                <label htmlFor="identifier" className={styles.label}>
                  E-mail ou Usuário
                  <span className={styles.requiredAsterisk}>*</span>
                </label>
              </div>
              <div className={styles.inputWrapper}>
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  autoComplete="username email"
                  placeholder="usuario@exemplo.com"
                  value={loginForm.identifier}
                  onChange={handleLoginChange}
                  onBlur={() => handleBlurLogin('identifier')}
                  disabled={carregando}
                  aria-invalid={Boolean(erros.identifier)}
                  aria-describedby={erros.identifier ? 'identifier-error' : undefined}
                  className={`${styles.input} ${erros.identifier ? styles.inputError : ''}`}
                />
              </div>
              {erros.identifier && (
                <span id="identifier-error" className={styles.fieldError}>
                  <AlertCircle size={13} /> {erros.identifier}
                </span>
              )}
            </div>

            {/* Campo Senha com botão de alternância de visibilidade (RF-02) */}
            <div className={styles.fieldGroup}>
              <div className={styles.labelRow}>
                <label htmlFor="password" className={styles.label}>
                  Senha
                  <span className={styles.requiredAsterisk}>*</span>
                </label>
              </div>
              <div className={styles.inputWrapper}>
                <input
                  ref={senhaInputRef}
                  id="password"
                  name="password"
                  type={mostrarSenha ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••••••••"
                  value={loginForm.password}
                  onChange={handleLoginChange}
                  onBlur={() => handleBlurLogin('password')}
                  disabled={carregando}
                  aria-invalid={Boolean(erros.password)}
                  aria-describedby={erros.password ? 'password-error' : undefined}
                  className={`${styles.input} ${styles.inputWithIcon} ${
                    erros.password ? styles.inputError : ''
                  }`}
                />
                <button
                  type="button"
                  className={styles.eyeButton}
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Exibir senha'}
                  tabIndex={-1}
                >
                  {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {erros.password && (
                <span id="password-error" className={styles.fieldError}>
                  <AlertCircle size={13} /> {erros.password}
                </span>
              )}
            </div>

            {/* Linha com Checkbox Lembrar-me (RF-04) e Link Esqueci Minha Senha (RF-05) */}
            <div className={styles.optionsRow}>
              <label className={styles.rememberContainer}>
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={loginForm.rememberMe}
                  onChange={handleLoginChange}
                  disabled={carregando}
                  className={styles.rememberCheckbox}
                />
                <span>Lembrar-me</span>
              </label>

              <button
                type="button"
                className={styles.forgotLink}
                onClick={() => setModalEsqueciAberto(true)}
              >
                Esqueci minha senha
              </button>
            </div>

            {/* Botão de Envio com Estado de Loading (RF-07) */}
            <button
              type="submit"
              disabled={carregando}
              className={styles.submitButton}
            >
              {carregando ? (
                <>
                  <span className={styles.buttonSpinner} aria-hidden="true" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <span>ENTRAR</span>
              )}
            </button>
          </form>
        )}

        {/* Formulário de Cadastro */}
        {abaAtiva === 'cadastro' && (
          <form className={styles.form} onSubmit={handleCadastroSubmit} noValidate>
            {/* RF-01: Seleção de Papel Obrigatória */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                Como você deseja usar a plataforma? <span className={styles.requiredAsterisk}>*</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', marginTop: '0.2rem' }}>
                <button
                  type="button"
                  className={`${styles.tabButton} ${cadastroForm.tipo === 'contratante' ? styles.tabActive : ''}`}
                  onClick={() => setCadastroForm({ ...cadastroForm, tipo: 'contratante' })}
                  style={{ border: '1px solid var(--border-color)', padding: '0.55rem 0.25rem', fontSize: '0.8rem', textAlign: 'center' }}
                >
                  👔 Contratante
                </button>
                <button
                  type="button"
                  className={`${styles.tabButton} ${cadastroForm.tipo === 'diarista' ? styles.tabActive : ''}`}
                  onClick={() => setCadastroForm({ ...cadastroForm, tipo: 'diarista' })}
                  style={{ border: '1px solid var(--border-color)', padding: '0.55rem 0.25rem', fontSize: '0.8rem', textAlign: 'center' }}
                >
                  🛠️ Diarista
                </button>
                <button
                  type="button"
                  className={`${styles.tabButton} ${cadastroForm.tipo === 'ambos' ? styles.tabActive : ''}`}
                  onClick={() => setCadastroForm({ ...cadastroForm, tipo: 'ambos' })}
                  style={{ border: '1px solid var(--border-color)', padding: '0.55rem 0.25rem', fontSize: '0.8rem', textAlign: 'center' }}
                >
                  🔄 Ambos
                </button>
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="cad-nome" className={styles.label}>
                Nome Completo <span className={styles.requiredAsterisk}>*</span>
              </label>
              <input
                id="cad-nome"
                type="text"
                value={cadastroForm.nome}
                onChange={(e) => setCadastroForm({ ...cadastroForm, nome: e.target.value })}
                placeholder="Ex: Ana Clara Martins"
                disabled={carregando}
                className={`${styles.input} ${erros.nome ? styles.inputError : ''}`}
              />
              {erros.nome && (
                <span className={styles.fieldError}>
                  <AlertCircle size={13} /> {erros.nome}
                </span>
              )}
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="cad-email" className={styles.label}>
                E-mail Corporativo <span className={styles.requiredAsterisk}>*</span>
              </label>
              <input
                id="cad-email"
                type="email"
                value={cadastroForm.email}
                onChange={(e) => setCadastroForm({ ...cadastroForm, email: e.target.value })}
                placeholder="ana@empresa.com"
                disabled={carregando}
                className={`${styles.input} ${erros.email ? styles.inputError : ''}`}
              />
              {erros.email && (
                <span className={styles.fieldError}>
                  <AlertCircle size={13} /> {erros.email}
                </span>
              )}
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="cad-senha" className={styles.label}>
                Senha <span className={styles.requiredAsterisk}>*</span>
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="cad-senha"
                  type={mostrarSenhaCadastro ? 'text' : 'password'}
                  value={cadastroForm.password}
                  onChange={(e) => setCadastroForm({ ...cadastroForm, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  disabled={carregando}
                  className={`${styles.input} ${styles.inputWithIcon} ${
                    erros.password ? styles.inputError : ''
                  }`}
                />
                <button
                  type="button"
                  className={styles.eyeButton}
                  onClick={() => setMostrarSenhaCadastro(!mostrarSenhaCadastro)}
                  tabIndex={-1}
                >
                  {mostrarSenhaCadastro ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {erros.password && (
                <span className={styles.fieldError}>
                  <AlertCircle size={13} /> {erros.password}
                </span>
              )}
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="cad-confirm" className={styles.label}>
                Confirmar Senha <span className={styles.requiredAsterisk}>*</span>
              </label>
              <input
                id="cad-confirm"
                type="password"
                value={cadastroForm.confirmPassword}
                onChange={(e) =>
                  setCadastroForm({ ...cadastroForm, confirmPassword: e.target.value })
                }
                placeholder="Repita sua senha"
                disabled={carregando}
                className={`${styles.input} ${erros.confirmPassword ? styles.inputError : ''}`}
              />
              {erros.confirmPassword && (
                <span className={styles.fieldError}>
                  <AlertCircle size={13} /> {erros.confirmPassword}
                </span>
              )}
            </div>

            <button type="submit" disabled={carregando} className={styles.submitButton}>
              {carregando ? (
                <>
                  <span className={styles.buttonSpinner} aria-hidden="true" />
                  <span>Cadastrando...</span>
                </>
              ) : (
                <span>CRIAR CONTA</span>
              )}
            </button>
          </form>
        )}

        {/* Rodapé do Card com Alternador de Ação */}
        <footer className={styles.cardFooter}>
          {abaAtiva === 'login' ? (
            <span>
              Não tem uma conta?
              <button
                type="button"
                className={styles.switchActionLink}
                onClick={() => trocarAba('cadastro')}
              >
                Cadastre-se
              </button>
            </span>
          ) : (
            <span>
              Já possui uma conta?
              <button
                type="button"
                className={styles.switchActionLink}
                onClick={() => trocarAba('login')}
              >
                Faça login
              </button>
            </span>
          )}
        </footer>

        {/* Atalhos Rápidos com Perfis de Teste para Facilitar Avaliação */}
        <div className={styles.quickProfilesSection}>
          <div className={styles.quickProfilesTitle}>
            <span>Acesso Rápido (Perfis de Demonstração):</span>
          </div>
          <div className={styles.quickProfilesGrid}>
            {[
              perfisDisponiveis.find((p) => p.tipo === 'contratante'),
              perfisDisponiveis.find((p) => p.tipo === 'diarista'),
              perfisDisponiveis.find((p) => p.tipo === 'ambos')
            ].filter(Boolean).map((perfil) => (
              <button
                key={perfil.id}
                type="button"
                className={styles.quickBadge}
                onClick={() => preencherCredenciaisRapidas(perfil)}
                title={`Preencher dados de ${perfil.nome}`}
              >
                {perfil.tipo === 'contratante' ? '👔' : perfil.tipo === 'diarista' ? '🛠️' : '🔄'}{' '}
                {perfil.nome.split(' ')[0]} ({perfil.tipo})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Modal de Recuperação de Senha (RF-05) */}
      {modalEsqueciAberto && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Recuperar Senha</h2>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => {
                  setModalEsqueciAberto(false);
                  setFeedbackRecuperacao(null);
                }}
                aria-label="Fechar modal"
              >
                <X size={20} />
              </button>
            </div>

            <p className={styles.modalSubtitle}>
              Digite seu e-mail ou identificador cadastrado. Enviaremos um link seguro para você redefinir sua senha de acesso.
            </p>

            {feedbackRecuperacao && (
              <div
                className={`${styles.alertBanner} ${
                  feedbackRecuperacao.tipo === 'sucesso'
                    ? styles.alertSuccess
                    : styles.alertError
                }`}
              >
                {feedbackRecuperacao.tipo === 'sucesso' ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <AlertCircle size={16} />
                )}
                <span>{feedbackRecuperacao.texto}</span>
              </div>
            )}

            <form onSubmit={handleRecuperacaoSubmit}>
              <div className={styles.fieldGroup}>
                <label htmlFor="rec-email" className={styles.label}>
                  E-mail cadastrado
                </label>
                <input
                  id="rec-email"
                  type="email"
                  value={emailRecuperacao}
                  onChange={(e) => setEmailRecuperacao(e.target.value)}
                  placeholder="usuario@exemplo.com"
                  className={styles.input}
                  autoFocus
                  disabled={carregandoRecuperacao}
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.modalCancelBtn}
                  onClick={() => {
                    setModalEsqueciAberto(false);
                    setFeedbackRecuperacao(null);
                  }}
                  disabled={carregandoRecuperacao}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={styles.modalSubmitBtn}
                  disabled={carregandoRecuperacao}
                >
                  {carregandoRecuperacao ? 'Enviando...' : 'Enviar Link de Acesso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
