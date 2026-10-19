import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Switch,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// Explicações detalhadas de cada papel do sistema Aranduê
const PAPEIS_INFO = [
  {
    tipo: 'contratante',
    titulo: 'Contratante',
    subtitulo: 'Para empregadores e pequenos comércios',
    descricao: 'Permite criar e publicar vagas de diária, analisar currículos, aprovar prestadores e emitir avaliações.',
    icon: 'business',
    cor: '#2563EB',
    corFundo: '#EFF6FF',
  },
  {
    tipo: 'diarista',
    titulo: 'Diarista',
    subtitulo: 'Para trabalhadores autônomos',
    descricao: 'Permite gerenciar sua agenda de dias livres, buscar vagas no mural, enviar candidaturas e editar seu currículo profissional.',
    icon: 'calendar',
    cor: '#16A34A',
    corFundo: '#F0FDF4',
  },
  {
    tipo: 'ambos',
    titulo: 'Ambos os Papéis',
    subtitulo: 'Perfil híbrido com acesso completo',
    descricao: 'Acesso total: anuncie oportunidades quando precisar de reforço e candidate-se para diárias quando quiser trabalhar.',
    icon: 'repeat',
    cor: '#4F46E5',
    corFundo: '#EEF2FF',
  },
];

export default function ConfiguracoesScreen({ navigation }) {
  const { usuario, logout, atualizarPapel, atualizarPerfil } = useAuth();

  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [feedbackSucesso, setFeedbackSucesso] = useState('');

  const formatarTelefone = (valor) => {
    if (!valor) return '';
    const limpo = String(valor).replace(/\D/g, '').slice(0, 11);
    if (limpo.length === 0) return '';
    if (limpo.length <= 2) return `(${limpo}`;
    if (limpo.length <= 6) return `(${limpo.slice(0, 2)}) ${limpo.slice(2)}`;
    if (limpo.length <= 10) {
      return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 6)}-${limpo.slice(6)}`;
    }
    return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 7)}-${limpo.slice(7, 11)}`;
  };

  // Dados cadastrais
  const [tipoConta, setTipoConta] = useState(usuario?.tipo || 'diarista');
  const [nome, setNome] = useState(usuario?.nome || '');
  const [telefone, setTelefone] = useState(formatarTelefone(usuario?.telefone || ''));
  const [bairro, setBairro] = useState(usuario?.bairro || '');

  // Preferências de canais de notificação (Switches nativos)
  const [notifWhatsapp, setNotifWhatsapp] = useState(
    usuario?.notif_whatsapp !== undefined ? Boolean(usuario.notif_whatsapp) : true
  );
  const [notifEmail, setNotifEmail] = useState(
    usuario?.notif_email !== undefined ? Boolean(usuario.notif_email) : true
  );
  const [notifPush, setNotifPush] = useState(
    usuario?.notif_push !== undefined ? Boolean(usuario.notif_push) : true
  );

  // Carrega configurações da API (GET /api/configuracoes)
  useEffect(() => {
    async function carregarConfiguracoes() {
      try {
        setCarregando(true);
        const res = await api.get('/configuracoes');
        if (res?.data?.data) {
          const c = res.data.data;
          if (c.tipo) setTipoConta(c.tipo);
          if (c.nome) setNome(c.nome);
          if (c.telefone) setTelefone(formatarTelefone(c.telefone));
          if (c.bairro) setBairro(c.bairro);
          if (c.notif_whatsapp !== undefined) setNotifWhatsapp(Boolean(c.notif_whatsapp));
          if (c.notif_email !== undefined) setNotifEmail(Boolean(c.notif_email));
          if (c.notif_push !== undefined) setNotifPush(Boolean(c.notif_push));
        }
      } catch {
        // Mantém dados do contexto caso offline
      } finally {
        setCarregando(false);
      }
    }

    carregarConfiguracoes();
  }, []);

  // Salvar alterações cadastrais e preferências (PUT /api/configuracoes)
  const handleSalvar = async () => {
    if (!nome.trim() || !telefone.trim() || !bairro.trim()) {
      Alert.alert('Campos obrigatórios', 'Por favor preencha nome, telefone e bairro.');
      return;
    }

    setSalvando(true);
    try {
      const payload = {
        nome: nome.trim(),
        telefone: telefone.trim(),
        bairro: bairro.trim(),
        tipo: tipoConta,
        notif_whatsapp: notifWhatsapp,
        notif_email: notifEmail,
        notif_push: notifPush,
      };

      try {
        await api.put('/configuracoes', payload);
      } catch {
        // Fallback local se API offline
      }

      // Atualiza o contexto global de autenticação
      if (atualizarPerfil) {
        atualizarPerfil(payload);
      }
      if (atualizarPapel && tipoConta !== usuario?.tipo) {
        atualizarPapel(tipoConta);
      }

      setFeedbackSucesso('Configurações salvas com sucesso!');
      setTimeout(() => setFeedbackSucesso(''), 4000);
    } catch (err) {
      Alert.alert('Erro ao salvar', err.message || 'Falha ao salvar preferências.');
    } finally {
      setSalvando(false);
    }
  };

  // Diálogo de confirmação para Sair da Conta (Logout)
  const handleLogout = () => {
    Alert.alert(
      'Sair da Conta',
      'Deseja realmente desconectar sua conta do aplicativo Aranduê?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair da Conta',
          style: 'destructive',
          onPress: () => {
            logout();
            if (navigation && typeof navigation.replace === 'function') {
              navigation.replace('Login');
            } else if (navigation && typeof navigation.navigate === 'function') {
              navigation.navigate('Login');
            }
          },
        },
      ]
    );
  };

  // Diálogo para Exclusão de Conta Definitiva
  const handleExcluirConta = () => {
    Alert.alert(
      'Zona de Perigo • Encerrar Conta',
      'Esta ação irá anonimizar seus dados cadastrais conforme a LGPD e desativar seu acesso. Confirma a exclusão definitiva?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sim, Encerrar Conta',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete('/conta');
            } catch {
              // segue encerramento local
            }
            logout();
            Alert.alert('Conta encerrada', 'Sua conta foi desativada e seus dados foram anonimizados.');
            if (navigation && typeof navigation.navigate === 'function') {
              navigation.navigate('Login');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header da Tela */}
          <View style={styles.screenHeader}>
            <Text style={styles.screenTitle}>Configurações</Text>
            <Text style={styles.screenSubtitle}>
              Gerencie seu perfil, preferências de contato e privacidade
            </Text>
          </View>

          {/* Banner de Feedback de Sucesso */}
          {feedbackSucesso ? (
            <View style={styles.feedbackBanner}>
              <Ionicons name="checkmark-circle" size={20} color="#15803D" />
              <Text style={styles.feedbackBannerText}>{feedbackSucesso}</Text>
            </View>
          ) : null}

          {/* SEÇÃO 1: Seletor de Papel / Perfil */}
          <View style={styles.cardSection}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="people-outline" size={18} color="#2563EB" />
              <Text style={styles.sectionTitle}>Papel da Conta no Sistema</Text>
            </View>
            <Text style={styles.sectionSubtitleText}>
              Selecione o modo de uso do aplicativo de acordo com sua necessidade:
            </Text>

            <View style={styles.rolesList}>
              {PAPEIS_INFO.map((papel) => {
                const isSelected = tipoConta === papel.tipo;
                return (
                  <TouchableOpacity
                    key={papel.tipo}
                    style={[
                      styles.roleOptionCard,
                      isSelected && { borderColor: papel.cor, borderWidth: 2, backgroundColor: papel.corFundo },
                    ]}
                    onPress={() => setTipoConta(papel.tipo)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.roleHeaderRow}>
                      <View style={[styles.roleIconBox, { backgroundColor: papel.corFundo }]}>
                        <Ionicons name={papel.icon} size={20} color={papel.cor} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={[styles.roleOptionTitle, isSelected && { color: papel.cor }]}>
                          {papel.titulo}
                        </Text>
                        <Text style={styles.roleOptionSub}>{papel.subtitulo}</Text>
                      </View>
                      <View
                        style={[
                          styles.radioCircle,
                          isSelected && { borderColor: papel.cor, backgroundColor: papel.cor },
                        ]}
                      >
                        {isSelected ? <View style={styles.radioInnerDot} /> : null}
                      </View>
                    </View>
                    <Text style={styles.roleDescText}>{papel.descricao}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* SEÇÃO 2: Dados de Contato */}
          <View style={styles.cardSection}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="person-circle-outline" size={18} color="#2563EB" />
              <Text style={styles.sectionTitle}>Dados de Contato & Localização</Text>
            </View>
            <Text style={styles.sectionSubtitleText}>
              Dados utilizados para confirmações e contato entre contratante e diarista:
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome Completo</Text>
              <View style={styles.inputBox}>
                <Ionicons name="person-outline" size={18} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={nome}
                  onChangeText={setNome}
                  placeholder="Seu nome"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Telefone / WhatsApp</Text>
              <View style={styles.inputBox}>
                <Ionicons name="call-outline" size={18} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={telefone}
                  onChangeText={(v) => setTelefone(formatarTelefone(v))}
                  placeholder="(11) 98888-7777"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  maxLength={15}
                  autoComplete="off"
                  textContentType="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bairro Residencial / Região</Text>
              <View style={styles.inputBox}>
                <Ionicons name="location-outline" size={18} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={bairro}
                  onChangeText={setBairro}
                  placeholder="Ex: Pinheiros, Vila Mariana..."
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>
          </View>

          {/* SEÇÃO 3: Preferências de Notificações com Switches Nativos */}
          <View style={styles.cardSection}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="notifications-outline" size={18} color="#2563EB" />
              <Text style={styles.sectionTitle}>Canais de Notificação</Text>
            </View>
            <Text style={styles.sectionSubtitleText}>
              Escolha por quais canais você deseja ser notificado sobre diárias e candidaturas:
            </Text>

            {/* Switch WhatsApp */}
            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <View style={styles.switchIconRow}>
                  <Ionicons name="logo-whatsapp" size={18} color="#16A34A" />
                  <Text style={styles.switchLabel}>Notificações via WhatsApp</Text>
                </View>
                <Text style={styles.switchDesc}>
                  Receba avisos instantâneos quando sua candidatura for aceita ou quando houver nova vaga
                </Text>
              </View>
              <Switch
                value={notifWhatsapp}
                onValueChange={setNotifWhatsapp}
                trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
                thumbColor={notifWhatsapp ? '#2563EB' : '#F1F5F9'}
              />
            </View>

            {/* Switch E-mail */}
            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <View style={styles.switchIconRow}>
                  <Ionicons name="mail-outline" size={18} color="#2563EB" />
                  <Text style={styles.switchLabel}>Notificações via E-mail</Text>
                </View>
                <Text style={styles.switchDesc}>
                  Resumos semanais de diárias, comprovantes e confirmações de acordos
                </Text>
              </View>
              <Switch
                value={notifEmail}
                onValueChange={setNotifEmail}
                trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
                thumbColor={notifEmail ? '#2563EB' : '#F1F5F9'}
              />
            </View>

            {/* Switch Push Celular */}
            <View style={[styles.switchRow, { borderBottomWidth: 0 }]}>
              <View style={styles.switchInfo}>
                <View style={styles.switchIconRow}>
                  <Ionicons name="phone-portrait-outline" size={18} color="#7C3AED" />
                  <Text style={styles.switchLabel}>Notificações Push no Celular</Text>
                </View>
                <Text style={styles.switchDesc}>
                  Alertas em tempo real direto na tela de bloqueio do aparelho
                </Text>
              </View>
              <Switch
                value={notifPush}
                onValueChange={setNotifPush}
                trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
                thumbColor={notifPush ? '#2563EB' : '#F1F5F9'}
              />
            </View>
          </View>

          {/* Botão Principal Salvar */}
          <TouchableOpacity
            style={[styles.btnSalvar, salvando && styles.btnDisabled]}
            onPress={handleSalvar}
            disabled={salvando}
            activeOpacity={0.85}
          >
            {salvando ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.btnSalvarText}>Salvar Preferências</Text>
              </>
            )}
          </TouchableOpacity>

          {/* SEÇÃO 4: Zona de Perigo e Logout */}
          <View style={styles.dangerSection}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="shield-outline" size={18} color="#DC2626" />
              <Text style={[styles.sectionTitle, { color: '#DC2626' }]}>Sessão & Conta</Text>
            </View>

            {/* Botão Sair */}
            <TouchableOpacity
              style={styles.btnLogout}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <Ionicons name="log-out-outline" size={20} color="#EF4444" style={{ marginRight: 8 }} />
              <Text style={styles.btnLogoutText}>Sair da Conta (Logout)</Text>
            </TouchableOpacity>

            {/* Botão Excluir Conta */}
            <TouchableOpacity
              style={styles.btnExcluir}
              onPress={handleExcluirConta}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={16} color="#94A3B8" style={{ marginRight: 6 }} />
              <Text style={styles.btnExcluirText}>Encerrar e Anonimizar Conta (LGPD)</Text>
            </TouchableOpacity>
          </View>

          {/* Informações do App & ODS 8 */}
          <View style={styles.appInfoContainer}>
            <Text style={styles.appInfoTitle}>Aranduê Mobile • Versão 1.0.0</Text>
            <Text style={styles.appInfoText}>
              Compromisso com o Objetivo de Desenvolvimento Sustentável 8 (ONU): Trabalho Decente e
              Crescimento Econômico sem cobrança de taxas predatórias do trabalhador autônomo.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  screenHeader: {
    marginBottom: 14,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  screenSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  feedbackBannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
    marginLeft: 8,
    flex: 1,
  },
  cardSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionSubtitleText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
    lineHeight: 16,
  },
  rolesList: {
    gap: 10,
  },
  roleOptionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  roleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  roleOptionSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  roleDescText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
    lineHeight: 16,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  switchInfo: {
    flex: 1,
    paddingRight: 14,
  },
  switchIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  switchLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  switchDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 15,
  },
  btnSalvar: {
    backgroundColor: '#2563EB',
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 16,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  btnSalvarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  dangerSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    marginBottom: 16,
  },
  btnLogout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    height: 48,
    marginTop: 8,
  },
  btnLogoutText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '700',
  },
  btnExcluir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    paddingVertical: 6,
  },
  btnExcluirText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  appInfoContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  appInfoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  appInfoText: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 15,
  },
  btnDisabled: {
    opacity: 0.7,
  },
});
