'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, Save, LogOut, ArrowLeft, Store,
  CheckCircle2, XCircle, Star, MapPin, Phone,
  Globe, Image, ExternalLink, Loader2
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const BAIRROS = [
  '', 'Águas Verdes', 'Arapari', 'Aruan', 'Bacabal', 'BarboLândia',
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
  slug: string
  endereco: string | null
  bairro: string | null
  telefone: string | null
  whatsapp: string | null
  status_operacional: string
  verificado: boolean
  destaque: boolean
  avaliacao: number | null
  total_avaliacoes: number
  categoria_id: string | null
  maps_url: string | null
  website: string | null
  foto_capa_url: string | null
  place_id: string | null
}

interface Categoria {
  id: string
  nome: string
  slug: string
  icone: string
}

interface ResultadoBusca {
  id: string
  nome: string
  bairro: string | null
  categorias: { nome: string; icone: string } | null
  status_operacional: string
}

function adminFetch(path: string, options?: RequestInit) {
  const token = localStorage.getItem('admin_token') || ''
  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(options?.headers || {}) },
  })
}

export default function AdminComerciosPage() {
  const router = useRouter()
  const [busca, setBusca]               = useState('')
  const [resultados, setResultados]     = useState<ResultadoBusca[]>([])
  const [buscando, setBuscando]         = useState(false)
  const [selecionado, setSelecionado]   = useState<Comercio | null>(null)
  const [categorias, setCategorias]     = useState<Categoria[]>([])
  const [form, setForm]                 = useState<Partial<Comercio>>({})
  const [salvando, setSalvando]         = useState(false)
  const [salvo, setSalvo]               = useState(false)
  const [erro, setErro]                 = useState('')
  const [pagina, setPagina]             = useState(1)
  const [totalResultados, setTotalResultados] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const LIMIT = 30

  const carregarLista = useCallback((termo: string, pag: number) => {
    setBuscando(true)
    const qs = new URLSearchParams({ limit: String(LIMIT), page: String(pag) })
    if (termo.trim()) qs.set('busca', termo.trim())
    adminFetch(`/admin/comercios?${qs}`)
      .then(r => r.json())
      .then(d => { setResultados(d.data || []); setTotalResultados(d.total || 0); setBuscando(false) })
      .catch(() => setBuscando(false))
  }, [])

  useEffect(() => {
    const t = localStorage.getItem('admin_token')
    if (!t) { router.push('/admin/login'); return }

    // Carrega categorias e lista inicial
    adminFetch('/admin/categorias')
      .then(r => r.json())
      .then(d => Array.isArray(d) && setCategorias(d))
      .catch(() => {})

    carregarLista('', 1)
  }, [router, carregarLista])

  // Busca com debounce
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setPagina(1)
      carregarLista(busca, 1)
    }, 400)
  }, [busca, carregarLista])

  const selecionar = useCallback(async (id: string) => {
    setSalvo(false)
    setErro('')
    const r = await adminFetch(`/admin/comercios/${id}`)
    if (r.status === 401) { router.push('/admin/login'); return }
    const data = await r.json()
    setSelecionado(data)
    setForm(data)
  }, [router])

  const salvar = useCallback(async () => {
    if (!selecionado) return
    setSalvando(true)
    setSalvo(false)
    setErro('')
    const r = await adminFetch(`/admin/comercios/${selecionado.id}`, {
      method: 'PUT',
      body: JSON.stringify(form),
    })
    const data = await r.json()
    setSalvando(false)
    if (!r.ok) { setErro(data.erro || 'Erro ao salvar'); return }
    setSalvo(true)
    setSelecionado({ ...selecionado, ...form } as Comercio)
    setTimeout(() => setSalvo(false), 3000)
  }, [selecionado, form])

  const campo = (key: keyof Comercio, label: string, tipo: 'text' | 'select' | 'toggle' | 'bairro' | 'status' | 'categoria' = 'text', icone?: React.ReactNode) => {
    const val = form[key]

    if (tipo === 'toggle') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #F3F4F6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {icone}
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#374151', fontWeight: 500 }}>{label}</span>
          </div>
          <button
            onClick={() => setForm(f => ({ ...f, [key]: !f[key] }))}
            style={{
              width: 44, height: 24, borderRadius: 999, border: 'none', cursor: 'pointer',
              background: val ? '#16A34A' : '#D1D5DB',
              position: 'relative', transition: 'background 0.2s'
            }}
          >
            <span style={{
              position: 'absolute', top: 2, left: val ? 22 : 2,
              width: 20, height: 20, borderRadius: '50%', background: 'white',
              transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
            }} />
          </button>
        </div>
      )
    }

    if (tipo === 'bairro') {
      return (
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
          <select
            value={(val as string) || ''}
            onChange={e => setForm(f => ({ ...f, [key]: e.target.value || null }))}
            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 14, fontFamily: 'Inter, sans-serif', background: 'white', color: '#111827', outline: 'none' }}
          >
            <option value="">— não informado —</option>
            {BAIRROS.filter(b => b).map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      )
    }

    if (tipo === 'status') {
      return (
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
          <select
            value={(val as string) || ''}
            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 14, fontFamily: 'Inter, sans-serif', background: 'white', color: '#111827', outline: 'none' }}
          >
            <option value="ativo">Ativo</option>
            <option value="fechado_permanentemente">Fechado permanentemente</option>
            <option value="temporariamente_fechado">Temporariamente fechado</option>
          </select>
        </div>
      )
    }

    if (tipo === 'categoria') {
      return (
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
          <select
            value={(val as string) || ''}
            onChange={e => setForm(f => ({ ...f, [key]: e.target.value || null }))}
            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 14, fontFamily: 'Inter, sans-serif', background: 'white', color: '#111827', outline: 'none' }}
          >
            <option value="">— sem categoria —</option>
            {categorias.map(c => <option key={c.id} value={c.id}>{c.icone} {c.nome}</option>)}
          </select>
        </div>
      )
    }

    return (
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {icone && <span style={{ marginRight: 4 }}>{icone}</span>}{label}
        </label>
        <input
          type="text"
          value={(val as string) || ''}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 14, fontFamily: 'Inter, sans-serif', color: '#111827', outline: 'none', boxSizing: 'border-box' }}
          onFocus={e => e.target.style.borderColor = '#16A34A'}
          onBlur={e => e.target.style.borderColor = '#E5E7EB'}
        />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #E5E7EB', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={() => router.push('/admin/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontFamily: 'Inter, sans-serif', fontSize: 14 }}>
          <ArrowLeft size={16} /> Dashboard
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '1.2rem', color: '#111827', margin: 0 }}>Editar Comércio</h1>
          <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF' }}>Busque qualquer comércio e edite seus dados</p>
        </div>
        <button onClick={() => { localStorage.removeItem('admin_token'); router.push('/admin/login') }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>
          <LogOut size={15} /> Sair
        </button>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '28px 16px' }}>

        {/* Busca */}
        <div style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} color="#9CA3AF" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Buscar comércio pelo nome..."
              value={busca}
              onChange={e => { setBusca(e.target.value); setSelecionado(null) }}
              style={{ width: '100%', padding: '11px 12px 11px 42px', border: '1.5px solid #E5E7EB', borderRadius: 12, fontSize: 15, fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = '#16A34A'}
              onBlur={e => e.target.style.borderColor = '#E5E7EB'}
              autoFocus
            />
            {buscando && <Loader2 size={16} color="#9CA3AF" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', animation: 'spin 1s linear infinite' }} />}
          </div>

          {/* Lista de resultados */}
          {buscando && (
            <div style={{ marginTop: 12, textAlign: 'center', color: '#9CA3AF', fontSize: 14, padding: '12px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Carregando...
            </div>
          )}

          {!buscando && resultados.length > 0 && (
            <>
              <div style={{ marginTop: 8, fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>
                {totalResultados.toLocaleString('pt-BR')} comércios · página {pagina} de {Math.ceil(totalResultados / LIMIT)}
              </div>
              <div style={{ border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
                {resultados.map((r, i) => (
                  <button key={r.id} onClick={() => selecionar(r.id)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                      padding: '11px 14px', background: selecionado?.id === r.id ? '#F0FDF4' : 'white',
                      border: 'none', borderBottom: i < resultados.length - 1 ? '1px solid #F3F4F6' : 'none',
                      cursor: 'pointer', textAlign: 'left'
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                    onMouseLeave={e => (e.currentTarget.style.background = selecionado?.id === r.id ? '#F0FDF4' : 'white')}
                  >
                    <span style={{ fontSize: 20 }}>{r.categorias?.icone || '🏪'}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>{r.nome}</div>
                      <div style={{ fontSize: 12, color: '#9CA3AF' }}>{r.categorias?.nome || '—'} · {r.bairro || 'sem bairro'}</div>
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                      background: r.status_operacional === 'ativo' ? '#DCFCE7' : '#FEE2E2',
                      color: r.status_operacional === 'ativo' ? '#16A34A' : '#DC2626'
                    }}>{r.status_operacional === 'ativo' ? 'ATIVO' : 'INATIVO'}</span>
                  </button>
                ))}
              </div>

              {/* Paginação */}
              {Math.ceil(totalResultados / LIMIT) > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12 }}>
                  <button onClick={() => { const p = Math.max(1, pagina - 1); setPagina(p); carregarLista(busca, p) }}
                    disabled={pagina === 1}
                    style={{ padding: '6px 14px', border: '1.5px solid #E5E7EB', borderRadius: 8, background: 'white', cursor: pagina === 1 ? 'not-allowed' : 'pointer', color: pagina === 1 ? '#D1D5DB' : '#374151', fontSize: 13, fontWeight: 600 }}>
                    ← Anterior
                  </button>
                  <button onClick={() => { const p = Math.min(Math.ceil(totalResultados / LIMIT), pagina + 1); setPagina(p); carregarLista(busca, p) }}
                    disabled={pagina === Math.ceil(totalResultados / LIMIT)}
                    style={{ padding: '6px 14px', border: '1.5px solid #E5E7EB', borderRadius: 8, background: 'white', cursor: pagina === Math.ceil(totalResultados / LIMIT) ? 'not-allowed' : 'pointer', color: pagina === Math.ceil(totalResultados / LIMIT) ? '#D1D5DB' : '#374151', fontSize: 13, fontWeight: 600 }}>
                    Próxima →
                  </button>
                </div>
              )}
            </>
          )}

          {!buscando && busca && resultados.length === 0 && (
            <div style={{ marginTop: 12, textAlign: 'center', color: '#9CA3AF', fontSize: 14, padding: '12px 0' }}>
              Nenhum comércio encontrado para "{busca}"
            </div>
          )}
        </div>

        {/* Formulário de edição */}
        {selecionado && (
          <div style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 16, overflow: 'hidden' }}>
            {/* Cabeçalho do comércio */}
            <div style={{ background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                <Store size={24} color="white" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: 'white' }}>{selecionado.nome}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
                  {selecionado.bairro || 'sem bairro'} · slug: {selecionado.slug}
                </div>
              </div>
              <a href={`https://www.zappicidadebarcarena.com.br/c/${selecionado.slug}`} target="_blank" rel="noreferrer"
                style={{ color: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, textDecoration: 'none' }}>
                <ExternalLink size={14} /> Ver perfil
              </a>
            </div>

            <div style={{ padding: '24px' }}>
              {/* Nome (largura total) */}
              {campo('nome', 'Nome', 'text')}

              {/* Linha: Telefone + WhatsApp */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {campo('telefone', 'Telefone', 'text')}
                {campo('whatsapp', 'WhatsApp', 'text')}
              </div>

              {/* Linha: Bairro + Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {campo('bairro',             'Bairro',  'bairro')}
                {campo('status_operacional', 'Status',  'status')}
              </div>

              {/* Endereço (largura total) */}
              {campo('endereco', 'Endereço', 'text')}

              {/* Categoria (largura total) */}
              {campo('categoria_id', 'Categoria', 'categoria')}

              {/* Linha: Maps + Website */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {campo('maps_url', 'Link Google Maps', 'text')}
                {campo('website',  'Website',          'text')}
              </div>

              {/* Foto capa (largura total) */}
              {campo('foto_capa_url', 'URL da foto de capa', 'text')}

              {/* Place ID (largura total) */}
              {campo('place_id', 'Google Place ID', 'text')}

              {/* Toggles */}
              <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 16, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {campo('verificado', 'Verificado',  'toggle', <CheckCircle2 size={16} color="#16A34A" />)}
                {campo('destaque',   'Em destaque', 'toggle', <Star size={16} color="#F59E0B" />)}
              </div>

              {/* Avaliação (somente leitura) */}
              {selecionado.avaliacao != null && (
                <div style={{ marginTop: 12, padding: '10px 14px', background: '#F9FAFB', borderRadius: 10, display: 'flex', gap: 16 }}>
                  <span style={{ fontSize: 13, color: '#6B7280' }}>⭐ {selecionado.avaliacao?.toFixed(1)} · {selecionado.total_avaliacoes} avaliações (Google — somente leitura)</span>
                </div>
              )}

              {/* Feedback */}
              {erro && (
                <div style={{ marginTop: 16, padding: '10px 14px', background: '#FEE2E2', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <XCircle size={16} color="#DC2626" />
                  <span style={{ fontSize: 13, color: '#DC2626' }}>{erro}</span>
                </div>
              )}
              {salvo && (
                <div style={{ marginTop: 16, padding: '10px 14px', background: '#DCFCE7', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={16} color="#16A34A" />
                  <span style={{ fontSize: 13, color: '#16A34A', fontWeight: 600 }}>Salvo com sucesso!</span>
                </div>
              )}

              {/* Botão salvar */}
              <button onClick={salvar} disabled={salvando}
                style={{
                  marginTop: 20, width: '100%', padding: '14px', background: salvando ? '#9CA3AF' : '#16A34A',
                  color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700,
                  fontFamily: 'Poppins, sans-serif', cursor: salvando ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}>
                {salvando ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Salvando...</> : <><Save size={18} /> Salvar alterações</>}
              </button>
            </div>
          </div>
        )}

        {!selecionado && (
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#9CA3AF' }}>
            <Store size={36} color="#E5E7EB" style={{ marginBottom: 8 }} />
            <p style={{ fontSize: 13 }}>Selecione um comércio da lista acima para editar</p>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) translateY(-50%); } }`}</style>
    </div>
  )
}
