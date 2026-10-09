import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, PlusCircle, CheckCircle, ShieldCheck } from 'lucide-react';
import Button from '../components/Button';
import FormInput from '../components/FormInput';
import FormSelect from '../components/FormSelect';
import Alert from '../components/Alert';
import { useUser } from '../context/UserContext';
import api from '../services/api';

const CATEGORIAS = [
  { value: 'Eventos', label: 'Eventos & Gastronomia' },
  { value: 'Logística', label: 'Logística & Transporte' },
  { value: 'Construção', label: 'Construção & Reformas' },
  { value: 'Montagem', label: 'Montagem & Instalações' },
  { value: 'Limpeza', label: 'Limpeza & Conservação' },
  { value: 'Geral', label: 'Serviços Gerais' }
];

export default function NovaDemanda() {
  const navigate = useNavigate();
  const { usuarioAtual } = useUser();

  const [form, setForm] = useState({
    titulo: '',
    categoria: 'Eventos',
    valor_diaria: '',
    data_servico: '',
    bairro: usuarioAtual?.bairro || '',
    descricao: '',
    termosAceitos: false
  });

  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);
  const [mensagemErro, setMensagemErro] = useState(null);
  const [sucesso, setSucesso] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Limpa erro do campo alterado
    if (erros[name]) {
      setErros((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validarFormulario = () => {
    const novosErros = {};

    if (!form.titulo.trim()) {
      novosErros.titulo = 'O título da vaga é obrigatório.';
    } else if (form.titulo.trim().length < 5) {
      novosErros.titulo = 'O título deve possuir pelo menos 5 caracteres.';
    }

    if (!form.categoria) {
      novosErros.categoria = 'Selecione uma categoria profissional.';
    }

    const valor = parseFloat(form.valor_diaria);
    if (!form.valor_diaria || isNaN(valor) || valor <= 0) {
      novosErros.valor_diaria = 'Informe um valor válido maior que zero (R$).';
    } else if (valor < 80) {
      novosErros.valor_diaria = 'O piso de trabalho decente da plataforma sugere valor mínimo de R$ 80,00.';
    }

    if (!form.data_servico) {
      novosErros.data_servico = 'Informe a data prevista para o serviço.';
    }

    if (!form.bairro.trim()) {
      novosErros.bairro = 'O bairro é obrigatório para localização da diária.';
    }

    if (!form.descricao.trim()) {
      novosErros.descricao = 'A descrição das atividades é obrigatória.';
    } else if (form.descricao.trim().length < 20) {
      novosErros.descricao = 'Forneça ao menos 20 caracteres descrevendo horários e tarefas.';
    }

    if (!form.termosAceitos) {
      novosErros.termosAceitos = 'Você deve confirmar que a vaga é estritamente para maiores de 18 anos.';
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

      // Se o usuário atual for diarista, usamos o primeiro contratante como fallback (ID 1)
      const contratanteId = usuarioAtual?.tipo === 'contratante' ? usuarioAtual.id : 1;

      const payload = {
        contratante_id: contratanteId,
        titulo: form.titulo.trim(),
        categoria: form.categoria,
        valor_diaria: parseFloat(form.valor_diaria),
        data_servico: form.data_servico,
        bairro: form.bairro.trim(),
        descricao: form.descricao.trim()
      };

      const response = await api.post('/demandas', payload);

      if (response.data?.success) {
        setSucesso(true);
        setTimeout(() => {
          navigate('/painel');
        }, 1200);
      }
    } catch (err) {
      setMensagemErro(err.message || 'Falha ao cadastrar a demanda.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '820px' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
          <ArrowLeft size={16} /> Voltar ao mural
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
            <PlusCircle size={18} />
            CADASTRO DE DEMANDA
          </div>
          <h1 style={{ fontSize: '1.6rem', marginTop: '0.25rem' }}>Anunciar Nova Diária / Bico</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Preencha os dados do serviço operacional com transparência prévia de remuneração e jornada.
          </p>
        </div>

        {sucesso && (
          <Alert type="success" title="Vaga cadastrada com sucesso!">
            Redirecionando para o seu painel de gestão...
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
                placeholder="Ex.: Garçom para Coquetel Empresarial, Ajudante de Carga..."
                value={form.titulo}
                onChange={handleChange}
                error={erros.titulo}
                helperText="Seja direto na função que o profissional desempenhará."
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
              <FormInput
                label="Valor Fechado da Diária (R$)"
                name="valor_diaria"
                type="number"
                step="0.01"
                min="1"
                required
                placeholder="Ex.: 180.00"
                value={form.valor_diaria}
                onChange={handleChange}
                error={erros.valor_diaria}
                helperText="Valor líquido a ser pago ao término do serviço."
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

            <div>
              <FormInput
                label="Bairro de Realização"
                name="bairro"
                required
                placeholder="Ex.: Pinheiros, Lapa, Santana..."
                value={form.bairro}
                onChange={handleChange}
                error={erros.bairro}
                helperText="Bairro público exibido no mural de oportunidades."
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <FormInput
                label="Descrição Detalhada das Atividades e Requisitos"
                name="descricao"
                type="textarea"
                rows={5}
                required
                placeholder="Descreva as tarefas, horário de início e término, uniforme/vestimenta exigida (ex: sapato fechado preto), EPIs ou ferramentas..."
                value={form.descricao}
                onChange={handleChange}
                error={erros.descricao}
              />
            </div>
          </div>

          {/* Declaração de Conformidade com Trabalho Decente (ODS 8) */}
          <div style={{
            backgroundColor: 'var(--bg-subtle)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            margin: '1.25rem 0',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem'
          }}>
            <ShieldCheck size={22} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.85rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  name="termosAceitos"
                  checked={form.termosAceitos}
                  onChange={handleChange}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                />
                Confirmo que esta diária destina-se exclusivamente a maiores de 18 anos (+18)
              </label>
              <p style={{ marginTop: '0.35rem', color: 'var(--text-muted)' }}>
                Remuneração direta acordada sem cobrança de taxas sobre o trabalhador.
              </p>
              {erros.termosAceitos && (
                <span className="form-error" style={{ display: 'block', marginTop: '0.25rem' }}>
                  {erros.termosAceitos}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={salvando}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={salvando}
              icon={<CheckCircle size={16} />}
            >
              Publicar Vaga
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
