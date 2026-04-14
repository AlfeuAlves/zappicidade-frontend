'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, LogOut, Plus, Save, Trash2, Edit2, CheckCircle2, XCircle, Loader2, Tag } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface Categoria {
  id: string
  nome: string
  slug: string
  icone: string
  ordem: number
  ativo: boolean
  tipo_google: string | null
}

function adminFetch(path: string, options?: RequestInit) {
  const token = localStorage.getItem('admin_token') || ''
  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(options?.headers || {}) },
  })
}

const FORM_VAZIO = { nome: '', icone: '🏪', tipo_google: '', ordem: '' }

export default function AdminCategoriasCrudPage() {
  const router = useRouter()
  const [lista, setLista]               = useState<Categoria[]>([])
  const [carregando, setCarregando]     = useState(false)
  const [editando, setEditando]         = useState<Categoria | null>(null)
  const [modo, setModo]                 = useState<'lista' | 'novo' | 'editar'>('lista')
  const [form, setForm]                 = useState(FORM_VAZIO)
  const [salvando, setSalvando]         = useState(false)
  const [salvo, setSalvo]               = useState(false)
  const [erro, setErro]                 = useState('')
  const [confirmDelete, setConfirmDelete] = useState<Categoria | null>(null)
  const [deletando, setDeletando]       = useState(false)

  const carregar = useCallback(async () => {
    setCarregando(true)
    const r = await adminFetch('/admin/categorias?todas=1')
    const d = await r.json()
    setLista(Array.isArray(d) ? d : [])
    setCarregando(false)
  }, [])

  useEffect(() => {
    const t = localStorage.getItem('admin_token')
    if (!t) { router.push('/admin/login'); return }
    carregar()
  }, [router, carregar])

  const abrirNovo = () => {
    setEditando(null)
    setForm(FORM_VAZIO)
    setErro(''); setSalvo(false)
    setModo('novo')
  }

  const abrirEditar = (cat: Categoria) => {
    setEditando(cat)
    setForm({ nome: cat.nome, icone: cat.icone || '🏪', tipo_google: cat.tipo_google || '', ordem: String(cat.ordem) })
    setErro(''); setSalvo(false)
    setModo('editar')
  }

  const salvar = async () => {
    setSalvando(true); setSalvo(false); setErro('')
    const payload = { nome: form.nome, icone: form.icone, tipo_google: form.tipo_google || null, ordem: form.ordem ? parseInt(form.ordem) : undefined }
    const url    = modo === 'novo' ? '/admin/categorias' : `/admin/categorias/${editando!.id}`
    const method = modo === 'novo' ? 'POST' : 'PUT'
    const r = await adminFetch(url, { method, body: JSON.stringify(payload) })
    const data = await r.json()
    setSalvando(false)
    if (!r.ok) { setErro(data.erro || 'Erro ao salvar'); return }
    setSalvo(true)
    await carregar()
    setTimeout(() => { setSalvo(false); setModo('lista') }, 1000)
  }

  const excluir = async () => {
    if (!confirmDelete) return
    setDeletando(true)
    const r = await adminFetch(`/admin/categorias/${confirmDelete.id}`, { method: 'DELETE' })
    const data = await r.json()
    setDeletando(false)
    if (!r.ok) { setErro(data.erro || 'Erro ao excluir'); setConfirmDelete(null); return }
    setConfirmDelete(null)
    await carregar()
  }

  const f = (key: keyof typeof form, label: string, placeholder = '') => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      <input value={form[key]} placeholder={placeholder}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 14, color: '#111827', outline: 'none', boxSizing: 'border-box' }}
        onFocus={e => e.target.style.borderColor = '#16A34A'} onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
    </div>
  )

  // ── Formulário ────────────────────────────────────────────
  if (modo !== 'lista') return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ background: 'white', borderBottom: '1px solid #E5E7EB', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={() => setModo('lista')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: 14 }}>
          <ArrowLeft size={16} /> Categorias
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '1.2rem', color: '#111827', margin: 0 }}>
            {modo === 'novo' ? 'Nova Categoria' : `Editar: ${editando?.nome}`}
          </h1>
        </div>
        <button onClick={() => { localStorage.removeItem('admin_token'); router.push('/admin/login') }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: 13 }}>
          <LogOut size={15} /> Sair
        </button>
      </div>

      <div style={{ maxWidth: 500, margin: '0 auto', padding: '28px 16px' }}>
        <div style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 16, overflow: 'hidden' }}>

          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
              {form.icone || '🏪'}
            </div>
            <div>
              <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '1rem', color: 'white' }}>
                {form.nome || (modo === 'novo' ? 'Nova categoria' : editando?.nome)}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>
                {modo === 'novo' ? 'Preencha os dados abaixo' : `slug: ${editando?.slug}`}
              </div>
            </div>
          </div>

          <div style={{ padding: 24 }}>
            {f('nome', 'Nome da categoria', 'Ex: Padarias')}

            {/* Ícone com preview */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ícone (emoji)</label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input value={form.icone} placeholder="🏪"
                  onChange={e => setForm(f => ({ ...f, icone: e.target.value }))}
                  style={{ width: 80, padding: '10px 12px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 22, textAlign: 'center', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = '#16A34A'} onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
                <span style={{ fontSize: 13, color: '#9CA3AF' }}>Cole aqui um emoji — ex: 🍕 🏥 🏦 🛒 ✂️</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {f('ordem', 'Ordem (posição no menu)', 'Ex: 25')}
              {f('tipo_google', 'Tipo Google Places', 'Ex: pharmacy')}
            </div>

            <div style={{ padding: '10px 14px', background: '#FEF9C3', borderRadius: 10, marginBottom: 16, fontSize: 13, color: '#92400E' }}>
              💡 O <strong>Tipo Google Places</strong> é usado para importar comércios automaticamente (opcional).
            </div>

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

            <button onClick={salvar} disabled={salvando || !form.nome}
              style={{ width: '100%', padding: 14, background: salvando || !form.nome ? '#9CA3AF' : '#16A34A', color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, fontFamily: 'Poppins, sans-serif', cursor: salvando || !form.nome ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {salvando ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Salvando...</> : <><Save size={18} /> {modo === 'novo' ? 'Criar categoria' : 'Salvar alterações'}</>}
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) translateY(-50%); } }`}</style>
    </div>
  )

  // ── Lista ─────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ background: 'white', borderBottom: '1px solid #E5E7EB', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={() => router.push('/admin/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: 14 }}>
          <ArrowLeft size={16} /> Dashboard
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '1.2rem', color: '#111827', margin: 0 }}>Categorias</h1>
          <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF' }}>{lista.length} categorias cadastradas</p>
        </div>
        <button onClick={abrirNovo}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#16A34A', color: 'white', border: 'none', borderRadius: 10, padding: '9px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={16} /> Nova
        </button>
        <button onClick={() => { localStorage.removeItem('admin_token'); router.push('/admin/login') }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: 13 }}>
          <LogOut size={15} /> Sair
        </button>
      </div>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '28px 16px' }}>

        {erro && (
          <div style={{ marginBottom: 16, padding: '12px 16px', background: '#FEE2E2', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <XCircle size={16} color="#DC2626" />
            <span style={{ fontSize: 13, color: '#DC2626' }}>{erro}</span>
            <button onClick={() => setErro('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626' }}>✕</button>
          </div>
        )}

        <div style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 14, overflow: 'hidden' }}>
          {carregando && (
            <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Carregando...
            </div>
          )}

          {!carregando && lista.map((cat, i) => (
            <div key={cat.id} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px',
              borderBottom: i < lista.length - 1 ? '1px solid #F3F4F6' : 'none',
              background: cat.ativo ? 'white' : '#FAFAFA'
            }}>
              {/* Ícone */}
              <div style={{ width: 40, height: 40, borderRadius: 10, background: cat.ativo ? '#F0FDF4' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                {cat.icone || '🏪'}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: cat.ativo ? '#111827' : '#9CA3AF' }}>{cat.nome}</div>
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
                  slug: {cat.slug}
                  {cat.tipo_google && <span style={{ marginLeft: 8 }}>· Google: {cat.tipo_google}</span>}
                </div>
              </div>

              {/* Ordem */}
              <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600, flexShrink: 0 }}>#{cat.ordem}</span>

              {/* Ativo */}
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: cat.ativo ? '#DCFCE7' : '#F3F4F6', color: cat.ativo ? '#16A34A' : '#9CA3AF', flexShrink: 0 }}>
                {cat.ativo ? 'Ativa' : 'Inativa'}
              </span>

              {/* Ações */}
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button onClick={() => abrirEditar(cat)} title="Editar"
                  style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid #E5E7EB', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#F0FDF4'; (e.currentTarget as HTMLButtonElement).style.color = '#16A34A' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'white'; (e.currentTarget as HTMLButtonElement).style.color = '#6B7280' }}>
                  <Edit2 size={14} />
                </button>
                <button onClick={() => setConfirmDelete(cat)} title="Excluir"
                  style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid #E5E7EB', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#FEF2F2'; (e.currentTarget as HTMLButtonElement).style.color = '#DC2626' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'white'; (e.currentTarget as HTMLButtonElement).style.color = '#6B7280' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal exclusão */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 28, maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 12 }}>🗑️</div>
            <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: '#111827', textAlign: 'center', margin: '0 0 8px' }}>
              Excluir categoria?
            </h3>
            <p style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', margin: '0 0 24px' }}>
              <strong>{confirmDelete.icone} {confirmDelete.nome}</strong> será removida. Comércios nela ficam sem categoria.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmDelete(null)} disabled={deletando}
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

      <style>{`@keyframes spin { to { transform: rotate(360deg) translateY(-50%); } }`}</style>
    </div>
  )
}
