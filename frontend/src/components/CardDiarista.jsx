import React from 'react';
import { Star, MapPin, Calendar, CheckCircle2, MessageCircle, Briefcase } from 'lucide-react';
import Button from './Button';
import api from '../services/api';

export default function CardDiarista({ diarista, onVerAgenda }) {
  const {
    id,
    nome,
    bairro,
    telefone,
    nota_media = 5.0,
    total_avaliacoes = 0,
    total_concluidos = 0,
    experiencia = '1 a 2 anos',
    bio = '',
    servicos = [],
    proximas_disponibilidades = []
  } = diarista;

  // Extrai datas únicas das próximas disponibilidades
  const datasUnicas = Array.from(
    new Set(proximas_disponibilidades.map((d) => d.data))
  ).slice(0, 4);

  const formatarData = (dataStr) => {
    try {
      const [, mes, dia] = dataStr.split('-');
      return `${dia}/${mes}`;
    } catch {
      return dataStr;
    }
  };

  const handleWhatsApp = (e) => {
    e.stopPropagation();
    if (id) {
      api
        .post('/notificacoes/contato-diarista', {
          diarista_id: id,
          mensagem_adicional: `Interesse em contratar diária via vitrine de profissionais.`
        })
        .catch(() => {});
    }
    if (!telefone) return;
    const cleanPhone = telefone.replace(/\D/g, '');
    const mensagem = encodeURIComponent(
      `Olá ${nome}, encontrei seu perfil no Quadro de Diárias e gostaria de combinar uma diária com você.`
    );
    window.open(`https://wa.me/55${cleanPhone}?text=${mensagem}`, '_blank');
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Topo do Card com Avatar e Nome */}
      <div className="card-header" style={{ alignItems: 'center', gap: '0.85rem' }}>
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.35rem',
            fontWeight: 700,
            flexShrink: 0
          }}
        >
          {nome?.charAt(0) || 'D'}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              {nome}
            </h3>
            <CheckCircle2 size={15} color="var(--primary)" title="Perfil verificado" />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.2rem', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <MapPin size={13} color="var(--primary)" />
              {bairro || 'São Paulo'}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Star size={13} color="#eab308" fill="#eab308" />
              <strong>{Number(nota_media).toFixed(1)}</strong>
              <span>({total_avaliacoes})</span>
            </span>
          </div>
        </div>
      </div>

      {/* Corpo com Experiência, Bio e Especialidades */}
      <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {bio && (
          <p
            style={{
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.45,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {bio}
          </p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <Briefcase size={14} />
          <span>Experiência: <strong>{experiencia}</strong></span>
          {total_concluidos > 0 && (
            <span>• <strong>{total_concluidos}</strong> diárias concluídas</span>
          )}
        </div>

        {/* Especialidades do Diarista */}
        {servicos && servicos.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.25rem' }}>
            {servicos.slice(0, 3).map((servico) => (
              <span
                key={servico}
                style={{
                  backgroundColor: 'var(--bg-subtle)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-full)',
                  padding: '0.15rem 0.6rem',
                  fontSize: '0.75rem',
                  fontWeight: 500
                }}
              >
                {servico}
              </span>
            ))}
            {servicos.length > 3 && (
              <span
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '0.75rem',
                  alignSelf: 'center'
                }}
              >
                +{servicos.length - 3} mais
              </span>
            )}
          </div>
        )}

        {/* Próximas Datas Disponíveis */}
        <div
          style={{
            marginTop: 'auto',
            paddingTop: '0.75rem',
            borderTop: '1px dashed var(--border-color)'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.775rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: '0.4rem',
              textTransform: 'uppercase',
              letterSpacing: '0.03em'
            }}
          >
            <Calendar size={13} color="var(--primary)" />
            <span>Próximas Datas Disponíveis:</span>
          </div>

          {datasUnicas.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {datasUnicas.map((d) => (
                <span
                  key={d}
                  style={{
                    backgroundColor: 'var(--success-light)',
                    color: 'var(--success)',
                    border: '1px solid var(--success-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.2rem 0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}
                >
                  {formatarData(d)}
                </span>
              ))}
              {proximas_disponibilidades.length > datasUnicas.length && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
                  e mais horários
                </span>
              )}
            </div>
          ) : (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Consulte a agenda para novas datas
            </span>
          )}
        </div>
      </div>

      {/* Rodapé com Botão de Ação */}
      <div className="card-footer" style={{ gap: '0.5rem' }}>
        <Button
          variant="primary"
          size="sm"
          onClick={() => onVerAgenda(diarista)}
          icon={<Calendar size={15} />}
          style={{ flex: 1 }}
        >
          Ver Agenda & Horários
        </Button>

        {telefone && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleWhatsApp}
            title="Enviar mensagem no WhatsApp"
            icon={<MessageCircle size={15} color="#15803d" />}
          >
            WhatsApp
          </Button>
        )}
      </div>
    </div>
  );
}
