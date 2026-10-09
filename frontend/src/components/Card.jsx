import React from 'react';
import { Calendar, MapPin, Tag, Users, Building, ArrowRight, Check } from 'lucide-react';
import Button from './Button';

/**
 * Formata valor numérico para Real brasileiro (R$)
 */
function formatarMoeda(valor) {
  const num = parseFloat(valor);
  if (isNaN(num)) return 'R$ 0,00';
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Formata data ISO para DD/MM/AAAA
 */
function formatarData(dataStr) {
  if (!dataStr) return '--';
  const data = new Date(dataStr);
  if (isNaN(data.getTime())) return dataStr;
  return data.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

export default function Card({
  demanda,
  onVerDetalhes,
  onCandidatar,
  isContratante = false,
  isDono = false,
  jaCandidatado = false
}) {
  const {
    id,
    titulo,
    descricao,
    categoria,
    valor_diaria,
    data_servico,
    bairro,
    status = 'aberta',
    contratante_nome,
    total_candidatos = 0
  } = demanda;

  const getStatusBadge = () => {
    switch (status) {
      case 'aberta':
        return <span className="badge badge-success">Aberta</span>;
      case 'preenchida':
        return <span className="badge badge-warning">Preenchida</span>;
      case 'concluida':
        return <span className="badge badge-info">Concluída</span>;
      case 'cancelada':
        return <span className="badge badge-danger">Cancelada</span>;
      default:
        return <span className="badge badge-secondary">{status}</span>;
    }
  };

  return (
    <article className="card" data-demanda-id={id}>
      <div className="card-header">
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
            <span className="badge badge-primary">
              <Tag size={12} />
              {categoria}
            </span>
            {getStatusBadge()}
          </div>
          <h3 className="card-title">{titulo}</h3>
        </div>
      </div>

      <div className="card-body">
        <div className="card-price-tag">
          {formatarMoeda(valor_diaria)}
          <span className="card-price-label">/ diária fechada</span>
        </div>

        <p style={{ fontSize: '0.875rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
          {descricao?.length > 120 ? `${descricao.substring(0, 120)}...` : descricao}
        </p>

        <div className="card-meta-list" style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
          <div className="card-meta-item">
            <Calendar size={15} color="var(--primary)" />
            <span>Data: <strong>{formatarData(data_servico)}</strong></span>
          </div>

          <div className="card-meta-item">
            <MapPin size={15} color="var(--primary)" />
            <span>Local: <strong>{bairro || 'São Paulo'}</strong></span>
          </div>

          {contratante_nome && (
            <div className="card-meta-item">
              <Building size={15} color="var(--text-muted)" />
              <span>Contratante: <strong>{contratante_nome}</strong></span>
            </div>
          )}

          <div className="card-meta-item">
            <Users size={15} color="var(--text-muted)" />
            <span>{total_candidatos} candidato(s) inscrito(s)</span>
          </div>
        </div>
      </div>

      <div className="card-footer">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onVerDetalhes && onVerDetalhes(demanda)}
        >
          Ver Detalhes
        </Button>

        {status === 'aberta' && (
          isDono ? (
            <span className="badge badge-info" style={{ padding: '0.4rem 0.65rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center' }}>
              Sua Vaga
            </span>
          ) : isContratante ? (
            <span
              title="Contratantes não podem se candidatar. Altere seu perfil para 'Diarista' ou 'Ambos' nas configurações para aceitar demandas."
              style={{ display: 'inline-block' }}
            >
              <Button
                variant="outline"
                size="sm"
                disabled
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              >
                Candidatar-se
              </Button>
            </span>
          ) : (
            <Button
              variant={jaCandidatado ? 'secondary' : 'primary'}
              size="sm"
              disabled={jaCandidatado}
              onClick={() => onCandidatar && onCandidatar(demanda)}
              icon={jaCandidatado ? <Check size={14} /> : <ArrowRight size={14} />}
            >
              {jaCandidatado ? 'Inscrito' : 'Candidatar-se'}
            </Button>
          )
        )}
      </div>
    </article>
  );
}
