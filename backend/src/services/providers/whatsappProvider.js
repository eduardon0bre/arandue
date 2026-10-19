/**
 * Provedor de Direcionamento WhatsApp (wa.me)
 * Gera o link direto de redirecionamento para o WhatsApp com a mensagem formatada,
 * respeitando a preferência notif_whatsapp do usuário.
 */

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

const whatsappProvider = {
  /**
   * Gera o direcionamento WhatsApp (wa.me) para o destinatário.
   * @param {Object} params
   * @param {string} params.to - Número de telefone do destinatário
   * @param {string} params.message - Mensagem de texto a ser enviada
   */
  async sendWhatsApp({ to, message }) {
    const cleanTo = normalizarTelefone(to);
    const whatsappWebUrl = cleanTo
      ? `https://wa.me/${cleanTo}?text=${encodeURIComponent(message)}`
      : null;

    console.log(`📱 [WhatsApp Direcionamento] Destino: ${cleanTo || to || 'N/A'} | Link: ${whatsappWebUrl || 'N/A'}`);

    return {
      success: true,
      simulated: true,
      provider: 'wa.me',
      to: cleanTo || to,
      whatsappWebUrl
    };
  }
};

module.exports = whatsappProvider;
