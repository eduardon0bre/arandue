import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  Briefcase,
  FileCheck,
  Star,
  CheckCircle2
} from 'lucide-react';
import Button from '../components/Button';
import Modal from '../components/Modal';
import ModalCurriculo from '../components/ModalCurriculo';
import ModalAvaliacao from '../components/ModalAvaliacao';
import ModalCandidatosDemanda from '../components/ModalCandidatosDemanda';
import TabelaDemandasContratante from '../components/TabelaDemandasContratante';
import TabelaCandidaturasDiarista from '../components/TabelaCandidaturasDiarista';
import FeedbacksList from '../components/FeedbacksList';
import Alert from '../components/Alert';
import { useUser } from '../context/UserContext';
import api from '../services/api';

export default function PainelContratante() {
  const { usuarioAtual } = useUser();

  const isDiaristaExclusivo = usuarioAtual?.tipo === 'diarista';
  const isContratanteExclusivo = usuarioAtual?.tipo === 'contratante';
  const isAmbos = usuarioAtual?.tipo === 'ambos';

  // RF-08: Controle de abas para usuários com papel 'AMBOS'
  const [abaAtiva, setAbaAtiva] = useState(() => (isDiaristaExclusivo ? 'candidaturas' : 'vagas'));

  // Garante aba válida sem efeito colateral sincronizado
  const abaEfetiva =
    isDiaristaExclusivo && abaAtiva === 'vagas'
      ? 'candidaturas'
      : isContratanteExclusivo && abaAtiva === 'candidaturas'
        ? 'vagas'
        : abaAtiva;

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
    let ativo = true;
    if (!usuarioAtual?.id) return;

    api.get(`/avaliacoes/usuario/${usuarioAtual.id}/media`)
      .then((res) => {
        if (ativo && res.data?.success && res.data.data) {
          setResumoAvaliacao(res.data.data);
        }
      })
      .catch(() => {
        // Fallback silencioso
      });

    return () => {
      ativo = false;
    };
  }, [usuarioAtual?.id, avaliacoesEnviadas]);

  // Modais e ações
  const [demandaParaConcluir, setDemandaParaConcluir] = useState(null);
  const [concluindoDemanda, setConcluindoDemanda] = useState(false);
  const [dadosModalAvaliacao, setDadosModalAvaliacao] = useState(null);
  const [alerta, setAlerta] = useState(null);
  const [demandaParaExcluir, setDemandaParaExcluir] = useState(null);
  const [excluindo, setExcluindo] = useState(false);
  const [demandaCandidatos, setDemandaCandidatos] = useState(null);
  const [candidatos, setCandidatos] = useState([]);
  const [carregandoCandidatos, setCarregandoCandidatos] = useState(false);
  const [processandoCandidatoId, setProcessandoCandidatoId] = useState(null);
  const [candidatoCurriculo, setCandidatoCurriculo] = useState(null);
  const [candidatoParaRecusar, setCandidatoParaRecusar] = useState(null);
  const [recusandoCandidato, setRecusandoCandidato] = useState(false);

  // Carregamento inicial de dados sem chamada de setState síncrona
  useEffect(() => {
    let ativo = true;
    const usuarioId = usuarioAtual?.id;

    // 1. Demandas
    const params = usuarioId ? { contratante_id: usuarioId } : {};
    api.get('/demandas', { params })
      .then((response) => {
        if (ativo && response.data?.success) {
          setDemandas(response.data.data || []);
        }
      })
      .catch((err) => {
        if (ativo) {
          setAlerta({ type: 'danger', message: err.message || 'Erro ao carregar demandas.' });
        }
      })
      .finally(() => {
        if (ativo) setCarregandoDemandas(false);
      });

    // 2. Avaliações enviadas
    if (usuarioId) {
      api.get(`/avaliacoes/enviadas/${usuarioId}`)
        .then((response) => {
          if (ativo && response.data?.success) {
            setAvaliacoesEnviadas(response.data.data || []);
          }
        })
        .catch(() => {});
    }

    // 3. Candidaturas (se diarista ou ambos)
    if (usuarioId && (isDiaristaExclusivo || isAmbos)) {
      api.get(`/candidaturas/diarista/${usuarioId}`)
        .then((response) => {
          if (ativo && response.data?.success) {
            setCandidaturas(response.data.data || []);
          }
        })
        .catch((err) => {
          console.error('Erro ao buscar candidaturas:', err);
        })
        .finally(() => {
          if (ativo) setCarregandoCandidaturas(false);
        });
    }

    return () => {
      ativo = false;
    };
  }, [usuarioAtual?.id, isDiaristaExclusivo, isAmbos]);

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
        setCandidatos((prev) => prev.filter((c) => c.id !== candidatoParaRecusar.id));

        if (demandaCandidatos) {
          setDemandas((prev) =>
            prev.map((d) =>
              d.id === demandaCandidatos.id
                ? { ...d, total_candidatos: Math.max(0, (Number(d.total_candidatos) || 1) - 1) }
                : d
            )
          );
        }

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
        setDemandas((prev) =>
          prev.map((d) => (d.id === demandaParaConcluir.id ? { ...d, status: 'concluida' } : d))
        );

        if (demandaCandidatos?.id === demandaParaConcluir.id) {
          setDemandaCandidatos((prev) => (prev ? { ...prev, status: 'concluida' } : null));
        }

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

        if (abaEfetiva === 'vagas' || isContratanteExclusivo) {
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
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: 'var(--primary)',
              fontWeight: 700,
              fontSize: '0.85rem',
              textTransform: 'uppercase',
              marginBottom: '0.25rem'
            }}
          >
            <LayoutDashboard size={16} /> Central de Demandas
          </div>
          <h1 style={{ fontSize: '1.75rem', color: 'var(--text-primary)', margin: 0 }}>
            Minhas Demandas
          </h1>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.9rem',
              marginTop: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              flexWrap: 'wrap'
            }}
          >
            <span>
              Gerenciamento de serviços e oportunidades para o perfil{' '}
              <strong>{usuarioAtual?.nome}</strong> ({usuarioAtual?.tipo}).
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                backgroundColor: '#fef3c7',
                color: '#b45309',
                border: '1px solid #fde68a',
                borderRadius: 'var(--radius-full)',
                padding: '0.15rem 0.55rem',
                fontSize: '0.8rem',
                fontWeight: 700
              }}
            >
              <Star size={13} fill="#f59e0b" color="#f59e0b" />
              {resumoAvaliacao && resumoAvaliacao.total_avaliacoes > 0
                ? `${Number(resumoAvaliacao.nota_media).toFixed(1)} ★ (${resumoAvaliacao.total_avaliacoes} ${
                    resumoAvaliacao.total_avaliacoes === 1 ? 'avaliação' : 'avaliações'
                  })`
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
              backgroundColor: abaEfetiva === 'vagas' ? '#ffffff' : 'transparent',
              color: abaEfetiva === 'vagas' ? 'var(--primary)' : 'var(--text-secondary)',
              boxShadow: abaEfetiva === 'vagas' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
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
              backgroundColor: abaEfetiva === 'candidaturas' ? '#ffffff' : 'transparent',
              color: abaEfetiva === 'candidaturas' ? 'var(--primary)' : 'var(--text-secondary)',
              boxShadow: abaEfetiva === 'candidaturas' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
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
            backgroundColor: abaEfetiva === 'feedbacks' ? '#ffffff' : 'transparent',
            color: abaEfetiva === 'feedbacks' ? 'var(--primary)' : 'var(--text-secondary)',
            boxShadow: abaEfetiva === 'feedbacks' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <Star
            size={16}
            color={abaEfetiva === 'feedbacks' ? '#f59e0b' : 'currentColor'}
            fill={abaEfetiva === 'feedbacks' ? '#f59e0b' : 'none'}
          />
          <span>Feedbacks & Notas</span>
        </button>
      </div>

      {/* Visão 1: Vagas Criadas (Contratante e Ambos) */}
      {abaEfetiva === 'vagas' && (
        <TabelaDemandasContratante
          demandas={demandas}
          carregando={carregandoDemandas}
          avaliacoesEnviadas={avaliacoesEnviadas}
          onAbrirCandidatos={handleAbrirCandidatos}
          onIniciarConclusao={handleIniciarConclusao}
          onAbrirAvaliacao={handleAbrirAvaliacao}
          onExcluir={setDemandaParaExcluir}
        />
      )}

      {/* Visão 2: Minhas Candidaturas (Diarista e Ambos) */}
      {abaEfetiva === 'candidaturas' && (
        <TabelaCandidaturasDiarista
          candidaturas={candidaturas}
          carregando={carregandoCandidaturas}
          avaliacoesEnviadas={avaliacoesEnviadas}
          onIniciarConclusao={handleIniciarConclusao}
          onAbrirAvaliacao={handleAbrirAvaliacao}
        />
      )}

      {/* Visão 3: Feedbacks Recebidos */}
      {abaEfetiva === 'feedbacks' && (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
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

      {/* Modal: Lista e Gerenciamento de Candidatos da Vaga */}
      <ModalCandidatosDemanda
        isOpen={Boolean(demandaCandidatos)}
        onClose={() => setDemandaCandidatos(null)}
        demanda={demandaCandidatos}
        candidatos={candidatos}
        carregando={carregandoCandidatos}
        processandoCandidatoId={processandoCandidatoId}
        recusandoCandidato={recusandoCandidato}
        avaliacoesEnviadas={avaliacoesEnviadas}
        onVisualizarCurriculo={handleVisualizarCurriculo}
        onIniciarRecusa={handleIniciarRecusa}
        onAprovar={(candId) => handleMudarStatusCandidato(candId, 'aceita')}
        onIniciarConclusao={handleIniciarConclusao}
        onAbrirAvaliacao={handleAbrirAvaliacao}
      />

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
