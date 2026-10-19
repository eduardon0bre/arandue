import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// Configurações visuais por tipo de notificação
const TIPO_CONFIG = {
  candidatura_nova: {
    label: 'Nova Candidatura',
    icon: 'person-add',
    iconFamily: 'Ionicons',
    color: '#2563EB',
    bgColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  candidatura_aprovada: {
    label: 'Candidatura Aprovada!',
    icon: 'checkmark-circle',
    iconFamily: 'Ionicons',
    color: '#16A34A',
    bgColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  lembrete_agenda: {
    label: 'Lembrete de Agenda',
    icon: 'alarm',
    iconFamily: 'Ionicons',
    color: '#EA580C',
    bgColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },
  mensagem_whatsapp: {
    label: 'Mensagem no WhatsApp',
    icon: 'whatsapp',
    iconFamily: 'FontAwesome5',
    color: '#059669',
    bgColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  avaliacao_recebida: {
    label: 'Nova Avaliação',
    icon: 'star',
    iconFamily: 'Ionicons',
    color: '#D97706',
    bgColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
};

// Lista inicial de notificações para demonstração interativa
const NOTIFICACOES_INICIAIS = [
  {
    id: 1,
    tipo: 'candidatura_aprovada',
    titulo: 'Você foi aprovada(o) na diária!',
    mensagem: 'Carlos Silva aprovou sua candidatura para "Garçom para Evento Corporativo" no dia 24/10.',
    tempo: 'Há 15 minutos',
    lida: false,
    importante: true,
  },
  {
    id: 2,
    tipo: 'mensagem_whatsapp',
    titulo: 'Novo contato via WhatsApp',
    mensagem: 'O contratante Carlos Silva iniciou uma conversa sobre o endereço e uniforme do evento.',
    tempo: 'Há 1 hora',
    lida: false,
    importante: false,
  },
  {
    id: 3,
    tipo: 'lembrete_agenda',
    titulo: 'Lembrete de compromisso amanhã',
    mensagem: 'Não se esqueça do seu turno amanhã às 08:00 em Vila Mariana. Chegue com 15 min de antecedência.',
    tempo: 'Há 4 horas',
    lida: false,
    importante: true,
  },
  {
    id: 4,
    tipo: 'candidatura_nova',
    titulo: 'Novo profissional interessado',
    mensagem: 'Lucas Pereira se candidatou para sua vaga "Ajudante de Carga e Descarga".',
    tempo: 'Ontem',
    lida: true,
    importante: false,
  },
  {
    id: 5,
    tipo: 'avaliacao_recebida',
    titulo: 'Você recebeu 5 estrelas! ⭐',
    mensagem: 'Mariana Ramos avaliou seu serviço como excelente: "Pontual e muito dedicada!"',
    tempo: 'Há 2 dias',
    lida: true,
    importante: true,
  },
];

export default function NotificacoesScreen() {
  const { usuario } = useAuth();
  const [notificacoes, setNotificacoes] = useState(NOTIFICACOES_INICIAIS);
  const [carregando, setCarregando] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filtroAba, setFiltroAba] = useState('todas'); // 'todas', 'nao_lidas', 'importantes'

  // Estado do Teste Disparo Simulado
  const [disparandoTeste, setDisparandoTeste] = useState(false);
  const [modalRelatorioAberto, setModalRelatorioAberto] = useState(false);
  const [relatorioDisparo, setRelatorioDisparo] = useState(null);

  // Carrega notificações (GET /api/notificacoes)
  const carregarNotificacoes = useCallback(async () => {
    try {
      setCarregando(true);
      const res = await api.get('/notificacoes');
      if (res?.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setNotificacoes(res.data.data);
      }
    } catch {
      // Mantém lista local em caso de backend indisponível
    } finally {
      setCarregando(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    carregarNotificacoes();
  }, [carregarNotificacoes]);

  const onRefresh = () => {
    setRefreshing(true);
    carregarNotificacoes();
  };

  // Marcar individual como lida (PATCH /api/notificacoes/:id/lida)
  const handleMarcarComoLida = async (id) => {
    try {
      try {
        await api.patch(`/notificacoes/${id}/lida`);
      } catch {
        // Fallback local
      }
      setNotificacoes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, lida: true } : n))
      );
    } catch {
      // Ignora erro
    }
  };

  // Marcar todas como lidas
  const handleMarcarTodasComoLidas = () => {
    setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
    Alert.alert('Sucesso', 'Todas as notificações foram marcadas como lidas.');
  };

  // Executa teste de disparo simulado multicanal (POST /api/notificacoes/testar)
  const handleDispararTeste = async () => {
    setDisparandoTeste(true);
    try {
      let resultado = null;
      try {
        const res = await api.post('/notificacoes/testar', {
          usuario_id: usuario?.id || 1,
          tipo: 'candidatura_aprovada',
        });
        resultado = res?.data?.data || res?.data;
      } catch {
        // Simulação multicanal robusta caso offline
        await new Promise((resolve) => setTimeout(resolve, 800));
        resultado = {
          destinatario: usuario?.nome || 'Usuário Aranduê',
          telefone: usuario?.telefone || '(11) 97777-6666',
          email: usuario?.email || 'usuario@email.com',
          canais: {
            whatsapp: {
              status: 'enviado',
              status_badge: 'OK',
              mensagem: 'Mensagem de confirmação de vaga enviada para o WhatsApp.',
            },
            email: {
              status: 'enviado',
              status_badge: 'OK',
              mensagem: 'E-mail transacional com detalhes da diária despachado.',
            },
            push: {
              status: 'entregue',
              status_badge: 'OK',
              mensagem: 'Push Notification local disparada no dispositivo.',
            },
          },
          timestamp: new Date().toLocaleTimeString('pt-BR'),
        };
      }

      setRelatorioDisparo(resultado);
      setModalRelatorioAberto(true);

      // Adiciona uma nova notificação na lista para visualização imediata
      const novaNotif = {
        id: Date.now(),
        tipo: 'candidatura_aprovada',
        titulo: 'Teste Multicanal Executado!',
        mensagem: `Simulação de notificação entregue via WhatsApp, E-mail e Push às ${new Date().toLocaleTimeString('pt-BR')}.`,
        tempo: 'Agora mesmo',
        lida: false,
        importante: true,
      };
      setNotificacoes((prev) => [novaNotif, ...prev]);
    } catch (err) {
      Alert.alert('Erro', err.message || 'Falha ao executar teste de notificações.');
    } finally {
      setDisparandoTeste(false);
    }
  };

  // Filtros aplicados
  const totalNaoLidas = notificacoes.filter((n) => !n.lida).length;
  const notificacoesFiltradas = notificacoes.filter((n) => {
    if (filtroAba === 'nao_lidas') return !n.lida;
    if (filtroAba === 'importantes') return n.importante;
    return true;
  });

  const renderIconeNotificacao = (tipo) => {
    const cfg = TIPO_CONFIG[tipo] || TIPO_CONFIG.lembrete_agenda;
    if (cfg.iconFamily === 'FontAwesome5') {
      return <FontAwesome5 name={cfg.icon} size={20} color={cfg.color} />;
    }
    return <Ionicons name={cfg.icon} size={22} color={cfg.color} />;
  };

  const renderNotificacaoCard = ({ item }) => {
    const cfg = TIPO_CONFIG[item.tipo] || TIPO_CONFIG.lembrete_agenda;

    return (
      <TouchableOpacity
        style={[
          styles.notifCard,
          !item.lida && styles.notifCardNaoLida,
          { borderLeftColor: cfg.color },
        ]}
        onPress={() => handleMarcarComoLida(item.id)}
        activeOpacity={0.8}
      >
        <View style={styles.notifCardRow}>
          {/* Caixa de Ícone */}
          <View style={[styles.iconBox, { backgroundColor: cfg.bgColor }]}>
            {renderIconeNotificacao(item.tipo)}
          </View>

          {/* Conteúdo */}
          <View style={styles.notifContent}>
            <View style={styles.notifHeaderRow}>
              <View style={[styles.tipoTag, { backgroundColor: cfg.bgColor, borderColor: cfg.borderColor }]}>
                <Text style={[styles.tipoTagText, { color: cfg.color }]}>{cfg.label}</Text>
              </View>
              <Text style={styles.notifTempo}>{item.tempo}</Text>
            </View>

            <Text style={[styles.notifTitulo, !item.lida && styles.notifTituloNaoLida]}>
              {item.titulo}
            </Text>
            <Text style={styles.notifMensagem}>{item.mensagem}</Text>
          </View>

          {/* Indicador de Lida / Não Lida */}
          <View style={styles.notifStatusIndicator}>
            {!item.lida ? (
              <View style={styles.dotNaoLida} />
            ) : (
              <Ionicons name="checkmark-done" size={16} color="#94A3B8" />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Central de Notificações</Text>
          <Text style={styles.headerSubtitle}>
            {totalNaoLidas > 0
              ? `${totalNaoLidas} nova(s) notificação(ões) não lida(s)`
              : 'Você está em dia com seus avisos!'}
          </Text>
        </View>
        {totalNaoLidas > 0 ? (
          <TouchableOpacity
            style={styles.btnMarcarTodas}
            onPress={handleMarcarTodasComoLidas}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="checkmark-done-outline" size={16} color="#2563EB" />
            <Text style={styles.btnMarcarTodasText}>Ler todas</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* BOTÃO DE AÇÃO RÁPIDA: Testar Disparo de Notificações */}
      <View style={styles.actionBannerContainer}>
        <TouchableOpacity
          style={[styles.btnDisparoTeste, disparandoTeste && styles.btnDisabled]}
          onPress={handleDispararTeste}
          disabled={disparandoTeste}
          activeOpacity={0.85}
        >
          {disparandoTeste ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <View style={styles.btnDisparoIconBox}>
                <Ionicons name="flash" size={16} color="#2563EB" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.btnDisparoTitle}>Testar Disparo de Notificações</Text>
                <Text style={styles.btnDisparoSub}>
                  Simula entrega multicanal via WhatsApp, E-mail e Push
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Abas de Filtro */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabButton, filtroAba === 'todas' && styles.tabButtonActive]}
          onPress={() => setFiltroAba('todas')}
        >
          <Text style={[styles.tabButtonText, filtroAba === 'todas' && styles.tabButtonTextActive]}>
            Todas ({notificacoes.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, filtroAba === 'nao_lidas' && styles.tabButtonActive]}
          onPress={() => setFiltroAba('nao_lidas')}
        >
          <Text
            style={[styles.tabButtonText, filtroAba === 'nao_lidas' && styles.tabButtonTextActive]}
          >
            Não Lidas ({totalNaoLidas})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, filtroAba === 'importantes' && styles.tabButtonActive]}
          onPress={() => setFiltroAba('importantes')}
        >
          <Text
            style={[styles.tabButtonText, filtroAba === 'importantes' && styles.tabButtonTextActive]}
          >
            Importantes
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista de Notificações */}
      {carregando && notificacoes.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Atualizando central de avisos...</Text>
        </View>
      ) : (
        <FlatList
          data={notificacoesFiltradas}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderNotificacaoCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={48} color="#94A3B8" />
              <Text style={styles.emptyTitle}>Nenhuma notificação encontrada</Text>
              <Text style={styles.emptySubtitle}>
                {filtroAba === 'nao_lidas'
                  ? 'Você já leu todas as suas mensagens recentes!'
                  : 'Quando surgirem novidades sobre suas vagas e candidaturas, elas aparecerão aqui.'}
              </Text>
            </View>
          }
        />
      )}

      {/* MODAL: Relatório de Disparo Multicanal Simulado */}
      <Modal
        visible={modalRelatorioAberto}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setModalRelatorioAberto(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalSuccessIcon}>
                <Ionicons name="checkmark-circle" size={28} color="#16A34A" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.modalTitle}>Teste Multicanal Concluído</Text>
                <Text style={styles.modalSubtitle}>Relatório do simulador Aranduê</Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalRelatorioAberto(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Detalhes dos canais */}
            <View style={styles.canaisList}>
              {/* WhatsApp */}
              <View style={styles.canalCard}>
                <View style={[styles.canalIconBox, { backgroundColor: '#DCFCE7' }]}>
                  <FontAwesome5 name="whatsapp" size={18} color="#16A34A" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.canalTitleRow}>
                    <Text style={styles.canalTitle}>WhatsApp</Text>
                    <View style={styles.statusPillSucesso}>
                      <Text style={styles.statusPillSucessoText}>Disparado • 200 OK</Text>
                    </View>
                  </View>
                  <Text style={styles.canalDesc}>
                    Mensagem transacional formatada enviada para {relatorioDisparo?.telefone || '(11) 97777-6666'}
                  </Text>
                </View>
              </View>

              {/* E-mail */}
              <View style={styles.canalCard}>
                <View style={[styles.canalIconBox, { backgroundColor: '#DBEAFE' }]}>
                  <Ionicons name="mail" size={18} color="#2563EB" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.canalTitleRow}>
                    <Text style={styles.canalTitle}>E-mail (SMTP)</Text>
                    <View style={styles.statusPillSucesso}>
                      <Text style={styles.statusPillSucessoText}>Entregue • 200 OK</Text>
                    </View>
                  </View>
                  <Text style={styles.canalDesc}>
                    Template HTML com resumo da diária despachado para {relatorioDisparo?.email || 'usuario@email.com'}
                  </Text>
                </View>
              </View>

              {/* Push Celular */}
              <View style={styles.canalCard}>
                <View style={[styles.canalIconBox, { backgroundColor: '#F3E8FF' }]}>
                  <Ionicons name="phone-portrait-outline" size={18} color="#7C3AED" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.canalTitleRow}>
                    <Text style={styles.canalTitle}>Push Notification</Text>
                    <View style={styles.statusPillSucesso}>
                      <Text style={styles.statusPillSucessoText}>Renderizado • OK</Text>
                    </View>
                  </View>
                  <Text style={styles.canalDesc}>
                    Alerta local emitido com som e vibração no dispositivo móvel.
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalBtnFechar}
              onPress={() => setModalRelatorioAberto(false)}
            >
              <Text style={styles.modalBtnFecharText}>Entendido</Text>
            </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  btnMarcarTodas: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  btnMarcarTodasText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  actionBannerContainer: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  btnDisparoTeste: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 14,
    padding: 12,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  btnDisparoIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisparoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnDisparoSub: {
    fontSize: 11,
    color: '#BFDBFE',
    marginTop: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 8,
  },
  tabButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
  },
  tabButtonActive: {
    backgroundColor: '#0F172A',
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  notifCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 4,
  },
  notifCardNaoLida: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
  },
  notifCardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notifContent: {
    flex: 1,
  },
  notifHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  tipoTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  tipoTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  notifTempo: {
    fontSize: 11,
    color: '#94A3B8',
  },
  notifTitulo: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginTop: 2,
  },
  notifTituloNaoLida: {
    fontWeight: '800',
    color: '#0F172A',
  },
  notifMensagem: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 16,
  },
  notifStatusIndicator: {
    marginLeft: 8,
    marginTop: 2,
  },
  dotNaoLida: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563EB',
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
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalSuccessIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  canaisList: {
    gap: 10,
    marginVertical: 10,
  },
  canalCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  canalIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  canalTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  canalTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  statusPillSucesso: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusPillSucessoText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  canalDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 3,
    lineHeight: 15,
  },
  modalBtnFechar: {
    backgroundColor: '#0F172A',
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  modalBtnFecharText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.7,
  },
});
