import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../lib/prisma'

function checkAdmin(req: NextApiRequest) {
  const pw = req.headers['x-admin-password'] as string | undefined
  return pw && pw === process.env.ADMIN_PASSWORD
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const artists = await prisma.artist.findMany({ orderBy: { createdAt: 'desc' } })
    return res.json(artists)
  }

  if (!checkAdmin(req)) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'POST') {
    const { name, bio, imageUrl, links } = req.body
    const created = await prisma.artist.create({ data: { name, bio, imageUrl, links } })
    return res.status(201).json(created)
  }

  res.setHeader('Allow', ['GET', 'POST'])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}
