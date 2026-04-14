'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Tag, ChevronLeft, ChevronRight, Check, RefreshCw, LogOut } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface Comercio {
  id: string
  nome: string
  endereco: string
  bairro: string | null
  telefone: string | null
  maps_url: string | null
}

interface Categoria {
  id: string
  nome: string
  slug: string
  icone: string
}

function adminFetch(path: string, opts?: RequestInit) {
  const token = localStorage.getItem('admin_token') || ''
  return fetch(`${API_URL}${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(opts?.headers || {}) }
  })
}

export default function AdminCategoriasPage() {
  const router = useRouter()
  const [token, setToken]               = useState('')
  const [categorias, setCategorias]     = useState<Categoria[]>([])
  const [catSel, setCatSel]             = useState<string>('')
  const [comercio, setComercio]         = useState<Comercio | null>(null)
  const [catAtual, setCatAtual]         = useState<Categoria | null>(null)
  const [total, setTotal]               = useState(0)
  const [pagina, setPagina]             = useState(1)
  const [catNova, setCatNova]           = useState<string>('')
  const [salvando, setSalvando]         = useState(false)
  const [loading, setLoading]           = useState(false)
  const [msg, setMsg]                   = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)

  useEffect(() => {
    const t = localStorage.getItem('admin_token')
    if (!t) { router.push('/admin/login'); return }
    setToken(t)
  }, [router])

  // Carrega lista de categorias
  useEffect(() => {
    if (!token) return
    adminFetch('/admin/categorias')
      .then(r => r.json())
      .then(data => setCategorias(Array.isArray(data) ? data : []))
  }, [token])

  // Carrega comércio atual da categoria selecionada
  const carregar = useCallback(async (slug: string, p: number) => {
    if (!slug) return
    setLoading(true)
    setMsg(null)
    const r = await adminFetch(`/admin/categorias/revisar?categoria_slug=${slug}&page=${p}&limit=1`)
    if (r.status === 401) { router.push('/admin/login'); return }
    const data = await r.json()
    setComercio(data.data?.[0] || null)
    setCatAtual(data.categoria || null)
    setTotal(data.total || 0)
    setCatNova(slug) // começa com a categoria atual selecionada
    setLoading(false)
  }, [router])

  useEffect(() => {
    if (token && catSel) { setPagina(1); carregar(catSel, 1) }
  }, [catSel, token, carregar])

  useEffect(() => {
    if (token && catSel) carregar(catSel, pagina)
  }, [pagina, token, catSel, carregar])

  const salvarEProximo = async () => {
    if (!comercio || !catNova) return
    setSalvando(true)

    // Só salva se mudou
    const catNovaObj = categorias.find(c => c.slug === catNova)
    if (catNovaObj && catNovaObj.id !== (catAtual?.id || '')) {
      const r = await adminFetch(`/admin/categorias/revisar/${comercio.id}`, {
        method: 'PUT',
        body: JSON.stringify({ categoria_id: catNovaObj.id })
      })
      if (!r.ok) {
        setMsg({ tipo: 'erro', texto: 'Erro ao salvar. Tente novamente.' })
        setSalvando(false)
        return
      }
      setMsg({ tipo: 'ok', texto: `✅ Movido para ${catNovaObj.icone} ${catNovaObj.nome}` })
    } else {
      setMsg({ tipo: 'ok', texto: '✅ Mantido na categoria atual' })
    }

    setSalvando(false)
    // Avança — se era última da categoria atual, recarrega do início
    if (pagina < total) {
      setPagina(p => p + 1)
    } else {
      setPagina(1)
      carregar(catSel, 1)
    }
  }

  const pular = () => {
    setMsg(null)
    if (pagina < total) setPagina(p => p + 1)
    else { setPagina(1); carregar(catSel, 1) }
  }

  const progresso = total > 0 ? Math.round((pagina / total) * 100) : 0
  const catAtualObj = categorias.find(c => c.slug === catSel)

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
            Revisar Categorias
          </h1>
          <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF' }}>
            Verifique e corrija a categoria de cada comércio
          </p>
        </div>
        <button onClick={() => { localStorage.removeItem('admin_token'); router.push('/admin/login') }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: 13 }}>
          <LogOut size={15} /> Sair
        </button>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 16px' }}>

        {/* Seletor de categoria */}
        <div style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 16, padding: 20, marginBottom: 24 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>
            Escolha a categoria para revisar
          </label>
          <select
            value={catSel}
            onChange={e => setCatSel(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 14, color: '#111827', background: 'white', outline: 'none', cursor: 'pointer' }}
          >
            <option value="">— Selecione uma categoria —</option>
            {categorias.map(c => (
              <option key={c.slug} value={c.slug}>{c.icone} {c.nome}</option>
            ))}
          </select>
        </div>

        {/* Card principal */}
        {catSel && (
          <>
            {/* Barra de progresso */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6B7280', marginBottom: 6 }}>
                <span>{catAtualObj?.icone} {catAtualObj?.nome} — {total} comércios</span>
                <span>{pagina} / {total}</span>
              </div>
              <div style={{ height: 6, background: '#E5E7EB', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progresso}%`, background: '#16A34A', borderRadius: 999, transition: 'width 0.3s' }} />
              </div>
            </div>

            {loading ? (
              <div style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 16, padding: '48px', textAlign: 'center', color: '#9CA3AF' }}>
                <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: 8 }} />
                <div style={{ fontSize: 14 }}>Carregando...</div>
              </div>
            ) : !comercio ? (
              <div style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 16, padding: '48px', textAlign: 'center' }}>
                <Tag size={40} color="#E5E7EB" style={{ marginBottom: 12 }} />
                <p style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif', fontWeight: 600 }}>Nenhum comércio nesta categoria</p>
              </div>
            ) : (
              <div style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 16, padding: 24 }}>

                {/* Info do comércio */}
                <div style={{ marginBottom: 20 }}>
                  <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '1.25rem', color: '#111827', margin: '0 0 8px' }}>
                    {comercio.nome}
                  </h2>
                  {comercio.endereco && (
                    <p style={{ margin: '0 0 4px', fontSize: 13, color: '#6B7280' }}>📍 {comercio.endereco}</p>
                  )}
                  {comercio.bairro && (
                    <p style={{ margin: '0 0 4px', fontSize: 13, color: '#6B7280' }}>🏘️ {comercio.bairro}</p>
                  )}
                  {comercio.telefone && (
                    <p style={{ margin: '0 0 4px', fontSize: 13, color: '#6B7280' }}>📞 {comercio.telefone}</p>
                  )}
                  {comercio.maps_url && (
                    <a href={comercio.maps_url} target="_blank" rel="noreferrer"
                      style={{ fontSize: 12, color: '#16A34A', fontWeight: 600 }}>
                      🗺️ Ver no Google Maps
                    </a>
                  )}
                </div>

                {/* Seletor de categoria nova */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>
                    Categoria correta
                  </label>
                  <select
                    value={catNova}
                    onChange={e => setCatNova(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', border: `1.5px solid ${catNova !== catSel ? '#16A34A' : '#E5E7EB'}`, borderRadius: 10, fontSize: 14, color: '#111827', background: catNova !== catSel ? '#F0FDF4' : 'white', outline: 'none', cursor: 'pointer', fontWeight: catNova !== catSel ? 700 : 400 }}
                  >
                    {categorias.map(c => (
                      <option key={c.slug} value={c.slug}>{c.icone} {c.nome}</option>
                    ))}
                  </select>
                  {catNova !== catSel && (
                    <p style={{ margin: '6px 0 0', fontSize: 12, color: '#16A34A', fontWeight: 600 }}>
                      ↗️ Será movido para nova categoria
                    </p>
                  )}
                </div>

                {/* Mensagem de feedback */}
                {msg && (
                  <div style={{
                    padding: '10px 14px', borderRadius: 10, marginBottom: 16, fontSize: 13, fontWeight: 600,
                    background: msg.tipo === 'ok' ? '#F0FDF4' : '#FEF2F2',
                    color: msg.tipo === 'ok' ? '#16A34A' : '#DC2626',
                    border: `1px solid ${msg.tipo === 'ok' ? '#86EFAC' : '#FECACA'}`
                  }}>
                    {msg.texto}
                  </div>
                )}

                {/* Botões */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={pular}
                    style={{ flex: 1, padding: '11px 0', border: '1.5px solid #E5E7EB', borderRadius: 12, background: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#6B7280' }}>
                    Pular →
                  </button>
                  <button onClick={salvarEProximo} disabled={salvando}
                    style={{ flex: 2, padding: '11px 0', border: 'none', borderRadius: 12, background: salvando ? '#9CA3AF' : '#16A34A', cursor: salvando ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    {salvando
                      ? <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> Salvando...</>
                      : <><Check size={15} /> {catNova !== catSel ? 'Salvar e próximo' : 'Correto, próximo'}</>
                    }
                  </button>
                </div>

                {/* Navegação manual */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 16 }}>
                  <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', border: '1.5px solid #E5E7EB', borderRadius: 8, background: 'white', cursor: pagina === 1 ? 'not-allowed' : 'pointer', color: pagina === 1 ? '#D1D5DB' : '#374151', fontSize: 12, fontWeight: 600 }}>
                    <ChevronLeft size={14} /> Anterior
                  </button>
                  <button onClick={() => setPagina(p => Math.min(total, p + 1))} disabled={pagina === total}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', border: '1.5px solid #E5E7EB', borderRadius: 8, background: 'white', cursor: pagina === total ? 'not-allowed' : 'pointer', color: pagina === total ? '#D1D5DB' : '#374151', fontSize: 12, fontWeight: 600 }}>
                    Próximo <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
