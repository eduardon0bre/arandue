/**
 * Cores e padrões visuais do App Mobile Aranduê
 * Baseado no Design System oficial com alinhamento ao ODS 8
 */

export const colors = {
  primary: '#2563EB',         // Azul Aranduê
  primaryDark: '#1D4ED8',
  primaryLight: '#EFF6FF',
  secondary: '#4F46E5',       // Índigo
  secondaryLight: '#EEF2FF',
  
  success: '#16A34A',         // Verde Aprovação / Conclusão
  successLight: '#DCFCE7',
  successText: '#15803D',

  warning: '#D97706',         // Âmbar / Pendente
  warningLight: '#FEF3C7',
  warningText: '#B45309',

  danger: '#DC2626',          // Vermelho / Recusada
  dangerLight: '#FEE2E2',
  dangerText: '#B91C1C',

  background: '#F8FAFC',      // Fundo clean suave
  surface: '#FFFFFF',         // Cards e Modais
  surfaceAlt: '#F1F5F9',      // Badges neutros

  textPrimary: '#0F172A',     // Texto escuro de alto contraste
  textSecondary: '#64748B',   // Textos auxiliares e legendas
  textMuted: '#94A3B8',       // Placeholders e divisores suaves

  border: '#E2E8F0',          // Bordas sutis
  borderDark: '#CBD5E1',

  whatsapp: '#25D366',        // Verde oficial WhatsApp
  whatsappDark: '#128C7E',
  whatsappLight: '#DCFCE7',

  star: '#F59E0B'             // Dourado de estrelas
};

export const shadows = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  }
};

export default {
  colors,
  shadows
};
