import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { upload } from '@vercel/blob/client'

type Artist = { id: number; name: string; genre?: string; bio?: string; imageUrl?: string; videoUrl?: string }

export default function Workspace() {
  const router = useRouter()
  const [artists, setArtists] = useState<Artist[]>([])
  const [name, setName] = useState('')
  const [genre, setGenre] = useState('')
  const [bio, setBio] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [busy, setBusy] = useState('')

  useEffect(() => { fetchList() }, [])

  async function fetchList() {
    const res = await fetch('/api/artists')
    const data = await res.json()
    setArtists(Array.isArray(data) ? data : [])
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError('')
    setUploading(true)
    try {
      const blob = await upload(file.name, file, { access: 'public', handleUploadUrl: '/api/upload', clientPayload: '' })
      setImageUrl(blob.url)
    } catch (err) {
      setUploadError((err as Error).message || 'Error al subir la imagen')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function createArtist(e: React.FormEvent) {
    e.preventDefault()
    setBusy('Guardando...')
    const res = await fetch('/api/artists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, genre, bio, imageUrl, videoUrl }),
    })
    if (res.ok) {
      setName('')
      setGenre('')
      setBio('')
      setImageUrl('')
      setVideoUrl('')
      await fetchList()
    }
    setBusy('')
  }

  async function remove(id: number) {
    setBusy('Eliminando...')
    await fetch(`/api/artists/${id}`, { method: 'DELETE' })
    await fetchList()
    setBusy('')
  }

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.replace('/')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '240px 1fr', background: '#121411', color: '#e3e3de', overflow: 'hidden' }}>
      <aside style={{ borderRight: '1px solid #333532', padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#ffc87c' }}>Eseyasa</div>
          <div style={{ fontSize: 13, color: '#d6c4af', marginTop: 4 }}>Admin Workspace</div>
        </div>
        <button onClick={logout} style={{ marginTop: 'auto', padding: '12px 14px', borderRadius: 12, border: '1px solid #514535', background: 'transparent', color: '#ffb4ab', cursor: 'pointer' }}>Salir</button>
      </aside>

      <main style={{ minHeight: 0, overflow: 'auto', padding: 24 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gap: 20 }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <p style={{ margin: 0, color: '#9cd1c5', textTransform: 'uppercase', letterSpacing: '0.18em', fontSize: 12 }}>Panel protegido</p>
              <h1 style={{ margin: '8px 0 0', fontSize: 34, lineHeight: 1.05 }}>Dashboard</h1>
            </div>
            <div style={{ color: '#d6c4af', fontSize: 13, alignSelf: 'center' }}>{busy}</div>
          </header>

          <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(320px, 0.9fr)', gap: 20, alignItems: 'start' }}>
            <form onSubmit={createArtist} style={{ background: '#1a1c19', border: '1px solid #333532', borderRadius: 20, padding: 20, display: 'grid', gap: 12 }}>
              <h2 style={{ margin: 0, fontSize: 22 }}>Crear artista</h2>
              <input placeholder="Nombre" value={name} onChange={e => setName(e.target.value)} required style={{ width: '100%', boxSizing: 'border-box', padding: '14px 16px', borderRadius: 12, border: '1px solid #333532', background: '#0d0f0c', color: '#e3e3de' }} />
              <input placeholder="Género" value={genre} onChange={e => setGenre(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '14px 16px', borderRadius: 12, border: '1px solid #333532', background: '#0d0f0c', color: '#e3e3de' }} />
              <textarea placeholder="Bio" value={bio} onChange={e => setBio(e.target.value)} rows={5} style={{ width: '100%', boxSizing: 'border-box', padding: '14px 16px', borderRadius: 12, border: '1px solid #333532', background: '#0d0f0c', color: '#e3e3de', resize: 'vertical', minHeight: 130 }} />
              <input placeholder="URL del vídeo" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '14px 16px', borderRadius: 12, border: '1px solid #333532', background: '#0d0f0c', color: '#e3e3de' }} />
              <label style={{ display: 'grid', gap: 8 }}>
                <span style={{ fontSize: 13, color: '#d6c4af' }}>Foto</span>
                <input type="file" accept="image/*" onChange={handleFile} disabled={uploading} />
              </label>
              <input placeholder="Image URL" value={imageUrl} onChange={e => setImageUrl(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '14px 16px', borderRadius: 12, border: '1px solid #333532', background: '#0d0f0c', color: '#e3e3de' }} />
              {imageUrl ? <img src={imageUrl} alt="preview" style={{ width: 160, height: 160, objectFit: 'cover', borderRadius: 16, border: '1px solid #333532' }} /> : null}
              {uploadError ? <div style={{ color: '#ffb4ab', fontSize: 13 }}>{uploadError}</div> : null}
              <button type="submit" disabled={uploading} style={{ padding: '14px 16px', borderRadius: 12, border: 0, background: '#ffc87c', color: '#452b00', fontWeight: 700, cursor: 'pointer' }}>Guardar</button>
            </form>

            <section style={{ background: '#1a1c19', border: '1px solid #333532', borderRadius: 20, padding: 20, minHeight: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <h2 style={{ margin: 0, fontSize: 22 }}>Artistas</h2>
                <span style={{ color: '#d6c4af', fontSize: 13 }}>{artists.length}</span>
              </div>
              <div style={{ display: 'grid', gap: 12, maxHeight: 'calc(100vh - 190px)', overflow: 'auto', paddingRight: 4 }}>
                {artists.map(a => (
                  <article key={a.id} style={{ display: 'grid', gridTemplateColumns: '56px 1fr auto', gap: 12, alignItems: 'center', padding: 12, borderRadius: 16, background: '#0d0f0c', border: '1px solid #333532' }}>
                    {a.imageUrl ? <img src={a.imageUrl} alt={a.name} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 12 }} /> : <div style={{ width: 56, height: 56, borderRadius: 12, background: '#184f46' }} />}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700 }}>{a.name}{a.genre ? ` · ${a.genre}` : ''}</div>
                      <div style={{ fontSize: 13, color: '#d6c4af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.bio || 'Sin bio'}</div>
                    </div>
                    <button onClick={() => remove(a.id)} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #93000a', background: 'transparent', color: '#ffb4ab', cursor: 'pointer' }}>Eliminar</button>
                  </article>
                ))}
                {!artists.length ? <div style={{ color: '#d6c4af', fontSize: 14 }}>No hay artistas todavía.</div> : null}
              </div>
            </section>
          </section>
        </div>
      </main>
    </div>
  )
}
