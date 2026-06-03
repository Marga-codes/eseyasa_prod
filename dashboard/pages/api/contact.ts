import type { NextApiRequest, NextApiResponse } from 'next'
import nodemailer from 'nodemailer'

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }
    return map[char] || char
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const {
    name,
    email,
    message,
    subject,
    source,
    artist,
    event_type,
    event_date,
    location,
    event_name,
    requirements,
    page,
  } = req.body || {}

  if (!name || !email || (!message && !requirements)) return res.status(400).json({ error: 'Missing fields' })

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  const to = process.env.SMTP_USER // send to account owner
  const bodyLines = [
    `Nombre: ${name}`,
    `Email: ${email}`,
    artist ? `Artista: ${artist}` : null,
    source ? `Origen: ${source}` : null,
    event_name ? `Evento: ${event_name}` : null,
    event_type ? `Tipo de evento: ${event_type}` : null,
    event_date ? `Fecha: ${event_date}` : null,
    location ? `Ubicación: ${location}` : null,
    message ? `Mensaje: ${message}` : null,
    requirements ? `Requisitos: ${requirements}` : null,
    page ? `Página: ${page}` : null,
  ].filter(Boolean)

  try {
    await transporter.sendMail({
      from: `${name} <${email}>`,
      to,
      subject: subject || `Contacto / Booking: ${name}`,
      text: bodyLines.join('\n'),
      html: `<pre style="font-family: ui-sans-serif, system-ui, sans-serif; white-space: pre-wrap;">${escapeHtml(bodyLines.join('\n'))}</pre>`,
    })

    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Send failed' })
  }
}
