import React from 'react';
import { Phone, MessageCircle, FileText, CheckCircle2, Star, Check, XCircle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';

export default function ModalCandidatosDemanda({
  isOpen = false,
  onClose,
  demanda = null,
  candidatos = [],
  carregando = false,
  processandoCandidatoId = null,
  recusandoCandidato = false,
  avaliacoesEnviadas = [],
  onVisualizarCurriculo,
  onIniciarRecusa,
  onAprovar,
  onIniciarConclusao,
  onAbrirAvaliacao
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Candidatos: ${demanda?.titulo || ''}`}
      maxWidth="640px"
    >
      {carregando ? (
        <LoadingSpinner text="Carregando candidatos..." />
      ) : candidatos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
          Nenhum diarista se inscreveu para esta vaga até o momento.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {candidatos.map((cand) => (
            <div
              key={cand.id}
              style={{
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
                    {cand.diarista_nome}
                  </strong>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.2rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Bairro: {cand.diarista_bairro || 'São Paulo'}
                    </span>
                    <span
                      style={{
                        fontSize: '0.8rem',
                        color: '#b45309',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.2rem'
                      }}
                    >
                      ★ {cand.diarista_nota_media || '5.0'}
                    </span>
                  </div>
                </div>

                <div>
                  {cand.status === 'aceita' ? (
                    <span className="badge badge-success">Aprovado</span>
                  ) : cand.status === 'recusada' ? (
                    <span className="badge badge-danger">Recusado</span>
                  ) : (
                    <span className="badge badge-warning">Pendente</span>
                  )}
                </div>
              </div>

              {cand.status === 'aceita' ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem',
                    backgroundColor: '#dcfce7',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid #bbf7d0',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.85rem',
                      color: '#166534',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <Phone size={14} /> Telefone: <strong>{cand.diarista_telefone}</strong>
                  </span>

                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onVisualizarCurriculo(cand)}
                      icon={<FileText size={14} />}
                    >
                      Ver Currículo
                    </Button>
                    <a
                      href={`https://wa.me/55${cand.diarista_telefone?.replace(/\D/g, '')}?text=Ol%C3%A1%20${encodeURIComponent(cand.diarista_nome)},%20sua%20candidatura%20no%20Quadro%20de%20Di%C3%A1rias%20foi%20aprovada!`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-primary"
                      style={{ backgroundColor: '#15803d', borderColor: '#15803d' }}
                    >
                      <MessageCircle size={14} /> Abrir WhatsApp
                    </a>

                    {demanda?.status === 'preenchida' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() =>
                          onIniciarConclusao(demanda, { id: cand.diarista_id, nome: cand.diarista_nome })
                        }
                        icon={<CheckCircle2 size={14} />}
                        title="Confirmar término do serviço e pagamento realizado"
                      >
                        Concluir Diária
                      </Button>
                    )}

                    {demanda?.status === 'concluida' &&
                      (() => {
                        const avaliacaoCand = avaliacoesEnviadas.find((a) => a.demanda_id === demanda.id);
                        return avaliacaoCand ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              onAbrirAvaliacao(demanda, cand.diarista_id, cand.diarista_nome, 'diarista')
                            }
                            icon={<Star size={14} color="#f59e0b" fill="#f59e0b" />}
                          >
                            Ver Avaliação (★ {avaliacaoCand.nota})
                          </Button>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() =>
                              onAbrirAvaliacao(demanda, cand.diarista_id, cand.diarista_nome, 'diarista')
                            }
                            icon={<Star size={14} />}
                          >
                            Avaliar Diarista
                          </Button>
                        );
                      })()}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onVisualizarCurriculo(cand)}
                    icon={<FileText size={14} />}
                    title="Visualizar currículo completo do candidato"
                  >
                    Ver Currículo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={processandoCandidatoId === cand.id || recusandoCandidato}
                    onClick={() => onIniciarRecusa(cand)}
                    icon={<XCircle size={14} />}
                    title="Recusar e apagar candidatura"
                  >
                    Recusar
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={processandoCandidatoId === cand.id || recusandoCandidato}
                    loading={processandoCandidatoId === cand.id}
                    onClick={() => onAprovar(cand.id)}
                    icon={<Check size={14} />}
                  >
                    Aprovar & Liberar Contato
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
