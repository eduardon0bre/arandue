import React from 'react';
import { Phone, CheckCircle2, Star } from 'lucide-react';
import Table from './Table';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';

export default function TabelaCandidaturasDiarista({
  candidaturas = [],
  carregando = false,
  avaliacoesEnviadas = [],
  onIniciarConclusao,
  onAbrirAvaliacao
}) {
  const colunasCandidaturas = [
    {
      header: 'Vaga & Contratante',
      render: (item) => (
        <div>
          <strong style={{ color: 'var(--text-primary)', display: 'block', fontSize: '0.95rem' }}>
            {item.demanda_titulo || `Demanda #${item.demanda_id}`}
          </strong>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Anunciante: {item.contratante_nome || 'Contratante local'}
          </span>
        </div>
      )
    },
    {
      header: 'Data Prevista',
      render: (item) => {
        const dataVal = item.demanda_data || item.demanda_data_servico;
        return (
          <span style={{ fontSize: '0.9rem' }}>
            {dataVal ? new Date(dataVal).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '--'}
          </span>
        );
      }
    },
    {
      header: 'Valor Acordado',
      render: (item) => (
        <strong style={{ color: 'var(--primary)', fontSize: '0.95rem' }}>
          {item.demanda_valor
            ? parseFloat(item.demanda_valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            : '--'}
        </strong>
      )
    },
    {
      header: 'Status da Inscrição',
      render: (item) => {
        const statusCand = item.status || item.candidatura_status;
        if (statusCand === 'aceita') {
          return <span className="badge badge-success">✓ Aprovada</span>;
        }
        if (statusCand === 'recusada') {
          return <span className="badge badge-danger">Recusada</span>;
        }
        return <span className="badge badge-warning">Em Análise</span>;
      }
    },
    {
      header: 'Contato & Próximo Passo',
      render: (item) => {
        const statusCand = item.status || item.candidatura_status;
        if (statusCand === 'aceita') {
          const isConcluida = item.demanda_status === 'concluida';
          const avaliacaoDiarista = avaliacoesEnviadas.find((a) => a.demanda_id === item.demanda_id);

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.85rem',
                  color: isConcluida ? 'var(--text-secondary)' : '#15803d',
                  fontWeight: 600
                }}
              >
                <CheckCircle2 size={14} color={isConcluida ? '#0284c7' : '#15803d'} />
                {isConcluida ? 'Diária Finalizada' : 'Serviço confirmado!'}
              </div>

              {item.contratante_telefone && (
                <span
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  <Phone size={13} color="#15803d" /> {item.contratante_telefone}
                </span>
              )}

              {/* Botão de Marcar como Concluído (Diarista) quando ainda preenchida */}
              {!isConcluida && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onIniciarConclusao({
                      id: item.demanda_id,
                      titulo: item.demanda_titulo,
                      valor_diaria: item.demanda_valor,
                      contratante_id: item.contratante_id,
                      contratante_nome: item.contratante_nome
                    })
                  }
                  icon={<CheckCircle2 size={13} />}
                  title="Confirmar término do trabalho e recebimento por fora"
                >
                  Marcar como Concluído
                </Button>
              )}

              {/* Ações após concluída: Avaliar Contratante ou Ver Avaliação */}
              {isConcluida && (
                avaliacaoDiarista ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      onAbrirAvaliacao(
                        { id: item.demanda_id, titulo: item.demanda_titulo, valor_diaria: item.demanda_valor },
                        item.contratante_id,
                        item.contratante_nome || 'Contratante',
                        'contratante'
                      )
                    }
                    icon={<Star size={13} color="#f59e0b" fill="#f59e0b" />}
                    title="Ver feedback enviado ao empregador"
                  >
                    Ver Avaliação (★ {avaliacaoDiarista.nota})
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() =>
                      onAbrirAvaliacao(
                        { id: item.demanda_id, titulo: item.demanda_titulo, valor_diaria: item.demanda_valor },
                        item.contratante_id,
                        item.contratante_nome || 'Contratante',
                        'contratante'
                      )
                    }
                    icon={<Star size={13} />}
                    title="Avaliar ambiente de trabalho e pagamento combinado"
                  >
                    Avaliar Contratante
                  </Button>
                )
              )}
            </div>
          );
        }
        return (
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Aguardando decisão do contratante
          </span>
        );
      }
    }
  ];

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        padding: '1.5rem',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem'
        }}
      >
        <h2 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', margin: 0 }}>
          Histórico de Candidaturas Enviadas
        </h2>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {candidaturas.length} candidatura(s)
        </span>
      </div>

      {carregando ? (
        <LoadingSpinner text="Carregando candidaturas..." />
      ) : (
        <Table
          columns={colunasCandidaturas}
          data={candidaturas}
          keyExtractor={(item) => item.id}
          emptyMessage="Você ainda não se candidatou a nenhuma vaga. Acesse o Mural de Vagas para encontrar diárias abertas."
        />
      )}
    </div>
  );
}
