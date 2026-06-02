import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../lib/prisma'

function setCors(res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-admin-password')
}

function checkAdmin(req: NextApiRequest) {
  const pw = req.headers['x-admin-password'] as string | undefined
  return pw && pw === process.env.ADMIN_PASSWORD
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(204).end()

  if (req.method === 'GET') {
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
