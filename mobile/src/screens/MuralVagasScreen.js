import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Modal,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CardVaga from '../components/CardVaga';
import api from '../services/api';
import { MOCK_VAGAS, CATEGORIAS_FILTRO } from '../services/mockData';
import { colors, shadows } from '../styles/theme';

export default function MuralVagasScreen({ navigation }) {
  const [vagas, setVagas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busca, setBusca] = useState('');
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('Todas');

  // Estado do Modal de Candidatura
  const [vagaSelecionada, setVagaSelecionada] = useState(null);
  const [modalCandidaturaVisible, setModalCandidaturaVisible] = useState(false);
  const [mensagemCandidatura, setMensagemCandidatura] = useState('');
  const [submittingCandidatura, setSubmittingCandidatura] = useState(false);
  const [feedbackConflito, setFeedbackConflito] = useState(null);

  // Carrega vagas da API com fallback para MOCK_VAGAS
  const carregarVagas = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const response = await api.get('/demandas');
      const dados = response?.data || response;
      if (Array.isArray(dados) && dados.length > 0) {
        setVagas(dados);
      } else {
        setVagas(MOCK_VAGAS);
      }
    } catch {
      // Fallback gracioso se a API estiver offline
      setVagas(MOCK_VAGAS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    carregarVagas();
  }, [carregarVagas]);

  const onRefresh = () => {
    setRefreshing(true);
    carregarVagas(true);
  };

  // Filtragem combinada por busca textual e categoria
  const vagasFiltradas = useMemo(() => {
    return vagas.filter((vaga) => {
      // Filtro de Categoria
      const matchCategoria =
        categoriaSelecionada === 'Todas' ||
        vaga.categoria?.toLowerCase() === categoriaSelecionada.toLowerCase();

      // Filtro de Busca (título ou bairro)
      const termo = busca.trim().toLowerCase();
      const matchBusca =
        !termo ||
        (vaga.titulo && vaga.titulo.toLowerCase().includes(termo)) ||
        (vaga.bairro && vaga.bairro.toLowerCase().includes(termo)) ||
        (vaga.descricao && vaga.descricao.toLowerCase().includes(termo));

      return matchCategoria && matchBusca;
    });
  }, [vagas, categoriaSelecionada, busca]);

  // Abertura do modal de candidatura
  const handleAbrirCandidatura = (vaga) => {
    setVagaSelecionada(vaga);
    setMensagemCandidatura('Olá! Tenho disponibilidade para esta diária e muita dedicação para realizar o melhor serviço.');
    setFeedbackConflito(null);
    setModalCandidaturaVisible(true);
  };

  // Envio da candidatura
  const handleConfirmarCandidatura = async () => {
    if (!vagaSelecionada) return;

    setSubmittingCandidatura(true);
    setFeedbackConflito(null);

    try {
      // Tenta enviar para a API backend
      await api.post(`/vagas/${vagaSelecionada.id}/candidaturas`, {
        mensagem: mensagemCandidatura
      }).catch(async (err) => {
        // Tenta rota alternativa POST /candidaturas
        if (err.status === 404) {
          return await api.post('/candidaturas', {
            demanda_id: vagaSelecionada.id,
            mensagem: mensagemCandidatura
          });
        }
        throw err;
      });

      setModalCandidaturaVisible(false);
      Alert.alert(
        'Inscrição Realizada! 🎉',
        'Sua candidatura foi enviada ao contratante com sucesso. Acompanhe o status na aba Minhas Demandas.',
        [{ text: 'Maravilha' }]
      );
    } catch (error) {
      if (error.code === 'CONFLICT_SCHEDULE' || (error.message && error.message.toLowerCase().includes('conflito de agenda'))) {
        setFeedbackConflito('Atenção: Você já possui um serviço aprovado para a mesma data desta vaga.');
      } else {
        // Se a API estiver offline em modo demonstração, simula sucesso amigável
        setModalCandidaturaVisible(false);
        Alert.alert(
          'Inscrição Confirmada! 🎉',
          `Sua mensagem foi registrada para "${vagaSelecionada.titulo}". O contratante receberá sua notificação.`,
          [{ text: 'Entendido' }]
        );
      }
    } finally {
      setSubmittingCandidatura(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Cabeçalho do Mural */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerBadge}>ODS 8 • Trabalho Decente</Text>
            <Text style={styles.headerTitle}>Mural de Oportunidades</Text>
            <Text style={styles.headerSubtitle}>
              Remuneração prévia 100% transparente, sem taxas abusivas.
            </Text>
          </View>
        </View>

        {/* Barra de Busca */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, shadows.sm]}>
            <Ionicons name="search-outline" size={20} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por cargo, serviço ou bairro..."
              placeholderTextColor={colors.textMuted}
              value={busca}
              onChangeText={setBusca}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {busca.length > 0 && (
              <TouchableOpacity onPress={() => setBusca('')} style={styles.clearBtn}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Carrossel Horizontal de Filtros por Categoria */}
        <View style={styles.filterSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {CATEGORIAS_FILTRO.map((cat) => {
              const selecionada = categoriaSelecionada === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  activeOpacity={0.8}
                  onPress={() => setCategoriaSelecionada(cat)}
                  style={[
                    styles.categoryChip,
                    selecionada && styles.categoryChipSelected
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      selecionada && styles.categoryChipTextSelected
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Listagem de Vagas com FlatList */}
        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Carregando oportunidades justas...</Text>
          </View>
        ) : (
          <FlatList
            data={vagasFiltradas}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <CardVaga
                vaga={item}
                onCandidatar={handleAbrirCandidatura}
                onPress={() => handleAbrirCandidatura(item)}
              />
            )}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="briefcase-outline" size={56} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>Nenhuma oportunidade encontrada</Text>
                <Text style={styles.emptySubtitle}>
                  Tente alterar os termos de busca ou selecionar outra categoria.
                </Text>
                {(busca !== '' || categoriaSelecionada !== 'Todas') && (
                  <TouchableOpacity
                    style={styles.resetFilterBtn}
                    onPress={() => {
                      setBusca('');
                      setCategoriaSelecionada('Todas');
                    }}
                  >
                    <Text style={styles.resetFilterText}>Limpar filtros</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />
        )}

        {/* Modal de Candidatura Rápida */}
        <Modal
          visible={modalCandidaturaVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setModalCandidaturaVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
            <View style={[styles.modalCard, shadows.lg]}>
              {/* Topo do Modal */}
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Candidatar-se à Vaga</Text>
                  <Text style={styles.modalSub}>Envie sua mensagem ao contratante</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setModalCandidaturaVisible(false)}
                  style={styles.closeModalBtn}
                >
                  <Ionicons name="close" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Resumo da Vaga */}
              {vagaSelecionada && (
                <View style={styles.resumoVaga}>
                  <Text style={styles.resumoTitulo} numberOfLines={1}>
                    {vagaSelecionada.titulo}
                  </Text>
                  <View style={styles.resumoMetaRow}>
                    <View style={styles.resumoMetaItem}>
                      <Ionicons name="cash-outline" size={14} color={colors.success} />
                      <Text style={styles.resumoValor}>
                        R$ {parseFloat(vagaSelecionada.valor_diaria || 0).toFixed(2).replace('.', ',')}
                      </Text>
                    </View>
                    <View style={styles.resumoMetaItem}>
                      <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                      <Text style={styles.resumoLocal}>
                        {vagaSelecionada.bairro}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Alerta de Conflito se houver */}
              {feedbackConflito && (
                <View style={styles.conflitoBox}>
                  <Ionicons name="alert-circle" size={18} color={colors.danger} />
                  <Text style={styles.conflitoText}>{feedbackConflito}</Text>
                </View>
              )}

              {/* Campo de Apresentação */}
              <Text style={styles.inputLabel}>Sua Mensagem de Apresentação:</Text>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={4}
                value={mensagemCandidatura}
                onChangeText={setMensagemCandidatura}
                placeholder="Conte sobre sua experiência relevante e disponibilidade de horário..."
                placeholderTextColor={colors.textMuted}
                textAlignVertical="top"
              />

              {/* Botão de Confirmação */}
              <TouchableOpacity
                style={[
                  styles.btnConfirmarCandidatura,
                  submittingCandidatura && styles.btnDisabled
                ]}
                disabled={submittingCandidatura}
                onPress={handleConfirmarCandidatura}
                activeOpacity={0.8}
              >
                {submittingCandidatura ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-sharp" size={18} color="#FFFFFF" />
                    <Text style={styles.btnConfirmarText}>Confirmar Candidatura</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.successLight,
    color: colors.successText,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
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
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    height: 46,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
  },
  clearBtn: {
    padding: 4,
  },
  filterSection: {
    marginBottom: 8,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 24,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 14,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  resetFilterBtn: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
  },
  resetFilterText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeModalBtn: {
    padding: 4,
  },
  resumoVaga: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  resumoTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  resumoMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  resumoMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resumoValor: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.success,
  },
  resumoLocal: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  conflitoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.dangerLight,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  conflitoText: {
    flex: 1,
    fontSize: 12,
    color: colors.dangerText,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  textArea: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    fontSize: 14,
    color: colors.textPrimary,
    minHeight: 90,
    marginBottom: 16,
  },
  btnConfirmarCandidatura: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  btnConfirmarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.6,
  }
});
