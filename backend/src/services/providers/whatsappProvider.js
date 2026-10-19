/**
 * Provedor Plugável de Notificações WhatsApp
 * Suporte à biblioteca oficial `twilio`, Meta WhatsApp Cloud API oficial ou Simulação (wa.me).
 */
const twilio = require('twilio');

function normalizarTelefone(telefone) {
  if (!telefone) return '';
  const limpo = String(telefone).replace(/\D/g, '');
  if (!limpo) return '';
  // Se for celular do Brasil sem DDI 55 (10 ou 11 dígitos), prefixa com 55
  if ((limpo.length === 10 || limpo.length === 11) && !limpo.startsWith('55')) {
    return `55${limpo}`;
  }
  return limpo;
}

async function sendTwilio({ accountSid, authToken, from, to, message }) {
  const cleanPhone = normalizarTelefone(to);
  const formattedFrom = from.startsWith('whatsapp:') ? from : `whatsapp:${from}`;
  const formattedTo = `whatsapp:+${cleanPhone}`;

  const client = twilio(accountSid, authToken);
  const resData = await client.messages.create({
    from: formattedFrom,
    to: formattedTo,
    body: message
  });

  return {
    success: true,
    simulated: false,
    messageId: resData.sid,
    provider: 'twilio',
    to: cleanPhone
  };
}

async function sendMetaCloudApi({ token, phoneNumberId, to, message }) {
  const cleanPhone = normalizarTelefone(to);
  const endpoint = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: cleanPhone,
      type: 'text',
      text: { body: message }
    })
  });

  const resData = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(resData.error?.message || `Meta Cloud API HTTP error ${response.status}`);
  }

  return {
    success: true,
    simulated: false,
    messageId: resData.messages?.[0]?.id,
    provider: 'meta-cloud',
    to: cleanPhone
  };
}

const whatsappProvider = {
  /**
   * Envia mensagem WhatsApp para o destinatário via `twilio`, `meta` ou modo simulação.
   * @param {Object} params
   * @param {string} params.to - Número de telefone do destinatário
   * @param {string} params.message - Mensagem de texto a ser enviada
   */
  async sendWhatsApp({ to, message }) {
    const provider = (process.env.WHATSAPP_PROVIDER || 'mock').toLowerCase();
    const cleanTo = normalizarTelefone(to);
    const whatsappWebUrl = cleanTo
      ? `https://wa.me/${cleanTo}?text=${encodeURIComponent(message)}`
      : null;

    try {
      if (provider === 'twilio') {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const from = process.env.TWILIO_WHATSAPP_FROM || '+14155238886';

        if (accountSid && authToken && from && cleanTo) {
          const res = await sendTwilio({ accountSid, authToken, from, to: cleanTo, message });
          return { ...res, whatsappWebUrl };
        }
        console.warn('[WhatsApp] Provedor Twilio selecionado, mas credenciais incompletas. Usando modo simulação.');
      } else if (provider === 'meta') {
        const token = process.env.WHATSAPP_META_TOKEN;
        const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

        if (token && phoneNumberId && cleanTo) {
          const res = await sendMetaCloudApi({ token, phoneNumberId, to: cleanTo, message });
          return { ...res, whatsappWebUrl };
        }
        console.warn('[WhatsApp] Provedor Meta Cloud selecionado, mas credenciais incompletas. Usando modo simulação.');
      }

      // Modo Simulação (Fallback ou Provedor 'mock')
      console.log(`📱 [WhatsApp SIMULAÇÃO] Destino: ${cleanTo || to || 'N/A'} | Mensagem: "${message}"`);
      return {
        success: true,
        simulated: true,
        provider: provider === 'mock' ? 'mock' : 'simulated',
        to: cleanTo || to,
        whatsappWebUrl
      };
    } catch (error) {
      console.error(`❌ [WhatsApp ERRO] Provedor (${provider}):`, error.message);
      return {
        success: false,
        simulated: false,
        provider,
        to: cleanTo || to,
        whatsappWebUrl,
        error: error.message
      };
    }
  }
};

module.exports = whatsappProvider;
