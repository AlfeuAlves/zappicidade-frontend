'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react'
import { apiFetch } from '@/lib/auth'

function RedefinirSenhaForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') ?? ''

  const [novaSenha, setNovaSenha]         = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [mostrarSenha, setMostrarSenha]   = useState(false)
  const [carregando, setCarregando]       = useState(false)
  const [sucesso, setSucesso]             = useState(false)
  const [erro, setErro]                   = useState('')

  useEffect(() => {
    if (!token) setErro('Link inválido ou expirado. Solicite um novo link.')
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    if (novaSenha.length < 6) { setErro('A senha deve ter pelo menos 6 caracteres.'); return }
    if (novaSenha !== confirmarSenha) { setErro('As senhas não coincidem.'); return }

    setCarregando(true)
    try {
      await apiFetch('/auth/redefinir-senha', {
        method: 'POST',
        body: JSON.stringify({ token, nova_senha: novaSenha }),
      })
      setSucesso(true)
      setTimeout(() => router.push('/comerciante/login'), 3000)
    } catch (err: any) {
      setErro(err.message || 'Link inválido ou expirado. Solicite um novo link.')
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
          {sucesso ? (
            /* Tela de sucesso */
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%', background: '#DCFCE7',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <CheckCircle2 size={36} color="#16A34A" />
              </div>
              <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#111827', margin: '0 0 12px' }}>
                Senha redefinida!
              </h2>
              <p style={{ fontSize: 14, color: '#4B5563', lineHeight: 1.7, margin: '0 0 4px' }}>
                Sua senha foi atualizada com sucesso.
              </p>
              <p style={{ fontSize: 13, color: '#9CA3AF', margin: '0 0 28px' }}>
                Você será redirecionado para o login em instantes...
              </p>
              <Link href="/comerciante/login" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 14,
                color: '#16A34A', textDecoration: 'none',
              }}>
                Ir para o login agora →
              </Link>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 28 }}>
                <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#111827', margin: '0 0 8px' }}>
                  Criar nova senha
                </h2>
                <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>
                  Escolha uma senha segura para sua conta.
                </p>
              </div>

              {erro && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 14px', color: '#DC2626', fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>{erro}</span>
                </div>
              )}

              {!token ? (
                <div style={{ textAlign: 'center', marginTop: 8 }}>
                  <Link href="/comerciante/esqueci-senha" style={{
                    fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 14,
                    color: '#16A34A', textDecoration: 'none',
                  }}>
                    Solicitar novo link →
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {/* Nova senha */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: '#374151', marginBottom: 6 }}>
                      Nova senha
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={mostrarSenha ? 'text' : 'password'}
                        required minLength={6} value={novaSenha}
                        onChange={e => setNovaSenha(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        style={{
                          width: '100%', padding: '12px 44px 12px 14px', boxSizing: 'border-box',
                          border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 14,
                          color: '#111827', outline: 'none', fontFamily: 'Inter, sans-serif',
                        }}
                        onFocus={e => (e.target.style.borderColor = '#16A34A')}
                        onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
                      />
                      <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)} style={{
                        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 0,
                      }}>
                        {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirmar senha */}
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: '#374151', marginBottom: 6 }}>
                      Confirmar nova senha
                    </label>
                    <input
                      type={mostrarSenha ? 'text' : 'password'}
                      required minLength={6} value={confirmarSenha}
                      onChange={e => setConfirmarSenha(e.target.value)}
                      placeholder="Repita a senha"
                      style={{
                        width: '100%', padding: '12px 14px', boxSizing: 'border-box',
                        border: `1.5px solid ${confirmarSenha && confirmarSenha !== novaSenha ? '#FECACA' : '#E5E7EB'}`,
                        borderRadius: 10, fontSize: 14, color: '#111827',
                        outline: 'none', fontFamily: 'Inter, sans-serif',
                      }}
                      onFocus={e => (e.target.style.borderColor = '#16A34A')}
                      onBlur={e => (e.target.style.borderColor = confirmarSenha && confirmarSenha !== novaSenha ? '#FECACA' : '#E5E7EB')}
                    />
                    {confirmarSenha && confirmarSenha !== novaSenha && (
                      <p style={{ fontSize: 12, color: '#DC2626', margin: '4px 0 0' }}>As senhas não coincidem</p>
                    )}
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
                      ? <><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Salvando...</>
                      : 'Salvar nova senha'}
                  </button>
                </form>
              )}

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

export default function RedefinirSenhaPage() {
  return (
    <Suspense>
      <RedefinirSenhaForm />
    </Suspense>
  )
}
