import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, CheckCircle2, ShieldCheck } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import Alert from './Alert';
import api from '../services/api';

const DESCRICAO_NOTAS = {
  1: 'Péssimo — Não cumpriu o combinado',
  2: 'Ruim — Vários pontos a desejar',
  3: 'Regular — Atendeu o básico',
  4: 'Bom — Serviço bem executado',
  5: 'Excelente — Recomendo com certeza'
};

export default function ModalAvaliacao({
  isOpen,
  onClose,
  demanda,
  avaliadoId,
  avaliadoNome,
  papelAvaliado = 'diarista',
  avaliacaoExistente = null,
  onSalvar
}) {
  const [nota, setNota] = useState(5);
  const [hoverNota, setHoverNota] = useState(0);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);

  // Inicializa estado quando abrir o modal ou mudar avaliação existente
  useEffect(() => {
    if (avaliacaoExistente) {
      setNota(avaliacaoExistente.nota || 5);
      setComentario(avaliacaoExistente.comentario || '');
    } else {
      setNota(5);
      setComentario('');
    }
    setHoverNota(0);
    setErro(null);
  }, [isOpen, avaliacaoExistente]);

  if (!isOpen) return null;

  const isModoVisualizacao = Boolean(avaliacaoExistente);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isModoVisualizacao) {
      onClose();
      return;
    }

    if (!nota || nota < 1 || nota > 5) {
      setErro('Por favor, selecione uma nota de 1 a 5 estrelas.');
      return;
    }

    if (!demanda?.id || !avaliadoId) {
      setErro('Dados da demanda ou do usuário avaliado incompletos.');
      return;
    }

    try {
      setEnviando(true);
      setErro(null);

      const payload = {
        demanda_id: demanda.id,
        avaliado_id: avaliadoId,
        nota,
        comentario: comentario.trim() || null
      };

      const response = await api.post('/avaliacoes', payload);

      if (response.data?.success) {
        if (onSalvar) {
          onSalvar(response.data.data);
        }
        onClose();
      }
    } catch (err) {
      setErro(err.message || 'Erro ao enviar avaliação. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  const tituloModal = isModoVisualizacao
    ? 'Avaliação do Serviço'
    : papelAvaliado === 'diarista'
    ? `Avaliar Diarista: ${avaliadoNome || 'Profissional'}`
    : `Avaliar Contratante: ${avaliadoNome || 'Contratante'}`;

  const placeholderFeedback =
    papelAvaliado === 'diarista'
      ? 'Conte como foi a pontualidade, qualidade do serviço e postura do profissional...'
      : 'Conte como foram o ambiente de trabalho, clareza das instruções e o cumprimento pontual do pagamento acordado...';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={tituloModal}
      maxWidth="560px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
          <Button variant="outline" disabled={enviando} onClick={onClose}>
            {isModoVisualizacao ? 'Fechar' : 'Cancelar'}
          </Button>

          {!isModoVisualizacao && (
            <Button
              variant="primary"
              loading={enviando}
              disabled={enviando}
              onClick={handleSubmit}
              icon={<CheckCircle2 size={16} />}
            >
              Enviar Avaliação & Feedback
            </Button>
          )}
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* Informações da Demanda */}
        {demanda && (
          <div
            style={{
              backgroundColor: 'var(--bg-subtle)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}
          >
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Demanda referente:</div>
              <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{demanda.titulo}</strong>
            </div>
            {demanda.valor_diaria && (
              <span style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 700 }}>
                {parseFloat(demanda.valor_diaria).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            )}
          </div>
        )}

        {erro && <Alert type="danger" message={erro} onClose={() => setErro(null)} />}

        {/* Seletor Interativo de Estrelas */}
        <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.9rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '0.75rem'
            }}
          >
            {isModoVisualizacao ? 'Nota atribuída:' : 'Selecione sua nota de satisfação (1 a 5 estrelas):'}
          </label>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              justifyContent: 'center'
            }}
          >
            {[1, 2, 3, 4, 5].map((estrela) => {
              const estrelaAtiva = (hoverNota || nota) >= estrela;
              return (
                <button
                  key={estrela}
                  type="button"
                  disabled={isModoVisualizacao}
                  onClick={() => setNota(estrela)}
                  onMouseEnter={() => !isModoVisualizacao && setHoverNota(estrela)}
                  onMouseLeave={() => !isModoVisualizacao && setHoverNota(0)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: isModoVisualizacao ? 'default' : 'pointer',
                    padding: '4px',
                    transition: 'transform 0.15s ease',
                    transform: !isModoVisualizacao && (hoverNota === estrela || nota === estrela) ? 'scale(1.15)' : 'scale(1)'
                  }}
                  title={`${estrela} estrela(s)`}
                >
                  <Star
                    size={32}
                    fill={estrelaAtiva ? '#f59e0b' : 'none'}
                    color={estrelaAtiva ? '#f59e0b' : '#9ca3af'}
                    strokeWidth={1.75}
                  />
                </button>
              );
            })}
          </div>

          <div
            style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              color: '#d97706',
              marginTop: '0.5rem',
              minHeight: '20px'
            }}
          >
            ★ {DESCRICAO_NOTAS[hoverNota || nota]}
          </div>
        </div>

        {/* Caixa de Texto do Feedback */}
        <div>
          <label
            htmlFor="comentario-feedback"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.9rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '0.4rem'
            }}
          >
            <MessageSquare size={15} /> Feedback e Comentário
            {!isModoVisualizacao && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>(opcional)</span>}
          </label>

          {isModoVisualizacao ? (
            <div
              style={{
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.85rem',
                fontSize: '0.9rem',
                color: 'var(--text-primary)',
                lineHeight: 1.5,
                fontStyle: comentario ? 'normal' : 'italic'
              }}
            >
              {comentario || 'Nenhum comentário por escrito registrado.'}
            </div>
          ) : (
            <textarea
              id="comentario-feedback"
              rows={4}
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder={placeholderFeedback}
              disabled={enviando}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                fontSize: '0.9rem',
                fontFamily: 'inherit',
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          )}

          {!isModoVisualizacao && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.45rem' }}>
              <ShieldCheck size={14} color="#16a34a" />
              <span>Avaliação anônima: seu nome não será exibido no quadro de feedback da outra parte.</span>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
