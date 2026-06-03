import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

export default function LoginPortal() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    router.prefetch('/workspace')
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setStatus('Verificando...')
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (!res.ok) {
      setStatus('Password incorrecto')
      setLoading(false)
      return
    }

    setStatus('Acceso concedido')
    router.replace('/workspace')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at top, #184f46 0%, #121411 45%, #0d0f0c 100%)', color: '#e3e3de', display: 'grid', placeItems: 'center', padding: 16, boxSizing: 'border-box' }}>
      <main style={{ width: '100%', maxWidth: 460, maxHeight: '100vh', display: 'grid', gap: 20 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, letterSpacing: '0.2em', color: '#9cd1c5', textTransform: 'uppercase' }}>Admin Portal</div>
          <h1 style={{ margin: '10px 0 0', fontSize: 34, lineHeight: 1.05 }}>Eseyasa Productions</h1>
          <p style={{ margin: '10px 0 0', color: '#d6c4af' }}>Acceso protegido al panel</p>
        </div>

        <form onSubmit={handleSubmit} style={{ background: '#1a1c19', border: '1px solid #333532', borderRadius: 24, padding: 20, display: 'grid', gap: 14, boxSizing: 'border-box' }}>
          <label style={{ display: 'grid', gap: 8 }}>
            <span style={{ fontSize: 13, color: '#d6c4af' }}>Password de admin</span>
            <div style={{ position: 'relative' }}>
              <input
                autoFocus
                value={password}
                onChange={e => setPassword(e.target.value)}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                style={{ width: '100%', boxSizing: 'border-box', padding: '14px 50px 14px 16px', borderRadius: 14, border: '1px solid #333532', background: '#0d0f0c', color: '#e3e3de', fontSize: 16 }}
              />
              <button type="button" onClick={() => setShowPassword(v => !v)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 0, color: '#d6c4af', cursor: 'pointer' }}>
                {showPassword ? 'Ocultar' : 'Ver'}
              </button>
            </div>
          </label>

          <button disabled={loading || !password} type="submit" style={{ padding: '14px 16px', borderRadius: 14, border: 0, background: '#ffc87c', color: '#452b00', fontWeight: 800, cursor: 'pointer' }}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          <div style={{ minHeight: 20, fontSize: 13, color: status === 'Password incorrecto' ? '#ffb4ab' : '#d6c4af' }}>{status}</div>
        </form>

        <div style={{ textAlign: 'center', fontSize: 12, color: '#80917D' }}>Solo admin autorizado.</div>
      </main>
    </div>
  )
}
