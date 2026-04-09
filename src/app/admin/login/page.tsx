'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Lock, Mail, Eye, EyeOff, ShieldCheck } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail]         = useState('')
  const [senha, setSenha]         = useState('')
  const [mostrarSenha, setMostrar] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro]           = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(''); setCarregando(true)
    try {
      const res = await fetch(`${API_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.erro || 'Credenciais inválidas')
      localStorage.setItem('admin_token', data.token)
      localStorage.setItem('admin_email', data.email)
      router.push('/admin/dashboard')
    } catch (err: any) {
      setErro(err.message)
    } finally {
      setCarregando(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px 12px 44px',
    background: 'white', border: '1.5px solid #E5E7EB',
    borderRadius: 12, fontSize: 14, color: '#111827',
    fontFamily: 'Inter, sans-serif', outline: 'none',
    transition: 'border-color 0.2s', boxSizing: 'border-box',
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#F9FAFB',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 20px',
    }}>
      {/* Blobs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(220,252,231,0.6) 0%, transparent 70%)', top: -150, left: -100, filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(254,249,195,0.5) 0%, transparent 70%)', bottom: -80, right: -80, filter: 'blur(40px)' }} />
      </div>

      <div style={{ width: '100%', maxWidth: 420, position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Image src="/logo_zappicidade.png" alt="ZappiCidade" width={150} height={38} style={{ objectFit: 'contain' }} />
        </div>

        {/* Card */}
        <div style={{
          background: 'white', border: '1.5px solid #E5E7EB',
          borderRadius: 24, padding: '36px 32px',
          boxShadow: '0 8px 40px rgba(31,41,55,0.08)',
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: '#DCFCE7', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 14px',
            }}>
              <ShieldCheck size={24} color="#16A34A" />
            </div>
            <h1 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#111827', marginBottom: 6 }}>
              Painel Admin
            </h1>
            <p style={{ color: '#4B5563', fontSize: 14, fontFamily: 'Inter, sans-serif' }}>
              Acesso exclusivo do fundador
            </p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Email */}
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="#9CA3AF" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com" required style={inputStyle}
                onFocus={e => (e.target.style.borderColor = '#16A34A')}
                onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
              />
            </div>

            {/* Senha */}
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="#9CA3AF" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                type={mostrarSenha ? 'text' : 'password'} value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="Senha" required style={{ ...inputStyle, paddingRight: 44 }}
                onFocus={e => (e.target.style.borderColor = '#16A34A')}
                onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
              />
              <button type="button" onClick={() => setMostrar(v => !v)} style={{
                position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              }}>
                {mostrarSenha ? <EyeOff size={16} color="#9CA3AF" /> : <Eye size={16} color="#9CA3AF" />}
              </button>
            </div>

            {erro && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', color: '#DC2626', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>
                {erro}
              </div>
            )}

            <button type="submit" disabled={carregando} style={{
              width: '100%', padding: '14px', borderRadius: 999, border: 'none',
              background: carregando ? 'rgba(22,163,74,0.6)' : '#16A34A',
              color: 'white', fontSize: 15, fontWeight: 700, fontFamily: 'Poppins, sans-serif',
              cursor: carregando ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 4px 20px rgba(22,163,74,0.30)', transition: 'all 0.2s', marginTop: 4,
            }}
              onMouseEnter={e => { if (!carregando) { e.currentTarget.style.background = '#15803D'; e.currentTarget.style.transform = 'translateY(-1px)' }}}
              onMouseLeave={e => { e.currentTarget.style.background = '#16A34A'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              {carregando
                ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Entrando...</>
                : <><ShieldCheck size={16} /> Acessar painel</>
              }
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 12, marginTop: 20, fontFamily: 'Inter, sans-serif' }}>
          ← <a href="/" style={{ color: '#16A34A', textDecoration: 'none', fontWeight: 600 }}>Voltar ao site</a>
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: #9CA3AF; }
      `}</style>
    </div>
  )
}
