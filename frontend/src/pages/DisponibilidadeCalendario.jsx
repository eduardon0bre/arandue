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
  Settings
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
  { rotulo: 'Manhã (08h às 12h)', inicio: '08:00', fim: '12:00' },
  { rotulo: 'Tarde (13h às 17h)', inicio: '13:00', fim: '17:00' },
  { rotulo: 'Integral (08h às 17h)', inicio: '08:00', fim: '17:00' },
  { rotulo: 'Noite (18h às 22h)', inicio: '18:00', fim: '22:00' }
];

function obterDataIsoHoje() {
  const agora = new Date();
  const a = agora.getFullYear();
  const m = String(agora.getMonth() + 1).padStart(2, '0');
  const d = String(agora.getDate()).padStart(2, '0');
  return `${a}-${m}-${d}`;
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
  const [mensagemSucesso, setMensagemSucesso] = useState(null);
  const [mensagemErro, setMensagemErro] = useState(null);

  // Formulário de novo horário
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [horaFim, setHoraFim] = useState('17:00');
  const [observacao, setObservacao] = useState('');

  // Modal de confirmação de exclusão (exigido por GEMINI.md)
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

  // Submissão do novo horário
  const handleAdicionarHorario = async (e) => {
    e.preventDefault();
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
      const payload = {
        data: dataSelecionada,
        hora_inicio: horaInicio,
        hora_fim: horaFim,
        observacao: observacao.trim()
      };

      const res = await api.post('/disponibilidades', payload);
      if (res.data?.success) {
        // Atualiza estado local imediatamente (CRUD sem reload)
        const novoItem = {
          id: res.data.data.id,
          diarista_id: usuarioAtual.id,
          data: dataSelecionada,
          hora_inicio: horaInicio,
          hora_fim: horaFim,
          status: 'disponivel',
          observacao: observacao.trim()
        };
        setDisponibilidades((prev) => [...prev, novoItem]);
        setMensagemSucesso(`Horário ${horaInicio} às ${horaFim} adicionado com sucesso para ${dataSelecionada}!`);
        setObservacao('');
      }
    } catch (err) {
      setMensagemErro(err.message || 'Falha ao salvar horário de disponibilidade.');
    } finally {
      setSalvando(false);
    }
  };

  // Exclusão de horário confirmada no modal
  const handleConfirmarExclusao = async () => {
    if (!slotParaExcluir) return;

    try {
      setExcluindo(true);
      await api.delete(`/disponibilidades/${slotParaExcluir.id}`);

      // Atualiza estado local imediatamente
      setDisponibilidades((prev) => prev.filter((s) => s.id !== slotParaExcluir.id));
      setMensagemSucesso('Horário removido da sua agenda com sucesso.');
      setSlotParaExcluir(null);
    } catch (err) {
      setMensagemErro(err.message || 'Falha ao excluir horário.');
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '1080px', paddingBottom: '3rem' }}>
      {/* Banner / Cabeçalho */}
      <header style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
          <Sparkles size={16} /> Minha Agenda & Calendário
        </div>
        <h1 style={{ fontSize: '1.75rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
          Dias e Horários Disponíveis
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Marque no calendário os dias e intervalos em que você pode aceitar diárias. Contratantes poderão ver sua disponibilidade e entrar em contato direto.
        </p>
      </header>

      {mensagemSucesso && (
        <Alert type="success" message={mensagemSucesso} onClose={() => setMensagemSucesso(null)} />
      )}

      {mensagemErro && (
        <Alert type="danger" message={mensagemErro} onClose={() => setMensagemErro(null)} />
      )}

      {carregando ? (
        <div style={{ padding: '4rem 0' }}>
          <LoadingSpinner text="Carregando sua agenda..." fullPage />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
          {/* Card do Calendário Interativo */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
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
                <h2 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', margin: 0 }}>
                  {MESES[mesAtual]} {anoAtual}
                </h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Clique em um dia para gerenciar os horários
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
                gap: '0.35rem'
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
                    onClick={() => {
                      setDataSelecionada(dataStr);
                      setMensagemErro(null);
                      setMensagemSucesso(null);
                    }}
                    style={{
                      height: '56px',
                      padding: '0.35rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderRadius: 'var(--radius-md)',
                      border: isSelecionado
                        ? '2px solid var(--primary)'
                        : temSlots
                          ? '1px solid var(--success-border)'
                          : '1px solid var(--border-color)',
                      backgroundColor: isSelecionado
                        ? 'var(--primary-light)'
                        : temSlots
                          ? 'var(--success-light)'
                          : '#ffffff',
                      color: isSelecionado
                        ? 'var(--primary)'
                        : temSlots
                          ? 'var(--success)'
                          : 'var(--text-primary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{ fontSize: '0.85rem', fontWeight: isSelecionado || temSlots ? 700 : 500 }}>
                      {dia}
                    </span>

                    {temSlots && (
                      <span
                        style={{
                          fontSize: '0.65rem',
                          backgroundColor: 'var(--success)',
                          color: '#ffffff',
                          borderRadius: 'var(--radius-full)',
                          padding: '0.05rem 0.35rem',
                          fontWeight: 700
                        }}
                      >
                        {slots.length} {slots.length === 1 ? 'vaga' : 'vagas'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legenda do Calendário */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.25rem',
                marginTop: '1.25rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--border-color)',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--success-light)',
                    border: '1px solid var(--success-border)'
                  }}
                />
                <span>Dia com disponibilidade</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--primary-light)',
                    border: '2px solid var(--primary)'
                  }}
                />
                <span>Dia selecionado</span>
              </div>
            </div>
          </div>

          {/* Painel de Gestão do Dia Selecionado */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Lista de Horários Cadastrados para o Dia */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Dia Selecionado
                  </span>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', margin: 0 }}>
                    {formatarDataCabecalho(dataSelecionada)}
                  </h3>
                </div>

                <span
                  style={{
                    fontSize: '0.8rem',
                    backgroundColor: slotsDoDiaSelecionado.length > 0 ? 'var(--success-light)' : 'var(--bg-subtle)',
                    color: slotsDoDiaSelecionado.length > 0 ? 'var(--success)' : 'var(--text-muted)',
                    padding: '0.2rem 0.6rem',
                    borderRadius: 'var(--radius-full)',
                    fontWeight: 700
                  }}
                >
                  {slotsDoDiaSelecionado.length} {slotsDoDiaSelecionado.length === 1 ? 'horário' : 'horários'}
                </span>
              </div>

              {slotsDoDiaSelecionado.length === 0 ? (
                <div
                  style={{
                    border: '1px dashed var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.5rem',
                    textAlign: 'center',
                    color: 'var(--text-secondary)',
                    backgroundColor: 'var(--bg-main)'
                  }}
                >
                  <Clock size={28} color="var(--text-muted)" style={{ margin: '0 auto 0.5rem' }} />
                  <p style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                    Nenhum horário cadastrado para este dia.
                  </p>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Preencha o formulário abaixo para adicionar seus horários livres.
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                          <Clock size={16} color="var(--primary)" />
                          <span>{slot.hora_inicio} às {slot.hora_fim}</span>
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
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                            {slot.observacao}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setSlotParaExcluir(slot)}
                        title="Remover horário"
                        style={{
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: 'var(--danger)',
                          cursor: 'pointer',
                          padding: '0.35rem',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Formulário: Adicionar Novo Horário */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                Adicionar Horário Disponível
              </h3>

              {/* Atalhos Rápidos de Horários */}
              <div style={{ marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>
                  Atalhos de Turnos:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {ATALHOS_HORARIOS.map((atalho) => (
                    <button
                      key={atalho.rotulo}
                      type="button"
                      onClick={() => {
                        setHoraInicio(atalho.inicio);
                        setHoraFim(atalho.fim);
                      }}
                      style={{
                        backgroundColor: horaInicio === atalho.inicio && horaFim === atalho.fim ? 'var(--primary)' : 'var(--bg-subtle)',
                        color: horaInicio === atalho.inicio && horaFim === atalho.fim ? '#ffffff' : 'var(--text-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-full)',
                        padding: '0.3rem 0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {atalho.rotulo}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleAdicionarHorario} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label htmlFor="input-hora-inicio" className="form-label" style={{ fontSize: '0.85rem' }}>
                      Hora Início
                    </label>
                    <input
                      id="input-hora-inicio"
                      type="time"
                      value={horaInicio}
                      onChange={(e) => setHoraInicio(e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="input-hora-fim" className="form-label" style={{ fontSize: '0.85rem' }}>
                      Hora Término
                    </label>
                    <input
                      id="input-hora-fim"
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
                  icon={<Plus size={16} />}
                  style={{ width: '100%' }}
                >
                  Salvar Disponibilidade no Dia
                </Button>
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
                Data: {slotParaExcluir.data} | Horário: {slotParaExcluir.hora_inicio} às {slotParaExcluir.hora_fim}
              </div>
            )}
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Após a remoção, os contratantes não verão mais esta opção ao pesquisar sua disponibilidade.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
