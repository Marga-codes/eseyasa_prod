import type { NextApiRequest, NextApiResponse } from 'next'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'

// Subida de imágenes de artistas a Vercel Blob mediante "client upload":
// el navegador sube el archivo directamente al store (sin el límite de 4.5MB
// de las funciones serverless). Este endpoint solo genera el token de subida
// tras validar el password de admin, que el cliente envía en clientPayload.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
        // clientPayload lleva el password de admin enviado desde el formulario.
        if (!clientPayload || clientPayload !== process.env.ADMIN_PASSWORD) {
          throw new Error('Not authorized')
        }
        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
          maximumSizeInBytes: 10 * 1024 * 1024, // 10MB
          addRandomSuffix: true,
        }
      },
      // En local onUploadCompleted no se dispara (Vercel no alcanza tu
      // localhost); el cliente recibe la URL y la guarda al crear el artista.
      onUploadCompleted: async () => {},
    })

    return res.status(200).json(jsonResponse)
  } catch (error) {
    const message = (error as Error).message
    return res.status(message === 'Not authorized' ? 401 : 400).json({ error: message })
  }
}
