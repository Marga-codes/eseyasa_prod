import type { NextApiRequest, NextApiResponse } from 'next'
import { ADMIN_COOKIE } from '../../../lib/admin-auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const isProd = process.env.NODE_ENV === 'production'
  res.setHeader('Set-Cookie', [`${ADMIN_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${isProd ? '; Secure' : ''}`])
  return res.json({ ok: true })
}
