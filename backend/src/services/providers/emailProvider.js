/**
 * Provedor Plugável de Notificações por E-mail
 * Suporte a Resend, SendGrid ou Simulação (Mock).
 */

function buildEmailHtml({ titulo, mensagem, destinatarioNome }) {
  const nomeExibicao = destinatarioNome ? `Olá, <strong>${destinatarioNome}</strong>!` : 'Olá!';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titulo}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #F4F6F8;
      margin: 0;
      padding: 24px 12px;
      color: #1E293B;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      max-width: 580px;
      margin: 0 auto;
      background: #FFFFFF;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      border: 1px solid #E2E8F0;
    }
    .header {
      background: linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%);
      padding: 32px 24px;
      text-align: center;
      color: #FFFFFF;
    }
    .header h1 {
      margin: 0;
      font-size: 26px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .header p {
      margin: 6px 0 0;
      font-size: 13px;
      color: #D8F3DC;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .content-area {
      padding: 32px 28px;
    }
    .greeting {
      font-size: 16px;
      color: #1B4332;
      margin-bottom: 12px;
    }
    .badge {
      display: inline-block;
      background-color: #E8F5E9;
      color: #2D6A4F;
      font-size: 12px;
      font-weight: 600;
      padding: 4px 12px;
      border-radius: 20px;
      text-transform: uppercase;
      margin-bottom: 16px;
    }
    .title {
      font-size: 20px;
      font-weight: 700;
      color: #0F172A;
      margin: 0 0 16px 0;
      line-height: 1.3;
    }
    .message {
      font-size: 15px;
      line-height: 1.6;
      color: #334155;
      margin: 0 0 24px 0;
      white-space: pre-line;
      background-color: #F8FAFC;
      padding: 16px;
      border-radius: 8px;
      border-left: 4px solid #2D6A4F;
    }
    .footer {
      background: #F8FAFC;
      padding: 24px 20px;
      text-align: center;
      font-size: 12px;
      color: #64748B;
      border-top: 1px solid #E2E8F0;
    }
    .ods-tag {
      display: inline-block;
      background: #A21942;
      color: #FFFFFF;
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      margin-bottom: 10px;
    }
    .footer-links {
      margin-top: 8px;
      color: #94A3B8;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>Aranduê</h1>
      <p>Quadro de Diárias e Bicos</p>
    </div>
    <div class="content-area">
      <div class="greeting">${nomeExibicao}</div>
      <div class="badge">Notificação da Plataforma</div>
      <h2 class="title">${titulo}</h2>
      <div class="message">${mensagem}</div>
    </div>
    <div class="footer">
      <div>
        <span class="ods-tag">ODS 8 &bull; Trabalho Decente</span>
      </div>
      <p>Você recebeu esta notificação conforme as suas preferências de comunicação no Aranduê.</p>
      <div class="footer-links">
        Aranduê &copy; ${new Date().getFullYear()} &bull; Conectando pessoas e oportunidades com dignidade.
      </div>
    </div>
  </div>
</body>
</html>`;
}

async function sendResend({ apiKey, from, to, subject, html }) {
  const endpoint = 'https://api.resend.com/emails';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html
    })
  });

  const resData = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(resData.message || `Resend HTTP error ${response.status}`);
  }

  return { success: true, messageId: resData.id, provider: 'resend' };
}

async function sendSendGrid({ apiKey, from, to, subject, html }) {
  const endpoint = 'https://api.sendgrid.com/v3/mail/send';

  const fromEmail = from.includes('<') ? from.match(/<([^>]+)>/)?.[1] || from : from;

  const payload = {
    personalizations: [
      {
        to: [{ email: to }]
      }
    ],
    from: {
      email: fromEmail,
      name: 'Aranduê'
    },
    subject,
    content: [
      {
        type: 'text/html',
        value: html
      }
    ]
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(errorText || `SendGrid HTTP error ${response.status}`);
  }

  return { success: true, provider: 'sendgrid' };
}

const nodemailer = require('nodemailer');

const DEFAULT_SENDER_EMAIL = 'tramontina9299@gmail.com';
const DEFAULT_RECIPIENT_EMAIL = 'tramontina4040@gmail.com';

/**
 * Resolve o destinatário real para envio acadêmico/produção:
 * Se o e-mail do perfil for fictício do seed (@email.com, @buffetsabor.com.br, etc.)
 * ou se EMAIL_FORCE_TO estiver ativo, direciona para tramontina4040@gmail.com.
 */
function resolverDestinatarioReal(to) {
  const destinoPadrao = process.env.EMAIL_DEFAULT_TO || DEFAULT_RECIPIENT_EMAIL;
  if (process.env.EMAIL_FORCE_DEFAULT_TO === 'true') {
    return destinoPadrao;
  }
  if (!to) return destinoPadrao;
  const lower = String(to).toLowerCase().trim();
  const dominiosFicticios = ['@email.com', '@buffetsabor.com.br', '@arandue.com.br', '@exemplo.com', '@teste.com'];
  if (dominiosFicticios.some((d) => lower.endsWith(d)) || lower === DEFAULT_SENDER_EMAIL) {
    return destinoPadrao;
  }
  return to;
}

async function sendNodemailerSmtp({ from, to, subject, html }) {
  const smtpUser = process.env.SMTP_USER || DEFAULT_SENDER_EMAIL;
  const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = Number(process.env.SMTP_PORT || 465);
  const secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : smtpPort === 465;

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure,
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  });

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    html
  });

  console.log(`📧 [Nodemailer Gmail/SMTP] Enviado de ${smtpUser} para ${to} | MessageID: ${info.messageId}`);
  return {
    success: true,
    simulated: false,
    provider: 'nodemailer-gmail',
    from: smtpUser,
    deliveredTo: to,
    messageId: info.messageId
  };
}

let cachedEtherealAccount = null;

async function sendNodemailerEthereal({ from, to, subject, html }) {
  if (!cachedEtherealAccount) {
    cachedEtherealAccount = await nodemailer.createTestAccount();
  }

  const transporter = nodemailer.createTransport({
    host: cachedEtherealAccount.smtp.host,
    port: cachedEtherealAccount.smtp.port,
    secure: cachedEtherealAccount.smtp.secure,
    auth: {
      user: cachedEtherealAccount.user,
      pass: cachedEtherealAccount.pass
    }
  });

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    html
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  console.log(`📧 [Nodemailer Ethereal] De: ${DEFAULT_SENDER_EMAIL} -> Para: ${to} | Visualizar e-mail: ${previewUrl}`);

  return {
    success: true,
    simulated: false,
    provider: 'nodemailer-ethereal',
    from: DEFAULT_SENDER_EMAIL,
    deliveredTo: to,
    messageId: info.messageId,
    previewUrl
  };
}

const emailProvider = {
  /**
   * Envia e-mail formatado para o destinatário usando Nodemailer (Gmail SMTP), Resend, SendGrid ou Simulação.
   * Configurado por padrão para enviar de tramontina9299@gmail.com para tramontina4040@gmail.com.
   * @param {Object} params
   * @param {string} params.to - Endereço de e-mail do destinatário
   * @param {string} params.subject - Assunto do e-mail
   * @param {string} params.message - Mensagem textual
   * @param {string} [params.destinatarioNome] - Nome opcional para saudação
   */
  async sendEmail({ to, subject, message, destinatarioNome }) {
    const provider = (process.env.EMAIL_PROVIDER || 'gmail').toLowerCase();
    const smtpUser = process.env.SMTP_USER || DEFAULT_SENDER_EMAIL;
    const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;
    const from = process.env.EMAIL_FROM || `Aranduê <${smtpUser}>`;
    const destinatarioReal = resolverDestinatarioReal(to);
    const html = buildEmailHtml({
      titulo: subject,
      mensagem: `${message}\n\n[Destinatário do perfil: ${destinatarioNome || 'Usuário'} (${to || destinatarioReal})]`,
      destinatarioNome
    });

    try {
      // 1. Envio via Nodemailer Gmail / SMTP quando a senha de app (SMTP_PASS) estiver configurada
      if ((provider === 'gmail' || provider === 'smtp' || provider === 'nodemailer') && smtpPass) {
        const res = await sendNodemailerSmtp({
          from,
          to: destinatarioReal,
          subject,
          html
        });
        return { ...res, to };
      }

      // 2. Envio via Nodemailer Ethereal (Caixa de entrada SMTP real de demonstração sem precisar de senha)
      if (provider === 'ethereal' && !process.env.VITEST) {
        const res = await sendNodemailerEthereal({
          from,
          to: destinatarioReal,
          subject,
          html
        });
        return { ...res, to };
      }

      // 3. Envio via Resend API
      if (provider === 'resend') {
        const apiKey = process.env.RESEND_API_KEY;
        if (apiKey && destinatarioReal) {
          const res = await sendResend({ apiKey, from, to: destinatarioReal, subject, html });
          return { ...res, from: smtpUser, deliveredTo: destinatarioReal, to };
        }
        console.warn('[Email] Provedor Resend selecionado, mas RESEND_API_KEY não definida. Usando modo simulação.');
      }

      // 4. Envio via SendGrid API
      if (provider === 'sendgrid') {
        const apiKey = process.env.SENDGRID_API_KEY;
        if (apiKey && destinatarioReal) {
          const res = await sendSendGrid({ apiKey, from, to: destinatarioReal, subject, html });
          return { ...res, from: smtpUser, deliveredTo: destinatarioReal, to };
        }
        console.warn('[Email] Provedor SendGrid selecionado, mas SENDGRID_API_KEY não definida. Usando modo simulação.');
      }

      // 5. Modo Simulação Seguro (quando SMTP_PASS ainda não foi informada ou em testes automatizados)
      console.log(
        `📧 [E-mail SIMULAÇÃO (Nodemailer)] De: ${smtpUser} -> Para: ${destinatarioReal} (Perfil: ${to || 'N/A'}) | Assunto: "${subject}"`
      );
      return {
        success: true,
        simulated: true,
        provider: provider === 'mock' ? 'mock' : 'nodemailer-simulated',
        from: smtpUser,
        deliveredTo: destinatarioReal,
        to
      };
    } catch (error) {
      console.error(`❌ [E-mail ERRO] Provedor (${provider}):`, error.message);
      return {
        success: false,
        simulated: false,
        provider,
        from: smtpUser,
        deliveredTo: destinatarioReal,
        to,
        error: error.message
      };
    }
  }
};

module.exports = emailProvider;
