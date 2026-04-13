'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Users, MessageCircle, Clock, Search, RefreshCw, LogOut, ChevronLeft, ChevronRight } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface Usuario {
  id: string
  whatsapp: string
  nome: string | null
  bairro: string | null
  total_interacoes: number
  primeira_interacao: string
  ultima_interacao: string
  ativo: boolean
  bloqueado: boolean
}

function adminFetch(path: string) {
  const token = localStorage.getItem('admin_token') || ''
  return fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
}

function formatarData(iso: string) {
  const d = new Date(iso)
  const agora = new Date()
  const diff = Math.floor((agora.getTime() - d.getTime()) / 1000)
  if (diff < 60)    return 'agora mesmo'
  if (diff < 3600)  return `há ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`
  if (diff < 604800) return `há ${Math.floor(diff / 86400)} dias`
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function formatarTelefone(w: string) {
  const n = w.replace(/\D/g, '')
  if (n.length === 13) return `+${n.slice(0,2)} (${n.slice(2,4)}) ${n.slice(4,9)}-${n.slice(9)}`
  return w
}

const LIMIT = 50

export default function AdminUsuariosPage() {
  const router = useRouter()
  const [usuarios, setUsuarios]   = useState<Usuario[]>([])
  const [total, setTotal]         = useState(0)
  const [pagina, setPagina]       = useState(1)
  const [busca, setBusca]         = useState('')
  const [loading, setLoading]     = useState(true)
  const [token, setToken]         = useState('')

  useEffect(() => {
    const t = localStorage.getItem('admin_token')
    if (!t) { router.push('/admin/login'); return }
    setToken(t)
  }, [router])

  const carregar = useCallback(async (p: number, q: string) => {
    setLoading(true)
    const qs = new URLSearchParams({ page: String(p), limit: String(LIMIT) })
    if (q) qs.set('busca', q)
    const r = await adminFetch(`/admin/usuarios?${qs}`)
    if (r.status === 401) { router.push('/admin/login'); return }
    const data = await r.json()
    setUsuarios(data.data || [])
    setTotal(data.total || 0)
    setLoading(false)
  }, [router])

  useEffect(() => {
    if (!token) return
    const timer = setTimeout(() => { setPagina(1); carregar(1, busca) }, busca ? 400 : 0)
    return () => clearTimeout(timer)
  }, [busca, token, carregar])

  useEffect(() => {
    if (!token) return
    carregar(pagina, busca)
  }, [pagina, token, carregar])

  const totalPaginas = Math.ceil(total / LIMIT)

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #E5E7EB', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={() => router.push('/admin/dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: 14 }}>
          <ArrowLeft size={16} /> Dashboard
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '1.2rem', color: '#111827', margin: 0 }}>
            Usuários do Bot
          </h1>
          <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF' }}>
            Pessoas que interagiram com o Zappi pelo WhatsApp
          </p>
        </div>
        <button onClick={() => { localStorage.removeItem('admin_token'); router.push('/admin/login') }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: 13 }}>
          <LogOut size={15} /> Sair
        </button>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 16px' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { icon: <Users size={20} color="#3B82F6" />, label: 'Total de usuários', valor: total, bg: '#DBEAFE', cor: '#1D4ED8' },
            { icon: <MessageCircle size={20} color="#16A34A" />, label: 'Nesta página', valor: usuarios.length, bg: '#DCFCE7', cor: '#16A34A' },
            { icon: <Clock size={20} color="#F59E0B" />, label: 'Interações registradas', valor: usuarios.reduce((s, u) => s + (u.total_interacoes || 0), 0), bg: '#FEF3C7', cor: '#B45309' },
          ].map(({ icon, label, valor, bg, cor }) => (
            <div key={label} style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
              <div>
                <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: cor, lineHeight: 1 }}>{valor.toLocaleString('pt-BR')}</div>
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Busca + Refresh */}
        <div style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 16, padding: 20, marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={16} color="#9CA3AF" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text" placeholder="Buscar por número..." value={busca}
              onChange={e => setBusca(e.target.value)}
              style={{ width: '100%', padding: '10px 12px 10px 38px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = '#3B82F6'}
              onBlur={e => e.target.style.borderColor = '#E5E7EB'}
            />
          </div>
          <button onClick={() => carregar(pagina, busca)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: '#F3F4F6', border: '1.5px solid #E5E7EB', borderRadius: 10, cursor: 'pointer', fontSize: 13, color: '#374151', fontWeight: 600 }}>
            <RefreshCw size={15} /> Atualizar
          </button>
        </div>

        {/* Tabela */}
        <div style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 16, overflow: 'hidden' }}>
          {/* Cabeçalho */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '12px 20px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
            {['WhatsApp', 'Bairro', 'Interações', 'Primeira vez', 'Última vez'].map(h => (
              <span key={h} style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
            ))}
          </div>

          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#9CA3AF' }}>
              <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: 8 }} />
              <div style={{ fontSize: 14 }}>Carregando...</div>
            </div>
          ) : usuarios.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center' }}>
              <Users size={40} color="#E5E7EB" style={{ marginBottom: 12 }} />
              <p style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif', fontWeight: 600 }}>Nenhum usuário ainda</p>
              <p style={{ color: '#D1D5DB', fontSize: 13 }}>Os usuários aparecerão aqui após interagirem com o bot</p>
            </div>
          ) : (
            usuarios.map((u, i) => (
              <div key={u.id}
                style={{
                  display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                  padding: '14px 20px', alignItems: 'center',
                  borderBottom: i < usuarios.length - 1 ? '1px solid #F3F4F6' : 'none',
                  background: u.bloqueado ? '#FEF2F2' : 'white'
                }}
              >
                {/* WhatsApp */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: u.bloqueado ? '#FEE2E2' : '#DCFCE7',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 14,
                    color: u.bloqueado ? '#DC2626' : '#16A34A'
                  }}>
                    {u.nome ? u.nome[0].toUpperCase() : u.whatsapp.slice(-2)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>
                      {u.nome || formatarTelefone(u.whatsapp)}
                    </div>
                    {u.nome && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{formatarTelefone(u.whatsapp)}</div>}
                  </div>
                </div>

                {/* Bairro */}
                <span style={{ fontSize: 13, color: u.bairro ? '#374151' : '#D1D5DB' }}>
                  {u.bairro || '—'}
                </span>

                {/* Interações */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    background: u.total_interacoes >= 10 ? '#DCFCE7' : '#F3F4F6',
                    color: u.total_interacoes >= 10 ? '#16A34A' : '#6B7280',
                    fontWeight: 700, fontSize: 13, padding: '2px 10px', borderRadius: 999
                  }}>
                    {u.total_interacoes}
                  </div>
                </div>

                {/* Primeira interação */}
                <span style={{ fontSize: 12, color: '#9CA3AF' }}>
                  {new Date(u.primeira_interacao).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                </span>

                {/* Última interação */}
                <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>
                  {formatarData(u.ultima_interacao)}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Paginação */}
        {totalPaginas > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 20 }}>
            <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 14px', border: '1.5px solid #E5E7EB', borderRadius: 8, background: 'white', cursor: pagina === 1 ? 'not-allowed' : 'pointer', color: pagina === 1 ? '#D1D5DB' : '#374151', fontSize: 13, fontWeight: 600 }}>
              <ChevronLeft size={15} /> Anterior
            </button>
            <span style={{ fontSize: 13, color: '#6B7280' }}>
              Página {pagina} de {totalPaginas} · {total.toLocaleString('pt-BR')} usuários
            </span>
            <button onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 14px', border: '1.5px solid #E5E7EB', borderRadius: 8, background: 'white', cursor: pagina === totalPaginas ? 'not-allowed' : 'pointer', color: pagina === totalPaginas ? '#D1D5DB' : '#374151', fontSize: 13, fontWeight: 600 }}>
              Próxima <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
