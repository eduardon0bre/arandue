import React from 'react';
import { Link } from 'react-router-dom';
import { Edit, Trash2, Users, CheckCircle2, Star } from 'lucide-react';
import Table from './Table';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';

export default function TabelaDemandasContratante({
  demandas = [],
  carregando = false,
  avaliacoesEnviadas = [],
  onAbrirCandidatos,
  onIniciarConclusao,
  onAbrirAvaliacao,
  onExcluir
}) {
  const colunasVagas = [
    {
      header: 'Vaga & Categoria',
      render: (item) => (
        <div>
          <strong style={{ color: 'var(--text-primary)', display: 'block', fontSize: '0.95rem' }}>
            {item.titulo}
          </strong>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {item.categoria} • {item.bairro}
          </span>
        </div>
      )
    },
    {
      header: 'Data do Serviço',
      render: (item) => (
        <span style={{ fontSize: '0.9rem' }}>
          {new Date(item.data_servico).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
        </span>
      )
    },
    {
      header: 'Valor Diária',
      render: (item) => (
        <strong style={{ color: 'var(--primary)', fontSize: '0.95rem' }}>
          {parseFloat(item.valor_diaria).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </strong>
      )
    },
    {
      header: 'Status',
      render: (item) => {
        const statusMap = {
          aberta: { label: 'Aberta', badge: 'badge-success' },
          preenchida: { label: 'Preenchida', badge: 'badge-warning' },
          concluida: { label: 'Concluída', badge: 'badge-info' },
          cancelada: { label: 'Cancelada', badge: 'badge-danger' }
        };
        const s = statusMap[item.status] || { label: item.status, badge: 'badge-secondary' };
        return <span className={`badge ${s.badge}`}>{s.label}</span>;
      }
    },
    {
      header: 'Candidatos',
      render: (item) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAbrirCandidatos(item)}
          icon={<Users size={14} />}
        >
          {item.total_candidatos || 0} candidato(s)
        </Button>
      )
    },
    {
      header: 'Ações',
      render: (item) => {
        const avaliacaoExistente = avaliacoesEnviadas.find((a) => a.demanda_id === item.id);

        return (
          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            {item.status === 'preenchida' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onIniciarConclusao(item)}
                icon={<CheckCircle2 size={14} />}
                title="Concluir trabalho e confirmar pagamento por fora"
              >
                Concluir Diária
              </Button>
            )}

            {item.status === 'concluida' && (
              avaliacaoExistente ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onAbrirAvaliacao(
                      item,
                      avaliacaoExistente.avaliado_id || item.diarista_aceito_id,
                      item.diarista_aceito_nome || 'Diarista',
                      'diarista'
                    )
                  }
                  icon={<Star size={14} color="#f59e0b" fill="#f59e0b" />}
                  title="Visualizar avaliação e feedback enviados"
                >
                  Ver Avaliação (★ {avaliacaoExistente.nota})
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    onAbrirAvaliacao(
                      item,
                      item.diarista_aceito_id,
                      item.diarista_aceito_nome || 'Diarista',
                      'diarista'
                    )
                  }
                  icon={<Star size={14} />}
                  title="Avaliar e deixar feedback para o diarista"
                >
                  Avaliar Diarista
                </Button>
              )
            )}

            {item.status === 'aberta' && (
              <Link to={`/demandas/editar/${item.id}`}>
                <Button variant="outline" size="sm" icon={<Edit size={14} />} title="Editar vaga">
                  Editar
                </Button>
              </Link>
            )}

            {item.status !== 'concluida' && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => onExcluir(item)}
                icon={<Trash2 size={14} />}
                title="Excluir vaga"
              >
                Excluir
              </Button>
            )}
          </div>
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
          Vagas Publicadas por Você
        </h2>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {demandas.length} vaga(s) cadastrada(s)
        </span>
      </div>

      {carregando ? (
        <LoadingSpinner text="Carregando vagas..." />
      ) : (
        <Table
          columns={colunasVagas}
          data={demandas}
          keyExtractor={(item) => item.id}
          emptyMessage="Você ainda não publicou nenhuma vaga. Clique em 'Criar Nova Vaga' para começar."
        />
      )}
    </div>
  );
}
