import React, { useState, useEffect } from 'react';
import {
  Clock,
  MapPin,
  Star,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  CheckCircle2,
  Info
} from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';
import api from '../services/api';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function ModalAgendaDiarista({ diarista, isOpen, onClose }) {
  const [disponibilidades, setDisponibilidades] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [dataSelecionada, setDataSelecionada] = useState('');
  
  // Mês e ano navegados no calendário
  const [anoAtual, setAnoAtual] = useState(2026);
  const [mesAtual, setMesAtual] = useState(9); // 0-indexed: 9 = Outubro

  useEffect(() => {
    if (!diarista?.id || !isOpen) return;

    let ativo = true;
    const carregarAgenda = async () => {
      setCarregando(true);
      try {
        const res = await api.get(`/disponibilidades/diarista/${diarista.id}`);
        if (ativo && res.data?.success) {
          const dados = res.data.data || [];
          setDisponibilidades(dados);
          if (dados.length > 0) {
            setDataSelecionada(dados[0].data);
            const [ano, mes] = dados[0].data.split('-');
            setAnoAtual(Number(ano));
            setMesAtual(Number(mes) - 1);
          } else {
            setDataSelecionada('2026-10-20');
          }
        }
      } catch (err) {
        console.error('Erro ao carregar agenda do diarista:', err);
      } finally {
        if (ativo) setCarregando(false);
      }
    };

    carregarAgenda();
    return () => {
      ativo = false;
    };
  }, [diarista?.id, isOpen]);

  if (!diarista) return null;

  // Monta a grade de dias do mês atual
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

  // Mapeia disponibilidades por data no formato YYYY-MM-DD
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

  const handleContatoHorario = (slot) => {
    const dataFmt = dataSelecionada.split('-').reverse().join('/');
    if (diarista?.id) {
      api
        .post('/notificacoes/contato-diarista', {
          diarista_id: diarista.id,
          horario_interesse: `${dataFmt} das ${slot.hora_inicio} às ${slot.hora_fim}`,
          mensagem_adicional: slot.observacao || ''
        })
        .catch(() => {});
    }
    if (!diarista.telefone) return;
    const cleanPhone = diarista.telefone.replace(/\D/g, '');
    const msg = encodeURIComponent(
      `Olá ${diarista.nome}, vi no Quadro de Diárias que você tem disponibilidade no dia ${dataFmt} das ${slot.hora_inicio} às ${slot.hora_fim}. Gostaria de combinar o serviço!`
    );
    window.open(`https://wa.me/55${cleanPhone}?text=${msg}`, '_blank');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Agenda de Disponibilidade — ${diarista.nome}`}
      maxWidth="680px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {diarista.telefone ? `Contato: ${diarista.telefone}` : ''}
          </div>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Cabeçalho com Resumo do Profissional */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1rem',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)'
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              fontWeight: 700
            }}
          >
            {diarista.nome?.charAt(0) || 'D'}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <h4 style={{ fontSize: '1.05rem', margin: 0, color: 'var(--text-primary)' }}>
                {diarista.nome}
              </h4>
              <CheckCircle2 size={15} color="var(--primary)" />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <MapPin size={13} color="var(--primary)" /> {diarista.bairro}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Star size={13} color="#eab308" fill="#eab308" /> {Number(diarista.nota_media || 5).toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        {carregando ? (
          <div style={{ padding: '2.5rem 0' }}>
            <LoadingSpinner text="Carregando calendário de horários..." />
          </div>
        ) : (
          <div className="modal-agenda-grid">
            {/* Calendário Mensal */}
            <div
              style={{
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem',
                backgroundColor: '#ffffff'
              }}
            >
              {/* Navegação do Mês */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.75rem'
                }}
              >
                <button
                  type="button"
                  onClick={mesAnterior}
                  className="btn-icon-only"
                  style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', padding: '0.25rem' }}
                  aria-label="Mês anterior"
                >
                  <ChevronLeft size={16} />
                </button>
                <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                  {MESES[mesAtual]} {anoAtual}
                </strong>
                <button
                  type="button"
                  onClick={proximoMes}
                  className="btn-icon-only"
                  style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', padding: '0.25rem' }}
                  aria-label="Próximo mês"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Dias da Semana */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  textAlign: 'center',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  marginBottom: '0.5rem'
                }}
              >
                {DIAS_SEMANA.map((d) => (
                  <div key={d}>{d}</div>
                ))}
              </div>

              {/* Grade de Dias */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: '0.25rem'
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
                  const temSlots = mapaDisponibilidades[dataStr]?.length > 0;
                  const isSelecionado = dataSelecionada === dataStr;

                  return (
                    <button
                      key={dia}
                      type="button"
                      onClick={() => setDataSelecionada(dataStr)}
                      style={{
                        padding: '0.45rem 0.2rem',
                        textAlign: 'center',
                        fontSize: '0.8rem',
                        fontWeight: temSlots || isSelecionado ? 700 : 400,
                        borderRadius: 'var(--radius-sm)',
                        border: isSelecionado ? '2px solid var(--primary)' : '1px solid transparent',
                        backgroundColor: isSelecionado
                          ? 'var(--primary-light)'
                          : temSlots
                            ? 'var(--success-light)'
                            : 'transparent',
                        color: isSelecionado
                          ? 'var(--primary)'
                          : temSlots
                            ? 'var(--success)'
                            : 'var(--text-primary)',
                        cursor: 'pointer',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '2px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span>{dia}</span>
                      {temSlots && (
                        <span
                          style={{
                            width: '4px',
                            height: '4px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--success)'
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legenda */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  marginTop: '0.75rem',
                  paddingTop: '0.5rem',
                  borderTop: '1px solid var(--border-color)',
                  fontSize: '0.725rem',
                  color: 'var(--text-muted)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--success)' }} />
                  <span>Com horários livres</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', border: '2px solid var(--primary)' }} />
                  <span>Dia selecionado</span>
                </div>
              </div>
            </div>

            {/* Painel de Horários Disponíveis do Dia Selecionado */}
            <div
              style={{
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem',
                backgroundColor: 'var(--bg-main)',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div style={{ marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Horários para:
                </span>
                <h5 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', margin: '0.1rem 0 0' }}>
                  {formatarDataCabecalho(dataSelecionada) || 'Selecione uma data'}
                </h5>
              </div>

              {slotsDoDiaSelecionado.length === 0 ? (
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px dashed var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '1.5rem 1rem',
                    textAlign: 'center',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Info size={24} color="var(--text-muted)" />
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Nenhum horário cadastrado para este dia.
                  </p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Clique nos dias destacados em verde no calendário.
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', flex: 1, overflowY: 'auto' }}>
                  {slotsDoDiaSelecionado.map((slot) => (
                    <div
                      key={slot.id}
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.75rem',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            fontSize: '0.9rem'
                          }}
                        >
                          <Clock size={14} color="var(--primary)" />
                          {slot.hora_inicio} às {slot.hora_fim}
                        </span>
                        <span
                          style={{
                            backgroundColor: 'var(--success-light)',
                            color: 'var(--success)',
                            padding: '0.1rem 0.45rem',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: 700
                          }}
                        >
                          Livre
                        </span>
                      </div>

                      {slot.observacao && (
                        <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0.5rem' }}>
                          {slot.observacao}
                        </p>
                      )}

                      {diarista.telefone && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleContatoHorario(slot)}
                          icon={<MessageCircle size={14} />}
                          style={{ width: '100%', marginTop: '0.25rem', fontSize: '0.775rem' }}
                        >
                          Contatar neste Horário
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
