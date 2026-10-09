import React from 'react';
import {
  FileText,
  Star,
  MapPin,
  Briefcase,
  Clock,
  CheckCircle2,
  Check,
  XCircle,
  MessageSquare
} from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

export default function ModalCurriculo({
  isOpen,
  onClose,
  candidato,
  onAprovar,
  onRecusar,
  processando = false
}) {
  if (!candidato) return null;

  const nome = candidato.diarista_nome || 'Diarista';
  const bairro = candidato.diarista_bairro || 'São Paulo';
  const notaMedia = candidato.diarista_nota_media ? Number(candidato.diarista_nota_media).toFixed(1) : '5.0';
  const bicosConcluidos = candidato.total_bicos_concluidos ?? 0;
  const experiencia = candidato.diarista_experiencia || '1 a 2 anos';
  const bio = candidato.diarista_bio || 'Profissional dedicado, comprometido com a qualidade do serviço, pontualidade e respeito ao ambiente do cliente.';
  const regioes = candidato.diarista_regioes || `${bairro} e proximidades`;
  const servicos = Array.isArray(candidato.diarista_servicos) && candidato.diarista_servicos.length > 0
    ? candidato.diarista_servicos
    : ['Limpeza Residencial', 'Passar Roupa'];

  const inicial = nome.charAt(0).toUpperCase();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Currículo Profissional do Diarista"
      maxWidth="640px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button variant="outline" onClick={onClose} disabled={processando}>
            Fechar
          </Button>

          {candidato.status === 'pendente' && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {onRecusar && (
                <Button
                  variant="outline"
                  onClick={() => onRecusar(candidato)}
                  disabled={processando}
                  icon={<XCircle size={15} />}
                >
                  Recusar
                </Button>
              )}
              {onAprovar && (
                <Button
                  variant="primary"
                  onClick={() => onAprovar(candidato.id)}
                  loading={processando}
                  disabled={processando}
                  icon={<Check size={15} />}
                >
                  Aprovar & Liberar Contato
                </Button>
              )}
            </div>
          )}
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Cabeçalho do Perfil */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid var(--border-color)',
            flexWrap: 'wrap'
          }}
        >
          {candidato.diarista_foto_url ? (
            <img
              src={candidato.diarista_foto_url}
              alt={nome}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid var(--primary)'
              }}
            />
          ) : (
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.6rem',
                fontWeight: 700
              }}
            >
              {inicial}
            </div>
          )}

          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h4 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                {nome}
              </h4>
              <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>
                Diarista Cadastrado
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.35rem', fontSize: '0.875rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <MapPin size={14} color="var(--primary)" />
                {bairro}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#b45309', fontWeight: 600 }}>
                <Star size={14} fill="#eab308" color="#eab308" />
                {notaMedia} de avaliação
              </span>
            </div>
          </div>
        </div>

        {/* Indicadores / Estatísticas */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '0.75rem'
          }}
        >
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              textAlign: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', color: '#eab308', fontWeight: 700, fontSize: '1.2rem' }}>
              <Star size={18} fill="#eab308" /> {notaMedia}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Nota Média
            </span>
          </div>

          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              textAlign: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', color: 'var(--primary)', fontWeight: 700, fontSize: '1.2rem' }}>
              <CheckCircle2 size={18} /> {bicosConcluidos}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Bicos Concluídos
            </span>
          </div>

          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              textAlign: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', color: 'var(--secondary)', fontWeight: 700, fontSize: '1.1rem' }}>
              <Clock size={16} /> {experiencia}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Experiência
            </span>
          </div>
        </div>

        {/* Biografia / Apresentação */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            <FileText size={15} color="var(--primary)" /> Biografia & Apresentação
          </label>
          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              fontSize: '0.9rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.55
            }}
          >
            {bio}
          </div>
        </div>

        {/* Especialidades e Serviços Prestados */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            <Briefcase size={15} color="var(--primary)" /> Especialidades de Serviço
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
            {servicos.map((s, idx) => (
              <span
                key={idx}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.35rem 0.75rem',
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.825rem',
                  fontWeight: 600,
                  border: '1px solid var(--primary-border)'
                }}
              >
                <Check size={13} />
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Regiões Atendidas */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            <MapPin size={15} color="var(--primary)" /> Regiões e Bairros Atendidos
          </label>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            {regioes}
          </p>
        </div>

        {/* Mensagem enviada nesta candidatura */}
        {candidato.mensagem && (
          <div
            style={{
              backgroundColor: 'var(--bg-subtle)',
              borderLeft: '4px solid var(--primary)',
              padding: '0.75rem 1rem',
              borderRadius: '0 var(--radius-sm) var(--radius-sm) 0'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              <MessageSquare size={13} color="var(--primary)" /> Mensagem enviada nesta candidatura:
            </div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
              "{candidato.mensagem}"
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
