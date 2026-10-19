import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Sparkles,
  Settings,
  Check,
  CheckCircle2,
  CalendarDays
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import Button from '../components/Button';
import FormInput from '../components/FormInput';
import Modal from '../components/Modal';
import Alert from '../components/Alert';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../services/api';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const ATALHOS_HORARIOS = [
  { id: 'integral', rotulo: 'Integral (08h às 17h)', inicio: '08:00', fim: '17:00' },
  { id: 'manha', rotulo: 'Manhã (08h às 12h)', inicio: '08:00', fim: '12:00' },
  { id: 'tarde', rotulo: 'Tarde (13h às 17h)', inicio: '13:00', fim: '17:00' },
  { id: 'noite', rotulo: 'Noite (18h às 22h)', inicio: '18:00', fim: '22:00' }
];

function obterDataIsoHoje() {
  const agora = new Date();
  const a = agora.getFullYear();
  const m = String(agora.getMonth() + 1).padStart(2, '0');
  const d = String(agora.getDate()).padStart(2, '0');
  return `${a}-${m}-${d}`;
}

function formatarHora(hora) {
  if (!hora) return '';
  return hora.slice(0, 5);
}

export default function DisponibilidadeCalendario() {
  const { usuarioAtual } = useUser();

  const isDiarista =
    usuarioAtual && (usuarioAtual.tipo === 'diarista' || usuarioAtual.tipo === 'ambos');

  // Estado do mês no calendário com lazy initialization pura
  const [anoAtual, setAnoAtual] = useState(() => new Date().getFullYear());
  const [mesAtual, setMesAtual] = useState(() => new Date().getMonth());
  const [dataSelecionada, setDataSelecionada] = useState(obterDataIsoHoje);
  const [disponibilidades, setDisponibilidades] = useState([]);
  const [carregando, setCarregando] = useState(Boolean(isDiarista));
  const [salvando, setSalvando] = useState(false);
  const [salvandoLote, setSalvandoLote] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState(null);
  const [mensagemErro, setMensagemErro] = useState(null);

  // Formulário de informações de horário para o dia selecionado
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [horaFim, setHoraFim] = useState('17:00');
  const [observacao, setObservacao] = useState('');

  // Modal de confirmação de exclusão (exigido por GEMINI.md Seção 4.1)
  const [slotParaExcluir, setSlotParaExcluir] = useState(null);
  const [excluindo, setExcluindo] = useState(false);

  useEffect(() => {
    let cancelado = false;
    if (isDiarista) {
      api.get('/disponibilidades/minhas')
        .then((res) => {
          if (!cancelado && res.data?.success) {
            setDisponibilidades(res.data.data || []);
          }
        })
        .catch((err) => {
          if (!cancelado) {
            setMensagemErro(err.message || 'Falha ao carregar horários de disponibilidade.');
          }
        })
        .finally(() => {
          if (!cancelado) setCarregando(false);
        });
    }
    return () => {
      cancelado = true;
    };
  }, [isDiarista]);

  // Auto-dismiss do pop-up de sucesso após 4 segundos
  useEffect(() => {
    if (!mensagemSucesso) return;
    const timer = setTimeout(() => {
      setMensagemSucesso(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [mensagemSucesso]);

  // Auto-dismiss do pop-up de erro após 4 segundos
  useEffect(() => {
    if (!mensagemErro) return;
    const timer = setTimeout(() => {
      setMensagemErro(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [mensagemErro]);

  // Bloqueio amigável para quem é apenas contratante
  if (!isDiarista) {
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
            <CalendarIcon size={28} />
          </div>

          <h2 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
            Agenda Disponível para Prestadores
          </h2>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '1.75rem' }}>
            Seu perfil atual é <strong>Contratante</strong>. Para definir dias e horários livres em que você pode aceitar serviços, altere seu papel para <strong>Diarista</strong> ou <strong>Ambos</strong> nas Configurações.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <Link to="/diaristas">
              <Button variant="outline">
                Buscar Diaristas Disponíveis
              </Button>
            </Link>
            <Link to="/configuracoes">
              <Button variant="primary" icon={<Settings size={16} />}>
                Configurações da Conta
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Calendário - Cálculo dos dias
  const primeiroDiaSemana = new Date(anoAtual, mesAtual, 1).getDay();
  const diasNoMes = new Date(anoAtual, mesAtual + 1, 0).getDate();

  const mesAnterior = () => {
    if (mesAtual === 0) {
      setMesAtual(11);
      setAnoAtual(anoAtual - 1);
    } else {
      setMesAtual(mesAtual - 1);
    }
  };

  const proximoMes = () => {
    if (mesAtual === 11) {
      setMesAtual(0);
      setAnoAtual(anoAtual + 1);
    } else {
      setMesAtual(mesAtual + 1);
    }
  };

  const irParaHoje = () => {
    const agora = new Date();
    setAnoAtual(agora.getFullYear());
    setMesAtual(agora.getMonth());
    setDataSelecionada(obterDataIsoHoje());
  };

  // Mapeamento de slots por data
  const mapaDisponibilidades = disponibilidades.reduce((acc, curr) => {
    if (!acc[curr.data]) acc[curr.data] = [];
    acc[curr.data].push(curr);
    return acc;
  }, {});

  const slotsDoDiaSelecionado = mapaDisponibilidades[dataSelecionada] || [];

  // Total de dias salvos no mês atual
  const diasSalvosNoMes = Array.from({ length: diasNoMes }).filter((_, i) => {
    const diaFmt = String(i + 1).padStart(2, '0');
    const mesFmt = String(mesAtual + 1).padStart(2, '0');
    const dataStr = `${anoAtual}-${mesFmt}-${diaFmt}`;
    return (mapaDisponibilidades[dataStr] || []).length > 0;
  }).length;

  // Dias úteis (Seg a Sex) livres no mês atual
  const diasUteisLivresNoMes = Array.from({ length: diasNoMes }).reduce((acc, _, i) => {
    const dia = i + 1;
    const diaObj = new Date(anoAtual, mesAtual, dia);
    const diaSemana = diaObj.getDay();
    if (diaSemana >= 1 && diaSemana <= 5) {
      const diaFmt = String(dia).padStart(2, '0');
      const mesFmt = String(mesAtual + 1).padStart(2, '0');
      const dataStr = `${anoAtual}-${mesFmt}-${diaFmt}`;
      if (!mapaDisponibilidades[dataStr] || mapaDisponibilidades[dataStr].length === 0) {
        acc.push(dataStr);
      }
    }
    return acc;
  }, []);

  const formatarDataCabecalho = (dataStr) => {
    if (!dataStr) return '';
    try {
      const [ano, mes, dia] = dataStr.split('-');
      const dataObj = new Date(Number(ano), Number(mes) - 1, Number(dia));
      return `${dia} de ${MESES[dataObj.getMonth()]} de ${ano} (${DIAS_SEMANA[dataObj.getDay()]})`;
    } catch {
      return dataStr;
    }
  };

  const formatarDataCurta = (dataStr) => {
    if (!dataStr) return '';
    try {
      const [, mes, dia] = dataStr.split('-');
      return `${dia}/${mes}`;
    } catch {
      return dataStr;
    }
  };

  // Ao clicar em um dia do calendário: seleciona o dia e carrega informações existentes
  const handleSelecionarDia = (dataStr) => {
    setDataSelecionada(dataStr);
    setMensagemErro(null);
    setMensagemSucesso(null);

    const slotsExistentes = mapaDisponibilidades[dataStr] || [];
    if (slotsExistentes.length > 0) {
      const primeiro = slotsExistentes[0];
      const hIni = formatarHora(primeiro.hora_inicio);
      const hFim = formatarHora(primeiro.hora_fim);
      setHoraInicio(hIni);
      setHoraFim(hFim);
      setObservacao(primeiro.observacao || '');

      const atalhoCorrespondente = ATALHOS_HORARIOS.find(
        (a) => a.inicio === hIni && a.fim === hFim
      );
      if (atalhoCorrespondente) {
        setTurnoAtivoId(atalhoCorrespondente.id);
      } else {
        setTurnoAtivoId(null);
      }
    }
  };

  // Selecionar turno rápido no formulário
  const handleSelecionarTurno = (atalho) => {
    setTurnoAtivoId(atalho.id);
    setHoraInicio(atalho.inicio);
    setHoraFim(atalho.fim);
  };

  // Salvar a disponibilidade para o dia selecionado (troca o horário existente se já houver um para esse dia)
  const handleSalvarDisponibilidade = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setMensagemErro(null);
    setMensagemSucesso(null);

    if (!dataSelecionada) {
      setMensagemErro('Selecione uma data no calendário.');
      return;
    }

    if (!horaInicio || !horaFim) {
      setMensagemErro('Informe os horários de início e término.');
      return;
    }

    if (horaInicio >= horaFim) {
      setMensagemErro('A hora de início deve ser anterior à hora de término.');
      return;
    }

    try {
      setSalvando(true);

      // Se já houver horário para este dia, remove os anteriores para trocar (não adiciona duplicado)
      const slotsExistentes = mapaDisponibilidades[dataSelecionada] || [];
      if (slotsExistentes.length > 0) {
        await Promise.all(
          slotsExistentes.map((slot) => api.delete(`/disponibilidades/${slot.id}`))
        );
      }

      const payload = {
        data: dataSelecionada,
        hora_inicio: horaInicio,
        hora_fim: horaFim,
        observacao: observacao.trim()
      };

      const res = await api.post('/disponibilidades', payload);
      if (res.data?.success) {
        const novoItem = {
          id: res.data.data?.id || Number(res.data.data?.insertId || 0),
          diarista_id: usuarioAtual.id,
          data: dataSelecionada,
          hora_inicio: horaInicio,
          hora_fim: horaFim,
          status: 'disponivel',
          observacao: observacao.trim()
        };

        // Substitui no estado local (remove os antigos desta data e adiciona o novo)
        setDisponibilidades((prev) => [
          ...prev.filter((s) => s.data !== dataSelecionada),
          novoItem
        ]);

        const textoAcao = slotsExistentes.length > 0 ? 'trocado' : 'salvo';
        setMensagemSucesso(`Horário ${textoAcao} com sucesso (${horaInicio} às ${horaFim}) para o dia ${formatarDataCurta(dataSelecionada)}!`);
      }
    } catch (err) {
      setMensagemErro(err.message || 'Falha ao salvar horário de disponibilidade.');
    } finally {
      setSalvando(false);
    }
  };

  // Aplicar as informações atuais em todos os dias úteis (Seg a Sex) livres do mês
  const handleAplicarDiasUteis = async () => {
    setMensagemErro(null);
    setMensagemSucesso(null);

    if (diasUteisLivresNoMes.length === 0) {
      setMensagemSucesso(`Todos os dias úteis (Seg a Sex) de ${MESES[mesAtual]} já estão salvos na sua agenda!`);
      return;
    }

    if (!horaInicio || !horaFim) {
      setMensagemErro('Informe os horários de início e término.');
      return;
    }

    try {
      setSalvandoLote(true);
      const payload = {
        datas: diasUteisLivresNoMes,
        hora_inicio: horaInicio,
        hora_fim: horaFim,
        observacao: observacao.trim()
      };

      const res = await api.post('/disponibilidades', payload);
      if (res.data?.success) {
        const novosItens = (Array.isArray(res.data.data) ? res.data.data : diasUteisLivresNoMes.map((d, idx) => ({
          id: Date.now() + idx,
          data: d
        }))).map((item, idx) => ({
          id: item.id || Date.now() + idx,
          diarista_id: usuarioAtual.id,
          data: item.data || diasUteisLivresNoMes[idx],
          hora_inicio: horaInicio,
          hora_fim: horaFim,
          status: 'disponivel',
          observacao: observacao.trim()
        }));

        setDisponibilidades((prev) => [...prev, ...novosItens]);
        setMensagemSucesso(`${diasUteisLivresNoMes.length} dias úteis de ${MESES[mesAtual]} salvos com sucesso (${horaInicio} às ${horaFim})!`);
      }
    } catch (err) {
      setMensagemErro(err.message || 'Falha ao salvar dias úteis.');
    } finally {
      setSalvandoLote(false);
    }
  };

  // Exclusão de horário confirmada no modal
  const handleConfirmarExclusao = async () => {
    if (!slotParaExcluir) return;

    try {
      setExcluindo(true);
      await api.delete(`/disponibilidades/${slotParaExcluir.id}`);

      // Atualiza estado local imediatamente (sem reload)
      setDisponibilidades((prev) => prev.filter((s) => s.id !== slotParaExcluir.id));
      setMensagemSucesso('Horário removido da sua agenda com sucesso!');
      setSlotParaExcluir(null);
    } catch (err) {
      setMensagemErro(err.message || 'Falha ao excluir horário.');
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '1120px', paddingBottom: '3.5rem' }}>
      {/* Banner / Cabeçalho */}
      <header style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
          <Sparkles size={16} /> Minha Agenda & Calendário
        </div>
        <h1 style={{ fontSize: '1.85rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
          Dias e Horários Disponíveis
        </h1>
      </header>

      {carregando ? (
        <div style={{ padding: '4rem 0' }}>
          <LoadingSpinner text="Carregando sua agenda..." fullPage />
        </div>
      ) : (
        <div className="agenda-main-grid">
          {/* Card do Calendário Interativo */}
          <div className="responsive-card" style={{ marginBottom: 0 }}>
            {/* Barra de Navegação do Mês */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.25rem'
              }}
            >
              <div>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0, fontWeight: 700 }}>
                  {MESES[mesAtual]} {anoAtual}
                </h2>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  {diasSalvosNoMes === 0 ? (
                    'Nenhum dia salvo neste mês'
                  ) : (
                    <strong style={{ color: 'var(--success)' }}>
                      ✔ {diasSalvosNoMes} {diasSalvosNoMes === 1 ? 'dia salvo com disponibilidade' : 'dias salvos com disponibilidade'}
                    </strong>
                  )}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Button variant="outline" size="sm" onClick={irParaHoje}>
                  Hoje
                </Button>
                <button
                  type="button"
                  onClick={mesAnterior}
                  aria-label="Mês anterior"
                  style={{
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.4rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={proximoMes}
                  aria-label="Próximo mês"
                  style={{
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.4rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Cabeçalho dos Dias da Semana */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                textAlign: 'center',
                fontWeight: 700,
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                marginBottom: '0.5rem',
                textTransform: 'uppercase'
              }}
            >
              {DIAS_SEMANA.map((d) => (
                <div key={d} style={{ padding: '0.25rem 0' }}>{d}</div>
              ))}
            </div>

            {/* Grade de Dias do Mês */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '0.4rem'
              }}
            >
              {/* Espaços vazios antes do dia 1 */}
              {Array.from({ length: primeiroDiaSemana }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}

              {/* Dias do Mês */}
              {Array.from({ length: diasNoMes }).map((_, i) => {
                const dia = i + 1;
                const diaFmt = String(dia).padStart(2, '0');
                const mesFmt = String(mesAtual + 1).padStart(2, '0');
                const dataStr = `${anoAtual}-${mesFmt}-${diaFmt}`;
                const slots = mapaDisponibilidades[dataStr] || [];
                const temSlots = slots.length > 0;
                const isSelecionado = dataSelecionada === dataStr;

                return (
                  <button
                    key={dia}
                    type="button"
                    onClick={() => handleSelecionarDia(dataStr)}
                    style={{
                      height: '52px',
                      padding: '0.4rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 'var(--radius-md)',
                      // Se tem slots salvos: borda verde destacada. Se selecionado: foco primário.
                      border: isSelecionado
                        ? '2px solid var(--primary)'
                        : temSlots
                          ? '1.5px solid var(--success-border)'
                          : '1px solid var(--border-color)',
                      // Se tem slots salvos: SEMPRE verde suave (preserva o verde mesmo quando selecionado!)
                      backgroundColor: temSlots
                        ? (isSelecionado ? '#d1fae5' : 'var(--success-light)')
                        : (isSelecionado ? 'var(--primary-light)' : '#ffffff'),
                      color: temSlots
                        ? '#065f46'
                        : (isSelecionado ? 'var(--primary)' : 'var(--text-primary)'),
                      boxShadow: isSelecionado
                        ? '0 0 0 1px var(--primary)'
                        : (temSlots ? '0 1px 2px rgba(16, 185, 129, 0.1)' : 'none'),
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      position: 'relative'
                    }}
                    title={
                      temSlots
                        ? `Dia com horário salvo: ${slots.map((s) => `${formatarHora(s.hora_inicio)} às ${formatarHora(s.hora_fim)}`).join(', ')}`
                        : `Dia ${diaFmt}/${mesFmt}: Clique para selecionar e cadastrar horário`
                    }
                  >
                    {/* Marcador Positivo (Check) no canto superior direito, menor */}
                    {temSlots && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '15px',
                          height: '15px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--success)',
                          color: '#ffffff'
                        }}
                        title="Disponibilidade salva"
                      >
                        <Check size={9} strokeWidth={3} />
                      </span>
                    )}

                    {/* Número do dia */}
                    <span
                      style={{
                        fontSize: '0.92rem',
                        fontWeight: isSelecionado || temSlots ? 700 : 500
                      }}
                    >
                      {dia}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Legenda Informativa do Calendário */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '1.25rem',
                marginTop: '1.25rem',
                paddingTop: '0.85rem',
                borderTop: '1px solid var(--border-color)',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span
                  style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--success-light)',
                    border: '1.5px solid var(--success-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--success)'
                  }}
                >
                  <Check size={10} strokeWidth={3} />
                </span>
                <span><strong>Dia Salvo</strong> (Disponível)</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span
                  style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--primary-light)',
                    border: '2px solid var(--primary)'
                  }}
                />
                <span><strong>Dia Selecionado</strong></span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span
                  style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '4px',
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border-color)'
                  }}
                />
                <span><strong>Dia Livre</strong> (sem horários)</span>
              </div>
            </div>
          </div>

          {/* Painel Lateral: Gestão e Cadastro das Informações do Dia Selecionado */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Card de Informações e Horários Cadastrados */}
            <div className="responsive-card" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Dia Selecionado
                  </span>
                  <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', margin: '0.1rem 0 0' }}>
                    {formatarDataCabecalho(dataSelecionada)}
                  </h3>
                </div>

                <span
                  style={{
                    fontSize: '0.8rem',
                    backgroundColor: slotsDoDiaSelecionado.length > 0 ? 'var(--success-light)' : 'var(--bg-subtle)',
                    color: slotsDoDiaSelecionado.length > 0 ? 'var(--success)' : 'var(--text-muted)',
                    padding: '0.2rem 0.65rem',
                    borderRadius: 'var(--radius-full)',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  {slotsDoDiaSelecionado.length > 0 ? (
                    <>
                      <CheckCircle2 size={14} />
                      <span>{slotsDoDiaSelecionado.length} {slotsDoDiaSelecionado.length === 1 ? 'salvo' : 'salvos'}</span>
                    </>
                  ) : (
                    <span>Livre</span>
                  )}
                </span>
              </div>

              {/* Status do Dia: Já Salvo vs Livre */}
              {slotsDoDiaSelecionado.length > 0 ? (
                <div>
                  <div
                    style={{
                      backgroundColor: 'var(--success-light)',
                      border: '1px solid var(--success-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.75rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      marginBottom: '1rem'
                    }}
                  >
                    <CheckCircle2 size={18} color="var(--success)" style={{ flexShrink: 0 }} />
                    <div>
                      <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#065f46', display: 'block' }}>
                        Dia salvo na sua agenda
                      </span>
                      <p style={{ fontSize: '0.78rem', color: '#047857', margin: 0 }}>
                        Este dia já está cadastrado e marcado no calendário como disponível para contratantes.
                      </p>
                    </div>
                  </div>

                  {/* Listagem de Horários Salvos para Este Dia */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {slotsDoDiaSelecionado.map((slot) => (
                      <div
                        key={slot.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.85rem 1rem',
                          backgroundColor: 'var(--bg-subtle)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-color)'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                            <Clock size={16} color="var(--primary)" />
                            <span>{formatarHora(slot.hora_inicio)} às {formatarHora(slot.hora_fim)}</span>
                            <span
                              style={{
                                fontSize: '0.7rem',
                                backgroundColor: 'var(--success-light)',
                                color: 'var(--success)',
                                padding: '0.1rem 0.4rem',
                                borderRadius: '4px',
                                fontWeight: 700
                              }}
                            >
                              Disponível
                            </span>
                          </div>
                          {slot.observacao && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                              {slot.observacao}
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => setSlotParaExcluir(slot)}
                          title="Remover este horário da agenda"
                          style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: 'var(--danger)',
                            cursor: 'pointer',
                            padding: '0.4rem',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'background-color 0.15s ease'
                          }}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    border: '1px dashed var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem',
                    textAlign: 'center',
                    backgroundColor: 'var(--bg-main)'
                  }}
                >
                  <Clock size={24} color="var(--text-muted)" style={{ margin: '0 auto 0.35rem' }} />
                  <p style={{ fontSize: '0.9rem', marginBottom: '0.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Nenhum horário cadastrado para este dia.
                  </p>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Selecione as informações abaixo e clique em <strong>Salvar Disponibilidade no Dia</strong>.
                  </span>
                </div>
              )}
            </div>

            {/* Formulário: Selecionar Informações e Salvar */}
            <div className="responsive-card" style={{ marginBottom: 0 }}>
              <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '0.4rem', fontWeight: 700 }}>
                {slotsDoDiaSelecionado.length > 0 ? 'Trocar Horário do Dia' : 'Cadastrar Disponibilidade'}
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                {slotsDoDiaSelecionado.length > 0
                  ? 'Este dia já possui horário. Ao salvar, o horário atual será substituído pelo novo.'
                  : 'Preencha ou selecione o turno desejado e clique em salvar.'}
              </p>

              {/* Atalhos Rápidos de Turno */}
              <div style={{ marginBottom: '1.1rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
                  Turnos Sugeridos:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {ATALHOS_HORARIOS.map((atalho) => {
                    const isAtivo = horaInicio === atalho.inicio && horaFim === atalho.fim;
                    return (
                      <button
                        key={atalho.id}
                        type="button"
                        onClick={() => handleSelecionarTurno(atalho)}
                        style={{
                          backgroundColor: isAtivo ? 'var(--primary)' : 'var(--bg-subtle)',
                          color: isAtivo ? '#ffffff' : 'var(--text-primary)',
                          border: isAtivo ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-full)',
                          padding: '0.35rem 0.75rem',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {atalho.rotulo}
                      </button>
                    );
                  })}
                </div>
              </div>

              <form onSubmit={handleSalvarDisponibilidade} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label htmlFor="form-hora-inicio" className="form-label" style={{ fontSize: '0.85rem' }}>
                      Hora Início
                    </label>
                    <input
                      id="form-hora-inicio"
                      type="time"
                      value={horaInicio}
                      onChange={(e) => setHoraInicio(e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="form-hora-fim" className="form-label" style={{ fontSize: '0.85rem' }}>
                      Hora Término
                    </label>
                    <input
                      id="form-hora-fim"
                      type="time"
                      value={horaFim}
                      onChange={(e) => setHoraFim(e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div>
                  <FormInput
                    label="Observação (opcional)"
                    placeholder="Ex: Disponível para serviços rápidos ou faxina pesada"
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  loading={salvando}
                  icon={slotsDoDiaSelecionado.length > 0 ? <Check size={16} /> : <Plus size={16} />}
                  style={{ width: '100%' }}
                >
                  {slotsDoDiaSelecionado.length > 0 ? 'Trocar Horário deste Dia' : 'Salvar Disponibilidade no Dia'}
                </Button>

                {/* Opção para aplicar este mesmo horário em todos os dias úteis */}
                {diasUteisLivresNoMes.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    loading={salvandoLote}
                    onClick={handleAplicarDiasUteis}
                    icon={<CalendarDays size={15} />}
                    style={{ width: '100%', marginTop: '0.25rem' }}
                    title={`Aplica o horário ${horaInicio} às ${horaFim} em todos os ${diasUteisLivresNoMes.length} dias úteis livres deste mês`}
                  >
                    Salvar Também de Seg a Sex ({diasUteisLivresNoMes.length} {diasUteisLivresNoMes.length === 1 ? 'dia' : 'dias'})
                  </Button>
                )}
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão (Obrigatório por GEMINI.md Seção 4.1) */}
      <Modal
        isOpen={Boolean(slotParaExcluir)}
        onClose={() => setSlotParaExcluir(null)}
        title="Confirmar Remoção de Horário"
        footer={
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', width: '100%' }}>
            <Button
              variant="outline"
              disabled={excluindo}
              onClick={() => setSlotParaExcluir(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              loading={excluindo}
              onClick={handleConfirmarExclusao}
              icon={<Trash2 size={16} />}
            >
              Sim, Remover Horário
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.5rem 0' }}>
          <AlertCircle size={28} color="var(--danger)" style={{ flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Deseja realmente remover este horário da sua agenda?
            </p>
            {slotParaExcluir && (
              <div
                style={{
                  backgroundColor: 'var(--bg-subtle)',
                  padding: '0.6rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)'
                }}
              >
                Data: {formatarDataCabecalho(slotParaExcluir.data)} | Horário: {formatarHora(slotParaExcluir.hora_inicio)} às {formatarHora(slotParaExcluir.hora_fim)}
              </div>
            )}
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Após a remoção, contratantes não verão mais esta data/horário como disponível ao pesquisar sua agenda.
            </p>
          </div>
        </div>
      </Modal>

      {/* Alerta Pop-up Flutuante (Toast) para Confirmações de Salvamento, Troca e Exclusão */}
      {mensagemSucesso && (
        <Alert
          popup
          type="success"
          message={mensagemSucesso}
          onClose={() => setMensagemSucesso(null)}
        />
      )}

      {/* Alerta Pop-up Flutuante (Toast) para Erros */}
      {mensagemErro && (
        <Alert
          popup
          type="danger"
          message={mensagemErro}
          onClose={() => setMensagemErro(null)}
        />
      )}
    </div>
  );
}
