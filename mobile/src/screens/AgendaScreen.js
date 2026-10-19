import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// Turnos pré-definidos
const TURNOS = [
  { id: 'manha', label: 'Manhã', horario: '08:00 às 12:00', hora_inicio: '08:00', hora_fim: '12:00', icon: 'sunny-outline' },
  { id: 'tarde', label: 'Tarde', horario: '13:00 às 17:00', hora_inicio: '13:00', hora_fim: '17:00', icon: 'partly-sunny-outline' },
  { id: 'integral', label: 'Integral', horario: '08:00 às 17:00', hora_inicio: '08:00', hora_fim: '17:00', icon: 'time-outline' },
];

// Mock inicial de disponibilidades e serviços agendados
const DISPONIBILIDADES_MOCK = [
  {
    id: 101,
    data: '2026-10-24',
    hora_inicio: '08:00:00',
    hora_fim: '17:00:00',
    status: 'disponivel',
    observacao: 'Disponível para limpeza residencial ou eventos',
  },
  {
    id: 102,
    data: '2026-10-25',
    hora_inicio: '08:00:00',
    hora_fim: '12:00:00',
    status: 'disponivel',
    observacao: 'Apenas período da manhã na Zona Sul',
  },
  {
    id: 103,
    data: '2026-10-26',
    hora_inicio: '13:00:00',
    hora_fim: '17:00:00',
    status: 'disponivel',
    observacao: 'Período da tarde livre',
  },
  {
    id: 104,
    data: '2026-10-28',
    hora_inicio: '08:00:00',
    hora_fim: '17:00:00',
    status: 'ocupado',
    observacao: 'Reservado: Limpeza Pós-Obra em Santana',
  },
];

// Serviços já agendados / confirmados (para detecção de conflitos de agenda)
const SERVICOS_CONFIRMADOS = [
  {
    id: 201,
    titulo: 'Garçom para Casamento',
    data: '2026-10-28',
    horario: '16h às 23h',
    contratante: 'Carlos Mendes',
    bairro: 'Pinheiros',
  },
  {
    id: 202,
    titulo: 'Faxina Geral em Escritório',
    data: '2026-10-30',
    horario: '08h às 14h',
    contratante: 'Mariana Ramos',
    bairro: 'Lapa',
  },
];

// Helper para formatar data YYYY-MM-DD para exibição amigável
function formatarDataExtenso(dataStr) {
  if (!dataStr) return '';
  try {
    const partes = dataStr.split('T')[0].split('-');
    if (partes.length === 3) {
      const ano = partes[0];
      const mesIndex = parseInt(partes[1], 10) - 1;
      const dia = partes[2];
      const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const dataObj = new Date(ano, mesIndex, dia);
      const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const diaSemana = diasSemana[dataObj.getDay()] || '';
      return `${diaSemana}, ${dia} de ${meses[mesIndex]} de ${ano}`;
    }
  } catch {
    // ignora
  }
  return dataStr;
}

// Retorna data de hoje em formato YYYY-MM-DD
function obterDataHoje(offsetDias = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDias);
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export default function AgendaScreen({ navigation }) {
  const { usuario } = useAuth();
  const [disponibilidades, setDisponibilidades] = useState(DISPONIBILIDADES_MOCK);
  const [carregando, setCarregando] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [feedback, setFeedback] = useState({ tipo: '', mensagem: '' });

  // Estado do formulário de nova disponibilidade
  const [modoSelecao, setModoSelecao] = useState('unica'); // 'unica' ou 'multiplos'
  const [dataSelecionada, setDataSelecionada] = useState(obterDataHoje(1));
  const [turnoSelecionado, setTurnoSelecionado] = useState(TURNOS[0]);
  const [observacao, setObservacao] = useState('');
  const [salvando, setSalvando] = useState(false);

  // Carrega as disponibilidades da API (GET /api/disponibilidades/me ou /minhas)
  const carregarDisponibilidades = useCallback(async () => {
    try {
      setCarregando(true);
      let response;
      try {
        response = await api.get('/disponibilidades/me');
      } catch {
        // Fallback para rota /minhas existente no backend
        response = await api.get('/disponibilidades/minhas');
      }

      if (response?.data?.data && Array.isArray(response.data.data)) {
        setDisponibilidades(response.data.data);
      }
    } catch {
      // Mantém os mocks locais se a API estiver offline
    } finally {
      setCarregando(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    carregarDisponibilidades();
  }, [carregarDisponibilidades]);

  const onRefresh = () => {
    setRefreshing(true);
    carregarDisponibilidades();
  };

  // Verifica se há conflito com serviços agendados para a data selecionada
  const conflitoIdentificado = SERVICOS_CONFIRMADOS.find((s) => s.data === dataSelecionada);

  // Manipula envio da nova disponibilidade (POST /api/disponibilidades)
  const handleAdicionarDisponibilidade = async () => {
    if (!dataSelecionada) {
      Alert.alert('Data obrigatória', 'Por favor informe uma data válida.');
      return;
    }

    setSalvando(true);

    try {
      let datasEnvio = [];
      if (modoSelecao === 'multiplos') {
        // Gera os próximos 7 dias úteis
        for (let i = 1; i <= 7; i++) {
          datasEnvio.push(obterDataHoje(i));
        }
      } else {
        datasEnvio = [dataSelecionada];
      }

      const payload = {
        datas: datasEnvio,
        hora_inicio: turnoSelecionado.hora_inicio,
        hora_fim: turnoSelecionado.hora_fim,
        observacao: observacao.trim(),
        status: 'disponivel',
      };

      try {
        await api.post('/disponibilidades', payload);
      } catch {
        // Fallback local se offline
      }

      // Atualiza lista local
      const novosItens = datasEnvio.map((d, index) => ({
        id: Date.now() + index,
        data: d,
        hora_inicio: `${turnoSelecionado.hora_inicio}:00`,
        hora_fim: `${turnoSelecionado.hora_fim}:00`,
        status: 'disponivel',
        observacao: observacao.trim() || `Turno ${turnoSelecionado.label}`,
      }));

      setDisponibilidades((prev) => [...novosItens, ...prev]);
      setModalNovoAberto(false);
      setObservacao('');
      setFeedback({
        tipo: 'sucesso',
        mensagem: `${datasEnvio.length} dia(s) adicionado(s) com sucesso na sua agenda!`,
      });

      setTimeout(() => setFeedback({ tipo: '', mensagem: '' }), 4000);
    } catch (err) {
      Alert.alert('Erro', err.message || 'Falha ao salvar disponibilidade.');
    } finally {
      setSalvando(false);
    }
  };

  // Excluir disponibilidade (DELETE /api/disponibilidades/:id)
  const handleExcluir = (id, dataItem) => {
    Alert.alert(
      'Remover Disponibilidade',
      `Deseja realmente remover sua disponibilidade do dia ${formatarDataExtenso(dataItem)}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              try {
                await api.delete(`/disponibilidades/${id}`);
              } catch {
                // Fallback local
              }
              setDisponibilidades((prev) => prev.filter((item) => item.id !== id));
              setFeedback({
                tipo: 'info',
                mensagem: 'Data removida da sua agenda.',
              });
              setTimeout(() => setFeedback({ tipo: '', mensagem: '' }), 3000);
            } catch {
              Alert.alert('Erro', 'Não foi possível remover este horário.');
            }
          },
        },
      ]
    );
  };

  // Contadores métricas
  const totalDisponiveis = disponibilidades.filter((d) => d.status === 'disponivel').length;
  const totalOcupados = disponibilidades.filter((d) => d.status !== 'disponivel').length;

  const renderDisponibilidadeItem = ({ item }) => {
    const isDisponivel = item.status === 'disponivel';
    const temConflito = SERVICOS_CONFIRMADOS.some((s) => s.data === item.data);

    return (
      <View style={[styles.cardItem, !isDisponivel && styles.cardItemOcupado]}>
        <View style={styles.cardHeader}>
          <View style={styles.dateBadgeContainer}>
            <Ionicons
              name={isDisponivel ? 'calendar' : 'calendar-sharp'}
              size={18}
              color={isDisponivel ? '#16A34A' : '#EA580C'}
            />
            <Text style={styles.dateBadgeText}>{formatarDataExtenso(item.data)}</Text>
          </View>

          <View style={styles.cardActionsRow}>
            <View
              style={[
                styles.statusBadge,
                isDisponivel ? styles.statusBadgeLivre : styles.statusBadgeOcupado,
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  isDisponivel ? styles.statusBadgeTextLivre : styles.statusBadgeTextOcupado,
                ]}
              >
                {isDisponivel ? 'Livre' : 'Ocupado'}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => handleExcluir(item.id, item.data)}
              style={styles.deleteButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Linha de horário */}
        <View style={styles.timeRow}>
          <Ionicons name="time-outline" size={15} color="#64748B" />
          <Text style={styles.timeText}>
            {item.hora_inicio?.substring(0, 5)} até {item.hora_fim?.substring(0, 5)}
          </Text>
        </View>

        {/* Observação */}
        {item.observacao ? (
          <Text style={styles.observacaoText}>{item.observacao}</Text>
        ) : null}

        {/* Alerta de conflito de agenda */}
        {temConflito ? (
          <View style={styles.conflitoAlertBox}>
            <Ionicons name="alert-circle" size={16} color="#DC2626" />
            <Text style={styles.conflitoAlertText}>
              Atenção: Você possui um compromisso contratado nesta mesma data!
            </Text>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header Fixo */}
      <View style={styles.screenHeader}>
        <View>
          <Text style={styles.screenTitle}>Minha Agenda</Text>
          <Text style={styles.screenSubtitle}>
            Controle de disponibilidade de {usuario?.nome || 'Diarista'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.btnNovoTopo}
          onPress={() => setModalNovoAberto(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.btnNovoTopoText}>Novo Horário</Text>
        </TouchableOpacity>
      </View>

      {/* Banner de Feedback */}
      {feedback.mensagem ? (
        <View
          style={[
            styles.feedbackBanner,
            feedback.tipo === 'sucesso' ? styles.feedbackSucesso : styles.feedbackInfo,
          ]}
        >
          <Ionicons
            name={feedback.tipo === 'sucesso' ? 'checkmark-circle' : 'information-circle'}
            size={18}
            color={feedback.tipo === 'sucesso' ? '#15803D' : '#1D4ED8'}
          />
          <Text
            style={[
              styles.feedbackText,
              feedback.tipo === 'sucesso' ? styles.feedbackTextSucesso : styles.feedbackTextInfo,
            ]}
          >
            {feedback.mensagem}
          </Text>
        </View>
      ) : null}

      {/* Painel de Métricas Rápidas */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricCard}>
          <Text style={[styles.metricNumber, { color: '#16A34A' }]}>{totalDisponiveis}</Text>
          <Text style={styles.metricLabel}>Dias Livres</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={[styles.metricNumber, { color: '#EA580C' }]}>{totalOcupados}</Text>
          <Text style={styles.metricLabel}>Compromissos</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={[styles.metricNumber, { color: '#2563EB' }]}>
            {SERVICOS_CONFIRMADOS.length}
          </Text>
          <Text style={styles.metricLabel}>Bicos Marcados</Text>
        </View>
      </View>

      {/* Seção Informativa de Serviços Agendados */}
      <View style={styles.agendadosSection}>
        <View style={styles.agendadosHeader}>
          <Ionicons name="calendar-outline" size={16} color="#4F46E5" />
          <Text style={styles.agendadosTitle}>Serviços Confirmados no Aranduê</Text>
        </View>
        {SERVICOS_CONFIRMADOS.map((servico) => (
          <View key={servico.id} style={styles.servicoCard}>
            <View style={styles.servicoDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.servicoTitulo}>{servico.titulo}</Text>
              <Text style={styles.servicoDetalhes}>
                {formatarDataExtenso(servico.data)} • {servico.horario} • {servico.bairro}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Título da Lista */}
      <View style={styles.listSectionHeader}>
        <Text style={styles.listTitle}>Horários Cadastrados na Agenda</Text>
        <Text style={styles.listCount}>{disponibilidades.length} registros</Text>
      </View>

      {/* Lista de Disponibilidades */}
      {carregando && disponibilidades.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Carregando disponibilidades...</Text>
        </View>
      ) : (
        <FlatList
          data={disponibilidades}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderDisponibilidadeItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={48} color="#94A3B8" />
              <Text style={styles.emptyTitle}>Nenhuma data cadastrada</Text>
              <Text style={styles.emptyDesc}>
                Toque no botão &quot;Novo Horário&quot; acima para disponibilizar seus dias livres para
                contratantes.
              </Text>
            </View>
          }
        />
      )}

      {/* MODAL: Adicionar Nova Disponibilidade */}
      <Modal
        visible={modalNovoAberto}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalNovoAberto(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Adicionar Disponibilidade</Text>
                <Text style={styles.modalSubtitle}>Marque os dias em que você pode trabalhar</Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalNovoAberto(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Alternância: Data Única vs Múltiplos Dias */}
            <View style={styles.toggleModoContainer}>
              <TouchableOpacity
                style={[styles.toggleBtn, modoSelecao === 'unica' && styles.toggleBtnActive]}
                onPress={() => setModoSelecao('unica')}
              >
                <Text
                  style={[
                    styles.toggleBtnText,
                    modoSelecao === 'unica' && styles.toggleBtnTextActive,
                  ]}
                >
                  Data Específica
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, modoSelecao === 'multiplos' && styles.toggleBtnActive]}
                onPress={() => setModoSelecao('multiplos')}
              >
                <Text
                  style={[
                    styles.toggleBtnText,
                    modoSelecao === 'multiplos' && styles.toggleBtnTextActive,
                  ]}
                >
                  Próximos 7 Dias (Lote)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Seção Data */}
            {modoSelecao === 'unica' ? (
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Selecione ou digite a Data (AAAA-MM-DD):</Text>
                <View style={styles.dataInputRow}>
                  <TextInput
                    style={styles.dataInput}
                    value={dataSelecionada}
                    onChangeText={setDataSelecionada}
                    placeholder="2026-10-25"
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                {/* Botões Rápidos de Data */}
                <View style={styles.quickDatesRow}>
                  <TouchableOpacity
                    style={[
                      styles.quickDateChip,
                      dataSelecionada === obterDataHoje(0) && styles.quickDateChipActive,
                    ]}
                    onPress={() => setDataSelecionada(obterDataHoje(0))}
                  >
                    <Text
                      style={[
                        styles.quickDateText,
                        dataSelecionada === obterDataHoje(0) && styles.quickDateTextActive,
                      ]}
                    >
                      Hoje
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.quickDateChip,
                      dataSelecionada === obterDataHoje(1) && styles.quickDateChipActive,
                    ]}
                    onPress={() => setDataSelecionada(obterDataHoje(1))}
                  >
                    <Text
                      style={[
                        styles.quickDateText,
                        dataSelecionada === obterDataHoje(1) && styles.quickDateTextActive,
                      ]}
                    >
                      Amanhã
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.quickDateChip,
                      dataSelecionada === obterDataHoje(2) && styles.quickDateChipActive,
                    ]}
                    onPress={() => setDataSelecionada(obterDataHoje(2))}
                  >
                    <Text
                      style={[
                        styles.quickDateText,
                        dataSelecionada === obterDataHoje(2) && styles.quickDateTextActive,
                      ]}
                    >
                      +2 Dias
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.quickDateChip,
                      dataSelecionada === obterDataHoje(3) && styles.quickDateChipActive,
                    ]}
                    onPress={() => setDataSelecionada(obterDataHoje(3))}
                  >
                    <Text
                      style={[
                        styles.quickDateText,
                        dataSelecionada === obterDataHoje(3) && styles.quickDateTextActive,
                      ]}
                    >
                      +3 Dias
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Alerta caso a data coincida com serviço confirmado */}
                {conflitoIdentificado ? (
                  <View style={styles.modalConflitoBox}>
                    <Ionicons name="warning-outline" size={18} color="#B45309" />
                    <Text style={styles.modalConflitoText}>
                      Aviso: Você já tem o serviço &quot;{conflitoIdentificado.titulo}&quot; agendado neste
                      dia!
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : (
              <View style={styles.formSection}>
                <View style={styles.infoLoteBox}>
                  <Ionicons name="calendar" size={20} color="#2563EB" />
                  <Text style={styles.infoLoteText}>
                    Serão adicionados os próximos 7 dias seguidos à sua agenda de trabalho com o
                    turno selecionado abaixo.
                  </Text>
                </View>
              </View>
            )}

            {/* Seleção de Turno */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Selecione o Turno de Atendimento:</Text>
              <View style={styles.turnosContainer}>
                {TURNOS.map((turno) => {
                  const isSelected = turnoSelecionado.id === turno.id;
                  return (
                    <TouchableOpacity
                      key={turno.id}
                      style={[styles.turnoCard, isSelected && styles.turnoCardActive]}
                      onPress={() => setTurnoSelecionado(turno)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={turno.icon}
                        size={20}
                        color={isSelected ? '#2563EB' : '#64748B'}
                      />
                      <Text
                        style={[styles.turnoCardTitle, isSelected && styles.turnoCardTitleActive]}
                      >
                        {turno.label}
                      </Text>
                      <Text style={styles.turnoCardHorario}>{turno.horario}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Observação opcional */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Observação adicional (opcional):</Text>
              <TextInput
                style={styles.observacaoInput}
                value={observacao}
                onChangeText={setObservacao}
                placeholder="Ex: Levo aspirador próprio / Disponível na Zona Oeste"
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* Botões de Ação do Modal */}
            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => setModalNovoAberto(false)}
              >
                <Text style={styles.modalBtnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtnConfirm, salvando && styles.btnDisabled]}
                onPress={handleAdicionarDisponibilidade}
                disabled={salvando}
              >
                {salvando ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.modalBtnConfirmText}>Salvar Disponibilidade</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  screenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  screenSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  btnNovoTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  btnNovoTopoText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 4,
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  feedbackSucesso: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  feedbackInfo: {
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  feedbackText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  feedbackTextSucesso: {
    color: '#15803D',
  },
  feedbackTextInfo: {
    color: '#1E40AF',
  },
  metricsContainer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  metricNumber: {
    fontSize: 22,
    fontWeight: '800',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  agendadosSection: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  agendadosHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  agendadosTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginLeft: 6,
  },
  servicoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  servicoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4F46E5',
    marginRight: 8,
  },
  servicoTitulo: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  servicoDetalhes: {
    fontSize: 11,
    color: '#64748B',
  },
  listSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  listCount: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  cardItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 4,
    borderLeftColor: '#16A34A',
  },
  cardItemOcupado: {
    borderLeftColor: '#EA580C',
    backgroundColor: '#FFFBF5',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeLivre: {
    backgroundColor: '#DCFCE7',
  },
  statusBadgeOcupado: {
    backgroundColor: '#FFEDD5',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusBadgeTextLivre: {
    color: '#15803D',
  },
  statusBadgeTextOcupado: {
    color: '#C2410C',
  },
  deleteButton: {
    padding: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  timeText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  observacaoText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
    fontStyle: 'italic',
  },
  conflitoAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    gap: 6,
  },
  conflitoAlertText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#B91C1C',
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  // Estilos do Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
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
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseButton: {
    padding: 4,
  },
  toggleModoContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  toggleBtnTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
  formSection: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  dataInputRow: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  dataInput: {
    height: 44,
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '600',
  },
  quickDatesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  quickDateChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickDateChipActive: {
    backgroundColor: '#DBEAFE',
    borderColor: '#2563EB',
  },
  quickDateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  quickDateTextActive: {
    color: '#2563EB',
  },
  modalConflitoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 8,
    padding: 8,
    marginTop: 10,
    gap: 6,
  },
  modalConflitoText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    flex: 1,
  },
  infoLoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 10,
    padding: 12,
    gap: 10,
  },
  infoLoteText: {
    fontSize: 13,
    color: '#1E40AF',
    flex: 1,
    lineHeight: 18,
  },
  turnosContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  turnoCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  turnoCardActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
    borderWidth: 2,
  },
  turnoCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginTop: 4,
  },
  turnoCardTitleActive: {
    color: '#2563EB',
  },
  turnoCardHorario: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  observacaoInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: '#0F172A',
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  modalBtnCancel: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  modalBtnConfirm: {
    flex: 2,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnConfirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
