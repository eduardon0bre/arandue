import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bell,
  CheckCheck,
  Check,
  MessageSquare,
  Mail,
  Smartphone,
  ExternalLink
} from 'lucide-react';
import api from '../services/api';

/**
 * Converte data ISO em formato relativo amigável (pt-BR)
 */
function formatarTempoRelativo(dataIso) {
  if (!dataIso) return '';
  const data = new Date(dataIso);
  if (isNaN(data.getTime())) return '';

  const agora = new Date();
  const diffSegundos = Math.floor((agora.getTime() - data.getTime()) / 1000);

  if (diffSegundos < 30) return 'Agora mesmo';
  if (diffSegundos < 60) return `há ${diffSegundos} seg`;
  const diffMinutos = Math.floor(diffSegundos / 60);
  if (diffMinutos < 60) return `há ${diffMinutos} min`;
  const diffHoras = Math.floor(diffMinutos / 60);
  if (diffHoras < 24) return `há ${diffHoras}h`;
  const diffDias = Math.floor(diffHoras / 24);
  if (diffDias === 1) return 'Ontem';
  if (diffDias < 7) return `há ${diffDias} dias`;

  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

/**
 * Extrai canais enviados a partir de string ou array
 */
function extrairCanais(canais) {
  if (!canais) return [];
  if (Array.isArray(canais)) return canais;
  if (typeof canais === 'string') {
    return canais
      .split(',')
      .map((c) => c.trim().toLowerCase())
      .filter(Boolean);
  }
  return [];
}

export default function NotificationBell() {
  const [aberto, setAberto] = useState(false);
  const [notificacoes, setNotificacoes] = useState([]);
  const [totalNaoLidas, setTotalNaoLidas] = useState(0);
  const [carregando, setCarregando] = useState(false);
  const [marcandoTodas, setMarcandoTodas] = useState(false);

  const containerRef = useRef(null);
  const ultimoIdVistoRef = useRef(null);

  // Busca notificações e contagem no backend
  const carregarNotificacoes = useCallback(async (silencioso = false) => {
    if (!silencioso) setCarregando(true);
    try {
      const response = await api.get('/notificacoes?limit=30');
      if (response.data?.success && response.data?.data) {
        const { notificacoes: lista, total_nao_lidas } = response.data.data;
        const arr = Array.isArray(lista) ? lista : [];
        setNotificacoes(arr);
        setTotalNaoLidas(typeof total_nao_lidas === 'number' ? total_nao_lidas : 0);
        if (arr.length > 0 && arr[0].id) {
          ultimoIdVistoRef.current = Math.max(ultimoIdVistoRef.current || 0, arr[0].id);
        }
      }
    } catch (err) {
      // Ignora falhas de rede silenciosamente para não quebrar a navegação
      console.warn('Não foi possível carregar notificações:', err.message);
    } finally {
      if (!silencioso) setCarregando(false);
    }
  }, []);

  // Carrega ao montar o componente e monitora em tempo real enquanto a página estiver aberta
  useEffect(() => {
    let cancelado = false;

    if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'default') {
      window.Notification.requestPermission().catch(() => {});
    }

    const consultar = () => {
      api
        .get('/notificacoes?limit=30')
        .then((response) => {
          if (!cancelado && response.data?.success && response.data?.data) {
            const { notificacoes: lista, total_nao_lidas } = response.data.data;
            const arr = Array.isArray(lista) ? lista : [];
            setNotificacoes(arr);
            setTotalNaoLidas(typeof total_nao_lidas === 'number' ? total_nao_lidas : 0);

            if (arr.length > 0) {
              const maisRecente = arr[0];
              if (
                ultimoIdVistoRef.current !== null &&
                maisRecente.id > ultimoIdVistoRef.current &&
                !maisRecente.lida
              ) {
                const canais = parseCanais(maisRecente.canais_enviados);
                if (
                  canais.includes('push') &&
                  typeof window !== 'undefined' &&
                  'Notification' in window &&
                  window.Notification.permission === 'granted'
                ) {
                  try {
                    new window.Notification(maisRecente.titulo || 'Nova notificação — Aranduê', {
                      body: maisRecente.mensagem || '',
                      icon: '/favicon.svg'
                    });
                  } catch {}
                }
              }
              ultimoIdVistoRef.current = Math.max(ultimoIdVistoRef.current || 0, maisRecente.id);
            } else if (ultimoIdVistoRef.current === null) {
              ultimoIdVistoRef.current = 0;
            }
          }
        })
        .catch(() => {});
    };

    consultar();
    const intervalo = setInterval(consultar, 8000);

    return () => {
      cancelado = true;
      clearInterval(intervalo);
    };
  }, []);

  // Recarrega ao abrir o dropdown para manter dados sincronizados
  const toggleDropdown = () => {
    const novoEstado = !aberto;
    setAberto(novoEstado);
    if (novoEstado) {
      carregarNotificacoes(false);
    }
  };

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    function handleClickFora(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setAberto(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setAberto(false);
      }
    }

    if (aberto) {
      document.addEventListener('mousedown', handleClickFora);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickFora);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [aberto]);

  // Marcar notificação individual como lida
  const handleMarcarComoLida = async (notificacao, e) => {
    if (e) e.stopPropagation();
    if (notificacao.lida) return;

    // Atualização otimista imediata sem recarregar a página
    setNotificacoes((prev) =>
      prev.map((item) => (item.id === notificacao.id ? { ...item, lida: true } : item))
    );
    setTotalNaoLidas((prev) => Math.max(0, prev - 1));

    try {
      await api.patch(`/notificacoes/${notificacao.id}/lida`);
    } catch (err) {
      console.warn('Erro ao marcar notificação como lida no backend:', err.message);
    }
  };

  // Marcar todas como lidas
  const handleMarcarTodasComoLidas = async () => {
    if (totalNaoLidas === 0 || marcandoTodas) return;

    setMarcandoTodas(true);
    // Atualização otimista imediata
    setNotificacoes((prev) => prev.map((item) => ({ ...item, lida: true })));
    setTotalNaoLidas(0);

    try {
      await api.patch('/notificacoes/ler-todas');
    } catch (err) {
      console.warn('Erro ao marcar todas como lidas no backend:', err.message);
    } finally {
      setMarcandoTodas(false);
    }
  };

  const renderBadgeCanal = (canal) => {
    switch (canal) {
      case 'whatsapp':
        return (
          <span
            key="whatsapp"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              fontSize: '0.68rem',
              fontWeight: 600,
              padding: '2px 6px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: '#dcfce7',
              color: '#15803d',
              border: '1px solid #bbf7d0'
            }}
            title="Enviado por WhatsApp"
          >
            <MessageSquare size={10} />
            WhatsApp
          </span>
        );
      case 'email':
        return (
          <span
            key="email"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              fontSize: '0.68rem',
              fontWeight: 600,
              padding: '2px 6px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: '#e0f2fe',
              color: '#0284c7',
              border: '1px solid #bae6fd'
            }}
            title="Enviado por E-mail"
          >
            <Mail size={10} />
            E-mail
          </span>
        );
      case 'push':
        return (
          <span
            key="push"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              fontSize: '0.68rem',
              fontWeight: 600,
              padding: '2px 6px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: '#f3e8ff',
              color: '#7c3aed',
              border: '1px solid #e9d5ff'
            }}
            title="Notificação Push"
          >
            <Smartphone size={10} />
            Push
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      ref={containerRef}
      className="notification-bell-container"
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
    >
      <button
        type="button"
        className="notification-bell-btn"
        onClick={toggleDropdown}
        aria-label={`Notificações${totalNaoLidas > 0 ? ` (${totalNaoLidas} não lidas)` : ''}`}
        aria-expanded={aberto}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '38px',
          height: '38px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: aberto ? 'var(--bg-subtle)' : 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          color: totalNaoLidas > 0 ? 'var(--primary)' : 'var(--text-secondary)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          padding: 0
        }}
      >
        <Bell size={19} />
        {totalNaoLidas > 0 && (
          <span
            className="notification-badge"
            style={{
              position: 'absolute',
              top: '-3px',
              right: '-3px',
              backgroundColor: 'var(--danger)',
              color: '#ffffff',
              fontSize: '0.68rem',
              fontWeight: 700,
              minWidth: '18px',
              height: '18px',
              borderRadius: 'var(--radius-full)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              boxShadow: '0 0 0 2px var(--bg-surface)',
              lineHeight: 1
            }}
          >
            {totalNaoLidas > 99 ? '99+' : totalNaoLidas}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {aberto && (
        <div
          className="notification-dropdown"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '380px',
            maxWidth: 'calc(100vw - 2rem)',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-modal)',
            zIndex: 60,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            animation: 'fadeIn 0.15s ease-out'
          }}
        >
          {/* Cabeçalho */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 1rem',
              borderBottom: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-subtle)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                Notificações
              </span>
              {totalNaoLidas > 0 && (
                <span
                  style={{
                    backgroundColor: 'var(--primary-light)',
                    color: 'var(--primary)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.5rem',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--primary-border)'
                  }}
                >
                  {totalNaoLidas} nova{totalNaoLidas > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {totalNaoLidas > 0 && (
              <button
                type="button"
                onClick={handleMarcarTodasComoLidas}
                disabled={marcandoTodas}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--primary)',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: marcandoTodas ? 'not-allowed' : 'pointer',
                  padding: '0.2rem 0.4rem',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'opacity 0.2s ease',
                  opacity: marcandoTodas ? 0.6 : 1
                }}
                title="Marcar todas como lidas"
              >
                <CheckCheck size={14} />
                <span>Marcar lidas</span>
              </button>
            )}
          </div>

          {/* Lista com rolagem suave */}
          <div
            style={{
              maxHeight: '380px',
              overflowY: 'auto',
              overscrollBehavior: 'contain'
            }}
          >
            {carregando && notificacoes.length === 0 ? (
              <div
                style={{
                  padding: '2.5rem 1rem',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '0.875rem'
                }}
              >
                <span className="spinner" style={{ margin: '0 auto 0.75rem' }} />
                <div>Carregando notificações...</div>
              </div>
            ) : notificacoes.length === 0 ? (
              <div
                style={{
                  padding: '2.5rem 1.5rem',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--bg-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)'
                  }}
                >
                  <Bell size={22} />
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                  Nenhuma notificação no momento
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, maxWidth: '260px' }}>
                  Você receberá atualizações sobre suas vagas, candidaturas e preferências aqui.
                </p>
              </div>
            ) : (
              notificacoes.map((item) => {
                const ehNaoLida = !item.lida;
                const canais = extrairCanais(item.canais_enviados);

                return (
                  <div
                    key={item.id}
                    onClick={() => handleMarcarComoLida(item)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      padding: '0.85rem 1rem',
                      borderBottom: '1px solid var(--border-color)',
                      backgroundColor: ehNaoLida ? 'var(--primary-light)' : 'transparent',
                      cursor: ehNaoLida ? 'pointer' : 'default',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!ehNaoLida) e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = ehNaoLida
                        ? 'var(--primary-light)'
                        : 'transparent';
                    }}
                  >
                    {/* Indicador de leitura */}
                    <div style={{ paddingTop: '0.35rem', flexShrink: 0 }}>
                      {ehNaoLida ? (
                        <span
                          style={{
                            display: 'block',
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--primary)'
                          }}
                          title="Não lida"
                        />
                      ) : (
                        <span
                          style={{
                            display: 'block',
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: 'transparent'
                          }}
                        />
                      )}
                    </div>

                    {/* Conteúdo principal */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.5rem',
                          marginBottom: '0.2rem'
                        }}
                      >
                        <h4
                          style={{
                            fontSize: '0.88rem',
                            fontWeight: ehNaoLida ? 700 : 600,
                            color: 'var(--text-primary)',
                            margin: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}
                        >
                          <span>{item.titulo}</span>
                          {(item.url || item.link) && (
                            <ExternalLink size={12} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                          )}
                        </h4>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            color: 'var(--text-muted)',
                            flexShrink: 0
                          }}
                        >
                          {formatarTempoRelativo(item.data_criacao)}
                        </span>
                      </div>

                      <p
                        style={{
                          fontSize: '0.82rem',
                          color: 'var(--text-secondary)',
                          margin: '0 0 0.45rem 0',
                          lineHeight: 1.35,
                          wordBreak: 'break-word'
                        }}
                      >
                        {item.mensagem}
                      </p>

                      {/* Rodapé com canais enviados e ação */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.5rem',
                          flexWrap: 'wrap'
                        }}
                      >
                        {canais.length > 0 ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                            {canais.map((c) => renderBadgeCanal(c))}
                          </div>
                        ) : (
                          <div />
                        )}

                        {ehNaoLida && (
                          <button
                            type="button"
                            onClick={(e) => handleMarcarComoLida(item, e)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.2rem',
                              fontSize: '0.72rem',
                              color: 'var(--text-muted)',
                              backgroundColor: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '2px 4px',
                              borderRadius: 'var(--radius-sm)'
                            }}
                            title="Marcar como lida"
                          >
                            <Check size={12} />
                            <span>Lida</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
