'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, Save, LogOut, ArrowLeft, UserCheck,
  CheckCircle2, XCircle, Loader2, Plus, Trash2,
  ExternalLink, Eye, EyeOff, Edit2, Store, Link2, X
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface Comerciante {
  id: string
  nome_completo: string
  email: string
  telefone: string | null
  cpf: string | null
  whatsapp: string | null
  ativo: boolean
  status_verificacao: string
  comercio_id: string | null
  criado_em: string
  ultimo_acesso: string | null
  comercios: { id: string; nome: string; slug: string } | null
}

interface ListItem {
  id: string
  nome_completo: string
  email: string
  whatsapp: string | null
  ativo: boolean
  status_verificacao: string
  criado_em: string
  comercios: { id: string; nome: string; slug: string } | null
}

function adminFetch(path: string, options?: RequestInit) {
  const token = localStorage.getItem('admin_token') || ''
  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(options?.headers || {}) },
  })
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const STATUS_LABELS: Record<string, { label: string; cor: string; bg: string }> = {
  aprovado:  { label: 'Aprovado',  cor: '#16A34A', bg: '#DCFCE7' },
  pendente:  { label: 'Pendente',  cor: '#D97706', bg: '#FEF9C3' },
  rejeitado: { label: 'Rejeitado', cor: '#DC2626', bg: '#FEE2E2' },
}

export default function AdminComerciantesPage() {
  const router = useRouter()

  // Lista
  const [busca, setBusca]           = useState('')
  const [lista, setLista]           = useState<ListItem[]>([])
  const [total, setTotal]           = useState(0)
  const [pagina, setPagina]         = useState(1)
  const [carregando, setCarregando] = useState(false)
  const LIMIT = 30
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Formulário (edição/criação)
  const [modo, setModo]             = useState<'lista' | 'editar' | 'novo'>('lista')
  const [selecionado, setSelecionado] = useState<Comerciante | null>(null)
  const [form, setForm]             = useState<Partial<Comerciante> & { senha?: string }>({})
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [salvando, setSalvando]     = useState(false)
  const [salvo, setSalvo]           = useState(false)
  const [erro, setErro]             = useState('')

  // Confirmação de exclusão
  const [confirmDelete, setConfirmDelete] = useState<ListItem | null>(null)
  const [deletando, setDeletando]   = useState(false)

  // Busca de comércio para vinculação
  const [buscaComercio, setBuscaComercio]     = useState('')
  const [resultadosCom, setResultadosCom]     = useState<{id:string;nome:string;slug:string;bairro:string|null}[]>([])
  const [buscandoCom, setBuscandoCom]         = useState(false)
  const [comercioVinculado, setComercioVinculado] = useState<{id:string;nome:string;slug:string}|null>(null)
  const buscaComRef = useRef<ReturnType<typeof setTimeout>|null>(null)

  const carregarLista = useCallback((termo: string, pag: number) => {
    setCarregando(true)
    const qs = new URLSearchParams({ status: 'todos', limit: String(LIMIT), page: String(pag) })
    if (termo.trim()) qs.set('busca', termo.trim())
    adminFetch(`/admin/comerciantes?${qs}`)
      .then(r => r.json())
      .then(d => { setLista(d.data || []); setTotal(d.total || 0); setCarregando(false) })
      .catch(() => setCarregando(false))
  }, [])

  useEffect(() => {
    const t = localStorage.getItem('admin_token')
    if (!t) { router.push('/admin/login'); return }
    carregarLista('', 1)
  }, [router, carregarLista])

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => { setPagina(1); carregarLista(busca, 1) }, 400)
  }, [busca, carregarLista])

  const abrirEdicao = useCallback(async (id: string) => {
    setErro(''); setSalvo(false); setMostrarSenha(false)
    setBuscaComercio(''); setResultadosCom([])
    const r = await adminFetch(`/admin/comerciantes/${id}`)
    if (r.status === 401) { router.push('/admin/login'); return }
    const data = await r.json()
    setSelecionado(data)
    setForm({ ...data, senha: '' })
    setComercioVinculado(data.comercios || null)
    setModo('editar')
  }, [router])

  const abrirNovo = () => {
    setSelecionado(null)
    setForm({ nome_completo: '', email: '', telefone: '', cpf: '', whatsapp: '', senha: '', ativo: true, status_verificacao: 'aprovado' })
    setErro(''); setSalvo(false); setMostrarSenha(false)
    setBuscaComercio(''); setResultadosCom([]); setComercioVinculado(null)
    setModo('novo')
  }

  const salvar = async () => {
    setSalvando(true); setSalvo(false); setErro('')
    const payload = { ...form, comercio_id: comercioVinculado?.id || null }
    if (!payload.senha) delete payload.senha

    const url  = modo === 'novo' ? '/admin/comerciantes' : `/admin/comerciantes/${selecionado!.id}`
    const meth = modo === 'novo' ? 'POST' : 'PUT'
    const r = await adminFetch(url, { method: meth, body: JSON.stringify(payload) })
    const data = await r.json()
    setSalvando(false)
    if (!r.ok) { setErro(data.erro || 'Erro ao salvar'); return }
    setSalvo(true)
    carregarLista(busca, pagina)
    setTimeout(() => { setSalvo(false); if (modo === 'novo') setModo('lista') }, 1500)
  }

  const excluir = async () => {
    if (!confirmDelete) return
    setDeletando(true)
    const r = await adminFetch(`/admin/comerciantes/${confirmDelete.id}`, { method: 'DELETE' })
    setDeletando(false)
    setConfirmDelete(null)
    if (r.ok) carregarLista(busca, pagina)
    else alert('Erro ao excluir')
  }

  const f = (key: string, label: string, tipo: 'text' | 'email' | 'password' | 'select-status' | 'toggle' = 'text', placeholder = '') => {
    const val = (form as Record<string, unknown>)[key]

    if (tipo === 'toggle') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #F3F4F6' }}>
          <span style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>{label}</span>
          <button onClick={() => setForm(f => ({ ...f, [key]: !f[key as keyof typeof f] }))}
            style={{ width: 44, height: 24, borderRadius: 999, border: 'none', cursor: 'pointer', background: val ? '#16A34A' : '#D1D5DB', position: 'relative', transition: 'background 0.2s' }}>
            <span style={{ position: 'absolute', top: 2, left: val ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
          </button>
        </div>
      )
    }

    if (tipo === 'select-status') {
      return (
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
          <select value={(val as string) || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 14, background: 'white', color: '#111827', outline: 'none' }}>
            <option value="aprovado">Aprovado</option>
            <option value="pendente">Pendente</option>
            <option value="rejeitado">Rejeitado</option>
          </select>
        </div>
      )
    }

    if (tipo === 'password') {
      return (
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
          <div style={{ position: 'relative' }}>
            <input type={mostrarSenha ? 'text' : 'password'} value={(val as string) || ''} placeholder={placeholder}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              style={{ width: '100%', padding: '10px 40px 10px 12px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 14, color: '#111827', outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = '#16A34A'} onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
            <button onClick={() => setMostrarSenha(v => !v)} type="button"
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
              {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
      )
    }

    return (
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
        <input type={tipo} value={(val as string) || ''} placeholder={placeholder}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 14, color: '#111827', outline: 'none', boxSizing: 'border-box' }}
          onFocus={e => e.target.style.borderColor = '#16A34A'} onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
      </div>
    )
  }

  // ── FORMULÁRIO (novo / editar) ────────────────────────────
  if (modo !== 'lista') {
    const titulo = modo === 'novo' ? 'Novo Comerciante' : selecionado?.nome_completo || 'Editar'
    return (
      <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ background: 'white', borderBottom: '1px solid #E5E7EB', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => setModo('lista')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: 14 }}>
            <ArrowLeft size={16} /> Comerciantes
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '1.2rem', color: '#111827', margin: 0 }}>{titulo}</h1>
            <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF' }}>{modo === 'novo' ? 'Criando novo cadastro' : 'Editando cadastro existente'}</p>
          </div>
          <button onClick={() => { localStorage.removeItem('admin_token'); router.push('/admin/login') }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: 13 }}>
            <LogOut size={15} /> Sair
          </button>
        </div>

        <div style={{ maxWidth: 600, margin: '0 auto', padding: '28px 16px' }}>
          <div style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 16, overflow: 'hidden' }}>

            {/* Header verde */}
            <div style={{ background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserCheck size={24} color="white" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '1rem', color: 'white' }}>
                  {modo === 'novo' ? 'Novo Comerciante' : selecionado?.nome_completo}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
                  {modo === 'novo' ? 'Preencha os dados abaixo' : selecionado?.email}
                </div>
              </div>
              {modo === 'editar' && selecionado?.comercios && (
                <a href={`https://www.zappicidadebarcarena.com.br/c/${selecionado.comercios.slug}`} target="_blank" rel="noreferrer"
                  style={{ color: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, textDecoration: 'none' }}>
                  <ExternalLink size={14} /> Ver perfil
                </a>
              )}
            </div>

            <div style={{ padding: 24 }}>
              {/* Dados pessoais */}
              {f('nome_completo', 'Nome completo', 'text', 'Nome do comerciante')}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {f('email', 'Email', 'email', 'email@exemplo.com')}
                {f('whatsapp', 'WhatsApp', 'text', '5591999999999')}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {f('telefone', 'Telefone', 'text', '(91) 99999-9999')}
                {f('cpf', 'CPF', 'text', '000.000.000-00')}
              </div>

              {/* Senha */}
              {f('senha', modo === 'novo' ? 'Senha' : 'Nova senha (deixe em branco para manter)', 'password',
                modo === 'novo' ? 'Senha de acesso' : 'Deixe em branco para não alterar')}

              {/* Status e ativo */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {f('status_verificacao', 'Status', 'select-status')}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Conta ativa</label>
                  <div style={{ padding: '10px 0' }}>
                    {f('ativo', 'Ativo', 'toggle')}
                  </div>
                </div>
              </div>

              {/* Comércio vinculado */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  🏪 Comércio vinculado
                </label>

                {/* Mostra comércio atual */}
                {comercioVinculado ? (
                  <div style={{ padding: '10px 14px', background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Store size={16} color="#16A34A" />
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#15803D' }}>{comercioVinculado.nome}</span>
                    <a href={`https://www.zappicidadebarcarena.com.br/c/${comercioVinculado.slug}`} target="_blank" rel="noreferrer"
                      style={{ fontSize: 12, color: '#16A34A', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <ExternalLink size={13} /> Ver
                    </a>
                    <button onClick={() => { setComercioVinculado(null); setBuscaComercio('') }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex', alignItems: 'center' }}>
                      <X size={15} />
                    </button>
                  </div>
                ) : (
                  <div style={{ padding: '10px 14px', background: '#FEF9C3', border: '1.5px solid #FDE68A', borderRadius: 10, fontSize: 13, color: '#92400E', marginBottom: 8 }}>
                    ⚠️ Nenhum comércio vinculado — busque abaixo para associar
                  </div>
                )}

                {/* Campo de busca */}
                {!comercioVinculado && (
                  <div style={{ position: 'relative', marginTop: 8 }}>
                    <Search size={15} color="#9CA3AF" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    <input
                      type="text"
                      placeholder="Buscar comércio pelo nome..."
                      value={buscaComercio}
                      onChange={e => {
                        setBuscaComercio(e.target.value)
                        if (buscaComRef.current) clearTimeout(buscaComRef.current)
                        if (!e.target.value.trim()) { setResultadosCom([]); return }
                        buscaComRef.current = setTimeout(async () => {
                          setBuscandoCom(true)
                          const r = await adminFetch(`/admin/comercios?busca=${encodeURIComponent(e.target.value)}&limit=6`)
                          const d = await r.json()
                          setResultadosCom(d.data || [])
                          setBuscandoCom(false)
                        }, 350)
                      }}
                      style={{ width: '100%', padding: '9px 12px 9px 34px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                      onFocus={e => e.target.style.borderColor = '#16A34A'}
                      onBlur={e => e.target.style.borderColor = '#E5E7EB'}
                    />
                    {buscandoCom && <Loader2 size={14} color="#9CA3AF" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', animation: 'spin 1s linear infinite' }} />}

                    {/* Resultados */}
                    {resultadosCom.length > 0 && (
                      <div style={{ border: '1.5px solid #E5E7EB', borderRadius: 10, overflow: 'hidden', marginTop: 4, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
                        {resultadosCom.map((c, i) => (
                          <button key={c.id} onClick={() => { setComercioVinculado(c); setResultadosCom([]); setBuscaComercio('') }}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'white', border: 'none', borderBottom: i < resultadosCom.length - 1 ? '1px solid #F3F4F6' : 'none', cursor: 'pointer', textAlign: 'left' }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#F0FDF4')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
                            <Store size={15} color="#16A34A" />
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{c.nome}</div>
                              {c.bairro && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{c.bairro}</div>}
                            </div>
                            <Link2 size={13} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Feedback */}
              {erro && (
                <div style={{ marginBottom: 16, padding: '10px 14px', background: '#FEE2E2', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <XCircle size={16} color="#DC2626" />
                  <span style={{ fontSize: 13, color: '#DC2626' }}>{erro}</span>
                </div>
              )}
              {salvo && (
                <div style={{ marginBottom: 16, padding: '10px 14px', background: '#DCFCE7', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={16} color="#16A34A" />
                  <span style={{ fontSize: 13, color: '#16A34A', fontWeight: 600 }}>Salvo com sucesso!</span>
                </div>
              )}

              {/* Botão salvar */}
              <button onClick={salvar} disabled={salvando}
                style={{ width: '100%', padding: 14, background: salvando ? '#9CA3AF' : '#16A34A', color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, fontFamily: 'Poppins, sans-serif', cursor: salvando ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {salvando ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Salvando...</> : <><Save size={18} /> {modo === 'novo' ? 'Criar comerciante' : 'Salvar alterações'}</>}
              </button>
            </div>
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) translateY(-50%); } }`}</style>
      </div>
    )
  }

  // ── LISTA ─────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #E5E7EB', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={() => router.push('/admin/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: 14 }}>
          <ArrowLeft size={16} /> Dashboard
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '1.2rem', color: '#111827', margin: 0 }}>Comerciantes</h1>
          <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF' }}>Gerencie os comerciantes cadastrados no sistema</p>
        </div>
        <button onClick={abrirNovo}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#16A34A', color: 'white', border: 'none', borderRadius: 10, padding: '9px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={16} /> Novo
        </button>
        <button onClick={() => { localStorage.removeItem('admin_token'); router.push('/admin/login') }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: 13 }}>
          <LogOut size={15} /> Sair
        </button>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 16px' }}>

        {/* Busca */}
        <div style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 14, padding: 16, marginBottom: 20 }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} color="#9CA3AF" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input type="text" placeholder="Buscar por nome ou email..." value={busca} onChange={e => setBusca(e.target.value)}
              style={{ width: '100%', padding: '10px 12px 10px 42px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = '#16A34A'} onBlur={e => e.target.style.borderColor = '#E5E7EB'} autoFocus />
          </div>
        </div>

        {/* Contador */}
        {!carregando && (
          <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 12 }}>
            {total.toLocaleString('pt-BR')} comerciante{total !== 1 ? 's' : ''} · página {pagina} de {Math.max(1, Math.ceil(total / LIMIT))}
          </div>
        )}

        {/* Lista */}
        <div style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 14, overflow: 'hidden' }}>
          {carregando && (
            <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Carregando...
            </div>
          )}

          {!carregando && lista.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>
              <UserCheck size={36} color="#E5E7EB" style={{ marginBottom: 8 }} />
              <p style={{ fontSize: 13 }}>Nenhum comerciante encontrado</p>
            </div>
          )}

          {!carregando && lista.map((c, i) => {
            const st = STATUS_LABELS[c.status_verificacao] || STATUS_LABELS.pendente
            return (
              <div key={c.id} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
                borderBottom: i < lista.length - 1 ? '1px solid #F3F4F6' : 'none',
                background: 'white'
              }}>
                {/* Avatar */}
                <div style={{ width: 40, height: 40, borderRadius: 10, background: c.ativo ? '#DCFCE7' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: c.ativo ? '#16A34A' : '#9CA3AF' }}>
                    {c.nome_completo?.charAt(0).toUpperCase() || '?'}
                  </span>
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.nome_completo}
                  </div>
                  <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
                    {c.email}
                    {c.comercios && <span style={{ marginLeft: 8, color: '#6B7280' }}>· 🏪 {c.comercios.nome}</span>}
                  </div>
                </div>

                {/* Status */}
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: st.bg, color: st.cor, flexShrink: 0 }}>
                  {st.label}
                </span>

                {/* Ativo */}
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: c.ativo ? '#F0FDF4' : '#F9FAFB', color: c.ativo ? '#16A34A' : '#9CA3AF', flexShrink: 0 }}>
                  {c.ativo ? 'Ativo' : 'Inativo'}
                </span>

                {/* Data */}
                <span style={{ fontSize: 11, color: '#9CA3AF', flexShrink: 0, display: 'none' }} className="hide-mobile">
                  {formatarData(c.criado_em)}
                </span>

                {/* Ações */}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => abrirEdicao(c.id)} title="Editar"
                    style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid #E5E7EB', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#F0FDF4'; (e.currentTarget as HTMLButtonElement).style.color = '#16A34A' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'white'; (e.currentTarget as HTMLButtonElement).style.color = '#6B7280' }}>
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => setConfirmDelete(c)} title="Excluir"
                    style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid #E5E7EB', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#FEF2F2'; (e.currentTarget as HTMLButtonElement).style.color = '#DC2626' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'white'; (e.currentTarget as HTMLButtonElement).style.color = '#6B7280' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Paginação */}
        {Math.ceil(total / LIMIT) > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
            <button onClick={() => { const p = Math.max(1, pagina - 1); setPagina(p); carregarLista(busca, p) }}
              disabled={pagina === 1}
              style={{ padding: '6px 14px', border: '1.5px solid #E5E7EB', borderRadius: 8, background: 'white', cursor: pagina === 1 ? 'not-allowed' : 'pointer', color: pagina === 1 ? '#D1D5DB' : '#374151', fontSize: 13, fontWeight: 600 }}>
              ← Anterior
            </button>
            <button onClick={() => { const p = Math.min(Math.ceil(total / LIMIT), pagina + 1); setPagina(p); carregarLista(busca, p) }}
              disabled={pagina === Math.ceil(total / LIMIT)}
              style={{ padding: '6px 14px', border: '1.5px solid #E5E7EB', borderRadius: 8, background: 'white', cursor: pagina === Math.ceil(total / LIMIT) ? 'not-allowed' : 'pointer', color: pagina === Math.ceil(total / LIMIT) ? '#D1D5DB' : '#374151', fontSize: 13, fontWeight: 600 }}>
              Próxima →
            </button>
          </div>
        )}
      </div>

      {/* Modal confirmação exclusão */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 28, maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 12 }}>🗑️</div>
            <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: '#111827', textAlign: 'center', margin: '0 0 8px' }}>
              Excluir comerciante?
            </h3>
            <p style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', margin: '0 0 24px' }}>
              <strong>{confirmDelete.nome_completo}</strong> será removido permanentemente. Esta ação não pode ser desfeita.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmDelete(null)} disabled={deletando}
                style={{ flex: 1, padding: '12px', border: '1.5px solid #E5E7EB', borderRadius: 10, background: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#374151' }}>
                Cancelar
              </button>
              <button onClick={excluir} disabled={deletando}
                style={{ flex: 1, padding: '12px', border: 'none', borderRadius: 10, background: deletando ? '#9CA3AF' : '#DC2626', cursor: deletando ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {deletando ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Excluindo...</> : <><Trash2 size={15} /> Excluir</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) translateY(-50%); } }`}</style>
    </div>
  )
}
