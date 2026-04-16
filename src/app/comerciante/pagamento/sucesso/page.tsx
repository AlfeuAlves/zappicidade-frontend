'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { CheckCircle2, Crown, ArrowRight, Loader2 } from 'lucide-react'

export default function PagamentoSucessoPage() {
  const router = useRouter()
  const [verificando, setVerificando] = useState(true)
  const [ativo, setAtivo] = useState(false)
  const [tentativas, setTentativas] = useState(0)

  // Tenta verificar até 10x se a assinatura foi ativada
  // Chama /verificar que consulta o Asaas diretamente e ativa se confirmado
  useEffect(() => {
    const token = localStorage.getItem('vl_token')
    const headers = { Authorization: `Bearer ${token}` }
    const base = process.env.NEXT_PUBLIC_API_URL

    const verificar = async () => {
      try {
        // Consulta Asaas e ativa se confirmado
        const r = await fetch(`${base}/pagamento/verificar`, { headers })
        const data = await r.json()
        if (data?.ativa) {
          setAtivo(true)
          setVerificando(false)
          return
        }
      } catch {}

      setTentativas(t => {
        if (t >= 9) { setVerificando(false); return t }
        return t + 1
      })
    }

    verificar()
    const interval = setInterval(verificar, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (ativo) {
      const t = setTimeout(() => router.push('/comerciante/dashboard?setup=1'), 4000)
      return () => clearTimeout(t)
    }
  }, [ativo, router])

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ background: 'white', borderRadius: 28, padding: '48px 40px', maxWidth: 480, width: '100%', textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.08)', border: '1.5px solid #E5E7EB' }}>

        <Image src="/logo_zappicidade.png" alt="ZappiCidade" width={120} height={30} style={{ objectFit: 'contain', marginBottom: 32 }} />

        {verificando ? (
          <>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <Loader2 size={32} color="#16A34A" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
            <h1 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#111827', margin: '0 0 12px' }}>
              Confirmando pagamento...
            </h1>
            <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6, margin: 0 }}>
              Aguarde enquanto confirmamos seu pagamento com o Asaas. Isso pode levar alguns segundos.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 24 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#16A34A', opacity: 0.3 + i * 0.35, animation: `pulse 1.2s ease-in-out ${i * 0.4}s infinite` }} />
              ))}
            </div>
            {tentativas >= 9 && (
              <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 20 }}>
                O pagamento pode demorar alguns minutos para ser confirmado.{' '}
                <button onClick={() => router.push('/comerciante/dashboard')} style={{ color: '#16A34A', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}>
                  Ir para o painel
                </button>
              </p>
            )}
          </>
        ) : ativo ? (
          <>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #16A34A, #15803D)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 8px 24px rgba(22,163,74,0.35)' }}>
              <CheckCircle2 size={36} color="white" />
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#DCFCE7', borderRadius: 999, padding: '4px 14px', marginBottom: 16 }}>
              <Crown size={13} color="#16A34A" />
              <span style={{ fontSize: 11, fontWeight: 800, color: '#16A34A', fontFamily: 'Poppins, sans-serif', letterSpacing: '0.06em' }}>PLANO PRO ATIVO</span>
            </div>
            <h1 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: '#111827', margin: '0 0 12px' }}>
              Pagamento confirmado!
            </h1>
            <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6, margin: '0 0 28px' }}>
              Sua conta PRO está ativa. Você será redirecionado para o painel em instantes.
            </p>
            <button
              onClick={() => router.push('/comerciante/dashboard?setup=1')}
              style={{ background: 'linear-gradient(135deg, #16A34A, #15803D)', color: 'white', border: 'none', borderRadius: 14, padding: '14px 28px', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 16px rgba(22,163,74,0.35)' }}
            >
              Ir para o painel <ArrowRight size={16} />
            </button>
          </>
        ) : (
          <>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <Crown size={32} color="#D97706" />
            </div>
            <h1 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#111827', margin: '0 0 12px' }}>
              Pagamento em processamento
            </h1>
            <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6, margin: '0 0 24px' }}>
              Seu pagamento foi recebido e está sendo processado. Você receberá uma confirmação em breve e seu plano PRO será ativado automaticamente.
            </p>
            <button
              onClick={() => router.push('/comerciante/dashboard')}
              style={{ background: '#16A34A', color: 'white', border: 'none', borderRadius: 14, padding: '13px 24px', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              Ir para o painel <ArrowRight size={16} />
            </button>
          </>
        )}

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes pulse { 0%, 100% { opacity: 0.3; transform: scale(1) } 50% { opacity: 1; transform: scale(1.2) } }
      `}</style>
    </div>
  )
}
