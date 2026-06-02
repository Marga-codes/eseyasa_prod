import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../lib/prisma'

function checkAdmin(req: NextApiRequest) {
  const pw = req.headers['x-admin-password'] as string | undefined
  return pw && pw === process.env.ADMIN_PASSWORD
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // El sitio público (otro origen) consume esta API: permitir lectura CORS.
    res.setHeader('Access-Control-Allow-Origin', '*')
    const artists = await prisma.artist.findMany({ orderBy: { createdAt: 'desc' } })
    return res.json(artists)
  }

  if (!checkAdmin(req)) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'POST') {
    const { name, genre, bio, imageUrl, videoUrl, links } = req.body
    const created = await prisma.artist.create({ data: { name, genre, bio, imageUrl, videoUrl, links } })
    return res.status(201).json(created)
  }

  res.setHeader('Allow', ['GET', 'POST'])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}
