import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../lib/prisma'
import { getAdminPasswordFromCookieHeader, isAdminPassword } from '../../../lib/admin-auth'

function setCors(res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-admin-password')
}

function checkAdmin(req: NextApiRequest) {
  const pw = req.headers['x-admin-password'] as string | undefined
  return isAdminPassword(pw) || isAdminPassword(getAdminPasswordFromCookieHeader(req.headers.cookie))
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(204).end()

  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'Missing id' })

  const artistId = Number(id)

  if (req.method === 'GET') {
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
