import React, { useEffect, useState } from 'react'
import { upload } from '@vercel/blob/client'

type Artist = { id: number; name: string; bio?: string; imageUrl?: string }

export default function Dashboard() {
  const [artists, setArtists] = useState<Artist[]>([])
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [pw, setPw] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  useEffect(() => { fetchList() }, [])

  async function fetchList() {
    const res = await fetch('/api/artists')
    const data = await res.json()
    setArtists(data)
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!pw) { setUploadError('Introduce el password de admin antes de subir.'); return }
    setUploadError('')
    setUploading(true)
    try {
      const blob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
        clientPayload: pw,
      })
      setImageUrl(blob.url)
    } catch (err) {
      setUploadError((err as Error).message || 'Error al subir la imagen')
    } finally {
      setUploading(false)
    }
  }

  async function createArtist(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/artists', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-password': pw }, body: JSON.stringify({ name, bio, imageUrl }) })
    if (res.ok) { setName(''); setBio(''); setImageUrl(''); fetchList() }
  }

  async function remove(id: number) {
    await fetch(`/api/artists/${id}`, { method: 'DELETE', headers: { 'x-admin-password': pw } })
    fetchList()
  }

  return (
    <div style={{ padding: 20, fontFamily: 'system-ui' }}>
      <h1>Dashboard — Artistas</h1>
      <div style={{ marginBottom: 12 }}>
        <label>Admin password: <input value={pw} onChange={e => setPw(e.target.value)} /></label>
      </div>
      <form onSubmit={createArtist} style={{ marginBottom: 20 }}>
        <div><input placeholder="Nombre" value={name} onChange={e => setName(e.target.value)} /></div>
        <div><input placeholder="Bio" value={bio} onChange={e => setBio(e.target.value)} /></div>
        <div style={{ marginTop: 8 }}>
          <label>Foto: <input type="file" accept="image/*" onChange={handleFile} disabled={uploading} /></label>
          {uploading && <span style={{ marginLeft: 8 }}>Subiendo…</span>}
          {uploadError && <span style={{ marginLeft: 8, color: 'crimson' }}>{uploadError}</span>}
        </div>
        <div style={{ marginTop: 8 }}>
          <input placeholder="Image URL" value={imageUrl} onChange={e => setImageUrl(e.target.value)} style={{ width: 360 }} />
        </div>
        {imageUrl && (
          <div style={{ marginTop: 8 }}>
            <img src={imageUrl} alt="preview" style={{ maxWidth: 160, maxHeight: 160, objectFit: 'cover', borderRadius: 8 }} />
          </div>
        )}
        <button type="submit" disabled={uploading} style={{ marginTop: 8 }}>Crear artista</button>
      </form>

      <ul>
        {artists.map(a => (
          <li key={a.id} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            {a.imageUrl && <img src={a.imageUrl} alt={a.name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }} />}
            <span><strong>{a.name}</strong> — {a.bio}</span>
            <button onClick={() => remove(a.id)} style={{ marginLeft: 8 }}>Eliminar</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
