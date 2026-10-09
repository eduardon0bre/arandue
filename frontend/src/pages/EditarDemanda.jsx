import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Edit3 } from 'lucide-react';
import Button from '../components/Button';
import FormInput from '../components/FormInput';
import FormSelect from '../components/FormSelect';
import Alert from '../components/Alert';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../services/api';

const CATEGORIAS = [
  { value: 'Eventos', label: 'Eventos & Gastronomia' },
  { value: 'Logística', label: 'Logística & Transporte' },
  { value: 'Construção', label: 'Construção & Reformas' },
  { value: 'Montagem', label: 'Montagem & Instalações' },
  { value: 'Limpeza', label: 'Limpeza & Conservação' },
  { value: 'Geral', label: 'Serviços Gerais' }
];

const STATUS_OPTIONS = [
  { value: 'aberta', label: 'Aberta' },
  { value: 'preenchida', label: 'Preenchida' },
  { value: 'concluida', label: 'Concluída' },
  { value: 'cancelada', label: 'Cancelada' }
];

export default function EditarDemanda() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    titulo: '',
    categoria: 'Eventos',
    valor_diaria: '',
    data_servico: '',
    bairro: '',
    descricao: '',
    status: 'aberta'
  });

  const [dadosIniciais, setDadosIniciais] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erros, setErros] = useState({});
  const [mensagemErro, setMensagemErro] = useState(null);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    async function carregarDemanda() {
      try {
        setCarregando(true);
        setMensagemErro(null);
        const response = await api.get(`/demandas/${id}`);

        if (response.data?.success && response.data.data) {
          const d = response.data.data;
          // Formata data ISO para YYYY-MM-DD para o input type="date"
          const dataFormatada = d.data_servico ? d.data_servico.split('T')[0] : '';

          const estado = {
            titulo: d.titulo || '',
            categoria: d.categoria || 'Eventos',
            valor_diaria: d.valor_diaria ? String(d.valor_diaria) : '',
            data_servico: dataFormatada,
            bairro: d.bairro || '',
            descricao: d.descricao || '',
            status: d.status || 'aberta'
          };

          setForm(estado);
          setDadosIniciais(estado);
        }
      } catch (err) {
        setMensagemErro(err.message || 'Falha ao buscar dados da demanda.');
      } finally {
        setCarregando(false);
      }
    }

    if (id) {
      carregarDemanda();
    }
  }, [id]);

  // Detecta se houve qualquer alteração em relação aos dados carregados
  const temAlteracao = Boolean(
    dadosIniciais && (
      form.titulo.trim() !== dadosIniciais.titulo.trim() ||
      form.categoria !== dadosIniciais.categoria ||
      String(form.valor_diaria).trim() !== String(dadosIniciais.valor_diaria).trim() ||
      form.data_servico !== dadosIniciais.data_servico ||
      form.bairro.trim() !== dadosIniciais.bairro.trim() ||
      form.descricao.trim() !== dadosIniciais.descricao.trim() ||
      form.status !== dadosIniciais.status
    )
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (erros[name]) {
      setErros((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validarFormulario = () => {
    const novosErros = {};

    if (!form.titulo.trim()) {
      novosErros.titulo = 'O título é obrigatório.';
    }

    const valor = parseFloat(form.valor_diaria);
    if (!form.valor_diaria || isNaN(valor) || valor <= 0) {
      novosErros.valor_diaria = 'Informe um valor válido maior que zero.';
    }

    if (!form.data_servico) {
      novosErros.data_servico = 'Informe a data prevista.';
    }

    if (!form.bairro.trim()) {
      novosErros.bairro = 'O bairro é obrigatório.';
    }

    if (!form.descricao.trim()) {
      novosErros.descricao = 'A descrição das atividades é obrigatória.';
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    try {
      setSalvando(true);
      setMensagemErro(null);

      const payload = {
        titulo: form.titulo.trim(),
        categoria: form.categoria,
        valor_diaria: parseFloat(form.valor_diaria),
        data_servico: form.data_servico,
        bairro: form.bairro.trim(),
        descricao: form.descricao.trim(),
        status: form.status
      };

      const response = await api.put(`/demandas/${id}`, payload);

      if (response.data?.success) {
        setSucesso(true);
        setTimeout(() => {
          navigate('/painel');
        }, 1200);
      }
    } catch (err) {
      setMensagemErro(err.message || 'Falha ao atualizar a demanda.');
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) {
    return (
      <div className="container" style={{ maxWidth: '820px' }}>
        <LoadingSpinner text="Carregando dados da vaga..." fullPage />
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '820px' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Link to="/painel" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
          <ArrowLeft size={16} /> Voltar ao painel de gestão
        </Link>
      </div>

      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '2rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 600, fontSize: '0.85rem' }}>
            <Edit3 size={18} />
            EDIÇÃO DE DEMANDA #{id}
          </div>
          <h1 style={{ fontSize: '1.6rem', marginTop: '0.25rem' }}>Atualizar Informações da Vaga</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Modifique os dados operacionais ou atualize o status da oportunidade.
          </p>
        </div>

        {sucesso && (
          <Alert type="success" title="Vaga atualizada com sucesso!">
            Redirecionando para o seu painel...
          </Alert>
        )}

        {mensagemErro && (
          <Alert type="danger" message={mensagemErro} onClose={() => setMensagemErro(null)} />
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div style={{ gridColumn: '1 / -1' }}>
              <FormInput
                label="Título da Função / Vaga"
                name="titulo"
                required
                value={form.titulo}
                onChange={handleChange}
                error={erros.titulo}
              />
            </div>

            <div>
              <FormSelect
                label="Categoria Profissional"
                name="categoria"
                required
                value={form.categoria}
                onChange={handleChange}
                options={CATEGORIAS}
                error={erros.categoria}
              />
            </div>

            <div>
              <FormSelect
                label="Status da Demanda"
                name="status"
                required
                value={form.status}
                onChange={handleChange}
                options={STATUS_OPTIONS}
              />
            </div>

            <div>
              <FormInput
                label="Valor da Diária (R$)"
                name="valor_diaria"
                type="number"
                step="0.01"
                min="1"
                required
                value={form.valor_diaria}
                onChange={handleChange}
                error={erros.valor_diaria}
              />
            </div>

            <div>
              <FormInput
                label="Data Prevista do Serviço"
                name="data_servico"
                type="date"
                required
                value={form.data_servico}
                onChange={handleChange}
                error={erros.data_servico}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <FormInput
                label="Bairro de Realização"
                name="bairro"
                required
                value={form.bairro}
                onChange={handleChange}
                error={erros.bairro}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <FormInput
                label="Descrição Detalhada das Atividades"
                name="descricao"
                type="textarea"
                rows={5}
                required
                value={form.descricao}
                onChange={handleChange}
                error={erros.descricao}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/painel')}
              disabled={salvando}
            >
              Cancelar
            </Button>
            {(temAlteracao || salvando) && (
              <Button
                type="submit"
                variant="primary"
                loading={salvando}
                icon={<Save size={16} />}
              >
                Salvar Alterações
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
