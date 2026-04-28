'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Loader2, ArrowLeft, MessageCircle, CheckCircle2 } from 'lucide-react'
import { apiFetch } from '@/lib/auth'

export default function EsqueciSenhaPage() {
  const [email, setEmail]       = useState('')
  const [carregando, setCarregando] = useState(false)
  const [enviado, setEnviado]   = useState(false)
  const [erro, setErro]         = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(''); setCarregando(true)
    try {
      await apiFetch('/auth/esqueci-senha', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      setEnviado(true)
    } catch (err: any) {
      setErro(err.message || 'Erro ao processar. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px', fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Image src="/logo_zappicidade.png" alt="ZappiCidade" width={160} height={40} style={{ objectFit: 'contain' }} />
        </div>

        <div style={{
          background: 'white', border: '1.5px solid #E5E7EB',
          borderRadius: 28, padding: 'clamp(24px, 5vw, 40px)',
          boxShadow: '0 8px 40px rgba(31,41,55,0.08)',
        }}>
          {enviado ? (
            /* Tela de sucesso */
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%', background: '#DCFCE7',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <MessageCircle size={32} color="#16A34A" />
              </div>
              <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#111827', margin: '0 0 12px' }}>
                Link enviado pelo WhatsApp!
              </h2>
              <p style={{ fontSize: 14, color: '#4B5563', lineHeight: 1.7, margin: '0 0 8px' }}>
                Se esse e-mail estiver cadastrado, você receberá o link de redefinição pelo <strong>WhatsApp</strong> em instantes.
              </p>
              <p style={{ fontSize: 13, color: '#9CA3AF', margin: '0 0 28px' }}>
                O link expira em 1 hora. Verifique seu WhatsApp.
              </p>
              <Link href="/comerciante/login" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 14,
                color: '#16A34A', textDecoration: 'none',
              }}>
                <ArrowLeft size={15} /> Voltar para o login
              </Link>
            </div>
          ) : (
            /* Formulário */
            <>
              <div style={{ marginBottom: 28 }}>
                <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#111827', margin: '0 0 8px' }}>
                  Esqueci minha senha
                </h2>
                <p style={{ fontSize: 14, color: '#6B7280', margin: 0, lineHeight: 1.6 }}>
                  Digite seu e-mail e enviaremos um link de redefinição pelo <strong>WhatsApp</strong>.
                </p>
              </div>

              {erro && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', color: '#DC2626', fontSize: 13, marginBottom: 16 }}>
                  {erro}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: '#374151', marginBottom: 6 }}>
                    E-mail cadastrado
                  </label>
                  <input
                    type="email" required value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    style={{
                      width: '100%', padding: '12px 14px', boxSizing: 'border-box',
                      border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 14,
                      color: '#111827', outline: 'none', fontFamily: 'Inter, sans-serif',
                    }}
                    onFocus={e => (e.target.style.borderColor = '#16A34A')}
                    onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
                  />
                </div>

                <button
                  type="submit" disabled={carregando}
                  style={{
                    width: '100%', padding: '14px', borderRadius: 999, border: 'none',
                    background: carregando ? '#D1FAE5' : '#16A34A', color: carregando ? '#6B7280' : 'white',
                    fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 15,
                    cursor: carregando ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: carregando ? 'none' : '0 4px 14px rgba(22,163,74,0.3)',
                    transition: 'all 0.2s',
                  }}
                >
                  {carregando
                    ? <><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Enviando...</>
                    : <><MessageCircle size={16} /> Enviar link pelo WhatsApp</>}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: 20 }}>
                <Link href="/comerciante/login" style={{
                  fontSize: 13, color: '#6B7280', textDecoration: 'none',
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                }}>
                  <ArrowLeft size={13} /> Voltar para o login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
