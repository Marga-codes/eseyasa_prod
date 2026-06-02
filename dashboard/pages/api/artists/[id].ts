import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../lib/prisma'

function checkAdmin(req: NextApiRequest) {
  const pw = req.headers['x-admin-password'] as string | undefined
  return pw && pw === process.env.ADMIN_PASSWORD
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'Missing id' })

  const artistId = Number(id)

  if (req.method === 'GET') {
    // El sitio público (otro origen) consume esta API: permitir lectura CORS.
    res.setHeader('Access-Control-Allow-Origin', '*')
    const a = await prisma.artist.findUnique({ where: { id: artistId } })
    return res.json(a)
  }

  if (!checkAdmin(req)) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'PUT') {
    const { name, genre, bio, imageUrl, videoUrl, links } = req.body
    const updated = await prisma.artist.update({ where: { id: artistId }, data: { name, genre, bio, imageUrl, videoUrl, links } })
    return res.json(updated)
  }

  if (req.method === 'DELETE') {
    await prisma.artist.delete({ where: { id: artistId } })
    return res.status(204).end()
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}
