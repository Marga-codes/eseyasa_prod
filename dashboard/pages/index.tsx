import React, { useEffect, useState } from 'react'

type Artist = { id: number; name: string; bio?: string; imageUrl?: string }

export default function Dashboard() {
  const [artists, setArtists] = useState<Artist[]>([])
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [pw, setPw] = useState('')

  useEffect(() => { fetchList() }, [])

  async function fetchList() {
    const res = await fetch('/api/artists')
    const data = await res.json()
    setArtists(data)
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
        <div><input placeholder="Image URL" value={imageUrl} onChange={e => setImageUrl(e.target.value)} /></div>
        <button type="submit">Crear artista</button>
      </form>

      <ul>
        {artists.map(a => (
          <li key={a.id} style={{ marginBottom: 8 }}>
            <strong>{a.name}</strong> — {a.bio}
            <button onClick={() => remove(a.id)} style={{ marginLeft: 8 }}>Eliminar</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
