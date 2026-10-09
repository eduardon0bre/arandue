import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Briefcase, Calendar, UserCheck, ShieldCheck } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import api from '../services/api';

export default function FeedbacksList({
  usuarioId,
  feedbacks: feedbacksProp,
  titulo = 'Feedbacks e Avaliações Recebidas',
  tipoPapel = 'diarista'
}) {
  const [feedbacks, setFeedbacks] = useState(feedbacksProp || []);
  const [carregando, setCarregando] = useState(Boolean(!feedbacksProp && usuarioId));

  useEffect(() => {
    if (feedbacksProp) {
      setFeedbacks(feedbacksProp);
      return;
    }

    let montado = true;
    async function carregarFeedbacks() {
      if (!usuarioId) return;
      try {
        setCarregando(true);
        const response = await api.get(`/avaliacoes/usuario/${usuarioId}`);
        if (montado && response.data?.success) {
          setFeedbacks(response.data.data || []);
        }
      } catch (err) {
        console.error('Erro ao carregar feedbacks:', err);
      } finally {
        if (montado) setCarregando(false);
      }
    }

    carregarFeedbacks();
    return () => {
      montado = false;
    };
  }, [usuarioId, feedbacksProp]);

  // Cálculo da nota média e distribuição percentual das notas (1 a 5 estrelas)
  const total = feedbacks.length;
  const somaNotas = feedbacks.reduce((acc, curr) => acc + Number(curr.nota || 0), 0);
  const media = total > 0 ? (somaNotas / total).toFixed(1) : null;

  const distribuicao = [5, 4, 3, 2, 1].map((nota) => {
    const qtd = feedbacks.filter((f) => Number(f.nota) === nota).length;
    const porcentagem = total > 0 ? Math.round((qtd / total) * 100) : 0;
    return { nota, qtd, porcentagem };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {/* Cabeçalho de Avaliações */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '0.5rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Star size={16} color="#f59e0b" fill="#f59e0b" />
          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {titulo}
          </h4>
        </div>

        {total > 0 && (
          <span
            style={{
              fontSize: '0.825rem',
              fontWeight: 600,
              color: '#b45309',
              backgroundColor: '#fef3c7',
              padding: '0.2rem 0.6rem',
              borderRadius: 'var(--radius-full)',
              border: '1px solid #fde68a'
            }}
          >
            ★ {media} de média ({total} {total === 1 ? 'avaliação' : 'avaliações'})
          </span>
        )}
      </div>

      {carregando ? (
        <div style={{ padding: '1rem 0' }}>
          <LoadingSpinner text="Carregando avaliações..." />
        </div>
      ) : total === 0 ? (
        <div
          style={{
            padding: '1.25rem',
            textAlign: 'center',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border-color)',
            color: 'var(--text-muted)',
            fontSize: '0.875rem'
          }}
        >
          {tipoPapel === 'diarista'
            ? 'Nenhum feedback recebido de contratantes ainda.'
            : 'Nenhum feedback recebido de diaristas ainda.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Painel Visual de Cálculo e Distribuição de Média */}
          <div
            style={{
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              display: 'grid',
              gridTemplateColumns: 'minmax(130px, 1fr) 2fr',
              gap: '1.5rem',
              alignItems: 'center'
            }}
          >
            {/* Lado Esquerdo: Média Grande e Estrelas */}
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
              <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                {media}
              </div>
              <div style={{ display: 'flex', gap: '0.15rem' }}>
                {[1, 2, 3, 4, 5].map((estrela) => (
                  <Star
                    key={estrela}
                    size={17}
                    fill={estrela <= Math.round(Number(media)) ? '#f59e0b' : 'none'}
                    color={estrela <= Math.round(Number(media)) ? '#f59e0b' : '#d1d5db'}
                  />
                ))}
              </div>
              <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {total} {total === 1 ? 'avaliação computada' : 'avaliações computadas'}
              </span>
            </div>

            {/* Lado Direito: Barras de Distribuição das Notas (1 a 5) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {distribuicao.map(({ nota, qtd, porcentagem }) => (
                <div key={nota} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem' }}>
                  <span style={{ width: '28px', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                    {nota} <Star size={11} fill="#f59e0b" color="#f59e0b" />
                  </span>
                  <div style={{ flex: 1, height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${porcentagem}%`,
                        height: '100%',
                        backgroundColor: nota >= 4 ? '#16a34a' : nota === 3 ? '#f59e0b' : '#dc2626',
                        borderRadius: '4px',
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                  <span style={{ width: '38px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>
                    {qtd} ({porcentagem}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
          {feedbacks.map((item) => {
            const isAvaliadorContratante =
              item.avaliador_tipo === 'contratante' ||
              tipoPapel === 'diarista' ||
              (item.avaliador_nome && item.avaliador_nome.toLowerCase().includes('contratante'));

            const nomeAnonimo = isAvaliadorContratante
              ? 'Contratante verificado'
              : 'Diarista verificado';

            const inicial = isAvaliadorContratante ? 'C' : 'D';

            return (
              <div
                key={item.id}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                }}
              >
                {/* Topo do Card de Feedback */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.4rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: isAvaliadorContratante ? '#e0f2fe' : '#dcfce7',
                        color: isAvaliadorContratante ? '#0369a1' : '#15803d',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8rem',
                        fontWeight: 700
                      }}
                      title={nomeAnonimo}
                    >
                      {inicial}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                          {nomeAnonimo}
                        </strong>
                        <span
                          style={{
                            fontSize: '0.675rem',
                            backgroundColor: 'var(--bg-subtle)',
                            color: 'var(--text-muted)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-full)',
                            padding: '0.05rem 0.4rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                            fontWeight: 500
                          }}
                        >
                          <ShieldCheck size={10} color="#16a34a" /> Anônimo
                        </span>
                      </div>
                      {item.demanda_titulo && (
                        <span
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            marginTop: '0.15rem'
                          }}
                        >
                          <Briefcase size={12} /> {item.demanda_titulo}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Estrelas */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                    {[1, 2, 3, 4, 5].map((estrela) => (
                      <Star
                        key={estrela}
                        size={14}
                        fill={estrela <= item.nota ? '#f59e0b' : 'none'}
                        color={estrela <= item.nota ? '#f59e0b' : '#d1d5db'}
                      />
                    ))}
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#b45309', marginLeft: '0.25rem' }}>
                      {item.nota}.0
                    </span>
                  </div>
                </div>

              {/* Comentário do Feedback */}
              {item.comentario ? (
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                    backgroundColor: 'var(--bg-subtle)',
                    padding: '0.6rem 0.75rem',
                    borderRadius: 'var(--radius-sm)'
                  }}
                >
                  "{item.comentario}"
                </p>
              ) : (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Avaliado com {item.nota} estrelas sem comentário por escrito.
                </span>
              )}

              {/* Data da Avaliação */}
              {item.data_criacao && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'flex-end' }}>
                  <Calendar size={12} /> {new Date(item.data_criacao).toLocaleDateString('pt-BR')}
                </div>
              )}
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
}
