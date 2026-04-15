'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, Save, LogOut, ArrowLeft, Store,
  CheckCircle2, XCircle, Star, MapPin, Phone,
  Globe, Image, ExternalLink, Loader2, Sparkles, Plus, Trash2,
  QrCode, Download, Copy, RefreshCw
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

type DiaSemana = 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado' | 'domingo'
interface HorarioDia { aberto: string; fechado: string }
type Horarios = Partial<Record<DiaSemana, HorarioDia>>

const DIAS: { key: DiaSemana; label: string }[] = [
  { key: 'segunda',  label: 'Segunda' },
  { key: 'terca',    label: 'Terça'   },
  { key: 'quarta',   label: 'Quarta'  },
  { key: 'quinta',   label: 'Quinta'  },
  { key: 'sexta',    label: 'Sexta'   },
  { key: 'sabado',   label: 'Sábado'  },
  { key: 'domingo',  label: 'Domingo' },
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
  horarios: Horarios | null
  funciona_24h: boolean
}

interface QRCodeData {
  id: string
  codigo: string
  url: string
  qr_image_url: string
  total_scans: number
  ultima_vez: string | null
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
  const [modo, setModo]                 = useState<'editar' | 'novo'>('editar')
  const [salvando, setSalvando]         = useState(false)
  const [salvo, setSalvo]               = useState(false)
  const [erro, setErro]                 = useState('')
  const [enriquecendo, setEnriquecendo] = useState(false)
  const [enriquecido, setEnriquecido]   = useState<string[]>([])
  const [horarios, setHorarios]         = useState<Horarios>({})
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deletando, setDeletando]       = useState(false)
  const [qrcode, setQrcode]             = useState<QRCodeData | null>(null)
  const [qrCarregado, setQrCarregado]   = useState(false)
  const [gerandoQr, setGerandoQr]       = useState(false)
  const [qrCopiado, setQrCopiado]       = useState(false)
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

  const enriquecer = useCallback(async () => {
    if (!selecionado) return
    setEnriquecendo(true)
    setEnriquecido([])
    setErro('')
    try {
      const r = await adminFetch(`/admin/comercios/${selecionado.id}/enriquecer`, { method: 'POST' })
      const data = await r.json()
      if (!r.ok) { setErro(data.erro || 'Erro ao enriquecer'); return }
      if (data.atualizados?.length > 0) {
        setEnriquecido(data.atualizados)
        // Recarrega o comércio para mostrar dados novos no form
        const r2 = await adminFetch(`/admin/comercios/${selecionado.id}`)
        const d2 = await r2.json()
        setSelecionado(d2)
        setForm(d2)
      } else {
        setEnriquecido(['nenhum'])
      }
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro desconhecido')
    } finally {
      setEnriquecendo(false)
    }
  }, [selecionado])

  const selecionar = useCallback(async (id: string) => {
    setSalvo(false)
    setErro('')
    setEnriquecido([])
    setHorarios({})
    setQrcode(null)
    setQrCarregado(false)
    const r = await adminFetch(`/admin/comercios/${id}`)
    if (r.status === 401) { router.push('/admin/login'); return }
    const data = await r.json()
    setSelecionado(data)
    setForm(data)
    setHorarios(data.horarios || {})
    // Carrega QR code existente silenciosamente
    adminFetch(`/admin/comercios/${id}/qrcode`)
      .then(r2 => r2.json())
      .then(d => { setQrcode(d.qrcode || null); setQrCarregado(true) })
      .catch(() => setQrCarregado(true))
  }, [router])

  const gerarQrCode = useCallback(async () => {
    if (!selecionado) return
    setGerandoQr(true)
    try {
      const r = await adminFetch(`/admin/comercios/${selecionado.id}/qrcode`, { method: 'POST' })
      const data = await r.json()
      if (r.ok) setQrcode(data.qrcode)
      else setErro(data.erro || 'Erro ao gerar QR Code')
    } catch {
      setErro('Erro ao gerar QR Code')
    } finally {
      setGerandoQr(false)
    }
  }, [selecionado])

  const copiarLinkQr = useCallback(() => {
    if (!qrcode) return
    navigator.clipboard.writeText(qrcode.url)
    setQrCopiado(true)
    setTimeout(() => setQrCopiado(false), 2000)
  }, [qrcode])

  const baixarQrCode = useCallback(() => {
    if (!qrcode || !selecionado) return
    const link = document.createElement('a')
    link.href = qrcode.qr_image_url
    link.download = `qrcode-${selecionado.slug || selecionado.id}.png`
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [qrcode, selecionado])

  const formRef = useRef<HTMLDivElement>(null)

  const abrirNovo = useCallback(() => {
    setSelecionado(null)
    setModo('novo')
    setSalvo(false)
    setErro('')
    setEnriquecido([])
    setHorarios({})
    setConfirmDelete(false)
    setQrcode(null)
    setQrCarregado(false)
    setForm({ status_operacional: 'ativo', verificado: false, destaque: false })
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }, [])

  const salvar = useCallback(async () => {
    setSalvando(true)
    setSalvo(false)
    setErro('')
    const payload = { ...form, horarios: Object.keys(horarios).length > 0 ? horarios : (form.horarios || null) }
    const url    = modo === 'novo' ? '/admin/comercios' : `/admin/comercios/${selecionado!.id}`
    const method = modo === 'novo' ? 'POST' : 'PUT'
    const r = await adminFetch(url, { method, body: JSON.stringify(payload) })
    const data = await r.json()
    setSalvando(false)
    if (!r.ok) { setErro(data.erro || 'Erro ao salvar'); return }
    setSalvo(true)
    if (modo === 'novo') {
      // Após criar, carrega o comércio recém-criado para edição
      await selecionar(data.data.id)
      setModo('editar')
      carregarLista(busca, pagina)
    } else {
      setSelecionado({ ...selecionado!, ...form } as Comercio)
      carregarLista(busca, pagina)
    }
    setTimeout(() => setSalvo(false), 3000)
  }, [selecionado, form, horarios, modo, busca, pagina])

  const excluir = useCallback(async () => {
    if (!selecionado) return
    setDeletando(true)
    const r = await adminFetch(`/admin/comercios/${selecionado.id}`, { method: 'DELETE' })
    setDeletando(false)
    if (!r.ok) { setErro('Erro ao excluir'); return }
    setSelecionado(null)
    setForm({})
    setHorarios({})
    setConfirmDelete(false)
    setModo('editar')
    carregarLista(busca, pagina)
  }, [selecionado, busca, pagina])

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
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '1.2rem', color: '#111827', margin: 0 }}>Comércios</h1>
          <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF' }}>Busque, edite ou cadastre comércios</p>
        </div>
        <button onClick={abrirNovo}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#16A34A', color: 'white', border: 'none', borderRadius: 10, padding: '9px 16px', fontSize: 14, fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: 'pointer' }}>
          <Plus size={16} /> Novo
        </button>
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

        {/* Formulário de edição / novo */}
        {(selecionado || modo === 'novo') && (
          <div ref={formRef} style={{ background: 'white', border: `1.5px solid ${modo === 'novo' ? '#16A34A' : '#E5E7EB'}`, borderRadius: 16, overflow: 'hidden' }}>
            {/* Cabeçalho */}
            <div style={{ background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                <Store size={24} color="white" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: 'white' }}>
                  {modo === 'novo' ? '+ Novo Comércio' : selecionado!.nome}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
                  {modo === 'novo' ? 'Preencha os dados abaixo' : `${selecionado!.bairro || 'sem bairro'} · slug: ${selecionado!.slug}`}
                </div>
              </div>
              {modo === 'editar' && selecionado && (
                <>
                  <a href={`https://www.zappicidadebarcarena.com.br/c/${selecionado.slug}`} target="_blank" rel="noreferrer"
                    style={{ color: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, textDecoration: 'none' }}>
                    <ExternalLink size={14} /> Ver perfil
                  </a>
                  <button onClick={() => setConfirmDelete(true)} title="Excluir comércio"
                    style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                    <Trash2 size={14} /> Excluir
                  </button>
                </>
              )}
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

              {/* Funciona 24h */}
              {campo('funciona_24h', 'Funciona 24 horas (ex: pousadas, hospitais)', 'toggle')}

              {/* Horários — só mostra se não for 24h */}
              {!form.funciona_24h && <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  🕐 Horários de funcionamento
                </label>
                <div style={{ border: '1.5px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
                  {DIAS.map((dia, i) => {
                    const h = horarios[dia.key]
                    const aberto = h?.aberto || ''
                    const fechado = h?.fechado || ''
                    const ativo = !!h
                    return (
                      <div key={dia.key} style={{
                        display: 'grid', gridTemplateColumns: '90px 1fr 1fr 36px',
                        alignItems: 'center', gap: 8, padding: '8px 12px',
                        background: ativo ? 'white' : '#F9FAFB',
                        borderBottom: i < DIAS.length - 1 ? '1px solid #F3F4F6' : 'none'
                      }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: ativo ? '#111827' : '#9CA3AF' }}>{dia.label}</span>
                        <input
                          type="time"
                          value={aberto}
                          placeholder="Abre"
                          onChange={e => setHorarios(h => ({ ...h, [dia.key]: { aberto: e.target.value, fechado: horarios[dia.key]?.fechado || '18:00' } }))}
                          style={{ padding: '6px 8px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 13, fontFamily: 'Inter, sans-serif', color: '#111827', outline: 'none', width: '100%' }}
                          onFocus={e => e.target.style.borderColor = '#16A34A'}
                          onBlur={e => e.target.style.borderColor = '#E5E7EB'}
                        />
                        <input
                          type="time"
                          value={fechado}
                          placeholder="Fecha"
                          onChange={e => setHorarios(h => ({ ...h, [dia.key]: { aberto: horarios[dia.key]?.aberto || '08:00', fechado: e.target.value } }))}
                          style={{ padding: '6px 8px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 13, fontFamily: 'Inter, sans-serif', color: '#111827', outline: 'none', width: '100%' }}
                          onFocus={e => e.target.style.borderColor = '#16A34A'}
                          onBlur={e => e.target.style.borderColor = '#E5E7EB'}
                        />
                        <button
                          title={ativo ? 'Remover dia' : 'Dia fechado'}
                          onClick={() => {
                            if (ativo) {
                              setHorarios(h => { const n = { ...h }; delete n[dia.key]; return n })
                            } else {
                              setHorarios(h => ({ ...h, [dia.key]: { aberto: '08:00', fechado: '18:00' } }))
                            }
                          }}
                          style={{
                            width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer',
                            background: ativo ? '#FEE2E2' : '#DCFCE7',
                            color: ativo ? '#DC2626' : '#16A34A',
                            fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}
                        >{ativo ? '✕' : '+'}</button>
                      </div>
                    )
                  })}
                </div>
                <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6, marginBottom: 0 }}>
                  Clique em + para ativar o dia, ✕ para marcar como fechado
                </p>
              </div>}

              {/* Foto capa (largura total) */}
              {campo('foto_capa_url', 'URL da foto de capa', 'text')}

              {/* Place ID + botão enriquecer */}
              {campo('place_id', 'Google Place ID', 'text')}
              <button
                onClick={enriquecer}
                disabled={enriquecendo || !form.place_id}
                style={{
                  width: '100%', marginTop: -8, marginBottom: 16,
                  padding: '10px 16px',
                  background: enriquecendo || !form.place_id ? '#F3F4F6' : 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                  color: enriquecendo || !form.place_id ? '#9CA3AF' : 'white',
                  border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600,
                  fontFamily: 'Inter, sans-serif', cursor: enriquecendo || !form.place_id ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'opacity 0.2s'
                }}
              >
                {enriquecendo
                  ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Buscando no Google...</>
                  : <><Sparkles size={16} /> Enriquecer com Google</>
                }
              </button>

              {/* Feedback enriquecimento */}
              {enriquecido.length > 0 && enriquecido[0] !== 'nenhum' && (
                <div style={{ marginBottom: 16, padding: '10px 14px', background: '#EDE9FE', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={16} color="#7C3AED" />
                  <span style={{ fontSize: 13, color: '#5B21B6', fontWeight: 600 }}>
                    Campos atualizados: {enriquecido.join(', ')}
                  </span>
                </div>
              )}
              {enriquecido.length > 0 && enriquecido[0] === 'nenhum' && (
                <div style={{ marginBottom: 16, padding: '10px 14px', background: '#FEF9C3', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={16} color="#D97706" />
                  <span style={{ fontSize: 13, color: '#92400E' }}>Google não trouxe dados novos para este comércio</span>
                </div>
              )}

              {/* Toggles */}
              <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 16, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {campo('verificado', 'Verificado',  'toggle', <CheckCircle2 size={16} color="#16A34A" />)}
                {campo('destaque',   'Em destaque', 'toggle', <Star size={16} color="#F59E0B" />)}
              </div>

              {/* Avaliação (somente leitura) */}
              {selecionado?.avaliacao != null && (
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
                {salvando ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Salvando...</> : <><Save size={18} /> {modo === 'novo' ? 'Criar comércio' : 'Salvar alterações'}</>}
              </button>

              {/* ── Seção QR Code (somente no modo editar) ──────── */}
              {modo === 'editar' && qrCarregado && (
                <div style={{ marginTop: 28, borderTop: '2px dashed #E5E7EB', paddingTop: 24 }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <QrCode size={20} color="#16A34A" />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 15, color: '#111827' }}>QR Code</p>
                      <p style={{ margin: 0, fontSize: 12, color: '#6B7280' }}>Clientes escaneiam e vão direto ao WhatsApp do Zappi</p>
                    </div>
                  </div>

                  {/* Sem QR ainda */}
                  {!qrcode && (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                      <div style={{ fontSize: 40, marginBottom: 8 }}>🔲</div>
                      <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
                        Este comércio ainda não tem QR Code.<br />
                        Gere um para colocar no balcão, cardápio ou panfleto.
                      </p>
                      <button
                        onClick={gerarQrCode}
                        disabled={gerandoQr}
                        style={{
                          padding: '12px 28px', borderRadius: 10, border: 'none', cursor: gerandoQr ? 'not-allowed' : 'pointer',
                          background: gerandoQr ? '#9CA3AF' : '#16A34A', color: 'white',
                          fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 14,
                          display: 'inline-flex', alignItems: 'center', gap: 8
                        }}
                      >
                        {gerandoQr
                          ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Gerando...</>
                          : <><QrCode size={16} /> Gerar QR Code</>
                        }
                      </button>
                    </div>
                  )}

                  {/* QR gerado */}
                  {qrcode && (
                    <div>
                      {/* Imagem QR */}
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                        <div style={{ padding: 16, background: 'white', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', border: '1px solid #E5E7EB', display: 'inline-block' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={qrcode.qr_image_url}
                            alt="QR Code"
                            width={200}
                            height={200}
                            style={{ display: 'block', borderRadius: 8 }}
                          />
                        </div>
                      </div>

                      {/* Estatísticas */}
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 16 }}>
                        <div style={{ textAlign: 'center' }}>
                          <p style={{ margin: 0, fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 28, color: '#16A34A' }}>{qrcode.total_scans}</p>
                          <p style={{ margin: 0, fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>scans totais</p>
                        </div>
                        {qrcode.ultima_vez && (
                          <div style={{ textAlign: 'center' }}>
                            <p style={{ margin: 0, fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 14, color: '#374151' }}>
                              {new Date(qrcode.ultima_vez).toLocaleDateString('pt-BR')}
                            </p>
                            <p style={{ margin: 0, fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>último scan</p>
                          </div>
                        )}
                      </div>

                      {/* URL rastreável */}
                      <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <code style={{ fontSize: 11, color: '#374151', flex: 1, wordBreak: 'break-all', fontFamily: 'monospace' }}>
                          {qrcode.url}
                        </code>
                      </div>

                      {/* Botões de ação */}
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button
                          onClick={copiarLinkQr}
                          style={{
                            flex: 1, padding: '10px', border: '1.5px solid #E5E7EB', borderRadius: 10,
                            background: qrCopiado ? '#DCFCE7' : 'white', cursor: 'pointer',
                            fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13,
                            color: qrCopiado ? '#16A34A' : '#374151',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            transition: 'all 0.2s'
                          }}
                        >
                          {qrCopiado
                            ? <><CheckCircle2 size={14} /> Copiado!</>
                            : <><Copy size={14} /> Copiar link</>
                          }
                        </button>
                        <button
                          onClick={baixarQrCode}
                          style={{
                            flex: 1, padding: '10px', border: 'none', borderRadius: 10,
                            background: 'linear-gradient(135deg, #16A34A, #15803D)', cursor: 'pointer',
                            fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13, color: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                          }}
                        >
                          <Download size={14} /> Baixar PNG
                        </button>
                      </div>

                      {/* Regenerar */}
                      <button
                        onClick={gerarQrCode}
                        disabled={gerandoQr}
                        style={{
                          marginTop: 10, width: '100%', padding: '8px', border: '1px dashed #D1D5DB',
                          borderRadius: 8, background: 'transparent', cursor: 'pointer',
                          fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#9CA3AF',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                        }}
                      >
                        <RefreshCw size={12} /> Regenerar QR Code
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal confirmação exclusão */}
        {confirmDelete && selecionado && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
            <div style={{ background: 'white', borderRadius: 16, padding: 28, maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
              <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 12 }}>🗑️</div>
              <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: '#111827', textAlign: 'center', margin: '0 0 8px' }}>
                Excluir comércio?
              </h3>
              <p style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', margin: '0 0 24px' }}>
                <strong>{selecionado.nome}</strong> será removido permanentemente. Esta ação não pode ser desfeita.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setConfirmDelete(false)} disabled={deletando}
                  style={{ flex: 1, padding: 12, border: '1.5px solid #E5E7EB', borderRadius: 10, background: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#374151' }}>
                  Cancelar
                </button>
                <button onClick={excluir} disabled={deletando}
                  style={{ flex: 1, padding: 12, border: 'none', borderRadius: 10, background: deletando ? '#9CA3AF' : '#DC2626', cursor: deletando ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {deletando ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Excluindo...</> : <><Trash2 size={15} /> Excluir</>}
                </button>
              </div>
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
