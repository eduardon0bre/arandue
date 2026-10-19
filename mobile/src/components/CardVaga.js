import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../styles/theme';

/**
 * Mapeamento de cores de categoria
 */
const CATEGORY_COLORS = {
  'Faxina Residencial': { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', icon: 'sparkles-outline' },
  'Limpeza': { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', icon: 'sparkles-outline' },
  'Limpeza Comercial': { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0', icon: 'business-outline' },
  'Passadeira': { bg: '#FAF5FF', text: '#7E22CE', border: '#E9D5FF', icon: 'shirt-outline' },
  'Passadoria': { bg: '#FAF5FF', text: '#7E22CE', border: '#E9D5FF', icon: 'shirt-outline' },
  'Cozinha': { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA', icon: 'restaurant-outline' },
  'Eventos': { bg: '#FFF1F2', text: '#BE123C', border: '#FECDD3', icon: 'wine-outline' },
  'Cuidado': { bg: '#FDF2F8', text: '#BE185D', border: '#FBCFE8', icon: 'heart-outline' },
  'Construção': { bg: '#FEFCE8', text: '#A16207', border: '#FEF08A', icon: 'hammer-outline' },
  'Logística': { bg: '#F8FAFC', text: '#334155', border: '#CBD5E1', icon: 'cube-outline' },
  'Montagem': { bg: '#EEF2FF', text: '#4338CA', border: '#C7D2FE', icon: 'construct-outline' },
  'Outros': { bg: '#F1F5F9', text: '#475569', border: '#E2E8F0', icon: 'briefcase-outline' }
};

/**
 * Formata moeda BRL (ex: R$ 180,00)
 */
function formatarValor(valor) {
  const num = parseFloat(valor);
  if (isNaN(num)) return 'R$ 0,00';
  return `R$ ${num.toFixed(2).replace('.', ',')}`;
}

/**
 * Formata data ISO para DD/MM/AAAA
 */
function formatarData(dataStr) {
  if (!dataStr) return 'Data a combinar';
  try {
    const parts = dataStr.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  } catch {
    // fallback
  }
  return dataStr;
}

/**
 * Helper para badge de status
 */
function getStatusConfig(status) {
  const norm = String(status || 'aberta').toLowerCase();
  switch (norm) {
    case 'aberta':
      return { label: 'Aberta', bg: colors.primaryLight, text: colors.primaryDark, dot: colors.primary };
    case 'preenchida':
    case 'em andamento':
      return { label: 'Em andamento', bg: colors.warningLight, text: colors.warningText, dot: colors.warning };
    case 'concluida':
      return { label: 'Concluída', bg: colors.successLight, text: colors.successText, dot: colors.success };
    case 'cancelada':
      return { label: 'Cancelada', bg: colors.dangerLight, text: colors.dangerText, dot: colors.danger };
    default:
      return { label: status, bg: colors.surfaceAlt, text: colors.textSecondary, dot: colors.textMuted };
  }
}

export default function CardVaga({
  vaga,
  onPress,
  onCandidatar,
  mostrarBotaoCandidatura = true,
  textoBotaoAcao = 'Candidatar-se',
  desabilitarAcao = false,
  isDono = false
}) {
  if (!vaga) return null;

  const categoriaCfg = CATEGORY_COLORS[vaga.categoria] || CATEGORY_COLORS['Outros'];
  const statusCfg = getStatusConfig(vaga.status);
  const dataFormatada = formatarData(vaga.data_servico);
  const valorFormatado = formatarValor(vaga.valor_diaria);

  // Benefícios / badges adicionais
  const temAlimentacao = vaga.alimentacao_inclusa || vaga.alimentacao || false;
  const temTransporte = vaga.vale_transporte || vaga.transporte || false;

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={onPress}
      style={[styles.card, shadows.sm]}
    >
      {/* Topo do Card: Categoria e Status */}
      <View style={styles.header}>
        <View style={[styles.badgeCategoria, { backgroundColor: categoriaCfg.bg, borderColor: categoriaCfg.border }]}>
          <Ionicons name={categoriaCfg.icon} size={14} color={categoriaCfg.text} style={styles.badgeIcon} />
          <Text style={[styles.badgeCategoriaText, { color: categoriaCfg.text }]}>
            {vaga.categoria || 'Geral'}
          </Text>
        </View>

        <View style={[styles.badgeStatus, { backgroundColor: statusCfg.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: statusCfg.dot }]} />
          <Text style={[styles.statusText, { color: statusCfg.text }]}>
            {statusCfg.label}
          </Text>
        </View>
      </View>

      {/* Título da Vaga */}
      <Text style={styles.titulo} numberOfLines={2}>
        {vaga.titulo}
      </Text>

      {/* Descrição resumida */}
      {vaga.descricao ? (
        <Text style={styles.descricao} numberOfLines={2}>
          {vaga.descricao}
        </Text>
      ) : null}

      {/* Linha de Metadados: Localização e Data */}
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.metaText} numberOfLines={1}>
            {vaga.bairro || 'Local a combinar'}
          </Text>
        </View>

        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.metaText}>
            {dataFormatada}
          </Text>
        </View>
      </View>

      {/* Badges Adicionais (Benefícios) */}
      {(temAlimentacao || temTransporte) && (
        <View style={styles.beneficiosRow}>
          {temAlimentacao && (
            <View style={styles.badgeBeneficio}>
              <Ionicons name="restaurant-outline" size={12} color="#047857" />
              <Text style={styles.badgeBeneficioText}>Alimentação inclusa</Text>
            </View>
          )}
          {temTransporte && (
            <View style={styles.badgeBeneficio}>
              <Ionicons name="bus-outline" size={12} color="#047857" />
              <Text style={styles.badgeBeneficioText}>Ajuda de Transporte</Text>
            </View>
          )}
        </View>
      )}

      {/* Divisor */}
      <View style={styles.divider} />

      {/* Rodapé: Valor em Destaque e Ação */}
      <View style={styles.footer}>
        <View style={styles.valorContainer}>
          <Text style={styles.valorLabel}>Remuneração Líquida</Text>
          <Text style={styles.valorDestaque}>{valorFormatado}</Text>
        </View>

        {mostrarBotaoCandidatura && (
          <TouchableOpacity
            style={[
              styles.botaoAcao,
              desabilitarAcao && styles.botaoDesabilitado,
              isDono && styles.botaoDono
            ]}
            disabled={desabilitarAcao}
            activeOpacity={0.8}
            onPress={(e) => {
              if (onCandidatar) {
                onCandidatar(vaga);
              } else if (onPress) {
                onPress();
              }
            }}
          >
            <Text
              style={[
                styles.botaoAcaoText,
                isDono && styles.botaoDonoText,
                desabilitarAcao && styles.botaoDesabilitadoText
              ]}
            >
              {textoBotaoAcao}
            </Text>
            <Ionicons
              name={isDono ? "eye-outline" : "chevron-forward-outline"}
              size={15}
              color={isDono ? colors.primary : (desabilitarAcao ? colors.textMuted : '#FFFFFF')}
            />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeCategoria: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeIcon: {
    marginRight: 5,
  },
  badgeCategoriaText: {
    fontSize: 12,
    fontWeight: '700',
  },
  badgeStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  titulo: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 22,
    marginBottom: 6,
  },
  descricao: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 16,
    marginBottom: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  beneficiosRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  badgeBeneficio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#A7F3D0',
  },
  badgeBeneficioText: {
    fontSize: 11,
    color: '#065F46',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  valorContainer: {
    justifyContent: 'center',
  },
  valorLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  valorDestaque: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.success,
  },
  botaoAcao: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
  },
  botaoAcaoText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  botaoDono: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  botaoDonoText: {
    color: colors.primary,
  },
  botaoDesabilitado: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  botaoDesabilitadoText: {
    color: colors.textMuted,
  }
});
