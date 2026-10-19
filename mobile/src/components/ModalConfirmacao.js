import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Modal customizado reutilizável para confirmação de ações críticas no app
 *
 * @param {boolean} visible - Se o modal está aberto
 * @param {string} title - Título da confirmação
 * @param {string} mensagem - Texto explicativo do impacto da ação
 * @param {string} confirmText - Rótulo do botão principal de confirmação
 * @param {string} cancelText - Rótulo do botão de cancelamento
 * @param {function} onConfirm - Callback acionado ao confirmar
 * @param {function} onCancel - Callback acionado ao cancelar/fechar
 * @param {'danger' | 'primary' | 'success'} variant - Estilo de cor e semântica
 * @param {string} iconName - Nome do ícone Ionicons (opcional)
 */
export default function ModalConfirmacao({
  visible = false,
  title = 'Confirmar Ação',
  mensagem = 'Você tem certeza que deseja prosseguir com esta ação?',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  variant = 'primary',
  iconName,
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: iconName || 'alert-circle',
          iconColor: '#dc2626',
          iconBg: '#fee2e2',
          buttonBg: '#dc2626',
          buttonHover: '#b91c1c',
        };
      case 'success':
        return {
          icon: iconName || 'checkmark-circle',
          iconColor: '#16a34a',
          iconBg: '#dcfce7',
          buttonBg: '#16a34a',
          buttonHover: '#15803d',
        };
      case 'primary':
      default:
        return {
          icon: iconName || 'help-circle',
          iconColor: '#2563eb',
          iconBg: '#dbeafe',
          buttonBg: '#2563eb',
          buttonHover: '#1d4ed8',
        };
    }
  };

  const currentVariant = getVariantStyles();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.container}>
              {/* Ícone Semântico */}
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: currentVariant.iconBg },
                ]}
              >
                <Ionicons
                  name={currentVariant.icon}
                  size={32}
                  color={currentVariant.iconColor}
                />
              </View>

              {/* Título e Mensagem */}
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.mensagem}>{mensagem}</Text>

              {/* Botões de Ação */}
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={onCancel}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelButtonText}>{cancelText}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    { backgroundColor: currentVariant.buttonBg },
                  ]}
                  onPress={onConfirm}
                  activeOpacity={0.8}
                >
                  <Text style={styles.confirmButtonText}>{confirmText}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 8,
  },
  mensagem: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonGroup: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
});
