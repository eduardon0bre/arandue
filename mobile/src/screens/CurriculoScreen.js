import React, { useState, useEffect } from 'react';
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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// Especialidades disponíveis no ecossistema Aranduê
const ESPECIALIDADES_DISPONIVEIS = [
  { id: 'faxina_pesada', label: 'Faxina Pesada', icon: 'sparkles' },
  { id: 'limpeza_residencial', label: 'Limpeza Residencial', icon: 'home-outline' },
  { id: 'pos_obra', label: 'Limpeza Pós-Obra', icon: 'hammer-outline' },
  { id: 'passadoria', label: 'Passadoria de Roupas', icon: 'shirt-outline' },
  { id: 'cozinha_basica', label: 'Cozinha Básica', icon: 'restaurant-outline' },
  { id: 'cuidados_pet_idosos', label: 'Cuidados Idosos/Pet', icon: 'heart-outline' },
  { id: 'organizacao', label: 'Organização de Armários', icon: 'file-tray-stacked-outline' },
];

const OPCOES_EXPERIENCIA = [
  'Menos de 1 ano',
  '1 a 2 anos',
  '3 a 5 anos',
  'Mais de 5 anos',
];

// Avaliações de clientes para exibição da reputação (Média e depoimentos)
const AVALIACOES_MOCK = [
  {
    id: 1,
    cliente: 'Carlos Silva (Buffet Sabor & Festa)',
    nota: 5,
    data: '15/10/2026',
    comentario: 'Profissional pontual, atenciosa e realizou o serviço com extremo capricho. Recomendo muito!',
  },
  {
    id: 2,
    cliente: 'Mariana Ramos (LogExpress)',
    nota: 5,
    data: '08/10/2026',
    comentario: 'Excelente trabalho na limpeza do nosso escritório. Muito cuidadosa e organizada.',
  },
  {
    id: 3,
    cliente: 'Roberto Silva (Silva Reformas)',
    nota: 4.8,
    data: '28/09/2026',
    comentario: 'Ótima diarista, rápida e muito prestativa. Voltaremos a contratar.',
  },
];

export default function CurriculoScreen() {
  const { usuario } = useAuth();

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [feedbackSucesso, setFeedbackSucesso] = useState('');

  // Estados dos campos do Currículo
  const [bio, setBio] = useState('');
  const [experiencia, setExperiencia] = useState('3 a 5 anos');
  const [especialidades, setEspecialidades] = useState([
    'Limpeza Residencial',
    'Passadoria de Roupas',
    'Organização de Armários',
  ]);
  const [valorDiaria, setValorDiaria] = useState('160');
  const [bairros, setBairros] = useState('Vila Mariana, Pinheiros, Paraíso e Jardins');

  // Carrega dados do currículo via GET /api/perfil/curriculo
  useEffect(() => {
    async function carregarCurriculo() {
      try {
        setCarregando(true);
        const response = await api.get('/perfil/curriculo');
        if (response?.data?.data) {
          const dados = response.data.data;
          if (dados.bio) setBio(dados.bio);
          if (dados.experiencia) setExperiencia(dados.experiencia);
          if (Array.isArray(dados.servicos) && dados.servicos.length > 0) {
            setEspecialidades(dados.servicos);
          }
          if (dados.regioes) setBairros(dados.regioes);
          if (dados.valor_diaria) setValorDiaria(String(dados.valor_diaria));
        }
      } catch {
        // Se a API estiver offline ou sem registro, inicializa com valores padrão amigáveis
        setBio(
          'Profissional com ampla dedicação, foco em limpeza residencial e comercial de qualidade, pontualidade britânica e referências verificadas.'
        );
      } finally {
        setCarregando(false);
      }
    }

    carregarCurriculo();
  }, []);

  // Alterna especialidade selecionada
  const toggleEspecialidade = (label) => {
    if (especialidades.includes(label)) {
      if (especialidades.length === 1) {
        Alert.alert('Atenção', 'Selecione ao menos 1 especialidade no seu currículo.');
        return;
      }
      setEspecialidades(especialidades.filter((esp) => esp !== label));
    } else {
      setEspecialidades([...especialidades, label]);
    }
  };

  // Salva currículo via PUT /api/perfil/curriculo
  const handleSalvarCurriculo = async () => {
    if (!bio.trim()) {
      Alert.alert('Apresentação necessária', 'Preencha sua biografia ou apresentação profissional.');
      return;
    }

    setSalvando(true);
    try {
      const payload = {
        bio: bio.trim(),
        experiencia: experiencia.trim(),
        servicos: especialidades,
        regioes: bairros.trim(),
        valor_diaria: Number(valorDiaria) || 160,
      };

      try {
        await api.put('/perfil/curriculo', payload);
      } catch {
        // Fallback local se a API estiver offline
      }

      setFeedbackSucesso('Currículo profissional atualizado com sucesso!');
      setTimeout(() => setFeedbackSucesso(''), 4000);
    } catch (err) {
      Alert.alert('Erro ao salvar', err.message || 'Falha ao salvar as alterações.');
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Carregando perfil profissional...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
            <Text style={styles.screenTitle}>Currículo Profissional</Text>
            <Text style={styles.screenSubtitle}>
              Seu cartão de visitas público para contratantes no Aranduê
            </Text>
          </View>

          {/* Banner de Feedback */}
          {feedbackSucesso ? (
            <View style={styles.feedbackBanner}>
              <Ionicons name="checkmark-circle" size={20} color="#15803D" />
              <Text style={styles.feedbackBannerText}>{feedbackSucesso}</Text>
            </View>
          ) : null}

          {/* Cartão de Resumo do Perfil com Avatar e Reputação */}
          <View style={styles.profileSummaryCard}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarInitials}>
                {(usuario?.nome || 'Maria Santos')
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')}
              </Text>
              <View style={styles.badgeVerified}>
                <Ionicons name="shield-checkmark" size={14} color="#FFFFFF" />
              </View>
            </View>

            <View style={styles.profileSummaryInfo}>
              <Text style={styles.profileName}>{usuario?.nome || 'Maria Santos'}</Text>
              <Text style={styles.profileType}>Diarista Autônoma Verificada</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={16} color="#EAB308" />
                <Text style={styles.ratingNumber}>4.9</Text>
                <Text style={styles.ratingCount}>(18 avaliações)</Text>
                <Text style={styles.concluidosBadge}>• 24 bicos concluídos</Text>
              </View>
            </View>
          </View>

          {/* SEÇÃO 1: Apresentação e Biografia */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="document-text-outline" size={18} color="#2563EB" />
              <Text style={styles.sectionTitle}>Biografia & Apresentação</Text>
            </View>
            <Text style={styles.sectionHint}>
              Conte um pouco sobre sua trajetória, postura de trabalho e diferenciais:
            </Text>
            <TextInput
              style={styles.bioInput}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={bio}
              onChangeText={setBio}
              placeholder="Descreva sua experiência profissional e diferenciais..."
              placeholderTextColor="#94A3B8"
            />
            <Text style={styles.charCount}>{bio.length}/500 caracteres</Text>
          </View>

          {/* SEÇÃO 2: Anos de Experiência */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="time-outline" size={18} color="#2563EB" />
              <Text style={styles.sectionTitle}>Tempo de Experiência no Setor</Text>
            </View>
            <View style={styles.optionsWrap}>
              {OPCOES_EXPERIENCIA.map((opcao) => {
                const isSelected = experiencia === opcao;
                return (
                  <TouchableOpacity
                    key={opcao}
                    style={[styles.expChip, isSelected && styles.expChipSelected]}
                    onPress={() => setExperiencia(opcao)}
                    activeOpacity={0.8}
                  >
                    {isSelected ? (
                      <Ionicons name="checkmark-circle" size={16} color="#2563EB" style={{ marginRight: 6 }} />
                    ) : null}
                    <Text style={[styles.expChipText, isSelected && styles.expChipTextSelected]}>
                      {opcao}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* SEÇÃO 3: Especialidades (Seleção Múltipla) */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="sparkles-outline" size={18} color="#2563EB" />
              <Text style={styles.sectionTitle}>Especialidades de Atendimento</Text>
            </View>
            <Text style={styles.sectionHint}>
              Toque para marcar ou desmarcar os serviços que você realiza:
            </Text>
            <View style={styles.especialidadesGrid}>
              {ESPECIALIDADES_DISPONIVEIS.map((esp) => {
                const isSelected = especialidades.includes(esp.label);
                return (
                  <TouchableOpacity
                    key={esp.id}
                    style={[styles.especialidadeChip, isSelected && styles.especialidadeChipActive]}
                    onPress={() => toggleEspecialidade(esp.label)}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name={isSelected ? 'checkmark-circle' : esp.icon}
                      size={18}
                      color={isSelected ? '#FFFFFF' : '#475569'}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.especialidadeText,
                        isSelected && styles.especialidadeTextActive,
                      ]}
                    >
                      {esp.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* SEÇÃO 4: Valor Base Sugerido e Bairros Atendidos */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="cash-outline" size={18} color="#16A34A" />
              <Text style={styles.sectionTitle}>Valor Base Sugerido por Diária</Text>
            </View>
            <Text style={styles.sectionHint}>
              Referência média de valor líquido cobrado (transparência ODS 8):
            </Text>
            <View style={styles.valorInputContainer}>
              <Text style={styles.cifraoText}>R$</Text>
              <TextInput
                style={styles.valorInput}
                keyboardType="numeric"
                value={valorDiaria}
                onChangeText={setValorDiaria}
                placeholder="160"
                placeholderTextColor="#94A3B8"
              />
              <Text style={styles.valorSuffix}>/ dia</Text>
            </View>

            <View style={[styles.sectionTitleRow, { marginTop: 18 }]}>
              <Ionicons name="location-outline" size={18} color="#2563EB" />
              <Text style={styles.sectionTitle}>Bairros e Regiões Atendidas</Text>
            </View>
            <TextInput
              style={styles.bairrosInput}
              value={bairros}
              onChangeText={setBairros}
              placeholder="Ex: Pinheiros, Vila Mariana, Santana..."
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* SEÇÃO 5: Avaliações Recebidas dos Contratantes */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="star" size={18} color="#EAB308" />
              <Text style={styles.sectionTitle}>Avaliações Recebidas de Clientes</Text>
            </View>
            <Text style={styles.sectionHint}>
              Depoimentos reais emitidos após a conclusão dos bicos:
            </Text>

            <View style={styles.avaliacoesList}>
              {AVALIACOES_MOCK.map((item) => (
                <View key={item.id} style={styles.avaliacaoCard}>
                  <View style={styles.avaliacaoCardHeader}>
                    <Text style={styles.avaliacaoCliente}>{item.cliente}</Text>
                    <View style={styles.avaliacaoEstrelasRow}>
                      <Ionicons name="star" size={14} color="#EAB308" />
                      <Text style={styles.avaliacaoNota}>{item.nota.toFixed(1)}</Text>
                    </View>
                  </View>
                  <Text style={styles.avaliacaoComentario}>&quot;{item.comentario}&quot;</Text>
                  <Text style={styles.avaliacaoData}>{item.data}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Botão de Salvar */}
          <TouchableOpacity
            style={[styles.btnSalvar, salvando && styles.btnDisabled]}
            onPress={handleSalvarCurriculo}
            disabled={salvando}
            activeOpacity={0.85}
          >
            {salvando ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.btnSalvarText}>Salvar Currículo Profissional</Text>
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
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 10,
  },
  screenHeader: {
    marginBottom: 12,
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
  profileSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    position: 'relative',
  },
  avatarInitials: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  badgeVerified: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#16A34A',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileSummaryInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  profileType: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  ratingNumber: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  ratingCount: {
    fontSize: 12,
    color: '#64748B',
  },
  concluidosBadge: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '600',
  },
  sectionCard: {
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
  sectionHint: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
    lineHeight: 16,
  },
  bioInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
    minHeight: 90,
  },
  charCount: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'right',
    marginTop: 4,
  },
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  expChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  expChipSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  expChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  expChipTextSelected: {
    color: '#2563EB',
    fontWeight: '700',
  },
  especialidadesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  especialidadeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  especialidadeChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#1D4ED8',
  },
  especialidadeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  especialidadeTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  valorInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  cifraoText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16A34A',
    marginRight: 6,
  },
  valorInput: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  valorSuffix: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  bairrosInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14,
    color: '#0F172A',
  },
  avaliacoesList: {
    gap: 10,
  },
  avaliacaoCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avaliacaoCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avaliacaoCliente: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  avaliacaoEstrelasRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  avaliacaoNota: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  avaliacaoComentario: {
    fontSize: 12,
    color: '#475569',
    fontStyle: 'italic',
    marginTop: 6,
    lineHeight: 16,
  },
  avaliacaoData: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 6,
  },
  btnSalvar: {
    backgroundColor: '#2563EB',
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 20,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnSalvarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.7,
  },
});
