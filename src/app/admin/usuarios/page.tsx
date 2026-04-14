'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Users, MessageCircle, Clock, Search, RefreshCw, LogOut, ChevronLeft, ChevronRight, Send, X, CheckCircle, AlertCircle } from 'lucide-react'

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

const MSG_PADRAO = `Olá! 👋 Aqui é o *Zappi*, assistente de comércios de Barcarena.

Você acessou nosso sistema recentemente e gostaríamos muito de saber sua opinião! 😊

O *ZappiCidade* está em desenvolvimento e o seu feedback é muito importante pra gente.

👉 O que você achou? Funcionou bem? O que poderia melhorar?

Pode responder aqui mesmo ou falar diretamente comigo pelo WhatsApp:
📱 *(91) 98359-4825* — Alfeu (fundador)

Obrigado pela atenção! 🙏`

export default function AdminUsuariosPage() {
  const router = useRouter()
  const [usuarios, setUsuarios]       = useState<Usuario[]>([])
  const [total, setTotal]             = useState(0)
  const [pagina, setPagina]           = useState(1)
  const [busca, setBusca]             = useState('')
  const [loading, setLoading]         = useState(true)
  const [token, setToken]             = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [mensagem, setMensagem]       = useState(MSG_PADRAO)
  const [totalInativos, setTotalInativos] = useState<number | null>(null)
  const [enviando, setEnviando]       = useState(false)
  const [resultado, setResultado]     = useState<{ enviados: number; falhas: number; total: number } | null>(null)

  useEffect(() => {
    const t = localStorage.getItem('admin_token')
    if (!t) { router.push('/admin/login'); return }
    setToken(t)
  }, [router])

  const abrirModal = async () => {
    setResultado(null)
    setModalAberto(true)
    const r = await adminFetch('/admin/reengajamento/preview')
    if (r.ok) {
      const data = await r.json()
      setTotalInativos(data.total_inativos)
    }
  }

  const enviarReengajamento = async () => {
    if (!mensagem.trim()) return
    setEnviando(true)
    setResultado(null)
    try {
      const token = localStorage.getItem('admin_token') || ''
      const r = await fetch(`${API_URL}/admin/reengajamento`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mensagem })
      })
      const data = await r.json()
      setResultado(data)
    } catch {
      setResultado({ enviados: 0, falhas: 1, total: 0 })
    }
    setEnviando(false)
  }

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={abrirModal}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#16A34A', border: 'none', cursor: 'pointer', color: 'white', fontSize: 13, fontWeight: 700, padding: '8px 16px', borderRadius: 10 }}>
            <Send size={14} /> Reengajar inativos
          </button>
          <button onClick={() => { localStorage.removeItem('admin_token'); router.push('/admin/login') }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: 13 }}>
            <LogOut size={15} /> Sair
          </button>
        </div>
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

      {/* Modal Reengajamento */}
      {modalAberto && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 520, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: 0, fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#111827' }}>
                  📨 Reengajar usuários inativos
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>
                  {totalInativos === null ? 'Calculando...' : `${totalInativos} usuário${totalInativos !== 1 ? 's' : ''} com 0 interações receberá esta mensagem`}
                </p>
              </div>
              <button onClick={() => setModalAberto(false)}
                style={{ background: '#F3F4F6', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}>
                <X size={16} />
              </button>
            </div>

            {/* Resultado */}
            {resultado && (
              <div style={{
                background: resultado.falhas === 0 ? '#F0FDF4' : '#FFF7ED',
                border: `1.5px solid ${resultado.falhas === 0 ? '#86EFAC' : '#FED7AA'}`,
                borderRadius: 12, padding: '14px 16px', marginBottom: 16,
                display: 'flex', alignItems: 'center', gap: 10
              }}>
                {resultado.falhas === 0
                  ? <CheckCircle size={20} color="#16A34A" />
                  : <AlertCircle size={20} color="#F59E0B" />
                }
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: resultado.falhas === 0 ? '#16A34A' : '#B45309' }}>
                    {resultado.enviados} mensagem{resultado.enviados !== 1 ? 's' : ''} enviada{resultado.enviados !== 1 ? 's' : ''} com sucesso!
                  </div>
                  {resultado.falhas > 0 &&
                    <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{resultado.falhas} falha(s)</div>
                  }
                </div>
              </div>
            )}

            {/* Textarea da mensagem */}
            {!resultado && (
              <>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Mensagem
                </label>
                <textarea
                  value={mensagem}
                  onChange={e => setMensagem(e.target.value)}
                  rows={10}
                  style={{
                    width: '100%', marginTop: 8, padding: '12px 14px', border: '1.5px solid #E5E7EB',
                    borderRadius: 12, fontSize: 13, fontFamily: 'Inter, sans-serif', lineHeight: 1.6,
                    resize: 'vertical', outline: 'none', boxSizing: 'border-box', color: '#111827'
                  }}
                  onFocus={e => e.target.style.borderColor = '#16A34A'}
                  onBlur={e => e.target.style.borderColor = '#E5E7EB'}
                />
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4, textAlign: 'right' }}>
                  {mensagem.length} caracteres
                </div>
              </>
            )}

            {/* Botões */}
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setModalAberto(false)}
                style={{ flex: 1, padding: '11px 0', border: '1.5px solid #E5E7EB', borderRadius: 12, background: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#6B7280' }}>
                {resultado ? 'Fechar' : 'Cancelar'}
              </button>
              {!resultado && (
                <button
                  onClick={enviarReengajamento}
                  disabled={enviando || totalInativos === 0}
                  style={{
                    flex: 2, padding: '11px 0', border: 'none', borderRadius: 12, cursor: enviando || totalInativos === 0 ? 'not-allowed' : 'pointer',
                    fontSize: 14, fontWeight: 700, color: 'white',
                    background: enviando || totalInativos === 0 ? '#9CA3AF' : '#16A34A',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                  }}>
                  {enviando
                    ? <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> Enviando...</>
                    : <><Send size={15} /> Enviar para {totalInativos ?? '...'} usuário{totalInativos !== 1 ? 's' : ''}</>
                  }
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
