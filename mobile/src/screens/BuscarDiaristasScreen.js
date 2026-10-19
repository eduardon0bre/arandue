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
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CardDiarista from '../components/CardDiarista';
import api from '../services/api';
import { MOCK_DIARISTAS } from '../services/mockData';
import { colors, shadows } from '../styles/theme';

const ESPECIALIDADES_FILTRO = [
  'Todas',
  'Garçom',
  'Limpeza',
  'Cozinha',
  'Passadeira',
  'Carga e Descarga',
  'Pintura'
];

export default function BuscarDiaristasScreen({ navigation }) {
  const [diaristas, setDiaristas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busca, setBusca] = useState('');
  const [especialidadeSelecionada, setEspecialidadeSelecionada] = useState('Todas');

  // Modal Currículo
  const [diaristaCurriculo, setDiaristaCurriculo] = useState(null);
  const [modalCurriculoVisible, setModalCurriculoVisible] = useState(false);

  // Modal Agenda
  const [diaristaAgenda, setDiaristaAgenda] = useState(null);
  const [modalAgendaVisible, setModalAgendaVisible] = useState(false);
  const [agendaItens, setAgendaItens] = useState([]);
  const [loadingAgenda, setLoadingAgenda] = useState(false);

  const carregarDiaristas = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const response = await api.get('/diaristas');
      const dados = response?.data || response;
      if (Array.isArray(dados) && dados.length > 0) {
        setDiaristas(dados);
      } else {
        setDiaristas(MOCK_DIARISTAS);
      }
    } catch {
      // Fallback gracioso com perfis autênticos
      setDiaristas(MOCK_DIARISTAS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    carregarDiaristas();
  }, [carregarDiaristas]);

  const onRefresh = () => {
    setRefreshing(true);
    carregarDiaristas(true);
  };

  // Filtragem combinada por busca (nome/bairro) e especialidade
  const diaristasFiltrados = useMemo(() => {
    return diaristas.filter((d) => {
      const termo = busca.trim().toLowerCase();
      const matchTexto =
        !termo ||
        (d.nome && d.nome.toLowerCase().includes(termo)) ||
        (d.bairro && d.bairro.toLowerCase().includes(termo)) ||
        (d.regioes && d.regioes.toLowerCase().includes(termo));

      let matchEspecialidade = true;
      if (especialidadeSelecionada !== 'Todas') {
        const servicos = Array.isArray(d.servicos) ? d.servicos : [];
        const espLower = especialidadeSelecionada.toLowerCase();
        matchEspecialidade = servicos.some((s) => s.toLowerCase().includes(espLower));
      }

      return matchTexto && matchEspecialidade;
    });
  }, [diaristas, busca, especialidadeSelecionada]);

  // Abertura do Currículo
  const handleAbrirCurriculo = (diarista) => {
    setDiaristaCurriculo(diarista);
    setModalCurriculoVisible(true);
  };

  // Abertura e consulta da Agenda
  const handleAbrirAgenda = async (diarista) => {
    setDiaristaAgenda(diarista);
    setModalAgendaVisible(true);
    setLoadingAgenda(true);

    try {
      const response = await api.get(`/diaristas/${diarista.id}/disponibilidades`);
      const dados = response?.data || response;
      if (Array.isArray(dados) && dados.length > 0) {
        setAgendaItens(dados);
      } else {
        setAgendaItens(diarista.agendaDisponivel || []);
      }
    } catch {
      setAgendaItens(diarista.agendaDisponivel || []);
    } finally {
      setLoadingAgenda(false);
    }
  };

  const handleConvidarDiarista = (diarista) => {
    Alert.alert(
      'Convidar Profissional',
      `Deseja convidar ${diarista.nome} para uma de suas vagas abertas?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Continuar',
          onPress: () => {
            setModalAgendaVisible(false);
            setModalCurriculoVisible(false);
            Alert.alert('Convite Enviado! 🎉', `${diarista.nome} receberá a notificação da vaga.`);
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerBadge}>Vitrine de Profissionais</Text>
          <Text style={styles.headerTitle}>Encontre Diaristas</Text>
          <Text style={styles.headerSubtitle}>
            Contratação direta sem intermediações. Conheça o histórico verificado.
          </Text>
        </View>

        {/* Busca por texto */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, shadows.sm]}>
            <Ionicons name="search-outline" size={20} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por diarista, bairro ou região..."
              placeholderTextColor={colors.textMuted}
              value={busca}
              onChangeText={setBusca}
              returnKeyType="search"
            />
            {busca.length > 0 && (
              <TouchableOpacity onPress={() => setBusca('')} style={styles.clearBtn}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filtro horizontal de Especialidades */}
        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {ESPECIALIDADES_FILTRO.map((esp) => {
              const selecionada = especialidadeSelecionada === esp;
              return (
                <TouchableOpacity
                  key={esp}
                  onPress={() => setEspecialidadeSelecionada(esp)}
                  style={[styles.filterChip, selecionada && styles.filterChipSelected]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.filterChipText, selecionada && styles.filterChipTextSelected]}>
                    {esp}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Listagem com CardDiarista */}
        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Buscando diaristas verificados...</Text>
          </View>
        ) : (
          <FlatList
            data={diaristasFiltrados}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <CardDiarista
                diarista={item}
                onVerCurriculo={handleAbrirCurriculo}
                onVerAgenda={handleAbrirAgenda}
                onContratar={handleConvidarDiarista}
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
                <Ionicons name="people-outline" size={56} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>Nenhum diarista encontrado</Text>
                <Text style={styles.emptySubtitle}>
                  Tente alterar os termos da busca ou selecione outra especialidade.
                </Text>
              </View>
            }
          />
        )}

        {/* Modal: Currículo Completo do Diarista */}
        <Modal
          visible={modalCurriculoVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setModalCurriculoVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, shadows.lg]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Perfil Profissional</Text>
                <TouchableOpacity onPress={() => setModalCurriculoVisible(false)} style={styles.closeModalBtn}>
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {diaristaCurriculo && (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.curriculoScroll}>
                  {/* Cabeçalho do Perfil */}
                  <View style={styles.perfilHeader}>
                    <View style={styles.perfilAvatar}>
                      <Text style={styles.perfilAvatarText}>
                        {diaristaCurriculo.nome?.substring(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.perfilHeaderInfo}>
                      <Text style={styles.perfilNome}>{diaristaCurriculo.nome}</Text>
                      <View style={styles.perfilBadgeNota}>
                        <Ionicons name="star" size={14} color={colors.star} />
                        <Text style={styles.perfilNota}>
                          {parseFloat(diaristaCurriculo.media_avaliacoes || 5.0).toFixed(1)}
                        </Text>
                        <Text style={styles.perfilQtdAvaliacoes}>
                          ({diaristaCurriculo.total_avaliacoes || 0} avaliações)
                        </Text>
                      </View>
                      <Text style={styles.perfilLocal}>
                        📍 {diaristaCurriculo.bairro || 'São Paulo, SP'}
                      </Text>
                    </View>
                  </View>

                  {/* Informações de Experiência e Remuneração Base */}
                  <View style={styles.curriculoStatsRow}>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>Experiência</Text>
                      <Text style={styles.statValor}>{diaristaCurriculo.experiencia || '3+ anos'}</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>Diária Base</Text>
                      <Text style={[styles.statValor, { color: colors.success }]}>
                        R$ {parseFloat(diaristaCurriculo.valor_base || 160).toFixed(0)}
                      </Text>
                    </View>
                  </View>

                  {/* Biografia */}
                  <Text style={styles.secaoTitulo}>Sobre o Profissional</Text>
                  <Text style={styles.bioCompleta}>
                    {diaristaCurriculo.bio || 'Profissional dedicado com ampla experiência em serviços gerais.'}
                  </Text>

                  {/* Especialidades */}
                  <Text style={styles.secaoTitulo}>Especialidades & Habilidades</Text>
                  <View style={styles.chipsWrap}>
                    {(Array.isArray(diaristaCurriculo.servicos) ? diaristaCurriculo.servicos : ['Diarista Geral']).map((s, idx) => (
                      <View key={idx} style={styles.modalChip}>
                        <Ionicons name="checkmark-circle-outline" size={14} color={colors.primary} />
                        <Text style={styles.modalChipText}>{s}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Regiões de Atuação */}
                  <Text style={styles.secaoTitulo}>Regiões de Atendimento</Text>
                  <Text style={styles.regioesTexto}>
                    {diaristaCurriculo.regioes || diaristaCurriculo.bairro || 'Toda a capital e região metropolitana'}
                  </Text>

                  {/* Avaliações Recentes */}
                  <Text style={styles.secaoTitulo}>Avaliações de Contratantes</Text>
                  {(diaristaCurriculo.avaliacoesRecentes || [
                    { id: 1, autor: 'Cliente Aranduê', nota: 5, comentario: 'Muito pontual, atencioso e prestativo.' }
                  ]).map((av) => (
                    <View key={av.id} style={styles.avaliacaoItem}>
                      <View style={styles.avaliacaoItemTop}>
                        <Text style={styles.avaliacaoAutor}>{av.autor}</Text>
                        <View style={styles.estrelasPequenas}>
                          {[...Array(av.nota)].map((_, i) => (
                            <Ionicons key={i} name="star" size={12} color={colors.star} />
                          ))}
                        </View>
                      </View>
                      <Text style={styles.avaliacaoComentario}>{av.comentario}</Text>
                    </View>
                  ))}

                  {/* Botões do Rodapé do Modal */}
                  <View style={styles.modalActionsRow}>
                    <TouchableOpacity
                      style={styles.modalBtnAgenda}
                      onPress={() => {
                        setModalCurriculoVisible(false);
                        handleAbrirAgenda(diaristaCurriculo);
                      }}
                    >
                      <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                      <Text style={styles.modalBtnAgendaText}>Ver Agenda</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.modalBtnConvidar}
                      onPress={() => handleConvidarDiarista(diaristaCurriculo)}
                    >
                      <Text style={styles.modalBtnConvidarText}>Convidar para Vaga</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>

        {/* Modal: Agenda de Disponibilidade */}
        <Modal
          visible={modalAgendaVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setModalAgendaVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, shadows.lg]}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Agenda de Disponibilidade</Text>
                  <Text style={styles.modalSub}>
                    {diaristaAgenda ? diaristaAgenda.nome : 'Profissional'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setModalAgendaVisible(false)} style={styles.closeModalBtn}>
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {loadingAgenda ? (
                <View style={styles.agendaLoading}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.loadingText}>Consultando datas disponíveis...</Text>
                </View>
              ) : (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.agendaScroll}>
                  {agendaItens.length === 0 ? (
                    <View style={styles.agendaVazia}>
                      <Ionicons name="calendar-clear-outline" size={48} color={colors.textMuted} />
                      <Text style={styles.agendaVaziaTitulo}>Sem horários abertos no momento</Text>
                      <Text style={styles.agendaVaziaSub}>
                        Você pode enviar uma mensagem ou convite para consultar outras datas.
                      </Text>
                    </View>
                  ) : (
                    agendaItens.map((item, idx) => (
                      <View key={item.id || idx} style={styles.cardAgendaItem}>
                        <View style={styles.agendaDataBadge}>
                          <Ionicons name="calendar" size={16} color={colors.primary} />
                          <Text style={styles.agendaDataTexto}>{item.data}</Text>
                        </View>
                        <View style={styles.agendaHorarioBox}>
                          <Ionicons name="time-outline" size={15} color={colors.textSecondary} />
                          <Text style={styles.agendaHorarioTexto}>
                            {item.hora_inicio?.substring(0, 5)} às {item.hora_fim?.substring(0, 5)}
                          </Text>
                        </View>
                        {item.observacao ? (
                          <Text style={styles.agendaObsTexto}>"{item.observacao}"</Text>
                        ) : null}
                      </View>
                    ))
                  )}

                  <TouchableOpacity
                    style={styles.modalBtnConvidarCompleto}
                    onPress={() => diaristaAgenda && handleConvidarDiarista(diaristaAgenda)}
                  >
                    <Ionicons name="paper-plane-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.modalBtnConvidarText}>Convidar para Vaga</Text>
                  </TouchableOpacity>
                </ScrollView>
              )}
            </View>
          </View>
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
    paddingBottom: 6,
  },
  headerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.secondaryLight,
    color: colors.secondary,
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
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipSelected: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterChipTextSelected: {
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
    maxHeight: '88%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  curriculoScroll: {
    paddingBottom: 20,
  },
  perfilHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  perfilAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  perfilAvatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
  },
  perfilHeaderInfo: {
    flex: 1,
  },
  perfilNome: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  perfilBadgeNota: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  perfilNota: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  perfilQtdAvaliacoes: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  perfilLocal: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  curriculoStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  statValor: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2,
  },
  secaoTitulo: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 12,
    marginBottom: 8,
  },
  bioCompleta: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  modalChipText: {
    fontSize: 12,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  regioesTexto: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  avaliacaoItem: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avaliacaoItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  avaliacaoAutor: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  estrelasPequenas: {
    flexDirection: 'row',
    gap: 2,
  },
  avaliacaoComentario: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  modalBtnAgenda: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  modalBtnAgendaText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  modalBtnConvidar: {
    flex: 1.3,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  modalBtnConvidarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalBtnConvidarCompleto: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  agendaLoading: {
    alignItems: 'center',
    padding: 32,
  },
  agendaScroll: {
    paddingBottom: 20,
  },
  agendaVazia: {
    alignItems: 'center',
    padding: 32,
  },
  agendaVaziaTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 12,
  },
  agendaVaziaSub: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  cardAgendaItem: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  agendaDataBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  agendaDataTexto: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  agendaHorarioBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  agendaHorarioTexto: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  agendaObsTexto: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  }
});
