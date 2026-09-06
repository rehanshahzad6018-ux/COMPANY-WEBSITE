/* ============================================================
   CGW - Server-side email sender
   Used by  POST /api/contact  to deliver contact-form enquiries.

   Credentials live ONLY in environment variables (.env / host
   dashboard) - never in frontend code.

   Two transports, picked automatically:
     1. Resend HTTP API - set RESEND_API_KEY   (works on hosts
                             that block outbound SMTP ports)
     2. SMTP (nodemailer) - set SMTP_USER + SMTP_PASS
                             (defaults to Gmail, needs an App Password)
   ============================================================ */
const nodemailer = require('nodemailer');

const TO        = process.env.CONTACT_TO      || 'cgwofficialai@gmail.com';
const FROM_NAME = process.env.MAIL_FROM_NAME  || 'CGW Website';
const TZ        = process.env.MAIL_TIMEZONE   || 'Asia/Karachi';

const SMTP_HOST   = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT   = Number(process.env.SMTP_PORT || 465);
const SMTP_SECURE = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : SMTP_PORT === 465;
const SMTP_USER   = process.env.SMTP_USER || '';
const SMTP_PASS   = process.env.SMTP_PASS || '';
const RESEND_KEY  = process.env.RESEND_API_KEY || '';
// Resend requires a verified domain; falls back to their shared test sender.
const RESEND_FROM = process.env.RESEND_FROM || 'CGW Website <onboarding@resend.dev>';

function provider() {
  if (RESEND_KEY) return 'resend';
  if (SMTP_USER && SMTP_PASS) return 'smtp';
  return null;
}
function isConfigured() { return provider() !== null; }

/* ── Helpers ───────────────────────────────────────────────── */
function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
// Strip CR/LF so nothing can be injected into mail headers
function headerSafe(str, max = 200) {
  return String(str || '').replace(/[\r\n]+/g, ' ').trim().slice(0, max);
}
function formatWhen(date) {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'full', timeStyle: 'short', timeZone: TZ
    }).format(date) + ` (${TZ})`;
  } catch (e) {
    return date.toISOString();
  }
}

/* ── Message body ──────────────────────────────────────────── */
function buildMessage({ name, email, budget, message, submittedAt }) {
  const when   = formatWhen(submittedAt || new Date());
  const safeNm = headerSafe(name, 100);
  const bdg    = budget && budget.trim() ? budget.trim() : 'Not specified';

  const subject = `New enquiry from ${safeNm} - CGW website`;

  const text =
    `New contact form submission - CGW website\n\n` +
    `Name:      ${name}\n` +
    `Email:     ${email}\n` +
    `Budget:    ${bdg}\n` +
    `Submitted: ${when}\n\n` +
    `Message:\n${message}\n\n` +
    `Reply to this email to respond directly to ${safeNm}.`;

  const row = (label, value) =>
    `<tr>
       <td style="padding:10px 16px;border-bottom:1px solid #ececec;color:#6b7280;font:600 12px/1.4 Arial,Helvetica,sans-serif;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap;vertical-align:top;">${label}</td>
       <td style="padding:10px 16px;border-bottom:1px solid #ececec;color:#111827;font:400 15px/1.6 Arial,Helvetica,sans-serif;">${value}</td>
     </tr>`;

  const html =
    `<div style="background:#f5f5f4;padding:28px 12px;">
      <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e5e5e5;border-radius:10px;overflow:hidden;">
        <tr>
          <td style="background:#0d1b2a;padding:22px 24px;">
            <div style="color:#ffffff;font:700 18px/1.2 Arial,Helvetica,sans-serif;letter-spacing:.02em;">New Project Enquiry</div>
            <div style="color:#9fb3c8;font:400 13px/1.5 Arial,Helvetica,sans-serif;margin-top:6px;">Submitted through the CGW website contact form</div>
          </td>
        </tr>
        <tr><td style="padding:8px 8px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
            ${row('Name', escapeHtml(name))}
            ${row('Email', `<a href="mailto:${escapeHtml(email)}" style="color:#1d4ed8;text-decoration:none;">${escapeHtml(email)}</a>`)}
            ${row('Budget', escapeHtml(bdg))}
            ${row('Submitted', escapeHtml(when))}
          </table>
        </td></tr>
        <tr><td style="padding:18px 24px 26px;">
          <div style="color:#6b7280;font:600 12px/1.4 Arial,Helvetica,sans-serif;letter-spacing:.08em;text-transform:uppercase;margin-bottom:10px;">About the project</div>
          <div style="color:#111827;font:400 15px/1.7 Arial,Helvetica,sans-serif;white-space:pre-wrap;">${escapeHtml(message)}</div>
        </td></tr>
        <tr><td style="background:#fafafa;border-top:1px solid #ececec;padding:14px 24px;color:#6b7280;font:400 13px/1.6 Arial,Helvetica,sans-serif;">
          Hit <strong>Reply</strong> to respond directly to ${escapeHtml(safeNm)}.
        </td></tr>
      </table>
    </div>`;

  return { subject, text, html };
}

/* ── Transports ────────────────────────────────────────────── */
let transporter = null;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
    });
  }
  return transporter;
}

async function sendViaResend({ subject, text, html, replyTo }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: [TO],
      reply_to: replyTo,
      subject, html, text,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`resend ${res.status}: ${body.message || 'send failed'}`);
  return { provider: 'resend', id: body.id || null };
}

async function sendViaSmtp({ subject, text, html, replyTo }) {
  const info = await getTransporter().sendMail({
    from: `"${FROM_NAME}" <${SMTP_USER}>`,
    to: TO,
    replyTo,
    subject, text, html,
  });
  return { provider: 'smtp', id: info.messageId || null };
}

/* ── Public API ────────────────────────────────────────────── */
async function sendContactEmail(data) {
  const mode = provider();
  if (!mode) throw new Error('email transport not configured');

  const { subject, text, html } = buildMessage(data);
  // Reply-To = the visitor, so "Reply" in Gmail answers the client directly
  const replyTo = `"${headerSafe(data.name, 100)}" <${headerSafe(data.email, 200)}>`;

  return mode === 'resend'
    ? sendViaResend({ subject, text, html, replyTo })
    : sendViaSmtp({ subject, text, html, replyTo });
}

module.exports = { sendContactEmail, isConfigured, provider, buildMessage, recipient: TO };
