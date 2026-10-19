import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login, loginComoDemo, loginComGoogle, carregando } = useAuth();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erroEmail, setErroEmail] = useState('');
  const [erroSenha, setErroSenha] = useState('');
  const [loadingLocal, setLoadingLocal] = useState(false);
  const [feedbackSucesso, setFeedbackSucesso] = useState('');

  const navegarAposLogin = () => {
    if (navigation && typeof navigation.navigate === 'function') {
      try {
        navigation.navigate('Main');
      } catch {
        try {
          navigation.navigate('Home');
        } catch {
          // Mantém estado autenticado
        }
      }
    }
  };

  const validarFormulario = () => {
    let valido = true;
    setErroEmail('');
    setErroSenha('');

    if (!email.trim()) {
      setErroEmail('Por favor, informe seu e-mail.');
      valido = false;
    } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
      setErroEmail('Informe um e-mail válido (ex: maria@email.com).');
      valido = false;
    }

    if (!senha) {
      setErroSenha('Informe sua senha.');
      valido = false;
    } else if (senha.length < 4) {
      setErroSenha('A senha deve conter ao menos 4 caracteres.');
      valido = false;
    }

    return valido;
  };

  const handleLogin = async () => {
    if (!validarFormulario()) return;

    setLoadingLocal(true);
    const resultado = await login(email.trim(), senha);
    setLoadingLocal(false);

    if (resultado.success) {
      setFeedbackSucesso(`Bem-vindo(a) de volta!`);
      setTimeout(() => {
        setFeedbackSucesso('');
        navegarAposLogin();
      }, 700);
    } else {
      Alert.alert('Erro ao entrar', resultado.message || 'Verifique suas credenciais.');
    }
  };

  const handleLoginDemo = (tipo, nomeExibicao) => {
    loginComoDemo(tipo);
    setFeedbackSucesso(`Acessando como ${nomeExibicao}...`);
    setTimeout(() => {
      setFeedbackSucesso('');
      navegarAposLogin();
    }, 600);
  };

  const handleLoginGoogle = async () => {
    setLoadingLocal(true);
    try {
      await loginComGoogle();
      setFeedbackSucesso('Autenticado com Google com sucesso!');
      setTimeout(() => {
        setFeedbackSucesso('');
        navegarAposLogin();
      }, 600);
    } catch {
      Alert.alert('Falha', 'Não foi possível conectar com o Google no momento.');
    } finally {
      setLoadingLocal(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header com Logo e Identidade Aranduê */}
          <View style={styles.header}>
            <View style={styles.logoIconContainer}>
              <Ionicons name="sparkles" size={32} color="#FFFFFF" />
            </View>
            <Text style={styles.brandTitle}>Aranduê</Text>
            <Text style={styles.brandSubtitle}>Quadro de Diárias & Trabalho Autônomo</Text>

            {/* Selo ODS 8 da ONU */}
            <View style={styles.odsBadge}>
              <MaterialCommunityIcons name="earth" size={16} color="#0D9488" />
              <Text style={styles.odsBadgeText}>ODS 8 • Trabalho Decente & Remuneração Justa</Text>
            </View>
          </View>

          {/* Banner de Feedback de Sucesso */}
          {feedbackSucesso ? (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
              <Text style={styles.successBannerText}>{feedbackSucesso}</Text>
            </View>
          ) : null}

          {/* Card do Formulário de Acesso */}
          <View style={styles.cardForm}>
            <Text style={styles.formTitle}>Acesse sua conta</Text>
            <Text style={styles.formSubtitle}>Entre com suas credenciais ou escolha um perfil demo</Text>

            {/* Campo E-mail */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>E-mail</Text>
              <View style={[styles.inputWrapper, erroEmail ? styles.inputWrapperError : null]}>
                <Ionicons name="mail-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="exemplo@email.com"
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={(txt) => {
                    setEmail(txt);
                    if (erroEmail) setErroEmail('');
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                />
              </View>
              {erroEmail ? <Text style={styles.errorText}>{erroEmail}</Text> : null}
            </View>

            {/* Campo Senha */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Senha</Text>
              <View style={[styles.inputWrapper, erroSenha ? styles.inputWrapperError : null]}>
                <Ionicons name="lock-closed-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Sua senha secreta"
                  placeholderTextColor="#94A3B8"
                  value={senha}
                  onChangeText={(txt) => {
                    setSenha(txt);
                    if (erroSenha) setErroSenha('');
                  }}
                  secureTextEntry={!mostrarSenha}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setMostrarSenha(!mostrarSenha)}
                  style={styles.eyeButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={mostrarSenha ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>
              {erroSenha ? <Text style={styles.errorText}>{erroSenha}</Text> : null}
            </View>

            {/* Botão Entrar Principal */}
            <TouchableOpacity
              style={[styles.btnPrimary, (loadingLocal || carregando) && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={loadingLocal || carregando}
              activeOpacity={0.85}
            >
              {loadingLocal || carregando ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.btnPrimaryText}>Entrar na Plataforma</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </>
              )}
            </TouchableOpacity>

            {/* Divisor */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou continue com</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Botão Google OAuth Simulado */}
            <TouchableOpacity
              style={styles.btnGoogle}
              onPress={handleLoginGoogle}
              activeOpacity={0.8}
            >
              <FontAwesome5 name="google" size={18} color="#EA4335" style={{ marginRight: 10 }} />
              <Text style={styles.btnGoogleText}>Continuar com o Google</Text>
            </TouchableOpacity>
          </View>

          {/* SEÇÃO DESTACADA: Acesso Rápido para Demonstração */}
          <View style={styles.demoSection}>
            <View style={styles.demoHeader}>
              <View style={styles.demoHeaderIcon}>
                <Ionicons name="flash" size={18} color="#D97706" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.demoSectionTitle}>Acesso Rápido para Demonstração</Text>
                <Text style={styles.demoSectionSubtitle}>
                  Clique em um perfil para testar todas as funcionalidades instantaneamente:
                </Text>
              </View>
            </View>

            <View style={styles.demoCardsContainer}>
              {/* Card 1: Contratante */}
              <TouchableOpacity
                style={[styles.demoCard, styles.demoCardContratante]}
                onPress={() => handleLoginDemo('contratante', 'Carlos Silva (Contratante)')}
                activeOpacity={0.85}
              >
                <View style={[styles.demoCardIconBox, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="business" size={22} color="#2563EB" />
                </View>
                <View style={styles.demoCardInfo}>
                  <View style={styles.demoRoleBadgeRow}>
                    <Text style={styles.demoCardName}>Carlos Silva</Text>
                    <View style={[styles.badgeRole, { backgroundColor: '#DBEAFE' }]}>
                      <Text style={[styles.badgeRoleText, { color: '#1E40AF' }]}>Contratante</Text>
                    </View>
                  </View>
                  <Text style={styles.demoCardDesc}>
                    Publica vagas operacionais, avalia candidatos e contrata serviços
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
              </TouchableOpacity>

              {/* Card 2: Diarista */}
              <TouchableOpacity
                style={[styles.demoCard, styles.demoCardDiarista]}
                onPress={() => handleLoginDemo('diarista', 'Maria Santos (Diarista)')}
                activeOpacity={0.85}
              >
                <View style={[styles.demoCardIconBox, { backgroundColor: '#F0FDF4' }]}>
                  <Ionicons name="calendar-outline" size={22} color="#16A34A" />
                </View>
                <View style={styles.demoCardInfo}>
                  <View style={styles.demoRoleBadgeRow}>
                    <Text style={styles.demoCardName}>Maria Santos</Text>
                    <View style={[styles.badgeRole, { backgroundColor: '#DCFCE7' }]}>
                      <Text style={[styles.badgeRoleText, { color: '#15803D' }]}>Diarista</Text>
                    </View>
                  </View>
                  <Text style={styles.demoCardDesc}>
                    Gerencia agenda livre, visualiza vagas, candidata-se e edita currículo
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
              </TouchableOpacity>

              {/* Card 3: Ambos */}
              <TouchableOpacity
                style={[styles.demoCard, styles.demoCardAmbos]}
                onPress={() => handleLoginDemo('ambos', 'Ana Oliveira (Ambos)')}
                activeOpacity={0.85}
              >
                <View style={[styles.demoCardIconBox, { backgroundColor: '#EEF2FF' }]}>
                  <Ionicons name="repeat" size={22} color="#4F46E5" />
                </View>
                <View style={styles.demoCardInfo}>
                  <View style={styles.demoRoleBadgeRow}>
                    <Text style={styles.demoCardName}>Ana Oliveira</Text>
                    <View style={[styles.badgeRole, { backgroundColor: '#E0E7FF' }]}>
                      <Text style={[styles.badgeRoleText, { color: '#4338CA' }]}>Ambos</Text>
                    </View>
                  </View>
                  <Text style={styles.demoCardDesc}>
                    Perfil híbrido: publica demandas e também presta serviços autônomos
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Rodapé com compromisso ODS 8 */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Aranduê conecta empregadores e trabalhadores diretamente, sem cobrança de taxas predatórias.
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
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  logoIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  odsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#99F6E4',
  },
  odsBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F766E',
    marginLeft: 6,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  successBannerText: {
    fontSize: 14,
    color: '#15803D',
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  cardForm: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 22,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  formSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 3,
    marginBottom: 18,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputWrapperError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: '#0F172A',
  },
  eyeButton: {
    padding: 6,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 4,
    marginLeft: 4,
  },
  btnPrimary: {
    backgroundColor: '#2563EB',
    height: 50,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: 12,
    color: '#94A3B8',
    paddingHorizontal: 10,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  btnGoogle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    height: 48,
  },
  btnGoogleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  demoSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  demoHeaderIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  demoSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  demoSectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  demoCardsContainer: {
    gap: 10,
  },
  demoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  demoCardContratante: {
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
  },
  demoCardDiarista: {
    borderLeftWidth: 4,
    borderLeftColor: '#16A34A',
  },
  demoCardAmbos: {
    borderLeftWidth: 4,
    borderLeftColor: '#4F46E5',
  },
  demoCardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  demoCardInfo: {
    flex: 1,
  },
  demoRoleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  demoCardName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  badgeRole: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeRoleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  demoCardDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 3,
    lineHeight: 15,
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  footerText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 16,
  },
});
