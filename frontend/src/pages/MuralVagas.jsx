import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Briefcase, Plus, Send, Check, Settings, ShieldAlert } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import FormInput from '../components/FormInput';
import FormSelect from '../components/FormSelect';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';
import { useUser } from '../context/UserContext';
import api from '../services/api';

const CATEGORIAS = [
  { value: '', label: 'Todas as categorias' },
  { value: 'Eventos', label: 'Eventos & Gastronomia' },
  { value: 'Logística', label: 'Logística & Transporte' },
  { value: 'Construção', label: 'Construção & Reformas' },
  { value: 'Montagem', label: 'Montagem & Instalações' },
  { value: 'Limpeza', label: 'Limpeza & Conservação' },
  { value: 'Geral', label: 'Serviços Gerais' }
];

export default function MuralVagas() {
  const { usuarioAtual, estaAutenticado } = useUser();
  const navigate = useNavigate();

  const [demandas, setDemandas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [mensagemSucesso, setMensagemSucesso] = useState(null);

  // Filtros
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('aberta');

  // Modais
  const [demandaDetalhes, setDemandaDetalhes] = useState(null);
  const [demandaParaCandidatar, setDemandaParaCandidatar] = useState(null);
  const [mensagemCandidatura, setMensagemCandidatura] = useState('');
  const [enviandoCandidatura, setEnviandoCandidatura] = useState(false);
  const [candidaturasRealizadas, setCandidaturasRealizadas] = useState([]);
  const [modalBloqueioCriacaoAberta, setModalBloqueioCriacaoAberta] = useState(false);

  // RF-03 e RF-07: Controle de criação de vaga por papel e autenticação
  const handleClicarPublicarVaga = () => {
    if (!estaAutenticado || !usuarioAtual) {
      navigate('/login?redirect=/demandas/nova');
      return;
    }

    if (usuarioAtual.tipo === 'diarista') {
      setModalBloqueioCriacaoAberta(true);
      return;
    }

    navigate('/demandas/nova');
  };

  // Carrega demandas da API
  const carregarDemandas = async () => {
    try {
      setLoading(true);
      setErro(null);

      const params = {};
      if (categoria) params.categoria = categoria;
      if (statusFiltro) params.status = statusFiltro;
      if (busca) params.busca = busca;

      const response = await api.get('/demandas', { params });
      if (response.data?.success) {
        setDemandas(response.data.data || []);
      } else {
        setDemandas([]);
      }
    } catch (err) {
      setErro(err.message || 'Falha ao carregar as oportunidades disponíveis.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDemandas();
  }, [categoria, statusFiltro]);

  const handleBuscar = (e) => {
    e.preventDefault();
    carregarDemandas();
  };

  // Carrega candidaturas já realizadas pelo usuário diarista
  useEffect(() => {
    const carregarMinhasCandidaturas = async () => {
      if (estaAutenticado && usuarioAtual?.id && (usuarioAtual.tipo === 'diarista' || usuarioAtual.tipo === 'ambos')) {
        try {
          const res = await api.get(`/candidaturas/diarista/${usuarioAtual.id}`);
          if (res.data?.success && Array.isArray(res.data.data)) {
            setCandidaturasRealizadas(res.data.data.map((c) => Number(c.demanda_id)));
          }
        } catch {
          // Ignora falha de rede silenciosamente
        }
      } else {
        setCandidaturasRealizadas([]);
      }
    };
    carregarMinhasCandidaturas();
  }, [estaAutenticado, usuarioAtual]);

  const handleAbrirCandidatura = (demanda) => {
    if (!estaAutenticado || !usuarioAtual) {
      navigate('/login?redirect=/');
      return;
    }

    if (usuarioAtual.tipo === 'contratante') {
      setErro("Contratantes não podem se candidatar. Altere seu perfil para 'Diarista' ou 'Ambos' nas configurações para aceitar demandas.");
      return;
    }

    if (Number(demanda.contratante_id) === Number(usuarioAtual.id)) {
      setErro("Você é o anunciante desta vaga e não pode se candidatar à sua própria oportunidade.");
      return;
    }

    if (candidaturasRealizadas.includes(Number(demanda.id))) {
      setErro("Você já possui inscrição confirmada para esta vaga.");
      return;
    }

    setDemandaParaCandidatar(demanda);
    setMensagemCandidatura('Olá, tenho disponibilidade imediata no horário acordado e experiência compatível com a função.');
  };

  const handleConfirmarCandidatura = async () => {
    if (!demandaParaCandidatar) return;

    if (!estaAutenticado || !usuarioAtual) {
      setDemandaParaCandidatar(null);
      navigate('/login?redirect=/');
      return;
    }

    try {
      setEnviandoCandidatura(true);
      const payload = {
        demanda_id: demandaParaCandidatar.id,
        diarista_id: usuarioAtual.id,
        mensagem: mensagemCandidatura
      };

      await api.post('/candidaturas', payload);

      setCandidaturasRealizadas((prev) => [...prev, Number(demandaParaCandidatar.id)]);
      setMensagemSucesso(`Inscrição confirmada com sucesso para a vaga: "${demandaParaCandidatar.titulo}"!`);
      setDemandaParaCandidatar(null);

      // Atualiza contador na demanda localmente sem recarregar página
      setDemandas((prev) =>
        prev.map((d) =>
          d.id === demandaParaCandidatar.id
            ? { ...d, total_candidatos: Number(d.total_candidatos || 0) + 1 }
            : d
        )
      );
    } catch (err) {
      if (err.message?.includes('não autenticado') || err.message?.includes('UNAUTHORIZED')) {
        setDemandaParaCandidatar(null);
        navigate('/login?redirect=/');
        return;
      }
      setErro(`Não foi possível enviar a candidatura: ${err.message}`);
    } finally {
      setEnviandoCandidatura(false);
    }
  };

  return (
    <div className="container">
      {/* Banner de Boas-vindas */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '2rem',
        marginBottom: '2rem',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1.5rem'
      }}>
        <div style={{ maxWidth: '650px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            <Briefcase size={16} />
            Mural de Oportunidades
          </div>
          <h1 style={{ fontSize: '1.85rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            Vagas e Diárias Disponíveis
          </h1>
        </div>

        <div>
          <Button
            variant="primary"
            onClick={handleClicarPublicarVaga}
            icon={<Plus size={18} />}
          >
            Publicar Nova Vaga
          </Button>
        </div>
      </div>

      {mensagemSucesso && (
        <Alert
          type="success"
          message={mensagemSucesso}
          onClose={() => setMensagemSucesso(null)}
        />
      )}

      {erro && (
        <Alert
          type="danger"
          message={erro}
          onClose={() => setErro(null)}
        />
      )}

      {/* Barra de Filtros e Busca */}
      <section style={{
        backgroundColor: '#ffffff',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem',
        marginBottom: '2rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <form onSubmit={handleBuscar} style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          alignItems: 'flex-end'
        }}>
          <div>
            <FormInput
              label="Buscar por título ou bairro"
              placeholder="Ex: Garçom, Santana, Carga..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="m-0"
            />
          </div>

          <div>
            <FormSelect
              label="Filtrar por Categoria"
              placeholder=""
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              options={CATEGORIAS}
              className="m-0"
            />
          </div>

          <div>
            <FormSelect
              label="Status da Vaga"
              placeholder=""
              value={statusFiltro}
              onChange={(e) => setStatusFiltro(e.target.value)}
              options={[
                { value: '', label: 'Todos os status' },
                { value: 'aberta', label: 'Vagas Abertas' },
                { value: 'preenchida', label: 'Preenchidas' },
                { value: 'concluida', label: 'Concluídas' }
              ]}
              className="m-0"
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Button type="submit" variant="primary" icon={<Search size={16} />}>
              Filtrar
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setBusca('');
                setCategoria('');
                setStatusFiltro('aberta');
              }}
              title="Limpar filtros"
              icon={<RefreshCw size={16} />}
            >
              Limpar
            </Button>
          </div>
        </form>
      </section>

      {/* Grid de Cards de Demandas */}
      {loading ? (
        <LoadingSpinner text="Carregando oportunidades do mural..." fullPage />
      ) : demandas.length === 0 ? (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px dashed var(--border-color)',
          padding: '4rem 2rem',
          textAlign: 'center'
        }}>
          <Briefcase size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ marginBottom: '0.5rem' }}>Nenhuma oportunidade encontrada</h3>
          <p style={{ maxWidth: '500px', margin: '0 auto 1.5rem', fontSize: '0.95rem' }}>
            Não encontramos vagas com os filtros selecionados. Tente alterar a categoria ou o termo da busca.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setBusca('');
              setCategoria('');
              setStatusFiltro('');
            }}
          >
            Exibir Todas as Vagas
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {demandas.map((demanda) => (
            <Card
              key={demanda.id}
              demanda={demanda}
              isContratante={usuarioAtual?.tipo === 'contratante'}
              isDono={Number(demanda.contratante_id) === Number(usuarioAtual?.id)}
              jaCandidatado={candidaturasRealizadas.includes(Number(demanda.id))}
              onVerDetalhes={(d) => setDemandaDetalhes(d)}
              onCandidatar={(d) => handleAbrirCandidatura(d)}
            />
          ))}
        </div>
      )}

      {/* Modal: Detalhes da Demanda */}
      {demandaDetalhes && (
        <Modal
          isOpen={Boolean(demandaDetalhes)}
          onClose={() => setDemandaDetalhes(null)}
          title={demandaDetalhes.titulo}
          footer={
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', width: '100%' }}>
              <Button variant="outline" onClick={() => setDemandaDetalhes(null)}>
                Fechar
              </Button>
              {demandaDetalhes.status === 'aberta' && usuarioAtual?.tipo !== 'contratante' && (
                candidaturasRealizadas.includes(Number(demandaDetalhes.id)) ? (
                  <Button variant="secondary" size="sm" disabled icon={<Check size={15} />}>
                    Já Inscrito
                  </Button>
                ) : Number(demandaDetalhes.contratante_id) === Number(usuarioAtual?.id) ? (
                  <span className="badge badge-info" style={{ alignSelf: 'center', padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}>
                    Sua Vaga
                  </span>
                ) : (
                  <Button
                    variant="primary"
                    onClick={() => {
                      const d = demandaDetalhes;
                      setDemandaDetalhes(null);
                      handleAbrirCandidatura(d);
                    }}
                    icon={<Send size={15} />}
                  >
                    Candidatar-se
                  </Button>
                )
              )}
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="badge badge-primary">{demandaDetalhes.categoria}</span>
              <strong style={{ fontSize: '1.25rem', color: 'var(--primary)' }}>
                {parseFloat(demandaDetalhes.valor_diaria).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </strong>
            </div>

            <div>
              <h4 style={{ fontSize: '0.95rem', marginBottom: '0.25rem' }}>Descrição do Serviço:</h4>
              <p style={{ whiteSpace: 'pre-line', fontSize: '0.9rem', lineHeight: 1.6 }}>
                {demandaDetalhes.descricao}
              </p>
            </div>

            <div style={{
              backgroundColor: 'var(--bg-subtle)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              <div><strong>Bairro:</strong> {demandaDetalhes.bairro}</div>
              <div><strong>Data prevista:</strong> {new Date(demandaDetalhes.data_servico).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</div>
              <div><strong>Anunciante:</strong> {demandaDetalhes.contratante_nome || 'Não informado'}</div>
              <div><strong>Candidatos inscritos:</strong> {demandaDetalhes.total_candidatos || 0}</div>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              * Os dados de contato direto (WhatsApp e telefone) são liberados para o trabalhador logo após a aprovação da candidatura pelo contratante.
            </p>
          </div>
        </Modal>
      )}

      {/* Modal: Candidatar-se à Vaga */}
      {demandaParaCandidatar && (
        <Modal
          isOpen={Boolean(demandaParaCandidatar)}
          onClose={() => setDemandaParaCandidatar(null)}
          title={`Inscrição: ${demandaParaCandidatar.titulo}`}
          footer={
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', width: '100%' }}>
              <Button
                variant="outline"
                disabled={enviandoCandidatura}
                onClick={() => setDemandaParaCandidatar(null)}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                loading={enviandoCandidatura}
                onClick={handleConfirmarCandidatura}
                icon={<Check size={16} />}
              >
                Confirmar Candidatura
              </Button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.9rem' }}>
              Você está se candidatando como <strong>{usuarioAtual?.nome}</strong> ({usuarioAtual?.bairro}).
            </p>

            <div style={{
              backgroundColor: 'var(--primary-light)',
              border: '1px solid var(--primary-border)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem'
            }}>
              <strong>Remuneração:</strong> {parseFloat(demandaParaCandidatar.valor_diaria).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} (fechado)
              <br />
              <strong>Local:</strong> {demandaParaCandidatar.bairro}
            </div>

            <FormInput
              type="textarea"
              label="Mensagem de apresentação para o contratante"
              rows={4}
              value={mensagemCandidatura}
              onChange={(e) => setMensagemCandidatura(e.target.value)}
              helperText="Descreva brevemente sua experiência relevante ou disponibilidade."
            />
          </div>
        </Modal>
      )}

      {/* RF-03: Modal Explicativo para Diaristas Exclusivos */}
      <Modal
        isOpen={modalBloqueioCriacaoAberta}
        onClose={() => setModalBloqueioCriacaoAberta(false)}
        title="Ação Restrita a Contratantes"
        footer={
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', width: '100%' }}>
            <Button variant="outline" onClick={() => setModalBloqueioCriacaoAberta(false)}>
              Entendi
            </Button>
            <Link to="/configuracoes">
              <Button variant="primary" icon={<Settings size={15} />}>
                Alterar Papel nas Configurações
              </Button>
            </Link>
          </div>
        }
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.5rem 0' }}>
          <ShieldAlert size={28} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Seu perfil atual é <strong>Diarista</strong>. Altere para <strong>Contratante</strong> ou <strong>Ambos</strong> nas configurações para criar vagas.
          </div>
        </div>
      </Modal>
    </div>
  );
}
