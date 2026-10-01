import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

export default function AuthGate({ children }) {
  const [session, setSession] = useState(undefined) // undefined = cargando
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  async function login(e) {
    e.preventDefault()
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('Email o contraseña incorrectos')
  }

  const campo = {
    width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid #2a2a2a',
    backgroundColor: '#0a0a0a', color: '#fff', fontSize: '1rem', outline: 'none', boxSizing: 'border-box'
  }

  if (session === undefined) return null
  if (session) return children

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#000', color: '#fff', fontFamily: '-apple-system, sans-serif', padding: '24px 16px', boxSizing: 'border-box' }}>
      <form onSubmit={login} style={{ maxWidth: 320, margin: '20vh auto 0', display: 'grid', gap: 12 }}>
        <h1 style={{ fontSize: '2rem', margin: '0 0 8px 0' }}>Gym Tracker</h1>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={campo} required />
        <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} style={campo} required />
        <button type="submit" style={{ ...campo, backgroundColor: '#fff', color: '#000', fontWeight: 700, cursor: 'pointer', border: 'none' }}>Entrar</button>
        {error && <p style={{ color: '#ef4444', margin: 0 }}>{error}</p>}
      </form>
    </div>
  )
}
