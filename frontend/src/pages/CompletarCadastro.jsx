import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useUser } from '../context/UserContext';
import api from '../services/api';
import styles from './CompletarCadastro.module.css';

export default function CompletarCadastro() {
  const navigate = useNavigate();
  const { usuarioAtual, atualizarPerfil } = useUser();

  const [form, setForm] = useState({
    nome: usuarioAtual?.nome || usuarioAtual?.name || '',
    email: usuarioAtual?.email || '',
    tipo: usuarioAtual?.tipo || usuarioAtual?.role || 'contratante',
    telefone: usuarioAtual?.telefone || '',
    bairro: usuarioAtual?.bairro || ''
  });

  const [erros, setErros] = useState({});
  const [carregando, setCarregando] = useState(false);
  const [alertaErro, setAlertaErro] = useState(null);
  const [alertaSucesso, setAlertaSucesso] = useState(null);

  const formatarTelefone = (valor) => {
    const limpo = valor.replace(/\D/g, '').slice(0, 11);
    if (limpo.length <= 10) {
      return limpo.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
    }
    return limpo.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
  };

  const handleTelefoneChange = (e) => {
    const formatado = formatarTelefone(e.target.value);
    setForm((prev) => ({ ...prev, telefone: formatado }));
    if (erros.telefone) {
      setErros((prev) => ({ ...prev, telefone: null }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (erros[name]) {
      setErros((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlertaErro(null);

    const novosErros = {};
    if (!form.nome.trim()) {
      novosErros.nome = 'Nome completo é obrigatório.';
    }

    const telLimpo = form.telefone.replace(/\D/g, '');
    if (!telLimpo || telLimpo.length < 10) {
      novosErros.telefone = 'Informe um telefone com DDD válido (mínimo 10 dígitos).';
    }

    if (!form.bairro.trim()) {
      novosErros.bairro = 'Bairro ou região de atuação é obrigatório.';
    }

    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros);
      return;
    }

    setCarregando(true);
    try {
      await api.put('/users/me/settings', {
        nome: form.nome.trim(),
        telefone: form.telefone.trim(),
        bairro: form.bairro.trim(),
        tipo: form.tipo,
        notif_whatsapp: true,
        notif_email: true,
        notif_push: true
      });

      // Atualiza o estado no contexto do usuário
      atualizarPerfil({
        nome: form.nome.trim(),
        name: form.nome.trim(),
        telefone: form.telefone.trim(),
        bairro: form.bairro.trim(),
        tipo: form.tipo,
        role: form.tipo,
        cadastroIncompleto: false
      });

      setAlertaSucesso('Cadastro concluído com sucesso! Redirecionando...');

      setTimeout(() => {
        navigate('/');
      }, 700);
    } catch (err) {
      console.error('Erro ao completar cadastro:', err);
      const msg = err.response?.data?.message || err.message || 'Erro ao salvar dados do cadastro.';
      setAlertaErro(msg);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.badge}>
            <ShieldCheck size={16} />
            <span>Conta Google Vinculada</span>
          </div>

          <h1 className={styles.title}>Quase lá! Conclua seu cadastro</h1>
          <p className={styles.subtitle}>
            Para conectar você às melhores diárias e vagas na sua região, precisamos apenas que complete estas informações:
          </p>
        </div>

        {alertaErro && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <AlertCircle size={18} />
            <span>{alertaErro}</span>
          </div>
        )}

        {alertaSucesso && (
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <CheckCircle2 size={18} />
            <span>{alertaSucesso}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          {/* Seleção do Tipo de Perfil */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Como você deseja usar a plataforma?
              <span className={styles.requiredAsterisk}>*</span>
            </label>
            <div className={styles.roleGrid}>
              <button
                type="button"
                className={`${styles.roleOption} ${form.tipo === 'contratante' ? styles.roleActive : ''}`}
                onClick={() => setForm((prev) => ({ ...prev, tipo: 'contratante' }))}
              >
                <span className={styles.roleIcon}>👔</span>
                <strong>Contratante</strong>
                <small style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>Publicar vagas</small>
              </button>

              <button
                type="button"
                className={`${styles.roleOption} ${form.tipo === 'diarista' ? styles.roleActive : ''}`}
                onClick={() => setForm((prev) => ({ ...prev, tipo: 'diarista' }))}
              >
                <span className={styles.roleIcon}>🛠️</span>
                <strong>Diarista</strong>
                <small style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>Buscar diárias</small>
              </button>

              <button
                type="button"
                className={`${styles.roleOption} ${form.tipo === 'ambos' ? styles.roleActive : ''}`}
                onClick={() => setForm((prev) => ({ ...prev, tipo: 'ambos' }))}
              >
                <span className={styles.roleIcon}>🔄</span>
                <strong>Ambos</strong>
                <small style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>Contratar e prestar</small>
              </button>
            </div>
          </div>

          {/* Nome Completo */}
          <div className={styles.fieldGroup}>
            <label htmlFor="comp-nome" className={styles.label}>
              Nome Completo
              <span className={styles.requiredAsterisk}>*</span>
            </label>
            <input
              id="comp-nome"
              name="nome"
              type="text"
              value={form.nome}
              onChange={handleChange}
              placeholder="Seu nome completo"
              disabled={carregando}
              className={`${styles.input} ${erros.nome ? styles.inputError : ''}`}
            />
            {erros.nome && (
              <span className={styles.fieldError}>
                <AlertCircle size={14} /> {erros.nome}
              </span>
            )}
          </div>

          {/* E-mail (somente leitura vindo do Google) */}
          <div className={styles.fieldGroup}>
            <label htmlFor="comp-email" className={styles.label}>
              E-mail da Conta Google
            </label>
            <input
              id="comp-email"
              name="email"
              type="email"
              value={form.email}
              readOnly
              disabled
              className={`${styles.input} ${styles.inputDisabled}`}
            />
          </div>

          {/* Telefone / WhatsApp */}
          <div className={styles.fieldGroup}>
            <label htmlFor="comp-telefone" className={styles.label}>
              WhatsApp / Telefone para Contato
              <span className={styles.requiredAsterisk}>*</span>
            </label>
            <input
              id="comp-telefone"
              name="telefone"
              type="tel"
              value={form.telefone}
              onChange={handleTelefoneChange}
              placeholder="(11) 99999-8888"
              disabled={carregando}
              className={`${styles.input} ${erros.telefone ? styles.inputError : ''}`}
            />
            {erros.telefone && (
              <span className={styles.fieldError}>
                <AlertCircle size={14} /> {erros.telefone}
              </span>
            )}
          </div>

          {/* Bairro / Região */}
          <div className={styles.fieldGroup}>
            <label htmlFor="comp-bairro" className={styles.label}>
              Seu Bairro ou Cidade
              <span className={styles.requiredAsterisk}>*</span>
            </label>
            <input
              id="comp-bairro"
              name="bairro"
              type="text"
              value={form.bairro}
              onChange={handleChange}
              placeholder="Ex: Centro, Pinheiros, Santana..."
              disabled={carregando}
              className={`${styles.input} ${erros.bairro ? styles.inputError : ''}`}
            />
            {erros.bairro && (
              <span className={styles.fieldError}>
                <AlertCircle size={14} /> {erros.bairro}
              </span>
            )}
          </div>

          <button type="submit" disabled={carregando} className={styles.submitBtn}>
            {carregando ? (
              <>
                <span className={styles.spinner} aria-hidden="true" />
                <span>Salvando Informações...</span>
              </>
            ) : (
              <>
                <span>Concluir Cadastro e Acessar</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
