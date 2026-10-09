import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  Edit,
  Trash2,
  Users,
  CheckCircle2,
  Phone,
  MessageCircle,
  Check,
  XCircle,
  Briefcase,
  FileCheck,
  FileText,
  Star,
  ShieldCheck
} from 'lucide-react';
import Table from '../components/Table';
import Button from '../components/Button';
import Modal from '../components/Modal';
import ModalCurriculo from '../components/ModalCurriculo';
import ModalAvaliacao from '../components/ModalAvaliacao';
import FeedbacksList from '../components/FeedbacksList';
import Alert from '../components/Alert';
import LoadingSpinner from '../components/LoadingSpinner';
import { useUser } from '../context/UserContext';
import api from '../services/api';

export default function PainelContratante() {
  const { usuarioAtual } = useUser();

  const isDiaristaExclusivo = usuarioAtual?.tipo === 'diarista';
  const isContratanteExclusivo = usuarioAtual?.tipo === 'contratante';
  const isAmbos = usuarioAtual?.tipo === 'ambos';

  // RF-08: Controle de abas para usuários com papel 'AMBOS'
  const [abaAtiva, setAbaAtiva] = useState(() => (isDiaristaExclusivo ? 'candidaturas' : 'vagas'));

  // Sincroniza aba ativa caso o papel mude
  useEffect(() => {
    if (isDiaristaExclusivo) {
      setAbaAtiva('candidaturas');
    } else if (isContratanteExclusivo) {
      setAbaAtiva('vagas');
    }
  }, [isDiaristaExclusivo, isContratanteExclusivo]);

  // Estados de Vagas Criadas (Contratante)
  const [demandas, setDemandas] = useState([]);
  const [carregandoDemandas, setCarregandoDemandas] = useState(true);

  // Estados de Minhas Candidaturas (Diarista)
  const [candidaturas, setCandidaturas] = useState([]);
  const [carregandoCandidaturas, setCarregandoCandidaturas] = useState(false);

  // Estados de Avaliações Enviadas e Resumo de Média Recebida
  const [avaliacoesEnviadas, setAvaliacoesEnviadas] = useState([]);
  const [resumoAvaliacao, setResumoAvaliacao] = useState(null);

  useEffect(() => {
    async function carregarResumoMedia() {
      if (!usuarioAtual?.id) return;
      try {
        const res = await api.get(`/avaliacoes/usuario/${usuarioAtual.id}/media`);
        if (res.data?.success && res.data.data) {
          setResumoAvaliacao(res.data.data);
        }
      } catch (err) {
        // Fallback silencioso
      }
    }
    carregarResumoMedia();
  }, [usuarioAtual?.id, avaliacoesEnviadas]);

  // Modal de Conclusão de Demanda
  const [demandaParaConcluir, setDemandaParaConcluir] = useState(null);
  const [concluindoDemanda, setConcluindoDemanda] = useState(false);

  // Modal de Avaliação e Feedback Mútuo
  const [dadosModalAvaliacao, setDadosModalAvaliacao] = useState(null);

  const [alerta, setAlerta] = useState(null);

  // Modal de Exclusão de Demanda
  const [demandaParaExcluir, setDemandaParaExcluir] = useState(null);
  const [excluindo, setExcluindo] = useState(false);

  // Modal de Candidatos da Demanda
  const [demandaCandidatos, setDemandaCandidatos] = useState(null);
  const [candidatos, setCandidatos] = useState([]);
  const [carregandoCandidatos, setCarregandoCandidatos] = useState(false);
  const [processandoCandidatoId, setProcessandoCandidatoId] = useState(null);

  // Modal de Visualização de Currículo do Diarista
  const [candidatoCurriculo, setCandidatoCurriculo] = useState(null);

  // Modal de Confirmação de Recusa (Ação Destrutiva / DELETE)
  const [candidatoParaRecusar, setCandidatoParaRecusar] = useState(null);
  const [recusandoCandidato, setRecusandoCandidato] = useState(false);

  // Carregar demandas criadas
  const carregarDemandas = async () => {
    try {
      setCarregandoDemandas(true);
      const params = usuarioAtual?.id ? { contratante_id: usuarioAtual.id } : {};
      const response = await api.get('/demandas', { params });
      if (response.data?.success) {
        setDemandas(response.data.data || []);
      }
    } catch (err) {
      setAlerta({ type: 'danger', message: err.message || 'Erro ao carregar demandas.' });
    } finally {
      setCarregandoDemandas(false);
    }
  };

  // Carregar candidaturas enviadas (RF-08 para Diarista e Ambos)
  const carregarCandidaturas = async () => {
    if (!usuarioAtual?.id) return;
    try {
      setCarregandoCandidaturas(true);
      const response = await api.get(`/candidaturas/diarista/${usuarioAtual.id}`);
      if (response.data?.success) {
        setCandidaturas(response.data.data || []);
      }
    } catch (err) {
      console.error('Erro ao buscar candidaturas do usuário:', err);
    } finally {
      setCarregandoCandidaturas(false);
    }
  };

  // Carregar histórico de avaliações enviadas pelo usuário
  const carregarAvaliacoesEnviadas = async () => {
    if (!usuarioAtual?.id) return;
    try {
      const response = await api.get(`/avaliacoes/enviadas/${usuarioAtual.id}`);
      if (response.data?.success) {
        setAvaliacoesEnviadas(response.data.data || []);
      }
    } catch {
      // Falha silenciosa
    }
  };

  useEffect(() => {
    carregarDemandas();
    carregarAvaliacoesEnviadas();
    if (isDiaristaExclusivo || isAmbos) {
      carregarCandidaturas();
    }
  }, [usuarioAtual, isDiaristaExclusivo, isAmbos]);

  // Exclusão de Demanda
  const handleExecutarExclusao = async () => {
    if (!demandaParaExcluir) return;
    try {
      setExcluindo(true);
      const response = await api.delete(`/demandas/${demandaParaExcluir.id}`);
      if (response.data?.success) {
        setDemandas((prev) => prev.filter((d) => d.id !== demandaParaExcluir.id));
        setAlerta({
          type: 'success',
          message: `Demanda "${demandaParaExcluir.titulo}" excluída com sucesso.`
        });
        setDemandaParaExcluir(null);
      }
    } catch (err) {
      setAlerta({
        type: 'danger',
        message: err.message || 'Falha ao excluir demanda. Tente novamente.'
      });
    } finally {
      setExcluindo(false);
    }
  };

  // Carregar candidatos da vaga
  const handleAbrirCandidatos = async (demanda) => {
    setDemandaCandidatos(demanda);
    setCandidatos([]);
    try {
      setCarregandoCandidatos(true);
      const response = await api.get(`/demandas/${demanda.id}/candidatos`);
      if (response.data?.success) {
        setCandidatos(response.data.data || []);
      }
    } catch (err) {
      console.error('Erro ao carregar candidatos:', err);
    } finally {
      setCarregandoCandidatos(false);
    }
  };

  // Visualizar currículo do diarista
  const handleVisualizarCurriculo = (cand) => {
    setCandidatoCurriculo(cand);
  };

  // Abrir modal de confirmação de recusa (ação destrutiva)
  const handleIniciarRecusa = (cand) => {
    setCandidatoParaRecusar(cand);
  };

  // Confirmar recusa e exclusão da candidatura
  const handleConfirmarRecusa = async () => {
    if (!candidatoParaRecusar) return;
    try {
      setRecusandoCandidato(true);
      const response = await api.delete(`/candidaturas/${candidatoParaRecusar.id}`);
      if (response.data?.success) {
        // Remove da lista de candidatos imediatamente
        setCandidatos((prev) => prev.filter((c) => c.id !== candidatoParaRecusar.id));

        // Atualiza a contagem de candidatos na lista de demandas
        if (demandaCandidatos) {
          setDemandas((prev) =>
            prev.map((d) =>
              d.id === demandaCandidatos.id
                ? { ...d, total_candidatos: Math.max(0, (Number(d.total_candidatos) || 1) - 1) }
                : d
            )
          );
        }

        // Se o currículo deste candidato estava aberto, fecha o modal de currículo
        if (candidatoCurriculo?.id === candidatoParaRecusar.id) {
          setCandidatoCurriculo(null);
        }

        setAlerta({
          type: 'success',
          message: `Candidatura de ${candidatoParaRecusar.diarista_nome} recusada e removida com sucesso.`
        });
        setCandidatoParaRecusar(null);
      }
    } catch (err) {
      setAlerta({
        type: 'danger',
        message: err.message || 'Falha ao recusar candidatura. Tente novamente.'
      });
    } finally {
      setRecusandoCandidato(false);
    }
  };

  // Aprovar candidato
  const handleMudarStatusCandidato = async (candidaturaId, novoStatus) => {
    try {
      setProcessandoCandidatoId(candidaturaId);
      const response = await api.patch(`/candidaturas/${candidaturaId}/status`, {
        status: novoStatus
      });

      if (response.data?.success) {
        if (novoStatus === 'aceita') {
          // As outras candidaturas pendentes são excluídas pelo backend
          setCandidatos((prev) =>
            prev
              .filter((c) => c.id === candidaturaId)
              .map((c) => ({ ...c, status: 'aceita' }))
          );

          if (demandaCandidatos) {
            setDemandas((prev) =>
              prev.map((d) =>
                d.id === demandaCandidatos.id ? { ...d, status: 'preenchida', total_candidatos: 1 } : d
              )
            );
          }

          if (candidatoCurriculo?.id === candidaturaId) {
            setCandidatoCurriculo((prev) => ({ ...prev, status: 'aceita' }));
          }

          setAlerta({
            type: 'success',
            message: 'Candidatura aprovada com sucesso! Dados de contato liberados.'
          });
        } else {
          setCandidatos((prev) =>
            prev.map((c) => (c.id === candidaturaId ? { ...c, status: novoStatus } : c))
          );
        }
      }
    } catch (err) {
      setAlerta({
        type: 'danger',
        message: `Falha ao alterar status do candidato: ${err.message}`
      });
    } finally {
      setProcessandoCandidatoId(null);
    }
  };

  // Iniciar confirmação de conclusão da diária (Contratante ou Diarista)
  const handleIniciarConclusao = (demanda, diarista = null) => {
    setDemandaParaConcluir({
      ...demanda,
      diarista_alvo: diarista
    });
  };

  // Confirmar conclusão da diária (serviço realizado + pagamento por fora acertado)
  const handleConfirmarConclusao = async () => {
    if (!demandaParaConcluir) return;
    try {
      setConcluindoDemanda(true);
      const response = await api.patch(`/demandas/${demandaParaConcluir.id}/concluir`);
      if (response.data?.success) {
        // Atualiza demandas locais imediatamente
        setDemandas((prev) =>
          prev.map((d) => (d.id === demandaParaConcluir.id ? { ...d, status: 'concluida' } : d))
        );

        // Se o modal de candidatos estiver aberto para essa vaga, sincroniza
        if (demandaCandidatos?.id === demandaParaConcluir.id) {
          setDemandaCandidatos((prev) => (prev ? { ...prev, status: 'concluida' } : null));
        }

        // Atualiza histórico de candidaturas locais (para diaristas)
        setCandidaturas((prev) =>
          prev.map((c) =>
            c.demanda_id === demandaParaConcluir.id ? { ...c, demanda_status: 'concluida' } : c
          )
        );

        const demandaFinalizada = { ...demandaParaConcluir, status: 'concluida' };
        const diaristaAceito = demandaParaConcluir.diarista_alvo || {
          id: demandaParaConcluir.diarista_aceito_id,
          nome: demandaParaConcluir.diarista_aceito_nome
        };

        setDemandaParaConcluir(null);

        // Abre automaticamente o modal de avaliação após a conclusão
        if (abaAtiva === 'vagas' || isContratanteExclusivo) {
          if (diaristaAceito?.id) {
            handleAbrirAvaliacao(demandaFinalizada, diaristaAceito.id, diaristaAceito.nome, 'diarista');
          }
        } else {
          handleAbrirAvaliacao(
            demandaFinalizada,
            demandaFinalizada.contratante_id,
            demandaFinalizada.contratante_nome,
            'contratante'
          );
        }
      }
    } catch (err) {
      setAlerta({
        type: 'danger',
        message: err.message || 'Falha ao marcar diária como concluída.'
      });
    } finally {
      setConcluindoDemanda(false);
    }
  };

  // Abrir modal de avaliação ou visualização da nota já atribuída
  const handleAbrirAvaliacao = (demanda, avaliadoId, avaliadoNome, papelAvaliado) => {
    const jaExiste = avaliacoesEnviadas.find((a) => a.demanda_id === demanda.id);
    setDadosModalAvaliacao({
      demanda,
      avaliadoId,
      avaliadoNome,
      papelAvaliado,
      avaliacaoExistente: jaExiste || null
    });
  };

  // Salvar avaliação no estado local sem recarregar a tela
  const handleSalvarAvaliacao = (novaAvaliacao) => {
    setAvaliacoesEnviadas((prev) => [
      ...prev.filter((a) => a.demanda_id !== novaAvaliacao.demanda_id),
      novaAvaliacao
    ]);
  };

  // Colunas da Tabela de Vagas Criadas (Contratante)
  const colunasVagas = [
    {
      header: 'Vaga & Categoria',
      render: (item) => (
        <div>
          <strong style={{ color: 'var(--text-primary)', display: 'block', fontSize: '0.95rem' }}>
            {item.titulo}
          </strong>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {item.categoria} • {item.bairro}
          </span>
        </div>
      )
    },
    {
      header: 'Data do Serviço',
      render: (item) => (
        <span style={{ fontSize: '0.9rem' }}>
          {new Date(item.data_servico).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
        </span>
      )
    },
    {
      header: 'Valor Diária',
      render: (item) => (
        <strong style={{ color: 'var(--primary)', fontSize: '0.95rem' }}>
          {parseFloat(item.valor_diaria).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </strong>
      )
    },
    {
      header: 'Status',
      render: (item) => {
        const statusMap = {
          aberta: { label: 'Aberta', badge: 'badge-success' },
          preenchida: { label: 'Preenchida', badge: 'badge-warning' },
          concluida: { label: 'Concluída', badge: 'badge-info' },
          cancelada: { label: 'Cancelada', badge: 'badge-danger' }
        };
        const s = statusMap[item.status] || { label: item.status, badge: 'badge-secondary' };
        return <span className={`badge ${s.badge}`}>{s.label}</span>;
      }
    },
    {
      header: 'Candidatos',
      render: (item) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAbrirCandidatos(item)}
          icon={<Users size={14} />}
        >
          {item.total_candidatos || 0} candidato(s)
        </Button>
      )
    },
    {
      header: 'Ações',
      render: (item) => {
        const avaliacaoExistente = avaliacoesEnviadas.find((a) => a.demanda_id === item.id);

        return (
          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            {/* Se estiver preenchida, opção de marcar como concluída */}
            {item.status === 'preenchida' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleIniciarConclusao(item)}
                icon={<CheckCircle2 size={14} />}
                title="Concluir trabalho e confirmar pagamento por fora"
              >
                Concluir Diária
              </Button>
            )}

            {/* Se estiver concluída, opção de avaliar diarista ou visualizar avaliação */}
            {item.status === 'concluida' && (
              avaliacaoExistente ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleAbrirAvaliacao(
                      item,
                      avaliacaoExistente.avaliado_id || item.diarista_aceito_id,
                      item.diarista_aceito_nome || 'Diarista',
                      'diarista'
                    )
                  }
                  icon={<Star size={14} color="#f59e0b" fill="#f59e0b" />}
                  title="Visualizar avaliação e feedback enviados"
                >
                  Ver Avaliação (★ {avaliacaoExistente.nota})
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    handleAbrirAvaliacao(
                      item,
                      item.diarista_aceito_id,
                      item.diarista_aceito_nome || 'Diarista',
                      'diarista'
                    )
                  }
                  icon={<Star size={14} />}
                  title="Avaliar e deixar feedback para o diarista"
                >
                  Avaliar Diarista
                </Button>
              )
            )}

            {item.status === 'aberta' && (
              <Link to={`/demandas/editar/${item.id}`}>
                <Button variant="outline" size="sm" icon={<Edit size={14} />} title="Editar vaga">
                  Editar
                </Button>
              </Link>
            )}

            {item.status !== 'concluida' && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setDemandaParaExcluir(item)}
                icon={<Trash2 size={14} />}
                title="Excluir vaga"
              >
                Excluir
              </Button>
            )}
          </div>
        );
      }
    }
  ];

  // Colunas da Tabela de Minhas Candidaturas (Diarista)
  const colunasCandidaturas = [
    {
      header: 'Vaga & Contratante',
      render: (item) => (
        <div>
          <strong style={{ color: 'var(--text-primary)', display: 'block', fontSize: '0.95rem' }}>
            {item.demanda_titulo || `Demanda #${item.demanda_id}`}
          </strong>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Anunciante: {item.contratante_nome || 'Contratante local'}
          </span>
        </div>
      )
    },
    {
      header: 'Data Prevista',
      render: (item) => {
        const dataVal = item.demanda_data || item.demanda_data_servico;
        return (
          <span style={{ fontSize: '0.9rem' }}>
            {dataVal ? new Date(dataVal).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '--'}
          </span>
        );
      }
    },
    {
      header: 'Valor Acordado',
      render: (item) => (
        <strong style={{ color: 'var(--primary)', fontSize: '0.95rem' }}>
          {item.demanda_valor ? parseFloat(item.demanda_valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '--'}
        </strong>
      )
    },
    {
      header: 'Status da Inscrição',
      render: (item) => {
        const statusCand = item.status || item.candidatura_status;
        if (statusCand === 'aceita') {
          return <span className="badge badge-success">✓ Aprovada</span>;
        }
        if (statusCand === 'recusada') {
          return <span className="badge badge-danger">Recusada</span>;
        }
        return <span className="badge badge-warning">Em Análise</span>;
      }
    },
    {
      header: 'Contato & Próximo Passo',
      render: (item) => {
        const statusCand = item.status || item.candidatura_status;
        if (statusCand === 'aceita') {
          const isConcluida = item.demanda_status === 'concluida';
          const avaliacaoDiarista = avaliacoesEnviadas.find((a) => a.demanda_id === item.demanda_id);

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', color: isConcluida ? 'var(--text-secondary)' : '#15803d', fontWeight: 600 }}>
                <CheckCircle2 size={14} color={isConcluida ? '#0284c7' : '#15803d'} />
                {isConcluida ? 'Diária Finalizada' : 'Serviço confirmado!'}
              </div>

              {item.contratante_telefone && (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Phone size={13} color="#15803d" /> {item.contratante_telefone}
                </span>
              )}

              {/* Botão de Marcar como Concluído (Diarista) quando ainda preenchida */}
              {!isConcluida && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleIniciarConclusao({
                      id: item.demanda_id,
                      titulo: item.demanda_titulo,
                      valor_diaria: item.demanda_valor,
                      contratante_id: item.contratante_id,
                      contratante_nome: item.contratante_nome
                    })
                  }
                  icon={<CheckCircle2 size={13} />}
                  title="Confirmar término do trabalho e recebimento por fora"
                >
                  Marcar como Concluído
                </Button>
              )}

              {/* Ações após concluída: Avaliar Contratante ou Ver Avaliação */}
              {isConcluida && (
                avaliacaoDiarista ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleAbrirAvaliacao(
                        { id: item.demanda_id, titulo: item.demanda_titulo, valor_diaria: item.demanda_valor },
                        item.contratante_id,
                        item.contratante_nome || 'Contratante',
                        'contratante'
                      )
                    }
                    icon={<Star size={13} color="#f59e0b" fill="#f59e0b" />}
                    title="Ver feedback enviado ao empregador"
                  >
                    Ver Avaliação (★ {avaliacaoDiarista.nota})
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() =>
                      handleAbrirAvaliacao(
                        { id: item.demanda_id, titulo: item.demanda_titulo, valor_diaria: item.demanda_valor },
                        item.contratante_id,
                        item.contratante_nome || 'Contratante',
                        'contratante'
                      )
                    }
                    icon={<Star size={13} />}
                    title="Avaliar ambiente de trabalho e pagamento combinado"
                  >
                    Avaliar Contratante
                  </Button>
                )
              )}
            </div>
          );
        }
        return (
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Aguardando decisão do contratante
          </span>
        );
      }
    }
  ];

  return (
    <div className="container" style={{ paddingBottom: '3rem' }}>
      {/* Header do Painel */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '2rem'
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
            <LayoutDashboard size={16} /> Central de Demandas
          </div>
          <h1 style={{ fontSize: '1.75rem', color: 'var(--text-primary)', margin: 0 }}>
            Minhas Demandas
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span>Gerenciamento de serviços e oportunidades para o perfil <strong>{usuarioAtual?.nome}</strong> ({usuarioAtual?.tipo}).</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', borderRadius: 'var(--radius-full)', padding: '0.15rem 0.55rem', fontSize: '0.8rem', fontWeight: 700 }}>
              <Star size={13} fill="#f59e0b" color="#f59e0b" />
              {resumoAvaliacao && resumoAvaliacao.total_avaliacoes > 0
                ? `${Number(resumoAvaliacao.nota_media).toFixed(1)} ★ (${resumoAvaliacao.total_avaliacoes} ${resumoAvaliacao.total_avaliacoes === 1 ? 'avaliação' : 'avaliações'})`
                : usuarioAtual?.nota_media
                  ? `${Number(usuarioAtual.nota_media).toFixed(1)} ★`
                  : '5.0 ★'}
            </span>
          </p>
        </div>

        {/* Botão de Nova Vaga para Contratante ou Ambos */}
        {(isContratanteExclusivo || isAmbos) && (
          <Link to="/demandas/nova">
            <Button variant="primary" icon={<PlusCircle size={18} />}>
              Criar Nova Vaga
            </Button>
          </Link>
        )}
      </div>

      {alerta && (
        <Alert type={alerta.type} message={alerta.message} onClose={() => setAlerta(null)} />
      )}

      {/* Abas de Navegação do Painel */}
      <div
        style={{
          display: 'flex',
          backgroundColor: 'var(--bg-subtle)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '4px',
          marginBottom: '1.75rem',
          gap: '4px'
        }}
      >
        {(isContratanteExclusivo || isAmbos) && (
          <button
            type="button"
            onClick={() => setAbaAtiva('vagas')}
            style={{
              flex: 1,
              padding: '0.65rem 1rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              backgroundColor: abaAtiva === 'vagas' ? '#ffffff' : 'transparent',
              color: abaAtiva === 'vagas' ? 'var(--primary)' : 'var(--text-secondary)',
              boxShadow: abaAtiva === 'vagas' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Briefcase size={16} />
            <span>Vagas que Criei ({demandas.length})</span>
          </button>
        )}

        {(isDiaristaExclusivo || isAmbos) && (
          <button
            type="button"
            onClick={() => setAbaAtiva('candidaturas')}
            style={{
              flex: 1,
              padding: '0.65rem 1rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              backgroundColor: abaAtiva === 'candidaturas' ? '#ffffff' : 'transparent',
              color: abaAtiva === 'candidaturas' ? 'var(--primary)' : 'var(--text-secondary)',
              boxShadow: abaAtiva === 'candidaturas' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <FileCheck size={16} />
            <span>Minhas Candidaturas ({candidaturas.length})</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setAbaAtiva('feedbacks')}
          style={{
            flex: 1,
            padding: '0.65rem 1rem',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            backgroundColor: abaAtiva === 'feedbacks' ? '#ffffff' : 'transparent',
            color: abaAtiva === 'feedbacks' ? 'var(--primary)' : 'var(--text-secondary)',
            boxShadow: abaAtiva === 'feedbacks' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <Star size={16} color={abaAtiva === 'feedbacks' ? '#f59e0b' : 'currentColor'} fill={abaAtiva === 'feedbacks' ? '#f59e0b' : 'none'} />
          <span>Feedbacks & Notas</span>
        </button>
      </div>

      {/* Visão 1: Vagas Criadas (Contratante e Ambos) */}
      {abaAtiva === 'vagas' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', margin: 0 }}>
              Vagas Publicadas por Você
            </h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {demandas.length} vaga(s) cadastrada(s)
            </span>
          </div>

          {carregandoDemandas ? (
            <LoadingSpinner text="Carregando vagas..." />
          ) : (
            <Table
              columns={colunasVagas}
              data={demandas}
              keyExtractor={(item) => item.id}
              emptyMessage="Você ainda não publicou nenhuma vaga. Clique em 'Criar Nova Vaga' para começar."
            />
          )}
        </div>
      )}

      {/* Visão 2: Minhas Candidaturas (Diarista e Ambos) */}
      {abaAtiva === 'candidaturas' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', margin: 0 }}>
              Histórico de Candidaturas Enviadas
            </h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {candidaturas.length} candidatura(s)
            </span>
          </div>

          {carregandoCandidaturas ? (
            <LoadingSpinner text="Carregando candidaturas..." />
          ) : (
            <Table
              columns={colunasCandidaturas}
              data={candidaturas}
              keyExtractor={(item) => item.id}
              emptyMessage="Você ainda não se candidatou a nenhuma vaga. Acesse o Mural de Vagas para encontrar diárias abertas."
            />
          )}
        </div>
      )}

      {/* Visão 3: Feedbacks Recebidos */}
      {abaAtiva === 'feedbacks' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <FeedbacksList
            usuarioId={usuarioAtual?.id}
            titulo="Feedbacks e Avaliações Recebidas no seu Perfil"
            tipoPapel={isContratanteExclusivo ? 'contratante' : 'diarista'}
          />
        </div>
      )}

      {/* Modal: Exclusão de Demanda (Ação Destrutiva) */}
      <Modal
        isOpen={Boolean(demandaParaExcluir)}
        onClose={() => setDemandaParaExcluir(null)}
        title="Confirmar Exclusão da Demanda"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
            <Button
              variant="outline"
              disabled={excluindo}
              onClick={() => setDemandaParaExcluir(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              loading={excluindo}
              onClick={handleExecutarExclusao}
            >
              Excluir Demanda
            </Button>
          </div>
        }
      >
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Tem certeza que deseja excluir a demanda <strong>"{demandaParaExcluir?.titulo}"</strong>? Esta ação não pode ser desfeita.
        </p>
      </Modal>

      {/* Modal: Lista de Candidatos da Vaga */}
      <Modal
        isOpen={Boolean(demandaCandidatos)}
        onClose={() => setDemandaCandidatos(null)}
        title={`Candidatos: ${demandaCandidatos?.titulo}`}
        maxWidth="640px"
      >
        {carregandoCandidatos ? (
          <LoadingSpinner text="Carregando candidatos..." />
        ) : candidatos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
            Nenhum diarista se inscreveu para esta vaga até o momento.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {candidatos.map((cand) => (
              <div
                key={cand.id}
                style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
                      {cand.diarista_nome}
                    </strong>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.2rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Bairro: {cand.diarista_bairro || 'São Paulo'}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#b45309', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                        ★ {cand.diarista_nota_media || '5.0'}
                      </span>
                    </div>
                  </div>

                  <div>
                    {cand.status === 'aceita' ? (
                      <span className="badge badge-success">Aprovado</span>
                    ) : cand.status === 'recusada' ? (
                      <span className="badge badge-danger">Recusado</span>
                    ) : (
                      <span className="badge badge-warning">Pendente</span>
                    )}
                  </div>
                </div>

                {cand.status === 'aceita' ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', backgroundColor: '#dcfce7', borderRadius: 'var(--radius-sm)', border: '1px solid #bbf7d0', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Phone size={14} /> Telefone: <strong>{cand.diarista_telefone}</strong>
                    </span>

                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVisualizarCurriculo(cand)}
                        icon={<FileText size={14} />}
                      >
                        Ver Currículo
                      </Button>
                      <a
                        href={`https://wa.me/55${cand.diarista_telefone?.replace(/\D/g, '')}?text=Ol%C3%A1%20${encodeURIComponent(cand.diarista_nome)},%20sua%20candidatura%20no%20Quadro%20de%20Di%C3%A1rias%20foi%20aprovada!`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-primary"
                        style={{ backgroundColor: '#15803d', borderColor: '#15803d' }}
                      >
                        <MessageCircle size={14} /> Abrir WhatsApp
                      </a>

                      {demandaCandidatos?.status === 'preenchida' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleIniciarConclusao(demandaCandidatos, { id: cand.diarista_id, nome: cand.diarista_nome })}
                          icon={<CheckCircle2 size={14} />}
                          title="Confirmar término do serviço e pagamento realizado"
                        >
                          Concluir Diária
                        </Button>
                      )}

                      {demandaCandidatos?.status === 'concluida' && (
                        (() => {
                          const avaliacaoCand = avaliacoesEnviadas.find((a) => a.demanda_id === demandaCandidatos.id);
                          return avaliacaoCand ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAbrirAvaliacao(demandaCandidatos, cand.diarista_id, cand.diarista_nome, 'diarista')}
                              icon={<Star size={14} color="#f59e0b" fill="#f59e0b" />}
                            >
                              Ver Avaliação (★ {avaliacaoCand.nota})
                            </Button>
                          ) : (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleAbrirAvaliacao(demandaCandidatos, cand.diarista_id, cand.diarista_nome, 'diarista')}
                              icon={<Star size={14} />}
                            >
                              Avaliar Diarista
                            </Button>
                          );
                        })()
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleVisualizarCurriculo(cand)}
                      icon={<FileText size={14} />}
                      title="Visualizar currículo completo do candidato"
                    >
                      Ver Currículo
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={processandoCandidatoId === cand.id || recusandoCandidato}
                      onClick={() => handleIniciarRecusa(cand)}
                      icon={<XCircle size={14} />}
                      title="Recusar e apagar candidatura"
                    >
                      Recusar
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={processandoCandidatoId === cand.id || recusandoCandidato}
                      loading={processandoCandidatoId === cand.id}
                      onClick={() => handleMudarStatusCandidato(cand.id, 'aceita')}
                      icon={<Check size={14} />}
                    >
                      Aprovar & Liberar Contato
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Modal: Confirmação de Recusa da Candidatura (Ação Destrutiva / DELETE) */}
      <Modal
        isOpen={Boolean(candidatoParaRecusar)}
        onClose={() => setCandidatoParaRecusar(null)}
        title="Confirmar Recusa da Candidatura"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
            <Button
              variant="outline"
              disabled={recusandoCandidato}
              onClick={() => setCandidatoParaRecusar(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              loading={recusandoCandidato}
              onClick={handleConfirmarRecusa}
            >
              Recusar e Apagar Candidatura
            </Button>
          </div>
        }
      >
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Tem certeza de que deseja recusar o candidato <strong>"{candidatoParaRecusar?.diarista_nome}"</strong> para a vaga <strong>"{demandaCandidatos?.titulo}"</strong>?
          Ao confirmar a recusa, a candidatura será apagada permanentemente do sistema.
        </p>
      </Modal>

      {/* Modal: Visualização de Currículo do Diarista */}
      <ModalCurriculo
        isOpen={Boolean(candidatoCurriculo)}
        onClose={() => setCandidatoCurriculo(null)}
        candidato={candidatoCurriculo}
        onAprovar={(candId) => handleMudarStatusCandidato(candId, 'aceita')}
        onRecusar={(cand) => handleIniciarRecusa(cand)}
        processando={processandoCandidatoId === candidatoCurriculo?.id || recusandoCandidato}
      />

      {/* Modal: Confirmação de Conclusão da Diária */}
      <Modal
        isOpen={Boolean(demandaParaConcluir)}
        onClose={() => setDemandaParaConcluir(null)}
        title="Confirmar Conclusão do Trabalho"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
            <Button
              variant="outline"
              disabled={concluindoDemanda}
              onClick={() => setDemandaParaConcluir(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              loading={concluindoDemanda}
              onClick={handleConfirmarConclusao}
              icon={<CheckCircle2 size={16} />}
            >
              Sim, Confirmar Conclusão
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          <p style={{ margin: 0 }}>
            Deseja marcar a vaga <strong>"{demandaParaConcluir?.titulo}"</strong> como concluída?
          </p>
          <p style={{ fontSize: '0.9rem', margin: 0, color: 'var(--text-muted)' }}>
            Após confirmar, o status passará para <strong>"Concluída"</strong> e será possível registrar a avaliação do serviço.
          </p>
        </div>
      </Modal>

      {/* Modal: Avaliação e Feedback Mútuo */}
      <ModalAvaliacao
        isOpen={Boolean(dadosModalAvaliacao)}
        onClose={() => setDadosModalAvaliacao(null)}
        demanda={dadosModalAvaliacao?.demanda}
        avaliadoId={dadosModalAvaliacao?.avaliadoId}
        avaliadoNome={dadosModalAvaliacao?.avaliadoNome}
        papelAvaliado={dadosModalAvaliacao?.papelAvaliado}
        avaliacaoExistente={dadosModalAvaliacao?.avaliacaoExistente}
        onSalvar={handleSalvarAvaliacao}
      />
    </div>
  );
}
