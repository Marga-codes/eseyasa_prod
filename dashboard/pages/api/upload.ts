import type { NextApiRequest, NextApiResponse } from 'next'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'

function setCors(res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-admin-password')
}

// Client upload for artist images. The browser uploads directly to Vercel Blob;
// this endpoint only authorizes the upload token with the admin password.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(204).end()

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const body = req.body as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        if (!clientPayload || clientPayload !== process.env.ADMIN_PASSWORD) {
          throw new Error('Not authorized')
        }
        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
          maximumSizeInBytes: 10 * 1024 * 1024,
          addRandomSuffix: true,
        }
      },
      onUploadCompleted: async () => {},
    })

    return res.status(200).json(jsonResponse)
  } catch (error) {
    const message = (error as Error).message
    return res.status(message === 'Not authorized' ? 401 : 400).json({ error: message })
  }
}
