import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Star, MapPin, Check, Sparkles, Settings } from 'lucide-react';
import { useUser } from '../context/UserContext';
import Button from '../components/Button';
import FormInput from '../components/FormInput';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';
import api from '../services/api';

const SERVICOS_SUGERIDOS = [
  'Limpeza Residencial',
  'Faxina Pesada',
  'Limpeza Pós-Obra',
  'Passar Roupa',
  'Cozinha & Apoio',
  'Organização de Ambientes',
  'Pintura Básica',
  'Jardinagem & Área Externa',
  'Apoio em Eventos'
];

export default function Curriculo() {
  const { usuarioAtual } = useUser();

  const isPrestador =
    usuarioAtual && (usuarioAtual.tipo === 'diarista' || usuarioAtual.tipo === 'ambos');

  const [form, setForm] = useState({
    foto_url: '',
    bio: '',
    experiencia: '1 a 2 anos',
    servicos: ['Limpeza Residencial', 'Passar Roupa'],
    regioes: usuarioAtual?.bairro ? `${usuarioAtual.bairro} e regiões próximas` : 'São Paulo - Centro e Zonas Oeste/Sul'
  });

  const [dadosIniciais, setDadosIniciais] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState(null);
  const [mensagemErro, setMensagemErro] = useState(null);

  useEffect(() => {
    let montado = true;
    async function carregarCurriculo() {
      if (!isPrestador) {
        setCarregando(false);
        return;
      }

      try {
        setCarregando(true);
        const res = await api.get('/profile/curriculo');
        if (montado && res.data?.data) {
          const dados = res.data.data;
          const estado = {
            foto_url: dados.foto_url || '',
            bio: dados.bio || '',
            experiencia: dados.experiencia || '1 a 2 anos',
            servicos: Array.isArray(dados.servicos) && dados.servicos.length > 0
              ? dados.servicos
              : ['Limpeza Residencial', 'Passar Roupa'],
            regioes: dados.regioes || `${usuarioAtual?.bairro || 'Centro'} e arredores`
          };
          setForm(estado);
          setDadosIniciais(estado);
        }
      } catch {
        if (montado) {
          const estadoPadrao = {
            foto_url: '',
            bio: '',
            experiencia: '1 a 2 anos',
            servicos: ['Limpeza Residencial', 'Passar Roupa'],
            regioes: usuarioAtual?.bairro ? `${usuarioAtual.bairro} e regiões próximas` : 'São Paulo - Centro e Zonas Oeste/Sul'
          };
          setDadosIniciais(estadoPadrao);
        }
      } finally {
        if (montado) setCarregando(false);
      }
    }

    carregarCurriculo();
    return () => {
      montado = false;
    };
  }, [usuarioAtual, isPrestador]);

  // Detecta se houve alterações no formulário em relação aos dados salvos
  const temAlteracao = Boolean(
    dadosIniciais && (
      (form.foto_url || '') !== (dadosIniciais.foto_url || '') ||
      (form.bio || '').trim() !== (dadosIniciais.bio || '').trim() ||
      form.experiencia !== dadosIniciais.experiencia ||
      (form.regioes || '').trim() !== (dadosIniciais.regioes || '').trim() ||
      JSON.stringify((form.servicos || []).slice().sort()) !== JSON.stringify((dadosIniciais.servicos || []).slice().sort())
    )
  );

  const toggleServico = (servico) => {
    setForm((prev) => {
      const existe = prev.servicos.includes(servico);
      const novos = existe
        ? prev.servicos.filter((s) => s !== servico)
        : [...prev.servicos, servico];
      return { ...prev, servicos: novos };
    });
    setMensagemSucesso(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensagemErro(null);
    setMensagemSucesso(null);

    if (form.servicos.length === 0) {
      setMensagemErro('Selecione pelo menos uma especialidade de serviço.');
      return;
    }

    setSalvando(true);
    try {
      await api.put('/profile/curriculo', form);
      setDadosIniciais({ ...form });
      setMensagemSucesso('Currículo profissional atualizado com sucesso!');
    } catch (err) {
      setMensagemErro(err.response?.data?.message || err.message || 'Erro ao salvar currículo.');
    } finally {
      setSalvando(false);
    }
  };

  // RF-09: Se o perfil for Contratante exclusivo, exibe bloqueio orientando a mudar para Diarista ou Ambos
  if (!isPrestador) {
    return (
      <div className="container" style={{ maxWidth: '640px', padding: '3rem 1rem', textAlign: 'center' }}>
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '2.5rem 2rem',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem'
            }}
          >
            <FileText size={28} />
          </div>

          <h2 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
            Currículo Disponível para Prestadores
          </h2>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '1.75rem' }}>
            Seu perfil atual é <strong>Contratante</strong>. Para publicar seu currículo e receber oportunidades de trabalho, altere seu papel para <strong>Diarista</strong> ou <strong>Ambos</strong> nas Configurações.
          </p>

          <Link to="/configuracoes">
            <Button variant="primary" icon={<Settings size={16} />}>
              Ir para Configurações da Conta
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (carregando) {
    return (
      <div className="container" style={{ maxWidth: '820px', padding: '4rem 1rem' }}>
        <LoadingSpinner text="Carregando dados do currículo..." />
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '820px', paddingBottom: '3rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
          <Sparkles size={16} /> Perfil Profissional
        </div>
        <h1 style={{ fontSize: '1.75rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
          Meu Currículo de Serviços
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Destaque suas habilidades e regiões atendidas para ser escolhido pelos contratantes.
        </p>
      </header>

      {mensagemSucesso && (
        <Alert type="success" message={mensagemSucesso} onClose={() => setMensagemSucesso(null)} />
      )}

      {mensagemErro && (
        <Alert type="danger" message={mensagemErro} onClose={() => setMensagemErro(null)} />
      )}

      <form onSubmit={handleSubmit}>
        {/* Cartão de Apresentação e Dados Básicos */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 700
              }}
            >
              {usuarioAtual?.nome?.charAt(0) || 'D'}
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0 }}>
                {usuarioAtual?.nome}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <MapPin size={14} color="var(--primary)" /> {usuarioAtual?.bairro || 'São Paulo'}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Star size={14} color="#eab308" fill="#eab308" /> 5.0 (Avaliação máxima)
                </span>
              </div>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label htmlFor="curriculo-bio" className="form-label">
              Biografia e Apresentação Profissional
            </label>
            <textarea
              id="curriculo-bio"
              rows={4}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Fale um pouco sobre você, sua pontualidade, cuidados com o espaço e diferenciais de atendimento..."
              className="form-textarea"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="curriculo-exp" className="form-label">
                Tempo de Experiência na Área
              </label>
              <select
                id="curriculo-exp"
                value={form.experiencia}
                onChange={(e) => setForm({ ...form, experiencia: e.target.value })}
                className="form-select"
              >
                <option value="Menos de 1 ano">Menos de 1 ano</option>
                <option value="1 a 2 anos">1 a 2 anos</option>
                <option value="3 a 5 anos">3 a 5 anos</option>
                <option value="Mais de 5 anos">Mais de 5 anos de experiência</option>
              </select>
            </div>

            <FormInput
              label="Regiões / Bairros Atendidos"
              id="curriculo-regioes"
              value={form.regioes}
              onChange={(e) => setForm({ ...form, regioes: e.target.value })}
              placeholder="Ex: Pinheiros, Lapa, Centro, Zona Sul"
              helperText="Separe os bairros por vírgula."
            />
          </div>
        </div>

        {/* Especialidades e Serviços Prestados */}
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
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              Especialidades & Tipos de Serviço
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Selecione todos os tipos de tarefas que você realiza:
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
            {SERVICOS_SUGERIDOS.map((servico) => {
              const selecionado = form.servicos.includes(servico);
              return (
                <button
                  key={servico}
                  type="button"
                  onClick={() => toggleServico(servico)}
                  style={{
                    backgroundColor: selecionado ? 'var(--primary)' : 'var(--bg-subtle)',
                    color: selecionado ? '#ffffff' : 'var(--text-primary)',
                    border: `1px solid ${selecionado ? 'var(--primary)' : 'var(--border-color)'}`,
                    borderRadius: 'var(--radius-full)',
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {selecionado && <Check size={14} />}
                  <span>{servico}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Reputação e Avaliações Recebidas */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>
            Reputação na Plataforma
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>100%</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Pontualidade e presença</div>
            </div>
            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>5.0 ★</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Média geral de avaliações</div>
            </div>
            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>0</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Cancelamentos reportados</div>
            </div>
          </div>
        </div>

        {(temAlteracao || salvando) && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (dadosIniciais) setForm({ ...dadosIniciais });
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
    </div>
  );
}
