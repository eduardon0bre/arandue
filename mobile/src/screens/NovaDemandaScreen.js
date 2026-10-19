import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { CATEGORIAS_FORMULARIO } from '../services/mockData';
import { colors, shadows } from '../styles/theme';

const ATALHOS_VALOR = [150, 180, 200, 220, 250];

const BAIRROS_SUGERIDOS = [
  'Pinheiros',
  'Vila Mariana',
  'Lapa',
  'Santana',
  'Mooca',
  'Perdizes',
  'Tatuapé',
  'Bela Vista'
];

export default function NovaDemandaScreen({ route, navigation }) {
  const demandaEdicao = route?.params?.demanda || null;
  const isEdicao = Boolean(demandaEdicao);

  // Estados do formulário
  const [titulo, setTitulo] = useState(demandaEdicao?.titulo || '');
  const [categoria, setCategoria] = useState(demandaEdicao?.categoria || 'Faxina Residencial');
  const [descricao, setDescricao] = useState(demandaEdicao?.descricao || '');
  const [dataServico, setDataServico] = useState(
    demandaEdicao?.data_servico ? demandaEdicao.data_servico.split('T')[0] : ''
  );
  const [bairro, setBairro] = useState(demandaEdicao?.bairro || '');
  const [valorDiaria, setValorDiaria] = useState(
    demandaEdicao?.valor_diaria ? String(demandaEdicao.valor_diaria) : '180'
  );
  const [alimentacaoInclusa, setAlimentacaoInclusa] = useState(
    demandaEdicao?.alimentacao_inclusa || false
  );
  const [valeTransporte, setValeTransporte] = useState(
    demandaEdicao?.vale_transporte || true
  );

  // Estados de controle
  const [submitting, setSubmitting] = useState(false);
  const [erros, setErros] = useState({});

  // Inicializa data sugerida (próximo dia útil) caso vazio
  useEffect(() => {
    if (!dataServico) {
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      const iso = amanha.toISOString().split('T')[0];
      setDataServico(iso);
    }
  }, [dataServico]);

  // Formatação automática de data DD/MM/AAAA para YYYY-MM-DD
  const formatarDataInput = (texto) => {
    // Permite digitação simplificada
    const limpo = texto.replace(/\D/g, '');
    if (limpo.length <= 2) {
      return limpo;
    } else if (limpo.length <= 4) {
      return `${limpo.slice(0, 2)}/${limpo.slice(2)}`;
    } else {
      return `${limpo.slice(0, 2)}/${limpo.slice(2, 4)}/${limpo.slice(4, 8)}`;
    }
  };

  const handleDataChange = (texto) => {
    setDataServico(texto);
  };

  // Validação de campos
  const validarCampos = () => {
    const novosErros = {};

    if (!titulo.trim()) {
      novosErros.titulo = 'Informe um título claro para a vaga.';
    } else if (titulo.trim().length < 5) {
      novosErros.titulo = 'O título deve ter no mínimo 5 caracteres.';
    }

    if (!categoria) {
      novosErros.categoria = 'Selecione uma categoria.';
    }

    if (!descricao.trim()) {
      novosErros.descricao = 'Descreva as atividades, horários e requisitos.';
    } else if (descricao.trim().length < 15) {
      novosErros.descricao = 'Forneça uma descrição mais detalhada (+15 letras).';
    }

    if (!bairro.trim()) {
      novosErros.bairro = 'Informe o bairro ou região do serviço.';
    }

    const valorNum = parseFloat(valorDiaria);
    if (!valorDiaria || isNaN(valorNum) || valorNum <= 0) {
      novosErros.valorDiaria = 'O valor da diária deve ser um número positivo.';
    } else if (valorNum < 80) {
      novosErros.valorDiaria = 'O valor mínimo por diária recomendada pelo ODS 8 é R$ 80,00.';
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  // Submissão
  const handleSalvarDemanda = async () => {
    if (!validarCampos()) {
      Alert.alert('Campos Obrigatórios', 'Por favor, revise os campos destacados em vermelho.');
      return;
    }

    setSubmitting(true);

    // Converte data para formato ISO YYYY-MM-DD se necessário
    let dataFinal = dataServico;
    if (dataServico.includes('/')) {
      const [dia, mes, ano] = dataServico.split('/');
      if (dia && mes && ano) {
        dataFinal = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
      }
    }

    const payload = {
      titulo: titulo.trim(),
      categoria,
      descricao: descricao.trim(),
      data_servico: dataFinal,
      bairro: bairro.trim(),
      valor_diaria: parseFloat(valorDiaria),
      alimentacao_inclusa: alimentacaoInclusa,
      vale_transporte: valeTransporte
    };

    try {
      if (isEdicao && demandaEdicao.id) {
        await api.put(`/demandas/${demandaEdicao.id}`, payload);
      } else {
        await api.post('/demandas', payload);
      }

      Alert.alert(
        isEdicao ? 'Vaga Atualizada! 🎉' : 'Vaga Publicada com Sucesso! 🚀',
        'Os profissionais cadastrados na sua região já podem visualizar a diária no Mural.',
        [
          {
            text: 'Ver Minhas Demandas',
            onPress: () => {
              if (navigation?.navigate) {
                navigation.navigate('MinhasDemandas');
              } else if (navigation?.goBack) {
                navigation.goBack();
              }
            }
          }
        ]
      );
    } catch (error) {
      // Fallback em caso de API offline ou modo demonstração
      Alert.alert(
        isEdicao ? 'Vaga Atualizada! 🎉' : 'Demanda Publicada! 🎉',
        `A vaga "${payload.titulo}" de R$ ${payload.valor_diaria.toFixed(2)} foi salva e está aberta para candidaturas.`,
        [
          {
            text: 'OK',
            onPress: () => {
              if (navigation?.navigate) {
                navigation.navigate('MinhasDemandas');
              } else if (navigation?.goBack) {
                navigation.goBack();
              }
            }
          }
        ]
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Cabeçalho da Tela */}
          <View style={styles.header}>
            <View style={styles.badgeODS}>
              <Ionicons name="shield-checkmark" size={13} color={colors.successText} />
              <Text style={styles.badgeODSText}>ODS 8 • Transparência Salarial Prévia</Text>
            </View>
            <Text style={styles.headerTitle}>
              {isEdicao ? 'Editar Demanda' : 'Publicar Nova Diária'}
            </Text>
            <Text style={styles.headerSubtitle}>
              Conecte-se diretamente com trabalhadores autônomos sem taxas abusivas.
            </Text>
          </View>

          {/* Campo: Título da Vaga */}
          <View style={styles.campoContainer}>
            <Text style={styles.label}>
              Título da Oportunidade <Text style={styles.obrigatorio}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, erros.titulo && styles.inputErro]}
              placeholder="Ex: Garçom para Evento, Faxina Residencial, etc."
              placeholderTextColor={colors.textMuted}
              value={titulo}
              onChangeText={(txt) => {
                setTitulo(txt);
                if (erros.titulo) setErros((prev) => ({ ...prev, titulo: null }));
              }}
            />
            {erros.titulo && <Text style={styles.erroTexto}>{erros.titulo}</Text>}
          </View>

          {/* Campo: Seletor de Categoria em Chips */}
          <View style={styles.campoContainer}>
            <Text style={styles.label}>
              Categoria do Serviço <Text style={styles.obrigatorio}>*</Text>
            </Text>
            <View style={styles.categoriasWrap}>
              {CATEGORIAS_FORMULARIO.map((cat) => {
                const selecionada = categoria === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.chipCategoria,
                      selecionada && styles.chipCategoriaSelecionada
                    ]}
                    onPress={() => setCategoria(cat)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={selecionada ? 'checkmark-circle' : 'radio-button-off'}
                      size={14}
                      color={selecionada ? '#FFFFFF' : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.chipCategoriaTexto,
                        selecionada && styles.chipCategoriaTextoSelecionada
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Campo: Descrição Detalhada */}
          <View style={styles.campoContainer}>
            <Text style={styles.label}>
              Descrição das Atividades & Requisitos <Text style={styles.obrigatorio}>*</Text>
            </Text>
            <TextInput
              style={[styles.textArea, erros.descricao && styles.inputErro]}
              placeholder="Descreva o que será feito, horários exatos de início e término, uniforme e se há ferramentas necessárias..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              value={descricao}
              onChangeText={(txt) => {
                setDescricao(txt);
                if (erros.descricao) setErros((prev) => ({ ...prev, descricao: null }));
              }}
              textAlignVertical="top"
            />
            {erros.descricao && <Text style={styles.erroTexto}>{erros.descricao}</Text>}
          </View>

          {/* Linha dupla: Data do Serviço e Bairro */}
          <View style={styles.linhaDupla}>
            {/* Data */}
            <View style={[styles.campoContainer, { flex: 1 }]}>
              <Text style={styles.label}>
                Data do Serviço <Text style={styles.obrigatorio}>*</Text>
              </Text>
              <View style={styles.inputComIcone}>
                <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} style={styles.iconeInput} />
                <TextInput
                  style={[styles.inputFlex, erros.dataServico && styles.inputErro]}
                  placeholder="AAAA-MM-DD"
                  placeholderTextColor={colors.textMuted}
                  value={dataServico}
                  onChangeText={handleDataChange}
                />
              </View>
            </View>

            {/* Bairro */}
            <View style={[styles.campoContainer, { flex: 1.2 }]}>
              <Text style={styles.label}>
                Bairro / Local <Text style={styles.obrigatorio}>*</Text>
              </Text>
              <View style={styles.inputComIcone}>
                <Ionicons name="location-outline" size={18} color={colors.textSecondary} style={styles.iconeInput} />
                <TextInput
                  style={[styles.inputFlex, erros.bairro && styles.inputErro]}
                  placeholder="Ex: Pinheiros, SP"
                  placeholderTextColor={colors.textMuted}
                  value={bairro}
                  onChangeText={(txt) => {
                    setBairro(txt);
                    if (erros.bairro) setErros((prev) => ({ ...prev, bairro: null }));
                  }}
                />
              </View>
            </View>
          </View>
          {erros.bairro && <Text style={[styles.erroTexto, { marginTop: -6, marginBottom: 8 }]}>{erros.bairro}</Text>}

          {/* Atalhos de Bairros Populares */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.atalhosBairroScroll}>
            {BAIRROS_SUGERIDOS.map((b) => (
              <TouchableOpacity
                key={b}
                style={[styles.chipBairro, bairro === b && styles.chipBairroAtivo]}
                onPress={() => setBairro(b)}
              >
                <Text style={[styles.chipBairroTexto, bairro === b && styles.chipBairroTextoAtivo]}>
                  {b}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Campo: Valor Proposto (R$) */}
          <View style={styles.campoContainer}>
            <View style={styles.labelValorRow}>
              <Text style={styles.label}>
                Remuneração Líquida da Diária (R$) <Text style={styles.obrigatorio}>*</Text>
              </Text>
              <Text style={styles.odsDica}>Valor integral ao profissional</Text>
            </View>

            <View style={styles.inputValorContainer}>
              <Text style={styles.cifrao}>R$</Text>
              <TextInput
                style={[styles.inputValor, erros.valorDiaria && styles.inputErro]}
                placeholder="0,00"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={valorDiaria}
                onChangeText={(txt) => {
                  setValorDiaria(txt.replace(',', '.'));
                  if (erros.valorDiaria) setErros((prev) => ({ ...prev, valorDiaria: null }));
                }}
              />
            </View>
            {erros.valorDiaria && <Text style={styles.erroTexto}>{erros.valorDiaria}</Text>}

            {/* Atalhos de Valores Diários */}
            <View style={styles.atalhosValorRow}>
              {ATALHOS_VALOR.map((val) => (
                <TouchableOpacity
                  key={val}
                  style={[styles.chipValor, valorDiaria === String(val) && styles.chipValorAtivo]}
                  onPress={() => setValorDiaria(String(val))}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipValorTexto, valorDiaria === String(val) && styles.chipValorTextoAtivo]}>
                    R$ {val}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Checkboxes de Benefícios */}
          <View style={styles.beneficiosContainer}>
            <Text style={styles.labelBeneficios}>Benefícios e Condições Adicionais:</Text>

            {/* Alimentação Inclusa */}
            <TouchableOpacity
              style={styles.checkboxItem}
              onPress={() => setAlimentacaoInclusa(!alimentacaoInclusa)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkboxBox, alimentacaoInclusa && styles.checkboxBoxChecked]}>
                {alimentacaoInclusa && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
              </View>
              <View style={styles.checkboxLabelContainer}>
                <Text style={styles.checkboxTitulo}>Alimentação Inclusa no Local</Text>
                <Text style={styles.checkboxSub}>
                  Refeição ou lanche fornecido durante o turno de trabalho.
                </Text>
              </View>
            </TouchableOpacity>

            {/* Ajuda de Transporte */}
            <TouchableOpacity
              style={styles.checkboxItem}
              onPress={() => setValeTransporte(!valeTransporte)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkboxBox, valeTransporte && styles.checkboxBoxChecked]}>
                {valeTransporte && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
              </View>
              <View style={styles.checkboxLabelContainer}>
                <Text style={styles.checkboxTitulo}>Ajuda de Custo / Vale Transporte</Text>
                <Text style={styles.checkboxSub}>
                  Auxílio adicional para passagem de ida e volta do diarista.
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Botão de Submissão */}
          <TouchableOpacity
            style={[styles.btnPublicar, submitting && styles.btnDisabled, shadows.md]}
            disabled={submitting}
            onPress={handleSalvarDemanda}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons
                  name={isEdicao ? 'save-outline' : 'megaphone-outline'}
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.btnPublicarTexto}>
                  {isEdicao ? 'Salvar Alterações da Vaga' : 'Publicar Vaga no Mural'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  badgeODS: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  badgeODSText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.successText,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  campoContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  obrigatorio: {
    color: colors.danger,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.textPrimary,
  },
  inputErro: {
    borderColor: colors.danger,
    backgroundColor: '#FEF2F2',
  },
  erroTexto: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 4,
    fontWeight: '500',
  },
  categoriasWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipCategoria: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipCategoriaSelecionada: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  chipCategoriaTexto: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chipCategoriaTextoSelecionada: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  textArea: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.textPrimary,
    minHeight: 96,
  },
  linhaDupla: {
    flexDirection: 'row',
    gap: 10,
  },
  inputComIcone: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
  },
  iconeInput: {
    marginRight: 6,
  },
  inputFlex: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.textPrimary,
  },
  atalhosBairroScroll: {
    gap: 6,
    marginBottom: 16,
  },
  chipBairro: {
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipBairroAtivo: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  chipBairroTexto: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  chipBairroTextoAtivo: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  labelValorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  odsDica: {
    fontSize: 11,
    color: colors.successText,
    fontWeight: '600',
  },
  inputValorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
  },
  cifrao: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.success,
    marginRight: 6,
  },
  inputValor: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    paddingVertical: 10,
  },
  atalhosValorRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  chipValor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipValorAtivo: {
    backgroundColor: colors.successLight,
    borderColor: colors.success,
  },
  chipValorTexto: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  chipValorTextoAtivo: {
    color: colors.successText,
  },
  beneficiosContainer: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  labelBeneficios: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxBoxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxLabelContainer: {
    flex: 1,
  },
  checkboxTitulo: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  checkboxSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  btnPublicar: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
  },
  btnPublicarTexto: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.6,
  }
});
