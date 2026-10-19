/**
 * Provedor Plugável de Notificações WhatsApp
 * Suporte à biblioteca oficial `twilio`, CallMeBot (API gratuita para projetos acadêmicos), Z-API ou Simulação.
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

async function sendCallMeBot({ apiKey, to, message }) {
  const cleanPhone = normalizarTelefone(process.env.CALLMEBOT_PHONE || to);
  const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(cleanPhone)}&text=${encodeURIComponent(
    message
  )}&apikey=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, { method: 'GET' });
  const textResp = await response.text().catch(() => '');
  if (!response.ok) {
    throw new Error(textResp || `CallMeBot HTTP error ${response.status}`);
  }

  return {
    success: true,
    simulated: false,
    provider: 'callmebot',
    to: cleanPhone,
    response: textResp.slice(0, 120)
  };
}

async function sendZApi({ instanceId, token, clientToken, to, message }) {
  const cleanPhone = normalizarTelefone(to);
  const endpoint = `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`;

  const headers = {
    'Content-Type': 'application/json'
  };
  if (clientToken) {
    headers['Client-Token'] = clientToken;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      phone: cleanPhone,
      message
    })
  });

  const resData = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(resData.message || resData.error || `Z-API HTTP error ${response.status}`);
  }

  return {
    success: true,
    simulated: false,
    messageId: resData.zaapId || resData.messageId,
    provider: 'zapi',
    to: cleanPhone
  };
}

const whatsappProvider = {
  /**
   * Envia mensagem WhatsApp para o destinatário via `twilio`, `callmebot`, `zapi` ou modo simulação.
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
      } else if (provider === 'callmebot') {
        const apiKey = process.env.CALLMEBOT_API_KEY;
        if (apiKey && (cleanTo || process.env.CALLMEBOT_PHONE)) {
          const res = await sendCallMeBot({ apiKey, to: cleanTo, message });
          return { ...res, whatsappWebUrl };
        }
        console.warn('[WhatsApp] Provedor CallMeBot selecionado, mas CALLMEBOT_API_KEY ausente. Usando modo simulação.');
      } else if (provider === 'zapi') {
        const instanceId = process.env.ZAPI_INSTANCE_ID;
        const token = process.env.ZAPI_TOKEN;
        const clientToken = process.env.ZAPI_CLIENT_TOKEN;

        if (instanceId && token && cleanTo) {
          const res = await sendZApi({ instanceId, token, clientToken, to: cleanTo, message });
          return { ...res, whatsappWebUrl };
        }
        console.warn('[WhatsApp] Provedor Z-API selecionado, mas credenciais incompletas. Usando modo simulação.');
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
