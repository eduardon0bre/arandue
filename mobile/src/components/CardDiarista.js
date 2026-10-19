import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../styles/theme';

/**
 * Gera iniciais do nome para avatar estilizado caso não haja foto
 */
function getIniciais(nome) {
  if (!nome) return 'D';
  const parts = nome.trim().split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Cores de avatar de acordo com o hash do nome para variar elegantemente
 */
const AVATAR_COLORS = [
  { bg: '#DBEAFE', text: '#1E40AF' },
  { bg: '#E0E7FF', text: '#3730A3' },
  { bg: '#DCFCE7', text: '#166534' },
  { bg: '#FEF3C7', text: '#92400E' },
  { bg: '#FCE7F3', text: '#9D174D' },
  { bg: '#F3E8FF', text: '#6B21A8' }
];

function getAvatarColor(nome = '') {
  let hash = 0;
  for (let i = 0; i < nome.length; i++) {
    hash = (hash << 5) - hash + nome.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

/**
 * Normaliza lista de serviços/especialidades
 */
function normalizarServicos(servicos) {
  if (!servicos) return ['Diarista Geral'];
  if (Array.isArray(servicos)) return servicos;
  if (typeof servicos === 'string') {
    try {
      const parsed = JSON.parse(servicos);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return servicos.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }
  return ['Diarista Geral'];
}

export default function CardDiarista({
  diarista,
  onVerCurriculo,
  onVerAgenda,
  onContratar,
  onPress
}) {
  if (!diarista) return null;

  const nome = diarista.nome || 'Profissional Aranduê';
  const fotoUrl = diarista.foto_url;
  const iniciais = getIniciais(nome);
  const avatarCor = getAvatarColor(nome);

  const notaMedia = parseFloat(diarista.media_avaliacoes || diarista.nota_media || 5.0).toFixed(1);
  const totalAvaliacoes = diarista.total_avaliacoes || diarista.qtd_avaliacoes || 0;

  const servicos = normalizarServicos(diarista.servicos || diarista.diarista_servicos);
  const bairro = diarista.bairro || diarista.regioes || 'São Paulo, SP';
  const valorBase = diarista.valor_base || diarista.valor_diaria;

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={onPress || onVerCurriculo}
      style={[styles.card, shadows.sm]}
    >
      {/* Topo: Avatar, Nome, Bairro e Nota */}
      <View style={styles.topRow}>
        {/* Avatar */}
        {fotoUrl ? (
          <Image source={{ uri: fotoUrl }} style={styles.avatarImage} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: avatarCor.bg }]}>
            <Text style={[styles.avatarIniciais, { color: avatarCor.text }]}>
              {iniciais}
            </Text>
          </View>
        )}

        {/* Informações Centrais */}
        <View style={styles.infoCentral}>
          <View style={styles.nomeRow}>
            <Text style={styles.nome} numberOfLines={1}>
              {nome}
            </Text>
            {diarista.verificado !== false && (
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} style={styles.checkIcon} />
            )}
          </View>

          <View style={styles.localRow}>
            <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
            <Text style={styles.bairroText} numberOfLines={1}>
              {bairro}
            </Text>
          </View>

          {/* Avaliação em estrelas */}
          <View style={styles.avaliacaoRow}>
            <Ionicons name="star" size={14} color={colors.star} />
            <Text style={styles.notaText}>{notaMedia}</Text>
            <Text style={styles.totalAvaliacoesText}>
              ({totalAvaliacoes} {totalAvaliacoes === 1 ? 'avaliação' : 'avaliações'})
            </Text>
          </View>
        </View>

        {/* Valor base opcional no canto direito */}
        {valorBase ? (
          <View style={styles.precoContainer}>
            <Text style={styles.precoLabel}>Diária base</Text>
            <Text style={styles.precoValor}>R$ {parseFloat(valorBase).toFixed(0)}</Text>
          </View>
        ) : null}
      </View>

      {/* Bio curta se disponível */}
      {diarista.bio ? (
        <Text style={styles.bioText} numberOfLines={2}>
          {diarista.bio}
        </Text>
      ) : null}

      {/* Tags de Especialidades */}
      <View style={styles.chipsContainer}>
        {servicos.slice(0, 3).map((servico, idx) => (
          <View key={`${servico}-${idx}`} style={styles.chip}>
            <Text style={styles.chipText} numberOfLines={1}>
              {servico}
            </Text>
          </View>
        ))}
        {servicos.length > 3 && (
          <View style={[styles.chip, styles.chipExtra]}>
            <Text style={styles.chipExtraText}>+{servicos.length - 3}</Text>
          </View>
        )}
      </View>

      {/* Divisor */}
      <View style={styles.divider} />

      {/* Botões de Ação */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.btnSecundario}
          onPress={() => onVerCurriculo && onVerCurriculo(diarista)}
          activeOpacity={0.8}
        >
          <Ionicons name="document-text-outline" size={15} color={colors.primary} />
          <Text style={styles.btnSecundarioText}>Ver Currículo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnSecundario}
          onPress={() => onVerAgenda && onVerAgenda(diarista)}
          activeOpacity={0.8}
        >
          <Ionicons name="calendar-outline" size={15} color={colors.secondary} />
          <Text style={[styles.btnSecundarioText, { color: colors.secondary }]}>
            Ver Agenda
          </Text>
        </TouchableOpacity>

        {onContratar && (
          <TouchableOpacity
            style={styles.btnPrimario}
            onPress={() => onContratar(diarista)}
            activeOpacity={0.8}
          >
            <Text style={styles.btnPrimarioText}>Convidar</Text>
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 12,
    backgroundColor: colors.surfaceAlt,
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIniciais: {
    fontSize: 18,
    fontWeight: '800',
  },
  infoCentral: {
    flex: 1,
  },
  nomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nome: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginRight: 4,
  },
  checkIcon: {
    marginTop: 1,
  },
  localRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  bairroText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  avaliacaoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  notaText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  totalAvaliacoesText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  precoContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingLeft: 8,
  },
  precoLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  precoValor: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.success,
  },
  bioText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  chip: {
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  chipText: {
    fontSize: 11,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  chipExtra: {
    backgroundColor: colors.primaryLight,
    borderColor: '#BFDBFE',
  },
  chipExtraText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
  },
  btnSecundario: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnSecundarioText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  btnPrimario: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimarioText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  }
});
