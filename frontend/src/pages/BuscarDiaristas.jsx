import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  RefreshCw
} from 'lucide-react';
import CardDiarista from '../components/CardDiarista';
import ModalAgendaDiarista from '../components/ModalAgendaDiarista';
import Button from '../components/Button';
import FormInput from '../components/FormInput';
import FormSelect from '../components/FormSelect';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';
import api from '../services/api';

const ESPECIALIDADES = [
  { value: '', label: 'Todas as especialidades' },
  { value: 'Limpeza Residencial', label: 'Limpeza Residencial' },
  { value: 'Faxina Pesada', label: 'Faxina Pesada' },
  { value: 'Limpeza Pós-Obra', label: 'Limpeza Pós-Obra' },
  { value: 'Passar Roupa', label: 'Passar Roupa' },
  { value: 'Cozinha', label: 'Cozinha & Apoio' },
  { value: 'Garçom', label: 'Garçom para Eventos' },
  { value: 'Pintura', label: 'Pintura & Manutenção' },
  { value: 'Jardinagem', label: 'Jardinagem' },
  { value: 'Carga', label: 'Carga e Descarga' },
  { value: 'Organização', label: 'Organização de Ambientes' }
];

export default function BuscarDiaristas() {
  const [diaristas, setDiaristas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  // Filtros
  const [busca, setBusca] = useState('');
  const [bairro, setBairro] = useState('');
  const [servico, setServico] = useState('');
  const [dataFiltro, setDataFiltro] = useState('');

  // Modal de Agenda do Diarista
  const [diaristaSelecionado, setDiaristaSelecionado] = useState(null);

  const carregarDiaristas = async () => {
    try {
      setCarregando(true);
      setErro(null);

      const params = {};
      if (busca) params.busca = busca;
      if (bairro) params.bairro = bairro;
      if (servico) params.servico = servico;
      if (dataFiltro) params.data = dataFiltro;

      const res = await api.get('/diaristas', { params });
      if (res.data?.success) {
        setDiaristas(res.data.data || []);
      }
    } catch (err) {
      setErro(err.message || 'Falha ao buscar profissionais disponíveis.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDiaristas();
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [servico, dataFiltro]);

  const handleBuscar = (e) => {
    if (e) e.preventDefault();
    carregarDiaristas();
  };

  const handleLimparFiltros = () => {
    setBusca('');
    setBairro('');
    setServico('');
    setDataFiltro('');
  };

  return (
    <div className="container" style={{ paddingBottom: '3rem' }}>
      {/* Banner de Apresentação */}
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem'
        }}
      >
        <div style={{ maxWidth: '650px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: 'var(--primary)',
              fontWeight: 700,
              fontSize: '0.85rem',
              textTransform: 'uppercase',
              marginBottom: '0.5rem'
            }}
          >
            <Users size={16} />
            Profissionais Disponíveis
          </div>
          <h1 style={{ fontSize: '1.85rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            Buscar Diaristas & Ver Horários Livres
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Consulte a agenda dos trabalhadores autônomos, veja datas disponíveis e horários livres, avaliações de outros contratantes e combine diárias com facilidade.
          </p>
        </div>
      </div>

      {erro && (
        <Alert type="danger" message={erro} onClose={() => setErro(null)} />
      )}

      {/* Seção de Filtros */}
      <section
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <form onSubmit={handleBuscar}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: '1rem',
              alignItems: 'flex-end'
            }}
          >
            <div>
              <FormInput
                label="Buscar por nome ou habilidade"
                placeholder="Ex: Lucas, faxina, coquetel..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="m-0"
              />
            </div>

            <div>
              <FormInput
                label="Bairro ou Região"
                placeholder="Ex: Pinheiros, Centro, Mooca..."
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
                className="m-0"
              />
            </div>

            <div>
              <FormSelect
                label="Especialidade de Serviço"
                value={servico}
                onChange={(e) => setServico(e.target.value)}
                options={ESPECIALIDADES}
                className="m-0"
              />
            </div>

            <div>
              <label htmlFor="filtro-data" className="form-label" style={{ fontSize: '0.875rem' }}>
                Disponível na Data
              </label>
              <input
                id="filtro-data"
                type="date"
                value={dataFiltro}
                onChange={(e) => setDataFiltro(e.target.value)}
                className="form-input"
                style={{ height: '42px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
            <Button
              type="button"
              variant="outline"
              onClick={handleLimparFiltros}
              icon={<RefreshCw size={15} />}
            >
              Limpar Filtros
            </Button>
            <Button type="submit" variant="primary" icon={<Search size={15} />}>
              Filtrar Profissionais
            </Button>
          </div>
        </form>
      </section>

      {/* Resultados da Busca */}
      <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', margin: 0 }}>
          {carregando
            ? 'Buscando...'
            : `${diaristas.length} ${diaristas.length === 1 ? 'profissional encontrado' : 'profissionais encontrados'}`}
        </h2>

        {dataFiltro && (
          <span
            style={{
              fontSize: '0.8rem',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              padding: '0.25rem 0.6rem',
              borderRadius: 'var(--radius-full)',
              fontWeight: 600
            }}
          >
            Filtro ativo: disponível em {dataFiltro.split('-').reverse().join('/')}
          </span>
        )}
      </div>

      {carregando ? (
        <LoadingSpinner text="Carregando profissionais e agendas..." fullPage />
      ) : diaristas.length === 0 ? (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed var(--border-color)',
            padding: '4rem 2rem',
            textAlign: 'center'
          }}
        >
          <Users size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ marginBottom: '0.5rem' }}>Nenhum diarista encontrado</h3>
          <p style={{ maxWidth: '500px', margin: '0 auto 1.5rem', fontSize: '0.95rem' }}>
            Não encontramos diaristas com os filtros selecionados. Tente remover os filtros ou buscar por outra região ou data.
          </p>
          <Button variant="outline" onClick={handleLimparFiltros}>
            Ver Todos os Profissionais
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {diaristas.map((diarista) => (
            <CardDiarista
              key={diarista.id}
              diarista={diarista}
              onVerAgenda={(d) => setDiaristaSelecionado(d)}
            />
          ))}
        </div>
      )}

      {/* Modal Interativo com Calendário do Diarista Selecionado */}
      {diaristaSelecionado && (
        <ModalAgendaDiarista
          diarista={diaristaSelecionado}
          isOpen={Boolean(diaristaSelecionado)}
          onClose={() => setDiaristaSelecionado(null)}
        />
      )}
    </div>
  );
}
