/**
 * Provedor Plugável de Notificações Push Mobile
 * Suporte a Expo Push API (React Native / Expo) ou Simulação.
 */

function isValidExpoPushToken(token) {
  if (!token || typeof token !== 'string') return false;
  return /^(ExponentPushToken|ExpoPushToken)\[.*\]$/.test(token.trim());
}

const pushProvider = {
  /**
   * Envia notificação push via Expo Push API ou executa simulação segura.
   * @param {Object} params
   * @param {string} params.pushToken - Token Expo Push do dispositivo
   * @param {string} params.title - Título do push
   * @param {string} params.body - Conteúdo do push
   * @param {Object} [params.data] - Dados adicionais (payload)
   * @returns {Promise<{ success: boolean, simulated?: boolean, provider: string, error?: string }>}
   */
  async sendPushNotification({ pushToken, title, body, data = {} }) {
    const isMock = process.env.PUSH_PROVIDER === 'mock';
    const valid = isValidExpoPushToken(pushToken);

    // Se não for um token válido ou se o provedor for expressamente mock, simula com segurança
    if (isMock || !valid) {
      console.log(`🔔 [Push SIMULAÇÃO] Token: ${pushToken || 'Nenhum token registrado'} | Título: "${title}" | Mensagem: "${body}"`);
      return {
        success: true,
        simulated: true,
        provider: 'expo-mock',
        pushToken: pushToken || null
      };
    }

    try {
      const endpoint = 'https://exp.host/--/api/v2/push/send';
      const payload = {
        to: pushToken.trim(),
        title,
        body,
        data,
        sound: 'default',
        priority: 'high'
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const resData = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(resData?.errors?.[0]?.message || `Expo Push API HTTP error ${response.status}`);
      }

      // Verifica status de entrega na resposta do Expo
      const ticket = resData.data;
      if (ticket && ticket.status === 'error') {
        throw new Error(ticket.message || ticket.details?.error || 'Erro no envio do push');
      }

      return {
        success: true,
        provider: 'expo',
        ticketId: ticket?.id
      };
    } catch (error) {
      console.error('❌ [Push ERRO] Falha ao enviar notificação Expo:', error.message);
      return {
        success: false,
        simulated: false,
        provider: 'expo',
        error: error.message
      };
    }
  }
};

module.exports = pushProvider;
