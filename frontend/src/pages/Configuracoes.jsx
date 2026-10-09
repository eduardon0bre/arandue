import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Bell, LogOut, AlertTriangle, Check, ShieldAlert } from 'lucide-react';
import { useUser } from '../context/UserContext';
import Button from '../components/Button';
import FormInput from '../components/FormInput';
import Modal from '../components/Modal';
import Alert from '../components/Alert';
import api from '../services/api';

export default function Configuracoes() {
  const navigate = useNavigate();
  const { usuarioAtual, atualizarPapel, atualizarPerfil, logout, excluirConta } = useUser();

  const [form, setForm] = useState({
    nome: usuarioAtual?.nome || '',
    email: usuarioAtual?.email || '',
    telefone: usuarioAtual?.telefone || '',
    bairro: usuarioAtual?.bairro || '',
    tipo: usuarioAtual?.tipo || 'contratante',
    notif_whatsapp: true,
    notif_email: true,
    notif_push: true
  });

  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState(null);
  const [mensagemErro, setMensagemErro] = useState(null);

  // Modal de Exclusão de Conta (RF-12 e Zona de Perigo)
  const [modalExclusaoAberta, setModalExclusaoAberta] = useState(false);
  const [confirmacaoSenha, setConfirmacaoSenha] = useState('');
  const [excluindoConta, setExcluindoConta] = useState(false);
  const [erroExclusao, setErroExclusao] = useState(null);
  const [dadosIniciais, setDadosIniciais] = useState(null);

  // Sincroniza formulário e dados iniciais com o backend/contexto
  useEffect(() => {
    let montado = true;
    async function carregarConfiguracoes() {
      if (!usuarioAtual?.id) return;
      try {
        const res = await api.get('/users/me/settings');
        if (montado && res.data?.data) {
          const dados = res.data.data;
          const estado = {
            nome: dados.nome || '',
            email: dados.email || '',
            telefone: dados.telefone || '',
            bairro: dados.bairro || '',
            tipo: dados.tipo || 'contratante',
            notif_whatsapp: Boolean(dados.notif_whatsapp !== false && dados.notif_whatsapp !== 0),
            notif_email: Boolean(dados.notif_email !== false && dados.notif_email !== 0),
            notif_push: Boolean(dados.notif_push !== false && dados.notif_push !== 0)
          };
          setForm(estado);
          setDadosIniciais(estado);
          return;
        }
      } catch {
        // Fallback para estado atual do contexto
      }

      if (montado && usuarioAtual) {
        const estado = {
          nome: usuarioAtual.nome || '',
          email: usuarioAtual.email || '',
          telefone: usuarioAtual.telefone || '',
          bairro: usuarioAtual.bairro || '',
          tipo: usuarioAtual.tipo || 'contratante',
          notif_whatsapp: true,
          notif_email: true,
          notif_push: true
        };
        setForm(estado);
        setDadosIniciais(estado);
      }
    }

    carregarConfiguracoes();
    return () => {
      montado = false;
    };
  }, [usuarioAtual]);

  // Detecta se houve qualquer alteração em relação aos dados salvos
  const temAlteracao = Boolean(
    dadosIniciais && (
      form.nome.trim() !== (dadosIniciais.nome || '').trim() ||
      form.telefone.trim() !== (dadosIniciais.telefone || '').trim() ||
      form.bairro.trim() !== (dadosIniciais.bairro || '').trim() ||
      form.tipo !== dadosIniciais.tipo ||
      Boolean(form.notif_whatsapp) !== Boolean(dadosIniciais.notif_whatsapp) ||
      Boolean(form.notif_email) !== Boolean(dadosIniciais.notif_email) ||
      Boolean(form.notif_push) !== Boolean(dadosIniciais.notif_push)
    )
  );

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (erros[name]) {
      setErros((prev) => ({ ...prev, [name]: null }));
    }
    setMensagemSucesso(null);
  };

  const handleSalvarPerfil = async (e) => {
    e.preventDefault();
    setMensagemErro(null);
    setMensagemSucesso(null);

    const novosErros = {};
    if (!form.nome.trim()) novosErros.nome = 'Nome é obrigatório.';
    if (!form.telefone.trim()) novosErros.telefone = 'Telefone é obrigatório.';
    if (!form.bairro.trim()) novosErros.bairro = 'Bairro é obrigatório.';

    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros);
      return;
    }

    setSalvando(true);
    try {
      // 1. Atualiza papel no backend e context (RF-02)
      if (form.tipo !== usuarioAtual?.tipo) {
        await atualizarPapel(form.tipo);
      }

      // 2. Atualiza configurações cadastrais
      await api.put('/users/me/settings', {
        nome: form.nome,
        telefone: form.telefone,
        bairro: form.bairro,
        tipo: form.tipo,
        notif_whatsapp: form.notif_whatsapp,
        notif_email: form.notif_email,
        notif_push: form.notif_push
      });

      await atualizarPerfil({
        nome: form.nome,
        telefone: form.telefone,
        bairro: form.bairro,
        tipo: form.tipo
      });

      setDadosIniciais({ ...form });
      setMensagemSucesso('Configurações salvas com sucesso! Suas permissões foram atualizadas.');
    } catch (err) {
      setMensagemErro(err.response?.data?.message || err.message || 'Erro ao salvar alterações.');
    } finally {
      setSalvando(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleConfirmarExclusao = async () => {
    if (!confirmacaoSenha.trim()) {
      setErroExclusao('Informe sua senha para confirmar a exclusão.');
      return;
    }

    setExcluindoConta(true);
    setErroExclusao(null);
    try {
      await excluirConta(confirmacaoSenha);
      setModalExclusaoAberta(false);
      navigate('/?status=conta_excluida');
    } catch (err) {
      setErroExclusao(
        err.response?.data?.message ||
        err.message ||
        'Não foi possível excluir a conta. Verifique pendências ativas.'
      );
    } finally {
      setExcluindoConta(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '780px', paddingBottom: '3rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
          Configurações da Conta
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Gerencie seus dados de acesso, preferências e papel de atuação na plataforma.
        </p>
      </header>

      {mensagemSucesso && (
        <Alert type="success" message={mensagemSucesso} onClose={() => setMensagemSucesso(null)} />
      )}

      {mensagemErro && (
        <Alert type="danger" message={mensagemErro} onClose={() => setMensagemErro(null)} />
      )}

      <form onSubmit={handleSalvarPerfil}>
        {/* Seção 1: Dados Pessoais e Papel da Conta (RF-01, RF-02) */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            marginBottom: '1.5rem',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <User size={20} color="var(--primary)" />
            <h2 style={{ fontSize: '1.15rem', color: 'var(--text-primary)' }}>
              Dados Pessoais e Papel da Conta
            </h2>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Papel Ativo na Plataforma (RBAC) <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
              <div
                onClick={() => setForm((p) => ({ ...p, tipo: 'contratante' }))}
                style={{
                  border: `2px solid ${form.tipo === 'contratante' ? 'var(--primary)' : 'var(--border-color)'}`,
                  backgroundColor: form.tipo === 'contratante' ? 'var(--primary-light)' : 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  👔 Contratante
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Quero anunciar vagas e contratar trabalhadores.
                </div>
              </div>

              <div
                onClick={() => setForm((p) => ({ ...p, tipo: 'diarista' }))}
                style={{
                  border: `2px solid ${form.tipo === 'diarista' ? 'var(--primary)' : 'var(--border-color)'}`,
                  backgroundColor: form.tipo === 'diarista' ? 'var(--primary-light)' : 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  🛠️ Diarista
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Quero prestar serviços e me candidatar a demandas.
                </div>
              </div>

              <div
                onClick={() => setForm((p) => ({ ...p, tipo: 'ambos' }))}
                style={{
                  border: `2px solid ${form.tipo === 'ambos' ? 'var(--primary)' : 'var(--border-color)'}`,
                  backgroundColor: form.tipo === 'ambos' ? 'var(--primary-light)' : 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  🔄 Ambos
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Quero contratar e também prestar serviços.
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            <FormInput
              label="Nome Completo"
              name="nome"
              value={form.nome}
              onChange={handleChange}
              required
              error={erros.nome}
            />

            <FormInput
              label="E-mail (Identificador)"
              name="email"
              type="email"
              value={form.email}
              disabled
              helperText="E-mail cadastrado não pode ser alterado."
            />

            <FormInput
              label="Telefone / WhatsApp"
              name="telefone"
              value={form.telefone}
              onChange={handleChange}
              placeholder="(11) 98888-7777"
              required
              error={erros.telefone}
            />

            <FormInput
              label="Bairro de Referência"
              name="bairro"
              value={form.bairro}
              onChange={handleChange}
              placeholder="Ex: Pinheiros, Lapa, Centro"
              required
              error={erros.bairro}
            />
          </div>
        </div>

        {/* Seção 2: Preferências de Notificação (RF-10) */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            marginBottom: '1.5rem',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <Bell size={20} color="var(--primary)" />
            <h2 style={{ fontSize: '1.15rem', color: 'var(--text-primary)' }}>
              Preferências de Notificação
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="notif_whatsapp"
                checked={form.notif_whatsapp}
                onChange={handleChange}
                style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
              />
              <div>
                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  Avisos via WhatsApp
                </span>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Receber atualizações de candidaturas e respostas diretamente no WhatsApp.
                </p>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="notif_email"
                checked={form.notif_email}
                onChange={handleChange}
                style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
              />
              <div>
                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  Notificações por E-mail
                </span>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Resumo de vagas e confirmações de serviço na caixa de entrada.
                </p>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="notif_push"
                checked={form.notif_push}
                onChange={handleChange}
                style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
              />
              <div>
                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  Notificações no Navegador (Push)
                </span>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Alertas em tempo real quando você estiver com a página aberta.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Botão de Salvar Alterações (só aparece quando houver alteração) */}
        {(temAlteracao || salvando) && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginBottom: '2rem' }}>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (dadosIniciais) setForm({ ...dadosIniciais });
                setErros({});
                setMensagemErro(null);
              }}
              disabled={salvando}
            >
              Descartar
            </Button>
            <Button type="submit" variant="primary" loading={salvando} icon={<Check size={18} />}>
              Salvar Alterações
            </Button>
          </div>
        )}
      </form>

      {/* Seção 3: Sessão da Conta (RF-11) */}
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.75rem 2rem',
          marginBottom: '1.5rem',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            Encerrar Sessão
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Desconecte sua conta deste navegador a qualquer momento com segurança.
          </p>
        </div>
        <Button variant="outline" onClick={handleLogout} icon={<LogOut size={16} />}>
          Sair da Conta (Logout)
        </Button>
      </div>

      {/* Seção 4: Zona de Perigo (RF-12 e Wireframe 4.2) */}
      <div
        style={{
          backgroundColor: 'var(--danger-light)',
          border: '1px solid var(--danger-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.75rem 2rem',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--danger)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem' }}>
            <AlertTriangle size={18} />
            Zona de Perigo
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--danger-hover)' }}>
            A exclusão é permanente. Todos os seus dados cadastrais e histórico serão anonimizados.
          </p>
        </div>
        <Button
          variant="danger"
          onClick={() => {
            setConfirmacaoSenha('');
            setErroExclusao(null);
            setModalExclusaoAberta(true);
          }}
        >
          Excluir Conta Definitivamente
        </Button>
      </div>

      {/* Modal de Confirmação de Exclusão (Wireframe 4.2) */}
      <Modal
        isOpen={modalExclusaoAberta}
        onClose={() => setModalExclusaoAberta(false)}
        title="Excluir Conta Definitivamente"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
            <Button
              variant="outline"
              onClick={() => setModalExclusaoAberta(false)}
              disabled={excluindoConta}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmarExclusao}
              loading={excluindoConta}
            >
              Confirmar e Excluir Conta
            </Button>
          </div>
        }
      >
        <div style={{ padding: '0.5rem 0' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              backgroundColor: 'var(--danger-light)',
              border: '1px solid var(--danger-border)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              marginBottom: '1.25rem'
            }}
          >
            <ShieldAlert size={22} color="var(--danger)" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '0.875rem', color: 'var(--danger-hover)', lineHeight: 1.45 }}>
              Esta ação não pode ser desfeita. Todos os seus dados, histórico de demandas e candidaturas serão removidos e anonimizados.
            </div>
          </div>

          {erroExclusao && (
            <div style={{ marginBottom: '1rem' }}>
              <Alert type="danger" message={erroExclusao} onClose={() => setErroExclusao(null)} />
            </div>
          )}

          <div>
            <label
              htmlFor="senha-exclusao"
              style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}
            >
              Para confirmar, digite sua senha de acesso ou a palavra <strong>EXCLUIR</strong>:
            </label>
            <input
              id="senha-exclusao"
              type="password"
              value={confirmacaoSenha}
              onChange={(e) => setConfirmacaoSenha(e.target.value)}
              placeholder="Digite sua senha..."
              disabled={excluindoConta}
              className="form-input"
              autoFocus
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
