/**
 * sevenstudios® — api/contact.js
 *
 * Vercel Serverless Function (Node.js runtime)
 * Route: POST /api/contact
 *
 * NOTE: The frontend now submits directly to Formspree.
 * This file is kept as a ready-to-use fallback / server-side
 * handler if you ever want to route through your own backend
 * (e.g. to add logging, CRM integration, or custom email).
 *
 * ─── Local dev ────────────────────────────────────────────
 *   npm i -g vercel
 *   vercel dev          ← spins up Next-style dev server on :3000
 *
 * ─── Deploy ───────────────────────────────────────────────
 *   vercel              ← follow prompts, auto-detects /api folder
 *
 * ─── Email providers (uncomment the one you use) ──────────
 *   Resend:   npm install resend
 *   SendGrid: npm install @sendgrid/mail
 */

// ── Resend (recommended — simple, modern) ─────────────────
// const { Resend } = require('resend');
// const resend = new Resend(process.env.RESEND_API_KEY);

// ── SendGrid (alternative) ─────────────────────────────────
// const sgMail = require('@sendgrid/mail');
// sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const RECIPIENT = 'INFO@THESEVENSTUDIO.CO.ZA';

module.exports = async function handler(req, res) {
  // ── Only allow POST ──────────────────────────────────────
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Parse body ───────────────────────────────────────────
  const { name, email, service, message } = req.body || {};

  // ── Validate required fields ─────────────────────────────
  const missing = [];
  if (!name?.trim())    missing.push('name');
  if (!email?.trim())   missing.push('email');
  if (!service?.trim()) missing.push('service');
  if (!message?.trim()) missing.push('message');

  if (missing.length) {
    return res.status(400).json({
      error:   'Validation failed',
      missing,
    });
  }

  // ── Basic email format check ─────────────────────────────
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  // ── Log the payload (visible in Vercel Function logs) ────
  console.log('[sevenstudios contact]', {
    timestamp: new Date().toISOString(),
    name,
    email,
    service,
    message,
  });

  // ── Send email via Resend (uncomment to activate) ────────
  /*
  try {
    await resend.emails.send({
      from: 'contact@thesevenstudio.co.za',   // must be a verified sender
      to:   RECIPIENT,
      replyTo: email,
      subject: `New enquiry from ${name} — ${service}`,
      html: `
        <h2>New contact form submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Service:</strong> ${service}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br/>')}</p>
      `,
    });
  } catch (err) {
    console.error('[sevenstudios contact] Email send failed:', err);
    return res.status(500).json({ error: 'Failed to send email' });
  }
  */

  // ── Send email via SendGrid (uncomment to activate) ───────
  /*
  try {
    await sgMail.send({
      to:      RECIPIENT,
      from:    'contact@thesevenstudio.co.za',  // must match verified SendGrid sender
      replyTo: email,
      subject: `New enquiry from ${name} — ${service}`,
      html: `
        <h2>New contact form submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Service:</strong> ${service}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br/>')}</p>
      `,
    });
  } catch (err) {
    console.error('[sevenstudios contact] SendGrid error:', err);
    return res.status(500).json({ error: 'Failed to send email' });
  }
  */

  // ── Success ───────────────────────────────────────────────
  return res.status(200).json({ success: true });
};
