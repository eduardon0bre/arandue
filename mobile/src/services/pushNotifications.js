import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { api } from './api';

// Configuração do comportamento da notificação quando recebida em primeiro plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Solicita permissões e obtém o Expo Push Token do dispositivo
 * Possui fallback gracioso para Web, Emuladores e Expo Go
 */
export async function registerForPushNotificationsAsync() {
  let token = null;

  try {
    // Configura canal de notificação específico para Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Aranduê Notificações',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2563EB',
        sound: 'default',
      });
    }

    // Se estiver em ambiente Web ou emulador sem suporte a push nativo
    if (Platform.OS === 'web') {
      console.log('[Push] Ambiente Web detectado. Push nativo emulado.');
      return 'ExpoPushToken[web-mock-token]';
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[Push] Permissão para receber notificações push não foi concedida.');
      return null;
    }

    // Identificador do projeto Expo (necessário no SDK 50+)
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ||
      Constants?.easConfig?.projectId ||
      'arandue-mobile-project';

    const tokenResponse = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    token = tokenResponse.data;
    console.log('[Push] Expo Push Token obtido com sucesso:', token);
  } catch (error) {
    console.warn('[Push] Não foi possível registrar push token nativo (ambiente simulado ou Expo Go):', error.message);
    token = 'ExpoPushToken[dev-simulator-token]';
  }

  return token;
}

/**
 * Envia o push token para o backend associando ao usuário atual
 */
export async function registrarTokenNoBackend(token, usuarioId) {
  if (!token) return { success: false, reason: 'Nenhum token fornecido' };

  try {
    const payload = {
      token,
      usuario_id: usuarioId,
      plataforma: Platform.OS,
      dispositivo: `${Platform.OS.toUpperCase()} Device`,
      timestamp: new Date().toISOString()
    };

    const response = await api.post('/notificacoes/push-token', payload);
    return response.data;
  } catch (error) {
    console.warn('[Push] Erro ao sincronizar token com backend (operando em modo offline):', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Dispara uma notificação local no dispositivo
 */
export async function scheduleLocalNotification({ title, body, data = {} }) {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: title || 'Aranduê',
        body: body || 'Você tem uma atualização na sua conta.',
        data,
        sound: 'default',
      },
      trigger: null, // Disparo imediato
    });
    return notificationId;
  } catch (error) {
    console.warn('[Push] Erro ao disparar notificação local:', error.message);
    return null;
  }
}

export default {
  registerForPushNotificationsAsync,
  registrarTokenNoBackend,
  scheduleLocalNotification,
};
