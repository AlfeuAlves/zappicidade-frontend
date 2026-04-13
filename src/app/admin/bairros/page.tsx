'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, ChevronRight, SkipForward, CheckCircle2, LogOut } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const BAIRROS = [
  'Águas Verdes', 'Arapari', 'Aruan', 'Bacabal', 'BarboLândia',
  'Beira Rio', 'Betânia', 'Boa Vista', 'Bom Futuro', 'Burajuba',
  'Cafezal', 'Caripi', 'Centro', 'Comercial', 'Fazendinha',
  'Itupanema', 'Jardim Cabanos', 'Jardim Palmeiras', 'Laranjal',
  'Nazaré', 'Novo', 'Novo Horizonte', 'Novo Paraíso', 'Pedreira',
  'Pioneiro', 'Renascer', 'São Francisco', 'Vila do Conde',
  'Vila dos Cabanos', 'Zita Cunha',
]

interface Comercio {
  id: string
  nome: string
  endereco: string | null
  bairro: string | null
}

export default function AdminBairrosPage() {
  const router = useRouter()
  const [comercio, setComercio]     = useState<Comercio | null>(null)
  const [total, setTotal]           = useState(0)
  const [pagina, setPagina]         = useState(1)
  const [bairroSel, setBairroSel]   = useState('')
  const [salvando, setSalvando]     = useState(false)
  const [concluidos, setConcluidos] = useState(0)
  const [token, setToken]           = useState('')

  useEffect(() => {
    const t = localStorage.getItem('admin_token')
    if (!t) { router.push('/admin/login'); return }
    setToken(t)
  }, [router])

  const carregar = useCallback(async (p: number, tk: string) => {
    const res = await fetch(`${API_URL}/admin/bairros/pendentes?page=${p}&limit=1`, {
      headers: { Authorization: `Bearer ${tk}` }
    })
    if (res.status === 401) { router.push('/admin/login'); return }
    const data = await res.json()
    setComercio(data.data?.[0] || null)
    setTotal(data.total || 0)
    setBairroSel('')
  }, [router])

  useEffect(() => {
    if (token) carregar(pagina, token)
  }, [token, pagina, carregar])

  const salvar = async () => {
    if (!comercio || !bairroSel) return
    setSalvando(true)
    await fetch(`${API_URL}/admin/bairros/${comercio.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ bairro: bairroSel }),
    })
    setSalvando(false)
    setConcluidos(c => c + 1)
    carregar(pagina, token)
  }

  const pular = () => {
    setPagina(p => p + 1)
    setBairroSel('')
  }

  const progresso = total > 0 ? Math.round((concluidos / (concluidos + total)) * 100) : 100

  if (!comercio && total === 0 && token) {
    return (
      <div style={{ minHeight: '100vh', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Todos os bairros preenchidos!</h2>
          <p style={{ color: '#9CA3AF' }}>Você preencheu {concluidos} bairros nesta sessão.</p>
          <button onClick={() => router.push('/admin/dashboard')}
            style={{ marginTop: 24, background: '#16A34A', color: 'white', border: 'none', borderRadius: 12, padding: '12px 24px', cursor: 'pointer', fontWeight: 600 }}>
            Voltar ao painel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0F172A', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div style={{ width: '100%', maxWidth: 520, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={20} color="#16A34A" />
            <span style={{ color: 'white', fontWeight: 700, fontSize: 16 }}>Preencher Bairros</span>
          </div>
          <button onClick={() => router.push('/admin/dashboard')}
            style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
            <LogOut size={14} /> Sair
          </button>
        </div>

        {/* Barra de progresso */}
        <div style={{ background: '#1E293B', borderRadius: 99, height: 8, overflow: 'hidden' }}>
          <div style={{ width: `${progresso}%`, background: '#16A34A', height: '100%', borderRadius: 99, transition: 'width 0.4s ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ color: '#9CA3AF', fontSize: 12 }}>{concluidos} preenchidos nesta sessão</span>
          <span style={{ color: '#9CA3AF', fontSize: 12 }}>{total} pendentes</span>
        </div>
      </div>

      {/* Card do comércio */}
      {comercio && (
        <div style={{ width: '100%', maxWidth: 520, background: '#1E293B', borderRadius: 20, padding: 28, boxShadow: '0 24px 48px rgba(0,0,0,0.4)' }}>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ color: 'white', fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>{comercio.nome}</h2>
            {comercio.endereco && (
              <p style={{ color: '#94A3B8', fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                📍 {comercio.endereco}
              </p>
            )}
          </div>

          {/* Dropdown */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ color: '#94A3B8', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Selecione o bairro
            </label>
            <select
              value={bairroSel}
              onChange={e => setBairroSel(e.target.value)}
              style={{
                width: '100%', padding: '12px 16px',
                background: '#0F172A', border: `2px solid ${bairroSel ? '#16A34A' : '#334155'}`,
                borderRadius: 12, color: bairroSel ? 'white' : '#64748B',
                fontSize: 15, cursor: 'pointer', outline: 'none',
                transition: 'border-color 0.2s',
              }}
            >
              <option value="">-- escolha o bairro --</option>
              {BAIRROS.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Botões */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={pular}
              style={{
                flex: 1, padding: '12px 0', background: '#334155', border: 'none',
                borderRadius: 12, color: '#94A3B8', fontWeight: 600, fontSize: 14,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <SkipForward size={16} /> Pular
            </button>

            <button
              onClick={salvar}
              disabled={!bairroSel || salvando}
              style={{
                flex: 2, padding: '12px 0',
                background: bairroSel ? '#16A34A' : '#1F2937',
                border: 'none', borderRadius: 12,
                color: bairroSel ? 'white' : '#4B5563',
                fontWeight: 700, fontSize: 15, cursor: bairroSel ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'background 0.2s',
              }}
            >
              {salvando ? '...' : <><CheckCircle2 size={16} /> Salvar e próximo</>}
            </button>
          </div>
        </div>
      )}

      {/* Dica */}
      <p style={{ color: '#334155', fontSize: 12, marginTop: 20, textAlign: 'center' }}>
        Dica: use o endereço acima para identificar o bairro correto. Clique "Pular" se não souber.
      </p>
    </div>
  )
}
