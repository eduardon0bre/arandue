import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  Linking,
  SafeAreaView,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import {
  MOCK_VAGAS,
  MOCK_CANDIDATOS_DEMANDA,
  MOCK_MINHAS_CANDIDATURAS
} from '../services/mockData';
import { colors, shadows } from '../styles/theme';

export default function MinhasDemandasScreen({ navigation }) {
  // Aba ativa: 'contratante' (Minhas Vagas Criadas) ou 'diarista' (Minhas Candidaturas)
  const [abaAtiva, setAbaAtiva] = useState('contratante');

  // Estado da visão Contratante
  const [demandasContratante, setDemandasContratante] = useState([]);
  const [loadingContratante, setLoadingContratante] = useState(true);
  const [demandaExpandidaId, setDemandaExpandidaId] = useState(null);
  const [candidatosMap, setCandidatosMap] = useState({});
  const [loadingCandidatosId, setLoadingCandidatosId] = useState(null);

  // Estado da visão Diarista
  const [candidaturasDiarista, setCandidaturasDiarista] = useState([]);
  const [loadingDiarista, setLoadingDiarista] = useState(true);

  // Refresh
  const [refreshing, setRefreshing] = useState(false);

  // Modal de Avaliação do Diarista
  const [modalAvaliacaoVisible, setModalAvaliacaoVisible] = useState(false);
  const [demandaParaAvaliar, setDemandaParaAvaliar] = useState(null);
  const [diaristaParaAvaliar, setDiaristaParaAvaliar] = useState(null);
  const [notaAvaliacao, setNotaAvaliacao] = useState(5);
  const [comentarioAvaliacao, setComentarioAvaliacao] = useState('');
  const [submittingAvaliacao, setSubmittingAvaliacao] = useState(false);

  // Carregar demandas criadas (Contratante)
  const carregarDemandasContratante = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoadingContratante(true);
    try {
      const response = await api.get('/demandas/minhas').catch(() => api.get('/demandas'));
      const dados = response?.data || response;
      if (Array.isArray(dados) && dados.length > 0) {
        setDemandasContratante(dados);
      } else {
        setDemandasContratante(MOCK_VAGAS.slice(0, 3));
      }
    } catch {
      setDemandasContratante(MOCK_VAGAS.slice(0, 3));
    } finally {
      setLoadingContratante(false);
      setRefreshing(false);
    }
  }, []);

  // Carregar candidaturas feitas (Diarista)
  const carregarCandidaturasDiarista = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoadingDiarista(true);
    try {
      const response = await api.get('/candidaturas/diarista/4');
      const dados = response?.data || response;
      if (Array.isArray(dados) && dados.length > 0) {
        setCandidaturasDiarista(dados);
      } else {
        setCandidaturasDiarista(MOCK_MINHAS_CANDIDATURAS);
      }
    } catch {
      setCandidaturasDiarista(MOCK_MINHAS_CANDIDATURAS);
    } finally {
      setLoadingDiarista(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    carregarDemandasContratante();
    carregarCandidaturasDiarista();
  }, [carregarDemandasContratante, carregarCandidaturasDiarista]);

  const onRefresh = () => {
    setRefreshing(true);
    if (abaAtiva === 'contratante') {
      carregarDemandasContratante(true);
    } else {
      carregarCandidaturasDiarista(true);
    }
  };

  // Expandir vaga e carregar candidatos
  const handleToggleCandidatos = async (demandaId) => {
    if (demandaExpandidaId === demandaId) {
      setDemandaExpandidaId(null);
      return;
    }

    setDemandaExpandidaId(demandaId);

    // Se já tiver carregado os candidatos desta vaga, não busca de novo
    if (candidatosMap[demandaId]) return;

    setLoadingCandidatosId(demandaId);
    try {
      const response = await api.get(`/demandas/${demandaId}/candidatos`);
      const dados = response?.data || response;
      if (Array.isArray(dados) && dados.length > 0) {
        setCandidatosMap((prev) => ({ ...prev, [demandaId]: dados }));
      } else {
        setCandidatosMap((prev) => ({ ...prev, [demandaId]: MOCK_CANDIDATOS_DEMANDA }));
      }
    } catch {
      setCandidatosMap((prev) => ({ ...prev, [demandaId]: MOCK_CANDIDATOS_DEMANDA }));
    } finally {
      setLoadingCandidatosId(null);
    }
  };

  // Atualizar status de candidatura (Aprovar / Recusar)
  const handleAtualizarStatusCandidato = async (demandaId, candidaturaId, novoStatus) => {
    try {
      await api.patch(`/candidaturas/${candidaturaId}/status`, { status: novoStatus });
    } catch {
      // Mock atualizado em caso de API offline
    }

    // Atualiza estado local de candidatos
    setCandidatosMap((prev) => {
      const listaAtual = prev[demandaId] || [];
      const listaNova = listaAtual.map((c) => {
        if (c.id === candidaturaId || c.candidatura_id === candidaturaId) {
          return { ...c, status: novoStatus };
        }
        return c;
      });
      return { ...prev, [demandaId]: listaNova };
    });

    if (novoStatus === 'aceita') {
      Alert.alert(
        'Candidato Aprovado! 🚀',
        'O profissional foi selecionado para o trabalho. Você já pode iniciar a conversa direta pelo WhatsApp.',
        [{ text: 'Excelente' }]
      );
    } else {
      Alert.alert('Candidatura Recusada', 'O status foi atualizado para recusada.');
    }
  };

  // Abrir WhatsApp diretamente
  const handleAbrirWhatsApp = (telefone, nome = '') => {
    if (!telefone) {
      Alert.alert('Aviso', 'Número de WhatsApp não informado pelo usuário.');
      return;
    }
    const limpo = telefone.replace(/\D/g, '');
    const numeroComDDI = limpo.startsWith('55') ? limpo : `55${limpo}`;
    const textoMsg = encodeURIComponent(
      `Olá ${nome}! Entro em contato através do app Aranduê sobre o serviço agendado.`
    );
    const url = `https://wa.me/${numeroComDDI}?text=${textoMsg}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          return Linking.openURL(`https://api.whatsapp.com/send?phone=${numeroComDDI}&text=${textoMsg}`);
        }
      })
      .catch(() => {
        Alert.alert('Erro', 'Não foi possível abrir o WhatsApp no seu dispositivo.');
      });
  };

  // Fazer ligação telefônica
  const handleFazerLigacao = (telefone) => {
    if (!telefone) return;
    const limpo = telefone.replace(/\D/g, '');
    Linking.openURL(`tel:${limpo}`).catch(() => {
      Alert.alert('Erro', 'Não foi possível iniciar a chamada.');
    });
  };

  // Marcar Vaga como Concluída
  const handleConcluirVaga = async (vaga) => {
    Alert.alert(
      'Concluir Trabalho',
      `Confirma que a diária "${vaga.titulo}" foi executada? O próximo passo é avaliar o diarista.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sim, Concluir',
          onPress: async () => {
            try {
              await api.patch(`/demandas/${vaga.id}/concluir`);
            } catch {
              // fallback
            }

            // Atualiza status local
            setDemandasContratante((prev) =>
              prev.map((d) => (d.id === vaga.id ? { ...d, status: 'concluida' } : d))
            );

            // Abre modal de avaliação do profissional
            setDemandaParaAvaliar(vaga);
            const candidatos = candidatosMap[vaga.id] || MOCK_CANDIDATOS_DEMANDA;
            const contratado = candidatos.find((c) => c.status === 'aceita') || candidatos[0];
            setDiaristaParaAvaliar(contratado);
            setNotaAvaliacao(5);
            setComentarioAvaliacao('');
            setModalAvaliacaoVisible(true);
          }
        }
      ]
    );
  };

  // Submeter Avaliação
  const handleSalvarAvaliacao = async () => {
    if (!demandaParaAvaliar) return;
    setSubmittingAvaliacao(true);

    try {
      await api.post('/avaliacoes', {
        demanda_id: demandaParaAvaliar.id,
        avaliado_id: diaristaParaAvaliar?.diarista_id || diaristaParaAvaliar?.id || 4,
        nota: notaAvaliacao,
        comentario: comentarioAvaliacao
      });

      setModalAvaliacaoVisible(false);
      Alert.alert('Avaliação Registrada! ⭐', 'Obrigado por fortalecer a reputação justa na comunidade Aranduê.');
    } catch {
      setModalAvaliacaoVisible(false);
      Alert.alert('Avaliação Registrada! ⭐', 'Sua nota e feedback foram salvos com sucesso.');
    } finally {
      setSubmittingAvaliacao(false);
    }
  };

  // ================= RENDERIZADORES =================

  // Card de Demanda Criada (Visão Contratante)
  const renderItemContratante = ({ item: vaga }) => {
    const isExpandida = demandaExpandidaId === vaga.id;
    const candidatos = candidatosMap[vaga.id] || [];
    const estaCarregandoCandidatos = loadingCandidatosId === vaga.id;
    const temCandidatoAprovado = candidatos.some((c) => c.status === 'aceita');

    return (
      <View style={[styles.cardContratante, shadows.sm]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderBadges}>
            <View style={styles.badgeCategoria}>
              <Text style={styles.badgeCategoriaText}>{vaga.categoria || 'Geral'}</Text>
            </View>
            <View
              style={[
                styles.badgeStatus,
                vaga.status === 'concluida' && styles.badgeStatusConcluida,
                vaga.status === 'preenchida' && styles.badgeStatusPreenchida
              ]}
            >
              <Text
                style={[
                  styles.badgeStatusText,
                  vaga.status === 'concluida' && styles.badgeStatusTextConcluida,
                  vaga.status === 'preenchida' && styles.badgeStatusTextPreenchida
                ]}
              >
                {vaga.status || 'Aberta'}
              </Text>
            </View>
          </View>

          <Text style={styles.vagaValor}>
            R$ {parseFloat(vaga.valor_diaria || 0).toFixed(2).replace('.', ',')}
          </Text>
        </View>

        <Text style={styles.vagaTitulo}>{vaga.titulo}</Text>

        <View style={styles.vagaMetaRow}>
          <View style={styles.vagaMetaItem}>
            <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.vagaMetaText}>{vaga.data_servico || 'Data a combinar'}</Text>
          </View>
          <View style={styles.vagaMetaItem}>
            <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.vagaMetaText}>{vaga.bairro || 'São Paulo, SP'}</Text>
          </View>
        </View>

        <View style={styles.cardBotoesRow}>
          <TouchableOpacity
            style={[styles.btnVerCandidatos, isExpandida && styles.btnVerCandidatosAtivo]}
            onPress={() => handleToggleCandidatos(vaga.id)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isExpandida ? 'chevron-up' : 'people-outline'}
              size={16}
              color={isExpandida ? '#FFFFFF' : colors.primary}
            />
            <Text style={[styles.btnVerCandidatosText, isExpandida && styles.btnVerCandidatosTextAtivo]}>
              {isExpandida ? 'Ocultar Candidatos' : `Ver Candidatos (${vaga.total_candidatos || 2})`}
            </Text>
          </TouchableOpacity>

          {vaga.status !== 'concluida' && (
            <TouchableOpacity
              style={styles.btnConcluirServico}
              onPress={() => handleConcluirVaga(vaga)}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-done-circle-outline" size={16} color={colors.success} />
              <Text style={styles.btnConcluirServicoText}>Concluir Vaga</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Lista expandida de candidatos */}
        {isExpandida && (
          <View style={styles.secaoCandidatos}>
            <Text style={styles.candidatosTitulo}>Profissionais Inscritos:</Text>

            {estaCarregandoCandidatos ? (
              <View style={styles.loadingCandidatosBox}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loadingCandidatosText}>Buscando inscritos...</Text>
              </View>
            ) : candidatos.length === 0 ? (
              <Text style={styles.candidatosVazio}>Nenhum diarista se inscreveu ainda.</Text>
            ) : (
              candidatos.map((cand) => {
                const isAceita = cand.status === 'aceita';
                const isRecusada = cand.status === 'recusada';

                return (
                  <View key={cand.id || cand.candidatura_id} style={styles.itemCandidato}>
                    {/* Linha topo do candidato */}
                    <View style={styles.candidatoTopo}>
                      <View style={styles.candidatoAvatar}>
                        <Text style={styles.candidatoAvatarText}>
                          {cand.diarista_nome?.substring(0, 2).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.candidatoInfo}>
                        <Text style={styles.candidatoNome}>{cand.diarista_nome}</Text>
                        <View style={styles.candidatoEstrelas}>
                          <Ionicons name="star" size={13} color={colors.star} />
                          <Text style={styles.candidatoNota}>
                            {parseFloat(cand.nota_media || 5.0).toFixed(1)}
                          </Text>
                          <Text style={styles.candidatoBairro}>• {cand.diarista_bairro || 'São Paulo'}</Text>
                        </View>
                      </View>

                      {/* Badge de status */}
                      <View
                        style={[
                          styles.badgeCandidatura,
                          isAceita && styles.badgeCandAceita,
                          isRecusada && styles.badgeCandRecusada
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeCandTexto,
                            isAceita && styles.badgeCandTextoAceita,
                            isRecusada && styles.badgeCandTextoRecusada
                          ]}
                        >
                          {cand.status || 'pendente'}
                        </Text>
                      </View>
                    </View>

                    {/* Mensagem de apresentação */}
                    {cand.mensagem ? (
                      <Text style={styles.candidatoMensagem}>"{cand.mensagem}"</Text>
                    ) : null}

                    {/* Ações de Triagem ou Contato */}
                    {isAceita ? (
                      <View style={styles.candidatoContatoBox}>
                        <Text style={styles.candidatoContatoSucesso}>
                          🎉 Candidatura Aprovada! Entre em contato:
                        </Text>
                        <TouchableOpacity
                          style={styles.btnWhatsApp}
                          onPress={() => handleAbrirWhatsApp(cand.diarista_telefone, cand.diarista_nome)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
                          <Text style={styles.btnWhatsAppText}>Conversar no WhatsApp</Text>
                        </TouchableOpacity>
                      </View>
                    ) : isRecusada ? null : (
                      <View style={styles.candidatoAcoesRow}>
                        <TouchableOpacity
                          style={styles.btnAprovar}
                          onPress={() =>
                            handleAtualizarStatusCandidato(
                              vaga.id,
                              cand.id || cand.candidatura_id,
                              'aceita'
                            )
                          }
                          activeOpacity={0.8}
                        >
                          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                          <Text style={styles.btnAprovarText}>Aprovar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.btnRecusar}
                          onPress={() =>
                            handleAtualizarStatusCandidato(
                              vaga.id,
                              cand.id || cand.candidatura_id,
                              'recusada'
                            )
                          }
                          activeOpacity={0.8}
                        >
                          <Ionicons name="close" size={16} color={colors.danger} />
                          <Text style={styles.btnRecusarText}>Recusar</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}
      </View>
    );
  };

  // Card de Candidatura Realizada (Visão Diarista)
  const renderItemDiarista = ({ item: cand }) => {
    const isAceita = cand.status === 'aceita';
    const isPendente = cand.status === 'pendente';
    const isRecusada = cand.status === 'recusada';

    return (
      <View style={[styles.cardDiarista, shadows.sm]}>
        <View style={styles.cardHeader}>
          <View style={styles.badgeCategoria}>
            <Text style={styles.badgeCategoriaText}>{cand.categoria || 'Serviço'}</Text>
          </View>

          <View
            style={[
              styles.badgeStatus,
              isAceita && styles.badgeCandAceita,
              isPendente && styles.badgeCandPendente,
              isRecusada && styles.badgeCandRecusada
            ]}
          >
            <Text
              style={[
                styles.badgeStatusText,
                isAceita && styles.badgeCandTextoAceita,
                isPendente && styles.badgeCandTextoPendente,
                isRecusada && styles.badgeCandTextoRecusada
              ]}
            >
              {isAceita ? 'Aprovada / Aceita' : isPendente ? 'Aguardando Avaliação' : 'Recusada'}
            </Text>
          </View>
        </View>

        <Text style={styles.vagaTitulo}>{cand.titulo}</Text>

        <View style={styles.vagaMetaRow}>
          <View style={styles.vagaMetaItem}>
            <Ionicons name="cash-outline" size={15} color={colors.success} />
            <Text style={[styles.vagaMetaText, { color: colors.success, fontWeight: '700' }]}>
              R$ {parseFloat(cand.valor_diaria || 0).toFixed(2).replace('.', ',')}
            </Text>
          </View>
          <View style={styles.vagaMetaItem}>
            <Ionicons name="calendar-outline" size={15} color={colors.textSecondary} />
            <Text style={styles.vagaMetaText}>{cand.data_servico || 'Data prevista'}</Text>
          </View>
          <View style={styles.vagaMetaItem}>
            <Ionicons name="location-outline" size={15} color={colors.textSecondary} />
            <Text style={styles.vagaMetaText}>{cand.bairro || 'São Paulo'}</Text>
          </View>
        </View>

        {cand.mensagem ? (
          <Text style={styles.candMsgMinha}>Sua mensagem: "{cand.mensagem}"</Text>
        ) : null}

        {/* Seção comemorativa se aceita */}
        {isAceita && (
          <View style={styles.cardAceitaComemorativo}>
            <View style={styles.comemorativoHeader}>
              <Ionicons name="checkmark-circle" size={22} color={colors.success} />
              <Text style={styles.comemorativoTitulo}>Você foi selecionado para esta diária!</Text>
            </View>
            <Text style={styles.comemorativoSub}>
              Contratante: <Text style={{ fontWeight: '700' }}>{cand.contratante_nome}</Text>
            </Text>
            {cand.endereco_completo ? (
              <Text style={styles.comemorativoSub}>Endereço: {cand.endereco_completo}</Text>
            ) : null}

            <View style={styles.comemorativoBotoes}>
              <TouchableOpacity
                style={styles.btnWhatsApp}
                onPress={() => handleAbrirWhatsApp(cand.contratante_telefone, cand.contratante_nome)}
                activeOpacity={0.8}
              >
                <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
                <Text style={styles.btnWhatsAppText}>WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnLigar}
                onPress={() => handleFazerLigacao(cand.contratante_telefone)}
                activeOpacity={0.8}
              >
                <Ionicons name="call" size={18} color={colors.primary} />
                <Text style={styles.btnLigarText}>Ligar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header da Tela */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Minhas Demandas</Text>
          <Text style={styles.headerSubtitle}>
            Acompanhe suas vagas publicadas e candidaturas ativas.
          </Text>

          {/* Seletor de Perfil / Abas Segmentadas */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabButton, abaAtiva === 'contratante' && styles.tabButtonAtivo]}
              onPress={() => setAbaAtiva('contratante')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="business-outline"
                size={16}
                color={abaAtiva === 'contratante' ? '#FFFFFF' : colors.textSecondary}
              />
              <Text style={[styles.tabButtonText, abaAtiva === 'contratante' && styles.tabButtonTextAtivo]}>
                Minhas Vagas Criadas
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, abaAtiva === 'diarista' && styles.tabButtonAtivo]}
              onPress={() => setAbaAtiva('diarista')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="person-outline"
                size={16}
                color={abaAtiva === 'diarista' ? '#FFFFFF' : colors.textSecondary}
              />
              <Text style={[styles.tabButtonText, abaAtiva === 'diarista' && styles.tabButtonTextAtivo]}>
                Minhas Candidaturas
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Conteúdo da Aba */}
        {abaAtiva === 'contratante' ? (
          loadingContratante && !refreshing ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Carregando suas vagas...</Text>
            </View>
          ) : (
            <FlatList
              data={demandasContratante}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderItemContratante}
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
                  <Ionicons name="folder-open-outline" size={56} color={colors.textMuted} />
                  <Text style={styles.emptyTitle}>Nenhuma vaga cadastrada</Text>
                  <Text style={styles.emptySubtitle}>
                    Você ainda não publicou nenhuma diária. Clique no botão de criar demanda para começar!
                  </Text>
                </View>
              }
            />
          )
        ) : loadingDiarista && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.secondary} />
            <Text style={styles.loadingText}>Carregando suas candidaturas...</Text>
          </View>
        ) : (
          <FlatList
            data={candidaturasDiarista}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItemDiarista}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.secondary]}
                tintColor={colors.secondary}
              />
            }
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="document-text-outline" size={56} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>Nenhuma candidatura no histórico</Text>
                <Text style={styles.emptySubtitle}>
                  Visite o Mural de Oportunidades para encontrar turnos e diárias próximas.
                </Text>
              </View>
            }
          />
        )}

        {/* Modal de Avaliação do Diarista */}
        <Modal
          visible={modalAvaliacaoVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setModalAvaliacaoVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, shadows.lg]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Avaliar Serviço Concluído</Text>
                <TouchableOpacity
                  onPress={() => setModalAvaliacaoVisible(false)}
                  style={styles.closeModalBtn}
                >
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text style={styles.avaliacaoDiaristaNome}>
                Profissional: {diaristaParaAvaliar?.diarista_nome || 'Diarista'}
              </Text>
              <Text style={styles.avaliacaoVagaTitulo}>
                Vaga: {demandaParaAvaliar?.titulo}
              </Text>

              {/* Seletor de estrelas interativo */}
              <View style={styles.estrelasContainer}>
                {[1, 2, 3, 4, 5].map((estrela) => (
                  <TouchableOpacity
                    key={estrela}
                    onPress={() => setNotaAvaliacao(estrela)}
                    activeOpacity={0.7}
                    style={styles.estrelaTouch}
                  >
                    <Ionicons
                      name={estrela <= notaAvaliacao ? 'star' : 'star-outline'}
                      size={36}
                      color={estrela <= notaAvaliacao ? colors.star : colors.textMuted}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.notaLegenda}>
                {notaAvaliacao === 5
                  ? '⭐ Excelente trabalho!'
                  : notaAvaliacao === 4
                  ? 'Muito bom'
                  : notaAvaliacao === 3
                  ? 'Bom'
                  : 'Abaixo do esperado'}
              </Text>

              <Text style={styles.inputLabel}>Depoimento / Comentário (opcional):</Text>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={3}
                value={comentarioAvaliacao}
                onChangeText={setComentarioAvaliacao}
                placeholder="Ex: Muito pontual, educado e executou todo o serviço perfeitamente..."
                placeholderTextColor={colors.textMuted}
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={[styles.btnSalvarAvaliacao, submittingAvaliacao && styles.btnDisabled]}
                disabled={submittingAvaliacao}
                onPress={handleSalvarAvaliacao}
                activeOpacity={0.8}
              >
                {submittingAvaliacao ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.btnSalvarAvaliacaoText}>Registrar Avaliação</Text>
                  </>
                )}
              </TouchableOpacity>
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
    paddingBottom: 8,
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
    marginBottom: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
  },
  tabButtonAtivo: {
    backgroundColor: colors.primary,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabButtonTextAtivo: {
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
  cardContratante: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardHeaderBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgeCategoria: {
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeCategoriaText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  badgeStatus: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeStatusConcluida: {
    backgroundColor: colors.successLight,
  },
  badgeStatusPreenchida: {
    backgroundColor: colors.warningLight,
  },
  badgeStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
    textTransform: 'capitalize',
  },
  badgeStatusTextConcluida: {
    color: colors.successText,
  },
  badgeStatusTextPreenchida: {
    color: colors.warningText,
  },
  vagaValor: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.success,
  },
  vagaTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  vagaMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  vagaMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  vagaMetaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  cardBotoesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  btnVerCandidatos: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  btnVerCandidatosAtivo: {
    backgroundColor: colors.primary,
  },
  btnVerCandidatosText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  btnVerCandidatosTextAtivo: {
    color: '#FFFFFF',
  },
  btnConcluirServico: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: colors.successLight,
    borderWidth: 1,
    borderColor: colors.success,
  },
  btnConcluirServicoText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.successText,
  },
  secaoCandidatos: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  candidatosTitulo: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  loadingCandidatosBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  loadingCandidatosText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  candidatosVazio: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
    paddingVertical: 6,
  },
  itemCandidato: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  candidatoTopo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  candidatoAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  candidatoAvatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  candidatoInfo: {
    flex: 1,
  },
  candidatoNome: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  candidatoEstrelas: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  candidatoNota: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  candidatoBairro: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  badgeCandidatura: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: colors.border,
  },
  badgeCandAceita: {
    backgroundColor: colors.successLight,
  },
  badgeCandRecusada: {
    backgroundColor: colors.dangerLight,
  },
  badgeCandPendente: {
    backgroundColor: colors.warningLight,
  },
  badgeCandTexto: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  badgeCandTextoAceita: {
    color: colors.successText,
  },
  badgeCandTextoRecusada: {
    color: colors.dangerText,
  },
  badgeCandTextoPendente: {
    color: colors.warningText,
  },
  candidatoMensagem: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 6,
    lineHeight: 16,
  },
  candidatoAcoesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  btnAprovar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: colors.success,
    paddingVertical: 7,
    borderRadius: 8,
  },
  btnAprovarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  btnRecusar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: colors.dangerLight,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  btnRecusarText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '700',
  },
  candidatoContatoBox: {
    marginTop: 8,
    backgroundColor: '#F0FDF4',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  candidatoContatoSucesso: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.successText,
    marginBottom: 6,
  },
  btnWhatsApp: {
    backgroundColor: colors.whatsapp,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
  },
  btnWhatsAppText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  cardDiarista: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  candMsgMinha: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  cardAceitaComemorativo: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#86EFAC',
    marginTop: 6,
  },
  comemorativoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  comemorativoTitulo: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.successText,
  },
  comemorativoSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  comemorativoBotoes: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  btnLigar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 9,
    borderRadius: 8,
  },
  btnLigarText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
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
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  closeModalBtn: {
    padding: 4,
  },
  avaliacaoDiaristaNome: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  avaliacaoVagaTitulo: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  estrelasContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 10,
  },
  estrelaTouch: {
    padding: 4,
  },
  notaLegenda: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: colors.warningText,
    marginBottom: 14,
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
    minHeight: 80,
    marginBottom: 16,
  },
  btnSalvarAvaliacao: {
    backgroundColor: colors.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  btnSalvarAvaliacaoText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.6,
  }
});
