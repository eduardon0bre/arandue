import tls from 'node:tls';

function sendGmailTls({ smtpUser, smtpPass, from, to, subject, html }) {
  return new Promise((resolve, reject) => {
    const socket = tls.connect({
      host: 'smtp.gmail.com',
      port: 465,
      servername: 'smtp.gmail.com'
    });

    let step = 0;
    let buffer = '';
    const msgId = `<${Date.now()}.${Math.random().toString(36).slice(2)}@gmail.com>`;

    socket.setTimeout(8000, () => {
      socket.destroy();
      reject(new Error('TLS SMTP timeout'));
    });

    socket.on('error', reject);

    socket.on('data', (chunk) => {
      buffer += chunk.toString('utf8');
      const lines = buffer.split('\r\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (line.length >= 4 && line[3] === '-') continue;
        const code = parseInt(line.slice(0, 3), 10);
        if (code >= 400) {
          socket.destroy();
          return reject(new Error(`SMTP ${line}`));
        }
        if (step === 0 && code === 220) {
          step = 1;
          socket.write('EHLO arandue.app\r\n');
        } else if (step === 1 && code === 250) {
          step = 2;
          socket.write('AUTH LOGIN\r\n');
        } else if (step === 2 && code === 334) {
          step = 3;
          socket.write(Buffer.from(smtpUser).toString('base64') + '\r\n');
        } else if (step === 3 && code === 334) {
          step = 4;
          socket.write(Buffer.from(smtpPass).toString('base64') + '\r\n');
        } else if (step === 4 && code === 235) {
          step = 5;
          socket.write(`MAIL FROM:<${smtpUser}>\r\n`);
        } else if (step === 5 && code === 250) {
          step = 6;
          socket.write(`RCPT TO:<${to}>\r\n`);
        } else if (step === 6 && code === 250) {
          step = 7;
          socket.write('DATA\r\n');
        } else if (step === 7 && code === 354) {
          step = 8;
          const subjB64 = Buffer.from(subject, 'utf8').toString('base64');
          const bodyB64 = Buffer.from(html, 'utf8')
            .toString('base64')
            .replace(/(.{76})/g, '$1\r\n');
          const raw = [
            `From: ${from}`,
            `To: <${to}>`,
            `Subject: =?UTF-8?B?${subjB64}?=`,
            `Message-ID: ${msgId}`,
            `Date: ${new Date().toUTCString()}`,
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=UTF-8',
            'Content-Transfer-Encoding: base64',
            '',
            bodyB64,
            '.',
            ''
          ].join('\r\n');
          socket.write(raw);
        } else if (step === 8 && code === 250) {
          step = 9;
          socket.write('QUIT\r\n');
          socket.end();
          resolve({ success: true, messageId: msgId });
        }
      }
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { smtpUser, smtpPass, from, to, subject, html } = req.body || {};
    if (!smtpUser || !smtpPass || !to || !subject || !html) {
      return res.status(400).json({ success: false, message: 'Missing required email fields' });
    }

    const result = await sendGmailTls({
      smtpUser,
      smtpPass,
      from: from || `Aranduê <${smtpUser}>`,
      to,
      subject,
      html
    });

    return res.status(200).json({
      success: true,
      provider: 'nodemailer-gmail-https-relay',
      from: smtpUser,
      deliveredTo: to,
      messageId: result.messageId
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
}
