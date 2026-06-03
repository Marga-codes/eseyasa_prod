import type { NextApiRequest, NextApiResponse } from 'next'
import { ADMIN_COOKIE, isAdminPassword } from '../../../lib/admin-auth'

function cookieValue(password: string) {
  const isProd = process.env.NODE_ENV === 'production'
  return [
    `${ADMIN_COOKIE}=${encodeURIComponent(password)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=86400',
    isProd ? 'Secure' : '',
  ].filter(Boolean).join('; ')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const { password } = req.body || {}
  if (!isAdminPassword(password)) return res.status(401).json({ error: 'Credenciales inválidas' })

  res.setHeader('Set-Cookie', cookieValue(password))
  return res.json({ ok: true })
}
